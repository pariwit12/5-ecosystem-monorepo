import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export const workScheduleAdminPlaceIdPositionPositionIdSlotTypeErrorCodeRedirectList: Record<
  (typeof AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin)[number],
  string
> = {
  [ErrorCode.PERSON_NOT_FOUND]: "/person/new",

  [ErrorCode.WORK_SCHEDULE_PLACE_DELETED]: "/work-schedule",
  [ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE]: "/work-schedule",

  [ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND]:
    "/work-schedule/admin/[placeId]/position",
  [ErrorCode.WORK_SCHEDULE_POSITION_DELETED]:
    "/work-schedule/admin/[placeId]/position",
};
