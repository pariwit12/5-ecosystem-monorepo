import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import {
  updateOrganizationById,
  UpdateOrganizationByIdDtoBody,
} from "../api/update-organization-by-id.api";
import { organizationKeys } from "./keys";
// import { organizationsQueries } from "./organizations.queries";

// import { UpdateOrganizationByIdResponse } from "@backend/modules/organizations/commands/update-organization-by-id.command";
// import { GetOrganizationByIdResponse } from "@backend/modules/organizations/queries/get-organization-by-id.query";

export const useUpdateOrganizationById = (orgId: string) => {
  // 🌟 ดึง userId ออกมาเตรียมไว้
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateOrganizationByIdDtoBody) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return updateOrganizationById(token, orgId, body);
    },
    onSuccess: () => {
      // onSuccess: (updatedData: UpdateOrganizationByIdResponse) => {
      if (!userId) return;
      //   const keyToUpdate = organizationKeys.detail(userId, updatedData.id);

      //   queryClient.setQueryData<GetOrganizationByIdResponse>(
      //     keyToUpdate,
      //     (oldData) => {
      //       if (!oldData) return undefined;

      //       // 🌟 ท่าไม้ตาย: เอาของเก่ากางออกก่อน แล้วเอาของใหม่สาดทับลงไป!
      //       // ฟิลด์ไหนไม่ได้แก้ จะยังคงอยู่ครบ / ฟิลด์ไหนแก้ใหม่ จะถูกเขียนทับ
      //       return {
      //         ...oldData, // 1. วางโครงร่างของเก่าไว้
      //         ...updatedData, // 2. เอาของใหม่ (ที่เพิ่งแก้) มาทับเฉพาะส่วน
      //       };

      //       //   // 🌟 ตรงนี้ถ้าคุณแบงค์พิมพ์ผิด TS จะแดงเตือนทันที!
      //       //   return {
      //       //     ...oldData,
      //       //     name: updatedData.name,
      //       //     // สมมติจะแก้ฟิลด์อื่นเพิ่ม เช่น address: updatedData.address
      //       //   };
      //     },
      //   );
      // ==========================================
      // 🎯 สั่งรีเฟรช Cache ตัวที่มีข้อมูลมาเกี่ยวข้องกัน (ปกติจะมีตัว lists รวม ที่อาจจะมี field name มาซ้ำกันได้)
      // ==========================================
      // 1. ระเบิดหน้า Detail (เพื่อให้หน้าตั้งค่าปัจจุบัน อัปเดตข้อมูลใหม่)
      queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(userId, orgId),
      });

      // 2. ระเบิดหน้า Lists (เพื่อให้ตาราง/การ์ดข้างนอก อัปเดตชื่อใหม่ด้วย)
      queryClient.invalidateQueries({
        queryKey: organizationKeys.lists(userId),
      });
    },
  });
};
