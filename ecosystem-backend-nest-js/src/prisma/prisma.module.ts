import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ทำให้ PrismaService ใช้งานได้ทุกที่โดยไม่ต้อง Import ซ้ำ
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // อนุญาตให้ Module อื่นเรียกใช้งาน Database ได้
})
export class PrismaModule {}
