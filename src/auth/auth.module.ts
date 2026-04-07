import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { KeycloakStrategy } from './keycloak.strategy';
import { ConfigModule } from '@nestjs/config';
import authConfig from './auth.config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [KeycloakStrategy, JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
