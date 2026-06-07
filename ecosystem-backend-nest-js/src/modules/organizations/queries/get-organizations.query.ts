// 📥 ขาเข้า
export class GetOrganizationsQuery {
  constructor(public readonly clerkId: string) {}
}

// 📤 ขาออก
export interface GetOrganizationsResponse {
  organizations: {
    id: string;
    name: string;
  }[];
}
