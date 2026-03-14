import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { SubmitApplicationDto } from './scholarship.service';
import { ScholarshipService } from './scholarship.service';

@Controller('scholarship')
@UseGuards(RolesGuard)
@Roles('applicant', 'officer', 'admin')
export class ScholarshipController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  @Post('apply')
  async apply(@Body() dto: SubmitApplicationDto) {
    return this.scholarshipService.submitApplication(dto);
  }

  @Get()
  async list() {
    return this.scholarshipService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.scholarshipService.findOne(id);
  }
}
