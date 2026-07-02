export const workSchedulePositionKeys = {
  all: (userId: string) => [userId, "work-schedule", "position"] as const,

  lists: (userId: string) =>
    [...workSchedulePositionKeys.all(userId), "list"] as const,

  listsByPlaceId: (userId: string, placeId: string) =>
    [
      ...workSchedulePositionKeys.lists(userId),
      "by-place-id",
      placeId,
    ] as const,

  details: (userId: string) =>
    [...workSchedulePositionKeys.all(userId), "detail"] as const,

  detail: (userId: string, id: string) =>
    [...workSchedulePositionKeys.details(userId), id] as const,
};
