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
import { ZenEngine } from '@gorules/zen-engine';
import * as fs from 'fs/promises';
import * as path from 'path';

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
   * 1. Validate policies (seasonal window, student status, 1 per year).
   * 2. Status is always SUBMITTED so an officer can move it to UNDER_REVIEW then APPROVE/REJECT (rules/application_status).
   * 3. Rules run for level, priority, document reason, and eligibility note (stored as reason for officer only).
   */
  async submitApplication(
    dto: SubmitApplicationDto,
  ): Promise<ScholarshipApplication> {
    // Single eligibility check using rules/eligibility_policy (isStudent, applicationsThisYear, applicationDate)
    const policyResult = await this.policiesService.evaluatePolicy({
      applicantId: dto.applicantId,
      isStudent: dto.isStudent,
    });

    if (!policyResult.eligible) {
      throw new BadRequestException(`Policy rejection: ${policyResult.reason}`);
    }

    const [priorityScore, scholarshipLevel, docStatus] = await Promise.all([
      this.evaluatePriority(dto),
      this.evaluateLevels(dto),
      this.evaluateDocValidation(dto),
    ]);

    const reasonParts: string[] = [];
    if (docStatus.reason && docStatus.reason !== '-' && !docStatus.valid) {
      reasonParts.push(this.normalizeReason(docStatus.reason));
    }
    // Eligibility reason from policy (rules/eligibility_policy) – only store when not "-"
    if (policyResult.reason && policyResult.reason !== '-') {
      reasonParts.push(this.normalizeReason(policyResult.reason));
    }
    const reason = reasonParts.length > 0 ? reasonParts.join('. ') : null;

    return this.saveApplication(dto, {
      status: ApplicationStatus.SUBMITTED,
      documentsValid: docStatus.valid,
      reason: reason ?? undefined,
      priorityScore,
      scholarshipLevel,
    });
  }

  private normalizeReason(r: string): string {
    if (!r || typeof r !== 'string') return '';
    return r.replace(/^"|"$/g, '').trim();
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
      const ruleContent = await fs.readFile(rulesPath, 'utf-8');
      const decision = engine.createDecision(JSON.parse(ruleContent) as object);
      console.log(`Evaluating ruleset: ${rulesetName} with input:`, JSON.stringify(input));
      const { result } = await decision.evaluate(input);
      console.log(`Ruleset: ${rulesetName} result:`, JSON.stringify(result));
      return result;
    } catch (e) {
      console.error(`Failed to evaluate ruleset ${rulesetName}:`, e);
      return null;
    }
  }

  private async evaluateDocValidation(dto: SubmitApplicationDto) {
    const res = await this.evaluateRuleset('document_validation', {
      hasID: dto.hasID ?? false,
      IDValid: dto.hasID ?? false,
      hasIncomeDoc: dto.hasIncomeDoc ?? false,
      hasStudentCert: dto.hasStudentCert ?? false,
      hasFamilyStatus: dto.hasFamilyStatus ?? false,
    });
    const reason = res?.reason ? String(res.reason).replace(/^"|"$/g, '').trim() : null;
    return {
      valid: reason === '-' || reason === null || reason === '',
      reason: reason === '-' ? null : reason,
    };
  }

  private async evaluatePriority(dto: SubmitApplicationDto): Promise<number> {
    const res = await this.evaluateRuleset('priority_rules', {
      income: dto.income ?? 0,
      orphan: dto.isOrphan ?? false,
      GPA: dto.gpa ?? 0,
      applicationDate: new Date().toISOString().split('T')[0],
    });
    const fromRule = parseInt(String(res?.priorityScore ?? res?.priority ?? '').trim() || '0', 10);
    if (fromRule > 0) return Math.min(100, fromRule);
    return Math.min(
      100,
      Math.round((dto.gpa ?? 0) * 20) + (dto.isOrphan ? 10 : 0) + (dto.achievements ? 5 : 0),
    );
  }

  private async evaluateLevels(dto: SubmitApplicationDto): Promise<string> {
    const res = await this.evaluateRuleset('scholarship', {
      GPA: dto.gpa ?? 0,
      Income: dto.income ?? 0,
      Achievements: dto.achievements ?? false,
    });
    const level = (res?.ScholarshipLevel ?? res?.scholarshipLevel ?? '').replace(/^"|"$/g, '').trim();
    if (level && level !== 'NONE') return level;
    const g = dto.gpa ?? 0;
    const inc = dto.income ?? 0;
    if (g >= 3.8 && inc <= 2000) return 'LEVEL_3';
    if (g >= 3.5 && inc <= 4000) return 'LEVEL_2';
    if (g >= 3.0 && inc <= 6000) return 'LEVEL_1';
    return 'NONE';
  }

  async findAll(): Promise<ScholarshipApplication[]> {
    return this.applicationRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<ScholarshipApplication | null> {
    return this.applicationRepo.findOne({ where: { id } });
  }

  async updateStatus(
    id: string,
    action: StatusAction,
    reason?: string,
  ): Promise<ScholarshipApplication> {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) throw new NotFoundException(`Application ${id} not found`);
    const nextStatus = getNextStatusFromRule(application.status, action);
    if (nextStatus == null) {
      throw new BadRequestException(`Invalid status transition: ${action} from ${application.status}`);
    }
    application.status = nextStatus;
    if (nextStatus === ApplicationStatus.REJECTED && reason?.trim()) {
      application.reason = reason.trim();
    }
    return this.applicationRepo.save(application);
  }
}
