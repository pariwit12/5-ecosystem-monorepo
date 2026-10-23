import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HolidayController } from './holiday.controller';
import { CreateHolidayHandler } from './commands/create-holiday.handler';
import { DeleteHolidayHandler } from './commands/delete-holiday.handler';
import { ListMyHolidaysHandler } from './queries/list-my-holidays.handler';

const CommandHandlers = [CreateHolidayHandler, DeleteHolidayHandler];
const QueryHandlers = [ListMyHolidaysHandler];

@Module({
  imports: [CqrsModule],
  controllers: [HolidayController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class HolidayModule {}
