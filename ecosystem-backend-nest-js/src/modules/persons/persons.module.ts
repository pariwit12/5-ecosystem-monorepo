import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PersonsController } from './persons.controller';

import { SyncPersonToClerkHandler } from './sync/sync-person-to-clerk.handler';

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [];
const QueryHandlers = [];
const SyncHandlers = [SyncPersonToClerkHandler];

@Module({
  imports: [CqrsModule],
  controllers: [PersonsController],
  providers: [...CommandHandlers, ...QueryHandlers, ...SyncHandlers],
})
export class PersonsModule {}
