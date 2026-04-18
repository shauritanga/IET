import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserEntity } from './entities/user.entity';
import { CommonModule } from '../../common/common.module';
import { RegistrationEntity } from '../registration/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RegistrationEntity]), CommonModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
