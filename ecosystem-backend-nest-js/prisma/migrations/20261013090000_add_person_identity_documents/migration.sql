CREATE TYPE "IdentityDocumentType" AS ENUM ('THAI_CID', 'PASSPORT', 'FOREIGN_ID', 'OTHER');

CREATE TABLE "person_identity_document" (
    "person_id" UUID NOT NULL,
    "type" "IdentityDocumentType" NOT NULL,
    "issuing_country" CHAR(2) NOT NULL,
    "normalized_value" VARCHAR(100) NOT NULL,
    "expires_at" DATE,

    CONSTRAINT "person_identity_document_pkey"
      PRIMARY KEY ("person_id", "type", "issuing_country", "normalized_value")
);

CREATE UNIQUE INDEX "person_identity_document_type_issuing_country_normalized_value_key"
ON "person_identity_document"("type", "issuing_country", "normalized_value");

ALTER TABLE "person_identity_document"
ADD CONSTRAINT "person_identity_document_person_id_fkey"
FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "person_identity_document" (
    "person_id", "type", "issuing_country", "normalized_value"
)
SELECT "id", 'THAI_CID'::"IdentityDocumentType", 'TH', BTRIM("cid")
FROM "person"
WHERE "cid" IS NOT NULL AND BTRIM("cid") <> '';

DROP INDEX IF EXISTS "person_cid_key";
ALTER TABLE "person" DROP COLUMN "cid";
