import { ApiProperty } from '@nestjs/swagger';

export class SubmitApplicationDto {
  @ApiProperty({ description: 'Keycloak user/subject ID of the applicant' })
  applicantId: string;

  @ApiProperty({ description: 'Grade point average', example: 3.5 })
  gpa: number;

  @ApiProperty({ description: 'Household income', example: 25000 })
  income: number;

  @ApiProperty({
    description: 'Whether the applicant has achievements',
    example: true,
  })
  achievements: boolean;

  @ApiProperty({
    description: 'Whether the applicant is a student',
    example: true,
  })
  isStudent: boolean;
}
