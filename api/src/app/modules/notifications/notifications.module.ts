import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationEntity } from './entities/notification.entity';
import { UserEntity } from '../user/entities/user.entity';
import { RegistrationEntity } from '../registration/entities/registration.entity';
import { DisciplineEntity } from '../admin/entities/discipline.entity';
import { UserDisciplineEntity } from '../user/entities/user-discipline.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      UserEntity,
      RegistrationEntity,
      DisciplineEntity,
      UserDisciplineEntity,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
