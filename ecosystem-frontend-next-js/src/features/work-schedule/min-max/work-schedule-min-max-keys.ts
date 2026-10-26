export const workScheduleMinMaxKeys = {
  all: (userId: string) => [userId, "work-schedule", "min-max"] as const,

  lists: (userId: string) =>
    [...workScheduleMinMaxKeys.all(userId), "list"] as const,

  listsByPositionId: (userId: string, positionId: string) =>
    [
      ...workScheduleMinMaxKeys.lists(userId),
      "by-position-id",
      positionId,
    ] as const,

  listsByPositionIdStartTimeEndTime: (
    userId: string,
    positionId: string,
    startTime: string,
    endTime: string,
  ) =>
    [
      ...workScheduleMinMaxKeys.listsByPositionId(userId, positionId),
      "by-start-time-end-time",
      startTime,
      endTime,
    ] as const,

  details: (userId: string) =>
    [...workScheduleMinMaxKeys.all(userId), "detail"] as const,

  detail: (userId: string, positionId: string, minMaxId: string) =>
    [...workScheduleMinMaxKeys.details(userId), positionId, minMaxId] as const,
};
