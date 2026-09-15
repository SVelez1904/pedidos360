import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200/80">
      <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <ng-content select="[icon]">
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </ng-content>
      </div>
      <h3 class="text-base font-semibold text-slate-800">{{ title }}</h3>
      <p class="mt-1 text-sm text-slate-500 max-w-sm">{{ description }}</p>
      @if (actionLabel) {
        <button
          type="button"
          (click)="actionClicked.emit()"
          class="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
        >
          {{ actionLabel }}
        </button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input() actionLabel?: string;
  @Output() actionClicked = new EventEmitter<void>();
}
