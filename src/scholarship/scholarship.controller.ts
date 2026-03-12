import { Controller, Post, Body } from '@nestjs/common';
import { ScholarshipService } from './scholarship.service';

@Controller('scholarship')
export class ScholarshipController {

  constructor(private readonly scholarshipService: ScholarshipService) {}

  @Post('apply')
  async apply(@Body() data: any) {
    return this.scholarshipService.applyForScholarship(data);
  }

}
