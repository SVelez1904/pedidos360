export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path?: string;
  validationErrors?: Record<string, string>;
}
