import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface NameValidationResult {
  status: 'ACCEPT' | 'REJECT';
  reason: string;
}

@Injectable()
export class GoRulesService {
  private readonly goRulesUrl =
    process.env.GORULES_URL || 'http://localhost:8090';

  async validateName(
    firstName: string,
    lastName: string,
  ): Promise<NameValidationResult> {
    try {
      const response = await axios.post<NameValidationResult>(
        `${this.goRulesUrl}/api/v1/evaluate/name-check`,
        { firstName, lastName },
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Name validation service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
