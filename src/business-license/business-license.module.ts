import { Module } from '@nestjs/common';
import { GoRulesService } from './gorules.service';


@Module({
  
  providers: [GoRulesService], 
})
export class BusinessLicenseModule {}