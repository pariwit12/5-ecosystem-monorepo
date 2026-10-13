import { z } from 'zod';

export const IdentityDocumentInputSchema = z
  .object({
    type: z.enum(['THAI_CID', 'PASSPORT', 'FOREIGN_ID', 'OTHER']),
    issuingCountry: z
      .string()
      .trim()
      .length(2)
      .transform((value) => value.toUpperCase()),
    value: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .transform((value) => value.toUpperCase()),
    expiresAt: z.coerce.date().optional(),
  })
  .superRefine((document, context) => {
    if (
      document.type === 'THAI_CID' &&
      (document.issuingCountry !== 'TH' || !/^\d{13}$/.test(document.value))
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Thai CID ต้องเป็นตัวเลข 13 หลักและออกโดยประเทศไทย',
      });
    }
    if (
      document.type === 'PASSPORT' &&
      !/^[A-Z0-9]{5,20}$/.test(document.value)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'รูปแบบหมายเลข Passport ไม่ถูกต้อง',
      });
    }
  });

export type IdentityDocumentInput = z.infer<typeof IdentityDocumentInputSchema>;

export const legacyCidDocument = (cid: string): IdentityDocumentInput => ({
  type: 'THAI_CID',
  issuingCountry: 'TH',
  value: cid.trim(),
});
