import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from '../../core/models/order.model';
import { OrderStatusPipe } from '../pipes/order-status.pipe';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule, OrderStatusPipe],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border transition-colors whitespace-nowrap"
      [ngClass]="badgeClass"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass"></span>
      {{ status | orderStatusName }}
    </span>
  `
})
export class OrderStatusBadgeComponent {
  @Input({ required: true }) status!: OrderStatus | string;

  get badgeClass(): string {
    switch (this.status) {
      case 'CREATED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ACCEPTED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'IN_PREPARATION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DISPATCHED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  get dotClass(): string {
    switch (this.status) {
      case 'CREATED':
        return 'bg-blue-500';
      case 'ACCEPTED':
        return 'bg-indigo-500';
      case 'IN_PREPARATION':
        return 'bg-amber-500 animate-pulse';
      case 'DISPATCHED':
        return 'bg-purple-500';
      case 'DELIVERED':
        return 'bg-emerald-500';
      case 'CANCELLED':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  }
}
