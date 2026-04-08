import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CompleteScholarshipTaskDto {
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
