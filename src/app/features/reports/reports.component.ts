import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../core/services/reports.service';
import { NotificationService } from '../../core/services/notification.service';
import { DashboardKpis, HourlySales, OrderStatusDistribution, TopProductSales, LeadTimeData } from '../../core/models/report.model';
import { KpiCardComponent } from '../../shared/components/kpi-card.component';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge.component';
import { ClpCurrencyPipe } from '../../shared/pipes/clp-currency.pipe';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KpiCardComponent,
    OrderStatusBadgeComponent,
    ClpCurrencyPipe,
    SkeletonLoaderComponent
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
            <span class="text-xs text-slate-500">Analítica Empresarial</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Reportería & Business Intelligence</h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            Métricas de rendimiento operacional, SLA de despacho, ingresos y tendencias de demanda
          </p>
        </div>

        <!-- Export Buttons -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="exportData('csv')"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            (click)="exportData('json')"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Descargar JSON</span>
          </button>
        </div>
      </div>

      <!-- Filters & Period Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs">
          <span class="font-semibold text-slate-600">Período de Análisis:</span>
          <div class="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              (click)="setPeriod('TODAY')"
              class="px-3 py-1 rounded-md font-medium transition-all"
              [ngClass]="selectedPeriod === 'TODAY' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'"
            >
              Hoy
            </button>
            <button
              type="button"
              (click)="setPeriod('WEEK')"
              class="px-3 py-1 rounded-md font-medium transition-all"
              [ngClass]="selectedPeriod === 'WEEK' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'"
            >
              Esta Semana
            </button>
            <button
              type="button"
              (click)="setPeriod('MONTH')"
              class="px-3 py-1 rounded-md font-medium transition-all"
              [ngClass]="selectedPeriod === 'MONTH' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'"
            >
              Este Mes
            </button>
            <button
              type="button"
              (click)="setPeriod('YEAR')"
              class="px-3 py-1 rounded-md font-medium transition-all"
              [ngClass]="selectedPeriod === 'YEAR' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'"
            >
              Año 2026
            </button>
          </div>
        </div>

        <div class="text-xs text-slate-500 flex items-center gap-2">
          <span>Fuente de datos:</span>
          <span class="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">ms-pedidos360-report (PostgreSQL / Kafka)</span>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <app-skeleton-loader type="cards" [count]="4"></app-skeleton-loader>
        <app-skeleton-loader type="table" [count]="5"></app-skeleton-loader>
      } @else {
        <!-- KPIs Overview -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <app-kpi-card
            title="Facturación Consolidada"
            [value]="kpis()?.totalSales | clpCurrency"
            subtitle="Ingresos brutos acumulados"
            changeText="+14.8% vs SLA"
            [isPositive]="true"
            iconBgClass="bg-purple-50 text-purple-600"
          >
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </app-kpi-card>

          <app-kpi-card
            title="Ticket Promedio"
            [value]="getAverageTicket() | clpCurrency"
            subtitle="Monto medio por orden"
            changeText="Promedio alto"
            [isPositive]="true"
            iconBgClass="bg-emerald-50 text-emerald-600"
          >
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </app-kpi-card>

          <app-kpi-card
            title="Lead Time Operacional"
            [value]="(kpis()?.leadTimeAverageMinutes || 0) + ' min'"
            subtitle="Creación hasta entrega final"
            changeText="-18% tiempo ciclo"
            [isPositive]="true"
            iconBgClass="bg-blue-50 text-blue-600"
          >
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </app-kpi-card>

          <app-kpi-card
            title="Tasa de Cumplimiento"
            value="97.3%"
            subtitle="Pedidos entregados a tiempo"
            changeText="Meta cumplida (>95%)"
            [isPositive]="true"
            iconBgClass="bg-teal-50 text-teal-600"
          >
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </app-kpi-card>
        </div>

        <!-- 2 Column Analytics: Distribution & Lead Time Stages -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Order Status Pipeline Distribution -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 class="text-sm font-bold text-slate-900">Distribución Operativa del Pipeline</h3>
            <p class="text-xs text-slate-500 mb-6">Porcentaje y volumen de pedidos por estado actual</p>

            <div class="space-y-4">
              @for (item of statusDistribution(); track item.status) {
                <div>
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <app-order-status-badge [status]="item.status"></app-order-status-badge>
                    <span class="font-bold text-slate-800">{{ item.count }} pedidos ({{ item.percentage }}%)</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [ngClass]="getStatusBarClass(item.status)"
                      [style.width.%]="item.percentage"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Lead Time SLA by Fulfillment Stage -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 class="text-sm font-bold text-slate-900">Desglose de Lead Time por Etapa</h3>
            <p class="text-xs text-slate-500 mb-6">Tiempos promedio reales vs objetivo de SLA (Target)</p>

            <div class="space-y-4">
              @for (stage of leadTimeData(); track stage.stage) {
                <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div class="flex items-center justify-between text-xs font-semibold mb-1">
                    <span class="text-slate-800">{{ stage.stage }}</span>
                    <span class="text-slate-600 font-mono">{{ stage.durationMinutes }}m / meta {{ stage.targetMinutes }}m</span>
                  </div>
                  <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [ngClass]="stage.durationMinutes <= stage.targetMinutes ? 'bg-emerald-500' : 'bg-rose-500'"
                      [style.width.%]="Math.min(100, (stage.durationMinutes / stage.targetMinutes) * 100)"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Ranking of Top Products by Revenue and Units -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Ranking de Productos Más Vendidos</h3>
              <p class="text-xs text-slate-500">Clasificación por volumen de unidades despachadas y facturación total</p>
            </div>
            <span class="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">Top 5</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="px-6 py-3.5 text-center w-12">#</th>
                  <th class="px-6 py-3.5">SKU</th>
                  <th class="px-6 py-3.5">Producto</th>
                  <th class="px-6 py-3.5 text-right">Unidades Vendidas</th>
                  <th class="px-6 py-3.5 text-right">Facturación Generada</th>
                  <th class="px-6 py-3.5 text-center">Rendimiento</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (prod of topProducts(); track prod.id; let i = $index) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-4 text-center font-bold text-slate-400">
                      <span
                        class="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs"
                        [ngClass]="i === 0 ? 'bg-amber-100 text-amber-800 font-black' : 'bg-slate-100 text-slate-600'"
                      >
                        {{ i + 1 }}
                      </span>
                    </td>
                    <td class="px-6 py-4 font-mono font-medium text-slate-600">{{ prod.sku }}</td>
                    <td class="px-6 py-4 font-semibold text-slate-900">{{ prod.name }}</td>
                    <td class="px-6 py-4 text-right font-medium text-slate-700">{{ prod.unitsSold }} un.</td>
                    <td class="px-6 py-4 text-right font-bold text-emerald-700">{{ prod.revenue | clpCurrency }}</td>
                    <td class="px-6 py-4 text-center">
                      <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Alta Demanda
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private notificationService = inject(NotificationService);

  Math = Math;
  loading = signal(true);
  selectedPeriod: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'MONTH';

  kpis = signal<DashboardKpis | null>(null);
  hourlySales = signal<HourlySales[]>([]);
  statusDistribution = signal<OrderStatusDistribution[]>([]);
  topProducts = signal<TopProductSales[]>([]);
  leadTimeData = signal<LeadTimeData[]>([]);

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);

    this.reportsService.getDashboardKpis({ period: this.selectedPeriod }).subscribe(k => this.kpis.set(k));
    this.reportsService.getHourlySales({ period: this.selectedPeriod }).subscribe(s => this.hourlySales.set(s));
    this.reportsService.getOrderStatusDistribution({ period: this.selectedPeriod }).subscribe(d => this.statusDistribution.set(d));
    this.reportsService.getTopProducts({ period: this.selectedPeriod }).subscribe(p => this.topProducts.set(p));
    this.reportsService.getLeadTimeData({ period: this.selectedPeriod }).subscribe(l => {
      this.leadTimeData.set(l);
      this.loading.set(false);
    });
  }

  setPeriod(period: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'): void {
    this.selectedPeriod = period;
    this.loadReports();
  }

  getAverageTicket(): number {
    const k = this.kpis();
    if (!k || !k.totalOrders || k.totalOrders === 0) return 0;
    return Math.round(k.totalSales / k.totalOrders);
  }

  getStatusBarClass(status: string): string {
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

  exportData(format: 'csv' | 'json'): void {
    const data = {
      period: this.selectedPeriod,
      generatedAt: new Date().toISOString(),
      kpis: this.kpis(),
      topProducts: this.topProducts(),
      statusDistribution: this.statusDistribution()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedidos360-report-${this.selectedPeriod.toLowerCase()}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      let csv = 'SKU,Producto,Unidades Vendidas,Ingresos CLP\n';
      this.topProducts().forEach(p => {
        csv += `"${p.sku}","${p.name}",${p.unitsSold},${p.revenue}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedidos360-ventas-${this.selectedPeriod.toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    this.notificationService.success('Reporte Descargado', `Reporte en formato ${format.toUpperCase()} generado exitosamente.`);
  }
}
