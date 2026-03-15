import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessLicenseController } from './business-license.controller';
import { BusinessLicenseService } from './business-license.service';
import { BusinessLicense } from './entities/business-license.entity';

@Module({
  // This line gives your service access to the database repository
  imports: [TypeOrmModule.forFeature([BusinessLicense])], 
  controllers: [BusinessLicenseController],
  providers: [BusinessLicenseService],
})
export class BusinessLicenseModule {}