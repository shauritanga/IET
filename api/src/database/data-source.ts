import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import 'dotenv/config';

/**
 * TypeORM configuration for NestJS module
 * Uses ConfigService to load database settings from environment
 */
export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => {
    return {
      type: 'postgres',
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT'),
      username: configService.get<string>('DB_USERNAME'),
      database: configService.get<string>('DB_NAME'),
      password: configService.get<string>('DB_PASSWORD'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: configService.get<string>('DB_SYNC') === 'true', // Only sync when DB_SYNC=true
      logging: configService.get<string>('NODE_ENV') === 'development',
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      migrationsRun: false,
      migrationsTransactionMode: 'each',
    };
  },
};

/**
 * TypeORM data source options for CLI commands
 * Used for migrations and other TypeORM CLI operations
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  entities: ['dist/**/*.entity.js'],
  synchronize: false, // Should be false in production
  logging: process.env.NODE_ENV === 'development',
  migrations: ['dist/database/migrations/*.js'],
  migrationsTransactionMode: 'each',
};

// Data source instance for TypeORM CLI
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
