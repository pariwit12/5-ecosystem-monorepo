import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AgentController } from './agent.controller';

import { SendAgentMessageHandler } from './commands/send-agent-message.handler';

import { N8nAgentService } from './services/n8n-agent.service';

const CommandHandlers = [SendAgentMessageHandler];

@Module({
  imports: [CqrsModule],

  controllers: [AgentController],

  providers: [...CommandHandlers, N8nAgentService],
})
export class AgentModule {}
