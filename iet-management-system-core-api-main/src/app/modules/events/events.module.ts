import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { EventEntity, EventRegistrationEntity } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, EventRegistrationEntity])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
