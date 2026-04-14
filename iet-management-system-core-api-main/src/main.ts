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

declare const module: any;

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const { AppModule } = await import('./app/app.module');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get configuration values with defaults
  const port = configService.get<number>('PORT', 3000);
  const environment = configService.get<string>('NODE_ENV', 'development');
  const swaggerEnabled = configService.get<boolean>(
    'SWAGGER_ENABLED',
    environment === 'development',
  );
  const frontendOrigins = configService
    .get<string>(
      'FRONTEND_ORIGINS',
      [
        'http://localhost:4000',
        'http://127.0.0.1:4000',
        'http://localhost:4100',
        'http://127.0.0.1:4100',
      ].join(','),
    )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

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
            value: error.value,
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

  // Swagger Documentation
  if (swaggerEnabled) {
    setupSwagger(app);
  }

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || frontendOrigins.includes(origin)) {
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
