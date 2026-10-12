import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  SendAgentMessageCommand,
  SendAgentMessageResponse,
} from './send-agent-message.command';

import { N8nAgentService } from '../services/n8n-agent.service';

@CommandHandler(SendAgentMessageCommand)
export class SendAgentMessageHandler implements ICommandHandler<
  SendAgentMessageCommand,
  SendAgentMessageResponse
> {
  constructor(private readonly n8nAgentService: N8nAgentService) {}

  async execute(
    command: SendAgentMessageCommand,
  ): Promise<SendAgentMessageResponse> {
    const { clerkId, clerkToken, body } = command;

    // ==>>==>>== Main Logic ==<<==<<==

    const result = await this.n8nAgentService.sendMessage({
      clerkId,
      clerkToken,
      message: body.message,
      conversationId: body.conversationId,
    });

    // ==>>==>>== 📨 จัดเรียงข้อมูล เตรียมส่งกลับ ==<<==<<==

    return {
      responseDataString: result.message,
      conversationId: result.conversationId,
    };
  }
}
