import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionService } from './services/encryption.service';
import { PermissionsService } from './permissions/permissions.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { UserEntity } from '../modules/user/entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [EncryptionService, PermissionsService, PermissionsGuard],
  exports: [
    EncryptionService,
    PermissionsService,
    PermissionsGuard,
    TypeOrmModule,
  ],
})
export class CommonModule {}
