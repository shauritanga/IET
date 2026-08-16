import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipController } from './controllers/membership.controller';
import { MembershipService } from './services/membership.service';
import { MembershipCardService } from './services/membership-card.service';
import { MembershipFeeEntity } from './entities/membership-fee.entity';
import { MembershipCardEntity } from './entities/membership-card.entity';
import { UserEntity } from '../user/entities/user.entity';
import { MembershipCategoryEntity } from '../admin/entities/membership-category.entity';
import { SystemSettingEntity } from '../admin/entities/system-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MembershipFeeEntity,
      MembershipCardEntity,
      UserEntity,
      MembershipCategoryEntity,
      SystemSettingEntity,
    ]),
  ],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipCardService],
  exports: [MembershipService, MembershipCardService],
})
export class MembershipModule {}
