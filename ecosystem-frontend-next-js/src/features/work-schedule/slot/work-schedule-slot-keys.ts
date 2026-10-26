export const workScheduleSlotKeys = {
  all: (userId: string) => [userId, "work-schedule", "slot"] as const,

  lists: (userId: string) =>
    [...workScheduleSlotKeys.all(userId), "list"] as const,

  listsByPositionId: (userId: string, positionId: string) =>
    [
      ...workScheduleSlotKeys.lists(userId),
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
      ...workScheduleSlotKeys.listsByPositionId(userId, positionId),
      "by-start-time-end-time",
      startTime,
      endTime,
    ] as const,

  myListsByPlaceIdStartTimeEndTime: (
    userId: string,
    placeId: string,
    startTime: string,
    endTime: string,
  ) =>
    [
      ...workScheduleSlotKeys.lists(userId),
      'my-by-place-id',
      placeId,
      startTime,
      endTime,
    ] as const,

  details: (userId: string) =>
    [...workScheduleSlotKeys.all(userId), "detail"] as const,

  detail: (userId: string, positionId: string, slotId: string) =>
    [...workScheduleSlotKeys.details(userId), positionId, slotId] as const,
};
