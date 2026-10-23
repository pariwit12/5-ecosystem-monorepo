-- CreateEnum
CREATE TYPE "WorkScheduleStaffInvitationStatus" AS ENUM ('ISSUED', 'PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "WorkScheduleStaffLinkAuditAction" AS ENUM ('LINK', 'UNLINK');

-- CreateTable
CREATE TABLE "work_schedule_staff_invitation" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "status" "WorkScheduleStaffInvitationStatus" NOT NULL DEFAULT 'ISSUED',
    "created_by_person_id" UUID NOT NULL,
    "requested_by_person_id" UUID,
    "decided_by_person_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "requested_at" TIMESTAMPTZ,
    "decided_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "work_schedule_staff_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule_staff_link_audit" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "actor_person_id" UUID NOT NULL,
    "invitation_id" UUID,
    "action" "WorkScheduleStaffLinkAuditAction" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_schedule_staff_link_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_schedule_staff_invitation_code_hash_key" ON "work_schedule_staff_invitation"("code_hash");

-- CreateIndex
CREATE INDEX "work_schedule_staff_invitation_staff_id_idx" ON "work_schedule_staff_invitation"("staff_id");

-- CreateIndex
CREATE INDEX "work_schedule_staff_invitation_requested_by_person_id_idx" ON "work_schedule_staff_invitation"("requested_by_person_id");

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "work_schedule_staff_invitation_staff_active_key" ON "work_schedule_staff_invitation"("staff_id") WHERE "status" IN ('ISSUED', 'PENDING');

-- CreateIndex
CREATE INDEX "work_schedule_staff_link_audit_staff_id_created_at_idx" ON "work_schedule_staff_link_audit"("staff_id", "created_at");

-- AddForeignKey
ALTER TABLE "work_schedule_staff_invitation" ADD CONSTRAINT "work_schedule_staff_invitation_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "work_schedule_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff_invitation" ADD CONSTRAINT "work_schedule_staff_invitation_created_by_person_id_fkey" FOREIGN KEY ("created_by_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff_invitation" ADD CONSTRAINT "work_schedule_staff_invitation_requested_by_person_id_fkey" FOREIGN KEY ("requested_by_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff_invitation" ADD CONSTRAINT "work_schedule_staff_invitation_decided_by_person_id_fkey" FOREIGN KEY ("decided_by_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff_link_audit" ADD CONSTRAINT "work_schedule_staff_link_audit_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "work_schedule_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff_link_audit" ADD CONSTRAINT "work_schedule_staff_link_audit_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff_link_audit" ADD CONSTRAINT "work_schedule_staff_link_audit_actor_person_id_fkey" FOREIGN KEY ("actor_person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff_link_audit" ADD CONSTRAINT "work_schedule_staff_link_audit_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "work_schedule_staff_invitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
