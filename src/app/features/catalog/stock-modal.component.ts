import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../core/models/catalog.model';

@Component({
  selector: 'app-stock-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div>
          <h3 class="text-base font-bold text-slate-900">Ajustar Stock Físico</h3>
          <p class="text-xs text-slate-500 mt-0.5">{{ product.sku }} - {{ product.name }}</p>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
          <span class="text-slate-600">Stock Actual en Bodega:</span>
          <span class="font-bold text-slate-900 text-sm">{{ product.stock }} un.</span>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Nuevo Stock Disponible</label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="decrement()"
              class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
            >
              -
            </button>
            <input
              type="number"
              min="0"
              [(ngModel)]="newStock"
              class="flex-1 text-center font-bold text-base py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              (click)="increment()"
              class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            (click)="closeModal.emit()"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="button"
            [disabled]="isUpdating() || newStock < 0"
            (click)="saveStock()"
            class="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            @if (isUpdating()) {
              <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            }
            <span>Guardar Ajuste</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class StockModalComponent {
  @Input({ required: true }) product!: Product;
  @Output() stockUpdated = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  private catalogService = inject(CatalogService);
  private notificationService = inject(NotificationService);

  newStock = 0;
  isUpdating = signal(false);

  ngOnInit(): void {
    this.newStock = this.product.stock;
  }

  increment(): void {
    this.newStock++;
  }

  decrement(): void {
    if (this.newStock > 0) {
      this.newStock--;
    }
  }

  saveStock(): void {
    if (this.newStock < 0) return;

    this.isUpdating.set(true);
    this.catalogService.updateStock(this.product.id, this.newStock).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.notificationService.success('Stock Actualizado', `El stock de ${this.product.sku} se actualizó a ${this.newStock}`);
        this.stockUpdated.emit();
      },
      error: () => {
        this.isUpdating.set(false);
      }
    });
  }
}
