import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScholarshipApplication,
  ApplicationStatus,
} from './scholarship.entity';
import { getNextStatusFromRule } from './application-status.rules';
import { StatusAction } from './dto/update-status.dto';

import { SubmitApplicationDto } from './dto/submit-application.dto';

import { PoliciesService } from '../policies/policies.service';

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(ScholarshipApplication)
    private readonly applicationRepo: Repository<ScholarshipApplication>,
    private readonly policiesService: PoliciesService,
  ) {}

  /**
   * Submit a scholarship application.
   * 1. Validate policies (GoRules + DB check)
   * 2. Call GoRules (levels, priority, docvalidation)
   * 3. Save to PostgreSQL
   */
  async submitApplication(
    dto: SubmitApplicationDto,
  ): Promise<ScholarshipApplication> {
    // 1. Enforce Policies (Seasonal window, student status, 1 per year)
    // For this demonstration, we assume information is available. In a real app,
    // isStudent would come from a verified profile or document check.
    const policyResult = await this.policiesService.evaluatePolicy({
      applicantId: dto.applicantId,
      isStudent: dto.isStudent,
    });

    if (!policyResult.eligible) {
      throw new BadRequestException(`Policy rejection: ${policyResult.reason}`);
    }

    // 2. Call GoRules API for levels rule (gorules/levels)
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

  /**
   * Update application status via action (start_review, approve, reject).
   * Transition is validated against rules/application_status (appstatus ruleset).
   * Only officer/admin should call this (enforced by controller @Roles).
   */
  async updateStatus(
    id: string,
    action: StatusAction,
  ): Promise<ScholarshipApplication> {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application ${id} not found`);
    }

    const nextStatus = getNextStatusFromRule(application.status, action);
    if (nextStatus == null) {
      throw new BadRequestException(
        `Invalid status transition: cannot perform '${action}' from '${application.status}'. ` +
          'Allowed: SUBMITTED→start_review→UNDER_REVIEW; UNDER_REVIEW→approve→APPROVED or reject→REJECTED.',
      );
    }

    application.status = nextStatus;
    return this.applicationRepo.save(application);
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
    _dto: SubmitApplicationDto,
  ): Promise<number> {
    // Example; replace with GoRules
    return Math.min(
      100,
      Math.round(_dto.gpa * 20) + (_dto.achievements ? 10 : 0),
    );
  }

  /** Placeholder: replace with actual GoRules API call for document validation */
  private async evaluateDocValidationRule(
    _dto: SubmitApplicationDto,
  ): Promise<boolean> {
    // Example; replace with GoRules
    return true;
  }
}
