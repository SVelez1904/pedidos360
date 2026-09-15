import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuditService } from '../../core/services/audit.service';
import { AuditEvent, AuditEventType, AuditFilterParams } from '../../core/models/audit.model';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TimeAgoPipe,
    SkeletonLoaderComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
              Módulo Exclusivo Admin
            </span>
            <span class="text-xs text-slate-400">|</span>
            <span class="text-xs text-slate-500">Trazabilidad Inmutable</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Registro de Auditoría de Eventos</h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            Event sourcing y registro cronológico de mutaciones de pedidos, inventario y seguridad emitidos vía Kafka / RabbitMQ
          </p>
        </div>

        <button
          type="button"
          (click)="loadAuditEvents()"
          class="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors shadow-xs"
          title="Recargar eventos"
        >
          <svg class="w-4 h-4" [ngClass]="{ 'animate-spin': loading() }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- Filter Controls -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Event Type Filter -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Tipo de Evento</label>
            <select
              [(ngModel)]="selectedEventType"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="ALL">Todos los Eventos</option>
              <option value="OrderCreated">OrderCreated (Creación de Pedido)</option>
              <option value="OrderAccepted">OrderAccepted (Aceptación Operativa)</option>
              <option value="OrderPreparing">OrderPreparing (Picking en Bodega)</option>
              <option value="OrderDispatched">OrderDispatched (Despacho / Ruta)</option>
              <option value="OrderDelivered">OrderDelivered (Entrega Exitosa)</option>
              <option value="OrderCancelled">OrderCancelled (Cancelación)</option>
              <option value="StockAdjusted">StockAdjusted (Ajuste de Stock)</option>
              <option value="ProductCreated">ProductCreated (Nuevo Producto)</option>
              <option value="ProductUpdated">ProductUpdated (Edición de Producto)</option>
            </select>
          </div>

          <!-- Search by Order Number -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Buscar por N° Pedido</label>
            <input
              type="text"
              [(ngModel)]="orderNumberQuery"
              (ngModelChange)="onFilterChange()"
              placeholder="Ej. PED-2026-1001..."
              class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <!-- Filter by User / PerformedBy -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Operador / Usuario</label>
            <input
              type="text"
              [(ngModel)]="userQuery"
              (ngModelChange)="onFilterChange()"
              placeholder="Nombre del usuario..."
              class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Events List / Audit Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        @if (loading()) {
          <app-skeleton-loader type="table" [count]="6"></app-skeleton-loader>
        } @else if (events().length === 0) {
          <app-empty-state
            title="No se encontraron eventos"
            description="No existen registros de auditoría que coincidan con los filtros aplicados."
          ></app-empty-state>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="px-6 py-3.5">Timestamp</th>
                  <th class="px-6 py-3.5">Tipo de Evento</th>
                  <th class="px-6 py-3.5">Detalle / Acción</th>
                  <th class="px-6 py-3.5">N° Pedido</th>
                  <th class="px-6 py-3.5">Ejecutado Por</th>
                  <th class="px-6 py-3.5 text-right">Microservicio</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of events(); track item.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors font-sans">
                    <!-- Timestamp -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-slate-800">{{ item.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</div>
                      <div class="text-[11px] text-slate-400">{{ item.timestamp | timeAgo }}</div>
                    </td>

                    <!-- Event Type Badge -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border font-mono"
                        [ngClass]="getEventBadgeClass(item.eventType)"
                      >
                        {{ item.eventType }}
                      </span>
                    </td>

                    <!-- Description -->
                    <td class="px-6 py-4">
                      <span class="text-slate-800 leading-relaxed">{{ item.description }}</span>
                    </td>

                    <!-- Order Link if any -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (item.orderId && item.orderNumber) {
                        <a
                          [routerLink]="['/orders', item.orderId]"
                          class="font-mono font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          {{ item.orderNumber }}
                        </a>
                      } @else {
                        <span class="text-slate-400 font-mono">--</span>
                      }
                    </td>

                    <!-- Performed By -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-semibold text-slate-800">{{ item.performedBy }}</div>
                      <div class="text-[11px] text-slate-400">Rol: {{ item.userRole || 'Sistema' }}</div>
                    </td>

                    <!-- Microservice Source -->
                    <td class="px-6 py-4 text-right whitespace-nowrap">
                      <span class="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {{ item.source }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Total Count bar -->
          <div class="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Total de eventos registrados: <span class="font-semibold text-slate-800">{{ totalElements() }}</span>
            </div>
            <span class="text-slate-400">Canal: Apache Kafka Topic &apos;pedidos360-events&apos;</span>
          </div>
        }
      </div>
    </div>
  `
})
export class AuditComponent implements OnInit {
  private auditService = inject(AuditService);

  loading = signal(true);
  events = signal<AuditEvent[]>([]);
  totalElements = signal(0);

  selectedEventType: AuditEventType | 'ALL' = 'ALL';
  orderNumberQuery = '';
  userQuery = '';

  ngOnInit(): void {
    this.loadAuditEvents();
  }

  loadAuditEvents(): void {
    this.loading.set(true);

    const filters: AuditFilterParams = {
      eventType: this.selectedEventType,
      orderNumber: this.orderNumberQuery.trim() || undefined,
      performedBy: this.userQuery.trim() || undefined,
      page: 0,
      limit: 25
    };

    this.auditService.getAuditEvents(filters).subscribe({
      next: res => {
        this.events.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange(): void {
    this.loadAuditEvents();
  }

  getEventBadgeClass(type: AuditEventType): string {
    switch (type) {
      case 'OrderCreated':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'OrderAccepted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'OrderPreparing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'OrderDispatched':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'OrderDelivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'OrderCancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'StockAdjusted':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }
}
