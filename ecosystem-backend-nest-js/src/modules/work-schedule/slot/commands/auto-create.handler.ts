import { BadRequestException, HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { DateTime, IANAZone } from 'luxon';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AutoCreateCommand, AutoCreateResponse } from './auto-create.command';

interface Interval {
  start: number;
  end: number;
}

interface StaffInterval extends Interval {
  staffId: string;
}

interface Template {
  id: string;
  workSchedulePositionId: string;
  startTime: string;
  durationMinute: number;
  slotType: { id: string; positionId: string; deletedAt: Date | null };
}

interface Occurrence extends Interval {
  templateId: string;
  slotTypeId: string;
}

interface MinMaxRule extends Interval {
  min: number | null;
  max: number | null;
}

interface PlannedSlot extends StaffInterval {
  slotTypeId: string;
}

@CommandHandler(AutoCreateCommand)
export class AutoCreateHandler implements ICommandHandler<
  AutoCreateCommand,
  AutoCreateResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: AutoCreateCommand): Promise<AutoCreateResponse> {
    const { clerkId, param, body } = command;
    // PostgreSQL returns UUIDs in lowercase, including when input uses uppercase.
    const positionId = param.position_id.toLowerCase();
    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      positionId,
    );

    const request = {
      start: new Date(body.start_time).getTime(),
      end: new Date(body.end_time).getTime(),
    };

    return this.executeWithRetry(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "work_schedule_position" WHERE id = ${positionId} FOR UPDATE`;

      const position = await tx.workSchedulePosition.findUnique({
        where: { id: positionId },
        select: {
          deletedAt: true,
          organizationWorkSchedulePlace: {
            select: { timezone: true, deletedAt: true },
          },
        },
      });
      if (
        !position ||
        position.deletedAt !== null ||
        !position.organizationWorkSchedulePlace ||
        position.organizationWorkSchedulePlace.deletedAt !== null
      ) {
        throw new BadRequestException(
          'ตำแหน่งงานหรือสถานที่ทำงานไม่พร้อมใช้งาน',
        );
      }
      const timezone = position.organizationWorkSchedulePlace.timezone;
      if (!IANAZone.isValidZone(timezone)) {
        throw new BadRequestException('Timezone ของสถานที่ทำงานไม่ถูกต้อง');
      }

      const templates = await tx.workScheduleSlotTemplate.findMany({
        where: { id: { in: body.slot_template_ids } },
        select: {
          id: true,
          workSchedulePositionId: true,
          startTime: true,
          durationMinute: true,
          slotType: {
            select: { id: true, positionId: true, deletedAt: true },
          },
        },
      });
      this.validateTemplates(templates, body.slot_template_ids, positionId);

      const staffPositions = await tx.workScheduleStaffPosition.findMany({
        where: {
          workSchedulePositionId: positionId,
          workScheduleStaffId: { in: body.staff_ids },
          deletedAt: null,
        },
        select: { workScheduleStaffId: true },
      });
      const staffCandidates = [
        ...new Set(staffPositions.map((staff) => staff.workScheduleStaffId)),
      ].sort();
      if (staffCandidates.length !== body.staff_ids.length) {
        throw new BadRequestException(
          'พนักงานที่เลือกบางคนไม่ได้ลงทะเบียนในตำแหน่งงานนี้',
        );
      }

      const occurrences = this.generateOccurrences(
        templates,
        request,
        timezone,
      );

      const existingSlots = await tx.workScheduleSlot.findMany({
        where: {
          actualStartTime: { lt: new Date(request.end) },
          actualEndTime: { gt: new Date(request.start) },
          OR: [{ positionId }, { staffId: { in: body.staff_ids } }],
        },
        select: {
          positionId: true,
          staffId: true,
          actualStartTime: true,
          actualEndTime: true,
        },
      });
      const holidays = await tx.workScheduleHoliday.findMany({
        where: {
          workScheduleStaffId: { in: body.staff_ids },
          startTime: { lt: new Date(request.end) },
          endTime: { gt: new Date(request.start) },
        },
        select: {
          workScheduleStaffId: true,
          startTime: true,
          endTime: true,
        },
      });
      const minMaxConfigs = await tx.workScheduleMinMax.findMany({
        where: {
          workSchedulePositionId: positionId,
          startTime: { lt: new Date(request.end) },
          endTime: { gt: new Date(request.start) },
        },
        select: { min: true, max: true, startTime: true, endTime: true },
      });

      const slots = existingSlots.map((slot) => ({
        positionId: slot.positionId,
        staffId: slot.staffId,
        start: slot.actualStartTime.getTime(),
        end: slot.actualEndTime.getTime(),
      }));
      const positionSlots = slots.filter(
        (slot) => slot.positionId === positionId,
      );
      const staffHolidays = holidays.map((holiday) => ({
        staffId: holiday.workScheduleStaffId,
        start: holiday.startTime.getTime(),
        end: holiday.endTime.getTime(),
      }));
      const rules = minMaxConfigs.map((rule) => ({
        min: rule.min,
        max: rule.max,
        start: rule.startTime.getTime(),
        end: rule.endTime.getTime(),
      }));

      const requirements = this.calculateRequirements(
        request,
        rules,
        positionSlots,
        occurrences,
      );
      const planned: PlannedSlot[] = [];
      for (const occurrence of occurrences) {
        const requiredAdditional = requirements.get(occurrence) ?? 0;
        let assigned = 0;
        for (const staffId of staffCandidates) {
          if (assigned === requiredAdditional) break;
          if (
            !this.isStaffAvailable(
              staffId,
              occurrence,
              slots,
              staffHolidays,
              planned,
            )
          ) {
            continue;
          }
          planned.push({ ...occurrence, staffId });
          assigned++;
        }
        if (assigned < requiredAdditional) {
          throw new BadRequestException(
            'พนักงานที่เลือกไม่เพียงพอสำหรับจำนวนขั้นต่ำในช่วงเวลาที่ต้องการ',
          );
        }
      }

      if (planned.length === 0) return { createdCount: 0 };
      this.validateMaximum(request, rules, positionSlots, planned);

      const result = await tx.workScheduleSlot.createMany({
        data: planned.map((slot) => ({
          positionId,
          staffId: slot.staffId,
          slotTypeId: slot.slotTypeId,
          actualStartTime: new Date(slot.start),
          actualEndTime: new Date(slot.end),
        })),
      });
      return { createdCount: result.count };
    });
  }

  private validateTemplates(
    templates: Template[],
    selectedIds: string[],
    positionId: string,
  ): void {
    if (
      new Set(templates.map((template) => template.id)).size !==
      selectedIds.length
    ) {
      throw new BadRequestException('ไม่พบ Slot Template ที่เลือกครบทุกแบบ');
    }
    for (const template of templates) {
      if (
        template.workSchedulePositionId !== positionId ||
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(template.startTime) ||
        !Number.isInteger(template.durationMinute) ||
        template.durationMinute < 1 ||
        !template.slotType ||
        template.slotType.positionId !== positionId ||
        template.slotType.deletedAt !== null
      ) {
        throw new BadRequestException(
          'ข้อมูล Slot Template หรือ Slot Type ไม่ถูกต้อง',
        );
      }
    }
  }

  private resolveWallTime(
    day: DateTime,
    startTime: string,
    timezone: string,
  ): DateTime {
    const [hour, minute] = startTime.split(':').map(Number);
    const intended = {
      year: day.year,
      month: day.month,
      day: day.day,
      hour,
      minute,
    };
    const resolved = DateTime.fromObject(intended, { zone: timezone });
    if (
      !resolved.isValid ||
      resolved.year !== intended.year ||
      resolved.month !== intended.month ||
      resolved.day !== intended.day ||
      resolved.hour !== hour ||
      resolved.minute !== minute ||
      resolved.getPossibleOffsets().length !== 1
    ) {
      throw new BadRequestException(
        'เวลา Slot Template ไม่มีอยู่จริงหรือมีหลาย offset ใน Timezone ของสถานที่ทำงาน',
      );
    }
    return resolved;
  }

  private generateOccurrences(
    templates: Template[],
    request: Interval,
    timezone: string,
  ): Occurrence[] {
    const overlapping: Occurrence[] = [];
    const lastDay = DateTime.fromMillis(request.end, {
      zone: timezone,
    }).startOf('day');
    for (const template of templates) {
      let day = DateTime.fromMillis(request.start, { zone: timezone })
        .minus({ minutes: template.durationMinute })
        .startOf('day');
      for (
        ;
        day.toMillis() <= lastDay.toMillis();
        day = day.plus({ days: 1 }).startOf('day')
      ) {
        const start = this.resolveWallTime(day, template.startTime, timezone);
        const occurrence = {
          start: start.toMillis(),
          end: start.plus({ minutes: template.durationMinute }).toMillis(),
          templateId: template.id,
          slotTypeId: template.slotType.id,
        };
        if (this.overlaps(occurrence, request)) overlapping.push(occurrence);
      }
    }
    overlapping.sort(
      (a, b) =>
        a.start - b.start ||
        a.end - b.end ||
        (a.templateId < b.templateId
          ? -1
          : a.templateId > b.templateId
            ? 1
            : 0),
    );
    for (let i = 1; i < overlapping.length; i++) {
      if (this.overlaps(overlapping[i - 1], overlapping[i])) {
        throw new BadRequestException(
          'Slot Template ที่เลือกมีช่วงเวลาทับซ้อนกัน',
        );
      }
    }
    return overlapping.filter(
      (occurrence) =>
        occurrence.start >= request.start && occurrence.end <= request.end,
    );
  }

  private overlaps(a: Interval, b: Interval): boolean {
    return a.start < b.end && a.end > b.start;
  }

  private boundaries(target: Interval, intervals: Interval[]): number[] {
    const values = new Set([target.start, target.end]);
    for (const interval of intervals) {
      if (this.overlaps(interval, target)) {
        values.add(Math.max(interval.start, target.start));
        values.add(Math.min(interval.end, target.end));
      }
    }
    return [...values].sort((a, b) => a - b);
  }

  private calculateRequirements(
    request: Interval,
    rules: MinMaxRule[],
    existing: Interval[],
    occurrences: Occurrence[],
  ): Map<Occurrence, number> {
    const requirements = new Map<Occurrence, number>();
    for (const rule of rules) {
      if (rule.min === null || rule.min === 0 || !this.overlaps(rule, request))
        continue;
      const target = {
        start: Math.max(rule.start, request.start),
        end: Math.min(rule.end, request.end),
      };
      const boundaries = this.boundaries(target, [...existing, ...occurrences]);
      for (let i = 1; i < boundaries.length; i++) {
        const segment = { start: boundaries[i - 1], end: boundaries[i] };
        const existingCount = existing.filter((slot) =>
          this.overlaps(slot, segment),
        ).length;
        const deficit = Math.max(0, rule.min - existingCount);
        if (deficit === 0) continue;
        const occurrence = occurrences.find(
          (candidate) =>
            candidate.start <= segment.start && candidate.end >= segment.end,
        );
        if (!occurrence) {
          throw new BadRequestException(
            'Slot Template ที่เลือกไม่ครอบคลุมช่วงเวลาที่จำนวนเวรต่ำกว่าขั้นต่ำ',
          );
        }
        requirements.set(
          occurrence,
          Math.max(requirements.get(occurrence) ?? 0, deficit),
        );
      }
    }
    return requirements;
  }

  private isStaffAvailable(
    staffId: string,
    occurrence: Interval,
    existingSlots: StaffInterval[],
    holidays: StaffInterval[],
    plannedSlots: StaffInterval[],
  ): boolean {
    return [existingSlots, holidays, plannedSlots].every(
      (intervals) =>
        !intervals.some(
          (interval) =>
            interval.staffId === staffId && this.overlaps(interval, occurrence),
        ),
    );
  }

  private validateMaximum(
    request: Interval,
    rules: MinMaxRule[],
    existing: Interval[],
    planned: Interval[],
  ): void {
    for (const rule of rules) {
      if (rule.max === null || !this.overlaps(rule, request)) continue;
      const target = {
        start: Math.max(rule.start, request.start),
        end: Math.min(rule.end, request.end),
      };
      const boundaries = this.boundaries(target, [...existing, ...planned]);
      for (let i = 1; i < boundaries.length; i++) {
        const segment = { start: boundaries[i - 1], end: boundaries[i] };
        const plannedCount = planned.filter((slot) =>
          this.overlaps(slot, segment),
        ).length;
        const existingCount = existing.filter((slot) =>
          this.overlaps(slot, segment),
        ).length;
        if (plannedCount > 0 && existingCount + plannedCount > rule.max) {
          throw new BadRequestException(
            'ไม่สามารถเพิ่มเวรได้เนื่องจากเกินจำนวนสูงสุด',
          );
        }
      }
    }
  }

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
        )
          throw error;
        if ((error as { code?: string })?.code !== 'P2034') throw error;
        attempt++;
        if (attempt > maxRetries) {
          throw new AppException(
            ErrorCode.DEFAULT_ERROR,
            'เกิดการแข่งขันในการทำรายการ กรุณาลองใหม่อีกครั้ง',
            HttpStatus.CONFLICT,
          );
        }
      }
    }
    throw new AppException(
      ErrorCode.DEFAULT_ERROR,
      'เกิดข้อผิดพลาดในการทำรายการ',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
