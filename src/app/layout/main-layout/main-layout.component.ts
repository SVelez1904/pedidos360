import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastContainerComponent } from '../../shared/components/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex">
      <!-- Sidebar -->
      <app-sidebar
        [isOpen]="sidebarOpen()"
        (closeSidebar)="sidebarOpen.set(false)"
      ></app-sidebar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 lg:pl-64">
        <!-- Header -->
        <app-header (toggleSidebar)="sidebarOpen.set(!sidebarOpen())"></app-header>

        <!-- Dynamic Routed Content -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Toast Notifications Container -->
      <app-toast-container></app-toast-container>
    </div>
  `
})
export class MainLayoutComponent {
  sidebarOpen = signal(false);
}
