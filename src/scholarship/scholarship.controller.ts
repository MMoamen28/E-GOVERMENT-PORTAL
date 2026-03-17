import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { UpdateStatusDto } from './dto/update-status.dto';
import { ScholarshipService } from './scholarship.service';

@ApiTags('scholarship')
@ApiBearerAuth('access-token')
@Controller('scholarship')
@UseGuards(RolesGuard)
@Roles('applicant', 'officer', 'admin')
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

  @Patch(':id/status')
  @Roles('officer', 'admin')
  @ApiOperation({
    summary: 'Update application status (officer/admin only)',
    description:
      'Performs a status transition validated by rules/application_status: ' +
      'SUBMITTED→start_review→UNDER_REVIEW; UNDER_REVIEW→approve→APPROVED or reject→REJECTED.',
  })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Application with updated status.' })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (missing or invalid JWT).' })
  @ApiResponse({ status: 403, description: 'Forbidden (requires officer or admin role).' })
  @ApiResponse({ status: 404, description: 'Application not found.' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.scholarshipService.updateStatus(id, dto.action, dto.reason);
  }

  @Get(':id/workflow/tasks')
  @Roles('officer', 'admin')
  @ApiOperation({
    summary: 'Get Flowable workflow tasks for an application',
    description: 'Retrieve all pending tasks for the workflow process instance associated with an application.'
  })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'List of workflow tasks.' })
  @ApiResponse({ status: 404, description: 'Application not found or no process instance.' })
  async getWorkflowTasks(@Param('id') id: string) {
    return this.scholarshipService.getApplicationTasks(id);
  }

  @Post(':id/workflow/complete-task')
  @Roles('officer', 'admin')
  @ApiOperation({
    summary: 'Complete a Flowable workflow task',
    description: 'Mark a task as complete with optional variables and update application status.'
  })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Task completed successfully.' })
  @ApiResponse({ status: 404, description: 'Application or task not found.' })
  async completeTask(
    @Param('id') id: string,
    @Body() body: { taskId: string; approvalDecision?: string; reason?: string }
  ) {
    return this.scholarshipService.completeWorkflowTask(id, body.taskId, body.approvalDecision, body.reason);
  }

  @Get(':id/workflow/status')
  @Roles('officer', 'admin')
  @ApiOperation({
    summary: 'Get Flowable workflow process status',
    description: 'Retrieve the current status and variables of the workflow process instance.'
  })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Process instance status.' })
  @ApiResponse({ status: 404, description: 'Application not found or no process instance.' })
  async getWorkflowStatus(@Param('id') id: string) {
    return this.scholarshipService.getProcessStatus(id);
  }
}
