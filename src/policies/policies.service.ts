import { Injectable } from '@nestjs/common';
import { ZenEngine } from '@gorules/zen-engine';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ScholarshipApplication } from '../scholarship/scholarship.entity';
import * as fs from 'fs';
import * as path from 'path';

export class EvaluatePolicyDto {
  applicantId: string;
  isStudent: boolean;
}

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(ScholarshipApplication)
    private readonly applicationRepo: Repository<ScholarshipApplication>,
  ) {}

  async evaluatePolicy(dto: EvaluatePolicyDto) {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    // 1. Check database for applications this year
    const applicationsThisYearCount = await this.applicationRepo.count({
      where: {
        applicantId: dto.applicantId,
        createdAt: Between(startOfYear, endOfYear),
      },
    });

    // 2. Evaluate with GoRules
    try {
      const engine = new ZenEngine();
      const rulesPath = path.join(process.cwd(), 'rules', 'eligibility_policy');
      if (!fs.existsSync(rulesPath)) {
        console.error(`Rules file not found at: ${rulesPath}`);
        return { eligible: false, reason: 'System error: Policy rules missing' };
      }
      const ruleContent = fs.readFileSync(rulesPath);
      const decision = engine.createDecision(ruleContent);

      console.log('Evaluating policy with input:', {
        isStudent: dto.isStudent,
        applicationsThisYear: applicationsThisYearCount,
        applicationDate: new Date().toISOString().split('T')[0],
      });

      const response = await decision.evaluate({
        isStudent: dto.isStudent,
        applicationsThisYear: applicationsThisYearCount,
        applicationDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      });

      console.log('Policy decision output:', JSON.stringify(response));

      const result = response.result;
      const eligible = result?.eligible === true;
      const reason = result?.reason || (eligible ? 'Eligible' : 'Not eligible');

      return { eligible, reason };
    } catch (e) {
      console.error('Failed to evaluate rules/eligibility_policy:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      return { eligible: false, reason: `Policy evaluation error: ${errorMessage}` };
    }
  }
}
