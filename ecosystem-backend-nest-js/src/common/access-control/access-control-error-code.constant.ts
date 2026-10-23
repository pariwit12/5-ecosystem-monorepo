import { ErrorCode } from '../exceptions/error-codes.enum';

export const AccessControlErrorCode = {
  //

  // 1
  verifyPerson: [ErrorCode.PERSON_NOT_FOUND],

  // 2
  verifyOrganizationAccess: [
    ErrorCode.ORGANIZATION_NOT_FOUND,
    ErrorCode.ORGANIZATION_DELETED,
    ErrorCode.PERSON_NOT_FOUND,
    ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
  ],

  // 3
  verifyWorkScheduleAdminAccess: [
    ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
    ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
    ErrorCode.PERSON_NOT_FOUND,
    ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
  ],

  // 3.1
  verifyWorkScheduleStaffAccess: [
    ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
    ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
    ErrorCode.PERSON_NOT_FOUND,
    ErrorCode.NOT_A_STAFF_OF_WORK_SCHEDULE_PLACE,
  ],

  // 4
  verifyWorkSchedulePositionByWorkScheduleAdmin: [
    ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
    ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
    ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
    ErrorCode.PERSON_NOT_FOUND,
    ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
  ],

  // 5
  verifyWorkScheduleSlotTemplateIdByWorkScheduleAdmin: [
    ErrorCode.WORK_SCHEDULE_SLOT_TEMPLATE_NOT_FOUND,
    ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
    ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
    ErrorCode.PERSON_NOT_FOUND,
    ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
  ],

  //
} as const;
