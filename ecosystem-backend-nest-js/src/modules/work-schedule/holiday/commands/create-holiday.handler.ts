import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { CreateHolidayCommand } from './create-holiday.command';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';

export interface CreateHolidayResult {
  id: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

@Injectable()
@CommandHandler(CreateHolidayCommand)
export class CreateHolidayHandler implements ICommandHandler<
  CreateHolidayCommand,
  CreateHolidayResult
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  private async executeWithRetry<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            return await operation(tx);
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error: unknown) {
        if (error instanceof AppException) {
          throw error;
        }

        const prismaError = error as { code?: string };
        if (prismaError?.code === 'P2034') {
          attempt++;
          if (attempt > maxRetries) {
            throw new AppException(
              ErrorCode.DEFAULT_ERROR,
              'เกิดการแข่งขันในการทำรายการ กรุณาลองใหม่อีกครั้ง',
              HttpStatus.CONFLICT,
            );
          }
          continue;
        }

        throw error;
      }
    }
    throw new AppException(
      ErrorCode.DEFAULT_ERROR,
      'เกิดข้อผิดพลาดในการทำรายการ',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private async verifyMinimumStaff(
    tx: Prisma.TransactionClient,
    staffId: string,
    placeId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const activeInPlace = {
      deletedAt: null,
      organizationWorkSchedulePlaceId: placeId,
    };
    const requesterPositions = await tx.workScheduleStaffPosition.findMany({
      where: {
        workScheduleStaffId: staffId,
        deletedAt: null,
        workScheduleStaff: activeInPlace,
        workSchedulePosition: activeInPlace,
      },
      select: { workSchedulePositionId: true },
    });

    if (requesterPositions.length === 0) return;

    const minMaxRules = await tx.workScheduleMinMax.findMany({
      where: {
        workSchedulePositionId: {
          in: requesterPositions.map((link) => link.workSchedulePositionId),
        },
        min: { not: null },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: {
        workSchedulePositionId: true,
        min: true,
        startTime: true,
        endTime: true,
      },
    });

    if (minMaxRules.length === 0) return;

    const staffPositions = await tx.workScheduleStaffPosition.findMany({
      where: {
        workSchedulePositionId: {
          in: [
            ...new Set(minMaxRules.map((rule) => rule.workSchedulePositionId)),
          ],
        },
        deletedAt: null,
        workScheduleStaff: activeInPlace,
        workSchedulePosition: activeInPlace,
      },
      select: { workScheduleStaffId: true, workSchedulePositionId: true },
    });

    const staffByPosition = new Map<string, Set<string>>();
    const eligibleStaffIds = new Set<string>();
    for (const link of staffPositions) {
      const positionStaff =
        staffByPosition.get(link.workSchedulePositionId) ?? new Set<string>();
      positionStaff.add(link.workScheduleStaffId);
      staffByPosition.set(link.workSchedulePositionId, positionStaff);
      eligibleStaffIds.add(link.workScheduleStaffId);
    }

    const existingHolidays = await tx.workScheduleHoliday.findMany({
      where: {
        workScheduleStaffId: { in: [...eligibleStaffIds] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { workScheduleStaffId: true, startTime: true, endTime: true },
    });
    const holidays = [
      ...existingHolidays,
      { workScheduleStaffId: staffId, startTime, endTime },
    ];

    for (const rule of minMaxRules) {
      if (rule.min === null) continue;

      // Only the intersection can be affected by this new holiday.
      const checkStart = Math.max(
        startTime.getTime(),
        rule.startTime.getTime(),
      );
      const checkEnd = Math.min(endTime.getTime(), rule.endTime.getTime());
      const positionStaff =
        staffByPosition.get(rule.workSchedulePositionId) ?? new Set<string>();
      const overlappingHolidays = holidays.filter(
        (holiday) =>
          positionStaff.has(holiday.workScheduleStaffId) &&
          holiday.startTime.getTime() < checkEnd &&
          holiday.endTime.getTime() > checkStart,
      );

      const boundaries = new Set([checkStart, checkEnd]);
      for (const holiday of overlappingHolidays) {
        boundaries.add(Math.max(checkStart, holiday.startTime.getTime()));
        boundaries.add(Math.min(checkEnd, holiday.endTime.getTime()));
      }
      const times = [...boundaries].sort((a, b) => a - b);

      for (let i = 0; i < times.length - 1; i++) {
        // A staff member is absent once, even with several overlapping holidays.
        const absentStaff = new Set(
          overlappingHolidays
            .filter(
              (holiday) =>
                holiday.startTime.getTime() < times[i + 1] &&
                holiday.endTime.getTime() > times[i],
            )
            .map((holiday) => holiday.workScheduleStaffId),
        );

        if (positionStaff.size - absentStaff.size < rule.min) {
          throw new AppException(
            ErrorCode.WORK_SCHEDULE_HOLIDAY_MIN_STAFF_NOT_ENOUGH,
            'ไม่สามารถบันทึกวันหยุดได้ เนื่องจากจำนวนพนักงานที่พร้อมทำงานจะต่ำกว่าจำนวนขั้นต่ำ (Min) ในช่วงเวลานี้',
            HttpStatus.CONFLICT,
          );
        }
      }
    }
  }

  async execute(command: CreateHolidayCommand): Promise<CreateHolidayResult> {
    const { clerkId, param, body } = command;
    const placeId = param.place_id;

    // 1. Verify staff access -> staffId
    const { staffId } =
      await this.accessControlService.verifyWorkScheduleStaffAccess(
        clerkId,
        placeId,
      );

    let startTime: Date;
    let endTime: Date;

    // 2. Resolve start/end times
    if (body.type === 'FULL_DAY') {
      const place = await this.prisma.organizationWorkSchedulePlace.findUnique({
        where: { id: placeId },
        select: { timezone: true },
      });

      if (!place) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
          'ไม่พบข้อมูลสถานที่ทำงาน',
          HttpStatus.NOT_FOUND,
        );
      }

      const timezone = place.timezone;
      const startDt = DateTime.fromISO(body.date, { zone: timezone }).startOf(
        'day',
      );
      const endDt = startDt.plus({ days: 1 }).startOf('day');

      if (!startDt.isValid || !endDt.isValid) {
        throw new AppException(
          ErrorCode.DEFAULT_ERROR,
          'วันที่หรือ timezone ไม่ถูกต้อง',
          HttpStatus.BAD_REQUEST,
        );
      }

      startTime = startDt.toUTC().toJSDate();
      endTime = endDt.toUTC().toJSDate();
    } else {
      startTime = new Date(body.start_time);
      endTime = new Date(body.end_time);
    }

    // 3. Check slot overlap and minimum staffing, then insert in one transaction.
    return await this.executeWithRetry(async (tx) => {
      const overlappingSlot = await tx.workScheduleSlot.findFirst({
        where: {
          staffId,
          actualStartTime: { lt: endTime },
          actualEndTime: { gt: startTime },
        },
        select: { id: true },
      });

      if (overlappingSlot) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_HOLIDAY_SLOT_OVERLAP,
          'ไม่สามารถบันทึกวันหยุดได้เนื่องจากช่วงเวลาทับซ้อนกับเวรการทำงานที่คุณมีอยู่',
          HttpStatus.CONFLICT,
        );
      }

      await this.verifyMinimumStaff(tx, staffId, placeId, startTime, endTime);

      const holiday = await tx.workScheduleHoliday.create({
        data: {
          workScheduleStaffId: staffId,
          startTime,
          endTime,
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          createdAt: true,
        },
      });

      return {
        id: holiday.id,
        startTime: holiday.startTime.toISOString(),
        endTime: holiday.endTime.toISOString(),
        createdAt: holiday.createdAt.toISOString(),
      };
    });
  }
}
