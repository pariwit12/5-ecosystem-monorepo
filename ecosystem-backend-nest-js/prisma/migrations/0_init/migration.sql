-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TemplateEnumInSchemaPrisma" AS ENUM ('A', 'B', 'C');

-- CreateTable
CREATE TABLE "organization" (
    "id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person" (
    "id" UUID NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_organization_affiliation" (
    "person_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "person_organization_affiliation_pkey" PRIMARY KEY ("person_id","organization_id")
);

-- CreateTable
CREATE TABLE "organization_dental_clinic" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "timezone" TEXT NOT NULL,

    CONSTRAINT "organization_dental_clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_work_schedule_place" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "timezone" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "organization_work_schedule_place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule_admin" (
    "person_id" UUID NOT NULL,
    "organization_work_schedule_place_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "work_schedule_admin_pkey" PRIMARY KEY ("person_id","organization_work_schedule_place_id")
);

-- CreateTable
CREATE TABLE "work_schedule_staff" (
    "id" UUID NOT NULL,
    "organization_work_schedule_place_id" UUID NOT NULL,
    "person_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,

    CONSTRAINT "work_schedule_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule_position" (
    "id" UUID NOT NULL,
    "organization_work_schedule_place_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,

    CONSTRAINT "work_schedule_position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule_staff_position" (
    "work_schedule_staff_id" UUID NOT NULL,
    "work_schedule_position_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "work_schedule_staff_position_pkey" PRIMARY KEY ("work_schedule_staff_id","work_schedule_position_id")
);

-- CreateTable
CREATE TABLE "work_schedule_min_max" (
    "id" UUID NOT NULL,
    "work_schedule_position_id" UUID NOT NULL,
    "min" INTEGER,
    "max" INTEGER,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "work_schedule_min_max_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule_slot_type" (
    "id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,

    CONSTRAINT "work_schedule_slot_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule_slot_template" (
    "id" UUID NOT NULL,
    "work_schedule_position_id" UUID NOT NULL,
    "slot_type_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "duration_minute" INTEGER NOT NULL,

    CONSTRAINT "work_schedule_slot_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule_slot" (
    "id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "slot_type_id" UUID NOT NULL,
    "note" TEXT,
    "actual_start_time" TIMESTAMPTZ NOT NULL,
    "actual_end_time" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "work_schedule_slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template" (
    "id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "parent_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "target_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "status" "TemplateEnumInSchemaPrisma" NOT NULL DEFAULT 'A',
    "tags" TEXT[],

    CONSTRAINT "template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_one_template_two_affiliation" (
    "template_one_id" UUID NOT NULL,
    "template_two_id" UUID NOT NULL,

    CONSTRAINT "template_one_template_two_affiliation_pkey" PRIMARY KEY ("template_one_id","template_two_id")
);

-- CreateTable
CREATE TABLE "template_two" (
    "id" UUID NOT NULL,
    "template_one_id" UUID NOT NULL,

    CONSTRAINT "template_two_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_clerk_id_key" ON "person"("clerk_id");

-- CreateIndex
CREATE INDEX "person_organization_affiliation_organization_id_idx" ON "person_organization_affiliation"("organization_id");

-- CreateIndex
CREATE INDEX "organization_dental_clinic_organization_id_idx" ON "organization_dental_clinic"("organization_id");

-- CreateIndex
CREATE INDEX "organization_work_schedule_place_organization_id_idx" ON "organization_work_schedule_place"("organization_id");

-- CreateIndex
CREATE INDEX "work_schedule_admin_organization_work_schedule_place_id_idx" ON "work_schedule_admin"("organization_work_schedule_place_id");

-- CreateIndex
CREATE INDEX "work_schedule_staff_person_id_idx" ON "work_schedule_staff"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedule_staff_organization_work_schedule_place_id_per_key" ON "work_schedule_staff"("organization_work_schedule_place_id", "person_id");

-- CreateIndex
CREATE INDEX "work_schedule_position_organization_work_schedule_place_id_idx" ON "work_schedule_position"("organization_work_schedule_place_id");

-- CreateIndex
CREATE INDEX "work_schedule_staff_position_work_schedule_position_id_idx" ON "work_schedule_staff_position"("work_schedule_position_id");

-- CreateIndex
CREATE INDEX "work_schedule_min_max_work_schedule_position_id_start_time__idx" ON "work_schedule_min_max"("work_schedule_position_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "work_schedule_slot_template_work_schedule_position_id_idx" ON "work_schedule_slot_template"("work_schedule_position_id");

-- CreateIndex
CREATE INDEX "work_schedule_slot_position_id_actual_start_time_idx" ON "work_schedule_slot"("position_id", "actual_start_time");

-- CreateIndex
CREATE INDEX "work_schedule_slot_staff_id_actual_start_time_idx" ON "work_schedule_slot"("staff_id", "actual_start_time");

-- CreateIndex
CREATE UNIQUE INDEX "template_parent_id_key" ON "template"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_slug_key" ON "template"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "template_one_template_two_affiliation_template_one_id_key" ON "template_one_template_two_affiliation"("template_one_id");

-- CreateIndex
CREATE INDEX "template_one_template_two_affiliation_template_two_id_idx" ON "template_one_template_two_affiliation"("template_two_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_two_template_one_id_key" ON "template_two"("template_one_id");

-- AddForeignKey
ALTER TABLE "person_organization_affiliation" ADD CONSTRAINT "person_organization_affiliation_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_organization_affiliation" ADD CONSTRAINT "person_organization_affiliation_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_dental_clinic" ADD CONSTRAINT "organization_dental_clinic_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_work_schedule_place" ADD CONSTRAINT "organization_work_schedule_place_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_admin" ADD CONSTRAINT "work_schedule_admin_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_admin" ADD CONSTRAINT "work_schedule_admin_organization_work_schedule_place_id_fkey" FOREIGN KEY ("organization_work_schedule_place_id") REFERENCES "organization_work_schedule_place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff" ADD CONSTRAINT "work_schedule_staff_organization_work_schedule_place_id_fkey" FOREIGN KEY ("organization_work_schedule_place_id") REFERENCES "organization_work_schedule_place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff" ADD CONSTRAINT "work_schedule_staff_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_position" ADD CONSTRAINT "work_schedule_position_organization_work_schedule_place_id_fkey" FOREIGN KEY ("organization_work_schedule_place_id") REFERENCES "organization_work_schedule_place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff_position" ADD CONSTRAINT "work_schedule_staff_position_work_schedule_staff_id_fkey" FOREIGN KEY ("work_schedule_staff_id") REFERENCES "work_schedule_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_staff_position" ADD CONSTRAINT "work_schedule_staff_position_work_schedule_position_id_fkey" FOREIGN KEY ("work_schedule_position_id") REFERENCES "work_schedule_position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_min_max" ADD CONSTRAINT "work_schedule_min_max_work_schedule_position_id_fkey" FOREIGN KEY ("work_schedule_position_id") REFERENCES "work_schedule_position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_slot_type" ADD CONSTRAINT "work_schedule_slot_type_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "work_schedule_position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_slot_template" ADD CONSTRAINT "work_schedule_slot_template_work_schedule_position_id_fkey" FOREIGN KEY ("work_schedule_position_id") REFERENCES "work_schedule_position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_slot_template" ADD CONSTRAINT "work_schedule_slot_template_slot_type_id_fkey" FOREIGN KEY ("slot_type_id") REFERENCES "work_schedule_slot_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_slot" ADD CONSTRAINT "work_schedule_slot_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "work_schedule_position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_slot" ADD CONSTRAINT "work_schedule_slot_staff_id_position_id_fkey" FOREIGN KEY ("staff_id", "position_id") REFERENCES "work_schedule_staff_position"("work_schedule_staff_id", "work_schedule_position_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_slot" ADD CONSTRAINT "work_schedule_slot_slot_type_id_fkey" FOREIGN KEY ("slot_type_id") REFERENCES "work_schedule_slot_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_one_template_two_affiliation" ADD CONSTRAINT "template_one_template_two_affiliation_template_one_id_fkey" FOREIGN KEY ("template_one_id") REFERENCES "template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_one_template_two_affiliation" ADD CONSTRAINT "template_one_template_two_affiliation_template_two_id_fkey" FOREIGN KEY ("template_two_id") REFERENCES "template_two"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_two" ADD CONSTRAINT "template_two_template_one_id_fkey" FOREIGN KEY ("template_one_id") REFERENCES "template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

