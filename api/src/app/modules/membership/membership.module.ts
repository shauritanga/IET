import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipController } from './controllers/membership.controller';
import { MembershipService } from './services/membership.service';
import { MembershipFeeEntity } from './entities/membership-fee.entity';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipFeeEntity, UserEntity])],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
