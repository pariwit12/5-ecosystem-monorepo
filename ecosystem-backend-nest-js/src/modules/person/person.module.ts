import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PersonController } from './person.controller';

import { CreatePersonHandler } from './commands/create-person.handler';

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [CreatePersonHandler];
const QueryHandlers = [];

@Module({
  imports: [CqrsModule],
  controllers: [PersonController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class PersonModule {}
