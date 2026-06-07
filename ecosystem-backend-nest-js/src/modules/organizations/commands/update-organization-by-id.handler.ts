import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UpdateOrganizationByIdCommand,
  UpdateOrganizationByIdResponse,
} from './update-organization-by-id.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';

@CommandHandler(UpdateOrganizationByIdCommand)
export class UpdateOrganizationByIdHandler implements ICommandHandler<
  UpdateOrganizationByIdCommand,
  UpdateOrganizationByIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    command: UpdateOrganizationByIdCommand,
  ): Promise<UpdateOrganizationByIdResponse> {
    const { clerkId, param, body } = command;

    await this.accessControlService.verifyOrganizationAccess(
      clerkId,
      param.organization_id,
    );

    const updatedOrg = await this.prisma.organization.update({
      where: { id: param.organization_id },
      data: { name: body.name },
      select: {
        id: true,
        // name: true,
      },
    });

    return {
      id: updatedOrg.id,
      //   name: updatedOrg.name,
    };
  }
}
