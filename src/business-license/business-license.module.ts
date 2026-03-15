import { Module } from '@nestjs/common';
import { GoRulesService } from './gorules.service';
import { FlowableService } from './flowable.service';
import { FlowableTaskService } from './flowable-task.service';

@Module({
  providers: [GoRulesService, FlowableService, FlowableTaskService],
  exports: [GoRulesService, FlowableService, FlowableTaskService],
})
export class BusinessLicenseModule {}