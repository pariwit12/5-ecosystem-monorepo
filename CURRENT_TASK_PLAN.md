# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

รอบงาน: 2026-10-31

สร้างระบบกำหนด Max ของจำนวนวันหยุดของพนักงาน ตั้งแต่วันที่ ... ถึง วันที่ ... เหมือน minMax ของจำนวน slot โดยผู้ที่จะสามารถมาสร้างและแก้ไขหรือลบ ข้อมูลจำนวนสูงสุดของวันหยุดของพนักงานได้ คือ admin

### คำยืนยันเพิ่มเติมจากผู้ใช้ (ยึดข้อความดั้งเดิม)

หมายถึงจำนวนวันหยุดที่พนักงานลงตรงกันพร้อมกันใน Position นั้นครับ โดยให้สร้าง schema ใหม่เลยครับ มีตรงไหนที่ยังไม่เคลียร์สามารถสอบถามได้เลยนะครับ

## 2. Business Logic ปัจจุบันก่อนเริ่ม Implement

### 2.1 วันหยุดของพนักงาน

- Prisma model `WorkScheduleHoliday` ปัจจุบันผูกกับ `WorkScheduleStaff` โดยตรงผ่าน `workScheduleStaffId` และเก็บ `startTime`, `endTime`, `createdAt`; ไม่มี `positionId` ใน holiday record
- พนักงานหนึ่งคนสามารถมีหลาย Position ผ่าน `WorkScheduleStaffPosition`
- การสร้างวันหยุดทำผ่าน `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`
  - ตรวจสิทธิ์ Staff ของ Place ด้วย `verifyWorkScheduleStaffAccess`
  - FULL_DAY ใช้ timezone ของ Place เพื่อแปลง local midnight เป็น UTC interval
  - PARTIAL ใช้ ISO datetime ที่มี offset
  - ตรวจว่าช่วงวันหยุดไม่ทับ Slot ของ Staff
  - ตรวจ `WorkScheduleMinMax.min` ของทุก active Position ที่ Staff สังกัดอยู่
  - การตรวจ Min นับ Staff ที่หยุดเป็นรายคน ไม่ใช่นับจำนวน holiday records; holiday ซ้อนหลาย record ของ Staff คนเดียวกันต้องนับว่าขาดเพียง 1 คนในช่วงเวลานั้น
  - ใช้ half-open interval semantics: `[startTime, endTime)` ดังนั้นรายการที่จบตรงเวลาเริ่ม หรือเริ่มตรงเวลาจบ ไม่ถือว่าทับกัน
  - การตรวจและ insert holiday อยู่ใน Serializable transaction พร้อม retry เมื่อ Prisma แจ้ง transaction conflict (`P2034`)
- ปัจจุบันยังไม่มี Business Rule สำหรับจำกัด “จำนวน Staff ที่หยุดพร้อมกันสูงสุดต่อ Position”

### 2.2 Min/Max ของ Slot เดิม

- Prisma model `WorkScheduleMinMax` ผูกกับ `WorkSchedulePosition` และมี `min`, `max`, `startTime`, `endTime`
- `max` ของ `WorkScheduleMinMax` มีความหมายเฉพาะว่า “จำนวน Slot/Staff ที่ปฏิบัติงานพร้อมกันสูงสุดใน Position ตามช่วงเวลา” และถูก enforce ตอนสร้าง Slot
- `min` ของ `WorkScheduleMinMax` ถูกนำมาใช้ตอนสร้าง Holiday เพื่อป้องกันวันหยุดทำให้จำนวน Staff ที่พร้อมทำงานต่ำกว่า Min
- Create/Update/Delete ของ Min/Max ใช้สิทธิ์ Admin ผ่าน `verifyWorkSchedulePositionByWorkScheduleAdmin`
- Min/Max config ของ Position เดียวกันไม่อนุญาตให้ช่วงเวลาทับกัน โดยใช้เงื่อนไข overlap `existing.startTime < newEnd && existing.endTime > newStart`; ช่วงติดกันพอดีอนุญาต
- Frontend มีหน้า Admin ระดับ Position สำหรับจัดการ Min/Max แยกเป็น list/create/edit-delete และแชร์ Zod DTO จาก backend

### 2.3 ข้อจำกัดที่ต้องรักษา

- ห้ามนำ `WorkScheduleMinMax.max` เดิมมา reuse เป็น Max วันหยุด เพราะจะเปลี่ยนความหมายและ Business Logic ของจำนวน Slot สูงสุด
- ห้ามเพิ่ม `positionId` เข้า `WorkScheduleHoliday` เพื่อแก้โจทย์นี้ เพราะ Holiday เดิมเป็นวันหยุดของ Staff และ Staff หนึ่งคนอาจอยู่หลาย Position; วันหยุดของ Staff ต้องมีผลกับทุก active Position ที่ Staff สังกัดอยู่
- ห้ามเปลี่ยน behavior ของ Slot Max, Slot/Holiday overlap, Min staffing, FULL_DAY timezone conversion, PARTIAL interval หรือการลบวันหยุดเดิมโดยไม่จำเป็น

## 3. Business Logic ที่คาดหวังหลัง Implement

### 3.1 นิยามกฎใหม่

สร้างกฎใหม่ชื่อเชิงโดเมน `WorkScheduleHolidayMax` แยกจาก `WorkScheduleMinMax` โดยกฎหนึ่งรายการประกอบด้วย:

- Position ที่กฎนี้ใช้
- `max`: จำนวน **Staff ที่หยุดพร้อมกันสูงสุด** ใน Position นั้น
- `startTime`, `endTime`: ช่วงเวลาที่กฎมีผล

เหตุผลที่นับเป็น Staff แบบ distinct ไม่ใช่จำนวน holiday records:

- เป้าหมายคือจำกัดจำนวน “พนักงานที่หยุดพร้อมกัน” ใน Position
- ระบบปัจจุบันสามารถมี holiday records ที่ทับกันของ Staff คนเดียวกันได้ และ logic Min ปัจจุบันก็นับ Staff คนเดิมเพียงครั้งเดียว
- การนับ record จะทำให้ duplicate/overlapping holiday ของคนเดียวกันกิน quota ซ้ำและทำให้ผลลัพธ์ไม่ตรงจำนวนคนที่หยุดจริง

### 3.2 Scope ของกฎต่อ Staff และ Position

เมื่อ Staff สร้าง Holiday ใหม่:

1. หา active Position ทั้งหมดของ Staff ใน Place เดียวกับคำขอ โดยต้องกรอง `WorkScheduleStaffPosition.deletedAt`, `WorkScheduleStaff.deletedAt`, `WorkSchedulePosition.deletedAt` เป็น `null` และทั้ง Staff/Position ต้องอยู่ใน `placeId` เดียวกัน
2. Holiday ใหม่ต้องถูกตรวจกับ `WorkScheduleHolidayMax` ของ **ทุก Position ที่ Staff สังกัดอยู่**
3. ถ้า Staff ไม่มี active Position ให้ข้าม Holiday Max check และคง behavior ปัจจุบัน
4. Staff ที่อยู่หลาย Position ให้ holiday เดียวกันนับเป็น “1 คนที่หยุด” แยกในแต่ละ Position ที่เกี่ยวข้อง
5. Staff จาก Position อื่นหรือ Place อื่นห้ามถูกนำมานับ

### 3.3 วิธีนับ Max ที่ต้องใช้

สำหรับแต่ละ Holiday Max rule ที่ทับช่วง Holiday ใหม่:

1. หาช่วง intersection ระหว่าง Holiday ใหม่กับ rule: `[max(holidayStart, ruleStart), min(holidayEnd, ruleEnd))`
2. หา active Staff ทั้งหมดของ Position นั้นจาก `WorkScheduleStaffPosition`
3. ดึง Holiday เดิมของ Staff กลุ่มนั้นที่ทับช่วงคำขอ
4. รวม candidate Holiday ใหม่เข้าไปในชุดข้อมูลก่อนตรวจ
5. สร้าง boundary จาก intersection start/end และจุดเริ่ม/จบของ Holiday ที่ทับกัน (clip ให้อยู่ใน intersection)
6. ตรวจทุกช่วงย่อยระหว่าง boundary ที่เรียงแล้ว
7. ในแต่ละช่วงย่อย สร้าง `Set<workScheduleStaffId>` ของ Staff ที่มี Holiday ทับช่วงนั้น เพื่อ deduplicate คนเดิม
8. ถ้า `absentStaff.size > rule.max` ให้ reject การสร้าง Holiday ทั้งรายการด้วย HTTP 409 และ ErrorCode ใหม่ `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED`
9. ถ้าเท่ากับ `rule.max` ต้องอนุญาต
10. `max = 0` เป็นค่าที่ถูกต้องและหมายถึงห้าม Staff ใน Position นั้นมี Holiday ในช่วงกฎ

เหตุผลที่ต้องแบ่ง timeline เป็นช่วงย่อย: จำนวน Staff ที่หยุดพร้อมกันอาจเปลี่ยนกลางช่วง Holiday จาก holiday records ที่เริ่ม/จบไม่พร้อมกัน; เช็คเฉพาะเวลาเริ่มคำขอหรือรวมจำนวนทั้งช่วงจะให้ผลผิด

### 3.4 Boundary semantics

ใช้ half-open interval `[startTime, endTime)` ให้เหมือน logic ที่มีอยู่:

- overlap เมื่อ `a.start < b.end && a.end > b.start`
- Holiday ที่จบตรง `rule.startTime` ไม่ถูกนับ
- Holiday ที่เริ่มตรง `rule.endTime` ไม่ถูกนับ
- Holiday สองรายการที่ต่อกันพอดีไม่ถือว่าหยุดพร้อมกัน

### 3.5 CRUD ของ Holiday Max

- Create/Update/Delete/Read ทั้งหมดต้องเป็น Admin ของ Position ผ่าน `verifyWorkSchedulePositionByWorkScheduleAdmin`
- `max` ต้องเป็น integer และ `>= 0`
- `start_time` / `end_time` ต้องเป็น ISO 8601 datetime ที่มี offset และ `end_time > start_time`
- `position_id` และ `holiday_max_id` ใช้ UUID v7 validation ตาม convention ปัจจุบัน
- Holiday Max rules ภายใน Position เดียวกัน **ห้ามมีช่วงเวลาทับกัน** เพื่อให้ ณ เวลาใดเวลาหนึ่งมี Max ที่ใช้กับ Position นั้นได้เพียงค่าเดียว
- Create ตรวจ overlap กับทุก rule เดิมของ Position
- Update ต้องตรวจว่า record เป้าหมายอยู่ใน Position ที่ระบุ และตรวจ overlap โดย exclude record ตัวเอง
- Delete ต้องผูกทั้ง `holiday_max_id` และ `position_id`; ถ้าไม่พบให้คืน ErrorCode `WORK_SCHEDULE_HOLIDAY_MAX_NOT_FOUND`
- Query list ให้รับ `start_time` / `end_time` และคืนเฉพาะ rules ที่ overlap ช่วงที่ถาม เรียง `startTime`, `endTime`, `id` แบบเดียวกับ Min/Max
- Query detail ต้องตรวจว่า Holiday Max อยู่ใน Position ที่ระบุ
- การสร้างหรือแก้ rule **ไม่แก้/ลบ Holiday เก่าที่มีอยู่แล้วย้อนหลัง** และไม่เปลี่ยน record Holiday; rule ใหม่มีหน้าที่เป็น constraint ตอนมีการสร้าง Holiday ใหม่ เหมือนลักษณะ config ของ Min/Max เดิม
- การลบ rule เพียงยกเลิก constraint สำหรับการสร้าง Holiday หลังจากนั้น ไม่ลบ Holiday ใด ๆ

### 3.6 Error handling ที่คาดหวัง

เพิ่ม ErrorCode อย่างน้อย:

- `WORK_SCHEDULE_HOLIDAY_MAX_NOT_FOUND` — ใช้กับ CRUD/detail ของ rule
- `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` — ใช้เมื่อ candidate Holiday จะทำให้จำนวน distinct Staff ที่หยุดพร้อมกันใน Position เกิน Max

Frontend `API_ERROR_MESSAGES` ต้องมีข้อความสำหรับทั้งสอง code เพื่อให้ flow error เดิมของ axios/global error store แสดงข้อความที่เข้าใจได้ โดยไม่จำเป็นต้องเปลี่ยน `useCreateHoliday` ถ้า behavior เดิมสามารถ propagate backend error ได้ตามปกติ

## 4. โครงสร้างข้อมูลและไฟล์ที่คาดหวังหลัง Implement

### 4.1 Prisma / Database

แก้ `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`

- เพิ่ม relation ใน `WorkSchedulePosition` เช่น `workScheduleHolidayMaxs WorkScheduleHolidayMax[]`
- เพิ่ม model ใหม่:

```prisma
model WorkScheduleHolidayMax {
  id                     String               @id @default(uuid(7)) @db.Uuid
  workSchedulePositionId String               @map("work_schedule_position_id") @db.Uuid
  workSchedulePosition   WorkSchedulePosition @relation(fields: [workSchedulePositionId], references: [id], onDelete: Restrict)
  max                    Int
  startTime              DateTime             @map("start_time") @db.Timestamptz
  endTime                DateTime             @map("end_time") @db.Timestamptz

  @@index([workSchedulePositionId, startTime, endTime])
  @@map("work_schedule_holiday_max")
}
```

เพิ่ม migration ใหม่ภายใต้ `ecosystem-backend-nest-js/prisma/migrations/<timestamp>_add_work_schedule_holiday_max/migration.sql` ผ่าน Prisma migration command; ห้ามแก้ migration เก่าที่ถูก commit แล้ว

Migration ต้องสร้าง table, primary key, foreign key ไป `work_schedule_position(id)` แบบ Restrict/NoAction ตาม Prisma generated SQL และ index สำหรับ `(work_schedule_position_id, start_time, end_time)`

### 4.2 Backend: feature ใหม่ `holiday-max`

สร้าง directory `ecosystem-backend-nest-js/src/modules/work-schedule/holiday-max/` โดยยึดโครงสร้าง `min-max` เดิมเป็น pattern แต่ห้าม import/reuse DTO ที่ทำให้ domain สองเรื่องปะปนกัน

ไฟล์หลักที่คาดหวัง:

```text
ecosystem-backend-nest-js/src/modules/work-schedule/holiday-max/
├── holiday-max.controller.ts
├── holiday-max.module.ts
├── holiday-max.dto.spec.ts
├── commands/
│   ├── create.command.ts
│   ├── create.handler.ts
│   ├── create.handler.spec.ts
│   ├── update.command.ts
│   ├── update.handler.ts
│   ├── update.handler.spec.ts
│   ├── delete.command.ts
│   ├── delete.handler.ts
│   └── delete.handler.spec.ts
└── queries/
    ├── get-holiday-maxs-by-position-id-start-time-end-time.query.ts
    ├── get-holiday-maxs-by-position-id-start-time-end-time.handler.ts
    ├── get-holiday-maxs-by-position-id-start-time-end-time.handler.spec.ts
    ├── get-holiday-max-by-id.query.ts
    ├── get-holiday-max-by-id.handler.ts
    └── get-holiday-max-by-id.handler.spec.ts
```

ชื่อ class/interface สามารถเดินตาม convention ของ Min/Max แต่ต้องใช้คำว่า HolidayMax ให้ชัดเจน

Controller endpoint ให้ใช้ namespace ใหม่ ไม่ชนกับ Holiday ของ Staff หรือ Min/Max ของ Slot:

- `POST /api/work-schedule/holiday-max/:position_id`
- `PATCH /api/work-schedule/holiday-max/positions/:position_id/holiday-maxs/:holiday_max_id`
- `DELETE /api/work-schedule/holiday-max/positions/:position_id/holiday-maxs/:holiday_max_id`
- `GET /api/work-schedule/holiday-max/by-position-id-start-time-end-time/:position_id?start_time=...&end_time=...`
- `GET /api/work-schedule/holiday-max/positions/:position_id/holiday-maxs/:holiday_max_id`

แก้ `ecosystem-backend-nest-js/src/modules/work-schedule/work-schedule.module.ts`

- import/register `HolidayMaxModule`

แก้ `ecosystem-backend-nest-js/src/common/exceptions/error-codes.enum.ts`

- เพิ่ม ErrorCode ใหม่ตามข้อ 3.6

### 4.3 Backend: enforce ตอนสร้าง Holiday

แก้:

- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.spec.ts`

แนวทาง Implement ที่ต้องรักษา:

- คงการ resolve interval, slot overlap, Min staffing และ Serializable transaction/retry เดิม
- เพิ่ม Holiday Max validation **ภายใน transaction เดียวกันก่อน `workScheduleHoliday.create`**
- สามารถ refactor การหา active requester positions / active staff-position links เพื่อแชร์ระหว่าง Min check กับ Holiday Max check ได้ แต่ผลลัพธ์ของ Min เดิมต้องไม่เปลี่ยน
- Query `workScheduleHolidayMax` เฉพาะ rules ของ active requester positions ที่ overlap candidate Holiday
- อย่าดึง Staff/Holiday เพิ่มถ้าไม่มี applicable Holiday Max rules
- ต้อง deduplicate Position IDs, Staff IDs และ absent Staff IDs
- ถ้ามีหลาย Position ต้องตรวจแยกกันและ reject ถ้ามี Position ใด Position หนึ่งเกิน Max
- Business conflict จาก Max ต้องไม่เข้า retry loopแบบ transaction conflict; `AppException` ต้องถูก rethrow ตาม pattern เดิม

### 4.4 Frontend: Admin CRUD UI

สร้าง feature ใหม่แยกจาก `min-max`:

```text
ecosystem-frontend-next-js/src/features/work-schedule/holiday-max/
├── api/
│   ├── mutations/
│   │   ├── create.api.ts
│   │   ├── update.api.ts
│   │   └── delete.api.ts
│   └── queries/
│       ├── get-holiday-max-by-id.api.ts
│       └── get-holiday-maxs-by-position-id-start-time-end-time.api.ts
├── components/
│   ├── create-form.tsx
│   └── edit-form.tsx
├── hooks/
│   ├── use-create.ts
│   ├── use-update.ts
│   └── use-delete.ts
├── work-schedule-holiday-max-keys.ts
└── work-schedule-holiday-max.queries.ts
```

Frontend API ต้อง import Zod schema จาก backend holiday-max DTO เหมือน pattern ปัจจุบันของ Min/Max เพื่อไม่ duplicate contract

Query keys ต้องแยก namespace เช่น `[userId, "work-schedule", "holiday-max", ...]` และต้องมี key ระดับ list-by-position เพื่อ invalidate list ทุก date range ของ Position หลัง create/update/delete

สร้าง route Admin ระดับ Position แยกจาก `min-max`:

```text
ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/holiday-max/
├── page.tsx
├── client-page.tsx
├── loading.tsx
├── error.tsx
├── error-code-redirect-list.ts
├── new/
│   ├── page.tsx
│   ├── client-page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── error-code-redirect-list.ts
└── [holidayMaxId]/
    ├── page.tsx
    ├── client-page.tsx
    ├── loading.tsx
    ├── error.tsx
    └── error-code-redirect-list.ts
```

List page:

- query Place เพื่อได้ timezone
- ใช้ date/time range input ตาม pattern Min/Max
- ส่งช่วงเป็น ISO ที่มี offset/UTC ตาม contract
- แสดง `startTime`, `endTime`, `max` และ action ไปหน้า detail
- มีปุ่มสร้าง rule ใหม่

Create/Edit form:

- `max` เป็น required number, integer, min 0
- `start_time`, `end_time` ใช้ `datetime-local` แต่แปลงด้วย Place timezone ก่อนส่ง API เหมือน Min/Max form
- Edit page โหลด detail, fill ค่าเดิมใน timezone ของ Place, update และ delete ได้
- Delete success กลับ list page

แก้ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/client-page.tsx`

- เพิ่ม MenuCard/เมนูใหม่ไป `/holiday-max`
- ชื่อ/คำอธิบายต้องสื่อว่าเป็น “จำนวนพนักงานที่หยุดพร้อมกันสูงสุด” เพื่อไม่สับสนกับ Min/Max จำนวนคนเข้าเวร

แก้ `ecosystem-frontend-next-js/src/constants/error-messages.ts`

- เพิ่มข้อความสำหรับ `WORK_SCHEDULE_HOLIDAY_MAX_NOT_FOUND`
- เพิ่มข้อความสำหรับ `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED`

### 4.5 Frontend tests ที่คาดหวัง

เพิ่ม test ใน `ecosystem-frontend-next-js/tests/work-schedule/` โดยยึด pattern ที่มีอยู่ของ `min-max-api.test.tsx`, `min-max-cache-invalidation.test.tsx`, `min-max-edit-delete.test.tsx`

ไฟล์ที่แนะนำ:

```text
ecosystem-frontend-next-js/tests/work-schedule/holiday-max-api.test.tsx
ecosystem-frontend-next-js/tests/work-schedule/holiday-max-cache-invalidation.test.tsx
ecosystem-frontend-next-js/tests/work-schedule/holiday-max-edit-delete.test.tsx
```

ไม่ต้องสร้าง browser/E2E test framework ใหม่

## 5. ขั้นตอน Implement และเกณฑ์ผ่านแต่ละขั้น

### Step 1 — เพิ่ม Prisma model และ migration

ดำเนินการ:

- เพิ่ม `WorkScheduleHolidayMax` + relation ใน schema
- generate migration ใหม่
- run Prisma generate/validate

เกณฑ์ผ่าน:

- Prisma schema valid
- Prisma Client มี `workScheduleHolidayMax`
- migration สร้างเฉพาะ table/index/FK ที่เกี่ยวข้องกับ feature นี้
- ไม่มีการแก้ schema ความหมายของ `WorkScheduleMinMax` หรือ `WorkScheduleHoliday`

### Step 2 — Backend Holiday Max CRUD/query

ดำเนินการ:

- สร้าง module/controller/DTO/handlers/query handlers
- register module ใน `WorkScheduleModule`
- เพิ่ม ErrorCode

เกณฑ์ผ่าน:

- non-admin ไม่สามารถ create/update/delete/read rule ของ Position ได้
- create max=0 ได้
- reject max ติดลบ, decimal, invalid datetime, `end <= start`, invalid UUID
- reject create เมื่อช่วงทับ rule เดิมใน Position เดียวกัน
- adjacent rule (`old.end == new.start`) ผ่าน
- rule ของคนละ Position สามารถมีช่วงเดียวกันได้
- update exclude record ตัวเองจาก overlap check
- update/delete/detail ด้วย ID ที่อยู่ Position อื่นต้องได้ NOT_FOUND ของ Holiday Max
- list คืนเฉพาะ overlap rules และเรียง deterministic

### Step 3 — Enforce Holiday Max ใน CreateHoliday

ดำเนินการ:

- เพิ่ม query/config + timeline calculation ก่อน insert holiday
- คง transaction เดิม

เกณฑ์ผ่าน:

- ไม่มี rule -> behavior เดิม ไม่เสีย extra staffing/holiday query โดยไม่จำเป็น
- จำนวนคนหยุดหลัง candidate < max -> ผ่าน
- จำนวนคนหยุดหลัง candidate == max -> ผ่าน
- จำนวนคนหยุดหลัง candidate > max -> 409 `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` และไม่ insert
- max=0 -> candidate ที่ทับ rule ถูก reject
- existing holiday ที่จบตรง candidate/rule start ไม่ถูกนับ
- existing holiday ที่เริ่มตรง candidate/rule end ไม่ถูกนับ
- duplicate/overlapping holiday ของ Staff คนเดียวกันนับ Staff คนนั้นครั้งเดียว
- Staff ที่ไม่ active ใน Position, Staff/Position ที่ soft-delete, หรือคนละ Place ไม่ถูกนับ
- candidate ของ Staff ที่มีหลาย Position ต้องผ่านทุก applicable Position; เกินเพียง Position เดียวต้อง reject
- rule ที่ shortage/overage เกิดนอก intersection กับ candidate ต้องไม่ทำให้ candidate fail
- FULL_DAY ยังคงใช้ Place timezone และ DST interval เดิม
- Slot overlap และ Min staffing tests เดิมยังผ่าน
- Serializable transaction retry behavior เดิมยังผ่าน

### Step 4 — Frontend Admin CRUD

ดำเนินการ:

- เพิ่ม feature API/query keys/hooks/forms
- เพิ่ม list/new/detail routes
- เพิ่มเมนู Position
- เพิ่ม error messages

เกณฑ์ผ่าน:

- Admin เข้าเมนู Holiday Max จาก Position ได้
- list filter ด้วยช่วงวันที่/เวลาและแสดง Max ถูกต้อง
- create/edit/delete เรียก endpoint ใหม่และส่ง timezone-correct ISO datetime
- หลัง mutation list ทุก cached date range ของ Position ถูก invalidate และ detail cache ไม่ค้าง
- route error redirect ทำงานตาม access-control pattern เดิม
- UI ไม่ใช้คำที่ทำให้เข้าใจว่าเป็น `WorkScheduleMinMax.max` ของจำนวน Slot

### Step 5 — Tests และ regression checks

ดำเนินการ:

- เพิ่ม/แก้ backend unit tests และ frontend Jest tests ตามข้างต้น
- run commands ในข้อ 7

เกณฑ์ผ่าน:

- tests ใหม่ครอบคลุม CRUD validation, rule overlap, authorization, timeline boundaries, distinct Staff counting, multi-position และ exceeded Max
- tests เดิมของ Holiday/MinMax/Slot ที่เกี่ยวข้องยังผ่าน
- backend/frontend typecheck และ lint ผ่าน
- build ผ่านเมื่อ environment มี dependency/config ที่จำเป็น

## 6. สิ่งที่ Implementor ต้องระวัง

- อย่าเปลี่ยน `WorkScheduleMinMax.max` ให้หมายถึง Holiday Max และอย่ารวม model ใหม่เข้ากับ Min/Max เดิม
- อย่าเพิ่ม Position ลง `WorkScheduleHoliday`; Position membership ต้อง resolve จาก active `WorkScheduleStaffPosition` ตอนตรวจ
- อย่านับ holiday records ตรง ๆ; ต้องนับ distinct Staff ในแต่ละช่วงย่อยของ timeline
- อย่านับ Staff ที่ link ถูก soft-delete, Staff ถูก soft-delete, Position ถูก soft-delete หรืออยู่นอก Place
- อย่าตรวจเพียงจำนวน Holiday ณ candidate start; ต้องตรวจทุก subinterval ที่จำนวนคนหยุดเปลี่ยน
- อย่าใช้ closed interval เพราะจะทำให้รายการที่ต่อกันพอดีถูกนับทับกัน
- อย่าทำให้ business `AppException` ถูก retry เหมือน `P2034`
- อย่าทำ query หนักเมื่อ requester ไม่มี Position หรือไม่มี applicable Holiday Max rule
- อย่าลบ/แก้ Holiday เดิมเมื่อ Admin เปลี่ยน rule
- อย่าแก้ error handling ของ `useCreateHoliday` ถ้าไม่จำเป็น; เพิ่ม ErrorCode/message ให้ flow เดิมแสดง backend conflict ได้ก่อน
- Frontend ต้องใช้ backend Zod contract เพื่อป้องกัน schema drift
- การเพิ่ม migration ให้สร้าง migration ใหม่เท่านั้น ห้าม rewrite migration เดิม
- ห้ามแก้ Business Logic ของ Min staffing, Slot Max, auto-create Slot หรือ Slot/Holiday overlap นอกเหนือจาก regression ที่จำเป็น

## 7. Test ที่ต้องเพิ่ม/แก้ และคำสั่งตรวจสอบ

### Backend tests

อย่างน้อยต้องเพิ่ม/แก้:

- `holiday-max.dto.spec.ts`: max validation, UUID, datetime/ordering
- create/update/delete handler specs: admin access, overlap/adjacent, wrong Position, not found
- query handler specs: authorization, overlap filtering, deterministic ordering, detail ownership
- `holiday/commands/create-holiday.handler.spec.ts`: Holiday Max scenarios ใน Step 3

คำสั่งจาก `ecosystem-backend-nest-js`:

```bash
pnpm run prisma:generate
pnpm run prisma:validate
pnpm run typecheck
pnpm run lint:check
pnpm test -- holiday-max
pnpm test -- create-holiday.handler.spec.ts
pnpm test
pnpm run build
```

ถ้ามี database URL สำหรับ migration environment ให้ตรวจเพิ่ม:

```bash
pnpm run prisma:migrate:status
```

ตอนสร้าง migration ใน dev environment:

```bash
pnpm exec prisma migrate dev --name add_work_schedule_holiday_max
```

### Frontend tests

เพิ่ม tests ตามข้อ 4.5 และ regression ของ menu/error handling ที่จำเป็น

คำสั่งจาก `ecosystem-frontend-next-js`:

```bash
pnpm run typecheck
pnpm run lint
pnpm test -- work-schedule/holiday-max
pnpm test
pnpm run build
```

หาก command ใดรันไม่ได้เพราะ environment ไม่มี database, secret หรือ runtime dependency ที่จำเป็น ให้รายงาน command ที่รันไม่ได้และเหตุผลจริง ห้ามอ้างว่าผ่าน

## 8. Definition of Done

งานถือว่าผ่านเมื่อครบทั้งหมด:

- มี schema/table ใหม่สำหรับ Holiday Max แยกจาก Slot Min/Max
- Admin เท่านั้นที่จัดการและอ่าน config ผ่าน admin flow ได้
- Staff สร้าง Holiday ได้เมื่อจำนวน distinct Staff ที่หยุดพร้อมกันในทุก Position ที่เกี่ยวข้องไม่เกิน Max
- เกิน Max แล้ว backend reject แบบ atomic ก่อน insert
- exact Max ผ่าน, max=0 ทำงาน, boundary/duplicate/multi-position ถูกต้อง
- Min staffing, Slot Max, Slot/Holiday overlap และ timezone behavior เดิมไม่เปลี่ยน
- Frontend Admin มี list/create/edit/delete สำหรับ Holiday Max และมีเมนูเข้าถึงจาก Position
- ErrorCode/frontend message ครบ
- Prisma validation, unit tests, frontend tests, typecheck, lint และ build ที่ environment รองรับผ่าน
