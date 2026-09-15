import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../core/services/orders.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderStatus } from '../../core/models/order.model';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';
import { ClpCurrencyPipe } from '../../shared/pipes/clp-currency.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    OrderStatusBadgeComponent,
    ClpCurrencyPipe,
    TimeAgoPipe,
    SkeletonLoaderComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumb & Back -->
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <a routerLink="/orders" class="hover:text-emerald-600 font-medium flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver a Pedidos</span>
        </a>
        <span>/</span>
        <span class="text-slate-800 font-semibold">{{ order()?.orderNumber || 'Cargando...' }}</span>
      </div>

      @if (loading()) {
        <app-skeleton-loader type="default"></app-skeleton-loader>
      } @else {
        @if (order(); as ord) {
        <!-- Top Banner with Status and Actions -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {{ ord.orderNumber }}
              </h2>
              <app-order-status-badge [status]="ord.status"></app-order-status-badge>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Ingresado {{ ord.createdAt | date:'dd/MM/yyyy HH:mm' }} ({{ ord.createdAt | timeAgo }})
            </p>
          </div>

          <!-- Action Buttons Workflow according to Role -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Operator/Admin Workflow Transitions -->
            @if (canTransitionTo('ACCEPTED')) {
              <button
                type="button"
                (click)="updateStatus('ACCEPTED')"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Aceptar Pedido
              </button>
            }

            @if (canTransitionTo('IN_PREPARATION')) {
              <button
                type="button"
                (click)="updateStatus('IN_PREPARATION')"
                class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Enviar a Preparación
              </button>
            }

            @if (canTransitionTo('DISPATCHED')) {
              <button
                type="button"
                (click)="updateStatus('DISPATCHED')"
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Marcar como Despachado
              </button>
            }

            @if (canTransitionTo('DELIVERED')) {
              <button
                type="button"
                (click)="updateStatus('DELIVERED')"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Confirmar Entrega
              </button>
            }

            <!-- Cancel Button -->
            @if (canCancelOrder()) {
              <button
                type="button"
                (click)="openCancelModal.set(true)"
                class="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancelar Pedido
              </button>
            }
          </div>
        </div>

        <!-- Stepper Lifecycle Progress -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Línea de Trazabilidad</h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div class="p-3 rounded-xl border text-center transition-colors" [ngClass]="getStepStyle('CREATED')">
              <div class="text-[10px] font-bold uppercase">1. Creado</div>
              <div class="text-xs font-semibold mt-1">Registrado</div>
              <div class="text-[10px] text-slate-400 mt-1">{{ ord.createdAt | date:'HH:mm' }}</div>
            </div>

            <div class="p-3 rounded-xl border text-center transition-colors" [ngClass]="getStepStyle('ACCEPTED')">
              <div class="text-[10px] font-bold uppercase">2. Aceptado</div>
              <div class="text-xs font-semibold mt-1">Aprobado</div>
              <div class="text-[10px] text-slate-400 mt-1">{{ ord.updatedAt ? (ord.updatedAt | date:'HH:mm') : '--' }}</div>
            </div>

            <div class="p-3 rounded-xl border text-center transition-colors" [ngClass]="getStepStyle('IN_PREPARATION')">
              <div class="text-[10px] font-bold uppercase">3. Preparación</div>
              <div class="text-xs font-semibold mt-1">En Bodega</div>
              <div class="text-[10px] text-slate-400 mt-1">Picking/Pack</div>
            </div>

            <div class="p-3 rounded-xl border text-center transition-colors" [ngClass]="getStepStyle('DISPATCHED')">
              <div class="text-[10px] font-bold uppercase">4. Despacho</div>
              <div class="text-xs font-semibold mt-1">En Ruta</div>
              <div class="text-[10px] text-slate-400 mt-1">{{ ord.dispatchedAt ? (ord.dispatchedAt | date:'HH:mm') : '--' }}</div>
            </div>

            <div class="col-span-2 sm:col-span-1 p-3 rounded-xl border text-center transition-colors" [ngClass]="getStepStyle('DELIVERED')">
              <div class="text-[10px] font-bold uppercase">5. Entrega</div>
              <div class="text-xs font-semibold mt-1">Completado</div>
              <div class="text-[10px] text-slate-400 mt-1">{{ ord.deliveredAt ? (ord.deliveredAt | date:'HH:mm') : '--' }}</div>
            </div>
          </div>
        </div>

        <!-- 2 Column Details: Items List & Customer/Address Information -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Items Table (2 cols) -->
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="p-5 border-b border-slate-100">
              <h3 class="text-sm font-bold text-slate-900">Detalle de Productos</h3>
              <p class="text-xs text-slate-500">Líneas de pedido solicitadas</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th class="px-6 py-3.5">SKU</th>
                    <th class="px-6 py-3.5">Descripción</th>
                    <th class="px-6 py-3.5 text-right">Precio Unit.</th>
                    <th class="px-6 py-3.5 text-center">Cant.</th>
                    <th class="px-6 py-3.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of ord.items; track item.productId) {
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="px-6 py-4 font-mono font-medium text-slate-600">{{ item.sku }}</td>
                      <td class="px-6 py-4 font-semibold text-slate-800">{{ item.productName }}</td>
                      <td class="px-6 py-4 text-right text-slate-600">{{ item.unitPrice | clpCurrency }}</td>
                      <td class="px-6 py-4 text-center font-bold text-slate-800">{{ item.quantity }}</td>
                      <td class="px-6 py-4 text-right font-bold text-slate-900">{{ item.subtotal | clpCurrency }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Financial Summary Box -->
            <div class="p-6 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal Neto:</span>
                <span class="font-medium text-slate-900">{{ ord.subtotal | clpCurrency }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>IVA (19%):</span>
                <span class="font-medium text-slate-900">{{ ord.tax | clpCurrency }}</span>
              </div>
              <div class="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                <span>Total Facturado:</span>
                <span class="text-emerald-700">{{ ord.total | clpCurrency }}</span>
              </div>
            </div>
          </div>

          <!-- Customer and Shipping Meta (1 col) -->
          <div class="space-y-6">
            <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Información del Cliente</h3>
              <div class="text-xs space-y-2.5">
                <div>
                  <span class="text-slate-400 block text-[11px]">Cliente / Empresa:</span>
                  <span class="font-semibold text-slate-800">{{ ord.customerName }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">Email de Contacto:</span>
                  <span class="font-medium text-slate-700">{{ ord.customerEmail }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">ID de Cliente:</span>
                  <span class="font-mono text-slate-600">{{ ord.customerId }}</span>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Destino y Despacho</h3>
              <div class="text-xs space-y-2.5">
                <div>
                  <span class="text-slate-400 block text-[11px]">Dirección de Entrega:</span>
                  <span class="font-semibold text-slate-800 leading-relaxed">{{ ord.shippingAddress }}</span>
                </div>
                @if (ord.notes) {
                  <div>
                    <span class="text-slate-400 block text-[11px]">Instrucciones Especiales:</span>
                    <p class="text-slate-600 italic bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60 mt-1">
                      "{{ ord.notes }}"
                    </p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
        }
      }

      <!-- Cancel Confirmation Dialog Modal -->
      @if (openCancelModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 class="text-base font-bold text-slate-900">Cancelar Pedido</h3>
            <p class="text-xs text-slate-600">
              ¿Estás seguro de cancelar este pedido? Se notificará a los microservicios y no podrá reactivarse.
            </p>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Motivo de la cancelación</label>
              <textarea
                [(ngModel)]="cancelReason"
                rows="3"
                placeholder="Ej. Solicitud directa del cliente o quiebre de stock..."
                class="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              ></textarea>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="openCancelModal.set(false)"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Atrás
              </button>
              <button
                type="button"
                (click)="confirmCancelOrder()"
                class="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  order = signal<Order | null>(null);
  openCancelModal = signal(false);
  cancelReason = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    }
  }

  loadOrder(id: string): void {
    this.loading.set(true);
    this.ordersService.getOrderById(id).subscribe({
      next: ord => {
        this.order.set(ord);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error', 'No se pudo cargar el detalle del pedido.');
      }
    });
  }

  canTransitionTo(targetStatus: OrderStatus): boolean {
    const current = this.order();
    if (!current) return false;
    const allowed = this.ordersService.getAllowedNextStatuses(current.status, this.authService.currentRole());
    return allowed.includes(targetStatus);
  }

  updateStatus(newStatus: OrderStatus): void {
    const current = this.order();
    if (!current) return;

    this.ordersService.updateOrderStatus(current.id, {
      status: newStatus,
      reason: `Transición ejecutada por ${this.authService.currentUser()?.name || 'Operador'}`
    }).subscribe({
      next: updated => {
        this.order.set(updated);
        this.notificationService.success('Estado Actualizado', `El pedido ahora está en estado ${newStatus}`);
      }
    });
  }

  canCancelOrder(): boolean {
    const current = this.order();
    if (!current) return false;
    return this.ordersService.getAllowedNextStatuses(current.status, this.authService.currentRole()).includes('CANCELLED');
  }

  confirmCancelOrder(): void {
    const current = this.order();
    if (!current) return;

    this.ordersService.updateOrderStatus(current.id, {
      status: 'CANCELLED',
      reason: this.cancelReason || 'Cancelado desde interfaz de detalle'
    }).subscribe({
      next: updated => {
        this.order.set(updated);
        this.openCancelModal.set(false);
        this.notificationService.warning('Pedido Cancelado', 'El pedido ha sido marcado como cancelado.');
      }
    });
  }

  getStepStyle(step: OrderStatus): string {
    const current = this.order()?.status;
    if (!current) return 'bg-slate-50 text-slate-400 border-slate-200';

    if (current === 'CANCELLED') {
      return 'bg-rose-50 text-rose-400 border-rose-100 opacity-60';
    }

    const steps: OrderStatus[] = ['CREATED', 'ACCEPTED', 'IN_PREPARATION', 'DISPATCHED', 'DELIVERED'];
    const curIdx = steps.indexOf(current);
    const stepIdx = steps.indexOf(step);

    if (stepIdx < curIdx) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
    } else if (stepIdx === curIdx) {
      return 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs';
    } else {
      return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  }
}
