-- CreateTable
CREATE TABLE "work_schedule_holiday" (
    "id" UUID NOT NULL,
    "work_schedule_staff_id" UUID NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_schedule_holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_schedule_holiday_work_schedule_staff_id_start_time_end_idx" ON "work_schedule_holiday"("work_schedule_staff_id", "start_time", "end_time");

-- AddForeignKey
ALTER TABLE "work_schedule_holiday" ADD CONSTRAINT "work_schedule_holiday_work_schedule_staff_id_fkey" FOREIGN KEY ("work_schedule_staff_id") REFERENCES "work_schedule_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
