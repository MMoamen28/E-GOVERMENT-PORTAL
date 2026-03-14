import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { IdRenewalService } from './id-renewal.service';
import { CreateRenewalDto } from './dto/create-renewal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('ID Renewal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('id-renewal')
export class IdRenewalController {
  constructor(private readonly idRenewalService: IdRenewalService) {}

  @Post('deploy')
  @Roles('admin')
  @ApiOperation({ summary: 'Deploy ID renewal BPMN process (admin only)' })
  @ApiResponse({ status: 201, description: 'Process deployed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Failed to deploy process' })
  async deployProcess() {
    await this.idRenewalService.deployProcess();
    return { message: 'Process deployed successfully' };
  }

  @Post()
  @Roles('citizen')
  @ApiOperation({ summary: 'Submit a new ID renewal request' })
  @ApiResponse({ status: 201, description: 'Request submitted successfully' })
  @ApiResponse({ status: 422, description: 'Name validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitRequest(@Body() dto: CreateRenewalDto) {
    return this.idRenewalService.submitRequest(dto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all renewal requests (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all requests' })
  findAll() {
    return this.idRenewalService.findAll();
  }

  @Get(':id')
  @Roles('citizen', 'admin', 'supervisor')
  @ApiOperation({ summary: 'Get a specific renewal request by ID' })
  @ApiResponse({ status: 200, description: 'Request found' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  findOne(@Param('id') id: string) {
    return this.idRenewalService.findOne(id);
  }
}
