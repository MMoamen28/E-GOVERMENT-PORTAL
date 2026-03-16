import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EvaluatePolicyDto, PoliciesService } from './policies.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('policies')
@UseGuards(RolesGuard)
@Roles('applicant', 'officer', 'admin')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post('evaluate')
  evaluate(@Body() dto: EvaluatePolicyDto) {
    return this.policiesService.evaluatePolicy(dto);
  }
}
