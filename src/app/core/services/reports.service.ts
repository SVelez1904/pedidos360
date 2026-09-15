import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  DashboardKpis,
  HourlySales,
  OrderStatusDistribution,
  TopProductSales,
  LeadTimeData,
  ReportFilterParams
} from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${environment.apiEndpoints.report}`;

  /**
   * Obtiene los KPIs consolidados del Dashboard
   * Backend endpoint: GET /api/report/kpis
   */
  getDashboardKpis(params?: ReportFilterParams): Observable<DashboardKpis> {
    const httpParams = this.buildParams(params);
    return this.http.get<DashboardKpis>(`${this.baseUrl}/kpis`, { params: httpParams }).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          return of({
            totalOrders: 148,
            totalSales: 34890250,
            activeOrders: 14,
            activeUsers: 38,
            leadTimeAverageMinutes: 84,
            topProductsCount: 6
          }).pipe(delay(200));
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene ventas por hora para el gráfico
   * Backend endpoint: GET /api/report/hourly-sales
   */
  getHourlySales(params?: ReportFilterParams): Observable<HourlySales[]> {
    const httpParams = this.buildParams(params);
    return this.http.get<HourlySales[]>(`${this.baseUrl}/hourly-sales`, { params: httpParams }).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          return of([
            { hour: '08:00', sales: 1250000, ordersCount: 4 },
            { hour: '10:00', sales: 4890000, ordersCount: 14 },
            { hour: '12:00', sales: 7920000, ordersCount: 22 },
            { hour: '14:00', sales: 5310000, ordersCount: 16 },
            { hour: '16:00', sales: 8840000, ordersCount: 25 },
            { hour: '18:00', sales: 6680250, ordersCount: 19 }
          ]).pipe(delay(200));
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene distribución de pedidos por estado
   * Backend endpoint: GET /api/report/orders-by-status
   */
  getOrderStatusDistribution(params?: ReportFilterParams): Observable<OrderStatusDistribution[]> {
    const httpParams = this.buildParams(params);
    return this.http.get<OrderStatusDistribution[]>(`${this.baseUrl}/orders-by-status`, { params: httpParams }).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          const mockDist: OrderStatusDistribution[] = [
            { status: 'CREATED', count: 18, percentage: 12 },
            { status: 'ACCEPTED', count: 24, percentage: 16 },
            { status: 'IN_PREPARATION', count: 32, percentage: 22 },
            { status: 'DISPATCHED', count: 28, percentage: 19 },
            { status: 'DELIVERED', count: 41, percentage: 28 },
            { status: 'CANCELLED', count: 5, percentage: 3 }
          ];
          return of(mockDist).pipe(delay(200));
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene los productos más vendidos
   * Backend endpoint: GET /api/report/top-products
   */
  getTopProducts(params?: ReportFilterParams): Observable<TopProductSales[]> {
    const httpParams = this.buildParams(params);
    return this.http.get<TopProductSales[]>(`${this.baseUrl}/top-products`, { params: httpParams }).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          return of([
            { id: 'prod-02', sku: 'HAR-002', name: 'Harina de Trigo Panadería 50kg', unitsSold: 420, revenue: 12138000 },
            { id: 'prod-05', sku: 'BEB-005', name: 'Bebida Energética Pack 24x250ml', unitsSold: 380, revenue: 7030000 },
            { id: 'prod-04', sku: 'AZU-004', name: 'Azúcar Blanca Refinada Saco 50kg', unitsSold: 195, revenue: 8170500 },
            { id: 'prod-01', sku: 'ALM-001', name: 'Aceite de Oliva Extra Virgen 5L', unitsSold: 180, revenue: 4498200 },
            { id: 'prod-03', sku: 'GRN-003', name: 'Arroz Grano Largo Grado 1 (25kg)', unitsSold: 94, revenue: 3055000 }
          ]).pipe(delay(200));
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene datos de Lead Time promedio
   * Backend endpoint: GET /api/report/lead-time
   */
  getLeadTimeData(params?: ReportFilterParams): Observable<LeadTimeData[]> {
    const httpParams = this.buildParams(params);
    return this.http.get<LeadTimeData[]>(`${this.baseUrl}/lead-time`, { params: httpParams }).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          return of([
            { orderNumber: 'PED-2026-1001', stage: 'Creación a Aceptación', durationMinutes: 12, targetMinutes: 15, createdAt: '2026-03-10' },
            { orderNumber: 'PED-2026-1002', stage: 'Aceptación a Preparación', durationMinutes: 28, targetMinutes: 30, createdAt: '2026-03-10' },
            { orderNumber: 'PED-2026-1003', stage: 'Preparación a Despacho', durationMinutes: 35, targetMinutes: 45, createdAt: '2026-03-11' },
            { orderNumber: 'PED-2026-1004', stage: 'Despacho a Entrega', durationMinutes: 52, targetMinutes: 60, createdAt: '2026-03-11' }
          ]).pipe(delay(200));
        }
        return throwError(() => err);
      })
    );
  }

  private buildParams(params?: ReportFilterParams): HttpParams {
    let httpParams = new HttpParams();
    if (params?.period) httpParams = httpParams.set('period', params.period);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    return httpParams;
  }
}
