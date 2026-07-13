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
};
