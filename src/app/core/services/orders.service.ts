import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Order,
  OrderStatus,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderFilterParams
} from '../models/order.model';
import { PaginatedResponse } from '../models/api-response.model';
import { AuditService } from './audit.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private http = inject(HttpClient);
  private auditService = inject(AuditService);
  private authService = inject(AuthService);

  private readonly baseUrl = `${environment.apiUrl}${environment.apiEndpoints.orders}`;

  // In-Memory store for mock fallback / preview
  private mockOrders$ = new BehaviorSubject<Order[]>([
    {
      id: 'ord-1001',
      orderNumber: 'PED-2026-1001',
      customerId: 'cust-01',
      customerName: 'Distribuidora Central S.A.',
      customerEmail: 'contacto@distribuidoracentral.cl',
      status: 'DELIVERED',
      items: [
        { productId: 'prod-01', sku: 'ALM-001', productName: 'Aceite de Oliva Extra Virgen 5L', unitPrice: 24990, quantity: 4, subtotal: 99960 },
        { productId: 'prod-03', sku: 'GRN-003', productName: 'Arroz Grano Largo Grado 1 (25kg)', unitPrice: 32500, quantity: 2, subtotal: 65000 }
      ],
      subtotal: 164960,
      tax: 31342,
      total: 196302,
      shippingAddress: 'Av. Libertador Bernardo O\'Higgins 4500, Estación Central, Santiago',
      notes: 'Entregar en rampa de carga #2',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      dispatchedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      deliveredAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 'ord-1002',
      orderNumber: 'PED-2026-1002',
      customerId: 'cust-02',
      customerName: 'Supermercados del Sur Ltda.',
      customerEmail: 'adquisiciones@delsur.cl',
      status: 'DISPATCHED',
      items: [
        { productId: 'prod-02', sku: 'HAR-002', productName: 'Harina de Trigo Especial Panadería 50kg', unitPrice: 28900, quantity: 10, subtotal: 289000 },
        { productId: 'prod-04', sku: 'AZU-004', productName: 'Azúcar Blanca Refinada Saco 50kg', unitPrice: 41900, quantity: 5, subtotal: 209500 }
      ],
      subtotal: 498500,
      tax: 94715,
      total: 593215,
      shippingAddress: 'Ruta 5 Sur Km 240, Talca',
      notes: 'Horario de recepción 08:00 a 14:00',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      dispatchedAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'ord-1003',
      orderNumber: 'PED-2026-1003',
      customerId: 'cust-03',
      customerName: 'Empresa Logix SpA',
      customerEmail: 'compras@logix.cl',
      status: 'IN_PREPARATION',
      items: [
        { productId: 'prod-05', sku: 'BEB-005', productName: 'Bebida Energética Pack 24x250ml', unitPrice: 18500, quantity: 8, subtotal: 148000 }
      ],
      subtotal: 148000,
      tax: 28120,
      total: 176120,
      shippingAddress: 'Parque Industrial ENEA, Pudahuel',
      notes: 'Solicitud prioritaria',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: 'ord-1004',
      orderNumber: 'PED-2026-1004',
      customerId: 'cust-04',
      customerName: 'Restaurante Gourmet La Fontana',
      customerEmail: 'chef@lafontana.cl',
      status: 'ACCEPTED',
      items: [
        { productId: 'prod-01', sku: 'ALM-001', productName: 'Aceite de Oliva Extra Virgen 5L', unitPrice: 24990, quantity: 2, subtotal: 49980 }
      ],
      subtotal: 49980,
      tax: 9496,
      total: 59476,
      shippingAddress: 'Isidora Goyenechea 3000, Las Condes',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: 'ord-1005',
      orderNumber: 'PED-2026-1005',
      customerId: 'cust-05',
      customerName: 'Casino Minero Los Andes',
      customerEmail: 'abastecimiento@losandesminera.cl',
      status: 'CREATED',
      items: [
        { productId: 'prod-02', sku: 'HAR-002', productName: 'Harina de Trigo Especial Panadería 50kg', unitPrice: 28900, quantity: 15, subtotal: 433500 },
        { productId: 'prod-03', sku: 'GRN-003', productName: 'Arroz Grano Largo Grado 1 (25kg)', unitPrice: 32500, quantity: 8, subtotal: 260000 }
      ],
      subtotal: 693500,
      tax: 131765,
      total: 825265,
      shippingAddress: 'Camino a Farellones km 14',
      createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'ord-1006',
      orderNumber: 'PED-2026-1006',
      customerId: 'cust-03',
      customerName: 'Empresa Logix SpA',
      customerEmail: 'compras@logix.cl',
      status: 'CANCELLED',
      items: [
        { productId: 'prod-04', sku: 'AZU-004', productName: 'Azúcar Blanca Refinada Saco 50kg', unitPrice: 41900, quantity: 1, subtotal: 41900 }
      ],
      subtotal: 41900,
      tax: 7961,
      total: 49861,
      shippingAddress: 'Parque Industrial ENEA, Pudahuel',
      notes: 'Cancelado por solicitud del cliente (cambio de pedido)',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ]);

  /**
   * Obtiene lista paginada de pedidos con filtros
   * Backend endpoint: GET /api/orders
   */
  getOrders(filters?: OrderFilterParams): Observable<PaginatedResponse<Order>> {
    let params = new HttpParams();
    if (filters?.status && filters.status !== 'ALL') params = params.set('status', filters.status);
    if (filters?.customerId) params = params.set('customerId', filters.customerId);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);
    if (filters?.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters?.sortDirection) params = params.set('sortDirection', filters.sortDirection);
    params = params.set('page', String(filters?.page ?? 0));
    params = params.set('limit', String(filters?.limit ?? 10));

    return this.http.get<PaginatedResponse<Order>>(this.baseUrl, { params }).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          return this.getMockOrdersPaginated(filters);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene un pedido por ID
   * Backend endpoint: GET /api/orders/{id}
   */
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          const found = this.mockOrders$.value.find(o => o.id === id || o.orderNumber === id);
          if (found) return of(found);
          return throwError(() => new Error(`Pedido no encontrado: ${id}`));
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Crea un nuevo pedido
   * Backend endpoint: POST /api/orders
   */
  createOrder(payload: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, payload).pipe(
      tap(createdOrder => {
        // Registrar auditoría
        this.auditService.logEvent({
          eventType: 'OrderCreated',
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          performedBy: this.authService.currentUser()?.name || payload.customerName,
          userRole: this.authService.currentRole(),
          description: `Nuevo pedido creado con ${createdOrder.items.length} items por un total de $${createdOrder.total}`,
          source: 'ms-pedidos360-orders'
        });
      }),
      catchError(err => {
        if (environment.enableMockFallback) {
          return this.createMockOrder(payload);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Actualiza el estado de un pedido siguiendo el flujo de negocio:
   * CREATED -> ACCEPTED -> IN_PREPARATION -> DISPATCHED -> DELIVERED (o CANCELLED)
   * Backend endpoint: PATCH /api/orders/{id}/status
   */
  updateOrderStatus(id: string, request: UpdateOrderStatusRequest): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${id}/status`, request).pipe(
      tap(updatedOrder => {
        const eventTypeMap: Record<OrderStatus, any> = {
          CREATED: 'OrderCreated',
          ACCEPTED: 'OrderAccepted',
          IN_PREPARATION: 'OrderPreparing',
          DISPATCHED: 'OrderDispatched',
          DELIVERED: 'OrderDelivered',
          CANCELLED: 'OrderCancelled'
        };

        this.auditService.logEvent({
          eventType: eventTypeMap[request.status] || 'OrderAccepted',
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          performedBy: this.authService.currentUser()?.name || 'Operador',
          userRole: this.authService.currentRole(),
          description: `Estado actualizado a ${request.status}. ${request.reason ? 'Motivo: ' + request.reason : ''}`,
          source: 'ms-pedidos360-orders'
        });
      }),
      catchError(err => {
        if (environment.enableMockFallback) {
          return this.updateMockOrderStatus(id, request);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Determina los siguientes estados válidos según la máquina de estados del backend
   */
  getAllowedNextStatuses(currentStatus: OrderStatus, role: string): OrderStatus[] {
    if (role === 'Customer') {
      // Clientes solo pueden cancelar pedidos que aún estén en CREATED
      return currentStatus === 'CREATED' ? ['CANCELLED'] : [];
    }

    // Operadores y Admins
    switch (currentStatus) {
      case 'CREATED':
        return ['ACCEPTED', 'CANCELLED'];
      case 'ACCEPTED':
        return ['IN_PREPARATION', 'CANCELLED'];
      case 'IN_PREPARATION':
        return ['DISPATCHED', 'CANCELLED'];
      case 'DISPATCHED':
        return ['DELIVERED'];
      case 'DELIVERED':
      case 'CANCELLED':
      default:
        return [];
    }
  }

  // --- MOCK FALLBACK IMPLEMENTATIONS ---
  private getMockOrdersPaginated(filters?: OrderFilterParams): Observable<PaginatedResponse<Order>> {
    let list = [...this.mockOrders$.value];

    // Si es cliente, filtrar solo sus pedidos
    if (this.authService.currentRole() === 'Customer') {
      const user = this.authService.currentUser();
      list = list.filter(o => o.customerId === 'cust-03' || o.customerEmail === user?.email);
    }

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter(o => o.status === filters.status);
    }

    if (filters?.search) {
      const query = filters.search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.shippingAddress.toLowerCase().includes(query)
      );
    }

    const page = filters?.page || 0;
    const limit = filters?.limit || 10;
    const startIndex = page * limit;
    const pagedItems = list.slice(startIndex, startIndex + limit);

    const response: PaginatedResponse<Order> = {
      content: pagedItems,
      totalElements: list.length,
      totalPages: Math.ceil(list.length / limit),
      page,
      size: limit,
      first: page === 0,
      last: startIndex + limit >= list.length
    };

    return of(response).pipe(delay(200));
  }

  private createMockOrder(payload: CreateOrderRequest): Observable<Order> {
    const newId = 'ord-' + (1000 + this.mockOrders$.value.length + 1);
    const newNumber = `PED-2026-${1000 + this.mockOrders$.value.length + 1}`;

    const items = payload.items.map(item => ({
      productId: item.productId,
      sku: 'SKU-' + item.productId.substring(0, 4).toUpperCase(),
      productName: 'Producto ' + item.productId,
      unitPrice: 19990,
      quantity: item.quantity,
      subtotal: 19990 * item.quantity
    }));

    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
    const tax = Math.round(subtotal * 0.19);
    const total = subtotal + tax;

    const order: Order = {
      id: newId,
      orderNumber: newNumber,
      customerId: payload.customerId || 'cust-03',
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      status: 'CREATED',
      items,
      subtotal,
      tax,
      total,
      shippingAddress: payload.shippingAddress,
      notes: payload.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [order, ...this.mockOrders$.value];
    this.mockOrders$.next(updated);

    this.auditService.logEvent({
      eventType: 'OrderCreated',
      orderId: order.id,
      orderNumber: order.orderNumber,
      performedBy: this.authService.currentUser()?.name || payload.customerName,
      userRole: this.authService.currentRole(),
      description: `Nuevo pedido creado con ${order.items.length} items por un total de $${order.total}`,
      source: 'ms-pedidos360-orders'
    });

    return of(order).pipe(delay(300));
  }

  private updateMockOrderStatus(id: string, request: UpdateOrderStatusRequest): Observable<Order> {
    const list = [...this.mockOrders$.value];
    const index = list.findIndex(o => o.id === id || o.orderNumber === id);

    if (index === -1) {
      return throwError(() => new Error(`Pedido no encontrado para actualizar: ${id}`));
    }

    const existing = list[index];
    const updated: Order = {
      ...existing,
      status: request.status,
      updatedAt: new Date().toISOString(),
      dispatchedAt: request.status === 'DISPATCHED' ? new Date().toISOString() : existing.dispatchedAt,
      deliveredAt: request.status === 'DELIVERED' ? new Date().toISOString() : existing.deliveredAt
    };

    list[index] = updated;
    this.mockOrders$.next(list);

    const eventTypeMap: Record<OrderStatus, any> = {
      CREATED: 'OrderCreated',
      ACCEPTED: 'OrderAccepted',
      IN_PREPARATION: 'OrderPreparing',
      DISPATCHED: 'OrderDispatched',
      DELIVERED: 'OrderDelivered',
      CANCELLED: 'OrderCancelled'
    };

    this.auditService.logEvent({
      eventType: eventTypeMap[request.status] || 'OrderAccepted',
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      performedBy: this.authService.currentUser()?.name || 'Operador',
      userRole: this.authService.currentRole(),
      description: `Estado actualizado a ${request.status}. ${request.reason ? 'Motivo: ' + request.reason : ''}`,
      source: 'ms-pedidos360-orders'
    });

    return of(updated).pipe(delay(200));
  }
}
