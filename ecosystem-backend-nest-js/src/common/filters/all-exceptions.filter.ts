import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';

// @Catch() แบบไม่ใส่อะไรเลย หมายถึง "ดักจับ Error ทุกชนิดบนโลก" ที่เกิดขึ้นในแอปนี้
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  // ==========================================
  // สำคัญ
  // ==========================================

  // เราจะเน้นการจัดการ Error ให้เป็นรูปแบบเดียวกัน เพื่อให้ frontend จับไปแสดงผลได้ง่าย ไม่ต้องมานั่งเช็คว่ามาจาก NestJS หรือ Prisma หรืออื่นๆเอง
  // เพื่อให้เขียนโค้ด frontend ได้ง่ายขึ้น

  // การจัดการเรื่อง Error ที่ดีที่สุดคือ การทำให้ไม่เกิด Error โดย ต้องออกแบบ frontend ให้แสดงลำดับการทำงาน ให้ผู้ใช้ได้ตรวจสอบความถูกต้องตั้งแต่ก่อนส่งมา
  // ไม่ใช่ให้ Backend หรือ DB มาคอยบอกว่า ผิดจากอะไร
  // ไม่ควรจะแสดงข้อมูลละเอียดเกินไป เนื่องจากจะทำให้โดน Hack ง่ายขึ้น

  // เช่น ถ้าจะสร้างรายการที่พ่วงกับ organization_id หน้าที่จะสร้างรายการนี้ก็ควรจะมาจากหน้า organization นั้นๆ เป็นต้น เพื่อเป็นการตรวจสอบว่าข้อมูล organization_id มีตัวตนอยู่ก่อนจะบันทึก
  // ส่วนที่เหลือ ก็ไม่ควรจะเป็นส่วนใหญ่ เราสามารถใช้ ให้ user รีเฟรชเพื่อเคลียร์แคชและโหลดข้อมูลตั้งต้นใหม่ หากไม่พบข้อมูลก็ควรจะเป็น API ที่ทำไว้แต่แรกจัดการต่อ เหมือนเข้ามาหน้านี้ครั้งแรก
  // ส่วนในหน้าที่มีการพิมพ์อะไร ถ้าเราให้รีเฟรช ข้อมูลพวกนี้ อาจจะหาย ซึ่งไม่ดีต่อการใช้งาน เราแค่ให้สั่ง clear cache เพื่อให้เรียก API ใหม่ก็พอ

  // ในวงการ Backend เรามีกฎทองคำเรื่องนี้ว่า "อย่าใช้ Database Error มาทำ Business Logic หลัก" ครับ

  // ==========================================
  // สำคัญ
  // ==========================================

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    // 1. ตั้งค่า Default: สมมติว่าพังร้ายแรงที่สุดไว้ก่อน (500 Internal Server Error)
    // 1. ตั้งค่า Default: มองว่าพังร้ายแรง (500) ไว้ก่อน
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage: unknown =
      'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
    let errorType = 'INTERNAL_SERVER_ERROR';

    // 2. เช็คว่าเป็น Error มาตรฐานของ NestJS ไหม (เช่น 400 Bad Request, 404 Not Found)
    // การที่โค้ดวิ่งเข้าเงื่อนไขที่ 2 (HttpException) แปลว่ามันคือ Error ที่ "ตั้งใจโยน" (เช่น เราเขียน throw เอง)
    // หรือ "ระบบของ NestJS โยนให้" (เช่น class-validator ตรวจเจอข้อมูลผิด)
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // ดึงข้อความ Error ออกมา (NestJS มักจะส่งเป็น Object ที่มี property message)

      // หน้าตาข้อมูลจะประมาณนี้
      // {
      //   "statusCode": 400,
      //   "message": "ชื่อคลินิกซ้ำครับ",
      //   "error": "Bad Request"
      // }
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // อันนี้คือกรณี ที่มาจาก:
        // throw new BadRequestException({ message: 'ผิดพลาด', code: 123 });

        const responseObj = exceptionResponse as Record<string, unknown>;

        // ในกรณีที่เป็น Error จาก class-validator (เมื่อคนกรอกฟอร์มผิด หรือ ข้อมูลเข้ามาแล้วไม่ถูกต้องตาม DTO)
        // ตัว NestJS มักจะส่ง responseObj.message กลับมาเป็น Array ของข้อความ (เพราะบางทีกรอกผิดพร้อมกัน 3 ช่อง มันก็จะส่งมาพร้อมกัน)
        // 🌟 [สิ่งที่เพิ่มมา] เช็คว่าถ้า class-validator ส่งมาเป็น Array ให้เอาข้อความแรกสุดมาโชว์พอเพื่อป้องกันการแสดงผลเพี้ยนที่ frontend
        // โดยในแง่ประสิทธิภาพ เราจะไปเขียนให้ตรวจสอบ input ให้ดีตั้งแต่ frontend

        // หน้าตาข้อมูลที่ซ่อนอยู่ใน exception (จุดสังเกตคือ message เป็น Array!):
        // {
        //   "statusCode": 400,
        //   "message": [
        //     "fieldEmail ต้องเป็นรูปแบบอีเมลเท่านั้น",
        //     "fieldStringNotEmpty ต้องมีความยาวอย่างน้อย 3 ตัวอักษร"
        //   ],
        //   "error": "Bad Request"
        // }
        if (Array.isArray(responseObj.message)) {
          errorMessage = responseObj.message[0];
        } else {
          errorMessage = responseObj.message ?? exceptionResponse;
        }
        errorType = (responseObj.error as string) ?? 'HTTP_EXCEPTION';
      } else {
        // อันนี้คือกรณี ที่มาจาก:
        // throw new BadRequestException('ชื่อคลินิกนี้มีคนใช้แล้วครับ');
        errorMessage = exceptionResponse;
      }
    }

    // 🌟 3. ดักจับ Prisma Error ไม่ให้รายละเอียด Database หลุดไปหน้าบ้าน
    // Prisma ไม่ใช่ระบบมาตรฐานของ NestJS ครับ เวลา Database มีปัญหา มันจึงโยน Error ของตัวเองที่ชื่อว่า PrismaClientKnownRequestError ออกมา

    // หน้าตาข้อมูลของ Prisma รหัส P2002 (ข้อมูลซ้ำ):
    // {
    //   "clientVersion": "5.x.x",
    //   "code": "P2002",
    //   "meta": { "target": ["email"] },
    //   "message": "\nInvalid `prisma.person.create()` invocation...\nUnique constraint failed on the fields: (`email`)"
    // }
    else if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      'clientVersion' in exception // จุดสังเกตว่าเป็น Prisma Error
      // ทำไมเราต้องดัก clientVersion และ code: เพราะมันคือ "ลายเซ็น" ของ Prisma ครับ
    ) {
      const prismaError = exception as Record<string, unknown>;
      if (prismaError.code === 'P2002') {
        httpStatus = HttpStatus.CONFLICT;
        errorMessage = 'ข้อมูลนี้มีอยู่ในระบบแล้ว (ข้อมูลซ้ำ)';
        errorType = 'PRISMA_UNIQUE_CONSTRAINT_FAILED';
        // } else if (prismaError.code === 'P2003') {
        //   // 🌟 ตั้งสถานะเป็น 400 Bad Request (หรือ 422 Unprocessable Entity ก็ได้ครับ)
        //   httpStatus = HttpStatus.BAD_REQUEST;
        //   errorType = 'PRISMA_FOREIGN_KEY_CONSTRAINT_FAILED';

        //   // 🛠️ แอบแกะชื่อฟิลด์ที่เป็นปัญหาออกมาจาก meta.field_name
        //   const meta = prismaError.meta as Record<string, unknown>;
        //   let fieldName = 'อ้างอิง';

        //   if (typeof meta?.field_name === 'string') {
        //     // Prisma มักจะส่งมาเป็นชื่อ index เช่น "B_id_fkey (index)"
        //     // เราอาจจะใช้คำรวมๆ หรือแปลงให้สวยงามขึ้น
        //     fieldName = meta.field_name.split('_fkey')[0] || fieldName;
        //   }

        //   errorMessage = `ข้อมูล ${fieldName} ที่ระบุไม่มีอยู่ในระบบ กรุณาตรวจสอบอีกครั้ง`;
      } else if (prismaError.code === 'P2025') {
        httpStatus = HttpStatus.NOT_FOUND;
        errorMessage = 'ไม่พบข้อมูลที่ต้องการดำเนินการ';
        errorType = 'PRISMA_RECORD_NOT_FOUND';
      } else {
        // Error อื่นๆ ของ Prisma ให้ปิดบังไว้ เพื่อความปลอดภัย
        errorMessage = 'เกิดข้อผิดพลาดในการจัดการฐานข้อมูล';
        errorType = `PRISMA_ERROR_${String(prismaError.code)}`;
      }
    }
    // กรณี Error ประหลาดอื่นๆ ที่เราไม่รู้จัก (เช่น โค้ดพัง, ตัวแปรเป็น undefined)
    // 4. ถ้าเป็นบั๊กระดับโค้ดพัง ให้ปริ้นลง Console เพื่อตามสืบ
    else {
      console.error('🔥 [Unhandled Exception]:', exception); // ปริ้นลง Console เพื่อให้เราตามมาแก้บั๊กได้
    }

    // 5. ประกอบร่าง JSON มาตรฐานส่งให้ Next.js หน้าบ้าน
    // 🌟 ดึงค่าออกมาพร้อมระบุ Type ให้ชัดเจน เพื่อกำจัด any
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const responseBody = {
      statusCode: httpStatus,
      message: errorMessage,
      errorType: errorType,
      timestamp: new Date().toISOString(),
      //   path: httpAdapter.getRequestUrl(request), // 🌟 เปลี่ยนมาใช้ตัวแปรที่ระบุ Type แล้ว
      // 🌟 ใช้ request.url ตรงๆ แทน httpAdapter เพื่อบังคับให้เป็น String แท้ๆ
      path: request.url,
    };

    // ส่งกลับไปหาผู้ใช้ด้วยโครงสร้างที่เรากำหนดไว้
    httpAdapter.reply(response, responseBody, httpStatus); // 🌟 เปลี่ยนมาใช้ตัวแปรที่ระบุ Type แล้ว
  }
}
