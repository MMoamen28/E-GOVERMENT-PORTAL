import { ApplicationStatus } from './scholarship.entity';
import { StatusAction } from './dto/update-status.dto';

/**
 * Allowed status transitions — mirrors rules/application_status (appstatus ruleset).
 * Used when GORULES_URL is not set; when GoRules API is available, this can be replaced by an HTTP call.
 * See ruleset-mapping.json: "appstatus": "rules/application_status"
 */
const ALLOWED_TRANSITIONS: Map<string, ApplicationStatus> = new Map([
  [
    `${ApplicationStatus.SUBMITTED}:${StatusAction.START_REVIEW}`,
    ApplicationStatus.UNDER_REVIEW,
  ],
  [
    `${ApplicationStatus.UNDER_REVIEW}:${StatusAction.APPROVE}`,
    ApplicationStatus.APPROVED,
  ],
  [
    `${ApplicationStatus.UNDER_REVIEW}:${StatusAction.REJECT}`,
    ApplicationStatus.REJECTED,
  ],
]);

export function getNextStatusFromRule(
  currentStatus: ApplicationStatus,
  action: StatusAction,
): ApplicationStatus | null {
  return ALLOWED_TRANSITIONS.get(`${currentStatus}:${action}`) ?? null;
}
