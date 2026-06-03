// 📥 ขาเข้า: ต้องการแค่ clerkId
export class GetOrganizationsQuery {
  constructor(
    public readonly clerkId: string,
    public readonly personId: string,
  ) {}
}

// 📤 ขาออก: ส่ง success status และ array ขององค์กรกลับไป
export interface GetOrganizationsResponse {
  success: boolean;
  organizations: {
    id: string;
    name: string;
  }[];
}
