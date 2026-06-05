import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CreateOrganizationCommand,
  CreateOrganizationResponse,
} from './create-organization.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';

@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationHandler implements ICommandHandler<
  CreateOrganizationCommand,
  CreateOrganizationResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    command: CreateOrganizationCommand,
  ): Promise<CreateOrganizationResponse> {
    const { clerkId, body } = command;

    const { personId } = await this.accessControlService.verifyPerson(clerkId);

    // สร้างองค์กร และผูกสิทธิ์เข้าด้วยกันใน Transaction เดียว!
    await this.prisma.organization.create({
      data: {
        name: body.name,
        // สร้างความสัมพันธ์ (ตั้งให้คนที่กดสร้างเป็นสมาชิกทันที)
        personOrganizationAffiliations: {
          create: { personId: personId },
        },
      },
    });

    console.log(`✅ สร้างองค์กร ${body.name} สำเร็จ โดย: ${clerkId}`);

    return {
      success: true,
      message: 'สร้างองค์กรสำเร็จ!',
      // organizationId: newOrg.id,
      // organization: newOrg,
    };
  }
}
