import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessLicense } from './entities/business-license.entity';
import { CreateBusinessLicenseDto } from './dto/create-business-license.dto';

@Injectable()
export class BusinessLicenseService {
  constructor(
    @InjectRepository(BusinessLicense)
    private readonly licenseRepository: Repository<BusinessLicense>,
  ) {}

  // 1. Submit a new application
  async create(createDto: CreateBusinessLicenseDto, ownerId: string): Promise<BusinessLicense> {
    const newLicense = this.licenseRepository.create({
      ...createDto,
      ownerId, // We inject the ownerId here, keeping it out of the public DTO
    });
    
    return await this.licenseRepository.save(newLicense);
  }

  // 2. Fetch all applications (for Officers/Supervisors)
  async findAll(): Promise<BusinessLicense[]> {
    return await this.licenseRepository.find({
      order: { createdAt: 'DESC' } // Newest applications first
    });
  }

  // 3. Fetch a specific application by ID
  async findOne(id: string): Promise<BusinessLicense> {
    const license = await this.licenseRepository.findOne({ where: { id } });
    
    if (!license) {
      throw new NotFoundException(`Business License with ID ${id} not found.`);
    }
    
    return license;
  }
}