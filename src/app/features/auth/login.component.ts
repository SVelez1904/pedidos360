import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 flex flex-col justify-center items-center p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
        <!-- Accent line -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600"></div>

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl mb-4 shadow-lg shadow-emerald-600/30">
            360
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-900">Pedidos360</h2>
          <p class="mt-1 text-sm text-slate-500">Gestión Empresarial de Pedidos y Catálogo</p>
        </div>

        <!-- Mensaje de Error si ocurre durante la autenticación -->
        @if (authService.error(); as err) {
          <div class="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
            <svg class="w-4 h-4 shrink-0 mt-0.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ err }}</span>
          </div>
        }

        <!-- Botón Único de Autenticación con Microsoft Entra ID -->
        <button
          type="button"
          (click)="loginWithMicrosoft()"
          [disabled]="authService.isLoading()"
          class="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-xs disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z"/>
            <path fill="#81bc06" d="M12 1h10v10H12z"/>
            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
            <path fill="#ffba08" d="M12 12h10v10H12z"/>
          </svg>
          
          @if (authService.isLoading()) {
            <span>Iniciando sesión...</span>
          } @else {
            <span>Iniciar sesión con Microsoft</span>
          }
        </button>

        <!-- Footer Informativo de Seguridad -->
        <div class="mt-8 pt-6 border-t border-slate-100 text-center">
          <div class="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Autenticación OAuth2 / MSAL v3</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Conectado a Microsoft Entra ID & API Gateway</p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);

  async loginWithMicrosoft(): Promise<void> {
    await this.authService.loginWithMicrosoft();
  }
}