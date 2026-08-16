import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PERMISSION_KEY,
  RequiredPermission,
} from '../decorators/require-permission.decorator';
import { UserEntity } from '../../modules/user/entities/user.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { UserRole } from '../enums';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | { id?: string; userId?: string; role?: UserRole }
      | undefined;

    if (!user?.role) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const explicit = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const path: string = request.route?.path
      ? `${request.baseUrl || ''}${request.route.path}`.replace(/\/+/g, '/')
      : request.path || request.url || '';

    const resource =
      explicit?.resource ??
      this.permissionsService.inferResourceFromPath(
        (request.originalUrl || path).split('?')[0],
      );
    const action =
      explicit?.action ??
      this.permissionsService.inferActionFromMethod(
        request.method,
        (request.originalUrl || path).split('?')[0],
      );

    // Routes outside the permission map stay governed by AdminGuard only.
    if (!resource) {
      return true;
    }

    const userId = user.id || user.userId;
    let customPermissions = null;
    if (userId) {
      const dbUser = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'role', 'customPermissions'],
      });
      customPermissions = dbUser?.customPermissions ?? null;
    }

    const effective = this.permissionsService.resolveEffectivePermissions(
      user.role,
      customPermissions,
    );

    request.permissions = effective;

    if (
      !this.permissionsService.hasPermission(effective, resource, action)
    ) {
      throw new ForbiddenException(
        `Missing permission: ${resource}:${action}`,
      );
    }

    return true;
  }
}
