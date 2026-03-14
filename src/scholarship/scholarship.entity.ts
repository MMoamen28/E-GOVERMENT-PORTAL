import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('scholarship_applications')
export class ScholarshipApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicantId: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  gpa: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  income: number;

  @Column({ default: false })
  achievements: boolean;

  /** From GoRules levels rule (e.g. LEVEL_1, LEVEL_2, LEVEL_3) */
  @Column({ nullable: true })
  scholarshipLevel: string;

  /** From GoRules priority rule (e.g. 0–100) */
  @Column({ type: 'int', nullable: true })
  priorityScore: number;

  /** From GoRules doc validation */
  @Column({ type: 'boolean', nullable: true })
  documentsValid: boolean;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  /** Flowable process instance id when workflow is started */
  @Column({ nullable: true })
  processInstanceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
