import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile Backdrop -->
    @if (isOpen) {
      <div
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        (click)="closeSidebar.emit()"
      ></div>
    }

    <!-- Sidebar Container -->
    <aside
      class="fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0"
      [ngClass]="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo & App Name -->
      <div class="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950">
            360
          </div>
          <div>
            <h1 class="text-base font-bold tracking-tight text-white leading-tight">Pedidos360</h1>
            <span class="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">Enterprise BPM</span>
          </div>
        </div>
        <button
          type="button"
          (click)="closeSidebar.emit()"
          class="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- User Role Indicator Pill -->
      <div class="px-4 py-3 bg-slate-950/50 border-b border-slate-800/60 flex items-center justify-between">
        <span class="text-xs text-slate-400">Rol activo:</span>
        <span
          class="text-xs font-semibold px-2 py-0.5 rounded-full"
          [ngClass]="{
            'bg-purple-500/20 text-purple-300 border border-purple-500/30': authService.currentRole() === 'Admin',
            'bg-blue-500/20 text-blue-300 border border-blue-500/30': authService.currentRole() === 'Operator',
            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30': authService.currentRole() === 'Customer'
          }"
        >
          {{ authService.currentRole() }}
        </span>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        @for (item of filteredNavItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-emerald-600 text-white font-medium shadow-xs shadow-emerald-900"
            [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
            (click)="onNavClick()"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all group"
          >
            <!-- Custom dynamic icon per route -->
            <span class="shrink-0 text-slate-400 group-hover:text-white" [innerHTML]="item.icon"></span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- System Status Footer -->
      <div class="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div class="flex items-center justify-between mb-1.5">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Microservicios</span>
          </span>
          <span class="text-[11px] font-mono text-slate-500">v18.2</span>
        </div>
        <p class="text-[11px] text-slate-500 truncate">AWS API Gateway • Entra ID</p>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  authService = inject(AuthService);

  readonly navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>',
      roles: ['Admin', 'Operator', 'Customer']
    },
    {
      path: '/orders',
      label: 'Pedidos',
      icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>',
      roles: ['Admin', 'Operator', 'Customer']
    },
    {
      path: '/catalog',
      label: 'Catálogo y Stock',
      icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>',
      roles: ['Admin', 'Operator']
    },
    {
      path: '/reports',
      label: 'Reportería & KPIs',
      icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
      roles: ['Admin']
    },
    {
      path: '/audit',
      label: 'Auditoría de Eventos',
      icon: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      roles: ['Admin']
    }
  ];

  get filteredNavItems(): NavItem[] {
    const role = this.authService.currentRole();
    return this.navItems.filter(item => item.roles.includes(role));
  }

  onNavClick(): void {
    this.closeSidebar.emit();
  }
}
