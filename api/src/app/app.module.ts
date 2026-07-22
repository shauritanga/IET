import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SharedModule } from './modules/shared/shared.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { MembershipModule } from './modules/membership/membership.module';
import { EventsModule } from './modules/events/events.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { AdminModule } from './modules/admin/admin.module';
import { GuestModule } from './modules/guest/guest.module';
import { UpgradeModule } from './modules/upgrade/upgrade.module';
import { ReferenceModule } from './modules/reference/reference.module';

import { HealthController } from './controllers/health.controller';
import { RootController } from './controllers/root.controller';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/exception/http-exception.filter';
import configuration from '../config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from '../database/data-source';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HttpExceptionFilter } from './common/exception/http-exception.filter';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import * as Joi from 'joi';

@Module({
  imports: [
    // Environment Configuration
    ConfigModule.forRoot({
      envFilePath: [
        `${process.cwd()}/.env.${process.env.NODE_ENV}`,
        `${process.cwd()}/.env`,
      ],
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_ENABLED: Joi.boolean().default(false),
        DB_HOST: Joi.string().when('DATABASE_ENABLED', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().when('DATABASE_ENABLED', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_PASSWORD: Joi.string().when('DATABASE_ENABLED', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_NAME: Joi.string().when('DATABASE_ENABLED', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('1h'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(10),
        SMTP_HOST: Joi.string().optional().allow(''),
        SMTP_PORT: Joi.number().default(587),
        SMTP_SECURE: Joi.boolean().default(false),
        SMTP_USER: Joi.string().optional().allow(''),
        SMTP_PASS: Joi.string().optional().allow(''),
        APP_URL: Joi.string().default('http://localhost:3000'),
        EMAIL_FROM: Joi.string().default('noreply@iet.or.tz'),
        EMAIL_FROM_NAME: Joi.string().default('IET Tanzania'),
        DO_SPACES_KEY: Joi.string().optional().allow(''),
        DO_SPACES_SECRET: Joi.string().optional().allow(''),
        DO_SPACES_ENDPOINT: Joi.string().optional().allow(''),
        DO_SPACES_REGION: Joi.string().default('us-east-1'),
        DO_SPACES_BUCKET: Joi.string().optional().allow(''),
        DO_SPACES_CDN_URL: Joi.string().optional().allow(''),
        APPLICATION_FEE_GRADUATE: Joi.number().default(5000),
        APPLICATION_FEE_STANDARD: Joi.number().default(10000),
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // @nestjs/throttler v5 expects ttl in milliseconds. THROTTLE_TTL is
          // configured in seconds, so convert it.
          ttl: Number(config.get('THROTTLE_TTL') ?? 60) * 1000,
          limit: Number(config.get('THROTTLE_LIMIT') ?? 100),
        },
      ],
    }),

    // Database - conditionally loaded
    ...conditionalImports(),

    // Common modules
    CommonModule,
    DatabaseModule,

    // Application Modules
    AuthModule,
    UserModule,
    SharedModule,
    RegistrationModule,
    MembershipModule,
    EventsModule,
    PaymentsModule,
    NotificationsModule,
    CommunicationModule,
    AdminModule,
    GuestModule,
    UpgradeModule,
    ReferenceModule,
  ],
  controllers: [HealthController, RootController],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Uncomment to apply authentication globally
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthenticationGuard,
    // },

    // Global Interceptors - Transform response to standard format
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

/**
 * Conditionally import modules based on configuration
 */
function conditionalImports() {
  // Check environment variable directly since the ConfigModule might not be initialized yet
  const databaseEnabled = process.env.DATABASE_ENABLED === 'true';

  return databaseEnabled
    ? [TypeOrmModule.forRootAsync(typeOrmAsyncConfig)]
    : [];
}
