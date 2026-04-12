import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitApplicationDto {
  @ApiProperty({ description: 'Keycloak user/subject ID of the applicant' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Grade point average', example: 3.5 })
  @IsNumber()
  gpa: number;

  @ApiProperty({ description: 'Household income', example: 25000 })
  @IsNumber()
  income: number;

  @ApiProperty({
    description: 'Whether the applicant has achievements',
    example: true,
  })
  @IsBoolean()
  achievements: boolean;

  @ApiProperty({ description: 'Orphan status', example: false })
  @IsBoolean()
  isOrphan: boolean;

  @ApiProperty({ description: 'Current student status', example: true })
  @IsBoolean()
  isStudent: boolean;

  @ApiProperty({ description: 'Has ID document provided', example: true })
  @IsBoolean()
  hasID: boolean;

  @ApiProperty({ description: 'Has Income record document', example: true })
  @IsBoolean()
  hasIncomeDoc: boolean;

  @ApiProperty({ description: 'Has student certificate', example: true })
  @IsBoolean()
  hasStudentCert: boolean;

  @ApiProperty({ description: 'Has family status document', example: true })
  @IsBoolean()
  hasFamilyStatus: boolean;

  @ApiProperty({
    description:
      'Optional application date override used for policy evaluation (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  applicationDate?: string;
}
