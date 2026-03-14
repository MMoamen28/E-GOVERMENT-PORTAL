import { ApiProperty } from '@nestjs/swagger';

export class CreateRenewalDto {
  @ApiProperty({ example: 'John', description: 'First name of the citizen' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the citizen' })
  lastName: string;

  @ApiProperty({ example: 'EG-1234567890', description: 'National ID number' })
  nationalId: string;
}
