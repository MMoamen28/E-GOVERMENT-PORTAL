import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BusinessLicenseModule } from './business-license/business-license.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'egov_user',
      password: 'egov_password',
      database: 'egov_db',
      autoLoadEntities: true, // Automatically loads your BusinessLicense entity
      synchronize: true, // WARNING: True for development only! Creates tables automatically.
    }),
    BusinessLicenseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}