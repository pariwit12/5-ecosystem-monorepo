import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express'; // 👈 นำเข้า Request type จาก express

// ----------------------------------------
// 🌟 สร้าง Interface อธิบายหน้าตาของ Request

// 📥 ขาเข้า: ตอนเพิ่งเริ่มเข้า Guard (ทุกอย่างเป็น Optional)
export interface RequestBeforeClerkAuthGuard extends Request {
  user?: any; // เตรียมเผื่อไว้สำหรับข้อมูลที่จะเพิ่มไปใน Request โดย ClerkAuthGuard
}

// 📤 ขาออก: ตอนส่งให้ Controller (รับประกันว่ามีข้อมูลแน่นอน ไม่มีเครื่องหมาย ?)
export interface RequestFromClerkAuthGuard extends Request {
  user: {
    sub: string;

    // (อนาคตถ้าต้องใช้ฟิลด์อื่น ค่อยมาเติมตรงนี้ เช่น exp?: number)
  };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. ดึงข้อมูล Request ที่หน้าบ้านยิงมา
    const request = context
      .switchToHttp()
      .getRequest<RequestBeforeClerkAuthGuard>();
    const authHeader = request.headers.authorization;

    // 2. เช็คว่ามีบัตร (Token) แนบมาไหม (ต้องมาในรูปแบบ "Bearer <token>")
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    // ตัดคำว่า "Bearer " ออก เพื่อเอาเฉพาะตัวรหัสยาวๆ
    const token = authHeader.replace('Bearer ', '');

    try {
      // 3. ส่ง Token ไปให้ Clerk ตรวจสอบว่าเป็นของแท้และยังไม่หมดอายุใช่ไหม
      const verifiedSession = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // 4. ประทับตรา! ฝังข้อมูลคนไข้/หมอ (เช่น userId) ลงไปใน Request
      // เพื่อให้ Controller ของเราดึงไปใช้ต่อได้สบายๆ
      request.user = verifiedSession;
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [Auth Error]:', errorMessage);
      // ถ้าบัตรปลอม บัตรหมดอายุ ยามจะเตะออกทันที (Error 401)
      throw new UnauthorizedException('Invalid or expired Token');
    }
  }
}
