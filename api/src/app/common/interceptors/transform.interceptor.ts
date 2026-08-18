import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '../interfaces/response.interface';

/**
 * Transform Interceptor
 * Wraps all responses in the standard API response format
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        // Binary/file responses (e.g. PDF downloads) must pass through
        // untouched — wrapping them in the JSON envelope below would
        // serialize the internal stream object instead of the file bytes.
        if (data instanceof StreamableFile) {
          return data as unknown as ApiResponse<T>;
        }

        // If response is already in our format (has 'data' key from controller), use it
        // Otherwise wrap the entire response

        const statusCode = response.statusCode || 200;

        // Check if the controller returned our expected format
        if (data && typeof data === 'object') {
          // If it has 'data' and 'pagination' keys, it's already formatted
          if ('data' in data && 'pagination' in data) {
            return {
              status: statusCode,
              message: data.message || 'Success',
              timestamp: new Date().toISOString(),
              path: request.url,
              data: data.data,
              pagination: data.pagination,
              meta: data.meta || {},
            };
          }

          // If it has 'data' key but no pagination (single item response)
          if ('data' in data) {
            return {
              status: statusCode,
              message: data.message || 'Success',
              timestamp: new Date().toISOString(),
              path: request.url,
              data: data.data,
              meta: data.meta || {},
            };
          }
        }

        // Default: wrap the entire response as data
        return {
          status: statusCode,
          message: 'Success',
          timestamp: new Date().toISOString(),
          path: request.url,
          data: data,
          meta: {},
        };
      }),
    );
  }
}
