// 🌟 Import Enum ที่ Prisma สร้างไว้ให้จากฐานข้อมูล
import { PaymentStatus } from '@prisma/client';

export class GetOrganizationByIdQuery {
  // 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
  constructor(
    public readonly clerkId: string,
    public readonly personId: string,
    public readonly personOrganizationAffiliationId: string,
    public readonly organizationId: string,
  ) {}
}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาออก
export interface GetOrganizationByIdResponse {
  id: string;
  name: string;
  organizationDentalClinic: {
    id: string;
    paymentStatus: PaymentStatus; // 👈 ใช้ Enum ของ Prisma ตรงๆ ได้เลย!
    subscriptionEndDate: Date | null;
  } | null;
}
