import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  MethodTemplateCommand,
  MethodTemplateResponse,
} from './method-[template].command';
import { PrismaService } from '../../../prisma/prisma.service';

@CommandHandler(MethodTemplateHandler)
export class MethodTemplateHandler implements ICommandHandler<
  MethodTemplateCommand,
  MethodTemplateResponse
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    command: MethodTemplateCommand,
  ): Promise<MethodTemplateResponse> {
    // eslint-disable-next-line
    const { dto, clerkId, personId } = command;

    // โค้ด prisma ตาม logic ของ API
    //

    // eslint-disable-next-line
    const newPerson = await this.prisma.person.create({
      data: {
        clerkId: clerkId,
      },
    });

    // eslint-disable-next-line
    const person = await this.prisma.person.upsert({
      where: { clerkId: clerkId },
      update: {},
      create: {
        clerkId: clerkId,
      },
    });

    // Console log หลัง action สำเร็จ หากต้องการ
    // console.log(`✅ สร้างองค์กร ${dto.name} สำเร็จ โดย: ${clerkId}`);

    return {
      success: true,
      message: 'method-[template] สำเร็จ!',

      // กรณีอยากส่งข้อมูลกลับไป
      // organizationId: newOrg.id,
      // organization: newOrg,
    };
  }
}
