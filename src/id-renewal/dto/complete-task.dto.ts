import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteTaskDto {
  @ApiProperty({ description: 'Approval decision', example: true })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({
    description: 'Reason for rejection (required when approved is false)',
    example: 'Incomplete documentation',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
