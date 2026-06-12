// ปรับตามใช้งานจริง
export const templateKeys = {
  // ปรับตามใช้งานจริง
  all: (userId: string) =>
    [
      // ปรับตามใช้งานจริง
      userId,
      "template",
    ] as const,

  // ปรับตามใช้งานจริง
  lists: (userId: string) =>
    [
      // ปรับตามใช้งานจริง
      ...templateKeys.all(userId),
      "list",
    ] as const,

  // วิธีใช้แบบ filter (ยังไม่เคยลองใช้)
  // list: (userId: string, filters: Record<string, unknown>) =>
  //   [...templateKeys.lists(userId), { filters }] as const,
  // listWithFilters: (filters: Record<string, unknown>) =>
  //   [...templateKeys.lists(), { ...filters }] as const,

  // ปรับตามใช้งานจริง
  listsByOrganizationId: (userId: string, organizationId: string) =>
    [
      // ปรับตามใช้งานจริง
      ...templateKeys.lists(userId),
      "by-organization-id",
      organizationId,
    ] as const,

  // ปรับตามใช้งานจริง
  details: (userId: string) =>
    [
      // ปรับตามใช้งานจริง
      ...templateKeys.all(userId),
      "detail",
    ] as const,

  // ปรับตามใช้งานจริง
  detail: (userId: string, id: string) =>
    [
      // ปรับตามใช้งานจริง
      ...templateKeys.details(userId),
      id,
    ] as const,
};
