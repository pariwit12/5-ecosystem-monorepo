export const workScheduleStaffKeys = {
  all: (userId: string) => [userId, "work-schedule", "staff"] as const,

  lists: (userId: string) =>
    [...workScheduleStaffKeys.all(userId), "list"] as const,

  listsByPlaceId: (userId: string, placeId: string) =>
    [...workScheduleStaffKeys.lists(userId), "by-place-id", placeId] as const,
};
