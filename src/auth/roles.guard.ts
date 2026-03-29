import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest<{
      user: { realm_access?: { roles?: string[] } };
    }>();

    const userRoles: string[] = user?.realm_access?.roles ?? [];
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
