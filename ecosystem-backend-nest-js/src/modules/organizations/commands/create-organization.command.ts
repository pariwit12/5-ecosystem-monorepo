import { IsString, IsNotEmpty } from 'class-validator';

// 🛡️ DTO ขาเข้า (ใช้รับ @Body จากหน้าเว็บ)
export class CreateOrganizationDtoBody {
  @IsString({ message: 'ชื่อองค์กรต้องเป็นตัวอักษรเท่านั้น' })
  @IsNotEmpty({ message: 'กรุณาระบุชื่อองค์กร (ห้ามเป็นค่าว่าง)' })
  name!: string;
}

// 📥 ใบสั่งงาน (Command Payload): รวม DTO กับข้อมูลลับ (clerkId) ส่งเข้า Bus
export class CreateOrganizationCommand {
  constructor(
    public readonly dto: CreateOrganizationDtoBody,
    public readonly clerkId: string,
    public readonly personId: string,
  ) {}
}

// 📤 ขาออก: คืนค่า Message และข้อมูลองค์กรที่เพิ่งสร้าง
export interface CreateOrganizationResponse {
  success: boolean;
  message: string;
  // organizationId: string;
  // organization: any; // อนาคตค่อยมาระบุ Type ที่ชัดเจนแทน any ได้ครับ
}
