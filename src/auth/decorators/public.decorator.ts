import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public (no JWT required).
 * Use when you want to allow unauthenticated access to specific endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
