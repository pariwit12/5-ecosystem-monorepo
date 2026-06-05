import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.useGlobalPipes(new ZodValidationPipe()); // 🌟 ต้องมีบรรทัดนี้ เพื่อให้ Zod ทำงานครับ

  // 🟢 แก้ไขการตั้งค่า CORS ตรงนี้ครับ
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://pariwit-ecosystem.vercel.app', // 👈 ใส่ URL หน้าเว็บ Vercel
    ], // อนุญาตให้หน้าบ้านพอร์ตนี้เข้ามาได้
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // จำเป็นมากสำหรับการส่ง Token หรือ Cookie
  });

  // 🌟 เปิดใช้งาน Global Exception Filter
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // ใส่ '0.0.0.0' เพื่อให้ deploy ขึ้น render แล้วไม่พัง ใน node เวอร์ชันใหม่
  // การใส่ '0.0.0.0' เป็นภาษาสากลของเซิร์ฟเวอร์ที่แปลว่า "เปิดประตูรับแขกจากทุกช่องทางเครือข่าย" ครับ Render จะได้เดินเข้ามาตรวจเช็คแอปเราได้ครับ
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('🔥 Server failed to start:', err);
});
