import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  SyncPersonToClerkCommand,
  SyncPersonToClerkResponse,
} from './sync-person-to-clerk.command';
import { PrismaService } from '../../../prisma/prisma.service';

@CommandHandler(SyncPersonToClerkCommand)
export class SyncPersonToClerkHandler implements ICommandHandler<
  SyncPersonToClerkCommand,
  SyncPersonToClerkResponse
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    command: SyncPersonToClerkCommand,
  ): Promise<SyncPersonToClerkResponse> {
    const { clerkId } = command;

    // 🌟 ท่า upsert: ถ้ามีอยู่แล้วไม่อัปเดตอะไร (หรือในอนาคตจะอัปเดตอะไร) ถ้าไม่มีให้สร้างใหม่
    await this.prisma.person.upsert({
      where: { clerkId: clerkId },
      update: {},
      create: {
        clerkId: clerkId,
      },
    });

    return {
      success: true,
      message: 'Person-Clerk synchronized successfully',
      // personId: person.id,
      // person: person,
    };
  }
}
