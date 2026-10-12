CREATE TABLE "staff_invitation" (
    "id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "organization_dental_clinic_id" UUID NOT NULL,
    "role" "StaffRole" NOT NULL,
    "target_person_id" UUID,
    "created_by_person_id" UUID NOT NULL,
    "used_by_person_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    CONSTRAINT "staff_invitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staff_invitation_code_hash_key" ON "staff_invitation"("code_hash");
CREATE INDEX "staff_invitation_organization_dental_clinic_id_idx" ON "staff_invitation"("organization_dental_clinic_id");
CREATE INDEX "staff_invitation_target_person_id_idx" ON "staff_invitation"("target_person_id");
CREATE INDEX "staff_invitation_created_by_person_id_idx" ON "staff_invitation"("created_by_person_id");

ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_organization_dental_clinic_id_fkey" FOREIGN KEY ("organization_dental_clinic_id") REFERENCES "organization_dental_clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_target_person_id_fkey" FOREIGN KEY ("target_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_created_by_person_id_fkey" FOREIGN KEY ("created_by_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_used_by_person_id_fkey" FOREIGN KEY ("used_by_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
