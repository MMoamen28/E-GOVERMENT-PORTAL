import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('renewal_requests')
export class RenewalRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  nationalId: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: string;

  @Column({ nullable: true })
  workflowId: string | null;

  @Column({ nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
