import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '../../../common/enums';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.SECRETARIAT,
      UserRole.EVALUATOR,
      UserRole.MPDC,
      UserRole.COUNCIL,
      UserRole.REVIEWER,
    ].includes(user.role);
  }
}
