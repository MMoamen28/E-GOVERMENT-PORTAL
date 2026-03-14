import { IsString, IsEnum, IsNumber, Min, IsNotEmpty, MaxLength } from 'class-validator';
import { BusinessCategory } from '../enums/business-category.enum';

export class CreateBusinessLicenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  businessName: string;

  @IsEnum(BusinessCategory, {
    message: 'Business type must be a valid category (e.g., FOOD, RETAIL, TECH)',
  })
  @IsNotEmpty()
  businessType: BusinessCategory;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Capital cannot be negative' })
  @IsNotEmpty()
  declaredCapital: number;

  // Notice we DO NOT include 'status' or 'ownerId' here. 
  // Status defaults to Pending.
  // OwnerId will be securely extracted from the Keycloak JWT token, not trusted from the user's payload!
}