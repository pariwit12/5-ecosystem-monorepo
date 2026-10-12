import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';

import { CreatePersonCommand } from './create-person.command';

@CommandHandler(CreatePersonCommand)
export class CreatePersonHandler implements ICommandHandler<
  CreatePersonCommand,
  void
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreatePersonCommand): Promise<void> {
    const { clerkId } = command;

    const account = await this.prisma.userAccount.upsert({
      where: { clerkId },
      update: {},
      create: { clerkId },
      select: { id: true, person: { select: { id: true } } },
    });

    if (!account.person) {
      await this.prisma.person.create({ data: { userAccountId: account.id } });
    }
  }
}
