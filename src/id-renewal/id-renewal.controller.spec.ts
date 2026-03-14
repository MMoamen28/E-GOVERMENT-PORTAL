import { Test, TestingModule } from '@nestjs/testing';
import { IdRenewalController } from './id-renewal.controller';
import { IdRenewalService } from './id-renewal.service';
import { GoRulesService } from '../gorules/gorules.service';
import { FlowableService } from '../flowable/flowable.service';

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
        {
          provide: FlowableService,
          useValue: {
            startRenewalProcess: jest.fn().mockResolvedValue({
              processInstanceId: 'test-123',
              processDefinitionKey: 'id-renewal-process',
              status: 'running',
            }),
            deployProcess: jest.fn().mockResolvedValue(undefined),
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

  it('should deploy process successfully', async () => {
    const result = await controller.deployProcess();
    expect(result.message).toBe('Process deployed successfully');
  });

  it('should return all requests', () => {
    const result = controller.findAll();
    expect(Array.isArray(result)).toBe(true);
  });
});