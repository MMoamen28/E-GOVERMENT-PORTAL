import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BusinessLicenseModule } from './business-license/business-license.module';

@Module({
  imports: [BusinessLicenseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
