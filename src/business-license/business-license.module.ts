import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { GoRulesService } from './gorules.service';
import { FlowableService } from './flowable.service';

@Module({
  providers: [GoRulesService, FlowableService],
  exports: [GoRulesService, FlowableService],
})
export class BusinessLicenseModule {}
=======

@Module({})
export class BusinessLicenseModule {}
>>>>>>> origin/Feature/Business-License-Data-and-API-Foundation
