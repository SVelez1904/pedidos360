import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      <!-- Left: Mobile Hamburger & Page Title / Breadcrumb context -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          (click)="toggleSidebar.emit()"
          class="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Abrir menú de navegación"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span class="font-semibold text-slate-900">Pedidos360</span>
          <span>/</span>
          <span class="text-slate-600">Enterprise Suite</span>
        </div>
      </div>

      <!-- Right: Role Switcher (Preview/Dev Tool), User Info & Logout -->
      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Role Switcher for previewing all perspectives -->
        @if (showRoleSwitcher) {
          <div class="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span class="px-2 text-slate-500 font-medium">Cambiar vista:</span>
            <button
              type="button"
              (click)="switchRole('Admin')"
              class="px-2.5 py-1 rounded-md font-medium transition-all"
              [ngClass]="authService.currentRole() === 'Admin' ? 'bg-white text-purple-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
            >
              Admin
            </button>
            <button
              type="button"
              (click)="switchRole('Operator')"
              class="px-2.5 py-1 rounded-md font-medium transition-all"
              [ngClass]="authService.currentRole() === 'Operator' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
            >
              Operador
            </button>
            <button
              type="button"
              (click)="switchRole('Customer')"
              class="px-2.5 py-1 rounded-md font-medium transition-all"
              [ngClass]="authService.currentRole() === 'Customer' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
            >
              Cliente
            </button>
          </div>
        }

        <!-- User Profile Avatar & Data -->
        @if (authService.currentUser(); as user) {
          <div class="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div class="relative">
              @if (user.avatarUrl) {
                <img
                  [src]="user.avatarUrl"
                  [alt]="user.name"
                  class="w-8 h-8 rounded-full object-cover border border-slate-300"
                />
              } @else {
                <div class="w-8 h-8 rounded-full bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                  {{ getInitials(user.name) }}
                </div>
              }
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>

            <div class="hidden sm:block text-left">
              <div class="text-xs font-semibold text-slate-800 leading-none truncate max-w-[140px]">{{ user.name }}</div>
              <div class="text-[11px] text-slate-500 leading-tight truncate max-w-[140px]">{{ user.email }}</div>
            </div>
          </div>
        }

        <!-- Logout Button -->
        <button
          type="button"
          (click)="logout()"
          title="Cerrar sesión"
          class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          aria-label="Cerrar sesión"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  authService = inject(AuthService);
  showRoleSwitcher = environment.enableMockFallback;

  switchRole(role: UserRole): void {
    this.authService.switchRole(role);
  }

  logout(): void {
    this.authService.logout();
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
