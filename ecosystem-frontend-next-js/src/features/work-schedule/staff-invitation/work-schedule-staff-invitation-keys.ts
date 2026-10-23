export const workScheduleStaffInvitationKeys = {
  all: ["work-schedule-staff-invitation"] as const,
  mine: (userId: string) =>
    [...workScheduleStaffInvitationKeys.all, "mine", userId] as const,
  byPlace: (userId: string, placeId: string) =>
    [...workScheduleStaffInvitationKeys.all, "by-place", userId, placeId] as const,
};
