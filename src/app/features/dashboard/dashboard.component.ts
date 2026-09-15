import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ReportsService } from '../../core/services/reports.service';
import { OrdersService } from '../../core/services/orders.service';
import { CatalogService } from '../../core/services/catalog.service';
import { DashboardKpis, HourlySales, OrderStatusDistribution, TopProductSales } from '../../core/models/report.model';
import { Order, OrderStatus } from '../../core/models/order.model';
import { Product } from '../../core/models/catalog.model';
import { KpiCardComponent } from '../../shared/components/kpi-card.component';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';
import { ClpCurrencyPipe } from '../../shared/pipes/clp-currency.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    KpiCardComponent,
    OrderStatusBadgeComponent,
    ClpCurrencyPipe,
    TimeAgoPipe,
    SkeletonLoaderComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Panel {{ authService.currentRole() }}
            </span>
            <span class="text-xs text-slate-400">|</span>
            <span class="text-xs text-slate-500">Actualizado hace un instante</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ¡Hola, {{ authService.currentUser()?.name || 'Usuario' }}!
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            @switch (authService.currentRole()) {
              @case ('Admin') { Monitoreo ejecutivo de KPIs, pedidos globales y distribución de catálogo. }
              @case ('Operator') { Cola de procesamiento operativo, preparación en bodega y despacho. }
              @case ('Customer') { Estado y trazabilidad en tiempo real de tus pedidos solicitados. }
            }
          </p>
        </div>

        <div class="flex items-center gap-2">
          @if (authService.currentRole() === 'Customer' || authService.currentRole() === 'Admin') {
            <a
              routerLink="/orders"
              [queryParams]="{ new: true }"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Pedido</span>
            </a>
          }
          <button
            type="button"
            (click)="loadDashboardData()"
            [disabled]="loading()"
            class="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Refrescar datos"
          >
            <svg class="w-4 h-4" [ngClass]="{ 'animate-spin': loading() }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <app-skeleton-loader type="cards" [count]="4"></app-skeleton-loader>
        <app-skeleton-loader type="table" [count]="5"></app-skeleton-loader>
      } @else {

        <!-- ============================================== -->
        <!-- 1. VISTA ADMIN                                  -->
        <!-- ============================================== -->
        @if (authService.currentRole() === 'Admin') {
          <!-- KPI Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <app-kpi-card
              title="Total Ventas"
              [value]="kpis()?.totalSales | clpCurrency"
              subtitle="Facturación acumulada"
              changeText="+14.2% vs mes anterior"
              [isPositive]="true"
              iconBgClass="bg-emerald-50 text-emerald-600"
            >
              <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </app-kpi-card>

            <app-kpi-card
              title="Total Pedidos"
              [value]="kpis()?.totalOrders || 0"
              subtitle="Transacciones procesadas"
              changeText="+8.5% esta semana"
              [isPositive]="true"
              iconBgClass="bg-blue-50 text-blue-600"
            >
              <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </app-kpi-card>

            <app-kpi-card
              title="Pedidos Activos"
              [value]="kpis()?.activeOrders || 0"
              subtitle="En preparación o tránsito"
              changeText="Flujo normal"
              [isPositive]="true"
              iconBgClass="bg-amber-50 text-amber-600"
            >
              <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </app-kpi-card>

            <app-kpi-card
              title="Lead Time Promedio"
              [value]="(kpis()?.leadTimeAverageMinutes || 0) + ' min'"
              subtitle="Creación hasta entrega final"
              changeText="-12 min de meta"
              [isPositive]="true"
              iconBgClass="bg-purple-50 text-purple-600"
            >
              <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </app-kpi-card>
          </div>

          <!-- Charts Row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Hourly Sales Visual Chart -->
            <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Ventas por Hora</h3>
                  <p class="text-xs text-slate-500">Distribución horaria del volumen de venta</p>
                </div>
                <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">Hoy</span>
              </div>

              <!-- Visual SVG Bar Chart -->
              <div class="space-y-4">
                <div class="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
                  @for (item of hourlySales(); track item.hour) {
                    <div class="flex-1 flex flex-col items-center gap-2 group">
                      <div class="relative w-full flex justify-center">
                        <!-- Tooltip -->
                        <span class="absolute -top-8 hidden group-hover:block bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 shadow-md">
                          {{ item.sales | clpCurrency }} ({{ item.ordersCount }} ped)
                        </span>
                        <!-- Bar -->
                        <div
                          class="w-full max-w-[40px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md hover:from-emerald-500 hover:to-emerald-300 transition-all cursor-pointer"
                          [style.height.px]="getBarHeight(item.sales, maxHourlySales)"
                        ></div>
                      </div>
                      <span class="text-[11px] font-medium text-slate-500">{{ item.hour }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Orders Status Distribution -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Pedidos por Estado</h3>
                <p class="text-xs text-slate-500 mb-4">Pipeline operativo del sistema</p>

                <div class="space-y-3">
                  @for (statusItem of statusDistribution(); track statusItem.status) {
                    <div>
                      <div class="flex items-center justify-between text-xs mb-1">
                        <app-order-status-badge [status]="statusItem.status"></app-order-status-badge>
                        <span class="font-semibold text-slate-700">{{ statusItem.count }} ({{ statusItem.percentage }}%)</span>
                      </div>
                      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          [ngClass]="getStatusBarColor(statusItem.status)"
                          [style.width.%]="statusItem.percentage"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Microservicio:</span>
                <span class="font-mono text-slate-700 font-medium">ms-pedidos360-report</span>
              </div>
            </div>
          </div>

          <!-- Top Products Table -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Productos Más Vendidos</h3>
                <p class="text-xs text-slate-500">Líderes de demanda en catálogo</p>
              </div>
              <a routerLink="/catalog" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                Ver Catálogo Completo &rarr;
              </a>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th class="px-6 py-3.5">SKU</th>
                    <th class="px-6 py-3.5">Producto</th>
                    <th class="px-6 py-3.5 text-right">Unidades Vendidas</th>
                    <th class="px-6 py-3.5 text-right">Ingresos Generados</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (prod of topProducts(); track prod.id) {
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="px-6 py-4 font-mono font-medium text-slate-600">{{ prod.sku }}</td>
                      <td class="px-6 py-4 font-semibold text-slate-900">{{ prod.name }}</td>
                      <td class="px-6 py-4 text-right font-medium text-slate-700">{{ prod.unitsSold }} un.</td>
                      <td class="px-6 py-4 text-right font-bold text-emerald-700">{{ prod.revenue | clpCurrency }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ============================================== -->
        <!-- 2. VISTA OPERATOR                               -->
        <!-- ============================================== -->
        @if (authService.currentRole() === 'Operator') {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-blue-50/60 border border-blue-200 rounded-xl p-5">
              <span class="text-xs font-semibold uppercase text-blue-700">1. Pendientes / Creados</span>
              <div class="text-2xl font-bold text-blue-900 mt-2">{{ countByStatus('CREATED') }}</div>
              <p class="text-xs text-blue-600 mt-1">Requieren validación de pago/stock</p>
            </div>
            <div class="bg-indigo-50/60 border border-indigo-200 rounded-xl p-5">
              <span class="text-xs font-semibold uppercase text-indigo-700">2. Aceptados</span>
              <div class="text-2xl font-bold text-indigo-900 mt-2">{{ countByStatus('ACCEPTED') }}</div>
              <p class="text-xs text-indigo-600 mt-1">Listos para iniciar picking</p>
            </div>
            <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-5">
              <span class="text-xs font-semibold uppercase text-amber-700">3. En Preparación</span>
              <div class="text-2xl font-bold text-amber-900 mt-2">{{ countByStatus('IN_PREPARATION') }}</div>
              <p class="text-xs text-amber-600 mt-1">En empaque de bodega</p>
            </div>
            <div class="bg-purple-50/60 border border-purple-200 rounded-xl p-5">
              <span class="text-xs font-semibold uppercase text-purple-700">4. Listos para Despacho</span>
              <div class="text-2xl font-bold text-purple-900 mt-2">{{ countByStatus('DISPATCHED') }}</div>
              <p class="text-xs text-purple-600 mt-1">En tránsito / camión de ruta</p>
            </div>
          </div>

          <!-- Active Orders Queue for Operator -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Cola Operativa de Pedidos</h3>
                <p class="text-xs text-slate-500">Pedidos que requieren acción inmediata en bodega o transporte</p>
              </div>
              <a routerLink="/orders" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                Ver Gestión Completa de Pedidos &rarr;
              </a>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th class="px-6 py-3.5">N° Pedido</th>
                    <th class="px-6 py-3.5">Cliente</th>
                    <th class="px-6 py-3.5">Estado</th>
                    <th class="px-6 py-3.5">Dirección de Despacho</th>
                    <th class="px-6 py-3.5">Tiempo</th>
                    <th class="px-6 py-3.5 text-right">Acción Operativa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (order of recentOrders(); track order.id) {
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="px-6 py-4 font-mono font-bold text-slate-900">{{ order.orderNumber }}</td>
                      <td class="px-6 py-4 font-medium text-slate-800">{{ order.customerName }}</td>
                      <td class="px-6 py-4">
                        <app-order-status-badge [status]="order.status"></app-order-status-badge>
                      </td>
                      <td class="px-6 py-4 text-slate-600 truncate max-w-xs">{{ order.shippingAddress }}</td>
                      <td class="px-6 py-4 text-slate-500">{{ order.createdAt | timeAgo }}</td>
                      <td class="px-6 py-4 text-right">
                        <a
                          [routerLink]="['/orders', order.id]"
                          class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                        >
                          <span>Atender</span>
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ============================================== -->
        <!-- 3. VISTA CUSTOMER                               -->
        <!-- ============================================== -->
        @if (authService.currentRole() === 'Customer') {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Customer Summary Card -->
            <div class="bg-gradient-to-br from-slate-900 to-slate-850 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between">
              <div>
                <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Tu Cuenta Corporativa</span>
                <h3 class="text-xl font-bold mt-1">{{ authService.currentUser()?.name }}</h3>
                <p class="text-xs text-slate-400 mt-0.5">{{ authService.currentUser()?.email }}</p>

                <div class="mt-6 pt-6 border-t border-slate-800 space-y-3">
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Pedidos Totales:</span>
                    <span class="font-bold text-white">{{ customerOrders().length }}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Pedidos en Tránsito:</span>
                    <span class="font-bold text-amber-400">{{ countCustomerActiveOrders() }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-6">
                <a
                  routerLink="/orders"
                  [queryParams]="{ new: true }"
                  class="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Crear Nuevo Pedido</span>
                </a>
              </div>
            </div>

            <!-- Current Order Active Tracker -->
            <div class="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Estado del Pedido Actual</h3>
                  <p class="text-xs text-slate-500">Seguimiento en vivo de tu último despacho</p>
                </div>
                @if (latestCustomerOrder(); as latest) {
                  <app-order-status-badge [status]="latest.status"></app-order-status-badge>
                }
              </div>

              @if (latestCustomerOrder(); as order) {
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200/60 mb-5">
                  <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span class="text-slate-500">N° Pedido:</span>
                      <span class="font-mono font-bold text-slate-900 ml-1">{{ order.orderNumber }}</span>
                    </div>
                    <div>
                      <span class="text-slate-500">Total:</span>
                      <span class="font-bold text-emerald-700 ml-1">{{ order.total | clpCurrency }}</span>
                    </div>
                    <div>
                      <span class="text-slate-500">Destino:</span>
                      <span class="font-medium text-slate-700 ml-1 truncate max-w-xs">{{ order.shippingAddress }}</span>
                    </div>
                  </div>
                </div>

                <!-- Visual Step Progress Tracker -->
                <div class="relative py-4">
                  <div class="flex items-center justify-between relative">
                    <!-- Progress Line -->
                    <div class="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0"></div>
                    <div
                      class="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 z-0"
                      [style.width.%]="getStepProgressPercentage(order.status)"
                    ></div>

                    <!-- Steps -->
                    <div class="flex flex-col items-center relative z-10">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs" [ngClass]="isStepReached(order.status, 'CREATED') ? 'bg-emerald-600' : 'bg-slate-300'">
                        ✓
                      </div>
                      <span class="text-[11px] font-semibold text-slate-700 mt-1">Creado</span>
                    </div>

                    <div class="flex flex-col items-center relative z-10">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs" [ngClass]="isStepReached(order.status, 'ACCEPTED') ? 'bg-emerald-600' : 'bg-slate-300'">
                        ✓
                      </div>
                      <span class="text-[11px] font-semibold text-slate-700 mt-1">Aceptado</span>
                    </div>

                    <div class="flex flex-col items-center relative z-10">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs" [ngClass]="isStepReached(order.status, 'IN_PREPARATION') ? 'bg-emerald-600' : 'bg-slate-300'">
                        3
                      </div>
                      <span class="text-[11px] font-semibold text-slate-700 mt-1">En Bodega</span>
                    </div>

                    <div class="flex flex-col items-center relative z-10">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs" [ngClass]="isStepReached(order.status, 'DISPATCHED') ? 'bg-emerald-600' : 'bg-slate-300'">
                        4
                      </div>
                      <span class="text-[11px] font-semibold text-slate-700 mt-1">Despacho</span>
                    </div>

                    <div class="flex flex-col items-center relative z-10">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs" [ngClass]="isStepReached(order.status, 'DELIVERED') ? 'bg-emerald-600' : 'bg-slate-300'">
                        5
                      </div>
                      <span class="text-[11px] font-semibold text-slate-700 mt-1">Entregado</span>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="text-center py-8 text-slate-500 text-xs">
                  No tienes pedidos activos en este momento.
                </div>
              }
            </div>
          </div>

          <!-- Customer Recent Orders List -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Historial de Mis Pedidos</h3>
                <p class="text-xs text-slate-500">Todos los pedidos solicitados a través de la plataforma</p>
              </div>
              <a routerLink="/orders" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                Ver Todos &rarr;
              </a>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th class="px-6 py-3.5">N° Pedido</th>
                    <th class="px-6 py-3.5">Fecha</th>
                    <th class="px-6 py-3.5">Items</th>
                    <th class="px-6 py-3.5">Estado</th>
                    <th class="px-6 py-3.5 text-right">Monto Total</th>
                    <th class="px-6 py-3.5 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (order of customerOrders(); track order.id) {
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="px-6 py-4 font-mono font-bold text-slate-900">{{ order.orderNumber }}</td>
                      <td class="px-6 py-4 text-slate-500">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td class="px-6 py-4 text-slate-700">{{ order.items.length }} productos</td>
                      <td class="px-6 py-4">
                        <app-order-status-badge [status]="order.status"></app-order-status-badge>
                      </td>
                      <td class="px-6 py-4 text-right font-bold text-emerald-700">{{ order.total | clpCurrency }}</td>
                      <td class="px-6 py-4 text-right">
                        <a
                          [routerLink]="['/orders', order.id]"
                          class="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Ver &rarr;
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private reportsService = inject(ReportsService);
  private ordersService = inject(OrdersService);

  loading = signal(true);
  kpis = signal<DashboardKpis | null>(null);
  hourlySales = signal<HourlySales[]>([]);
  statusDistribution = signal<OrderStatusDistribution[]>([]);
  topProducts = signal<TopProductSales[]>([]);
  recentOrders = signal<Order[]>([]);
  customerOrders = signal<Order[]>([]);

  maxHourlySales = 10000000;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);

    // Cargar KPIs y Gráficos
    this.reportsService.getDashboardKpis().subscribe(data => this.kpis.set(data));

    this.reportsService.getHourlySales().subscribe(data => {
      this.hourlySales.set(data);
      if (data.length > 0) {
        this.maxHourlySales = Math.max(...data.map(d => d.sales));
      }
    });

    this.reportsService.getOrderStatusDistribution().subscribe(data => this.statusDistribution.set(data));
    this.reportsService.getTopProducts().subscribe(data => this.topProducts.set(data));

    // Cargar Pedidos recientes
    this.ordersService.getOrders({ limit: 10 }).subscribe(res => {
      this.recentOrders.set(res.content);
      this.customerOrders.set(res.content);
      this.loading.set(false);
    });
  }

  getBarHeight(value: number, max: number): number {
    if (!max || max === 0) return 20;
    const ratio = value / max;
    return Math.max(16, Math.round(ratio * 160));
  }

  getStatusBarColor(status: OrderStatus): string {
    switch (status) {
      case 'CREATED': return 'bg-blue-500';
      case 'ACCEPTED': return 'bg-indigo-500';
      case 'IN_PREPARATION': return 'bg-amber-500';
      case 'DISPATCHED': return 'bg-purple-500';
      case 'DELIVERED': return 'bg-emerald-500';
      case 'CANCELLED': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  }

  countByStatus(status: OrderStatus): number {
    return this.recentOrders().filter(o => o.status === status).length;
  }

  countCustomerActiveOrders(): number {
    return this.customerOrders().filter(o => ['CREATED', 'ACCEPTED', 'IN_PREPARATION', 'DISPATCHED'].includes(o.status)).length;
  }

  latestCustomerOrder(): Order | null {
    const list = this.customerOrders();
    return list.length > 0 ? list[0] : null;
  }

  getStepProgressPercentage(status: OrderStatus): number {
    switch (status) {
      case 'CREATED': return 15;
      case 'ACCEPTED': return 35;
      case 'IN_PREPARATION': return 60;
      case 'DISPATCHED': return 85;
      case 'DELIVERED': return 100;
      case 'CANCELLED': return 0;
      default: return 0;
    }
  }

  isStepReached(currentStatus: OrderStatus, step: OrderStatus): boolean {
    const sequence: OrderStatus[] = ['CREATED', 'ACCEPTED', 'IN_PREPARATION', 'DISPATCHED', 'DELIVERED'];
    const currentIndex = sequence.indexOf(currentStatus);
    const stepIndex = sequence.indexOf(step);
    if (currentIndex === -1) return false;
    return currentIndex >= stepIndex;
  }
}
