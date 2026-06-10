import { queryOptions } from "@tanstack/react-query";
import { workSchedulePlacesKeys } from "./keys";

import { getWorkSchedulePlacesByOrganizationId } from "../api/get-work-schedule-places-by-organization-id.api";

export const workSchedulePlacesQueries = {
  listByOrganizationId: (
    userId: string | null | undefined,
    orgId: string,
    // 🌟 รับฟังก์ชันมาทั้งก้อน ดึง token เองไม่ได้ เพราะไม่ใช่ hooks แล้วก็ให้ข้างนอกดึงมาก็ต้องใช้ await และ useEffect
    getToken: () => Promise<string | null>,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey:
        userId && orgId
          ? workSchedulePlacesKeys.placeListByOrganizationId(userId, orgId)
          : [],
      queryFn: async () => {
        if (!orgId) throw new Error("Organization ID is required");
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getWorkSchedulePlacesByOrganizationId(
          orgId,
          token,
          skipErrorCodes,
        );
      },
      staleTime: 60 * 1000,
      enabled: !!userId && !!orgId,
    }),
};
