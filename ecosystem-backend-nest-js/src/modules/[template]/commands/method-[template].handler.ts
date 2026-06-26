import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

// ปรับตามใช้งานจริง
import {
  MethodTemplateCommand,
  MethodTemplateResponse,
} from './method-[template].command';

import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';

@CommandHandler(MethodTemplateCommand)
export class MethodTemplateHandler implements ICommandHandler<
  MethodTemplateCommand,
  MethodTemplateResponse // หากมีการคืนค่า หากไม่มีก็ลบตรงนี้ออก หรือว่า ใส่เป็น void ได้เลย
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    command: MethodTemplateCommand,
  ): Promise<MethodTemplateResponse> {
    // หากไม่คืนค่าก็ให้ใส่เป็น <void> แทน <MethodTemplateResponse>

    const { clerkId, param, body } = command;

    // ตรวจสอบ AccessControl (ปรับตามจริง)
    // eslint-disable-next-line
    const { personId } = await this.accessControlService.verifyPerson(clerkId);

    // โค้ด prisma ตาม logic ของ API (ปรับตามจริง)

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

    // eslint-disable-next-line
    const updatedOrg = await this.prisma.organization.update({
      where: { id: param.organization_id },
      data: { name: body.name },
      select: {
        id: true,
        name: true,
      },
    });

    // ปรับตามจริง (ไว้ debug)
    // console.log(`✅ สร้างองค์กร ${dto.name} สำเร็จ โดย: ${clerkId}`);

    // หากมีการคืนค่า หากไม่มีก็ลบตรงนี้ออกได้เลย
    return {
      // ปรับตามจริง
      id: newPerson.id,
      // name: updatedOrg.name,

      // กรณีอยากส่งข้อมูลกลับไป
      // organizationId: newOrg.id,
      // organization: newOrg,
    };
  }
}

// อย่าลืมไปลงทะเบียน ใน [template].module.ts
