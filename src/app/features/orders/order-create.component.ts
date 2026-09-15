import { Component, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { OrdersService } from '../../core/services/orders.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../core/models/catalog.model';
import { ClpCurrencyPipe } from '../../shared/pipes/clp-currency.pipe';

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClpCurrencyPipe],
  template: `
    <!-- Modal Backdrop -->
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 class="text-base font-bold text-slate-900">Crear Nuevo Pedido</h3>
            <p class="text-xs text-slate-500">Ingresa los datos del cliente y selecciona los productos del catálogo</p>
          </div>
          <button
            type="button"
            (click)="closeModal.emit()"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form Body -->
        <form [formGroup]="orderForm" (ngSubmit)="onSubmit()" class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Customer & Shipping Information -->
          <div class="space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">1. Información del Cliente y Despacho</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  formControlName="customerName"
                  placeholder="Ej. Distribuidora Central S.A."
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                @if (orderForm.get('customerName')?.touched && orderForm.get('customerName')?.invalid) {
                  <span class="text-[10px] text-rose-500 mt-0.5">El nombre del cliente es obligatorio</span>
                }
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  formControlName="customerEmail"
                  placeholder="contacto@empresa.cl"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Dirección de Despacho *</label>
                <input
                  type="text"
                  formControlName="shippingAddress"
                  placeholder="Av. Américo Vespucio Norte 1200, Bodega 4, Quilicura"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Notas de Entrega (Opcional)</label>
                <input
                  type="text"
                  formControlName="notes"
                  placeholder="Horario de recepción 09:00 a 18:00 hrs"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Product Line Items -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">2. Selección de Productos del Catálogo</h4>
              <button
                type="button"
                (click)="addItem()"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Añadir Producto</span>
              </button>
            </div>

            <!-- Items Table/Rows -->
            <div formArrayName="items" class="space-y-3">
              @for (itemGroup of items.controls; track $index; let i = $index) {
                <div [formGroupName]="i" class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <!-- Product Select -->
                  <div class="flex-1 w-full">
                    <label class="block text-[11px] font-medium text-slate-500 mb-1">Producto</label>
                    <select
                      formControlName="productId"
                      (change)="onProductSelected(i)"
                      class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="" disabled>Seleccione producto...</option>
                      @for (p of availableProducts(); track p.id) {
                        <option [value]="p.id" [disabled]="!p.active || p.stock === 0">
                          {{ p.sku }} - {{ p.name }} (Stock: {{ p.stock }}) - {{ p.price | clpCurrency }}
                        </option>
                      }
                    </select>
                  </div>

                  <!-- Quantity Input -->
                  <div class="w-full sm:w-28">
                    <label class="block text-[11px] font-medium text-slate-500 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      [max]="getMaxStock(i)"
                      formControlName="quantity"
                      (input)="calculateTotals()"
                      class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <!-- Subtotal Display -->
                  <div class="w-full sm:w-32 text-right sm:self-center pt-2 sm:pt-4">
                    <span class="text-xs font-bold text-slate-800">
                      {{ getItemSubtotal(i) | clpCurrency }}
                    </span>
                  </div>

                  <!-- Delete Item Button -->
                  <div class="sm:self-center pt-2 sm:pt-4">
                    <button
                      type="button"
                      (click)="removeItem(i)"
                      [disabled]="items.length === 1"
                      class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-30"
                      title="Eliminar producto"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Stock Warning if exceeded -->
            @if (hasStockError()) {
              <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                ⚠️ Una o más líneas solicitan una cantidad superior al stock físico disponible. Ajusta las cantidades para continuar.
              </div>
            }
          </div>

          <!-- Financial Calculation Breakdown -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div class="flex justify-between text-slate-600">
              <span>Subtotal Neto:</span>
              <span class="font-medium text-slate-900">{{ subtotal() | clpCurrency }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>IVA (19%):</span>
              <span class="font-medium text-slate-900">{{ tax() | clpCurrency }}</span>
            </div>
            <div class="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
              <span>Total Pedido:</span>
              <span class="text-emerald-700 text-base">{{ total() | clpCurrency }}</span>
            </div>
          </div>

          <!-- Modal Actions Footer -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="closeModal.emit()"
              class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              [disabled]="orderForm.invalid || isSubmitting() || hasStockError() || items.length === 0"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-all flex items-center gap-2"
            >
              @if (isSubmitting()) {
                <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Enviando al Backend...</span>
              } @else {
                <span>Confirmar y Crear Pedido</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class OrderCreateComponent implements OnInit {
  @Output() orderCreated = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private catalogService = inject(CatalogService);
  private ordersService = inject(OrdersService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  orderForm!: FormGroup;
  availableProducts = signal<Product[]>([]);
  isSubmitting = signal(false);

  subtotal = signal(0);
  tax = signal(0);
  total = signal(0);

  ngOnInit(): void {
    const user = this.authService.currentUser();

    this.orderForm = this.fb.group({
      customerName: [user?.name || '', [Validators.required, Validators.minLength(3)]],
      customerEmail: [user?.email || '', [Validators.required, Validators.email]],
      shippingAddress: ['', [Validators.required, Validators.minLength(5)]],
      notes: [''],
      items: this.fb.array([])
    });

    this.loadProducts();
  }

  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  loadProducts(): void {
    this.catalogService.getProducts().subscribe(products => {
      this.availableProducts.set(products.filter(p => p.active));
      // Añadir la primera línea por defecto
      if (this.items.length === 0 && products.length > 0) {
        this.addItem();
      }
    });
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });

    this.items.push(itemGroup);
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.calculateTotals();
    }
  }

  onProductSelected(index: number): void {
    this.calculateTotals();
  }

  getMaxStock(index: number): number {
    const productId = this.items.at(index)?.get('productId')?.value;
    const prod = this.availableProducts().find(p => p.id === productId);
    return prod ? prod.stock : 999;
  }

  getItemSubtotal(index: number): number {
    const group = this.items.at(index);
    if (!group) return 0;
    const productId = group.get('productId')?.value;
    const quantity = group.get('quantity')?.value || 0;
    const prod = this.availableProducts().find(p => p.id === productId);
    return prod ? prod.price * quantity : 0;
  }

  calculateTotals(): void {
    let sum = 0;
    for (let i = 0; i < this.items.length; i++) {
      sum += this.getItemSubtotal(i);
    }
    this.subtotal.set(sum);
    this.tax.set(Math.round(sum * 0.19));
    this.total.set(sum + Math.round(sum * 0.19));
  }

  hasStockError(): boolean {
    for (let i = 0; i < this.items.length; i++) {
      const productId = this.items.at(i)?.get('productId')?.value;
      const qty = this.items.at(i)?.get('quantity')?.value || 0;
      const prod = this.availableProducts().find(p => p.id === productId);
      if (prod && qty > prod.stock) {
        return true;
      }
    }
    return false;
  }

  onSubmit(): void {
    if (this.orderForm.invalid || this.hasStockError()) return;

    this.isSubmitting.set(true);
    const formVal = this.orderForm.value;

    const payload = {
      customerId: this.authService.currentUser()?.id || 'cust-01',
      customerName: formVal.customerName,
      customerEmail: formVal.customerEmail,
      shippingAddress: formVal.shippingAddress,
      notes: formVal.notes,
      items: formVal.items.map((it: any) => ({
        productId: it.productId,
        quantity: Number(it.quantity)
      }))
    };

    this.ordersService.createOrder(payload).subscribe({
      next: created => {
        this.isSubmitting.set(false);
        this.orderCreated.emit();
      },
      error: err => {
        this.isSubmitting.set(false);
      }
    });
  }
}
