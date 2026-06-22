// 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
export class GetUserRolesByClerkIdQuery {
  constructor(public readonly clerkId: string) {}
}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาออก
// เขียนเอง, ใช้ Omit, ใช้ Pick (ควรเขียนเอง ตรงนี้จะได้เป็นที่รวมหน้าตาของ Response ที่เดียว ไม่ต้องไปหาต่อ)
export interface GetUserRolesByClerkIdResponse {
  placesAsAdmin: {
    id: string;
    name: string;
  }[];
  placesAsStaff: {
    id: string;
    name: string;
  }[];
}
