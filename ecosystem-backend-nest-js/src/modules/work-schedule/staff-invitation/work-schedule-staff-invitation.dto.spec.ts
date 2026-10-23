import { IssueStaffInvitationParamDtoSchema } from './commands/issue-staff-invitation.command';
import { SubmitStaffInvitationBodyDtoSchema } from './commands/submit-staff-invitation.command';
import { DecideStaffInvitationBodyDtoSchema } from './commands/decide-staff-invitation.command';

describe('Staff Invitation DTO Schemas', () => {
  it('validates UUIDv7 parameters for issue', () => {
    const valid = IssueStaffInvitationParamDtoSchema.safeParse({
      place_id: '018f6c5e-8557-7888-8123-456789abcdef',
      staff_id: '018f6c5e-8557-7888-8123-456789abcdee',
    });
    expect(valid.success).toBe(true);

    const invalid = IssueStaffInvitationParamDtoSchema.safeParse({
      place_id: 'not-a-uuid',
      staff_id: 'not-a-uuid',
    });
    expect(invalid.success).toBe(false);
  });

  it('validates 24-character base64url code for submit', () => {
    const valid = SubmitStaffInvitationBodyDtoSchema.safeParse({
      code: 'abcdefghijklmnopqrstuvwx',
    });
    expect(valid.success).toBe(true);

    const invalidShort = SubmitStaffInvitationBodyDtoSchema.safeParse({
      code: 'short',
    });
    expect(invalidShort.success).toBe(false);

    const invalidChars = SubmitStaffInvitationBodyDtoSchema.safeParse({
      code: 'abcdefghijklmnopqrstuvw$',
    });
    expect(invalidChars.success).toBe(false);
  });

  it('validates decision enum', () => {
    const validApprove = DecideStaffInvitationBodyDtoSchema.safeParse({
      decision: 'APPROVE',
    });
    expect(validApprove.success).toBe(true);

    const validReject = DecideStaffInvitationBodyDtoSchema.safeParse({
      decision: 'REJECT',
    });
    expect(validReject.success).toBe(true);

    const invalid = DecideStaffInvitationBodyDtoSchema.safeParse({
      decision: 'MAYBE',
    });
    expect(invalid.success).toBe(false);
  });
});
