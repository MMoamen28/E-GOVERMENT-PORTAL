import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessLicenseController } from './business-license.controller';
import { BusinessLicenseService } from './business-license.service';
import { BusinessLicense } from './entities/business-license.entity';
import { GoRulesService } from './gorules.service';
import { FlowableService } from './flowable.service';
import { FlowableTaskService } from './flowable-task.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessLicense])],
  controllers: [BusinessLicenseController],
  providers: [BusinessLicenseService, GoRulesService, FlowableService, FlowableTaskService],
  exports: [BusinessLicenseService, GoRulesService, FlowableService, FlowableTaskService],
})
export class BusinessLicenseModule {}