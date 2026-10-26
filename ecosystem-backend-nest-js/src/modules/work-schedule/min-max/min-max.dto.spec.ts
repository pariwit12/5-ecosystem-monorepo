import { CreateDtoBodySchema } from './commands/create.command';
import { DeleteDtoParamSchema } from './commands/delete.command';
import {
  UpdateDtoBodySchema,
  UpdateDtoParamSchema,
} from './commands/update.command';
import { GetMinMaxByIdDtoParamSchema } from './queries/get-min-max-by-id.query';

describe('min/max DTO validation', () => {
  const param = {
    position_id: '018f6c5e-8557-7888-8123-456789abcdef',
    min_max_id: '018f6c5e-8557-7888-8123-456789000099',
  };
  const body = {
    min: 1,
    max: 3,
    start_time: '2026-10-24T08:00:00.000Z',
    end_time: '2026-10-24T12:00:00.000Z',
  };

  describe.each([
    ['detail', GetMinMaxByIdDtoParamSchema],
    ['update', UpdateDtoParamSchema],
    ['delete', DeleteDtoParamSchema],
  ] as const)('%s parameters', (_route, schema) => {
    it('accepts UUID v7 for both IDs', () => {
      expect(schema.safeParse(param).success).toBe(true);
    });

    it.each(['position_id', 'min_max_id'] as const)(
      'requires a valid UUID v7 %s',
      (key) => {
        for (const invalid of [
          undefined,
          'invalid-uuid',
          '018f6c5e-8557-4888-8123-456789000099',
        ]) {
          expect(schema.safeParse({ ...param, [key]: invalid }).success).toBe(
            false,
          );
        }
      },
    );
  });

  describe('update body', () => {
    it.each([
      { min: 0, max: 0 },
      { min: 1, max: 3 },
      { min: null, max: 0 },
      { min: 0, max: null },
    ])('accepts valid numeric and nullable values: %j', (values) => {
      expect(UpdateDtoBodySchema.parse({ ...body, ...values })).toEqual({
        ...body,
        ...values,
      });
    });

    it.each(['min', 'max', 'start_time', 'end_time'] as const)(
      'rejects missing or undefined %s in a full replacement',
      (key) => {
        const missing: Record<string, unknown> = { ...body };
        delete missing[key];
        expect(UpdateDtoBodySchema.safeParse(missing).success).toBe(false);
        expect(
          UpdateDtoBodySchema.safeParse({ ...body, [key]: undefined }).success,
        ).toBe(false);
      },
    );

    it.each(['min', 'max'] as const)(
      'rejects invalid numeric %s values',
      (key) => {
        for (const invalid of [-1, 0.5, '1', NaN, Infinity]) {
          expect(
            UpdateDtoBodySchema.safeParse({ ...body, [key]: invalid }).success,
          ).toBe(false);
        }
      },
    );

    it('rejects clearing both bounds', () => {
      expect(
        UpdateDtoBodySchema.safeParse({ ...body, min: null, max: null })
          .success,
      ).toBe(false);
    });

    it('rejects min greater than max', () => {
      expect(
        UpdateDtoBodySchema.safeParse({ ...body, min: 4, max: 3 }).success,
      ).toBe(false);
    });

    it.each(['start_time', 'end_time'] as const)(
      'requires timezone-aware ISO %s',
      (key) => {
        for (const invalid of [
          null,
          '2026-10-24T09:00:00',
          '2026-10-24',
          'invalid-date',
        ]) {
          expect(
            UpdateDtoBodySchema.safeParse({ ...body, [key]: invalid }).success,
          ).toBe(false);
        }
      },
    );

    it('compares time instants across timezone offsets', () => {
      expect(
        UpdateDtoBodySchema.safeParse({
          ...body,
          start_time: '2026-10-24T15:00:00+07:00',
          end_time: '2026-10-24T09:00:00Z',
        }).success,
      ).toBe(true);
    });

    it.each(['2026-10-24T08:00:00Z', '2026-10-24T07:00:00Z'])(
      'rejects equal or earlier end time %s across offsets',
      (end_time) => {
        expect(
          UpdateDtoBodySchema.safeParse({
            ...body,
            start_time: '2026-10-24T15:00:00+07:00',
            end_time,
          }).success,
        ).toBe(false);
      },
    );
  });

  it('preserves the create contract allowing omission but rejecting null', () => {
    const withoutMin = {
      max: body.max,
      start_time: body.start_time,
      end_time: body.end_time,
    };
    expect(CreateDtoBodySchema.safeParse(withoutMin).success).toBe(true);
    expect(
      CreateDtoBodySchema.safeParse({ ...body, max: undefined }).success,
    ).toBe(true);
    expect(CreateDtoBodySchema.safeParse({ ...body, min: null }).success).toBe(
      false,
    );
  });
});
