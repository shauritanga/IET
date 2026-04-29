import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { UserEntity } from '../user/entities/user.entity';
import {
  RegistrationEntity,
  ApplicationStageHistoryEntity,
} from '../registration/entities';
import { MembershipFeeEntity } from '../membership/entities/membership-fee.entity';
import { EventEntity, EventRegistrationEntity } from '../events/entities';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { UserModule } from '../user/user.module';
import { GuestModule } from '../guest/guest.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RegistrationEntity,
      ApplicationStageHistoryEntity,
      MembershipFeeEntity,
      EventEntity,
      EventRegistrationEntity,
      PaymentEntity,
    ]),
    UserModule,
    EventsModule,
    NotificationsModule,
    forwardRef(() => GuestModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
