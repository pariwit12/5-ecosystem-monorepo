import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AutoCreateCommand, AutoCreateDtoBody } from './auto-create.command';
import { AutoCreateHandler } from './auto-create.handler';

describe('AutoCreateHandler', () => {
  const positionId = '018f6c5e-8557-7888-8123-456789abcdef';
  const otherPositionId = '018f6c5e-8557-7888-8123-456789abcdee';
  const staffId = '018f6c5e-8557-7888-8123-456789000001';
  const secondStaffId = '018f6c5e-8557-7888-8123-456789000002';
  const unselectedStaffId = '018f6c5e-8557-7888-8123-456789000003';
  const templateId = '018f6c5e-8557-7888-8123-456789000004';
  const secondTemplateId = '018f6c5e-8557-7888-8123-456789000005';
  const slotTypeId = '018f6c5e-8557-7888-8123-456789000006';
  const start = '2026-10-24T01:00:00.000Z'; // 08:00 Asia/Bangkok
  const end = '2026-10-24T05:00:00.000Z'; // 12:00 Asia/Bangkok

  interface Template {
    id: string;
    workSchedulePositionId: string;
    startTime: string;
    durationMinute: number;
    slotType: { id: string; positionId: string; deletedAt: Date | null };
  }

  interface InsertSlot {
    positionId: string;
    staffId: string;
    slotTypeId: string;
    actualStartTime: Date;
    actualEndTime: Date;
  }

  const tx = {
    $queryRaw: jest.fn(),
    workSchedulePosition: { findUnique: jest.fn() },
    workScheduleSlotTemplate: { findMany: jest.fn() },
    workScheduleStaffPosition: { findMany: jest.fn() },
    workScheduleSlot: { findMany: jest.fn(), createMany: jest.fn() },
    workScheduleHoliday: { findMany: jest.fn() },
    workScheduleMinMax: { findMany: jest.fn() },
  };
  const prisma = { $transaction: jest.fn() };
  const accessControlService = {
    verifyWorkSchedulePositionByWorkScheduleAdmin: jest.fn(),
  };
  let handler: AutoCreateHandler;

  function command(body: Partial<AutoCreateDtoBody> = {}) {
    return new AutoCreateCommand(
      'clerk-1',
      { position_id: positionId },
      {
        start_time: start,
        end_time: end,
        slot_template_ids: [templateId],
        staff_ids: [secondStaffId, staffId],
        ...body,
      },
    );
  }

  function position(timezone = 'Asia/Bangkok') {
    return {
      deletedAt: null,
      organizationWorkSchedulePlace: { timezone, deletedAt: null },
    };
  }

  function template(overrides: Partial<Template> = {}): Template {
    return {
      id: templateId,
      workSchedulePositionId: positionId,
      startTime: '08:00',
      durationMinute: 240,
      slotType: { id: slotTypeId, positionId, deletedAt: null },
      ...overrides,
    };
  }

  function slot(
    staff = unselectedStaffId,
    slotStart = start,
    slotEnd = end,
    slotPosition = positionId,
  ) {
    return {
      positionId: slotPosition,
      staffId: staff,
      actualStartTime: new Date(slotStart),
      actualEndTime: new Date(slotEnd),
    };
  }

  function holiday(staff = staffId, holidayStart = start, holidayEnd = end) {
    return {
      workScheduleStaffId: staff,
      startTime: new Date(holidayStart),
      endTime: new Date(holidayEnd),
    };
  }

  function rule(
    min: number | null = 1,
    max: number | null = null,
    ruleStart = start,
    ruleEnd = end,
  ) {
    return {
      min,
      max,
      startTime: new Date(ruleStart),
      endTime: new Date(ruleEnd),
    };
  }

  function insertedSlots(attempt = 0): InsertSlot[] {
    const [args] = tx.workScheduleSlot.createMany.mock.calls[attempt] as [
      { data: InsertSlot[] },
    ];
    return args.data;
  }

  async function expectAtomicFailure(request = command()) {
    await expect(handler.execute(request)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.workScheduleSlot.createMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  }

  beforeEach(() => {
    jest.resetAllMocks();
    tx.$queryRaw.mockResolvedValue([{ id: positionId }]);
    tx.workSchedulePosition.findUnique.mockResolvedValue(position());
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([template()]);
    tx.workScheduleStaffPosition.findMany.mockResolvedValue([
      { workScheduleStaffId: secondStaffId },
      { workScheduleStaffId: staffId },
    ]);
    tx.workScheduleSlot.findMany.mockResolvedValue([]);
    tx.workScheduleHoliday.findMany.mockResolvedValue([]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule()]);
    tx.workScheduleSlot.createMany.mockImplementation(
      ({ data }: { data: InsertSlot[] }) =>
        Promise.resolve({ count: data.length }),
    );
    prisma.$transaction.mockImplementation(
      (operation: (client: unknown) => Promise<unknown>) => operation(tx),
    );
    handler = new AutoCreateHandler(
      prisma as never,
      accessControlService as never,
    );
  });

  it('authorizes before a Serializable transaction, then locks before rereading the position', async () => {
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 1,
    });

    expect(
      accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ).toHaveBeenCalledWith('clerk-1', positionId);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    const [query, parameter] = tx.$queryRaw.mock.calls[0] as [
      TemplateStringsArray,
      string,
    ];
    expect(query.join('?')).toMatch(
      /SELECT id FROM "work_schedule_position" WHERE id = \? FOR UPDATE/,
    );
    expect(parameter).toBe(positionId);
    expect(
      accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin.mock
        .invocationCallOrder[0],
    ).toBeLessThan(prisma.$transaction.mock.invocationCallOrder[0]);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.workSchedulePosition.findUnique.mock.invocationCallOrder[0],
    );
    expect(tx.workSchedulePosition.findUnique).toHaveBeenCalledWith({
      where: { id: positionId },
      select: {
        deletedAt: true,
        organizationWorkSchedulePlace: {
          select: { timezone: true, deletedAt: true },
        },
      },
    });
  });

  it('does not start a transaction when authorization fails', async () => {
    const denied = new Error('Access denied');
    accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin.mockRejectedValue(
      denied,
    );
    await expect(handler.execute(command())).rejects.toBe(denied);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['missing position', null],
    ['deleted position', { ...position(), deletedAt: new Date(start) }],
    [
      'deleted place',
      {
        ...position(),
        organizationWorkSchedulePlace: {
          timezone: 'Asia/Bangkok',
          deletedAt: new Date(start),
        },
      },
    ],
    ['missing place', { ...position(), organizationWorkSchedulePlace: null }],
    ['invalid IANA zone', position('Invalid/Timezone')],
    ['fixed offset instead of IANA zone', position('UTC+7')],
  ])('rejects %s after the lock', async (_, record) => {
    tx.workSchedulePosition.findUnique.mockResolvedValue(record);
    await expectAtomicFailure();
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.workScheduleSlotTemplate.findMany).not.toHaveBeenCalled();
  });

  it('rejects missing templates rather than silently skipping selection', async () => {
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([]);
    await expectAtomicFailure();
  });

  it.each([
    ['wrong position', template({ workSchedulePositionId: otherPositionId })],
    [
      'slot type in another position',
      template({
        slotType: {
          id: slotTypeId,
          positionId: otherPositionId,
          deletedAt: null,
        },
      }),
    ],
    [
      'deleted slot type',
      template({
        slotType: { id: slotTypeId, positionId, deletedAt: new Date(start) },
      }),
    ],
    ...['8:00', '24:00', '08:60', '08:00:00', 'invalid'].map((startTime) => [
      `malformed start time ${startTime}`,
      template({ startTime }),
    ]),
    ...[0, -1, 1.5, Number.NaN].map((durationMinute) => [
      `invalid duration ${durationMinute}`,
      template({ durationMinute }),
    ]),
  ])('rejects a selected template with %s', async (_, record) => {
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([record]);
    await expectAtomicFailure();
  });

  it('requires all selected staff to have active positions inside the transaction', async () => {
    tx.workScheduleStaffPosition.findMany.mockResolvedValue([
      { workScheduleStaffId: staffId },
    ]);
    await expectAtomicFailure();
    expect(tx.workScheduleStaffPosition.findMany).toHaveBeenCalledWith({
      where: {
        workSchedulePositionId: positionId,
        workScheduleStaffId: { in: [secondStaffId, staffId] },
        deletedAt: null,
      },
      select: { workScheduleStaffId: true },
    });
  });

  it('resolves a normal local occurrence and uses its template slot type', async () => {
    await handler.execute(command());
    expect(insertedSlots()).toEqual([
      {
        positionId,
        staffId,
        slotTypeId,
        actualStartTime: new Date(start),
        actualEndTime: new Date(end),
      },
    ]);
  });

  it('accepts uppercase UUID selections and counts canonical target-position coverage', async () => {
    tx.workScheduleSlot.findMany.mockResolvedValue([slot()]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(2)]);
    const request = command({
      slot_template_ids: [templateId.toUpperCase()],
      staff_ids: [secondStaffId.toUpperCase(), staffId.toUpperCase()],
    });

    await expect(
      handler.execute(
        new AutoCreateCommand(
          request.clerkId,
          { position_id: positionId.toUpperCase() },
          request.body,
        ),
      ),
    ).resolves.toEqual({ createdCount: 1 });
    expect(insertedSlots()).toEqual([
      {
        positionId,
        staffId,
        slotTypeId,
        actualStartTime: new Date(start),
        actualEndTime: new Date(end),
      },
    ]);
  });

  it('queries target position coverage and selected staff conflicts across all positions with half-open predicates', async () => {
    await handler.execute(command());
    expect(tx.workScheduleSlot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          actualStartTime: { lt: new Date(end) },
          actualEndTime: { gt: new Date(start) },
          OR: [{ positionId }, { staffId: { in: [secondStaffId, staffId] } }],
        },
      }),
    );
    expect(tx.workScheduleHoliday.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workScheduleStaffId: { in: [secondStaffId, staffId] },
          startTime: { lt: new Date(end) },
          endTime: { gt: new Date(start) },
        },
      }),
    );
    expect(tx.workScheduleMinMax.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workSchedulePositionId: positionId,
          startTime: { lt: new Date(end) },
          endTime: { gt: new Date(start) },
        },
      }),
    );
  });

  it('iterates local calendar days across DST instead of adding 24 hours', async () => {
    const rangeStart = '2026-03-07T13:00:00.000Z';
    const rangeEnd = '2026-03-09T13:00:00.000Z';
    tx.workSchedulePosition.findUnique.mockResolvedValue(
      position('America/New_York'),
    );
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
      template({ durationMinute: 60 }),
    ]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([
      rule(1, null, rangeStart, '2026-03-07T14:00:00.000Z'),
      rule(1, null, '2026-03-08T12:00:00.000Z', '2026-03-08T13:00:00.000Z'),
      rule(1, null, '2026-03-09T12:00:00.000Z', rangeEnd),
    ]);
    await expect(
      handler.execute(command({ start_time: rangeStart, end_time: rangeEnd })),
    ).resolves.toEqual({ createdCount: 3 });
    expect(insertedSlots().map((s) => s.actualStartTime)).toEqual([
      new Date(rangeStart),
      new Date('2026-03-08T12:00:00.000Z'),
      new Date('2026-03-09T12:00:00.000Z'),
    ]);
  });

  it('includes the final local date after a DST gap at midnight', async () => {
    const rangeStart = '2018-11-03T11:00:00.000Z';
    const rangeEnd = '2018-11-05T11:00:00.000Z';
    tx.workSchedulePosition.findUnique.mockResolvedValue(
      position('America/Sao_Paulo'),
    );
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
      template({ durationMinute: 60 }),
    ]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([
      rule(1, null, rangeStart, '2018-11-03T12:00:00.000Z'),
      rule(1, null, '2018-11-04T10:00:00.000Z', '2018-11-04T11:00:00.000Z'),
      rule(1, null, '2018-11-05T10:00:00.000Z', rangeEnd),
    ]);

    await expect(
      handler.execute(command({ start_time: rangeStart, end_time: rangeEnd })),
    ).resolves.toEqual({ createdCount: 3 });
    expect(insertedSlots().map((s) => s.actualStartTime)).toEqual([
      new Date(rangeStart),
      new Date('2018-11-04T10:00:00.000Z'),
      new Date('2018-11-05T10:00:00.000Z'),
    ]);
  });

  it.each([
    ['starts before the request', '2026-10-24T02:00:00.000Z', end],
    ['ends after the request', start, '2026-10-24T04:00:00.000Z'],
  ])(
    'does not schedule an occurrence that %s',
    async (_, rangeStart, rangeEnd) => {
      tx.workScheduleMinMax.findMany.mockResolvedValue([]);
      await expect(
        handler.execute(
          command({ start_time: rangeStart, end_time: rangeEnd }),
        ),
      ).resolves.toEqual({ createdCount: 0 });
      expect(tx.workScheduleSlot.createMany).not.toHaveBeenCalled();
    },
  );

  it('rejects overlapping selected templates', async () => {
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
      template(),
      template({
        id: secondTemplateId,
        startTime: '09:00',
        durationMinute: 60,
      }),
    ]);
    await expectAtomicFailure(
      command({ slot_template_ids: [templateId, secondTemplateId] }),
    );
  });

  it('rejects a template whose daily occurrences overlap each other', async () => {
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
      template({ durationMinute: 1500 }),
    ]);
    await expectAtomicFailure(
      command({ end_time: '2026-10-26T05:00:00.000Z' }),
    );
  });

  it('uses duration lookback to reject overlap with the previous local day', async () => {
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
      template({ startTime: '22:00', durationMinute: 600 }),
      template({
        id: secondTemplateId,
        startTime: '07:00',
        durationMinute: 120,
      }),
    ]);
    await expectAtomicFailure(
      command({
        start_time: '2026-10-23T23:00:00.000Z',
        slot_template_ids: [templateId, secondTemplateId],
      }),
    );
  });

  it('allows touching occurrence boundaries and reuses the lowest eligible staff', async () => {
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
      template({ durationMinute: 120 }),
      template({
        id: secondTemplateId,
        startTime: '10:00',
        durationMinute: 120,
      }),
    ]);
    await expect(
      handler.execute(
        command({ slot_template_ids: [secondTemplateId, templateId] }),
      ),
    ).resolves.toEqual({ createdCount: 2 });
    expect(insertedSlots().map((s) => s.staffId)).toEqual([staffId, staffId]);
    expect(insertedSlots()[0].actualEndTime).toEqual(
      insertedSlots()[1].actualStartTime,
    );
    expect(tx.workScheduleSlot.createMany).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'nonexistent',
      '02:30',
      '2026-03-08T05:00:00.000Z',
      '2026-03-08T10:00:00.000Z',
    ],
    [
      'ambiguous',
      '01:30',
      '2026-11-01T04:00:00.000Z',
      '2026-11-01T10:00:00.000Z',
    ],
  ])(
    'rejects a %s template wall time',
    async (_, startTime, rangeStart, rangeEnd) => {
      tx.workSchedulePosition.findUnique.mockResolvedValue(
        position('America/New_York'),
      );
      tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
        template({ startTime, durationMinute: 60 }),
      ]);
      await expectAtomicFailure(
        command({ start_time: rangeStart, end_time: rangeEnd }),
      );
    },
  );

  it.each([
    [
      'spring forward',
      '01:30',
      120,
      '2026-03-08T06:00:00.000Z',
      '2026-03-08T09:00:00.000Z',
      '2026-03-08T06:30:00.000Z',
      '2026-03-08T08:30:00.000Z',
    ],
    [
      'fall back',
      '00:30',
      180,
      '2026-11-01T04:00:00.000Z',
      '2026-11-01T08:00:00.000Z',
      '2026-11-01T04:30:00.000Z',
      '2026-11-01T07:30:00.000Z',
    ],
  ])(
    'adds elapsed minutes across %s from an unambiguous wall time',
    async (
      _,
      startTime,
      durationMinute,
      rangeStart,
      rangeEnd,
      slotStart,
      slotEnd,
    ) => {
      tx.workSchedulePosition.findUnique.mockResolvedValue(
        position('America/New_York'),
      );
      tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
        template({ startTime, durationMinute }),
      ]);
      tx.workScheduleMinMax.findMany.mockResolvedValue([
        rule(1, null, slotStart, slotEnd),
      ]);
      await handler.execute(
        command({ start_time: rangeStart, end_time: rangeEnd }),
      );
      expect(insertedSlots()[0]).toMatchObject({
        actualStartTime: new Date(slotStart),
        actualEndTime: new Date(slotEnd),
      });
    },
  );

  it('counts an existing slot of an unselected staff member toward minimum coverage', async () => {
    tx.workScheduleSlot.findMany.mockResolvedValue([slot()]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(2)]);
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 1,
    });
    expect(insertedSlots().map((s) => s.staffId)).toEqual([staffId]);
  });

  it.each([
    ['minimum already covered', [rule(1)], [slot()]],
    ['zero minimum', [rule(0)], []],
    ['null minimum', [rule(null, 2)], []],
    ['no rule', [], []],
  ])('returns zero without inserting when %s', async (_, rules, slots) => {
    tx.workScheduleMinMax.findMany.mockResolvedValue(rules);
    tx.workScheduleSlot.findMany.mockResolvedValue(slots);
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 0,
    });
    expect(tx.workScheduleSlot.createMany).not.toHaveBeenCalled();
  });

  it('creates exactly the missing coverage, scanning staff IDs in ascending order', async () => {
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(2)]);
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 2,
    });
    expect(insertedSlots().map((s) => s.staffId)).toEqual([
      staffId,
      secondStaffId,
    ]);
  });

  it('takes the maximum atomic deficit across segments instead of summing deficits', async () => {
    tx.workScheduleSlot.findMany.mockResolvedValue([
      slot(unselectedStaffId, start, '2026-10-24T03:00:00.000Z'),
    ]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(2)]);
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 2,
    });
    expect(insertedSlots()).toHaveLength(2);
  });

  it('clips rules and existing coverage to the request before splitting segments', async () => {
    tx.workScheduleSlot.findMany.mockResolvedValue([
      slot(
        unselectedStaffId,
        '2026-10-24T00:00:00.000Z',
        '2026-10-24T03:00:00.000Z',
      ),
    ]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([
      rule(1, null, '2026-10-24T00:00:00.000Z', '2026-10-24T06:00:00.000Z'),
    ]);
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 1,
    });
    expect(insertedSlots()[0]).toMatchObject({
      actualStartTime: new Date(start),
      actualEndTime: new Date(end),
    });
  });

  it('fails atomically when a deficient segment has no fully contained candidate', async () => {
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
      template({ durationMinute: 120 }),
    ]);
    await expectAtomicFailure();
  });

  it.each<[string, ReturnType<typeof slot>[], ReturnType<typeof holiday>[]]>([
    ['target position slot', [slot(staffId)], []],
    ['another position slot', [slot(staffId, start, end, otherPositionId)], []],
    ['holiday', [], [holiday()]],
  ])(
    'skips the lowest staff ID when unavailable because of a %s',
    async (_, slots, holidays) => {
      tx.workScheduleSlot.findMany.mockResolvedValue(slots);
      tx.workScheduleHoliday.findMany.mockResolvedValue(holidays);
      // Target-position slots still count toward coverage, so require one more.
      tx.workScheduleMinMax.findMany.mockResolvedValue([
        rule(slots.some((s) => s.positionId === positionId) ? 2 : 1),
      ]);
      await expect(handler.execute(command())).resolves.toEqual({
        createdCount: 1,
      });
      expect(insertedSlots()[0].staffId).toBe(secondStaffId);
    },
  );

  it.each([
    [
      'slot ending at occurrence start',
      [slot(staffId, '2026-10-24T00:00:00.000Z', start)],
      [],
    ],
    [
      'slot starting at occurrence end',
      [slot(staffId, end, '2026-10-24T06:00:00.000Z')],
      [],
    ],
    [
      'holiday ending at occurrence start',
      [],
      [holiday(staffId, '2026-10-24T00:00:00.000Z', start)],
    ],
    [
      'holiday starting at occurrence end',
      [],
      [holiday(staffId, end, '2026-10-24T06:00:00.000Z')],
    ],
  ])(
    'allows the lowest staff ID with a touching %s',
    async (_, slots, holidays) => {
      tx.workScheduleSlot.findMany.mockResolvedValue(slots);
      tx.workScheduleHoliday.findMany.mockResolvedValue(holidays);
      await handler.execute(command());
      expect(insertedSlots()[0].staffId).toBe(staffId);
    },
  );

  it('rejects when selected staff are insufficient without using unselected staff', async () => {
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(3)]);
    await expectAtomicFailure();
  });

  it('guards against a planned slot overlap while allowing another staff or a touching boundary', () => {
    // Valid selected occurrences cannot overlap, so exercise this defensive
    // allocation guard directly rather than bypassing occurrence validation.
    type Interval = { start: number; end: number };
    type StaffInterval = Interval & { staffId: string };
    const availability = handler as unknown as {
      isStaffAvailable(
        staff: string,
        occurrence: Interval,
        existingSlots: StaffInterval[],
        holidays: StaffInterval[],
        plannedSlots: StaffInterval[],
      ): boolean;
    };
    const occurrence = {
      start: new Date(start).getTime(),
      end: new Date(end).getTime(),
    };
    const planned = [{ ...occurrence, staffId }];

    expect(
      availability.isStaffAvailable(staffId, occurrence, [], [], planned),
    ).toBe(false);
    expect(
      availability.isStaffAvailable(secondStaffId, occurrence, [], [], planned),
    ).toBe(true);
    expect(
      availability.isStaffAvailable(
        staffId,
        { start: occurrence.end, end: occurrence.end + 60_000 },
        [],
        [],
        planned,
      ),
    ).toBe(true);
  });

  it('does not insert an earlier feasible occurrence when a later one lacks staff', async () => {
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
      template({ durationMinute: 120 }),
      template({
        id: secondTemplateId,
        startTime: '10:00',
        durationMinute: 120,
      }),
    ]);
    tx.workScheduleHoliday.findMany.mockResolvedValue([
      holiday(staffId, '2026-10-24T03:00:00.000Z', end),
      holiday(secondStaffId, '2026-10-24T03:00:00.000Z', end),
    ]);
    await expectAtomicFailure(
      command({ slot_template_ids: [templateId, secondTemplateId] }),
    );
  });

  it('rejects planned plus existing coverage above maximum in a touched segment', async () => {
    tx.workScheduleSlot.findMany.mockResolvedValue([
      slot(unselectedStaffId, start, '2026-10-24T03:00:00.000Z'),
    ]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(2, 2)]);
    await expectAtomicFailure();
  });

  it('allows planned plus existing coverage equal to maximum', async () => {
    tx.workScheduleSlot.findMany.mockResolvedValue([slot()]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(2, 2)]);
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 1,
    });
  });

  it('does not block a zero plan because of a pre-existing maximum violation', async () => {
    tx.workScheduleSlot.findMany.mockResolvedValue([
      slot(),
      slot(secondStaffId),
    ]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(1, 1)]);
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 0,
    });
    expect(tx.workScheduleSlot.createMany).not.toHaveBeenCalled();
  });

  it('rejects a pre-existing maximum violation in a segment receiving planned slots', async () => {
    const midpoint = '2026-10-24T03:00:00.000Z';
    tx.workScheduleSlot.findMany.mockResolvedValue([
      slot(unselectedStaffId, start, midpoint),
      slot('018f6c5e-8557-7888-8123-456789000007', start, midpoint),
    ]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([
      rule(1, 1, start, midpoint),
      rule(1, 1, midpoint, end),
    ]);
    await expectAtomicFailure();
  });

  it('ignores a pre-existing maximum violation in a segment untouched by the plan', async () => {
    tx.workScheduleSlotTemplate.findMany.mockResolvedValue([
      template({ startTime: '10:00', durationMinute: 120 }),
    ]);
    tx.workScheduleSlot.findMany.mockResolvedValue([
      slot(unselectedStaffId, start, '2026-10-24T03:00:00.000Z'),
    ]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([
      rule(null, 0, start, '2026-10-24T03:00:00.000Z'),
      rule(1, 1, '2026-10-24T03:00:00.000Z', end),
    ]);
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 1,
    });
  });

  it('inserts one complete batch and returns the count Prisma actually reports', async () => {
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(2)]);
    tx.workScheduleSlot.createMany.mockResolvedValue({ count: 7 });
    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 7,
    });
    expect(tx.workScheduleSlot.createMany).toHaveBeenCalledTimes(1);
    expect(insertedSlots()).toHaveLength(2);
  });

  it('retries P2034 and rereads every planning input before rebuilding the plan', async () => {
    const serializationError = Object.assign(
      new Error('Serialization failure'),
      {
        code: 'P2034',
      },
    );
    let attempt = 0;
    prisma.$transaction.mockImplementation(
      async (operation: (client: unknown) => Promise<unknown>) => {
        attempt++;
        const result = await operation(tx);
        if (attempt === 1) throw serializationError;
        return result;
      },
    );
    tx.workScheduleMinMax.findMany.mockResolvedValue([rule(2)]);
    tx.workScheduleSlot.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([slot()]);

    await expect(handler.execute(command())).resolves.toEqual({
      createdCount: 1,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    for (const read of [
      tx.$queryRaw,
      tx.workSchedulePosition.findUnique,
      tx.workScheduleSlotTemplate.findMany,
      tx.workScheduleStaffPosition.findMany,
      tx.workScheduleSlot.findMany,
      tx.workScheduleHoliday.findMany,
      tx.workScheduleMinMax.findMany,
    ]) {
      expect(read).toHaveBeenCalledTimes(2);
    }
    expect(insertedSlots(0)).toHaveLength(2);
    expect(insertedSlots(1)).toHaveLength(1);
    for (const [, options] of prisma.$transaction.mock.calls) {
      expect(options).toEqual({
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    }
  });

  it('fails after exhausting P2034 retries without inserting a partial result', async () => {
    tx.workScheduleSlot.findMany.mockRejectedValue({ code: 'P2034' });
    await expect(handler.execute(command())).rejects.toMatchObject({
      status: 409,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(4);
    expect(tx.workSchedulePosition.findUnique).toHaveBeenCalledTimes(4);
    expect(tx.workScheduleSlot.createMany).not.toHaveBeenCalled();
  });

  it('does not retry non-serialization infrastructure failures', async () => {
    const failure = new Error('Read failed');
    tx.workScheduleSlot.findMany.mockRejectedValue(failure);
    await expect(handler.execute(command())).rejects.toBe(failure);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.workScheduleSlot.createMany).not.toHaveBeenCalled();
  });
});
