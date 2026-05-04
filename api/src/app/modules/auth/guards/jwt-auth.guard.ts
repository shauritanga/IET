import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Always run the JWT strategy so request.user is populated for authenticated
    // users even on public routes. handleRequest decides whether to enforce auth.
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Never reject public routes — return the user if the token was valid,
      // otherwise return undefined so the handler receives an optional user.
      return user || undefined;
    }

    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
