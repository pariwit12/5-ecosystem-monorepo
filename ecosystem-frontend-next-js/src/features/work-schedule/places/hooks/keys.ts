export const workSchedulePlacesKeys = {
  all: (userId: string) => [userId, "work-schedule"] as const,

  places: (userId: string) =>
    [...workSchedulePlacesKeys.all(userId), "places"] as const,
  placeListByOrganizationId: (userId: string, organizationId: string) =>
    [...workSchedulePlacesKeys.places(userId), "list", organizationId] as const,

  placeDetails: (userId: string) =>
    [...workSchedulePlacesKeys.places(userId), "detail"] as const,
  placeDetail: (userId: string, placeId: string) =>
    [...workSchedulePlacesKeys.placeDetails(userId), placeId] as const,
};
