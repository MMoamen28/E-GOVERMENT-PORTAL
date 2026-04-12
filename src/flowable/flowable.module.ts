import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FlowableService } from './flowable.service';

@Module({
  imports: [ConfigModule],
  providers: [FlowableService],
  exports: [FlowableService],
})
export class FlowableModule {}
