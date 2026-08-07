export const workScheduleSlotTypeKeys = {
  all: (userId: string) => [userId, "work-schedule", "slot-type"] as const,

  lists: (userId: string) =>
    [...workScheduleSlotTypeKeys.all(userId), "list"] as const,

  listsByPositionId: (userId: string, positionId: string) =>
    [
      ...workScheduleSlotTypeKeys.lists(userId),
      "by-position-id",
      positionId,
    ] as const,
};
