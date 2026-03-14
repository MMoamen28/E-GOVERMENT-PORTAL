import { FlowableService } from './flowable.service';
import { HttpException } from '@nestjs/common';

describe('FlowableService', () => {
  let service: FlowableService;

  beforeEach(() => {
    service = new FlowableService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw exception when flowable is unavailable', async () => {
    jest
      .spyOn(service as any, 'startRenewalProcess')
      .mockRejectedValue(
        new HttpException('Flowable workflow service unavailable', 503),
      );

    await expect(
      service.startRenewalProcess('123', 'John', 'Doe', 'EG-123'),
    ).rejects.toThrow(HttpException);
  });
});
