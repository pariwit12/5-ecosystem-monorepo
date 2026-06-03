import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { Webhook } from 'svix'; // เดี๋ยวเราจะเอามาใช้ Verify ลายเซ็นในสเตปถัดๆ ไป

// ประกาศหน้าตาของข้อมูล (Type Definition)
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    // first_name?: string;
    // last_name?: string;
    // email_addresses?: Array<{ email_address: string }>;

    // // สำหรับ organization.created
    // name?: string;
  };
}

@Controller('api/webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('clerk')
  async handleClerkWebhooks(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    // 1. เช็คเบื้องต้นว่ามี Header ถูกส่งมาหรือไม่
    // เช็คเบื้องต้นว่ามี Header จาก Clerk ส่งมาจริงๆ ไม่ใช่คนพิมพ์ URL เล่น
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing Svix headers');
    }

    // 2. ดึงรหัสความลับ (Signing Secret) จากไฟล์ .env
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error(
        'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env',
      );
    }

    // ดึงข้อมูลดิบ (Raw Body) ออกมาเป็น String เพื่อใช้ตรวจสอบ
    const rawBody = req.rawBody?.toString('utf8');
    if (!rawBody) {
      throw new BadRequestException('Error: Missing raw body');
    }

    // 3. เริ่มกระบวนการตรวจสอบลายเซ็นด้วย svix
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: ClerkWebhookEvent;

    try {
      // นำไปเทียบกับลายเซ็น
      evt = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      // เช็คว่าเป็น Error Object จริงไหม ก่อนดึง message ออกมา
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        '❌ [Webhook Error] Signature verification failed:',
        errorMessage,
      );
      throw new BadRequestException('Invalid signature');
    }

    // 4. ถ้าผ่านมาถึงจุดนี้ได้ แปลว่าเป็นข้อมูลจาก Clerk ตัวจริง 100%!
    const eventType = evt.type;
    const data = evt.data;

    console.log(`📥 [Webhook Verified!] Event: ${eventType}`);

    try {
      if (eventType === 'user.created') {
        const clerkId = data.id;
        // const firstName = data.first_name || '';
        // const lastName = data.last_name || '';
        // const email = data.email_addresses?.[0]?.email_address || '';

        console.log(`🎉 มีผู้ใช้สมัครใหม่! Clerk ID: ${clerkId}`);

        await this.prisma.person.create({
          data: {
            clerkId: clerkId,
            // firstName: firstName,
            // lastName: lastName,
            // email: email,
          },
        });
        console.log(`✅ [Success] User created in DB: ${clerkId}`);
        // } else if (eventType === 'organization.created') {
        //   const orgId = data.id;
        //   const orgName = data.name || 'Unknown Clinic';

        //   console.log(`🎉 มีองค์กรใหม่! Clerk ID: ${orgId}`);

        //   await this.prisma.organization.create({
        //     data: {
        //       name: orgName,
        //       clerkId: orgId,
        //     },
        //   });
        //   console.log(`✅ [Success] Organization created in DB: ${orgId}`);

        // } else if (eventType === 'user.updated') {
        //   const clerkId = data.id;
        //   const firstName = data.first_name || '';
        //   const lastName = data.last_name || '';

        //   console.log(`🔄 ผู้ใช้แก้ไขโปรไฟล์! Clerk ID: ${clerkId}`);
        //   await this.prisma.person.update({
        //     where: { clerkId: clerkId },
        //     data: {
        //       firstName: firstName,
        //       lastName: lastName,
        //     },
        //   });
        //   console.log('✅ อัปเดตข้อมูลในตาราง Person สำเร็จ!');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ [Database Error]:', error);
      throw new BadRequestException('Database operation failed');
    }
  }
}
