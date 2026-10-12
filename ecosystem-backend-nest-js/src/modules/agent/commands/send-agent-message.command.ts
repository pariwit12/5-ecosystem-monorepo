import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==>>==>>== DTO Zod Schema + Backend Type (Body) ==<<==<<==

export const SendAgentMessageDtoBodySchema = z.object({
  message: z
    .string({
      message: 'message ต้องเป็น type: string เท่านั้น',
    })
    .trim()
    .min(1, 'กรุณาระบุข้อความ (ห้ามเป็นค่าว่าง)'),

  conversationId: z
    .string({
      message: 'conversationId ต้องเป็น type: string เท่านั้น',
    })
    .trim()
    .min(1, 'conversationId ห้ามเป็นค่าว่าง')
    .optional(),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class SendAgentMessageDtoBody extends createZodDto(
  SendAgentMessageDtoBodySchema,
) {}

// ==>>==>>== (จบ) DTO Zod Schema + Backend Type (Body) ==<<==<<==

// ==>>==>>== "หน้าตาข้อมูล" ขาเข้า ==<<==<<==

export class SendAgentMessageCommand {
  constructor(
    public readonly clerkId: string,
    public readonly clerkToken: string,
    public readonly body: SendAgentMessageDtoBody,
  ) {}
}

// ==>>==>>== (จบ) "หน้าตาข้อมูล" ขาเข้า ==<<==<<==

// ==>>==>>== "หน้าตาข้อมูล" ขาออก ==<<==<<==

export interface SendAgentMessageResponse {
  responseDataString: string;
  conversationId: string;
}

// ==>>==>>== (จบ) "หน้าตาข้อมูล" ขาออก ==<<==<<==
