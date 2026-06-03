import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config'; // บังคับโหลดไฟล์ .env ทันทีเพื่อป้องกันหา DATABASE_URL ไม่เจอ

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. สร้าง Connection Pool ไปยัง Neon Database
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 2. ห่อด้วย Prisma Adapter
    const adapter = new PrismaPg(pool);

    // 3. ส่ง Adapter เข้าไปให้ PrismaClient (กฎใหม่ของ Prisma 7)
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
