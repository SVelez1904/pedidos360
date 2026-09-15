export type OrderStatus =
  | 'CREATED'
  | 'ACCEPTED'
  | 'IN_PREPARATION'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  productId: string;
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
}

export interface CreateOrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customerId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: CreateOrderItemPayload[];
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
  updatedBy?: string;
}

export interface OrderFilterParams {
  status?: OrderStatus | 'ALL';
  customerId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
