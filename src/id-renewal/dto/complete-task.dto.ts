import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CompleteTaskDto {
  @ApiProperty({ description: 'Approval decision', example: true })
  @IsBoolean()
  approved: boolean;
}
