import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ title }}</span>
        <div class="w-9 h-9 rounded-lg flex items-center justify-center" [ngClass]="iconBgClass">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>
      <div class="mt-3 flex items-baseline justify-between">
        <span class="text-2xl font-bold tracking-tight text-slate-900">{{ value }}</span>
        @if (changeText) {
          <span
            class="text-xs font-semibold px-2 py-0.5 rounded-full"
            [ngClass]="isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'"
          >
            {{ changeText }}
          </span>
        }
      </div>
      @if (subtitle) {
        <p class="mt-1 text-xs text-slate-500">{{ subtitle }}</p>
      }
    </div>
  `
})
export class KpiCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input() subtitle?: string;
  @Input() changeText?: string;
  @Input() isPositive: boolean = true;
  @Input() iconBgClass: string = 'bg-emerald-50 text-emerald-600';
}
