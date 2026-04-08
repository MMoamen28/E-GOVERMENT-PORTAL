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

  @Column({ type: 'varchar', nullable: true })
  flowableProcessInstanceId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
