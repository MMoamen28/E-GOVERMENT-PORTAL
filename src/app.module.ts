import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GoRulesModule } from './gorules/gorules.module';
import { IdRenewalModule } from './id-renewal/id-renewal.module';
import { FlowableModule } from './flowable/flowable.module';
import { AuthApiModule } from './auth-api/auth-api.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: 5432,
      username: process.env.DB_USER || 'egov_user',
      password: process.env.DB_PASSWORD || 'egov_pass',
      database: process.env.DB_NAME || 'egov_db',
      autoLoadEntities: true,
      synchronize: true, // Only for dev
    }),
    AuthModule,
    GoRulesModule,
    IdRenewalModule,
    FlowableModule,
    AuthApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
