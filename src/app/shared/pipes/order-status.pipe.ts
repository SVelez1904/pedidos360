import { Pipe, PipeTransform } from '@angular/core';
import { OrderStatus } from '../../core/models/order.model';

@Pipe({
  name: 'orderStatusName',
  standalone: true
})
export class OrderStatusPipe implements PipeTransform {
  private readonly statusLabels: Record<OrderStatus, string> = {
    CREATED: 'Creado',
    ACCEPTED: 'Aceptado',
    IN_PREPARATION: 'En Preparación',
    DISPATCHED: 'Despachado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado'
  };

  transform(status: OrderStatus | string | null | undefined): string {
    if (!status) return 'Desconocido';
    return this.statusLabels[status as OrderStatus] || status;
  }
}
