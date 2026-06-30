//
// ปรับตามใช้งานจริง
export const templateKeys =
  //
  {
    //
    // ปรับตามใช้งานจริง
    all: (userId: string) =>
      [
        // ปรับตามใช้งานจริง
        userId,
        "template", // ปรับตามใช้งานจริง
      ] as const,

    // ปรับตามใช้งานจริง
    lists: (userId: string) =>
      [
        // ปรับตามใช้งานจริง
        ...templateKeys // ปรับตามใช้งานจริง
          .all(userId),
        "list",
        //
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
      valueOne: string, // ปรับตามใช้งานจริง
      //
    ) =>
      [
        // ปรับตามใช้งานจริง
        ...templateKeys // ปรับตามใช้งานจริง
          .lists(userId),
        "by-value-one", // ปรับตามใช้งานจริง
        valueOne, // ปรับตามใช้งานจริง
        //
      ] as const,

    // ปรับตามใช้งานจริง
    details: (userId: string) =>
      [
        // ปรับตามใช้งานจริง
        ...templateKeys // ปรับตามใช้งานจริง
          .all(userId),
        "detail",
        //
      ] as const,

    // ปรับตามใช้งานจริง
    detail: (
      //
      // ปรับตามใช้งานจริง
      userId: string,
      id: string, // ปรับตามใช้งานจริง
      //
    ) =>
      [
        // ปรับตามใช้งานจริง
        ...templateKeys // ปรับตามใช้งานจริง
          .details(userId),
        id, // ปรับตามใช้งานจริง
        //
      ] as const,
  };
