import { BadGatewayException, Injectable } from '@nestjs/common';

interface SendMessageParams {
  clerkId: string;
  clerkToken: string;
  message: string;
  conversationId?: string;
}

interface N8nChatResponse {
  output?: string;
  text?: string;
  response?: string;
  message?: string;
  sessionId?: string;
}

@Injectable()
export class N8nAgentService {
  private readonly n8nChatUrl =
    process.env.N8N_AGENT_CHAT_URL ??
    // 'http://localhost:5678/webhook/2c2f9db2-c65f-44ec-83f2-18ee6583f817/chat';
    // 'http://localhost:5678/webhook/bbc474b4-0bb3-4a1c-b84a-dcae2b07e538/chat'; // to n8n 03 - Chat Agent
    // 'http://localhost:5678/webhook-test/agent/chat'; // to n8n 05 - Chat Webhook (Test)
    'http://localhost:5678/webhook/agent/chat'; // to n8n 05 - Chat Webhook (Production)

  async sendMessage(params: SendMessageParams): Promise<{
    message: string;
    conversationId: string;
  }> {
    const { clerkId, clerkToken, message, conversationId } = params;

    const sessionId = conversationId ?? crypto.randomUUID();

    try {
      const response = await fetch(this.n8nChatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

          // ส่ง Clerk Token ต่อไปยัง n8n
          Authorization: clerkToken,
        },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId,
          chatInput: message,

          // Context นี้ไว้ใช้ debug / application context
          // ไม่ใช่ authentication หลัก
          metadata: {
            clerkId,
          },
        }),
      });

      const rawText = await response.text();

      if (!response.ok) {
        throw new BadGatewayException(
          `n8n returned HTTP ${response.status}: ${rawText}`,
        );
      }

      let data: N8nChatResponse;

      try {
        data = JSON.parse(rawText) as N8nChatResponse;
      } catch {
        throw new BadGatewayException('n8n returned an invalid JSON response');
      }

      const agentMessage =
        data.output ?? data.text ?? data.response ?? data.message;

      if (!agentMessage) {
        throw new BadGatewayException(
          'n8n response does not contain an agent message',
        );
      }

      return {
        message: agentMessage,
        conversationId: data.sessionId ?? sessionId,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException('ไม่สามารถเชื่อมต่อ n8n ได้');
    }
  }
}
