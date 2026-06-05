// 📥 ขาเข้า
export class GetOrganizationsQuery {
  constructor(public readonly clerkId: string) {}
}

// 📤 ขาออก
export interface GetOrganizationsResponse {
  success: boolean;
  organizations: {
    id: string;
    name: string;
  }[];
}
