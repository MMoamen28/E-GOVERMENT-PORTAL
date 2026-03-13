import { Module } from '@nestjs/common';
import { IdRenewalController } from './id-renewal.controller';
import { IdRenewalService } from './id-renewal.service';
import { GoRulesModule } from '../gorules/gorules.module';

@Module({
  imports: [GoRulesModule],
  controllers: [IdRenewalController],
  providers: [IdRenewalService],
})
export class IdRenewalModule {}
