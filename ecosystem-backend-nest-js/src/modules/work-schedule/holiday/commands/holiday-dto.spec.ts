import {
  CreateHolidayDtoBodySchema,
  CreateHolidayDtoParamSchema,
} from './create-holiday.command';
import { DeleteHolidayDtoParamSchema } from './delete-holiday.command';

describe('Holiday DTOs', () => {
  describe('CreateHolidayDtoParamSchema', () => {
    it('accepts valid UUIDv7', () => {
      const parsed = CreateHolidayDtoParamSchema.safeParse({
        place_id: '018f6c5e-8557-7888-8123-456789abcdef',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects non-UUIDv7', () => {
      const parsed = CreateHolidayDtoParamSchema.safeParse({
        place_id: '12345',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('DeleteHolidayDtoParamSchema', () => {
    it('accepts valid UUIDv7s', () => {
      const parsed = DeleteHolidayDtoParamSchema.safeParse({
        place_id: '018f6c5e-8557-7888-8123-456789abcdef',
        holiday_id: '018f6c5e-8557-7888-8123-456789111111',
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('CreateHolidayDtoBodySchema', () => {
    it('accepts valid FULL_DAY body', () => {
      const parsed = CreateHolidayDtoBodySchema.safeParse({
        type: 'FULL_DAY',
        date: '2026-10-24',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects invalid FULL_DAY date string', () => {
      const parsed = CreateHolidayDtoBodySchema.safeParse({
        type: 'FULL_DAY',
        date: '2026-02-31', // invalid date
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects FULL_DAY with extra parameters due to strict()', () => {
      const parsed = CreateHolidayDtoBodySchema.safeParse({
        type: 'FULL_DAY',
        date: '2026-10-24',
        start_time: '2026-10-24T00:00:00Z',
      });
      expect(parsed.success).toBe(false);
    });

    it('accepts valid PARTIAL body with offset', () => {
      const parsed = CreateHolidayDtoBodySchema.safeParse({
        type: 'PARTIAL',
        start_time: '2026-10-24T09:00:00+07:00',
        end_time: '2026-10-24T12:00:00+07:00',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects PARTIAL body when ISO string has no offset', () => {
      const parsed = CreateHolidayDtoBodySchema.safeParse({
        type: 'PARTIAL',
        start_time: '2026-10-24T09:00:00',
        end_time: '2026-10-24T12:00:00',
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects PARTIAL body when start_time >= end_time', () => {
      const parsed = CreateHolidayDtoBodySchema.safeParse({
        type: 'PARTIAL',
        start_time: '2026-10-24T12:00:00+07:00',
        end_time: '2026-10-24T09:00:00+07:00',
      });
      expect(parsed.success).toBe(false);

      const parsedSame = CreateHolidayDtoBodySchema.safeParse({
        type: 'PARTIAL',
        start_time: '2026-10-24T12:00:00+07:00',
        end_time: '2026-10-24T12:00:00+07:00',
      });
      expect(parsedSame.success).toBe(false);
    });
  });
});
