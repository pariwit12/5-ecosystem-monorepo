export const workScheduleStaffPlaceKeys = {
  all: ["work-schedule-staff-place"] as const,
  detail: (userId: string, placeId: string) =>
    [...workScheduleStaffPlaceKeys.all, "detail", userId, placeId] as const,
};
