import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { getOrganizations } from "../api/get-organizations.api";
import { organizationKeys } from "./keys";

export const useGetOrganizations = () => {
  // 🌟 ดึง userId ออกมาใช้งานด้วย
  const { getToken, userId } = useAuth();

  return useQuery({
    // 🌟 ใส่ userId เข้าไปใน Factory (ถ้าไม่มีให้ใส่ array ว่างกันแครช)
    queryKey: userId ? organizationKeys.lists(userId) : [],

    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return getOrganizations(token);
    },

    // 🛡️ ทริคความปลอดภัย: สั่งให้ Query รอจนกว่าจะมี userId ก่อนถึงจะเริ่มทำงาน
    enabled: !!userId,
  });
};
