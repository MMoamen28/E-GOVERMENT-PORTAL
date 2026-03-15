import { Controller } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { Post, Body } from '@nestjs/common';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post('evaluate')
  evaluate(@Body() data: any) {
    return this.policiesService.evaluatePolicy(data.gpa, data.income);
  }
}
