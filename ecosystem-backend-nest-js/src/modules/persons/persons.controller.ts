import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../common/guards/clerk-user.decorator';

import {
  SyncPersonToClerkCommand,
  SyncPersonToClerkResponse,
} from './sync/sync-person-to-clerk.command';

@Controller('api/persons')
export class PersonsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ==========================================
  // [POST] ตรวจสอบ clerkId ว่ามีใน Person หรือยัง ถ้ายังไม่มีจะได้สร้างให้เลย
  // ==========================================

  @Post('sync-person-to-clerk')
  @UseGuards(ClerkAuthGuard)
  async syncPersonToClerk(@ClerkUser() clerkUser: ClerkUserData) {
    return this.commandBus.execute<
      SyncPersonToClerkCommand,
      SyncPersonToClerkResponse
    >(new SyncPersonToClerkCommand(clerkUser.sub));
  }
}
