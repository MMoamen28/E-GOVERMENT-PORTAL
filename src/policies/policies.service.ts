import { Injectable } from '@nestjs/common';

@Injectable()
export class PoliciesService {
  async evaluatePolicy(gpa: number, income: number) {
    if (gpa >= 3.5 && income < 3000) {
      return { scholarshipLevel: 'FULL' };
    }

    if (gpa >= 3.0 && income < 5000) {
      return { scholarshipLevel: 'PARTIAL' };
    }

    return { scholarshipLevel: 'REJECTED' };
  }
}
