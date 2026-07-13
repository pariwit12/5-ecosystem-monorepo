export const workScheduleSlotTemplateKeys = {
  all: (userId: string) => [userId, "work-schedule", "slot-template"] as const,

  lists: (userId: string) =>
    [...workScheduleSlotTemplateKeys.all(userId), "list"] as const,

  listsByPositionId: (userId: string, positionId: string) =>
    [
      ...workScheduleSlotTemplateKeys.lists(userId),
      "by-position-id",
      positionId,
    ] as const,
};
