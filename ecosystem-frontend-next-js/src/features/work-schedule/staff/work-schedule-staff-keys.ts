export const workScheduleStaffKeys = {
  all: (userId: string) => [userId, "work-schedule-staff"] as const,

  lists: (userId: string) =>
    [...workScheduleStaffKeys.all(userId), "list"] as const,

  listsByPlaceId: (userId: string, placeId: string) =>
    [...workScheduleStaffKeys.lists(userId), "by-place-id", placeId] as const,

  // // ปรับตามใช้งานจริง
  // details: (userId: string) =>
  //   [
  //     // ปรับตามใช้งานจริง
  //     ...workScheduleStaffKeys.all(userId),
  //     "detail",
  //   ] as const,

  // // ปรับตามใช้งานจริง
  // detail: (userId: string, id: string) =>
  //   [
  //     // ปรับตามใช้งานจริง
  //     ...workScheduleStaffKeys.details(userId),
  //     id,
  //   ] as const,
};
