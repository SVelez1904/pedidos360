export type AuditEventType =
  | 'OrderCreated'
  | 'OrderAccepted'
  | 'OrderPreparing'
  | 'OrderDispatched'
  | 'OrderDelivered'
  | 'OrderCancelled'
  | 'ProductCreated'
  | 'ProductUpdated'
  | 'StockAdjusted';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  orderId?: string;
  orderNumber?: string;
  performedBy: string;
  userRole: string;
  description: string;
  source: 'ms-pedidos360-orders' | 'ms-pedidos360-catalog' | 'ms-pedidos360-audit';
  details?: Record<string, unknown>;
}

export interface AuditFilterParams {
  eventType?: AuditEventType | 'ALL';
  orderNumber?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
