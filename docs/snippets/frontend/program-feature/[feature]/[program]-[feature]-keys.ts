//
// ปรับตามใช้งานจริง
export const programFeatureKeys = {
  //
  // ปรับตามใช้งานจริง
  all: (userId: string) =>
    [
      // ปรับตามใช้งานจริง
      userId,
      "program",
      "feature",
    ] as const,

  // ปรับตามใช้งานจริง
  lists: (userId: string) =>
    [
      // ปรับตามใช้งานจริง
      ...programFeatureKeys.all(userId),
      "list",
    ] as const,

  // วิธีใช้แบบ filter (ยังไม่เคยลองใช้)
  // list: (userId: string, filters: Record<string, unknown>) =>
  //   [...templateKeys.lists(userId), { filters }] as const,
  // listWithFilters: (filters: Record<string, unknown>) =>
  //   [...templateKeys.lists(), { ...filters }] as const,

  // ปรับตามใช้งานจริง
  listsByValueOne: (
    //
    // ปรับตามใช้งานจริง
    userId: string,
    valueOne: string,
  ) =>
    [
      // ปรับตามใช้งานจริง
      ...programFeatureKeys.lists(userId),
      "by-value-one",
      valueOne,
    ] as const,

  // ปรับตามใช้งานจริง
  listsByValueOneValueTwoValueThree: (
    //
    // ปรับตามใช้งานจริง
    userId: string,
    valueOne: string,
    valueTwo: string,
    valueThree: string,
  ) =>
    [
      // ปรับตามใช้งานจริง
      ...programFeatureKeys.listsByValueOne(userId, valueOne),
      "by-value-two-value-three",
      valueTwo,
      valueThree,
    ] as const,

  // ปรับตามใช้งานจริง
  details: (userId: string) =>
    [
      // ปรับตามใช้งานจริง
      ...programFeatureKeys.all(userId),
      "detail",
    ] as const,

  // ปรับตามใช้งานจริง
  detail: (
    //
    // ปรับตามใช้งานจริง
    userId: string,
    id: string,
  ) =>
    [
      // ปรับตามใช้งานจริง
      ...programFeatureKeys.details(userId),
      id,
    ] as const,
};
