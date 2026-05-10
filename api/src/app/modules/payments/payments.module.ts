import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { PaymentEntity } from './entities/payment.entity';
import { UserEntity } from '../user/entities/user.entity';
import { RegistrationEntity } from '../registration/entities';
import { EventRegistrationEntity } from '../events/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, UserEntity, RegistrationEntity, EventRegistrationEntity]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
