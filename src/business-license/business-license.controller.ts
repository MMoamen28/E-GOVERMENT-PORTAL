import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BusinessLicenseService } from './business-license.service';
import { CreateBusinessLicenseDto } from './dto/create-business-license.dto';

@Controller('business-licenses')
export class BusinessLicenseController {
  constructor(private readonly licenseService: BusinessLicenseService) {}

  // POST: /business-licenses
  @Post()
  async create(@Body() createDto: CreateBusinessLicenseDto) {
    // Note: We are hardcoding a mock ownerId for now. 
    // In the Keycloak task, we will replace this by extracting the ID from the @Req() token!
    const mockOwnerId = 'user-123-abc'; 
    
    return await this.licenseService.create(createDto, mockOwnerId);
  }

  // GET: /business-licenses
  @Get()
  async findAll() {
    return await this.licenseService.findAll();
  }

  // GET: /business-licenses/uuid-goes-here
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.licenseService.findOne(id);
  }
}