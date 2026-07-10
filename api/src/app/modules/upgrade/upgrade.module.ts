import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpgradeService } from './services/upgrade.service';
import { UpgradeMemberController } from './controllers/upgrade-member.controller';
import { UpgradeAdminController } from './controllers/upgrade-admin.controller';
import { UpgradeRuleEntity } from './entities/upgrade-rule.entity';
import { UpgradeApplicationEntity } from './entities/upgrade-application.entity';
import { UserEntity } from '../user/entities/user.entity';
import { MembershipCategoryEntity } from '../admin/entities/membership-category.entity';
import { EventRegistrationEntity } from '../events/entities/event-registration.entity';
import { RegistrationEntity } from '../registration/entities/registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UpgradeRuleEntity,
      UpgradeApplicationEntity,
      UserEntity,
      MembershipCategoryEntity,
      EventRegistrationEntity,
      RegistrationEntity,
    ]),
  ],
  controllers: [UpgradeMemberController, UpgradeAdminController],
  providers: [UpgradeService],
  exports: [UpgradeService],
})
export class UpgradeModule {}
