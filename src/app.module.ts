import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AuthApiModule } from './auth-api/auth-api.module';
import { FlowableModule } from './flowable/flowable.module';
import { GoRulesModule } from './gorules/gorules.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IdRenewalModule } from './id-renewal/id-renewal.module';
import { ScholarshipModule } from './scholarship/scholarship.module';
import { BusinessLicenseModule } from './business-license/business-license.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USER || 'egov_user',
      password: process.env.DB_PASS || 'egov_pass',
      database: process.env.DB_NAME || 'egov_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    AuthApiModule,
    FlowableModule,
    GoRulesModule,
    NotificationsModule,
    IdRenewalModule,
    ScholarshipModule,
    BusinessLicenseModule,
  ],
})
export class AppModule {}
