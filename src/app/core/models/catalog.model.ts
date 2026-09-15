export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  active: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  active: boolean;
  imageUrl?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  active?: boolean | 'ALL';
  inStockOnly?: boolean;
  sortBy?: 'name' | 'price' | 'stock';
  sortDirection?: 'asc' | 'desc';
}
