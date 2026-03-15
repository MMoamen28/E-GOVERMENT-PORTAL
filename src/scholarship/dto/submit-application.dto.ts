import { ApiProperty } from '@nestjs/swagger';

export class SubmitApplicationDto {
  @ApiProperty({ description: 'Keycloak user/subject ID of the applicant' })
  applicantId: string;

  @ApiProperty({ description: 'Grade point average', example: 3.5 })
  gpa: number;

  @ApiProperty({ description: 'Household income', example: 25000 })
  income: number;

  @ApiProperty({ description: 'Whether the applicant has achievements', example: true })
  achievements: boolean;

  @ApiProperty({ description: 'Orphan status', example: false })
  isOrphan: boolean;

  @ApiProperty({ description: 'Current student status', example: true })
  isStudent: boolean;

  @ApiProperty({ description: 'Has ID document provided', example: true })
  hasID: boolean;

  @ApiProperty({ description: 'Has Income record document', example: true })
  hasIncomeDoc: boolean;

  @ApiProperty({ description: 'Has student certificate', example: true })
  hasStudentCert: boolean;

  @ApiProperty({ description: 'Has family status document', example: true })
  hasFamilyStatus: boolean;
}
