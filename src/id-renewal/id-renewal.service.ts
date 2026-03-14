import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { GoRulesService } from '../gorules/gorules.service';
import { FlowableService, FlowableTask } from '../flowable/flowable.service';
import { CreateRenewalDto } from './dto/create-renewal.dto';

export interface RenewalRequest {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  workflowId?: string;
  submittedAt: string;
}

@Injectable()
export class IdRenewalService {
  private requests: RenewalRequest[] = [];

  constructor(
    private readonly goRulesService: GoRulesService,
    private readonly flowableService: FlowableService,
  ) {}

  async deployProcess(): Promise<void> {
    await this.flowableService.deployProcess();
  }

  async submitRequest(dto: CreateRenewalDto): Promise<RenewalRequest> {
    const validation = await this.goRulesService.validateName(
      dto.firstName,
      dto.lastName,
    );

    if (validation.status === 'REJECT') {
      throw new UnprocessableEntityException(validation.reason);
    }

    const request: RenewalRequest = {
      id: Math.random().toString(36).substring(2, 9),
      firstName: dto.firstName,
      lastName: dto.lastName,
      nationalId: dto.nationalId,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    try {
      const process = await this.flowableService.startRenewalProcess(
        request.id,
        request.firstName,
        request.lastName,
        request.nationalId,
      );
      request.workflowId = process.processInstanceId;
    } catch {
      request.workflowId = 'workflow-unavailable';
    }

    this.requests.push(request);
    return request;
  }

  findAll(): RenewalRequest[] {
    return this.requests;
  }

  findOne(id: string): RenewalRequest {
    const request = this.requests.find((r) => r.id === id);
    if (!request) {
      throw new NotFoundException(`Renewal request '${id}' not found`);
    }
    return request;
  }

  async getSupervisorTasks(): Promise<FlowableTask[]> {
    return this.flowableService.getSupervisorTasks();
  }

  async completeTask(
    taskId: string,
    approved: boolean,
  ): Promise<RenewalRequest> {
    // Resolve which local request this task belongs to via processInstanceId
    const task = await this.flowableService.getTaskById(taskId);

    const request = this.requests.find(
      (r) => r.workflowId === task.processInstanceId,
    );
    if (!request) {
      throw new NotFoundException(
        'No renewal request found for this workflow task',
      );
    }

    // Drive the BPMN gateway: approved variable routes to approve/reject path
    await this.flowableService.completeTask(taskId, approved);

    request.status = approved ? 'APPROVED' : 'REJECTED';
    return request;
  }
}
