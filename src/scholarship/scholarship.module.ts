import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScholarshipApplicationEntity } from './scholarship.entity';
import { ScholarshipService } from './scholarship.service';
import { ScholarshipController } from './scholarship.controller';
import { FlowableModule } from '../flowable/flowable.module';
import { GoRulesModule } from '../gorules/gorules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScholarshipApplicationEntity]),
    FlowableModule,
    GoRulesModule,
  ],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService],
})
export class ScholarshipModule {}
