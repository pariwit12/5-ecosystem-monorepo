// 🌟 Import Enum ที่ Prisma สร้างไว้ให้จากฐานข้อมูล
import { PaymentStatus } from '@prisma/client';

// import model มาใช้เป็น interface ของข้อมูลขาออก
import { Person } from '@prisma/client';

export class GetTemplateQuery {
  // 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
  constructor(
    public readonly clerkId: string,
    public readonly personId: string,
    public readonly personOrganizationAffiliationId: string,
    public readonly organizationId: string,
  ) {}
}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาออก
// สามารถเขียนเองทั้งหมด หรือจะใช้ Omit / Pick มาช่วยก็ได้

// 🌟 แบบที่ 1: เขียนเองทั้งหมด
export interface GetTemplateResponse {
  id: string;
  name: string;

  // ควรเขียนเอง ไม่ควรไป import มาจาก schema.prisma เพื่อความยืดหยุ่นในอนาคต ตรงนี้สามารถ map เพื่อเป็นตัวกลางระหว่าง frontend และ schema.prisma ได้
  organizationDentalClinic: {
    paymentStatus: PaymentStatus; // 👈 ใช้ Enum ของ Prisma ตรงๆ ได้เลย!
    subscriptionEndDate: Date | null;
  } | null;
}

// 🌟 แบบที่ 2: ดึงมาจาก schema.prisma (หรือที่อื่น แนะนำ schema.prisma) ขอตัดแค่ clerkId และ createdAt ทิ้ง
export interface GetTemplateUseOmitResponse extends Omit<
  Person,
  'id' | 'clerkId'
> {
  // เติมข้อมูลอื่นๆ ที่ Prisma ไม่มีให้เพิ่มเองตรงนี้
  organizationDentalClinic: {
    paymentStatus: PaymentStatus; // 👈 ใช้ Enum ของ Prisma ตรงๆ ได้เลย!
    subscriptionEndDate: Date | null;
  } | null;
}

// 🌟 แบบที่ 3: ดึงมาจาก schema.prisma (หรือที่อื่น แนะนำ schema.prisma) เลือกมาเฉพาะฟิลด์ที่ต้องการเป๊ะๆ
export interface GetTemplateUsePickResponse extends Pick<
  Person,
  'id' | 'clerkId'
> {
  // เติมข้อมูลอื่นๆ ที่ Prisma ไม่มีให้เพิ่มเองตรงนี้
  organizationDentalClinic: {
    paymentStatus: PaymentStatus; // 👈 ใช้ Enum ของ Prisma ตรงๆ ได้เลย!
  } | null;
}
