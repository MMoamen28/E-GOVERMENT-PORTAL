import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScholarshipApplication,
  ApplicationStatus,
} from './scholarship.entity';

export interface SubmitApplicationDto {
  applicantId: string;
  gpa: number;
  income: number;
  achievements: boolean;
}

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(ScholarshipApplication)
    private readonly applicationRepo: Repository<ScholarshipApplication>,
  ) {}

  /**
   * Submit a scholarship application.
   * 1. Validate input
   * 2. Call GoRules (levels, priority, docvalidation, policies)
   * 3. Save to PostgreSQL
   * 4. Trigger Flowable workflow (when integrated)
   */
  async submitApplication(
    dto: SubmitApplicationDto,
  ): Promise<ScholarshipApplication> {
    // TODO: Call GoRules API for levels rule (gorules/levels)
    const scholarshipLevel = await this.evaluateLevelsRule(dto);

    // TODO: Call GoRules API for priority rule (gorules/prioritycheck)
    const priorityScore = await this.evaluatePriorityRule(dto);

    // TODO: Call GoRules API for document validation (gorules/docvalidation)
    const documentsValid = await this.evaluateDocValidationRule(dto);

    const application = this.applicationRepo.create({
      applicantId: dto.applicantId,
      gpa: dto.gpa,
      income: dto.income,
      achievements: dto.achievements,
      scholarshipLevel,
      priorityScore,
      documentsValid,
      status: ApplicationStatus.SUBMITTED,
      // processInstanceId: set when Flowable workflow is started
    });

    const saved = await this.applicationRepo.save(application);

    // TODO: Start Flowable process (e.g. scholarship workflow) and set processInstanceId
    // await this.flowableService.startProcess('scholarship', { applicationId: saved.id });

    return saved;
  }

  async findAll(): Promise<ScholarshipApplication[]> {
    return this.applicationRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ScholarshipApplication | null> {
    return this.applicationRepo.findOne({ where: { id } });
  }

  /** Placeholder: replace with actual GoRules HTTP/SDK call for levels */
  private async evaluateLevelsRule(dto: SubmitApplicationDto): Promise<string> {
    // Example logic; replace with GoRules API call
    if (dto.gpa >= 3.8 && dto.income <= 2000) return 'LEVEL_3';
    if (dto.gpa >= 3.5 && dto.income <= 4000) return 'LEVEL_2';
    if (dto.gpa >= 3.0 && dto.income <= 6000) return 'LEVEL_1';
    return 'NONE';
  }

  /** Placeholder: replace with actual GoRules API call for priority */
  private async evaluatePriorityRule(
    dto: SubmitApplicationDto,
  ): Promise<number> {
    // Example; replace with GoRules
    return Math.min(
      100,
      Math.round(dto.gpa * 20) + (dto.achievements ? 10 : 0),
    );
  }

  /** Placeholder: replace with actual GoRules API call for document validation */
  private async evaluateDocValidationRule(
    dto: SubmitApplicationDto,
  ): Promise<boolean> {
    // Example; replace with GoRules
    return true;
  }
}
