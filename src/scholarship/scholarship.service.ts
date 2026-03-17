import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScholarshipApplication, ApplicationStatus } from './scholarship.entity';
import { getNextStatusFromRule } from './application-status.rules';
import { StatusAction } from './dto/update-status.dto';
import { ZenEngine } from '@gorules/zen-engine';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FlowableService } from '../flowable/flowable.service';

export interface SubmitApplicationDto {
  applicantId: string;
  gpa: number;
  income: number;
  achievements: boolean;
  isOrphan: boolean;
  isStudent: boolean;
  hasID: boolean;
  hasIncomeDoc: boolean;
  hasStudentCert: boolean;
  hasFamilyStatus: boolean;
}

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(ScholarshipApplication)
    private readonly applicationRepo: Repository<ScholarshipApplication>,
    private readonly flowableService: FlowableService,
  ) {}

  /**
   * Submit a scholarship application.
   * Runs prioritized rules: Eligibility -> Doc Validation -> Priority -> Levels
   */
  async submitApplication(dto: SubmitApplicationDto): Promise<ScholarshipApplication> {
    // 1. Calculate Priority Score
    const priorityScore = await this.evaluatePriority(dto);

    // 2. Determine Scholarship Level
    const scholarshipLevel = await this.evaluateLevels(dto);

    // 3. Validate Documents
    const docStatus = await this.evaluateDocValidation(dto);

    // 4. Check Eligibility
    const eligibility = await this.evaluateEligibility(dto);
    
    if (!eligibility.eligible) {
      return this.saveApplication(dto, {
        status: ApplicationStatus.REJECTED,
        reason: eligibility.reason || 'Ineligible based on policy',
        priorityScore,
        scholarshipLevel,
      });
    }

    const savedApp = await this.saveApplication(dto, {
      status: ApplicationStatus.SUBMITTED,
      documentsValid: docStatus.valid,
      reason: (docStatus.reason === '-' || !docStatus.reason) ? null : docStatus.reason,
      priorityScore,
      scholarshipLevel,
    });

    try {
      const processInstance = await this.flowableService.startProcessInstance('scholarshipProcess', {
        applicationId: savedApp.id,
        applicantId: savedApp.applicantId,
        priorityScore: savedApp.priorityScore,
        scholarshipLevel: savedApp.scholarshipLevel,
      });
      savedApp.processInstanceId = processInstance.id;
      return this.applicationRepo.save(savedApp);
    } catch (error) {
      console.error('Failed to start Flowable process:', error);
      // We still return the saved application, but it might not have a process instance id
      return savedApp;
    }
  }

  private async saveApplication(dto: SubmitApplicationDto, extras: Partial<ScholarshipApplication>) {
    const application = this.applicationRepo.create({
      ...dto,
      ...extras,
    });
    return this.applicationRepo.save(application);
  }

  private async evaluateRuleset(rulesetName: string, input: any): Promise<any> {
    try {
      const engine = new ZenEngine();
      const rulesPath = path.join(process.cwd(), 'rules', rulesetName);
      const ruleContent = await fs.readFile(rulesPath);
      const decision = engine.createDecision(ruleContent);
      console.log(`Evaluating ruleset: ${rulesetName} with input:`, JSON.stringify(input));
      const { result } = await decision.evaluate(input);
      console.log(`Ruleset: ${rulesetName} result:`, JSON.stringify(result));
      return result;
    } catch (e) {
      console.error(`Failed to evaluate ruleset ${rulesetName}:`, e);
      return null;
    }
  }

  private async evaluateEligibility(dto: SubmitApplicationDto) {
    // Note: 'applicationsThisYear' is hardcoded for now, would normally be a query
    const res = await this.evaluateRuleset('eligibility_policy', {
      isStudent: dto.isStudent,
      applicationsThisYear: 0,
      applicationDate: new Date().toISOString().split('T')[0],
    });
    return {
      eligible: res?.eligible === true || res?.eligible === 'true',
      reason: res?.reason,
    };
  }

  private async evaluateDocValidation(dto: SubmitApplicationDto) {
    const res = await this.evaluateRuleset('document_validation', {
      hasID: dto.hasID,
      IDValid: dto.hasID, // Assume ID is valid if provided for now
      hasIncomeDoc: dto.hasIncomeDoc,
      hasStudentCert: dto.hasStudentCert,
      hasFamilyStatus: dto.hasFamilyStatus,
    });
    return {
      valid: res?.documentsValid === true || res?.documentsValid === 'true',
      reason: res?.reason,
    };
  }

  private async evaluatePriority(dto: SubmitApplicationDto) {
    const res = await this.evaluateRuleset('priority_rules', {
      income: dto.income,
      orphan: dto.isOrphan,
      GPA: dto.gpa,
      applicationDate: new Date().toISOString().split('T')[0],
    });
    return parseInt(res?.priorityScore || '0', 10);
  }

  private async evaluateLevels(dto: SubmitApplicationDto) {
    const res = await this.evaluateRuleset('scholarship', {
      GPA: dto.gpa,
      Income: dto.income,
      Achievements: dto.achievements,
    });
    return res?.ScholarshipLevel || 'NONE';
  }

  async findAll(): Promise<ScholarshipApplication[]> {
    return this.applicationRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<ScholarshipApplication | null> {
    return this.applicationRepo.findOne({ where: { id } });
  }

  async updateStatus(id: string, action: StatusAction): Promise<ScholarshipApplication> {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) throw new NotFoundException(`Application ${id} not found`);
    const nextStatus = getNextStatusFromRule(application.status, action);
    if (nextStatus == null) {
      throw new BadRequestException(`Invalid status transition: ${action} from ${application.status}`);
    }
    application.status = nextStatus;
    return this.applicationRepo.save(application);
  }
}
