import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ScholarshipService } from './scholarship.service';
import { SubmitScholarshipDto } from './dto/submit-scholarship.dto';
import { CompleteScholarshipTaskDto } from './dto/complete-scholarship-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: Record<string, unknown>;
}

@ApiTags('Scholarship')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scholarship')
export class ScholarshipController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  @Post()
  @Roles('citizen')
  @ApiOperation({ summary: 'Submit a new scholarship request' })
  @ApiResponse({ status: 201, description: 'Request submitted successfully' })
  @ApiResponse({ status: 422, description: 'Name validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitRequest(
    @Body() dto: SubmitScholarshipDto,
    @Request() req: RequestWithUser,
  ) {
    const citizenId = (req.user?.sub as string) || '';
    return this.scholarshipService.submitRequest(dto, citizenId);
  }

  @Get('my-requests')
  @Roles('citizen')
  @ApiOperation({ summary: "Get logged-in citizen's scholarship requests" })
  @ApiResponse({ status: 200, description: "List of citizen's requests" })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyRequests(@Request() req: RequestWithUser) {
    const citizenId = (req.user?.sub as string) || '';
    return this.scholarshipService.getMyRequests(citizenId);
  }

  @Get('supervisor/tasks')
  @Roles('supervisor')
  @ApiOperation({ summary: 'Get all pending supervisor review tasks' })
  @ApiResponse({ status: 200, description: 'List of pending tasks' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSupervisorTasks() {
    return this.scholarshipService.getSupervisorTasks();
  }

  @Patch(':id/complete')
  @Roles('supervisor')
  @ApiOperation({ summary: 'Approve or reject a scholarship request' })
  @ApiResponse({ status: 200, description: 'Task completed, request updated' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeTask(
    @Param('id') id: string,
    @Body() dto: CompleteScholarshipTaskDto,
  ) {
    return this.scholarshipService.completeTask(id, dto);
  }

  @Get(':id')
  @Roles('citizen', 'supervisor')
  @ApiOperation({ summary: 'Get a specific scholarship request by ID' })
  @ApiResponse({ status: 200, description: 'Request found' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  findOne(@Param('id') id: string) {
    return this.scholarshipService.findOne(id);
  }
}
