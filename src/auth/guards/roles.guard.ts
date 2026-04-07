import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.some((role) => user?.roles?.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        `Requires one of these roles: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
