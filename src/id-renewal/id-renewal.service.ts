import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { GoRulesService } from '../gorules/gorules.service';
import { CreateRenewalDto } from './dto/create-renewal.dto';

export interface RenewalRequest {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

@Injectable()
export class IdRenewalService {
  private requests: RenewalRequest[] = [];

  constructor(private readonly goRulesService: GoRulesService) {}

  async submitRequest(dto: CreateRenewalDto): Promise<RenewalRequest> {
    const validation = await this.goRulesService.validateName(
      dto.firstName,
      dto.lastName,
    );

    if (validation.status === 'REJECT') {
      throw new UnprocessableEntityException(validation.reason);
    }

    const request: RenewalRequest = {
      id: Math.random().toString(36).substring(2, 9),
      firstName: dto.firstName,
      lastName: dto.lastName,
      nationalId: dto.nationalId,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    this.requests.push(request);
    return request;
  }

  findAll(): RenewalRequest[] {
    return this.requests;
  }

  findOne(id: string): RenewalRequest | undefined {
    return this.requests.find((r) => r.id === id);
  }
}
