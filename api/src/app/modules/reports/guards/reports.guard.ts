import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '../../../common/enums';

/**
 * Narrower than AdminGuard: reports surface payment/financial data, so
 * panel-only roles (EVALUATOR, MPDC, COUNCIL, REVIEWER) are excluded.
 */
@Injectable()
export class ReportsGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SECRETARIAT].includes(
      user.role,
    );
  }
}
