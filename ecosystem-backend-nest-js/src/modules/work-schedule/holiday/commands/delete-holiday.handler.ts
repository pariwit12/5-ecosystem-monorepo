import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteHolidayCommand } from './delete-holiday.command';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';

@Injectable()
@CommandHandler(DeleteHolidayCommand)
export class DeleteHolidayHandler implements ICommandHandler<
  DeleteHolidayCommand,
  void
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: DeleteHolidayCommand): Promise<void> {
    const { clerkId, param } = command;
    const { place_id: placeId, holiday_id: holidayId } = param;

    const { staffId } =
      await this.accessControlService.verifyWorkScheduleStaffAccess(
        clerkId,
        placeId,
      );

    const result = await this.prisma.workScheduleHoliday.deleteMany({
      where: {
        id: holidayId,
        workScheduleStaffId: staffId,
      },
    });

    if (result.count === 0) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_HOLIDAY_NOT_FOUND,
        'ไม่พบข้อมูลวันหยุดที่ต้องการ หรือคุณไม่มีสิทธิ์เข้าถึงรายการนี้',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
