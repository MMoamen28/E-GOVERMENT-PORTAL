import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class SubmitScholarshipDto {
  @ApiProperty({ example: 'John', description: 'First name of the citizen' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the citizen' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'EG-1234567890', description: 'National ID number' })
  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @ApiProperty({ example: 'Cairo University', description: 'University name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  university: string;

  @ApiProperty({ example: 3.5, description: 'GPA (0-4.0)' })
  @IsNumber()
  @Min(0)
  @Max(4.0)
  gpa: number;

  @ApiProperty({ example: 5000, description: 'Monthly family income' })
  @IsNumber()
  @Min(0)
  income: number;

  @ApiProperty({ example: true, description: 'Has extracurricular achievements' })
  achievements: boolean;
}
