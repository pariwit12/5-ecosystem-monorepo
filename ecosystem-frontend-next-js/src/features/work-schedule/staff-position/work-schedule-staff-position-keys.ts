export const workScheduleStaffPositionKeys = {
  all: (userId: string) => [userId, "work-schedule", "staff-position"] as const,

  lists: (userId: string) =>
    [...workScheduleStaffPositionKeys.all(userId), "list"] as const,

  listsByPositionId: (userId: string, positionId: string) =>
    [
      ...workScheduleStaffPositionKeys.lists(userId),
      "by-position-id",
      positionId,
    ] as const,
};
