import { Controller, Post, UseGuards } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../common/guards/clerk-user.decorator';

import { CreatePersonCommand } from './commands/create-person.command';

@Controller('api/person')
export class PersonController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ==========================================
  // [POST] Business Logic
  // ==========================================

  @Post('')
  @UseGuards(ClerkAuthGuard)
  async createPerson(@ClerkUser() clerkUser: ClerkUserData) {
    return this.commandBus.execute<CreatePersonCommand, void>(
      new CreatePersonCommand(clerkUser.sub),
    );
  }
}
