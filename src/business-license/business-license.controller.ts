import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Roles, AuthenticatedUser } from 'nest-keycloak-connect';
import { BusinessLicenseService } from './business-license.service';
import { CreateBusinessLicenseDto } from './dto/create-business-license.dto';

@Controller('business-licenses')
export class BusinessLicenseController {
  constructor(private readonly licenseService: BusinessLicenseService) {}

  // POST: /business-licenses
  @Post()
  @Roles({ roles: ['realm:CITIZEN'] }) // Only Citizens can submit applications
  async create(
    @Body() createDto: CreateBusinessLicenseDto, 
    @AuthenticatedUser() user: any // Keycloak injects the decoded JWT token here!
  ) {
    // We replace the mock ID with the actual User ID (sub) from Keycloak
    const realOwnerId = user.sub; 
    
    return await this.licenseService.create(createDto, realOwnerId);
  }

  // GET: /business-licenses
  @Get()
  @Roles({ roles: ['realm:OFFICER', 'realm:SUPERVISOR'] }) // Only Gov workers can view the list
  async findAll() {
    return await this.licenseService.findAll();
  }

  // GET: /business-licenses/uuid-goes-here
  @Get(':id')
  @Roles({ roles: ['realm:CITIZEN', 'realm:OFFICER', 'realm:SUPERVISOR']}) // Mixed access
  async findOne(@Param('id') id: string, @AuthenticatedUser() user: any) {
    // Future improvement: If user role is CITIZEN, verify user.sub === license.ownerId
    return await this.licenseService.findOne(id);
  }
}