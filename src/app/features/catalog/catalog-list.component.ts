import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/auth/auth.service';
import { Product } from '../../core/models/catalog.model';
import { ClpCurrencyPipe } from '../../shared/pipes/clp-currency.pipe';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ProductFormModalComponent } from './product-form-modal.component';
import { StockModalComponent } from './stock-modal.component';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClpCurrencyPipe,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ProductFormModalComponent,
    StockModalComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Catálogo e Inventario</h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestión de productos, existencias en bodega, precios y umbrales de abastecimiento
          </p>
        </div>

        <div class="flex items-center gap-2">
          @if (authService.hasRole(['Admin'])) {
            <button
              type="button"
              (click)="openCreateModal()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Producto</span>
            </button>
          }

          <button
            type="button"
            (click)="loadProducts()"
            class="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors shadow-xs"
            title="Recargar catálogo"
          >
            <svg class="w-4 h-4" [ngClass]="{ 'animate-spin': loading() }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Text Search -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Buscar Producto o SKU</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onFilterChange()"
                placeholder="Ej. Harina, Aceite o ALM-001..."
                class="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Category Filter -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
            <select
              [(ngModel)]="selectedCategory"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="ALL">Todas las Categorías</option>
              @for (cat of categories(); track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>

          <!-- Stock Level Quick Filter -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Disponibilidad de Stock</label>
            <select
              [(ngModel)]="stockFilter"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="ALL">Todos los Niveles</option>
              <option value="IN_STOCK">En Stock (Normal)</option>
              <option value="LOW_STOCK">Stock Bajo (Crítico)</option>
              <option value="OUT_OF_STOCK">Agotado (0 unidades)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Products Grid -->
      @if (loading()) {
        <app-skeleton-loader type="cards" [count]="6"></app-skeleton-loader>
      } @else if (filteredProducts().length === 0) {
        <app-empty-state
          title="No hay productos disponibles"
          description="No se encontraron productos coincidentes con los filtros seleccionados."
          [actionLabel]="authService.hasRole(['Admin']) ? 'Crear Nuevo Producto' : undefined"
          (actionClicked)="openCreateModal()"
        ></app-empty-state>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (prod of filteredProducts(); track prod.id) {
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group">
              <!-- Product Image & Badges -->
              <div class="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  [src]="prod.imageUrl || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop'"
                  [alt]="prod.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <!-- Category badge -->
                <span class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-md">
                  {{ prod.category }}
                </span>

                <!-- Stock status badge -->
                <div class="absolute top-3 right-3">
                  @if (prod.stock === 0) {
                    <span class="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Agotado
                    </span>
                  } @else if (prod.stock <= prod.minStock) {
                    <span class="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                      Stock Bajo ({{ prod.stock }})
                    </span>
                  } @else {
                    <span class="bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                      Normal ({{ prod.stock }} un.)
                    </span>
                  }
                </div>
              </div>

              <!-- Product Details -->
              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="font-mono text-xs font-semibold text-slate-500">{{ prod.sku }}</span>
                    @if (!prod.active) {
                      <span class="text-[10px] text-slate-400 uppercase font-bold bg-slate-100 px-1.5 py-0.5 rounded">Inactivo</span>
                    }
                  </div>
                  <h3 class="text-sm font-bold text-slate-900 leading-snug">{{ prod.name }}</h3>
                  <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{{ prod.description }}</p>
                </div>

                <!-- Stock Level Progress Bar & Price -->
                <div class="space-y-3 pt-3 border-t border-slate-100">
                  <div class="flex items-baseline justify-between">
                    <span class="text-xs text-slate-500">Precio unitario:</span>
                    <span class="text-base font-bold text-emerald-700">{{ prod.price | clpCurrency }}</span>
                  </div>

                  <!-- Stock Bar -->
                  <div>
                    <div class="flex justify-between text-[11px] mb-1">
                      <span class="text-slate-500">Disponibilidad en Bodega:</span>
                      <span class="font-semibold" [ngClass]="getStockTextColor(prod)">
                        {{ prod.stock }} / mín. {{ prod.minStock }}
                      </span>
                    </div>
                    <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        [ngClass]="getStockBarColor(prod)"
                        [style.width.%]="getStockBarWidth(prod)"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons (Stock Adjust, Edit) -->
                <div class="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    (click)="openStockModal(prod)"
                    class="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    Ajustar Stock
                  </button>

                  @if (authService.hasRole(['Admin'])) {
                    <button
                      type="button"
                      (click)="openEditModal(prod)"
                      class="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                      title="Editar producto"
                    >
                      Editar
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modals -->
      @if (showProductForm()) {
        <app-product-form-modal
          [product]="editingProduct"
          (productSaved)="onProductSaved()"
          (closeModal)="showProductForm.set(false)"
        ></app-product-form-modal>
      }

      @if (selectedProductForStock(); as prod) {
        <app-stock-modal
          [product]="prod"
          (stockUpdated)="onStockUpdated()"
          (closeModal)="selectedProductForStock.set(null)"
        ></app-stock-modal>
      }
    </div>
  `
})
export class CatalogListComponent implements OnInit {
  private catalogService = inject(CatalogService);
  authService = inject(AuthService);

  loading = signal(true);
  products = signal<Product[]>([]);
  categories = signal<string[]>([]);

  searchQuery = '';
  selectedCategory: string = 'ALL';
  stockFilter: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'ALL';

  showProductForm = signal(false);
  editingProduct: Product | null = null;
  selectedProductForStock = signal<Product | null>(null);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.catalogService.getProducts().subscribe({
      next: prods => {
        this.products.set(prods);
        const cats = Array.from(new Set(prods.map(p => p.category)));
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredProducts(): Product[] {
    return this.products().filter(prod => {
      // Búsqueda
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matches = prod.name.toLowerCase().includes(q) || prod.sku.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Categoría
      if (this.selectedCategory !== 'ALL' && prod.category !== this.selectedCategory) {
        return false;
      }
      // Stock
      if (this.stockFilter === 'IN_STOCK' && prod.stock <= prod.minStock) return false;
      if (this.stockFilter === 'LOW_STOCK' && (prod.stock === 0 || prod.stock > prod.minStock)) return false;
      if (this.stockFilter === 'OUT_OF_STOCK' && prod.stock > 0) return false;

      return true;
    });
  }

  onFilterChange(): void {
    // Reacts via filteredProducts computed signal
  }

  getStockTextColor(prod: Product): string {
    if (prod.stock === 0) return 'text-rose-600';
    if (prod.stock <= prod.minStock) return 'text-amber-600';
    return 'text-emerald-600';
  }

  getStockBarColor(prod: Product): string {
    if (prod.stock === 0) return 'bg-rose-500';
    if (prod.stock <= prod.minStock) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  getStockBarWidth(prod: Product): number {
    if (prod.stock === 0) return 0;
    const maxReference = prod.minStock * 3;
    return Math.min(100, Math.round((prod.stock / maxReference) * 100));
  }

  openCreateModal(): void {
    this.editingProduct = null;
    this.showProductForm.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct = product;
    this.showProductForm.set(true);
  }

  openStockModal(product: Product): void {
    this.selectedProductForStock.set(product);
  }

  onProductSaved(): void {
    this.showProductForm.set(false);
    this.loadProducts();
  }

  onStockUpdated(): void {
    this.selectedProductForStock.set(null);
    this.loadProducts();
  }
}
