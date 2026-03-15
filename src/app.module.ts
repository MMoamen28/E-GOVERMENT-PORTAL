import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GoRulesModule } from './gorules/gorules.module';
import { IdRenewalModule } from './id-renewal/id-renewal.module';
import { FlowableModule } from './flowable/flowable.module';

@Module({
  imports: [AuthModule, GoRulesModule, IdRenewalModule, FlowableModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
