import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  preferred_username?: string;
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
  exp: number;
  iat: number;
  iss: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const issuer = configService.get<string>('keycloak.issuer');
    const internalUrl = configService.get<string>('keycloak.internalUrl');
    const audience = configService.get<string>('keycloak.audience');
    const jwksUri = configService.get<string>('keycloak.jwksUri');

    console.log('JwtStrategy Config:', { issuer, internalUrl, audience, jwksUri });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Temporarily disabling for Docker debugging
      // ...(audience && audience.trim() ? { audience: audience.trim() } : {}),
      // issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: jwksUri ?? `${internalUrl}/protocol/openid-connect/certs`,
      }),
    });
  }

  validate(payload: JwtPayload) {
    console.log('JwtStrategy Payload:', JSON.stringify(payload));
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    const roles: string[] = payload.realm_access?.roles ?? [];
    return {
      sub: payload.sub,
      username: payload.preferred_username,
      roles,
    };
  }
}
