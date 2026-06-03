import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsInt,
  IsPositive,
  Min,
  Max,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// สำหรับใช้ใน DTO
// ==========================================

// 🌟 ตัวอย่าง Enum สำหรับใช้งาน import มาจากที่อื่นก็ได้เช่นกัน
import { TemplateEnumInSchemaPrisma } from '@prisma/client';

// ==========================================
// สำหรับใช้ใน DTO
// ==========================================

// 🌟 ตัวอย่าง Enum สำหรับใช้งาน หรือ import มาจากที่อื่นก็ได้เช่นกัน
// ถ้าเราเขียนแค่ enum RoleStatus { ACTIVE, INACTIVE } TypeScript จะมองว่ามันคือ Numeric Enum (ตัวเลข) อัตโนมัติครับ
export enum TemplateEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// ==========================================
// สำหรับใช้ใน DTO
// ==========================================

// 🌟 ตัวอย่าง Class ย่อยสำหรับ Nested Object หรือ import มาจากที่อื่นก็ได้เช่นกัน
class AddressDto {
  @IsString()
  @IsNotEmpty()
  province!: string;
}

// 🛡️ DTO ขาเข้า (ใช้รับ @Body จากหน้าเว็บ)
export class MethodTemplateDtoBody {
  // ==========================================
  // กลุ่ม UUID (ตัวระบุเอกลักษณ์สากล)
  // ==========================================

  // บังคับว่าเป็น UUID v7 เท่านั้น
  @IsUUID('7', {
    message: '[template] ต้องเป็นรูปแบบ UUID v7 เท่านั้น',
  })
  @IsNotEmpty({ message: 'กรุณาระบุ [template] (ห้ามเป็นค่าว่าง)' })
  fieldUUIDv7!: string;

  // บังคับว่าเป็น UUID v4 เท่านั้น (⭐ นิยมใช้ที่สุดและปลอดภัยสุด)
  @IsUUID('4', {
    message:
      '[template] ต้องเป็นรูปแบบ UUID v4 เท่านั้น (เช่น 550e8400-e29b-41d4-a716-446655440000)',
  })
  @IsNotEmpty({ message: 'กรุณาระบุ [template] (ห้ามเป็นค่าว่าง)' })
  fieldUUIDv4!: string;

  // บังคับว่าเป็น UUID เวอร์ชันไหนก็ได้ (validator.js now supports UUID versions 1-8)
  @IsUUID('all', { message: '[template] ต้องเป็นรูปแบบ UUID เท่านั้น' })
  @IsNotEmpty({ message: 'กรุณาระบุ [template] (ห้ามเป็นค่าว่าง)' })
  fieldUUID?: string;

  // ==========================================
  // 1. กลุ่ม String (ข้อความ)
  // ==========================================

  @IsString({ message: '[template] ต้องเป็น String เท่านั้น' })
  @MinLength(3, { message: '[template] ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' })
  @MaxLength(50, { message: '[template] ต้องมีความยาวไม่เกิน 50 ตัวอักษร' })
  @Matches(/^[a-zA-Z0-9\s]+$/, {
    message:
      '[template] ต้องประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข และช่องว่างเท่านั้น',
  })
  @IsNotEmpty({ message: 'กรุณาระบุ [template] (ห้ามเป็นค่าว่าง)' })
  fieldStringNotEmpty!: string;

  @IsString({ message: '[template] ต้องเป็น String เท่านั้น' })
  @IsOptional()
  fieldStringOptional?: string;

  // ==========================================
  // 2. กลุ่ม Number (ตัวเลข)
  // ==========================================

  @IsInt({ message: '[template] ต้องเป็น จำนวนเต็ม เท่านั้น' })
  @IsPositive({ message: '[template] ต้องเป็น จำนวนเต็มบวก เท่านั้น' })
  @Min(1, { message: '[template] ต้องมีค่าไม่น้อยกว่า 1' })
  @Max(100, { message: '[template] ต้องมีค่าไม่เกิน 100' })
  @IsNotEmpty({ message: 'กรุณาระบุ [template] (ห้ามเป็นค่าว่าง)' })
  @Type(() => Number) // 💡 Pro-Tip: บังคับแปลง String "1" เป็น Number 1 ก่อนเช็ค
  fieldInt!: number;

  // ==========================================
  // 3. กลุ่ม Specific Format (รูปแบบเฉพาะเจาะจง)
  // ==========================================

  // @IsEmail() มีการเช็ค Type เบื้องหลังไว้ให้แล้วครับ ถ้ามีคนส่งตัวเลข (123) หรือ Object เข้ามา มันจะถูกปัดตกและฟ้องว่า "รูปแบบอีเมลไม่ถูกต้อง" ทันที
  @IsEmail({}, { message: '[template] ต้องเป็นรูปแบบอีเมลเท่านั้น' })
  @IsNotEmpty({ message: 'กรุณาระบุ [template] (ห้ามเป็นค่าว่าง)' })
  fieldEmail!: string;

  @IsEnum(TemplateEnum, {
    message: '[template] ต้องเป็น ACTIVE หรือ INACTIVE เท่านั้น',
  })
  @IsNotEmpty({ message: 'กรุณาระบุ [template] (ห้ามเป็นค่าว่าง)' })
  fieldEnum!: TemplateEnum;

  @IsEnum(TemplateEnumInSchemaPrisma, {
    message: '[template] ต้องเป็น ACTIVE หรือ INACTIVE เท่านั้น',
  })
  @IsNotEmpty({ message: 'กรุณาระบุ [template] (ห้ามเป็นค่าว่าง)' })
  fieldEnum2!: TemplateEnumInSchemaPrisma;

  @IsBoolean({ message: '[template] ต้องเป็นค่า true หรือ false เท่านั้น' })
  @IsNotEmpty({ message: 'กรุณาระบุ [template] (ห้ามเป็นค่าว่าง)' })
  @Type(() => Boolean) // 💡 Pro-Tip: แปลง "true" เป็น true
  fieldBoolean!: boolean;

  // ==========================================
  // 4. กลุ่ม Array และ Nested Object (ขั้นสูง)
  // ==========================================

  @IsArray({ message: '[template] ต้องเป็น Array เท่านั้น' })
  @IsString({
    each: true,
    message: 'ข้อมูลใน Array [template] ต้องเป็นข้อความทั้งหมด',
  })
  @ArrayMinSize(1, { message: 'ต้องมีข้อมูลใน Array อย่างน้อย 1 รายการ' })
  @IsOptional()
  fieldArray?: string[];

  @ValidateNested({ message: 'ข้อมูลที่อยู่ไม่ถูกต้อง' })
  @Type(() => AddressDto) // 🌟 จำเป็นมากเวลาส่ง Object ซ้อน Object เข้ามา
  @IsOptional()
  fieldValidateNested?: AddressDto;
}

// 📥 ใบสั่งงาน (Command Payload): รวม DTO กับข้อมูลลับ (clerkId) ส่งเข้า Bus
export class MethodTemplateCommand {
  constructor(
    public readonly dto: MethodTemplateDtoBody,
    public readonly clerkId: string,
    public readonly personId: string,
  ) {}
}

// 📤 ขาออก: คืนค่า Message (+/- ข้อมูลองค์กรที่เพิ่งสร้าง)
export interface MethodTemplateResponse {
  success: boolean;
  message: string;
  // organizationId: string;
  // organization: any; // อนาคตค่อยมาระบุ Type ที่ชัดเจนแทน any ได้ครับ
  // organizationDentalClinic: {
  //   paymentStatus: PaymentStatus; // 👈 ใช้ Enum ของ Prisma ตรงๆ ได้เลย!
  //   subscriptionEndDate: Date | null;
  // } | null;
}
