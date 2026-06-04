import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { createOrganization } from "../api/create-organization.api";
import type { CreateOrganizationDtoBody } from "@backend/modules/organizations/commands/create-organization.command";
import { organizationKeys } from "./keys";

export const useCreateOrganization = () => {
  // 🌟 ดึง userId ออกมาเตรียมไว้
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payloadBody: CreateOrganizationDtoBody) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return createOrganization(payloadBody, token);
    },
    onSuccess: () => {
      // 🌟 สั่งระเบิด Cache โดยระบุตัวตน (ระเบิดเฉพาะลิ้นชักของ User คนนี้)
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: organizationKeys.all(userId),
        });
      }
    },
  });
};
