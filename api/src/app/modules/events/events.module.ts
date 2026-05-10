import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { EventEntity, EventRegistrationEntity } from './entities';
import { UserEntity } from '../user/entities/user.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      EventRegistrationEntity,
      UserEntity,
    ]),
    PaymentsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
