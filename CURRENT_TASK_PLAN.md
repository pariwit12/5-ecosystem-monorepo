# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

รอบงาน: 2026-10-31

สร้างระบบกำหนด Max ของจำนวนวันหยุดของพนักงาน ตั้งแต่วันที่ ... ถึง วันที่ ... เหมือน minMax ของจำนวน slot โดยผู้ที่จะสามารถมาสร้างและแก้ไขหรือลบ ข้อมูลจำนวนสูงสุดของวันหยุดของพนักงานได้ คือ admin

### คำยืนยันเพิ่มเติมจากผู้ใช้ (ยึดข้อความดั้งเดิม)

หมายถึงจำนวนวันหยุดที่พนักงานลงตรงกันพร้อมกันใน Position นั้นครับ โดยให้สร้าง schema ใหม่เลยครับ มีตรงไหนที่ยังไม่เคลียร์สามารถสอบถามได้เลยนะครับ

## 2. Business Logic และโค้ดที่เกี่ยวข้องก่อนเริ่ม Implement

### 2.1 โครงสร้างข้อมูลปัจจุบัน

ยืนยันจาก `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`:

- `WorkScheduleHoliday` เป็น Holiday ของ Staff โดยผูกผ่าน `workScheduleStaffId`; Holiday record ไม่มี `positionId`
- `WorkScheduleStaffPosition` เชื่อม Staff กับ Position และมี `deletedAt`
- `WorkScheduleStaff` และ `WorkSchedulePosition` มี `deletedAt` และผูกกับ `organizationWorkSchedulePlaceId`
- Staff หนึ่งคนสามารถมีหลาย active Position ได้ ดังนั้น Holiday เดียวของ Staff ต้องมีผลต่อทุก active Position ที่ Staff สังกัดอยู่
- `WorkScheduleMinMax` ผูกกับ Position และมี `min`, `max`, `startTime`, `endTime`; `max` เดิมมีความหมายเป็นจำนวน Slot/คนปฏิบัติงานสูงสุด ไม่ใช่จำนวนคนหยุด

โครงสร้างสำคัญปัจจุบัน:

```prisma
model WorkScheduleStaffPosition {
  workScheduleStaffId    String               @map("work_schedule_staff_id") @db.Uuid
  workScheduleStaff      WorkScheduleStaff    @relation(fields: [workScheduleStaffId], references: [id], onDelete: Restrict)
  workSchedulePositionId String               @map("work_schedule_position_id") @db.Uuid
  workSchedulePosition   WorkSchedulePosition @relation(fields: [workSchedulePositionId], references: [id], onDelete: Restrict)
  deletedAt              DateTime?            @map("deleted_at")

  @@id([workScheduleStaffId, workSchedulePositionId])
}
```

```prisma
model WorkScheduleHoliday {
  id                  String            @id @default(uuid(7)) @db.Uuid
  workScheduleStaffId String            @map("work_schedule_staff_id") @db.Uuid
  workScheduleStaff   WorkScheduleStaff @relation(fields: [workScheduleStaffId], references: [id], onDelete: Restrict)
  startTime           DateTime          @map("start_time") @db.Timestamptz
  endTime             DateTime          @map("end_time") @db.Timestamptz
  createdAt           DateTime          @default(now()) @map("created_at") @db.Timestamptz

  @@index([workScheduleStaffId, startTime, endTime])
  @@map("work_schedule_holiday")
}
```

### 2.2 การสร้าง Holiday ปัจจุบัน

ไฟล์หลัก:

- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.spec.ts`

ลำดับ behavior ปัจจุบันที่ต้องรักษา:

1. ตรวจ Staff access ด้วย `verifyWorkScheduleStaffAccess`
2. Resolve ช่วงเวลา Holiday
   - `FULL_DAY` ใช้ timezone ของ Place แปลง local day เป็น UTC interval
   - `PARTIAL` ใช้ datetime จาก request
3. เข้า `Serializable` transaction ผ่าน `executeWithRetry`
4. ตรวจ Slot overlap แบบ half-open: `slot.start < holidayEnd && slot.end > holidayStart`
5. ตรวจ Min staffing ด้วย `verifyMinimumStaff(...)`
6. insert `WorkScheduleHoliday`

`executeWithRetry` ปัจจุบัน:

- retry เฉพาะ Prisma transaction conflict `P2034`
- `AppException` ถูก rethrow ทันทีและไม่เข้า retry loop
- retry ได้สูงสุดตาม helper ปัจจุบัน

`verifyMinimumStaff(...)` ปัจจุบัน:

- หา active Position ของ requester ด้วย `WorkScheduleStaffPosition.deletedAt = null`
- กรอง Staff/Position ให้ `deletedAt = null` และอยู่ Place เดียวกัน
- query เฉพาะ `WorkScheduleMinMax` ที่ `min != null` และ overlap candidate Holiday
- query active Staff ของ Position ที่เกี่ยวข้อง
- query Holiday เดิมของ Staff ที่เกี่ยวข้อง
- รวม candidate Holiday เข้าไปก่อนตรวจ
- clip การตรวจให้เหลือ intersection ของ candidate กับ rule
- สร้าง timeline boundaries และตรวจทุก subinterval
- ใช้ `Set<workScheduleStaffId>` จึงนับ Staff คนเดิมครั้งเดียวแม้มี Holiday records ซ้อนกัน
- ใช้ half-open interval `[startTime, endTime)`
- reject เมื่อ `positionStaff.size - absentStaff.size < rule.min`

spec ปัจจุบันยืนยัน regression สำคัญว่าเมื่อ attempt แรกเกิด `P2034` แล้วมี concurrent Holiday เพิ่มขึ้น ก่อน retry ต้อง query state ใหม่และคำนวณ Min ใหม่จนสามารถ reject ได้ ดังนั้น validation ใหม่ที่ขึ้นกับ Holiday state ต้องอยู่ใน transaction callback และห้าม reuse state ข้าม retry attempt

### 2.3 Min/Max ของ Slot ปัจจุบัน

ไฟล์อ้างอิงหลัก:

- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/min-max.controller.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/min-max.module.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/update.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/update.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/delete.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/queries/get-min-maxs-by-position-id-start-time-end-time.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/queries/get-min-max-by-id.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts`

Business Logic ที่ยืนยัน:

- Create/Update/Delete/List/Detail ตรวจ Admin ผ่าน `verifyWorkSchedulePositionByWorkScheduleAdmin`
- DTO ใช้ UUID v7 และ ISO datetime ที่มี offset
- `min`/`max` validate เป็น integer และไม่ติดลบ
- rule ของ Position เดียวกันห้ามช่วงทับกัน ด้วย half-open overlap `startTime < otherEnd && endTime > otherStart`; adjacent interval อนุญาต
- Create และ Update ทำ overlap check ภายใน transaction และล็อก Position row ก่อน:

```ts
await tx.$queryRaw`SELECT id FROM "work_schedule_position" WHERE id = ${param.position_id} FOR UPDATE`;
```

- Update scope target ด้วยทั้ง `id` และ `workSchedulePositionId` และ exclude ตัวเองจาก overlap query
- Delete ใช้ `deleteMany({ where: { id, workSchedulePositionId } })`; `count === 0` -> NOT_FOUND
- Detail scope ด้วยทั้ง `id` และ Position
- List ใช้ half-open overlap และ deterministic ordering `startTime`, `endTime`, `id`
- `WorkScheduleMinMax.max` ถูก enforce ตอนสร้าง Slot ภายใน Serializable transaction ที่ล็อก Position row; ห้ามเปลี่ยนความหมายเดิม
- การสร้าง Min/Max config ปัจจุบันไม่ย้อนกลับไปแก้หรือลบ Slot เก่าที่มีอยู่แล้ว

### 2.4 Frontend pattern ปัจจุบัน

ยืนยันจากโค้ดจริง:

- feature Min/Max อยู่ที่ `ecosystem-frontend-next-js/src/features/work-schedule/min-max/`
- แยก `api/mutations`, `api/queries`, `components`, `hooks`, query-key factory และ query options
- frontend API import Zod schema จาก backend โดยตรง
- `workScheduleMinMaxKeys` มี prefix ระดับ `listsByPositionId(userId, positionId)` และ date-range key ต่อจาก prefix นี้
- create/update/delete invalidate list prefix ของ Position; update/delete invalidate detail ด้วย
- form ใช้ `datetime-local` และแปลงด้วย timezone ของ Place ผ่าน Luxon ก่อนส่ง API
- หน้า Position Admin ที่ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/client-page.tsx` มี MenuCard ไป `/min-max`
- route Min/Max มี list/new/detail พร้อม `loading.tsx`, `error.tsx`, `error-code-redirect-list.ts`
- frontend import `ErrorCode` จาก backend และ `API_ERROR_MESSAGES` เป็น `Record<ErrorCode, string>`
- tests ที่มีอยู่จริงและใช้เป็น pattern:
  - `ecosystem-frontend-next-js/tests/work-schedule/min-max-api.test.tsx`
  - `ecosystem-frontend-next-js/tests/work-schedule/min-max-cache-invalidation.test.tsx`
  - `ecosystem-frontend-next-js/tests/work-schedule/min-max-edit-delete.test.tsx`

### 2.5 ข้อจำกัดที่ต้องรักษา

- ห้าม reuse `WorkScheduleMinMax.max` เป็น Holiday Max
- ห้ามเพิ่ม `positionId` ลง `WorkScheduleHoliday`
- ห้ามเปลี่ยน Min staffing semantics
- ห้ามเปลี่ยน Slot Max semantics
- ห้ามเปลี่ยน Slot/Holiday overlap semantics
- ห้ามเปลี่ยน FULL_DAY timezone conversion หรือ PARTIAL datetime behavior
- ห้ามเปลี่ยน half-open interval เป็น closed interval
- ห้ามเปลี่ยน `AppException`/`P2034` retry semantics โดยไม่จำเป็น

## 3. Business Logic ที่คาดหวังหลัง Implement

### 3.1 Domain ใหม่: `WorkScheduleHolidayMax`

สร้าง model/table ใหม่แยกจาก `WorkScheduleMinMax`

แต่ละ rule มี:

- Position ที่ rule ใช้
- `max`: จำนวน **distinct Staff ที่มี Holiday พร้อมกันสูงสุด** ใน Position นั้น
- `startTime`, `endTime`: ช่วงที่ rule มีผล

`max` ต้องเป็น integer `>= 0`

- `max = 0` ถูกต้อง และหมายถึงห้ามมี Staff ใน Position นั้นหยุดในช่วง rule
- ต้องนับ Staff ไม่ใช่จำนวน Holiday record เพราะ Staff คนเดียวอาจมี Holiday ซ้อนหลาย record

### 3.2 Scope ต่อ Position

เมื่อ Staff สร้าง Holiday:

1. หา active Position ทั้งหมดของ requester ใน Place เดียวกัน โดยใช้ filter แบบเดียวกับ Min ปัจจุบัน
2. ถ้าไม่มี active Position ให้ข้าม Holiday Max check และคง behavior เดิม
3. query Holiday Max rules เฉพาะ Position เหล่านั้นและเฉพาะ rule ที่ overlap candidate Holiday
4. ถ้าไม่มี applicable rule ให้ข้าม query active-position Staff/Holiday เพิ่มเติมสำหรับ Max
5. Staff ที่อยู่หลาย Position ต้องถูกตรวจแยกทุก Position
6. candidate เดียวกันนับ 1 Staff ในแต่ละ active Position ที่ requester สังกัดอยู่
7. Staff/link/Position ที่ soft-delete หรืออยู่คนละ Place ห้ามถูกนับ

### 3.3 Algorithm ตรวจ Holiday Max

สำหรับ applicable rule แต่ละรายการ:

1. หา intersection:
   - `checkStart = max(candidate.start, rule.startTime)`
   - `checkEnd = min(candidate.end, rule.endTime)`
2. หา active Staff links ของ Position นั้น
3. query existing Holiday ของ Staff กลุ่มดังกล่าวที่ overlap candidate interval
4. รวม candidate Holiday `{ workScheduleStaffId: requesterStaffId, startTime, endTime }`
5. filter Holiday ที่เป็นสมาชิก Position และ overlap `[checkStart, checkEnd)`
6. สร้าง boundary set จาก `checkStart`, `checkEnd` และ start/end ของ Holiday ที่ clip เข้า intersection
7. sort boundaries และตรวจทุกช่วง `[times[i], times[i + 1])` ที่ duration > 0
8. สร้าง `Set<workScheduleStaffId>` ของ Holiday ที่ overlap subinterval นั้น
9. ถ้า `absentStaff.size > rule.max` -> throw `AppException` ด้วย `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED`, HTTP 409
10. ถ้า `absentStaff.size <= rule.max` -> ผ่าน

ต้องตรวจทุก subinterval เพราะจำนวน Staff ที่หยุดพร้อมกันอาจเปลี่ยนกลาง candidate interval

### 3.4 Validation order invariant ใน Create Holiday

ต้องรักษาลำดับเดิมและเพิ่ม Holiday Max หลัง Min เพื่อไม่เปลี่ยน error precedence ของ Business Logic เดิม:

1. Slot overlap
2. `verifyMinimumStaff(...)`
3. Holiday Max validation ใหม่
4. `workScheduleHoliday.create(...)`

เหตุผล:

- ก่อน feature นี้ Holiday ที่ทำให้ Min ต่ำกว่ากำหนดจะถูก reject ด้วย `WORK_SCHEDULE_HOLIDAY_MIN_STAFF_NOT_ENOUGH`
- หาก request เดียวผิดทั้ง Min และ Holiday Max การเพิ่ม feature ใหม่ต้องไม่แย่ง precedence ของ Min ที่มีอยู่แล้ว
- Holiday Max ยังต้อง reject ก่อน insert เช่นเดิม

### 3.5 Concurrency / retry invariant

ข้อมูลทั้งหมดที่มีผลต่อ Holiday Max decision ต้อง query/คำนวณภายใน callback ของ `executeWithRetry` ทุก attempt ได้แก่:

- active requester Position
- applicable Holiday Max rules
- active Staff links ของ Position ที่เกี่ยวข้อง
- existing Holiday
- `Map`/`Set`/timeline intermediate state ที่สร้างจากข้อมูลข้างต้น

ห้าม cache หรือ reuse state จาก attempt ที่เกิด `P2034`

Acceptance สำคัญ:

- attempt แรกอ่านว่าจำนวนคนหยุดยังไม่เกิน Max
- transaction attempt แรกจบด้วย `P2034`
- ก่อน attempt ถัดไปมี Holiday ของ Staff คนอื่นถูก commit
- retry ต้องอ่าน state ใหม่และ reject ด้วย `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` หากหลังรวม candidate แล้วเกิน Max
- candidate ต้องไม่ถูก insert สำเร็จ

### 3.6 Boundary semantics

ใช้ half-open `[startTime, endTime)` ทั้ง config และ Holiday enforcement:

- overlap เมื่อ `a.start < b.end && a.end > b.start`
- Holiday ที่จบตรง rule/candidate start ไม่ถูกนับ
- Holiday ที่เริ่มตรง rule/candidate end ไม่ถูกนับ
- adjacent Holiday Max rules (`old.end == new.start`) อนุญาต

### 3.7 CRUD ของ Holiday Max

- Create/Update/Delete/List/Detail ต้องผ่าน `verifyWorkSchedulePositionByWorkScheduleAdmin`
- DTO:
  - `position_id`: UUID v7
  - `holiday_max_id`: UUID v7 สำหรับ endpoint ที่ต้องใช้
  - `max`: required integer `>= 0`
  - `start_time`, `end_time`: ISO 8601 string ที่มี offset
  - `end_time > start_time`
- Position เดียวกันห้ามมี Holiday Max rule ทับกัน
- Create/Update ต้องทำใน transaction และล็อก `work_schedule_position` ด้วย `FOR UPDATE` ก่อน overlap query โดย mirror Min/Max pattern
- Create overlap query: same Position + `startTime < body.end_time` + `endTime > body.start_time`
- Update:
  - lock Position ก่อน
  - target ต้อง match ทั้ง `holiday_max_id` และ `position_id`
  - ถ้าไม่พบ -> `WORK_SCHEDULE_HOLIDAY_MAX_NOT_FOUND`
  - overlap query exclude ตัวเอง
- Delete scope ด้วยทั้ง ID และ Position; `count === 0` -> NOT_FOUND
- List รับ `start_time`/`end_time`, คืนเฉพาะ overlap rules และ order `startTime`, `endTime`, `id`
- Detail scope ด้วยทั้ง ID และ Position

การ create/update/delete rule **ไม่แก้หรือลบ Holiday เก่า** และไม่ทำ retroactive rewrite; rule เป็น constraint สำหรับการสร้าง Holiday หลัง config มีผล สอดคล้องกับ pattern Min/Max ปัจจุบันที่การสร้าง config ไม่ย้อนแก้ Slot เก่า

### 3.8 Error handling

เพิ่ม ErrorCode อย่างน้อย:

- `WORK_SCHEDULE_HOLIDAY_MAX_NOT_FOUND`
- `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED`

`WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` ต้อง throw ผ่าน `AppException(..., HttpStatus.CONFLICT)` เพื่อให้ `executeWithRetry` rethrow ทันทีและไม่เข้า P2034 retry loop

config overlap ให้ใช้ `BadRequestException` ตาม Min/Max pattern ปัจจุบัน ไม่ต้องเพิ่ม ErrorCode ใหม่สำหรับ overlap

frontend `API_ERROR_MESSAGES` ต้องเพิ่มข้อความสำหรับ ErrorCode ใหม่ทั้งสองรายการ เพราะ type ปัจจุบันเป็น `Record<ErrorCode, string>`

## 4. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### 4.1 Prisma / migration

แก้:

- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`

เพิ่ม relation ใน `WorkSchedulePosition` และ model ใหม่ เช่น:

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

เพิ่ม migration ใหม่ภายใต้ path ที่ repo ใช้อยู่จริง:

- `ecosystem-backend-nest-js/prisma/migrations/<timestamp>_add_work_schedule_holiday_max/migration.sql`

ห้ามแก้ migration เก่าที่ commit แล้ว

### 4.2 Backend feature ใหม่

สร้าง:

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

Controller namespace ให้ mirror Min/Max ด้วย namespace ใหม่:

- `POST /api/work-schedule/holiday-max/:position_id`
- `PATCH /api/work-schedule/holiday-max/positions/:position_id/holiday-maxs/:holiday_max_id`
- `DELETE /api/work-schedule/holiday-max/positions/:position_id/holiday-maxs/:holiday_max_id`
- `GET /api/work-schedule/holiday-max/by-position-id-start-time-end-time/:position_id?start_time=...&end_time=...`
- `GET /api/work-schedule/holiday-max/positions/:position_id/holiday-maxs/:holiday_max_id`

แก้:

- `ecosystem-backend-nest-js/src/modules/work-schedule/work-schedule.module.ts` — import/register `HolidayMaxModule`
- `ecosystem-backend-nest-js/src/common/exceptions/error-codes.enum.ts` — เพิ่ม ErrorCode ใหม่

`holiday-max.module.ts` ให้ใช้ CQRS registration pattern เดียวกับ `min-max.module.ts`

### 4.3 Enforce ใน Create Holiday

แก้:

- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.spec.ts`

ข้อกำหนด implementation:

- Holiday Max validation ต้องอยู่ภายใน Serializable transaction เดิม
- ต้องเรียกหลัง `verifyMinimumStaff(...)` และก่อน `workScheduleHoliday.create(...)`
- คง Slot overlap และ Min staffing behavior เดิม
- query Holiday Max rules ก่อน query active-position Staff/Holiday เพิ่มเติมสำหรับ Max; หากไม่มี applicable rule ให้ return จาก Max helper ทันที
- dedupe Position IDs, Staff IDs และ absent Staff IDs
- candidate ต้องถูกตรวจทุก applicable Position และทุก applicable rule
- business conflict ต้อง throw `AppException` และไม่ retry
- state ที่มีผลต่อ Max decision ต้องสร้างใหม่ทุก transaction attempt
- สามารถ extract helper/share query data กับ Min ได้ถ้าทำให้ behavior เดิมของ Min ไม่เปลี่ยน; ห้าม refactor กว้างเกิน feature

### 4.4 Frontend feature และ route

สร้าง feature แยก:

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

Query key ต้องมีอย่างน้อย:

- `all(userId)`
- `lists(userId)`
- `listsByPositionId(userId, positionId)`
- date-range list key ที่ต่อจาก list-by-position
- `details(userId)`
- `detail(userId, positionId, holidayMaxId)`

หลัง create/update/delete ต้อง invalidate `listsByPositionId(...)` เพื่อ refresh ทุก cached date range ของ Position; update/delete ต้อง invalidate detail ที่เกี่ยวข้องตาม pattern Min/Max

สร้าง route:

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

แก้:

- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/client-page.tsx`
  - เพิ่ม MenuCard ไป `/holiday-max`
  - label/description ต้องสื่อชัดว่าเป็น “จำนวนพนักงานที่หยุดพร้อมกันสูงสุด” เพื่อไม่สับสนกับ Slot Min/Max
- `ecosystem-frontend-next-js/src/constants/error-messages.ts`
  - เพิ่มข้อความ ErrorCode ใหม่ทั้งสอง

Frontend API ต้อง import backend Zod schema/contract ตาม pattern Min/Max ปัจจุบัน

Form behavior:

- `max`: required number, integer, min 0
- `start_time`/`end_time`: `datetime-local` ใน UI และแปลงด้วย Place timezone ก่อนส่ง API
- list แสดง `startTime`, `endTime`, `max`
- edit โหลด detail และแปลงค่ากลับเป็น Place local datetime สำหรับ form
- delete สำเร็จกลับ list

### 4.5 Frontend tests

เพิ่มโดยยึด pattern tests ที่มีอยู่จริง:

```text
ecosystem-frontend-next-js/tests/work-schedule/holiday-max-api.test.tsx
ecosystem-frontend-next-js/tests/work-schedule/holiday-max-cache-invalidation.test.tsx
ecosystem-frontend-next-js/tests/work-schedule/holiday-max-edit-delete.test.tsx
```

ห้ามเพิ่ม browser/E2E framework ใหม่สำหรับงานนี้

## 5. ขั้นตอน Implement และเกณฑ์ผ่าน

### Step 1 — Prisma model + migration

ทำ:

- เพิ่ม `WorkSchedulePosition -> WorkScheduleHolidayMax[]`
- เพิ่ม `WorkScheduleHolidayMax`
- สร้าง migration ใหม่
- Prisma generate/validate

เกณฑ์ผ่าน:

- schema valid และ Prisma Client มี `workScheduleHolidayMax`
- migration มีเฉพาะ table/index/FK ที่เกี่ยวข้อง
- `WorkScheduleMinMax` และ `WorkScheduleHoliday` ไม่ถูกเปลี่ยนความหมาย

### Step 2 — Backend Holiday Max CRUD/query

ทำ:

- สร้าง module/controller/DTO/command/query handlers และ specs
- register `HolidayMaxModule`
- เพิ่ม ErrorCode
- Create/Update lock Position row ก่อน overlap query

เกณฑ์ผ่าน:

- non-admin อ่าน/สร้าง/แก้/ลบไม่ได้
- `max = 0` ผ่าน validation
- negative/decimal/invalid datetime/`end <= start`/invalid UUID ถูก reject
- create overlap ใน Position เดียวกันถูก reject
- adjacent rule ผ่าน
- คนละ Position ใช้ช่วงเดียวกันได้
- update target ต้องอยู่ Position เดียวกันและ exclude ตัวเองจาก overlap
- update/delete/detail ที่ ID อยู่ Position อื่น -> `WORK_SCHEDULE_HOLIDAY_MAX_NOT_FOUND`
- list overlap filter ถูกต้องและ ordering deterministic
- Create/Update specs ยืนยัน Position `FOR UPDATE` เกิดก่อน overlap query ภายใน transaction

### Step 3 — Holiday Max enforcement

ทำ:

- เพิ่ม Holiday Max validation หลัง Min check และก่อน Holiday insert ภายใน transaction เดิม

เกณฑ์ผ่าน:

- validation order เป็น Slot overlap -> Min -> Holiday Max -> insert
- request ที่ผิดทั้ง Min และ Max ต้องยังได้ `WORK_SCHEDULE_HOLIDAY_MIN_STAFF_NOT_ENOUGH`
- ไม่มี applicable rule -> behavior เดิม และไม่ query active-position Staff/Holiday เพิ่มสำหรับ Max
- count หลัง candidate `< max` -> ผ่าน
- count `== max` -> ผ่าน
- count `> max` -> 409 `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` และไม่ insert
- `max = 0` -> candidate ที่ overlap rule ถูก reject
- boundary ที่แตะกันพอดีไม่ถือว่า overlap
- Holiday ซ้อนหลาย record ของ Staff เดียวกันนับ 1 คน
- soft-deleted/non-member/other Place Staff ไม่ถูกนับ
- multi-position: ต้องผ่านทุก Position; เกิน Position เดียว reject candidate ทั้งรายการ
- overage ที่อยู่นอก candidate-rule intersection ไม่ทำให้ fail
- `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` เป็น business `AppException` และไม่ retry
- หลัง `P2034` retry ต้อง query Holiday Max state ใหม่ทั้งหมดและ reject หาก state ใหม่เกิน Max
- FULL_DAY timezone, Slot overlap, Min staffing และ retry behavior เดิมยังผ่าน regression

### Step 4 — Frontend Admin CRUD

ทำ:

- API/query keys/hooks/forms
- list/new/detail routes
- Position menu
- error messages

เกณฑ์ผ่าน:

- Admin เข้า Holiday Max จาก Position ได้
- list filter date/time และแสดง max ถูกต้อง
- create/edit/delete ใช้ endpoint ใหม่และ timezone-correct ISO datetime
- mutation invalidate ทุก list date range ของ Position และไม่ทิ้ง stale detail cache
- access/error redirect ตาม pattern Min/Max ปัจจุบัน
- UI ไม่ทำให้ Holiday Max สับสนกับ Slot Min/Max

### Step 5 — Regression / verification

เกณฑ์ผ่าน:

- backend specs ใหม่ครอบคลุม DTO, authorization, CRUD, overlap/adjacent, Position ownership, lock ordering, timeline boundaries, distinct Staff, multi-position, Max exceeded, validation precedence และ fresh re-evaluation หลัง `P2034`
- Holiday tests เดิมที่เกี่ยวกับ Min, Slot overlap, timezone และ retry ผ่าน
- frontend tests ใหม่และ Min/Max regression ที่เกี่ยวข้องผ่าน
- Prisma validation, typecheck, lint, test และ build ผ่านใน environment ที่มี dependency/config ครบ

## 6. สิ่งที่ Implementor ต้องระวัง

- ห้าม reuse `WorkScheduleMinMax.max`
- ห้ามเพิ่ม Position ลง Holiday record
- ห้ามนับ Holiday record; ต้องนับ distinct Staff ต่อ subinterval
- ห้ามใช้ closed interval
- ห้ามเปลี่ยน validation precedence เดิม: Slot overlap และ Min ต้องมาก่อน Holiday Max
- ห้ามทำ Create/Update Holiday Max overlap check นอก Position lock
- ห้ามถือว่า application-level overlap query ที่ไม่มี lock ป้องกัน concurrent writes ได้
- ห้ามทำให้ business `AppException` เข้า P2034 retry loop
- ห้ามเก็บ rule/active Staff/existing Holiday/derived Map/Set ของ Max ไว้นอก `executeWithRetry` callback หรือ reuse ข้าม retry attempt
- ห้าม query Staff/Holiday จำนวนมากเมื่อไม่มี applicable Holiday Max rule
- ห้ามแก้/ลบ Holiday เก่าเมื่อ Holiday Max rule ถูก create/update/delete
- ห้ามเปลี่ยน `useCreateHoliday` ถ้า flow axios/global error store เดิมรองรับ ErrorCode ใหม่ได้ด้วยการเพิ่ม enum/message เท่านั้น
- ห้าม duplicate frontend contract หาก import backend Zod schema ได้ตาม pattern ปัจจุบัน
- migration ต้องเป็นไฟล์ใหม่ ห้าม rewrite migration เก่า
- ห้ามขยาย scope ไปเปลี่ยน auto-create Slot, Min staffing, Slot Max หรือ access-control อื่น

## 7. Test ที่ต้องเพิ่ม/แก้ และคำสั่งตรวจสอบ

### Backend

อย่างน้อย:

- `holiday-max.dto.spec.ts`
  - max required/integer/non-negative
  - UUID v7
  - offset datetime
  - end > start
- create/update/delete handler specs
  - admin access
  - overlap/adjacent
  - wrong Position/not found
  - `FOR UPDATE` ก่อน overlap check ใน Create/Update
- list/detail query specs
  - admin access
  - overlap filtering
  - deterministic ordering
  - Position ownership
- `holiday/commands/create-holiday.handler.spec.ts`
  - no rule
  - below/equal/exceeded max
  - max=0
  - half-open boundaries
  - duplicate holidays same Staff
  - inactive/other Position/other Place
  - multi-position
  - rule intersection
  - request ผิดทั้ง Min และ Max -> Min error ต้องมาก่อน
  - business `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` ไม่ retry
  - attempt แรกเกิด `P2034` แล้ว state เปลี่ยน -> retry อ่าน Max state ใหม่และ reject ถ้าเกิน
  - regression Min, Slot overlap, FULL_DAY timezone, AppException/P2034 retry

คำสั่งจาก `ecosystem-backend-nest-js` ซึ่งมี scripts ยืนยันใน `package.json`:

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

ถ้ามี DB URL/migration environment:

```bash
pnpm run prisma:migrate:status
```

ตอนสร้าง migration ใน dev environment:

```bash
pnpm exec prisma migrate dev --name add_work_schedule_holiday_max
```

### Frontend

เพิ่ม tests ตามข้อ 4.5 และ regression ของ menu/error handling เท่าที่จำเป็น

คำสั่งจาก `ecosystem-frontend-next-js` ซึ่งมี scripts ยืนยันใน `package.json`:

```bash
pnpm run typecheck
pnpm run lint
pnpm test -- work-schedule/holiday-max
pnpm test
pnpm run build
```

หาก command ใดต้อง database/secret/runtime dependency ที่ environment ไม่มี ให้รายงาน command และเหตุผลจริง ห้ามอ้างว่าผ่าน

## 8. Definition of Done

งานถือว่าผ่านเมื่อครบทั้งหมด:

- มี schema/table ใหม่ `WorkScheduleHolidayMax` แยกจาก `WorkScheduleMinMax`
- Admin เท่านั้นจัดการ/อ่าน Holiday Max config ผ่าน admin flow
- Create/Update config serialize concurrent writes ด้วย Position row lock ตาม pattern ปัจจุบัน
- Staff สร้าง Holiday ได้เมื่อจำนวน distinct Staff ที่หยุดพร้อมกันในทุก active Position ไม่เกิน Max
- เกิน Max -> atomic reject ก่อน insert ด้วย 409 `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED`
- request ที่ผิดทั้ง Min และ Max ยังรักษา Min error precedence เดิม
- exact Max ผ่าน, max=0 ทำงาน, half-open boundary, duplicate Holiday และ multi-position ถูกต้อง
- เมื่อ Serializable transaction retry เพราะ `P2034` ต้อง re-read และ re-evaluate Holiday Max ด้วย state ใหม่ก่อนตัดสิน insert
- Min staffing, Slot Max, Slot/Holiday overlap, timezone และ retry semantics เดิมไม่เปลี่ยน
- การแก้ config ไม่ย้อนแก้หรือลบ Holiday เก่า
- Frontend มี list/create/edit/delete และเมนูจาก Position พร้อม cache invalidation ที่ถูกต้อง
- ErrorCode/backend/frontend message ครบ
- tests, Prisma validation, typecheck, lint และ build ที่ environment รองรับผ่าน
