import {
  AutoCreateDtoBodySchema,
  AutoCreateDtoParamSchema,
} from './auto-create.command';

describe('AutoCreate DTO schemas', () => {
  const id = '018f6c5e-8557-7888-8123-456789000001';
  const nonV7 = '018f6c5e-8557-4888-8123-456789000001';
  const body = {
    start_time: '2026-10-28T08:00:00+07:00',
    end_time: '2026-10-28T12:00:00+07:00',
    slot_template_ids: [id],
    staff_ids: [id],
  };

  it('accepts a valid offset payload and UUID v7 position', () => {
    expect(AutoCreateDtoBodySchema.safeParse(body).success).toBe(true);
    expect(
      AutoCreateDtoParamSchema.safeParse({ position_id: id }).success,
    ).toBe(true);
    expect(
      AutoCreateDtoParamSchema.safeParse({ position_id: id.toUpperCase() })
        .success,
    ).toBe(true);
  });

  it.each(['invalid', nonV7])('rejects invalid position %s', (position_id) => {
    expect(AutoCreateDtoParamSchema.safeParse({ position_id }).success).toBe(
      false,
    );
  });

  it.each(['slot_template_ids', 'staff_ids'] as const)(
    'rejects empty, duplicate, invalid and non-v7 %s',
    (key) => {
      for (const value of [
        [],
        [id, id],
        [id, id.toUpperCase()],
        ['invalid'],
        [nonV7],
      ]) {
        expect(
          AutoCreateDtoBodySchema.safeParse({ ...body, [key]: value }).success,
        ).toBe(false);
      }
    },
  );

  it.each(['start_time', 'end_time'] as const)(
    'rejects %s without offset',
    (key) => {
      expect(
        AutoCreateDtoBodySchema.safeParse({
          ...body,
          [key]: '2026-10-28T10:00:00',
        }).success,
      ).toBe(false);
    },
  );

  it.each([body.start_time, '2026-10-28T07:59:00+07:00'])(
    'rejects end <= start (%s)',
    (end_time) => {
      expect(
        AutoCreateDtoBodySchema.safeParse({ ...body, end_time }).success,
      ).toBe(false);
    },
  );

  it('compares end and start as instants across different offsets', () => {
    expect(
      AutoCreateDtoBodySchema.safeParse({
        ...body,
        end_time: '2026-10-28T02:00:00Z',
      }).success,
    ).toBe(true);
  });
});
