import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScholarshipApplication, ApplicationStatus } from './scholarship.entity';
import { ZenEngine } from '@gorules/zen-engine';
import * as fs from 'fs/promises';
import * as path from 'path';

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
  async submitApplication(dto: SubmitApplicationDto): Promise<ScholarshipApplication> {
    // Call GoRules API for levels rule (gorules/levels)
    const { scholarshipLevel, discount } = await this.evaluateLevelsRule(dto);

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
      discount,
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

  /** Evaluates GoRules levels using ZenEngine locally */
  private async evaluateLevelsRule(dto: SubmitApplicationDto): Promise<{ scholarshipLevel: string; discount: number }> {
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

  /** Placeholder: replace with actual GoRules API call for priority */
  private async evaluatePriorityRule(dto: SubmitApplicationDto): Promise<number> {
    // Example; replace with GoRules
    return Math.min(100, Math.round(dto.gpa * 20) + (dto.achievements ? 10 : 0));
  }

  /** Placeholder: replace with actual GoRules API call for document validation */
  private async evaluateDocValidationRule(dto: SubmitApplicationDto): Promise<boolean> {
    // Example; replace with GoRules
    return true;
  }
}
