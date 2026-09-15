import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../core/services/orders.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderStatus, OrderFilterParams } from '../../core/models/order.model';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';
import { ClpCurrencyPipe } from '../../shared/pipes/clp-currency.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { OrderCreateComponent } from './order-create.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    OrderStatusBadgeComponent,
    ClpCurrencyPipe,
    TimeAgoPipe,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    OrderCreateComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Gestión de Pedidos</h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administración del ciclo de vida de pedidos, estados y trazabilidad logística
          </p>
        </div>

        <div class="flex items-center gap-2">
          @if (authService.hasRole(['Admin', 'Customer'])) {
            <button
              type="button"
              (click)="openCreateModal()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Crear Pedido</span>
            </button>
          }

          <button
            type="button"
            (click)="loadOrders()"
            class="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors shadow-xs"
            title="Recargar pedidos"
          >
            <svg class="w-4 h-4" [ngClass]="{ 'animate-spin': loading() }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Search input -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Buscar por N° o Cliente</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onFilterChange()"
                placeholder="Ej. PED-2026-1001 o Distribuidora..."
                class="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Estado</label>
            <select
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="CREATED">Creado</option>
              <option value="ACCEPTED">Aceptado</option>
              <option value="IN_PREPARATION">En Preparación</option>
              <option value="DISPATCHED">Despachado</option>
              <option value="DELIVERED">Entregado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <!-- Status Quick Counts Badges -->
          <div class="sm:col-span-2 flex items-end">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 w-full text-xs">
              <button
                type="button"
                (click)="setStatusFilter('ALL')"
                class="px-2.5 py-1.5 rounded-lg font-medium transition-all"
                [ngClass]="selectedStatus === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              >
                Todos ({{ totalCount() }})
              </button>
              <button
                type="button"
                (click)="setStatusFilter('CREATED')"
                class="px-2.5 py-1.5 rounded-lg font-medium transition-all"
                [ngClass]="selectedStatus === 'CREATED' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'"
              >
                Creados
              </button>
              <button
                type="button"
                (click)="setStatusFilter('IN_PREPARATION')"
                class="px-2.5 py-1.5 rounded-lg font-medium transition-all"
                [ngClass]="selectedStatus === 'IN_PREPARATION' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'"
              >
                En Bodega
              </button>
              <button
                type="button"
                (click)="setStatusFilter('DISPATCHED')"
                class="px-2.5 py-1.5 rounded-lg font-medium transition-all"
                [ngClass]="selectedStatus === 'DISPATCHED' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'"
              >
                Despachados
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Orders List Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        @if (loading()) {
          <app-skeleton-loader type="table" [count]="6"></app-skeleton-loader>
        } @else if (orders().length === 0) {
          <app-empty-state
            title="No se encontraron pedidos"
            description="No hay pedidos registrados con los filtros seleccionados actualmente."
            [actionLabel]="authService.hasRole(['Admin', 'Customer']) ? 'Crear Primer Pedido' : undefined"
            (actionClicked)="openCreateModal()"
          ></app-empty-state>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="px-6 py-3.5">N° Pedido</th>
                  <th class="px-6 py-3.5">Cliente</th>
                  <th class="px-6 py-3.5">Estado</th>
                  <th class="px-6 py-3.5">Fecha</th>
                  <th class="px-6 py-3.5">Items</th>
                  <th class="px-6 py-3.5 text-right">Total</th>
                  <th class="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (order of orders(); track order.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors group">
                    <!-- Order Number -->
                    <td class="px-6 py-4 font-mono font-bold text-slate-900">
                      <a [routerLink]="['/orders', order.id]" class="hover:text-emerald-600 underline-offset-2 hover:underline">
                        {{ order.orderNumber }}
                      </a>
                    </td>

                    <!-- Customer -->
                    <td class="px-6 py-4">
                      <div class="font-semibold text-slate-800">{{ order.customerName }}</div>
                      <div class="text-[11px] text-slate-500 truncate max-w-xs">{{ order.customerEmail }}</div>
                    </td>

                    <!-- Status -->
                    <td class="px-6 py-4">
                      <app-order-status-badge [status]="order.status"></app-order-status-badge>
                    </td>

                    <!-- Date -->
                    <td class="px-6 py-4 text-slate-500 whitespace-nowrap">
                      <div>{{ order.createdAt | date:'dd/MM/yyyy' }}</div>
                      <div class="text-[11px] text-slate-400">{{ order.createdAt | timeAgo }}</div>
                    </td>

                    <!-- Items Count -->
                    <td class="px-6 py-4 text-slate-700">
                      <span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 font-medium">
                        {{ order.items.length }} prods
                      </span>
                    </td>

                    <!-- Total -->
                    <td class="px-6 py-4 text-right font-bold text-emerald-700">
                      {{ order.total | clpCurrency }}
                    </td>

                    <!-- Actions -->
                    <td class="px-6 py-4 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1.5">
                        <a
                          [routerLink]="['/orders', order.id]"
                          class="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium rounded-lg transition-colors"
                        >
                          Detalle
                        </a>

                        <!-- Quick Next Action Button according to Workflow -->
                        @if (getNextActionLabel(order.status); as nextAction) {
                          <button
                            type="button"
                            (click)="advanceStatus(order)"
                            class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-2xs"
                            [title]="'Avanzar a ' + nextAction.targetStatus"
                          >
                            {{ nextAction.label }}
                          </button>
                        }

                        <!-- Quick Cancel for allowed roles/statuses -->
                        @if (canCancel(order)) {
                          <button
                            type="button"
                            (click)="cancelOrder(order)"
                            class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancelar pedido"
                          >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Mostrando <span class="font-semibold text-slate-800">{{ orders().length }}</span> de
              <span class="font-semibold text-slate-800">{{ totalCount() }}</span> pedidos
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                [disabled]="currentPage() === 0"
                (click)="changePage(currentPage() - 1)"
                class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <span class="font-medium text-slate-700">Pág. {{ currentPage() + 1 }}</span>
              <button
                type="button"
                [disabled]="(currentPage() + 1) * pageSize() >= totalCount()"
                (click)="changePage(currentPage() + 1)"
                class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Modal Create Order -->
      @if (showCreateModal()) {
        <app-order-create
          (orderCreated)="onOrderCreated()"
          (closeModal)="showCreateModal.set(false)"
        ></app-order-create>
      }
    </div>
  `
})
export class OrderListComponent implements OnInit {
  private ordersService = inject(OrdersService);
  authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  orders = signal<Order[]>([]);
  totalCount = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  showCreateModal = signal(false);

  searchQuery = '';
  selectedStatus: OrderStatus | 'ALL' = 'ALL';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['new'] === 'true') {
        this.showCreateModal.set(true);
      }
    });

    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);

    const params: OrderFilterParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
      status: this.selectedStatus,
      search: this.searchQuery.trim() || undefined
    };

    this.ordersService.getOrders(params).subscribe({
      next: res => {
        this.orders.set(res.content);
        this.totalCount.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadOrders();
  }

  setStatusFilter(status: OrderStatus | 'ALL'): void {
    this.selectedStatus = status;
    this.onFilterChange();
  }

  changePage(newPage: number): void {
    this.currentPage.set(newPage);
    this.loadOrders();
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  onOrderCreated(): void {
    this.showCreateModal.set(false);
    this.notificationService.success('Pedido Creado', 'El nuevo pedido ha ingresado exitosamente al pipeline.');
    this.loadOrders();
  }

  getNextActionLabel(status: OrderStatus): { label: string; targetStatus: OrderStatus } | null {
    const role = this.authService.currentRole();
    if (role === 'Customer') return null;

    switch (status) {
      case 'CREATED':
        return { label: 'Aceptar', targetStatus: 'ACCEPTED' };
      case 'ACCEPTED':
        return { label: 'A Bodega', targetStatus: 'IN_PREPARATION' };
      case 'IN_PREPARATION':
        return { label: 'Despachar', targetStatus: 'DISPATCHED' };
      case 'DISPATCHED':
        return { label: 'Entregar', targetStatus: 'DELIVERED' };
      default:
        return null;
    }
  }

  advanceStatus(order: Order): void {
    const action = this.getNextActionLabel(order.status);
    if (!action) return;

    this.ordersService.updateOrderStatus(order.id, {
      status: action.targetStatus,
      reason: 'Avanzado desde lista de pedidos'
    }).subscribe({
      next: () => {
        this.notificationService.success('Estado Actualizado', `Pedido ${order.orderNumber} pasó a ${action.targetStatus}`);
        this.loadOrders();
      }
    });
  }

  canCancel(order: Order): boolean {
    const role = this.authService.currentRole();
    if (order.status === 'CANCELLED' || order.status === 'DELIVERED') return false;
    if (role === 'Customer') return order.status === 'CREATED';
    return true;
  }

  cancelOrder(order: Order): void {
    if (!confirm(`¿Estás seguro de cancelar el pedido ${order.orderNumber}?`)) return;

    this.ordersService.updateOrderStatus(order.id, {
      status: 'CANCELLED',
      reason: 'Cancelado por el usuario'
    }).subscribe({
      next: () => {
        this.notificationService.warning('Pedido Cancelado', `El pedido ${order.orderNumber} ha sido cancelado.`);
        this.loadOrders();
      }
    });
  }
}
