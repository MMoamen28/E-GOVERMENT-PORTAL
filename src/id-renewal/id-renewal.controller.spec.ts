import { Test, TestingModule } from '@nestjs/testing';
import { IdRenewalController } from './id-renewal.controller';
import { IdRenewalService } from './id-renewal.service';
import { GoRulesService } from '../gorules/gorules.service';

describe('IdRenewalController', () => {
  let controller: IdRenewalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdRenewalController],
      providers: [
        IdRenewalService,
        {
          provide: GoRulesService,
          useValue: {
            validateName: jest.fn().mockResolvedValue({
              status: 'ACCEPT',
              reason: 'Name is valid',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<IdRenewalController>(IdRenewalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should submit a renewal request successfully', async () => {
    const dto = {
      firstName: 'John',
      lastName: 'Doe',
      nationalId: 'EG-1234567890',
    };
    const result = await controller.submitRequest(dto);
    expect(result.status).toBe('PENDING');
    expect(result.firstName).toBe('John');
  });
});
