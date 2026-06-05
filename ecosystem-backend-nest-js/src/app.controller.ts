import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard'; // นำเข้า Guard ที่เราเพิ่งสร้างไปใช้ใน Controller นี้
import type { Request as ExpressRequest } from 'express';

// สร้างโครงสร้าง (Interface) บอก ESLint ว่าจะมี user.sub แนบมาด้วยนะ
interface RequestWithAuth extends ExpressRequest {
  user: {
    sub: string;
  };
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 🚪 ประตูสาธารณะ (ใครก็เข้าได้ ไม่มียาม)
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 🔒 ห้องลับ (ต้องมีบัตรผ่านเท่านั้น)
  @Get('api/protected')
  @UseGuards(ClerkAuthGuard) // แปะป้ายเรียกยามมาเฝ้าประตูห้องนี้
  getProtectedData(@Request() req: RequestWithAuth) {
    return {
      message: 'ยินดีด้วย! คุณมีบัตรผ่าน VIP ผ่านด่านตรวจมาได้ 🎉',
      userId: req.user.sub, // ดึงรหัส Clerk ID ที่ยามแกะและประทับตราไว้ใน request
    };
  }
}
