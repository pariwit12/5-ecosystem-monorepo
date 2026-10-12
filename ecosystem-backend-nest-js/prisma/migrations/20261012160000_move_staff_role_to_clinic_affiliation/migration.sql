ALTER TABLE "person_staff_affiliation"
ADD COLUMN "role" "StaffRole" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "legacy_role" TEXT;

UPDATE "person_staff_affiliation" AS affiliation
SET "role" = staff."role",
    "legacy_role" = staff."legacy_role"
FROM "person_staff" AS staff
WHERE staff."person_id" = affiliation."person_staff_id";

ALTER TABLE "person_staff"
DROP COLUMN "role",
DROP COLUMN "legacy_role";
