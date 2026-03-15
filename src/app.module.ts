import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeycloakConnectModule, AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BusinessLicenseModule } from './business-license/business-license.module';

@Module({
  imports: [
    // 1. The full PostgreSQL configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433, // Using the custom port we set earlier!
      username: 'egov_user',
      password: 'egov_password',
      database: 'egov_db',
      autoLoadEntities: true, 
      synchronize: true, 
    }),
    
    // 2. The full Keycloak configuration
    KeycloakConnectModule.register({
      authServerUrl: 'http://localhost:8080', 
      realm: 'egov-realm', 
      clientId: 'nestjs-api', 
      secret: 'Ps2ZYtyPEr9dPVtETvIz4dIgRX6SPVpN', 
    }),
    
    // 3. Your Group's Feature Module
    BusinessLicenseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // These guards lock down the entire application using Keycloak
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule {}