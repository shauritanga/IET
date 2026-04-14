import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { UserEntity } from '../user/entities/user.entity';
import { RegistrationEntity } from '../registration/entities/registration.entity';
import { MembershipFeeEntity } from '../membership/entities/membership-fee.entity';
import { EventEntity, EventRegistrationEntity } from '../events/entities';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { UserModule } from '../user/user.module';
import { GuestModule } from '../guest/guest.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RegistrationEntity,
      MembershipFeeEntity,
      EventEntity,
      EventRegistrationEntity,
      PaymentEntity,
    ]),
    UserModule,
    forwardRef(() => GuestModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
