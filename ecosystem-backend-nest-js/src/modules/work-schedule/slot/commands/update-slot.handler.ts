import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { UpdateSlotCommand, UpdateSlotResponse } from './update-slot.command';

@CommandHandler(UpdateSlotCommand)
export class UpdateSlotHandler implements ICommandHandler<
  UpdateSlotCommand,
  UpdateSlotResponse
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
        return await this.prisma.$transaction(async (tx) => operation(tx), {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        if (
          error instanceof AppException ||
          error instanceof BadRequestException
        ) {
          throw error;
        }

        if ((error as { code?: string })?.code === 'P2034') {
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

  async execute(command: UpdateSlotCommand): Promise<UpdateSlotResponse> {
    const { clerkId, param, body } = command;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const newStart = new Date(body.actual_start_time);
    const newEnd = new Date(body.actual_end_time);

    return this.executeWithRetry(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "work_schedule_position" WHERE id = ${param.position_id} FOR UPDATE`;

      const existingSlot = await tx.workScheduleSlot.findFirst({
        where: {
          id: param.slot_id,
          positionId: param.position_id,
        },
        select: { id: true },
      });

      if (!existingSlot) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND,
          'ไม่พบรายการเวรในระบบ หรือรายการเวรไม่ได้อยู่ในตำแหน่งงานนี้',
          HttpStatus.NOT_FOUND,
        );
      }

      const validStaffPosition = await tx.workScheduleStaffPosition.findFirst({
        where: {
          workSchedulePositionId: param.position_id,
          workScheduleStaffId: body.staff_id,
          deletedAt: null,
        },
        select: { workScheduleStaffId: true },
      });

      if (!validStaffPosition) {
        throw new BadRequestException(
          `ไม่สามารถแก้ไขเวรได้ เนื่องจากพนักงานรหัส [${body.staff_id}] ยังไม่ได้ถูกลงทะเบียนในตำแหน่งงานนี้`,
        );
      }

      const validSlotType = await tx.workScheduleSlotType.findFirst({
        where: {
          id: body.slot_type_id,
          positionId: param.position_id,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!validSlotType) {
        throw new BadRequestException(
          'ไม่สามารถแก้ไขเวรได้ เนื่องจากไม่พบประเภทกะการทำงาน หรือประเภทกะถูกลบไปแล้ว',
        );
      }

      // ดึง Slot อื่นๆ ใน Position หรือของ Staff คนนี้ในช่วงเวลาใหม่ โดยตัด Slot ที่กำลังแก้ไขออกเสมอ
      const conflictingSlots = await tx.workScheduleSlot.findMany({
        where: {
          id: { not: param.slot_id },
          actualStartTime: { lt: newEnd },
          actualEndTime: { gt: newStart },
          OR: [{ staffId: body.staff_id }, { positionId: param.position_id }],
        },
        select: {
          id: true,
          positionId: true,
          staffId: true,
          slotType: {
            select: {
              id: true,
              name: true,
            },
          },
          actualStartTime: true,
          actualEndTime: true,
        },
      });

      // ตรวจสอบเวลาเวรซ้อนทับของ Staff คนเดียวกัน
      const overlappingSlot = conflictingSlots.find(
        (dbSlot) =>
          dbSlot.staffId === body.staff_id &&
          newStart < dbSlot.actualEndTime &&
          newEnd > dbSlot.actualStartTime,
      );

      if (overlappingSlot) {
        throw new BadRequestException(
          `พนักงานรหัส ${body.staff_id} มีตารางเวรซ้ำซ้อนอยู่แล้วในช่วงเวลานี้ (${overlappingSlot.slotType.name}: ${overlappingSlot.actualStartTime.toISOString()} - ${overlappingSlot.actualEndTime.toISOString()})`,
        );
      }

      // ตรวจสอบวันหยุดของ Staff
      const overlappingHolidays = await tx.workScheduleHoliday.findMany({
        where: {
          workScheduleStaffId: body.staff_id,
          startTime: { lt: newEnd },
          endTime: { gt: newStart },
        },
        select: {
          workScheduleStaffId: true,
          startTime: true,
          endTime: true,
        },
      });

      const overlappingHoliday = overlappingHolidays.find(
        (holiday) => newStart < holiday.endTime && newEnd > holiday.startTime,
      );

      if (overlappingHoliday) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP,
          `ไม่สามารถจัดเวรได้ เนื่องจากพนักงานรหัส ${body.staff_id} มีวันหยุดทับช่วงเวลา ${overlappingHoliday.startTime.toISOString()} - ${overlappingHoliday.endTime.toISOString()}`,
          HttpStatus.CONFLICT,
        );
      }

      // ตรวจสอบ MinMax
      const minMaxConfigs = await tx.workScheduleMinMax.findMany({
        where: {
          workSchedulePositionId: param.position_id,
          startTime: { lt: newEnd },
          endTime: { gt: newStart },
          max: { not: null },
        },
        select: {
          max: true,
          startTime: true,
          endTime: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      if (minMaxConfigs.length > 0) {
        const allPositionSlots = [
          ...conflictingSlots.filter((s) => s.positionId === param.position_id),
          {
            actualStartTime: newStart,
            actualEndTime: newEnd,
          },
        ];

        const events: Array<{ time: number; type: number }> = [];

        for (const slot of allPositionSlots) {
          events.push({ time: slot.actualStartTime.getTime(), type: 1 });
          events.push({ time: slot.actualEndTime.getTime(), type: -1 });
        }

        for (const config of minMaxConfigs) {
          events.push({ time: config.startTime.getTime(), type: 2 });
        }

        events.sort((a, b) => {
          if (a.time !== b.time) return a.time - b.time;
          return a.type - b.type;
        });

        let minMaxIndex = 0;
        let currentConcurrent = 0;

        for (let i = 0; i < events.length; i++) {
          const event = events[i];

          if (event.type === 1 || event.type === -1) {
            currentConcurrent += event.type;
          }

          if (i + 1 < events.length && events[i + 1].time === event.time) {
            continue;
          }

          while (
            minMaxIndex < minMaxConfigs.length &&
            minMaxConfigs[minMaxIndex].endTime.getTime() <= event.time
          ) {
            minMaxIndex++;
          }

          if (minMaxIndex >= minMaxConfigs.length) break;

          if (
            minMaxConfigs[minMaxIndex].startTime.getTime() <= event.time &&
            minMaxConfigs[minMaxIndex].endTime.getTime() > event.time
          ) {
            if (currentConcurrent > minMaxConfigs[minMaxIndex].max!) {
              throw new BadRequestException(
                `ไม่สามารถบันทึกได้ เนื่องจากในช่วงเวลา ${minMaxConfigs[minMaxIndex].startTime.toISOString()} - ${minMaxConfigs[minMaxIndex].endTime.toISOString()} ` +
                  `มีพนักงานปฏิบัติงานเกินกำหนด ณ เวลา ${new Date(event.time).toISOString()} ` +
                  `(นับได้ ${currentConcurrent} (มีอยู่แล้ว + ที่กำลังจะสร้าง) คน แต่จำกัดสูงสุด ${minMaxConfigs[minMaxIndex].max} คน)`,
              );
            }
          }
        }
      }

      const updatedSlot = await tx.workScheduleSlot.update({
        where: {
          id: param.slot_id,
          positionId: param.position_id,
        },
        data: {
          staffId: body.staff_id,
          slotTypeId: body.slot_type_id,
          actualStartTime: body.actual_start_time,
          actualEndTime: body.actual_end_time,
        },
        select: {
          id: true,
          staffId: true,
          staffPosition: {
            select: {
              workScheduleStaff: {
                select: {
                  name: true,
                },
              },
            },
          },
          slotTypeId: true,
          slotType: {
            select: {
              name: true,
            },
          },
          actualStartTime: true,
          actualEndTime: true,
        },
      });

      return {
        id: updatedSlot.id,
        staffId: updatedSlot.staffId,
        staffName: updatedSlot.staffPosition.workScheduleStaff.name,
        slotTypeId: updatedSlot.slotTypeId,
        slotTypeName: updatedSlot.slotType.name,
        actualStartTime: updatedSlot.actualStartTime.toISOString(),
        actualEndTime: updatedSlot.actualEndTime.toISOString(),
      };
    });
  }
}
