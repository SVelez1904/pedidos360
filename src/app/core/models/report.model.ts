import { OrderStatus } from './order.model';

export interface DashboardKpis {
  totalOrders: number;
  totalSales: number;
  activeOrders: number;
  activeUsers: number;
  leadTimeAverageMinutes: number;
  topProductsCount: number;
}

export interface HourlySales {
  hour: string;
  sales: number;
  ordersCount: number;
}

export interface OrderStatusDistribution {
  status: OrderStatus;
  count: number;
  percentage: number;
}

export interface TopProductSales {
  id: string;
  sku: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface LeadTimeData {
  orderNumber: string;
  stage: string;
  durationMinutes: number;
  targetMinutes: number;
  createdAt: string;
}

export interface ReportFilterParams {
  period?: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
}
