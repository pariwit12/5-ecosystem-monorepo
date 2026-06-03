import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestFromClerkAuthGuard } from './clerk-auth.guard';

// ดึง Type มาจากข้างใน user
export type ClerkUserData = RequestFromClerkAuthGuard['user'];

export const ClerkUser = createParamDecorator(
  // ใส่ _data บอก TS ว่าไม่ได้ใช้ ไม่ต้องเตือน แต่ต้องมีเพราะโครงสร้างของ createParamDecorator กำหนดมาแบบนั้น
  (_data: unknown, ctx: ExecutionContext): ClerkUserData => {
    const request = ctx.switchToHttp().getRequest<RequestFromClerkAuthGuard>();
    return request.user; // คืนค่าเฉพาะก้อน user ออกไป
  },
);
