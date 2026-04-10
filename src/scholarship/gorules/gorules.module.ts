import { Module } from '@nestjs/common';
import { GoRulesService } from './gorules.service';

@Module({
  providers: [GoRulesService],
  exports: [GoRulesService], // allow other modules to use it
})
export class GoRulesModule {}
