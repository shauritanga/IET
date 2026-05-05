import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from './controllers/registration.controller';
import { RegistrationService } from './services/registration.service';
import {
  RegistrationEntity,
  ApplicationStageHistoryEntity,
  EducationEntity,
  ProfessionalExperienceEntity,
  DocumentEntity,
  ReferenceEntity,
} from './entities';
import { UserEntity } from '../user/entities/user.entity';
import { EngineeringInstitutionEntity } from '../admin/entities/engineering-institution.entity';
import { UserModule } from '../user/user.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistrationEntity,
      ApplicationStageHistoryEntity,
      EducationEntity,
      ProfessionalExperienceEntity,
      DocumentEntity,
      ReferenceEntity,
      UserEntity,
      EngineeringInstitutionEntity,
    ]),
    UserModule,
    PaymentsModule,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
