import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CompleteBusinessLicenseTaskDto {
  @ApiProperty({
    description: 'Approval decision',
    example: 'APPROVED',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['APPROVED', 'REJECTED'])
  action: 'APPROVED' | 'REJECTED';

  @ApiProperty({ description: 'Flowable task ID' })
  @IsString()
  @IsNotEmpty()
  taskId: string;
}
