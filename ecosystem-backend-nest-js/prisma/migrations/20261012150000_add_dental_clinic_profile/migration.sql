ALTER TABLE "organization_dental_clinic"
ADD COLUMN "name" TEXT,
ADD COLUMN "license_number" TEXT;

UPDATE "organization_dental_clinic" AS clinic
SET "name" = organization."name"
FROM "organization"
WHERE organization."id" = clinic."organization_id";

ALTER TABLE "organization_dental_clinic" ALTER COLUMN "name" SET NOT NULL;

CREATE UNIQUE INDEX "organization_dental_clinic_license_number_key"
ON "organization_dental_clinic"("license_number");
