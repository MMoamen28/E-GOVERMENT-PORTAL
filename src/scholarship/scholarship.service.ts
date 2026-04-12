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
import { ZenEngine } from '@gorules/zen-engine';
import * as fs from 'fs/promises';
import * as path from 'path';

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
    // Validate name through GoRules service
    const validation = this.goRulesService.validateName(
      dto.firstName,
      dto.lastName,
    );

    // Call GoRules API for levels rule locally
    const { scholarshipLevel, discount } = await this.evaluateLevelsRule(dto);

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
      income: dto.income,
      achievements: dto.achievements,
      scholarshipLevel,
      discount,
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

  /** Evaluates GoRules levels using ZenEngine locally */
  private async evaluateLevelsRule(dto: SubmitScholarshipDto): Promise<{ scholarshipLevel: string; discount: number }> {
    try {
      const engine = new ZenEngine();
      const rulesPath = path.join(process.cwd(), 'rules', 'scholarship');
      const ruleContent = await fs.readFile(rulesPath);
      const decision = engine.createDecision(ruleContent);

      const response = await decision.evaluate({
        GPA: dto.gpa,
        Income: dto.income,
        Achievements: dto.achievements,
      });

      const scholarshipLevel = response.result?.ScholarshipLevel || 'NONE';
      const discount = parseInt(response.result?.Discount || '0', 10);

      return { scholarshipLevel, discount };
    } catch (e) {
      console.error('Failed to evaluate rules/scholarship:', e);
      return { scholarshipLevel: 'NONE', discount: 0 };
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
