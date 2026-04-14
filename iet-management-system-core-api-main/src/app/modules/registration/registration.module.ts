import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from './controllers/registration.controller';
import { RegistrationService } from './services/registration.service';
import {
  RegistrationEntity,
  EducationEntity,
  ProfessionalExperienceEntity,
  DocumentEntity,
  ReferenceEntity,
} from './entities';
import { UserEntity } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistrationEntity,
      EducationEntity,
      ProfessionalExperienceEntity,
      DocumentEntity,
      ReferenceEntity,
      UserEntity,
    ]),
    UserModule,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
