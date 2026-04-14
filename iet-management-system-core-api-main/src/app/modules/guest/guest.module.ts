import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestController } from './controllers/guest.controller';
import { GuestService } from './services/guest.service';
import { GuestRegistrationEntity } from './entities/guest-registration.entity';
import { DevelopmentFeeEntity } from './entities/development-fee.entity';
import { EventEntity } from '../events/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GuestRegistrationEntity,
      DevelopmentFeeEntity,
      EventEntity,
    ]),
  ],
  controllers: [GuestController],
  providers: [GuestService],
  exports: [GuestService],
})
export class GuestModule {}
