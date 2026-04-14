/**
 * Standard API Response Interfaces
 */

export interface PaginationMeta {
  totalPages: number;
  currentPage: number;
  total: number;
  limit: number;
}

export interface ApiResponse<T = any> {
  status: number;
  message: string;
  timestamp: string;
  path: string;
  data: T;
  pagination?: PaginationMeta;
  meta?: Record<string, any>;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}
