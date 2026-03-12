import { Injectable } from '@nestjs/common';
import { GoRulesService } from './gorules/gorules.service';

@Injectable()
export class ScholarshipService {

  constructor(private readonly gorulesService: GoRulesService) {}

  async applyForScholarship(data: any) {
    try {
      const decision = await this.gorulesService.evaluateRules(data);

      return {
        message: "Application evaluated",
        decision: decision
      };
    } catch (error) {
      return {
        message: "Application evaluation failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
