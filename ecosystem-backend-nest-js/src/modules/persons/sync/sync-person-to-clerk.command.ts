// 📥 ใบสั่งงาน (Command Payload)
export class SyncPersonToClerkCommand {
  constructor(public readonly clerkId: string) {}
}

// 📤 ขาออก
export interface SyncPersonToClerkResponse {
  success: boolean;
  message: string;
  // personId: string;
  // person: any; // อนาคตค่อยมาระบุ Type ที่ชัดเจนแทน any ได้ครับ
}
