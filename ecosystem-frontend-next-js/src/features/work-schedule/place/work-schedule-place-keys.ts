export const workSchedulePlaceKeys = {
  all: (userId: string) => [userId, "work-schedule", "place"] as const,

  details: (userId: string) =>
    [...workSchedulePlaceKeys.all(userId), "detail"] as const,

  detail: (userId: string, id: string) =>
    [...workSchedulePlaceKeys.details(userId), id] as const,
};
