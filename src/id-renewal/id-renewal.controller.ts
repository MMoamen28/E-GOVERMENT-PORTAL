import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { IdRenewalService } from './id-renewal.service';
import { CreateRenewalDto } from './dto/create-renewal.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('ID Renewal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('id-renewal')
export class IdRenewalController {
  constructor(private readonly idRenewalService: IdRenewalService) { }

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

  @Get('tasks')
  @Roles('supervisor')
  @ApiOperation({ summary: 'Get all pending supervisor review tasks' })
  @ApiResponse({ status: 200, description: 'List of pending tasks' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSupervisorTasks() {
    return this.idRenewalService.getSupervisorTasks();
  }

  @Post('tasks/:taskId/complete')
  @Roles('supervisor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a renewal request' })
  @ApiResponse({ status: 200, description: 'Task completed, request updated' })
  @ApiResponse({ status: 404, description: 'Task or request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeTask(
    @Param('taskId') taskId: string,
    @Body() dto: CompleteTaskDto,
  ) {
    return this.idRenewalService.completeTask(taskId, dto);
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
