import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  InteractionStatus,
  InteractionType,
  RedirectRequest,
  PopupRequest
} from '@azure/msal-browser';
import { filter, Subject, takeUntil } from 'rxjs';
import { UserProfile, UserRole, AuthState } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private msalService = inject(MsalService, { optional: true });
  private msalBroadcastService = inject(MsalBroadcastService, { optional: true });
  private router = inject(Router);

  private readonly destroying$ = new Subject<void>();

  // Reactive State using Angular 18 Signals
  private state = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    idToken: null,
    isLoading: true,
    error: null
  });

  // Public Computed Signals
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly currentUser = computed(() => this.state().user);
  readonly currentRole = computed<UserRole>(() => this.state().user?.role || 'Customer');
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  constructor() {
    this.initializeAuth();
  }

  /**
   * Inicializa la escucha de eventos de MSAL o recupera sesión mock si está habilitada
   */
  private initializeAuth(): void {
    // Si MSAL está disponible en el injector
    if (this.msalService && this.msalBroadcastService) {
      this.msalBroadcastService.inProgress$
        .pipe(
          filter((status: InteractionStatus) => status === InteractionStatus.None),
          takeUntil(this.destroying$)
        )
        .subscribe(() => {
          this.checkMsalAccount();
        });
    } else {
      // Modo Mock Fallback para previsualización local
      this.restoreSavedSession();
    }
  }

  private checkMsalAccount(): void {
    if (!this.msalService) {
      this.restoreSavedSession();
      return;
    }

    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const activeAccount = accounts[0];
      this.msalService.instance.setActiveAccount(activeAccount);
      this.setAccountFromMsal(activeAccount);
    } else {
      this.restoreSavedSession();
    }
  }

  private setAccountFromMsal(account: AccountInfo): void {
    const role = this.extractRoleFromClaims(account.idTokenClaims as Record<string, unknown>);
    const profile: UserProfile = {
      id: account.localAccountId || account.homeAccountId,
      email: account.username || (account.idTokenClaims as Record<string, string>)?.['email'] || '',
      name: account.name || (account.idTokenClaims as Record<string, string>)?.['name'] || 'Usuario',
      role,
      tenantId: account.tenantId,
      claims: account.idTokenClaims as Record<string, unknown>
    };

    this.state.set({
      isAuthenticated: true,
      user: profile,
      accessToken: null, // Será adquirido bajo demanda via acquireTokenSilent
      idToken: null,
      isLoading: false,
      error: null
    });
  }

  /**
   * Centraliza la extracción del rol desde los claims del JWT de Azure AD.
   * Adaptable a las configuraciones reales de Spring Security y Entra ID:
   * 1. App Roles (`roles` claim)
   * 2. Groups (`groups` claim)
   * 3. Custom backend claims (`extension_Role`, `authorities`, `role`, `user_role`)
   */
  extractRoleFromClaims(claims?: Record<string, unknown>): UserRole {
    if (!claims) return 'Customer';

    // 1. Verificar claim estándar de roles de Azure AD App Registration
    const rolesClaim = claims['roles'] || claims['role'] || claims['authorities'];
    if (rolesClaim) {
      if (Array.isArray(rolesClaim)) {
        if (rolesClaim.some(r => String(r).toLowerCase().includes('admin'))) return 'Admin';
        if (rolesClaim.some(r => String(r).toLowerCase().includes('operator') || String(r).toLowerCase().includes('operador'))) return 'Operator';
        if (rolesClaim.some(r => String(r).toLowerCase().includes('customer') || String(r).toLowerCase().includes('cliente'))) return 'Customer';
      } else if (typeof rolesClaim === 'string') {
        const lower = rolesClaim.toLowerCase();
        if (lower.includes('admin')) return 'Admin';
        if (lower.includes('operator') || lower.includes('operador')) return 'Operator';
        if (lower.includes('customer') || lower.includes('cliente')) return 'Customer';
      }
    }

    // 2. Claim de grupos o extensión personalizada
    const extRole = claims['extension_Role'] || claims['user_role'] || claims['preferred_role'];
    if (typeof extRole === 'string') {
      const lower = extRole.toLowerCase();
      if (lower.includes('admin')) return 'Admin';
      if (lower.includes('operator')) return 'Operator';
      return 'Customer';
    }

    // Default por seguridad de privilegios mínimos
    return 'Customer';
  }

  /**
   * Inicia sesión con Microsoft Azure AD / Entra ID
   */
  async loginWithMicrosoft(): Promise<void> {
    this.state.update(s => ({ ...s, isLoading: true, error: null }));

    if (this.msalService && environment.azure.clientId !== '00000000-0000-0000-0000-000000000000') {
      try {
        const loginRequest: PopupRequest = {
          scopes: ['openid', 'profile', 'email', environment.azure.apiScope]
        };
        const result: AuthenticationResult = await this.msalService.instance.loginPopup(loginRequest);
        if (result && result.account) {
          this.msalService.instance.setActiveAccount(result.account);
          this.setAccountFromMsal(result.account);
          this.router.navigate(['/dashboard']);
        }
      } catch (err: unknown) {
        const msg = (err as Error)?.message || 'Error al autenticar con Microsoft Azure AD';
        this.state.update(s => ({ ...s, isLoading: false, error: msg }));
        // Si falla por configuración errónea en preview, permitir login demo si fallback activo
        if (environment.enableMockFallback) {
          console.warn('[MSAL] Usando fallback local para desarrollo:', msg);
          this.loginMock('Admin');
        }
      }
    } else {
      // Fallback para preview local / desarrollo
      this.loginMock('Admin');
    }
  }

  /**
   * Obtiene el token de acceso para la petición HTTP al API Gateway
   */
  async getAccessToken(): Promise<string | null> {
    if (this.msalService && this.msalService.instance.getActiveAccount()) {
      try {
        const account = this.msalService.instance.getActiveAccount()!;
        const result = await this.msalService.instance.acquireTokenSilent({
          account,
          scopes: [environment.azure.apiScope]
        });
        return result.accessToken;
      } catch (e) {
        console.error('[MSAL] Error adquiriendo token silencioso:', e);
        return null;
      }
    }

    // Si estamos en modo de desarrollo local o preview
    return this.state().accessToken || 'mock-dev-jwt-token-azure-ad';
  }

  /**
   * Valida si el usuario actual posee alguno de los roles permitidos
   */
  hasRole(allowedRoles: UserRole | UserRole[]): boolean {
    const userRole = this.currentRole();
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(userRole);
    }
    return userRole === allowedRoles;
  }

  /**
   * Cierra la sesión
   */
  logout(): void {
    if (this.msalService && this.msalService.instance.getActiveAccount()) {
      this.msalService.logoutPopup({
        postLogoutRedirectUri: environment.azure.postLogoutRedirectUri
      }).subscribe(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      });
    } else {
      this.clearSession();
      this.router.navigate(['/login']);
    }
  }

  private clearSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('pedidos360_mock_session');
    }
    this.state.set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      idToken: null,
      isLoading: false,
      error: null
    });
  }

  /**
   * Modo Mock para pruebas locales y demostración de roles
   */
  loginMock(role: UserRole = 'Admin'): void {
    const mockUsers: Record<UserRole, UserProfile> = {
      Admin: {
        id: 'usr-admin-01',
        name: 'Gonzalo Ramírez (Admin)',
        email: 'admin.pedidos@pedidos360.com',
        role: 'Admin',
        tenantId: 'azure-pedidos360-tenant',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      },
      Operator: {
        id: 'usr-op-02',
        name: 'Camila Soto (Operaciones)',
        email: 'camila.operaciones@pedidos360.com',
        role: 'Operator',
        tenantId: 'azure-pedidos360-tenant',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'
      },
      Customer: {
        id: 'usr-cust-03',
        name: 'Empresa Logix SpA (Cliente)',
        email: 'compras@logix.cl',
        role: 'Customer',
        tenantId: 'azure-pedidos360-tenant',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
      }
    };

    const user = mockUsers[role];
    const token = `mock-azure-ad-jwt-token-for-${role.toLowerCase()}`;

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pedidos360_mock_session', JSON.stringify({ user, token }));
    }

    this.state.set({
      isAuthenticated: true,
      user,
      accessToken: token,
      idToken: token,
      isLoading: false,
      error: null
    });

    this.router.navigate(['/dashboard']);
  }

  /**
   * Permite alternar roles instantáneamente en la interfaz para probar la aplicación
   */
  switchRole(newRole: UserRole): void {
    if (this.isAuthenticated()) {
      this.loginMock(newRole);
    }
  }

  private restoreSavedSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('pedidos360_mock_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.state.set({
            isAuthenticated: true,
            user: parsed.user,
            accessToken: parsed.token,
            idToken: parsed.token,
            isLoading: false,
            error: null
          });
          return;
        } catch (e) {
          // ignore
        }
      }
    }

    // Si no hay sesión guardada y estamos en fallback, iniciar como Admin para que la app se vea de inmediato
    if (environment.enableMockFallback) {
      this.loginMock('Admin');
    } else {
      this.state.set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        idToken: null,
        isLoading: false,
        error: null
      });
    }
  }
}
