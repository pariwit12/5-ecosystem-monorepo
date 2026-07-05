import apiClient from "@/lib/axios";

export const createPerson = async (token: string): Promise<void> => {
  await apiClient.post<void>(`/api/person`, undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return;
};
