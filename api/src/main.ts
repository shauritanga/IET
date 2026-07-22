import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  Logger,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';
import { setupSwagger } from './app/common/docs/swagger';
import { HttpExceptionFilter } from './app/common/exception/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as express from 'express';
import helmet from 'helmet';

declare const module: any;

/**
 * Fail fast if the process is about to start in production with weak or
 * default security-critical configuration. Better to refuse to boot than to
 * silently run an exploitable service.
 */
function assertSecureConfig(config: ConfigService, environment: string) {
  if (environment !== 'production') return;

  const problems: string[] = [];
  const weakDefaults = [
    'replace_this_with_strong_secret_in_production',
    'replace_this_with_strong_refresh_secret_in_production',
    'postgres',
    'changeme',
    'secret',
  ];

  const jwt = config.get<string>('JWT_SECRET') ?? '';
  const jwtRefresh = config.get<string>('JWT_REFRESH_SECRET') ?? '';
  const dbPass = config.get<string>('DB_PASSWORD') ?? '';

  if (jwt.length < 32 || weakDefaults.includes(jwt)) {
    problems.push('JWT_SECRET is missing, too short (<32), or a known default');
  }
  if (jwtRefresh.length < 32 || weakDefaults.includes(jwtRefresh)) {
    problems.push(
      'JWT_REFRESH_SECRET is missing, too short (<32), or a known default',
    );
  }
  if (jwt && jwtRefresh && jwt === jwtRefresh) {
    problems.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }
  if (weakDefaults.includes(dbPass)) {
    problems.push('DB_PASSWORD is a known default');
  }

  if (problems.length) {
    throw new Error(
      `Refusing to start in production with insecure config:\n - ${problems.join(
        '\n - ',
      )}`,
    );
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const { AppModule } = await import('./app/app.module');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get configuration values with defaults
  const port = configService.get<number>('PORT', 3000);
  const environment = configService.get<string>('NODE_ENV', 'development');
  const isProduction = environment === 'production';

  assertSecureConfig(configService, environment);

  // Swagger/API docs must NEVER be served in production (leaks the full API
  // surface). Only enable outside production, and only when not explicitly off.
  const swaggerEnabled =
    !isProduction &&
    String(configService.get('SWAGGER_ENABLED', 'true')) !== 'false';

  // Trust the reverse proxy (nginx) so req.ip / rate limiting see the real
  // client IP from X-Forwarded-For instead of the proxy's socket address.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security headers. For a JSON API + /uploads the defaults are appropriate;
  // relax CSP only where Swagger UI needs it (non-production).
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  const frontendOrigins = configService
    .get<string>(
      'FRONTEND_ORIGINS',
      [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4000',
        'http://127.0.0.1:4000',
        'http://localhost:4100',
        'http://127.0.0.1:4100',
      ].join(','),
    )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const privateNetworkDevOriginPattern =
    /^http:\/\/(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(?::(?:4000|4100|5173))$/;

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Request Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: false,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = validationErrors.map((error) => {
          const constraints = error.constraints
            ? Object.values(error.constraints)
            : [];
          return {
            property: error.property,
            message: constraints.length > 0 ? constraints[0] : 'Invalid value',
            constraints: constraints,
            // Never echo the submitted value in production — it can reflect
            // passwords/PII back into responses and logs.
            ...(isProduction ? {} : { value: error.value }),
          };
        });

        return new BadRequestException({
          message: 'Validation failed',
          errors: errors,
        });
      },
    }),
  );

  // API Prefix
  app.setGlobalPrefix('api/v1', { exclude: ['health', ''] });
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Swagger Documentation
  if (swaggerEnabled) {
    setupSwagger(app);
  }

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        frontendOrigins.includes(origin) ||
        (environment === 'development' &&
          privateNetworkDevOriginPattern.test(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
  });

  await app.listen(port);

  logger.log(`Application is running in ${environment} mode on port ${port}`);
  if (swaggerEnabled) {
    logger.log(
      `API Documentation available at http://localhost:${port}/api/docs`,
    );
  }

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
