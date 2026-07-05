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

    await this.prisma.person.upsert({
      where: {
        clerkId: clerkId,
      },
      update: {},
      create: {
        clerkId: clerkId,
      },
      select: {
        id: true,
      },
    });
  }
}
