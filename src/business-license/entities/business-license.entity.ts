import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BusinessLicenseStatus } from '../enums/business-license-status.enum';
import { BusinessCategory } from '../enums/business-category.enum';

@Entity('business_licenses') // This is the actual table name in PostgreSQL
export class BusinessLicense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // We need to know which citizen owns this (we will get this from Keycloak later)
  @Column({ name: 'owner_id', type: 'varchar' })
  ownerId: string; 

  @Column({ type: 'varchar', length: 255 })
  businessName: string;

  @Column({ type: 'enum', enum: BusinessCategory })
  businessType: BusinessCategory;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  declaredCapital: number;

  @Column({ 
    type: 'enum', 
    enum: BusinessLicenseStatus, 
    default: BusinessLicenseStatus.PENDING_SUBMISSION 
  })
  status: BusinessLicenseStatus;

  // Enterprise apps always track when records are created and modified
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}