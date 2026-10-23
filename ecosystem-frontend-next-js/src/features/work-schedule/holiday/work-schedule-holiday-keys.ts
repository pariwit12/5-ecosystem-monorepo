export const workScheduleHolidayKeys = {
  all: ["work-schedule-holidays"] as const,
  lists: () => [...workScheduleHolidayKeys.all, "list"] as const,
  list: (userId: string | null | undefined, placeId: string) =>
    [...workScheduleHolidayKeys.lists(), { userId, placeId }] as const,
};
