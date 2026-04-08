import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoRulesService } from '../gorules/gorules.service';
import { FlowableService, FlowableTask } from '../flowable/flowable.service';
import { SubmitScholarshipDto } from './dto/submit-scholarship.dto';
import { CompleteScholarshipTaskDto } from './dto/complete-scholarship-task.dto';
import { ScholarshipApplicationEntity } from './scholarship.entity';

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(ScholarshipApplicationEntity)
    private readonly scholarshipRepository: Repository<ScholarshipApplicationEntity>,
    private readonly goRulesService: GoRulesService,
    private readonly flowableService: FlowableService,
  ) {}

  async submitRequest(
    dto: SubmitScholarshipDto,
    citizenId: string,
  ): Promise<ScholarshipApplicationEntity> {
    // Validate name through GoRules
    const validation = this.goRulesService.validateName(
      dto.firstName,
      dto.lastName,
    );

    if (validation.status === 'REJECT') {
      throw new UnprocessableEntityException(validation.reason);
    }

    // Create scholarship request
    const request = this.scholarshipRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      nationalId: dto.nationalId,
      university: dto.university,
      gpa: dto.gpa,
      status: 'PENDING',
      citizenId,
    });

    const saved = await this.scholarshipRepository.save(request);

    // Spawn Flowable process
    try {
      const process = await this.flowableService.startProcessInstance(
        'scholarship-process',
        {
          requestId: saved.id,
          firstName: saved.firstName,
          lastName: saved.lastName,
          nationalId: saved.nationalId,
        },
      );
      saved.flowableProcessInstanceId = process.id;
      await this.scholarshipRepository.save(saved);
    } catch {
      // Process unavailable but request is still saved
      saved.flowableProcessInstanceId = 'process-unavailable';
      await this.scholarshipRepository.save(saved);
    }

    return saved;
  }

  async getMyRequests(
    citizenId: string,
  ): Promise<ScholarshipApplicationEntity[]> {
    return this.scholarshipRepository.find({
      where: { citizenId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSupervisorTasks(): Promise<FlowableTask[]> {
    return this.flowableService.getSupervisorTasks();
  }

  async completeTask(
    id: string,
    dto: CompleteScholarshipTaskDto,
  ): Promise<ScholarshipApplicationEntity> {
    const request = await this.scholarshipRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Scholarship request '${id}' not found`);
    }

    // Complete the Flowable task
    try {
      const approved = dto.action === 'APPROVED';
      await this.flowableService.completeTask(dto.taskId, approved);

      request.status = dto.action;
      return this.scholarshipRepository.save(request);
    } catch (error) {
      throw new UnprocessableEntityException(
        'Failed to complete task in workflow',
      );
    }
  }

  async findOne(id: string): Promise<ScholarshipApplicationEntity> {
    const request = await this.scholarshipRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Scholarship request '${id}' not found`);
    }
    return request;
  }

  async findAll(): Promise<ScholarshipApplicationEntity[]> {
    return this.scholarshipRepository.find({ order: { createdAt: 'DESC' } });
  }
}
