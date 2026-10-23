import {
  Controller,
  UseGuards,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../../common/guards/clerk-user.decorator';
import {
  CreateHolidayCommand,
  CreateHolidayDtoParam,
  CreateHolidayDtoBody,
  type CreateHolidayDtoBodyType,
} from './commands/create-holiday.command';
import type { CreateHolidayResult } from './commands/create-holiday.handler';
import {
  DeleteHolidayCommand,
  DeleteHolidayDtoParam,
} from './commands/delete-holiday.command';
import {
  ListMyHolidaysQuery,
  ListMyHolidaysDtoParam,
  ListMyHolidaysResponse,
} from './queries/list-my-holidays.query';

@Controller('api/work-schedule/holidays')
@UseGuards(ClerkAuthGuard)
export class HolidayController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('places/:place_id')
  async createHoliday(
    @Param() param: CreateHolidayDtoParam,
    @Body() body: CreateHolidayDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ): Promise<CreateHolidayResult> {
    return this.commandBus.execute<CreateHolidayCommand, CreateHolidayResult>(
      new CreateHolidayCommand(
        clerkUser.sub,
        param,
        body as unknown as CreateHolidayDtoBodyType,
      ),
    );
  }

  @Get('places/:place_id')
  async listMyHolidays(
    @Param() param: ListMyHolidaysDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ): Promise<ListMyHolidaysResponse> {
    return this.queryBus.execute<ListMyHolidaysQuery, ListMyHolidaysResponse>(
      new ListMyHolidaysQuery(clerkUser.sub, param),
    );
  }

  @Delete('places/:place_id/:holiday_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHoliday(
    @Param() param: DeleteHolidayDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ): Promise<void> {
    return this.commandBus.execute<DeleteHolidayCommand, void>(
      new DeleteHolidayCommand(clerkUser.sub, param),
    );
  }
}
