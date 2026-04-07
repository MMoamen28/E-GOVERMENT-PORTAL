import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict route to users that have at least one of the given realm roles.
 * Use with @UseGuards(AuthGuard('jwt'), RolesGuard).
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
