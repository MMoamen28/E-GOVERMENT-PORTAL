import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { ScholarshipService } from './scholarship.service';

@ApiTags('scholarship')
@ApiBearerAuth('access-token')
@Controller('scholarship')
@UseGuards(RolesGuard)
@Roles('applicant', 'officer', 'admin', 'scholarship_level_admin')
export class ScholarshipController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Submit a scholarship application' })
  @ApiResponse({ status: 201, description: 'Application created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (missing or invalid JWT).' })
  async apply(@Body() dto: SubmitApplicationDto) {
    return this.scholarshipService.submitApplication(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all scholarship applications' })
  @ApiResponse({ status: 200, description: 'List of scholarship applications.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (missing or invalid JWT).' })
  async list() {
    return this.scholarshipService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one scholarship application by ID' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'The scholarship application.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (missing or invalid JWT).' })
  @ApiResponse({ status: 404, description: 'Application not found.' })
  async getOne(@Param('id') id: string) {
    return this.scholarshipService.findOne(id);
  }
}
