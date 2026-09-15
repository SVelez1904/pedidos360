import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../core/models/catalog.model';

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900">
            {{ product ? 'Editar Producto' : 'Crear Nuevo Producto' }}
          </h3>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">SKU *</label>
              <input
                type="text"
                formControlName="sku"
                placeholder="Ej. ALM-001"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Categoría *</label>
              <input
                type="text"
                formControlName="category"
                placeholder="Ej. Alimentos, Insumos..."
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre del Producto *</label>
            <input
              type="text"
              formControlName="name"
              placeholder="Ej. Harina de Trigo Especial Panadería 50kg"
              class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
            <textarea
              formControlName="description"
              rows="2"
              placeholder="Detalle técnico o presentación del producto..."
              class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Precio Unit. (CLP) *</label>
              <input
                type="number"
                min="1"
                formControlName="price"
                placeholder="24990"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Stock Inicial *</label>
              <input
                type="number"
                min="0"
                formControlName="stock"
                placeholder="50"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Stock Mínimo *</label>
              <input
                type="number"
                min="0"
                formControlName="minStock"
                placeholder="10"
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="activeCheckbox"
              formControlName="active"
              class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label for="activeCheckbox" class="text-xs font-semibold text-slate-700">
              Producto activo y visible para compra
            </label>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              (click)="closeModal.emit()"
              class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="productForm.invalid || isSubmitting()"
              class="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              @if (isSubmitting()) {
                <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              }
              <span>{{ product ? 'Guardar Cambios' : 'Crear Producto' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProductFormModalComponent implements OnInit {
  @Input() product: Product | null = null;
  @Output() productSaved = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private catalogService = inject(CatalogService);
  private notificationService = inject(NotificationService);

  productForm!: FormGroup;
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.productForm = this.fb.group({
      sku: [this.product?.sku || '', [Validators.required, Validators.minLength(3)]],
      name: [this.product?.name || '', [Validators.required, Validators.minLength(3)]],
      description: [this.product?.description || ''],
      category: [this.product?.category || '', Validators.required],
      price: [this.product?.price || '', [Validators.required, Validators.min(1)]],
      stock: [this.product?.stock ?? 0, [Validators.required, Validators.min(0)]],
      minStock: [this.product?.minStock ?? 10, [Validators.required, Validators.min(0)]],
      active: [this.product?.active ?? true]
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.productForm.value;

    const payload = {
      sku: formVal.sku.toUpperCase(),
      name: formVal.name,
      description: formVal.description,
      category: formVal.category,
      price: Number(formVal.price),
      stock: Number(formVal.stock),
      minStock: Number(formVal.minStock),
      active: Boolean(formVal.active)
    };

    if (this.product) {
      this.catalogService.updateProduct(this.product.id, { ...payload, id: this.product.id }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notificationService.success('Producto Actualizado', `El producto ${payload.sku} ha sido actualizado.`);
          this.productSaved.emit();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      this.catalogService.createProduct(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notificationService.success('Producto Creado', `El producto ${payload.sku} ha sido añadido al catálogo.`);
          this.productSaved.emit();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }
}
