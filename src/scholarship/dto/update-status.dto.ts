import { ApiProperty } from '@nestjs/swagger';

/**
 * Allowed actions for application status transitions.
 * Mirrors rules/application_status: SUBMITTED→start_review→UNDER_REVIEW;
 * UNDER_REVIEW→approve→APPROVED, UNDER_REVIEW→reject→REJECTED.
 */
export enum StatusAction {
  START_REVIEW = 'start_review',
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class UpdateStatusDto {
  @ApiProperty({
    description:
      'Action to perform on the application (evaluated against rules/application_status)',
    enum: StatusAction,
    example: StatusAction.START_REVIEW,
  })
  action: StatusAction;

  @ApiProperty({
    description: 'Optional reason when rejecting (e.g. "Missing documents", "Must be student")',
    required: false,
  })
  reason?: string;
}
