import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PersonController } from './person.controller';

import { CreatePersonHandler } from './commands/create-person.handler';
import { PatientNumberService } from './services/patient-number.service';

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [CreatePersonHandler];
const QueryHandlers = [];

@Module({
  imports: [CqrsModule],
  controllers: [PersonController],
  providers: [...CommandHandlers, ...QueryHandlers, PatientNumberService],
  exports: [PatientNumberService],
})
export class PersonModule {}
