import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('table') {
        <div class="w-full bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <div class="h-12 bg-slate-50 px-6 flex items-center gap-4">
            <div class="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
            <div class="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
            <div class="h-4 bg-slate-200 rounded w-1/6 animate-pulse"></div>
            <div class="h-4 bg-slate-200 rounded w-1/6 animate-pulse"></div>
          </div>
          @for (i of countArray; track i) {
            <div class="h-16 px-6 flex items-center gap-4">
              <div class="h-4 bg-slate-100 rounded w-1/4 animate-pulse"></div>
              <div class="h-4 bg-slate-100 rounded w-1/4 animate-pulse"></div>
              <div class="h-4 bg-slate-100 rounded w-1/6 animate-pulse"></div>
              <div class="h-4 bg-slate-100 rounded w-1/6 animate-pulse"></div>
            </div>
          }
        </div>
      }
      @case ('cards') {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of countArray; track i) {
            <div class="bg-white p-5 rounded-xl border border-slate-200 animate-pulse space-y-3">
              <div class="h-3 bg-slate-200 rounded w-1/3"></div>
              <div class="h-8 bg-slate-200 rounded w-1/2"></div>
              <div class="h-2 bg-slate-100 rounded w-2/3"></div>
            </div>
          }
        </div>
      }
      @default {
        <div class="bg-white p-6 rounded-xl border border-slate-200 animate-pulse space-y-4">
          <div class="h-4 bg-slate-200 rounded w-1/3"></div>
          <div class="h-4 bg-slate-100 rounded w-full"></div>
          <div class="h-4 bg-slate-100 rounded w-5/6"></div>
          <div class="h-4 bg-slate-100 rounded w-2/3"></div>
        </div>
      }
    }
  `
})
export class SkeletonLoaderComponent {
  @Input() type: 'table' | 'cards' | 'default' = 'default';
  @Input() count: number = 4;

  get countArray(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
