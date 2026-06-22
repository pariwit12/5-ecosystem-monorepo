export const workScheduleLogInKeys = {
  all: (userId: string) => [userId, "work-schedule-log-in"] as const,

  lists: (userId: string) =>
    [...workScheduleLogInKeys.all(userId), "list"] as const,
};
