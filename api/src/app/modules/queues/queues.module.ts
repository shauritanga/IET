import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { config as loadDotenv } from 'dotenv';
import { EMAIL_QUEUE, SMS_QUEUE } from './queue.constants';
import { MessagingQueueService } from './messaging-queue.service';
import { EmailQueueProcessor } from './email.processor';
import { SmsQueueProcessor } from './sms.processor';

// Ensure .env is available before forRoot() reads MESSAGING_QUEUE_ENABLED.
loadDotenv();

@Global()
@Module({})
export class QueuesModule {
  static forRoot(): DynamicModule {
    const queueEnabled = process.env.MESSAGING_QUEUE_ENABLED !== 'false';

    if (!queueEnabled) {
      return {
        module: QueuesModule,
        providers: [MessagingQueueService],
        exports: [MessagingQueueService],
      };
    }

    return {
      module: QueuesModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            connection: {
              host: config.get<string>('REDIS_HOST', 'localhost'),
              port: Number(config.get('REDIS_PORT') ?? 6379),
              password: config.get<string>('REDIS_PASSWORD') || undefined,
              maxRetriesPerRequest: null,
            },
          }),
        }),
        BullModule.registerQueue(
          { name: EMAIL_QUEUE },
          { name: SMS_QUEUE },
        ),
      ],
      providers: [
        MessagingQueueService,
        EmailQueueProcessor,
        SmsQueueProcessor,
      ],
      exports: [MessagingQueueService, BullModule],
    };
  }
}
