import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Policy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  policyName: string;

  @Column()
  minGpa: number;

  @Column()
  maxIncome: number;

  @Column()
  scholarshipLevel: string;
}
