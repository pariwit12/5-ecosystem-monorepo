import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import {
  createOrganization,
  CreateOrganizationDtoBody,
} from "../api/create-organization.api";
import { organizationKeys } from "./keys";

export const useCreateOrganization = () => {
  // 🌟 ดึง userId ออกมาเตรียมไว้
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateOrganizationDtoBody) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return createOrganization(body, token);
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
