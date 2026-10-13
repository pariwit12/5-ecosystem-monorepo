import { IdentityDocumentInputSchema } from './identity-document';

describe('IdentityDocumentInputSchema', () => {
  it('accepts and normalizes a foreign passport', () => {
    expect(
      IdentityDocumentInputSchema.parse({
        type: 'PASSPORT',
        issuingCountry: 'gb',
        value: ' ab12345 ',
      }),
    ).toMatchObject({
      type: 'PASSPORT',
      issuingCountry: 'GB',
      value: 'AB12345',
    });
  });

  it('requires a Thai CID to contain 13 digits and use country TH', () => {
    expect(
      IdentityDocumentInputSchema.safeParse({
        type: 'THAI_CID',
        issuingCountry: 'US',
        value: '123',
      }).success,
    ).toBe(false);
  });
});
