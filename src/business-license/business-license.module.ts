import { Module } from '@nestjs/common';
import { GoRulesService } from './gorules.service';
import { FlowableService } from './flowable.service';

@Module({
  providers: [GoRulesService, FlowableService],
  exports: [GoRulesService, FlowableService],
})
export class BusinessLicenseModule {}