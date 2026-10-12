import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';

import { CommandBus } from '@nestjs/cqrs';

import {
  ClerkAuthGuard,
  type RequestFromClerkAuthGuard,
} from '../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../common/guards/clerk-user.decorator';

import {
  SendAgentMessageCommand,
  SendAgentMessageDtoBody,
  SendAgentMessageResponse,
} from './commands/send-agent-message.command';

@Controller('api/program/agent')
export class AgentController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('chat')
  @UseGuards(ClerkAuthGuard)
  async chat(
    @ClerkUser() clerkUser: ClerkUserData,
    @Request() request: RequestFromClerkAuthGuard,
    @Body() body: SendAgentMessageDtoBody,
  ): Promise<SendAgentMessageResponse> {
    return this.commandBus.execute<
      SendAgentMessageCommand,
      SendAgentMessageResponse
    >(
      new SendAgentMessageCommand(
        clerkUser.sub,

        // ส่ง token เดิมต่อไปยัง n8n
        request.headers.authorization ?? '',

        body,
      ),
    );
  }
}
