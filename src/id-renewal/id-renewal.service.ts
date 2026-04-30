import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoRulesService } from '../gorules/gorules.service';
import { FlowableService, FlowableTask } from '../flowable/flowable.service';
import { CreateRenewalDto } from './dto/create-renewal.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { RenewalRequestEntity } from './renewal-request.entity';

@Injectable()
export class IdRenewalService {
  constructor(
    @InjectRepository(RenewalRequestEntity)
    private readonly renewalRepository: Repository<RenewalRequestEntity>,
    private readonly goRulesService: GoRulesService,
    private readonly flowableService: FlowableService,
  ) {}

  async deployProcess(): Promise<void> {
    await this.flowableService.deployProcess();
  }

  async submitRequest(
    dto: CreateRenewalDto,
    citizenId: string,
  ): Promise<RenewalRequestEntity> {
    const validation = this.goRulesService.validateName(
      dto.firstName,
      dto.lastName,
    );

    if (validation.status === 'REJECT') {
      throw new UnprocessableEntityException(validation.reason);
    }

    const request = this.renewalRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      nationalId: dto.nationalId,
      citizenId,
      status: 'PENDING',
    });

    const saved = await this.renewalRepository.save(request);

    try {
      const process = await this.flowableService.startRenewalProcess(
        saved.id,
        saved.firstName,
        saved.lastName,
        saved.nationalId,
      );
      saved.workflowId = process.id;
      saved.flowableProcessInstanceId = process.id;
      await this.renewalRepository.save(saved);
    } catch {
      saved.workflowId = 'workflow-unavailable';
      await this.renewalRepository.save(saved);
    }

    return saved;
  }

  async findAll(): Promise<RenewalRequestEntity[]> {
    return this.renewalRepository.find();
  }

  async findOne(id: string): Promise<RenewalRequestEntity> {
    const request = await this.renewalRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Renewal request '${id}' not found`);
    }
    return request;
  }

  async getMyRequests(citizenId: string): Promise<RenewalRequestEntity[]> {
    return this.renewalRepository.find({
      where: { citizenId },
      order: { submittedAt: 'DESC' },
    });
  }

  async getSupervisorTasks(): Promise<FlowableTask[]> {
    return this.flowableService.getSupervisorTasks();
  }

  async completeTask(
    taskId: string,
    dto: CompleteTaskDto,
  ): Promise<RenewalRequestEntity> {
    const task = await this.flowableService.getTaskById(taskId);

    const request = await this.renewalRepository.findOne({
      where: { workflowId: task.processInstanceId },
    });

    if (!request) {
      throw new NotFoundException(
        'No renewal request found for this workflow task',
      );
    }

    await this.flowableService.completeTask(taskId, dto.approved);

    request.status = dto.approved ? 'APPROVED' : 'REJECTED';
    request.rejectionReason = dto.reason ?? null;
    return this.renewalRepository.save(request);
  }
}
