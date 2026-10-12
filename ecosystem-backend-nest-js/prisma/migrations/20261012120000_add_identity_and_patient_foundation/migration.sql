-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'MANAGER', 'RECEPTIONIST', 'DENTAL_ASSISTANT', 'ACCOUNTING', 'OTHER');

-- AlterTable
ALTER TABLE "person" ADD COLUMN "birth_date" DATE, ADD COLUMN "cid" VARCHAR(13), ADD COLUMN "first_name" TEXT, ADD COLUMN "last_name" TEXT, ADD COLUMN "nickname" TEXT, ADD COLUMN "phone" TEXT, ALTER COLUMN "clerk_id" DROP NOT NULL;

CREATE TABLE "person_dentist" ("person_id" UUID NOT NULL, "license_number" TEXT, "legacy_role" TEXT, CONSTRAINT "person_dentist_pkey" PRIMARY KEY ("person_id"));
CREATE TABLE "person_staff" ("person_id" UUID NOT NULL, "role" "StaffRole" NOT NULL DEFAULT 'OTHER', "legacy_role" TEXT, CONSTRAINT "person_staff_pkey" PRIMARY KEY ("person_id"));
CREATE TABLE "person_dental_patient" ("person_id" UUID NOT NULL, "legacy_patient_id" INTEGER, CONSTRAINT "person_dental_patient_pkey" PRIMARY KEY ("person_id"));
CREATE TABLE "person_legacy_identity" ("id" UUID NOT NULL, "person_id" UUID NOT NULL, "source" TEXT NOT NULL, "entity_type" TEXT NOT NULL, "legacy_id" INTEGER NOT NULL, CONSTRAINT "person_legacy_identity_pkey" PRIMARY KEY ("id"));
CREATE TABLE "person_dental_patient_affiliation" ("person_dental_patient_id" UUID NOT NULL, "organization_dental_clinic_id" UUID NOT NULL, "patient_number" TEXT NOT NULL, CONSTRAINT "person_dental_patient_affiliation_pkey" PRIMARY KEY ("person_dental_patient_id", "organization_dental_clinic_id"));
CREATE TABLE "person_dentist_affiliation" ("person_dentist_id" UUID NOT NULL, "organization_dental_clinic_id" UUID NOT NULL, CONSTRAINT "person_dentist_affiliation_pkey" PRIMARY KEY ("person_dentist_id", "organization_dental_clinic_id"));
CREATE TABLE "person_staff_affiliation" ("person_staff_id" UUID NOT NULL, "organization_dental_clinic_id" UUID NOT NULL, CONSTRAINT "person_staff_affiliation_pkey" PRIMARY KEY ("person_staff_id", "organization_dental_clinic_id"));

CREATE UNIQUE INDEX "person_dentist_license_number_key" ON "person_dentist"("license_number");
CREATE UNIQUE INDEX "person_dental_patient_legacy_patient_id_key" ON "person_dental_patient"("legacy_patient_id");
CREATE INDEX "person_legacy_identity_person_id_idx" ON "person_legacy_identity"("person_id");
CREATE UNIQUE INDEX "person_legacy_identity_source_entity_type_legacy_id_key" ON "person_legacy_identity"("source", "entity_type", "legacy_id");
CREATE INDEX "person_dental_patient_affiliation_organization_dental_clini_idx" ON "person_dental_patient_affiliation"("organization_dental_clinic_id");
CREATE UNIQUE INDEX "person_dental_patient_affiliation_organization_dental_clini_key" ON "person_dental_patient_affiliation"("organization_dental_clinic_id", "patient_number");
CREATE INDEX "person_dentist_affiliation_organization_dental_clinic_id_idx" ON "person_dentist_affiliation"("organization_dental_clinic_id");
CREATE INDEX "person_staff_affiliation_organization_dental_clinic_id_idx" ON "person_staff_affiliation"("organization_dental_clinic_id");
CREATE UNIQUE INDEX "person_cid_key" ON "person"("cid");

ALTER TABLE "person_dentist" ADD CONSTRAINT "person_dentist_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_staff" ADD CONSTRAINT "person_staff_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_dental_patient" ADD CONSTRAINT "person_dental_patient_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_legacy_identity" ADD CONSTRAINT "person_legacy_identity_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_dental_patient_affiliation" ADD CONSTRAINT "person_dental_patient_affiliation_person_dental_patient_id_fkey" FOREIGN KEY ("person_dental_patient_id") REFERENCES "person_dental_patient"("person_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_dental_patient_affiliation" ADD CONSTRAINT "person_dental_patient_affiliation_organization_dental_clin_fkey" FOREIGN KEY ("organization_dental_clinic_id") REFERENCES "organization_dental_clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_dentist_affiliation" ADD CONSTRAINT "person_dentist_affiliation_person_dentist_id_fkey" FOREIGN KEY ("person_dentist_id") REFERENCES "person_dentist"("person_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_dentist_affiliation" ADD CONSTRAINT "person_dentist_affiliation_organization_dental_clinic_id_fkey" FOREIGN KEY ("organization_dental_clinic_id") REFERENCES "organization_dental_clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_staff_affiliation" ADD CONSTRAINT "person_staff_affiliation_person_staff_id_fkey" FOREIGN KEY ("person_staff_id") REFERENCES "person_staff"("person_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "person_staff_affiliation" ADD CONSTRAINT "person_staff_affiliation_organization_dental_clinic_id_fkey" FOREIGN KEY ("organization_dental_clinic_id") REFERENCES "organization_dental_clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
