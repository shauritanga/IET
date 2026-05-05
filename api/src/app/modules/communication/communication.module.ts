import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationController } from './controllers/communication.controller';
import { CommunicationService } from './services/communication.service';
import {
  CommunicationMessageEntity,
  CommunicationTemplateEntity,
  CommunicationDeliveryEntity,
} from './entities';
import { UserEntity } from '../user/entities/user.entity';
import { MembershipCategoryEntity } from '../admin/entities/membership-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommunicationMessageEntity,
      CommunicationTemplateEntity,
      CommunicationDeliveryEntity,
      UserEntity,
      MembershipCategoryEntity,
    ]),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
