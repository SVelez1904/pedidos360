import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto bg-white rounded-xl shadow-xl border p-4 flex items-start gap-3 transform transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
          [ngClass]="getToastBorderClass(toast.type)"
        >
          <div class="shrink-0 mt-0.5" [ngClass]="getToastIconColor(toast.type)">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              @default {
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            }
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-slate-900 leading-tight">{{ toast.title }}</h4>
            <p class="mt-1 text-xs text-slate-600 leading-relaxed break-words">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            (click)="notificationService.remove(toast.id)"
            class="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  notificationService = inject(NotificationService);

  getToastBorderClass(type: string): string {
    switch (type) {
      case 'success': return 'border-emerald-200 bg-white';
      case 'error': return 'border-rose-200 bg-white';
      case 'warning': return 'border-amber-200 bg-white';
      default: return 'border-blue-200 bg-white';
    }
  }

  getToastIconColor(type: string): string {
    switch (type) {
      case 'success': return 'text-emerald-600';
      case 'error': return 'text-rose-600';
      case 'warning': return 'text-amber-600';
      default: return 'text-blue-600';
    }
  }
}
