import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 🚪 ประตูสาธารณะ (ใครก็เข้าได้ ไม่มียาม)
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
