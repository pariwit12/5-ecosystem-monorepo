CREATE TABLE "patient_number_sequence" (
    "organization_dental_clinic_id" UUID NOT NULL,
    "next_number" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "patient_number_sequence_pkey" PRIMARY KEY ("organization_dental_clinic_id")
);

ALTER TABLE "patient_number_sequence"
ADD CONSTRAINT "patient_number_sequence_organization_dental_clinic_id_fkey"
FOREIGN KEY ("organization_dental_clinic_id")
REFERENCES "organization_dental_clinic"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
