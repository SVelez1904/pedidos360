import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  InteractionStatus,
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

  // Estado reactivo con Signals (Angular 18+)
  private state = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    idToken: null,
    isLoading: false, // Inicia en false para no bloquear la interfaz
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
   * Inicializa la escucha de eventos de MSAL o valida sesión
   */
  private initializeAuth(): void {
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
      // Quita el estado de carga y permite iniciar sesión si no hay cuentas
      this.state.update(s => ({ ...s, isLoading: false }));
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
      accessToken: null,
      idToken: null,
      isLoading: false,
      error: null
    });
  }

  /**
   * Extrae el rol desde los claims del JWT de Azure AD / Entra ID
   */
  extractRoleFromClaims(claims?: Record<string, unknown>): UserRole {
    if (!claims) return 'Customer';

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

    const extRole = claims['extension_Role'] || claims['user_role'] || claims['preferred_role'];
    if (typeof extRole === 'string') {
      const lower = extRole.toLowerCase();
      if (lower.includes('admin')) return 'Admin';
      if (lower.includes('operator')) return 'Operator';
      return 'Customer';
    }

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
        
        if (environment.enableMockFallback) {
          console.warn('[MSAL] Usando fallback local para desarrollo:', msg);
          this.loginMock('Admin');
        }
      }
    } else {
      this.loginMock('Admin');
    }
  }

  /**
   * Obtiene el token de acceso para las peticiones HTTP al backend
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

    return this.state().accessToken || 'mock-dev-jwt-token-azure-ad';
  }

  hasRole(allowedRoles: UserRole | UserRole[]): boolean {
    const userRole = this.currentRole();
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(userRole);
    }
    return userRole === allowedRoles;
  }

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

    // Obliga a iniciar sesión si no hay datos guardados
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