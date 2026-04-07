import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'applicant1',
    description: 'National ID or Username',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'test123', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
