/* eslint-disable */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('scholarship_applications')
export class ScholarshipApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  firstName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column({ type: 'varchar' })
  nationalId: string;

  @Column({ type: 'varchar' })
  university: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  gpa: number;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: string; // PENDING, APPROVED, REJECTED

  @Column({ type: 'varchar' })
  citizenId: string;

  @Column({ type: 'varchar', nullable: true })
  flowableTaskId: string | null;

  @Column({ type: 'int', nullable: true })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  income: number;

  @Column({ type: 'boolean', default: false })
  achievements: boolean;

  @Column({ type: 'varchar', nullable: true })
  scholarshipLevel: string;

  @Column({ type: 'int', nullable: true })
  priorityScore: number;

  @Column({ type: 'boolean', nullable: true })
  documentsValid: boolean;

  @Column({ type: 'varchar', nullable: true })
  flowableProcessInstanceId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
