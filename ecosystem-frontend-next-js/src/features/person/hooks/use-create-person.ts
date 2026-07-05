import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { createPerson } from "../api/mutations/create-person.api";

export const useCreatePerson = () => {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return createPerson(token);
    },

    onSuccess: () => {},
  });
};
