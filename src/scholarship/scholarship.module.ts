import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScholarshipApplication } from './scholarship.entity';
import { ScholarshipService } from './scholarship.service';
import { ScholarshipController } from './scholarship.controller';
import { FlowableModule } from '../flowable/flowable.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScholarshipApplication]),
    FlowableModule,
  ],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService],
})
export class ScholarshipModule {}
