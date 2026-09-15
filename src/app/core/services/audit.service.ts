import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuditEvent, AuditFilterParams } from '../models/audit.model';
import { PaginatedResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${environment.apiEndpoints.audit}`;

  private mockEvents$ = new BehaviorSubject<AuditEvent[]>([
    {
      id: 'aud-001',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      eventType: 'OrderCreated',
      orderId: 'ord-1005',
      orderNumber: 'PED-2026-1005',
      performedBy: 'Casino Minero Los Andes',
      userRole: 'Customer',
      description: 'Nuevo pedido registrado por $825.265 (2 líneas de productos)',
      source: 'ms-pedidos360-orders'
    },
    {
      id: 'aud-002',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      eventType: 'OrderAccepted',
      orderId: 'ord-1004',
      orderNumber: 'PED-2026-1004',
      performedBy: 'Camila Soto',
      userRole: 'Operator',
      description: 'Pedido aprobado y derivado a cola de preparación de bodega',
      source: 'ms-pedidos360-orders'
    },
    {
      id: 'aud-003',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      eventType: 'OrderPreparing',
      orderId: 'ord-1003',
      orderNumber: 'PED-2026-1003',
      performedBy: 'Camila Soto',
      userRole: 'Operator',
      description: 'Picking y empaque iniciado en pasillo 4',
      source: 'ms-pedidos360-orders'
    },
    {
      id: 'aud-004',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      eventType: 'OrderDispatched',
      orderId: 'ord-1002',
      orderNumber: 'PED-2026-1002',
      performedBy: 'Camila Soto',
      userRole: 'Operator',
      description: 'Cargado en camión patente BB-LL-44 para ruta Talca',
      source: 'ms-pedidos360-orders'
    },
    {
      id: 'aud-005',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      eventType: 'OrderDelivered',
      orderId: 'ord-1001',
      orderNumber: 'PED-2026-1001',
      performedBy: 'Transportes Rápidos',
      userRole: 'Operator',
      description: 'Entrega confirmada con firma digital en rampa de carga #2',
      source: 'ms-pedidos360-orders'
    },
    {
      id: 'aud-006',
      timestamp: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
      eventType: 'StockAdjusted',
      performedBy: 'Gonzalo Ramírez',
      userRole: 'Admin',
      description: 'Ingreso de nuevo lote de Harina de Trigo Panadería (+50 sacos)',
      source: 'ms-pedidos360-catalog'
    }
  ]);

  /**
   * Consulta el registro de auditoría con filtros
   * Backend endpoint: GET /api/audit
   */
  getAuditEvents(filters?: AuditFilterParams): Observable<PaginatedResponse<AuditEvent>> {
    let params = new HttpParams();
    if (filters?.eventType && filters.eventType !== 'ALL') params = params.set('eventType', filters.eventType);
    if (filters?.orderNumber) params = params.set('orderNumber', filters.orderNumber);
    if (filters?.performedBy) params = params.set('performedBy', filters.performedBy);
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);
    params = params.set('page', String(filters?.page ?? 0));
    params = params.set('limit', String(filters?.limit ?? 15));

    return this.http.get<PaginatedResponse<AuditEvent>>(this.baseUrl, { params }).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          return this.getMockAuditEvents(filters);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Registra un evento en la auditoría (usado internamente o por BFF)
   */
  logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const newEvent: AuditEvent = {
      ...event,
      id: 'aud-' + Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toISOString()
    };

    const current = [newEvent, ...this.mockEvents$.value];
    this.mockEvents$.next(current);

    // Si el backend expone POST /api/audit, enviar asíncronamente
    this.http.post(this.baseUrl, newEvent).subscribe({
      next: () => {},
      error: () => {
        // En desarrollo puede fallar si no existe el endpoint, el registro local persiste
      }
    });
  }

  private getMockAuditEvents(filters?: AuditFilterParams): Observable<PaginatedResponse<AuditEvent>> {
    let list = [...this.mockEvents$.value];

    if (filters?.eventType && filters.eventType !== 'ALL') {
      list = list.filter(e => e.eventType === filters.eventType);
    }

    if (filters?.orderNumber) {
      const q = filters.orderNumber.toLowerCase();
      list = list.filter(e => e.orderNumber?.toLowerCase().includes(q));
    }

    if (filters?.performedBy) {
      const q = filters.performedBy.toLowerCase();
      list = list.filter(e => e.performedBy.toLowerCase().includes(q));
    }

    const page = filters?.page || 0;
    const limit = filters?.limit || 15;
    const startIndex = page * limit;
    const paged = list.slice(startIndex, startIndex + limit);

    const response: PaginatedResponse<AuditEvent> = {
      content: paged,
      totalElements: list.length,
      totalPages: Math.ceil(list.length / limit),
      page,
      size: limit,
      first: page === 0,
      last: startIndex + limit >= list.length
    };

    return of(response).pipe(delay(200));
  }
}
