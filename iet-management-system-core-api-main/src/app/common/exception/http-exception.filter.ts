import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message = exception.message;
    let errors: any = null;

    // Handle validation errors
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, any>;
      message = responseObj.message || message;
      errors = responseObj.errors || null;

      // Handle class-validator errors
      if (Array.isArray(responseObj.message)) {
        message = 'Validation failed';
        errors = responseObj.message;
      }
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - ${status}: ${message}`,
      exception.stack,
    );

    response.status(status).json({
      success: false,
      status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      data: null,
      errors,
      meta: {},
    });
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} - ${status}: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      success: false,
      status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      data: null,
      errors: null,
      meta: {},
    });
  }
}
