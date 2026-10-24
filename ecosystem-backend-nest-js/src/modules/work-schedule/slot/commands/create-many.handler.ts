import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import { CreateManyCommand } from './create-many.command';

import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';

@CommandHandler(CreateManyCommand)
export class CreateWorkScheduleSlotHandler implements ICommandHandler<
  CreateManyCommand,
  void
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
        if (error instanceof AppException) throw error;

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

  async execute(command: CreateManyCommand): Promise<void> {
    const { clerkId, param, body } = command;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    // =========================================================================
    // 🔴 จุดที่ 1: ตรวจสอบเวลาเวรทับซ้อนกันเองใน Payload (Incoming Request Overlap)
    // =========================================================================

    const slotsByStaff = new Map<string, Array<{ start: Date; end: Date }>>();

    for (const slot of body.slots) {
      const list = slotsByStaff.get(slot.staff_id) || [];
      list.push({
        start: new Date(slot.actual_start_time),
        end: new Date(slot.actual_end_time),
      });
      slotsByStaff.set(slot.staff_id, list);
    }

    // เรียงเวลา และเช็คเฉพาะรายการที่อยู่ติดกัน
    for (const [staffId, staffSlots] of slotsByStaff.entries()) {
      if (staffSlots.length <= 1) continue;

      staffSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

      for (let i = 0; i < staffSlots.length - 1; i++) {
        if (staffSlots[i].end > staffSlots[i + 1].start) {
          throw new BadRequestException(
            `พบข้อมูลเวลาเวรซ้ำซ้อนกันในรายการที่ส่งมาสำหรับ Staff ID: ${staffId}`,
          );
        }
      }
    }

    // =========================================================================
    // 🔴 จุดที่ 2: ตรวจสอบว่า Staff ทุกคน ผูกกับ Position นี้ไว้แล้วหรือยัง
    // =========================================================================

    const staffIds = Array.from(new Set(body.slots.map((s) => s.staff_id)));

    const validStaffPositions =
      await this.prisma.workScheduleStaffPosition.findMany({
        where: {
          workSchedulePositionId: param.position_id,
          workScheduleStaffId: { in: staffIds },
          deletedAt: null, // เช็คเฉพาะพนักงานที่ยังไม่ถูกลบ Soft Delete
        },
        select: { workScheduleStaffId: true },
      });

    const validStaffSet = new Set(
      validStaffPositions.map((sp) => sp.workScheduleStaffId),
    );
    const invalidStaffIds = staffIds.filter((id) => !validStaffSet.has(id));

    if (invalidStaffIds.length > 0) {
      throw new BadRequestException(
        `ไม่สามารถเพิ่มเวรได้ เนื่องจากพนักงานรหัส [${invalidStaffIds.join(', ')}] ยังไม่ได้ถูกลงทะเบียนในตำแหน่งงานนี้`,
      );
    }

    // คำนวณช่วงเวลาเริ่มต้นและสิ้นสุดของ Slot ทั้งหมดที่จะถูก Insert ในรอบนี้
    const minStartTime = new Date(
      Math.min(
        ...body.slots.map((s) => new Date(s.actual_start_time).getTime()),
      ),
    );
    const maxEndTime = new Date(
      Math.max(...body.slots.map((s) => new Date(s.actual_end_time).getTime())),
    );

    await this.executeWithRetry(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "work_schedule_position" WHERE id = ${param.position_id} FOR UPDATE`;

      // ดึง Slot ทั้งหมดของ Staff กลุ่มนี้ที่มีอยู่ใน ช่วงเวลานี้ + Slot ทั้งหมดของ positionId นี้ที่อยู่ใน ช่วงเวลานี้
      const existingSlots = await tx.workScheduleSlot.findMany({
        where: {
          actualStartTime: { lt: maxEndTime },
          actualEndTime: { gt: minStartTime },
          OR: [
            { staffId: { in: staffIds } },
            { positionId: param.position_id },
          ],
        },
        select: {
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

      // ตรวจสอบ body.slots ที่จะสร้างใหม่ มีซ้อนทับกับ existingSlots หรือไม่

      // เช็คทีละ Slot ใน payload เทียบกับที่ดึงมาจาก DB
      for (const newSlot of body.slots) {
        const newStart = new Date(newSlot.actual_start_time);
        const newEnd = new Date(newSlot.actual_end_time);

        const overlappingSlot = existingSlots.find(
          (dbSlot) =>
            dbSlot.staffId === newSlot.staff_id &&
            newStart < dbSlot.actualEndTime &&
            newEnd > dbSlot.actualStartTime,
        );

        if (overlappingSlot) {
          throw new BadRequestException(
            `พนักงานรหัส ${newSlot.staff_id} มีตารางเวรซ้ำซ้อนอยู่แล้วในช่วงเวลานี้ (${overlappingSlot.slotType.name}: ${overlappingSlot.actualStartTime.toISOString()} - ${overlappingSlot.actualEndTime.toISOString()})`,
          );
        }
      }

      const overlappingHolidays = await tx.workScheduleHoliday.findMany({
        where: {
          workScheduleStaffId: { in: staffIds },
          startTime: { lt: maxEndTime },
          endTime: { gt: minStartTime },
        },
        select: {
          workScheduleStaffId: true,
          startTime: true,
          endTime: true,
        },
      });

      for (const newSlot of body.slots) {
        const newStart = new Date(newSlot.actual_start_time);
        const newEnd = new Date(newSlot.actual_end_time);
        const overlappingHoliday = overlappingHolidays.find(
          (holiday) =>
            holiday.workScheduleStaffId === newSlot.staff_id &&
            newStart < holiday.endTime &&
            newEnd > holiday.startTime,
        );

        if (overlappingHoliday) {
          throw new AppException(
            ErrorCode.WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP,
            `ไม่สามารถจัดเวรได้ เนื่องจากพนักงานรหัส ${newSlot.staff_id} มีวันหยุดทับช่วงเวลา ${overlappingHoliday.startTime.toISOString()} - ${overlappingHoliday.endTime.toISOString()}`,
            HttpStatus.CONFLICT,
          );
        }
      }

      // 3. ดึงเงื่อนไข WorkScheduleMinMax ของตำแหน่งนี้เฉพาะช่วงเวลาที่คาบเกี่ยว (Overlap)
      const minMaxConfigs = await tx.workScheduleMinMax.findMany({
        where: {
          workSchedulePositionId: param.position_id,
          startTime: { lt: maxEndTime },
          endTime: { gt: minStartTime },
          max: { not: null }, // ดึงมาเฉพาะกฎที่มีการระบุ max ไว้
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

      // ตรวจสอบเกินค่า max หรือไม่

      if (minMaxConfigs.length > 0) {
        // 1. รวม Slots ทั้งหมดของ Position นี้
        const allPositionSlots = [
          ...existingSlots.filter((s) => s.positionId === param.position_id),
          ...body.slots.map((s) => ({
            // ปรับให้ชื่อตัวแปรเหมือนกัน
            actualStartTime: new Date(s.actual_start_time),
            actualEndTime: new Date(s.actual_end_time),
          })),
        ];

        // 2. สร้าง Global Timeline เส้นเดียว
        // กำหนดรหัส type: -1 (คนออก), 1 (คนเข้า), 2 (จุดเช็คสถานะจาก MinMax)
        const events: Array<{ time: number; type: number }> = [];

        for (const slot of allPositionSlots) {
          events.push({ time: slot.actualStartTime.getTime(), type: 1 });
          events.push({ time: slot.actualEndTime.getTime(), type: -1 });
        }

        // แทรกจุด Check Point ของ MinMax เข้าไปใน Timeline
        for (const config of minMaxConfigs) {
          events.push({ time: config.startTime.getTime(), type: 2 });
        }

        // 3. เรียงลำดับเวลาบน Timeline (หัวใจสำคัญของการเรียงลำดับ)
        events.sort((a, b) => {
          if (a.time !== b.time) return a.time - b.time;
          // กรณีเกิดเหตุการณ์พร้อมกันในเสี้ยววินาทีเดียวกัน ลำดับที่ควรเป็นคือ:
          // 1. type -1 (คนเก่าออกก่อน)
          // 2. type  1 (คนใหม่เข้ากะ)
          // 3. type  2 (ตรวจสอบจำนวนคนรวมหลังเปลี่ยนกะเสร็จ)
          return a.type - b.type;
        });

        // ให้ prisma เป็นคนเรียงมาให้ คือ best practice
        // minMaxConfigs.sort((a, b) => {
        //   return a.startTime.getTime() - b.startTime.getTime();
        // });

        let minMaxIndex = 0;

        // 4. กวาดเส้นเวลา (Sweep Line) แค่รอบเดียว!
        let currentConcurrent = 0;

        for (let i = 0; i < events.length; i++) {
          const event = events[i];

          // บวกลบจำนวนคนทำงาน
          if (event.type === 1 || event.type === -1) {
            currentConcurrent += event.type;
          }

          // Optimization: ถ้า event ถัดไปยังเป็นเวลาเดียวกัน ให้วนบวกลบเข้าออกให้เสร็จก่อน ค่อยประมวลผลเช็คทีเดียว
          if (i + 1 < events.length && events[i + 1].time === event.time) {
            continue;
          }

          // เอา minMaxIndex < minMaxConfigs.length ไว้ด้านหน้าสุด (สำคัญมาก!) ป้องกันแครชจาก minMaxConfigs[]
          while (
            minMaxIndex < minMaxConfigs.length &&
            minMaxConfigs[minMaxIndex].endTime.getTime() <= event.time
          ) {
            minMaxIndex++;
          }

          if (minMaxIndex >= minMaxConfigs.length) break;

          // ลงมาถึงนี่แปลว่า minMaxIndex < minMaxConfigs.length (เรียก minMaxConfigs[minMaxIndex] ได้แบบไม่แครชแน่ๆ)
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

      // เตรียมข้อมูล และบันทึกลง Database
      const slotsToInsert = body.slots.map((slot) => ({
        positionId: param.position_id,
        staffId: slot.staff_id,
        slotTypeId: slot.slot_type_id,

        actualStartTime: slot.actual_start_time,
        actualEndTime: slot.actual_end_time,
      }));

      await tx.workScheduleSlot.createMany({
        data: slotsToInsert,
      });
    });
  }
}
