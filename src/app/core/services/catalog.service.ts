import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilterParams
} from '../models/catalog.model';
import { AuditService } from './audit.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private auditService = inject(AuditService);
  private authService = inject(AuthService);

  private readonly baseUrl = `${environment.apiUrl}${environment.apiEndpoints.catalog}`;

  // In-Memory store for mock fallback
  private mockProducts$ = new BehaviorSubject<Product[]>([
    {
      id: 'prod-01',
      sku: 'ALM-001',
      name: 'Aceite de Oliva Extra Virgen 5L',
      description: 'Aceite de oliva prensado en frío, acidez menor a 0.2%, bidón de 5 litros para canal Horeca.',
      price: 24990,
      stock: 48,
      minStock: 15,
      category: 'Alimentos',
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop',
      createdAt: '2026-01-15T10:00:00Z'
    },
    {
      id: 'prod-02',
      sku: 'HAR-002',
      name: 'Harina de Trigo Especial Panadería 50kg',
      description: 'Harina panadera con alto contenido proteico (W 280), ideal para panificación industrial y artesanal.',
      price: 28900,
      stock: 120,
      minStock: 25,
      category: 'Insumos',
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
      createdAt: '2026-01-16T11:30:00Z'
    },
    {
      id: 'prod-03',
      sku: 'GRN-003',
      name: 'Arroz Grano Largo Grado 1 (25kg)',
      description: 'Arroz pulido seleccionado, grano largo grado 1, envasado al vacío en sacos de polipropileno.',
      price: 32500,
      stock: 8,
      minStock: 20,
      category: 'Granos',
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
      createdAt: '2026-01-18T09:15:00Z'
    },
    {
      id: 'prod-04',
      sku: 'AZU-004',
      name: 'Azúcar Blanca Refinada Saco 50kg',
      description: 'Azúcar estándar refinada de alta pureza para repostería, alimentos y bebidas.',
      price: 41900,
      stock: 75,
      minStock: 20,
      category: 'Insumos',
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=400&h=300&fit=crop',
      createdAt: '2026-01-20T14:40:00Z'
    },
    {
      id: 'prod-05',
      sku: 'BEB-005',
      name: 'Bebida Energética Pack 24x250ml',
      description: 'Bebida energética con taurina y vitaminas del complejo B en lata de aluminio.',
      price: 18500,
      stock: 310,
      minStock: 50,
      category: 'Bebidas',
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&h=300&fit=crop',
      createdAt: '2026-02-01T08:20:00Z'
    },
    {
      id: 'prod-06',
      sku: 'LAC-006',
      name: 'Leche Entera UHT Caja 12x1L',
      description: 'Leche líquida de vaca homogeneizada y ultrapasteurizada, caja con 12 envases tetra brik.',
      price: 14200,
      stock: 0,
      minStock: 30,
      category: 'Lácteos',
      active: false,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop',
      createdAt: '2026-02-10T16:00:00Z'
    }
  ]);

  /**
   * Obtiene la lista de productos del catálogo
   * Backend endpoint: GET /api/catalog
   */
  getProducts(filters?: ProductFilterParams): Observable<Product[]> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.active !== undefined && filters.active !== 'ALL') {
      params = params.set('active', String(filters.active));
    }
    if (filters?.inStockOnly) params = params.set('inStockOnly', 'true');

    return this.http.get<Product[]>(this.baseUrl, { params }).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          return this.getMockProducts(filters);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene producto por ID
   * Backend endpoint: GET /api/catalog/{id}
   */
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          const product = this.mockProducts$.value.find(p => p.id === id);
          if (product) return of(product);
          return throwError(() => new Error(`Producto no encontrado: ${id}`));
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Crea un producto en el catálogo
   * Backend endpoint: POST /api/catalog
   */
  createProduct(payload: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, payload).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          return this.createMockProduct(payload);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Actualiza datos de un producto
   * Backend endpoint: PUT /api/catalog/{id}
   */
  updateProduct(id: string, payload: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, payload).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          return this.updateMockProduct(id, payload);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Modifica stock directamente
   * Backend endpoint: PATCH /api/catalog/{id}/stock
   */
  updateStock(id: string, newStock: number): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}/stock`, { stock: newStock }).pipe(
      catchError(err => {
        if (environment.enableMockFallback) {
          const list = [...this.mockProducts$.value];
          const index = list.findIndex(p => p.id === id);
          if (index !== -1) {
            list[index] = { ...list[index], stock: newStock };
            this.mockProducts$.next(list);

            this.auditService.logEvent({
              eventType: 'StockAdjusted',
              performedBy: this.authService.currentUser()?.name || 'Operador',
              userRole: this.authService.currentRole(),
              description: `Stock de producto ${list[index].sku} ajustado a ${newStock} unidades`,
              source: 'ms-pedidos360-catalog'
            });

            return of(list[index]);
          }
          return throwError(() => new Error('Producto no encontrado'));
        }
        return throwError(() => err);
      })
    );
  }

  // --- MOCK IMPLEMENTATION ---
  private getMockProducts(filters?: ProductFilterParams): Observable<Product[]> {
    let list = [...this.mockProducts$.value];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    if (filters?.category && filters.category !== 'ALL') {
      list = list.filter(p => p.category === filters.category);
    }

    if (filters?.active !== undefined && filters.active !== 'ALL') {
      list = list.filter(p => p.active === filters.active);
    }

    if (filters?.inStockOnly) {
      list = list.filter(p => p.stock > 0);
    }

    return of(list).pipe(delay(200));
  }

  private createMockProduct(payload: CreateProductRequest): Observable<Product> {
    const newProduct: Product = {
      ...payload,
      id: 'prod-' + (this.mockProducts$.value.length + 1).toString().padStart(2, '0'),
      createdAt: new Date().toISOString()
    };

    const updated = [newProduct, ...this.mockProducts$.value];
    this.mockProducts$.next(updated);

    this.auditService.logEvent({
      eventType: 'ProductCreated',
      performedBy: this.authService.currentUser()?.name || 'Admin',
      userRole: this.authService.currentRole(),
      description: `Nuevo producto ${newProduct.sku} (${newProduct.name}) creado en catálogo`,
      source: 'ms-pedidos360-catalog'
    });

    return of(newProduct).pipe(delay(300));
  }

  private updateMockProduct(id: string, payload: UpdateProductRequest): Observable<Product> {
    const list = [...this.mockProducts$.value];
    const index = list.findIndex(p => p.id === id);

    if (index === -1) {
      return throwError(() => new Error(`Producto no encontrado: ${id}`));
    }

    const updated: Product = {
      ...list[index],
      ...payload,
      id,
      updatedAt: new Date().toISOString()
    };

    list[index] = updated;
    this.mockProducts$.next(list);

    this.auditService.logEvent({
      eventType: 'ProductUpdated',
      performedBy: this.authService.currentUser()?.name || 'Admin',
      userRole: this.authService.currentRole(),
      description: `Producto ${updated.sku} actualizado en catálogo`,
      source: 'ms-pedidos360-catalog'
    });

    return of(updated).pipe(delay(250));
  }
}
