import {
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class AuthenticationGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(AuthenticationGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest(err, user, info: Error) {
    if (err || info) {
      if (info instanceof TokenExpiredError) {
        this.logger.debug(`Token expired: ${info.message}`);
        throw new HttpException(
          'Your session has expired. Please login again.',
          401,
        );
      } else if (info instanceof JsonWebTokenError) {
        this.logger.debug(`JWT error: ${info.message}`);
        throw new HttpException('Invalid authentication token.', 401);
      } else {
        this.logger.debug(
          `Authentication error: ${info?.message || err?.message}`,
        );
        throw new HttpException('Authentication failed.', 401);
      }
    }

    if (!user) {
      throw new UnauthorizedException(
        'Access denied. Please login to continue.',
      );
    }

    return user;
  }
}
