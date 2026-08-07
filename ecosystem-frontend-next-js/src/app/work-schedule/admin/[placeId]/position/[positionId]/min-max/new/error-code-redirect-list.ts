import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export const workScheduleAdminPlaceIdPositionPositionIdMinMaxNewErrorCodeRedirectList: Record<
  (typeof AccessControlErrorCode.verifyWorkScheduleAdminAccess)[number],
  string
> = {
  [ErrorCode.PERSON_NOT_FOUND]: "/person/new",

  [ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND]: "/work-schedule",
  [ErrorCode.WORK_SCHEDULE_PLACE_DELETED]: "/work-schedule",
  [ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE]: "/work-schedule",
};
