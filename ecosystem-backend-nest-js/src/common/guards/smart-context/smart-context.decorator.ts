// เปลี่ยนร่าง Request สุดท้าย ให้เหลือแค่ตัว Object ที่ไม่ไปผูกกับ Request ของ Express โดยตรง เพื่อความยืดหยุ่นในอนาคต

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  RequestFromSmartContextGuardPERSON,
  RequestFromSmartContextGuardORGANIZATION,
} from './smart-context.guard';

// 🌟 ท่าไม้ตาย: ชี้เป้าไปที่ Property 'smartContextGuard' เพื่อดึง Type มาใช้เลย!
export type SmartContextDataPERSON =
  RequestFromSmartContextGuardPERSON['smartContextGuard'];

export type SmartContextDataORGANIZATION =
  RequestFromSmartContextGuardORGANIZATION['smartContextGuard'];

export const SmartContextPERSON = createParamDecorator(
  // ใส่ _data บอก TS ว่าไม่ได้ใช้ ไม่ต้องเตือน แต่ต้องมีเพราะโครงสร้างของ createParamDecorator กำหนดมาแบบนั้น
  (_data: unknown, ctx: ExecutionContext): SmartContextDataPERSON => {
    const request = ctx
      .switchToHttp()
      .getRequest<RequestFromSmartContextGuardPERSON>();

    // คืนค่าก้อนข้อมูลที่ Guard ตรวจสอบและฝังไว้ให้
    return request.smartContextGuard;
  },
);

export const SmartContextORGANIZATION = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SmartContextDataORGANIZATION => {
    const request = ctx
      .switchToHttp()
      .getRequest<RequestFromSmartContextGuardORGANIZATION>();

    // คืนค่าก้อนข้อมูลที่ Guard ตรวจสอบและฝังไว้ให้
    return request.smartContextGuard;
  },
);
