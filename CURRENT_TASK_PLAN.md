# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

รอบงาน: 2026-10-31

สร้างระบบกำหนด Max ของจำนวนวันหยุดของพนักงาน ตั้งแต่วันที่ ... ถึง วันที่ ... เหมือน minMax ของจำนวน slot โดยผู้ที่จะสามารถมาสร้างและแก้ไขหรือลบ ข้อมูลจำนวนสูงสุดของวันหยุดของพนักงานได้ คือ admin

### คำยืนยันเพิ่มเติมจากผู้ใช้ (ยึดข้อความดั้งเดิม)

หมายถึงจำนวนวันหยุดที่พนักงานลงตรงกันพร้อมกันใน Position นั้นครับ โดยให้สร้าง schema ใหม่เลยครับ มีตรงไหนที่ยังไม่เคลียร์สามารถสอบถามได้เลยนะครับ

## 2. Business Logic และโค้ดที่เกี่ยวข้องก่อนเริ่ม Implement

### 2.1 โครงสร้างข้อมูลปัจจุบัน

จาก `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`:

- `WorkScheduleHoliday` เป็นวันหยุดของ Staff โดยผูกผ่าน `workScheduleStaffId`; record วันหยุดไม่มี `positionId`
- `WorkScheduleStaffPosition` เป็นตารางเชื่อม Staff กับ Position และมี `deletedAt`
- `WorkScheduleStaff` และ `WorkSchedulePosition` มี `deletedAt` และผูกกับ `organizationWorkSchedulePlaceId`
- Staff หนึ่งคนสามารถอยู่ได้หลาย Position ดังนั้นวันหยุดหนึ่งรายการของ Staff เดียวต้องมีผลกับทุก active Position ที่ Staff สังกัดอยู่
- `WorkScheduleMinMax` ผูกกับ Position และมี `min`, `max`, `startTime`, `endTime`; `min`/`max` เดิมเป็น config จำนวนคนที่ปฏิบัติงาน ไม่ใช่จำนวนคนหยุด

โครงสร้างสำคัญที่ยืนยันจาก schema ปัจจุบัน:

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

### 2.2 การสร้าง Holiday ปัจจุบัน

ไฟล์หลัก:

- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.spec.ts`

พฤติกรรมที่ยืนยันจากโค้ดจริง:

1. ตรวจ Staff access ของ Place ด้วย `verifyWorkScheduleStaffAccess`
2. FULL_DAY ใช้ timezone ของ Place แปลง local day เป็น UTC interval; PARTIAL ใช้ datetime จาก request
3. ตรวจ Slot overlap ด้วย half-open overlap (`slot.start < holidayEnd && slot.end > holidayStart`)
4. ตรวจ Min staffing ด้วย `verifyMinimumStaff(...)`
5. ตรวจและ insert Holiday อยู่ใน `Serializable` transaction ผ่าน `executeWithRetry`
6. retry เฉพาะ Prisma transaction conflict `P2034`; ถ้าเป็น `AppException` ต้อง rethrow ทันทีและห้าม retry
7. spec ปัจจุบันมี regression case ที่จำลอง `P2034` หลัง concurrent Holiday เกิดขึ้น แล้วรอบ retry ต้องอ่าน Holiday ใหม่และคำนวณ Min ใหม่จน reject ได้ จึงยืนยันว่า validation ที่ขึ้นกับสถานะ Holiday ต้องอยู่ใน transaction callback และต้องคำนวณใหม่ทุก retry

`verifyMinimumStaff(...)` ปัจจุบันทำสิ่งสำคัญดังนี้:

- หา active Position ของ requester โดยกรอง `WorkScheduleStaffPosition.deletedAt = null`
- กรอง Staff และ Position ให้ `deletedAt = null` และอยู่ใน Place เดียวกัน
- ดึงเฉพาะ `WorkScheduleMinMax` ที่มี `min != null` และ overlap candidate Holiday
- ดึง active Staff ของ Position ที่เกี่ยวข้อง
- ดึง Holiday เดิมของ Staff กลุ่มนั้น
- รวม candidate Holiday เข้าไปก่อนตรวจ
- แบ่ง timeline ตาม boundary ของ Holiday/rule
- ในแต่ละช่วงย่อยใช้ `Set<workScheduleStaffId>` จึงนับ Staff คนเดิมเพียงครั้งเดียวแม้มี Holiday records ซ้อนกัน
- ใช้ half-open interval `[startTime, endTime)`
- reject เมื่อ `positionStaff.size - absentStaff.size < rule.min`

ดังนั้น Holiday Max ใหม่ต้องเดินบน semantics เดียวกันเพื่อไม่ให้ Min และ Max ให้ผลขัดกัน

### 2.3 Min/Max ของ Slot ปัจจุบัน

ไฟล์อ้างอิงหลัก:

- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/min-max.controller.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/update.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/delete.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/queries/get-min-maxs-by-position-id-start-time-end-time.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts`

Business Logic ที่ยืนยัน:

- Create/Update/Delete/Read ของ Min/Max ตรวจ Admin ผ่าน `verifyWorkSchedulePositionByWorkScheduleAdmin`
- DTO ใช้ UUID v7, ISO datetime ที่มี offset และ validate integer/non-negative สำหรับ `min`/`max`
- Config ของ Position เดียวกันไม่ให้ช่วงทับกันด้วยเงื่อนไข `startTime < otherEnd && endTime > otherStart`; ช่วงติดกันพอดีอนุญาต
- **Create และ Update ของ Min/Max ทำ overlap check ภายใน transaction และล็อกแถว Position ก่อนด้วย**:

```ts
await tx.$queryRaw`SELECT id FROM "work_schedule_position" WHERE id = ${param.position_id} FOR UPDATE`;
```

  จุดนี้สำคัญสำหรับ serialize concurrent config writes ของ Position เดียวกัน; Holiday Max ต้องรักษา pattern นี้ ไม่ใช่ตรวจ overlap แบบ read-then-write นอก lock
- Update ตรวจ record ด้วยทั้ง `id` และ `workSchedulePositionId` และ exclude ตัวเองจาก overlap query
- Delete ใช้ `deleteMany({ where: { id, workSchedulePositionId } })` แล้วคืน NOT_FOUND เมื่อ `count === 0`
- List query ใช้ half-open overlap และ `orderBy: [{ startTime: 'asc' }, { endTime: 'asc' }, { id: 'asc' }]`
- `WorkScheduleMinMax.max` ถูก enforce ตอนสร้าง Slot ใน `slot/commands/create-many.handler.ts`; handler ใช้ Serializable transaction + retry และ Position row lock จึงต้องไม่เปลี่ยนความหมายของ `max` เดิม

### 2.4 Frontend pattern ปัจจุบัน

ส่วนที่ยืนยันจากโค้ดจริง:

- feature Min/Max อยู่ที่ `ecosystem-frontend-next-js/src/features/work-schedule/min-max/`
- มี `api/mutations`, `api/queries`, `components`, `hooks`, query-key factory และ query options
- query-key factory มี prefix ระดับ list-by-position เพื่อ invalidate ทุก date range ของ Position
- หน้า Position Admin ที่ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/client-page.tsx` มี MenuCard ไป `/min-max`
- Frontend import `ErrorCode` จาก backend และ `API_ERROR_MESSAGES` อยู่ที่ `ecosystem-frontend-next-js/src/constants/error-messages.ts`
- tests ที่มีอยู่จริงและใช้เป็น pattern ได้แก่:
  - `ecosystem-frontend-next-js/tests/work-schedule/min-max-api.test.tsx`
  - `ecosystem-frontend-next-js/tests/work-schedule/min-max-cache-invalidation.test.tsx`
  - `ecosystem-frontend-next-js/tests/work-schedule/min-max-edit-delete.test.tsx`

### 2.5 ข้อจำกัดที่ต้องรักษา

- ห้าม reuse `WorkScheduleMinMax.max` เป็น Max วันหยุด เพราะจะเปลี่ยนความหมายของ Slot Max
- ห้ามเพิ่ม `positionId` ลง `WorkScheduleHoliday`; Holiday เป็นของ Staff และ Staff อาจอยู่หลาย Position
- ห้ามเปลี่ยน Min staffing, Slot Max, Slot/Holiday overlap, FULL_DAY timezone conversion, PARTIAL interval, retry semantics หรือการลบ Holiday เดิมโดยไม่จำเป็น
- ห้ามเปลี่ยน overlap semantics จาก half-open เป็น closed interval

## 3. Business Logic ที่คาดหวังหลัง Implement

### 3.1 Domain ใหม่: `WorkScheduleHolidayMax`

สร้าง schema/model ใหม่แยกจาก `WorkScheduleMinMax` ตามคำยืนยันของผู้ใช้

แต่ละ rule ประกอบด้วย:

- Position ที่ rule ใช้
- `max`: จำนวน **distinct Staff ที่มี Holiday พร้อมกันสูงสุด** ใน Position นั้น
- `startTime`, `endTime`: ช่วงที่ rule มีผล

`max` ต้องเป็น integer `>= 0`; `max = 0` ถูกต้องและหมายถึงห้ามมี Staff ใน Position นั้นหยุดในช่วง rule

เหตุผลที่นับ distinct Staff ไม่ใช่ Holiday record:

- requirement คือจำนวน “พนักงาน” ที่หยุดตรงกันพร้อมกัน
- Holiday ของ Staff คนเดียวอาจมีหลาย record ซ้อนกัน
- Min logic ปัจจุบันก็นับ Staff ผ่าน `Set<workScheduleStaffId>` อยู่แล้ว

### 3.2 Scope ต่อ Position

เมื่อสร้าง Holiday ใหม่:

1. หา active Position ทั้งหมดของ requester ใน Place เดียวกัน โดยใช้ filter แบบเดียวกับ Min ปัจจุบัน (`WorkScheduleStaffPosition.deletedAt`, `WorkScheduleStaff.deletedAt`, `WorkSchedulePosition.deletedAt` เป็น `null` และอยู่ Place เดียวกัน)
2. ถ้าไม่มี active Position ให้ข้าม Holiday Max check และคง behavior ปัจจุบัน
3. ดึง Holiday Max rules เฉพาะ Position เหล่านั้นและเฉพาะ rule ที่ overlap candidate Holiday
4. Staff ที่อยู่หลาย Position ต้องถูกตรวจแยกทุก Position; candidate เดียวกันนับ 1 คนในแต่ละ Position ที่ requester สังกัดอยู่
5. Staff ที่ไม่ active ใน Position, soft-delete, หรืออยู่อีก Place ห้ามถูกนับ

### 3.3 Algorithm ตรวจ Max

สำหรับแต่ละ applicable rule:

1. คำนวณ intersection:
   - `checkStart = max(candidate.start, rule.startTime)`
   - `checkEnd = min(candidate.end, rule.endTime)`
2. หา active Staff links ของ Position นั้น
3. ดึง Holiday เดิมของ Staff กลุ่มนั้นที่ overlap candidate/intersection
4. รวม candidate Holiday `{ workScheduleStaffId: requesterStaffId, startTime, endTime }`
5. filter เฉพาะ Holiday ของ Staff ใน Position และ overlap `[checkStart, checkEnd)`
6. สร้าง boundary set จาก `checkStart`, `checkEnd` และ start/end ของ Holiday ที่ clip เข้า intersection
7. sort boundary และตรวจทุกช่วง `[times[i], times[i + 1])` ที่มี duration > 0
8. สร้าง `Set<workScheduleStaffId>` ของ Holiday ที่ overlap ช่วงย่อยนั้น
9. ถ้า `absentStaff.size > rule.max` ให้ throw `AppException` ด้วย `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED`, HTTP 409 ก่อน insert
10. ถ้า `absentStaff.size <= rule.max` ให้ผ่าน

ต้องตรวจทุก subinterval เพราะจำนวนคนหยุดอาจเปลี่ยนกลาง candidate interval

**Concurrency / retry invariant:** ข้อมูลที่ใช้ตัดสิน Holiday Max ได้แก่ active Position, applicable Holiday Max rules, active Staff links และ Holiday เดิม ต้องถูก query/สร้างชุดข้อมูลภายใน callback ที่ส่งเข้า `executeWithRetry` และคำนวณใหม่ทุกครั้งที่ transaction ถูก retry ห้าม cache/reuse array, `Map` หรือ `Set` จาก transaction attempt ที่เกิด `P2034` เพราะ concurrent Holiday อาจถูก commit ระหว่าง attempts และทำให้ผล Max เปลี่ยนไป

ตัวอย่าง acceptance ที่ต้องรองรับ: attempt แรกอ่านว่าจำนวนคนหยุดยังไม่เกิน Max แต่ transaction จบด้วย `P2034`; ก่อน attempt ถัดไปมี Holiday ของ Staff คนอื่นถูก commit แล้ว เมื่อ retry ต้องอ่านข้อมูลใหม่ คำนวณ `absentStaff` ใหม่ และถ้าจำนวนหลังรวม candidate เกิน Max ต้อง throw `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` โดยไม่ insert candidate สำเร็จ

### 3.4 Boundary semantics

ใช้ half-open `[startTime, endTime)` ทั้งหมด:

- overlap เมื่อ `a.start < b.end && a.end > b.start`
- Holiday ที่จบตรง candidate/rule start ไม่ถูกนับ
- Holiday ที่เริ่มตรง candidate/rule end ไม่ถูกนับ
- adjacent rules (`old.end == new.start`) อนุญาต

### 3.5 CRUD ของ Holiday Max

- Create/Update/Delete/Read ต้องผ่าน `verifyWorkSchedulePositionByWorkScheduleAdmin`
- DTO:
  - `position_id`: UUID v7
  - `holiday_max_id`: UUID v7 เมื่อ endpoint ต้องใช้
  - `max`: required integer `>= 0`
  - `start_time`, `end_time`: ISO 8601 string ที่มี offset
  - `end_time > start_time`
- Position เดียวกันห้ามมี Holiday Max rules ทับกัน
- **Create/Update ต้องทำใน transaction และล็อก `work_schedule_position` ด้วย `FOR UPDATE` ก่อน query overlap** โดยใช้ pattern เดียวกับ Min/Max เพื่อ serialize concurrent writes
- Create overlap query: same Position + `startTime < body.end_time` + `endTime > body.start_time`
- Update:
  - lock Position ก่อน
  - ตรวจ target ด้วยทั้ง `id` และ `workSchedulePositionId`
  - ถ้าไม่พบ -> `WORK_SCHEDULE_HOLIDAY_MAX_NOT_FOUND`
  - overlap query ต้อง `id: { not: holiday_max_id }`
- Delete: ผูกทั้ง `holiday_max_id` และ `position_id`; ใช้ delete semantics ที่ไม่สามารถลบ record ของ Position อื่นได้; count 0 -> NOT_FOUND
- List: รับ `start_time`/`end_time`, คืนเฉพาะ overlap rules, เรียง `startTime`, `endTime`, `id`
- Detail: ต้องตรวจ Position ownership
- การ create/update/delete rule ไม่แก้หรือลบ Holiday เก่า และไม่ทำ retroactive rewrite; rule เป็น constraint สำหรับการสร้าง Holiday หลังจาก config มีผล เช่นเดียวกับแนว config ปัจจุบัน

### 3.6 Error handling

เพิ่มอย่างน้อย:

- `WORK_SCHEDULE_HOLIDAY_MAX_NOT_FOUND`
- `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED`

`WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` ต้องเป็น `AppException(..., HttpStatus.CONFLICT)` เพื่อให้ `CreateHolidayHandler.executeWithRetry` rethrow ทันที ไม่ retry เป็น transaction conflict

Overlap ของ Holiday Max config ให้เดินตาม Min/Max pattern ปัจจุบัน (`BadRequestException`) เพื่อไม่เพิ่ม ErrorCode นอก scope โดยไม่จำเป็น

Frontend `API_ERROR_MESSAGES` ต้องเพิ่มข้อความสำหรับ ErrorCode ใหม่ทั้งสองรายการ

## 4. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### 4.1 Prisma / Migration

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

เพิ่ม migration ใหม่:

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

Controller endpoints ให้ mirror Min/Max แต่ใช้ namespace ใหม่:

- `POST /api/work-schedule/holiday-max/:position_id`
- `PATCH /api/work-schedule/holiday-max/positions/:position_id/holiday-maxs/:holiday_max_id`
- `DELETE /api/work-schedule/holiday-max/positions/:position_id/holiday-maxs/:holiday_max_id`
- `GET /api/work-schedule/holiday-max/by-position-id-start-time-end-time/:position_id?start_time=...&end_time=...`
- `GET /api/work-schedule/holiday-max/positions/:position_id/holiday-maxs/:holiday_max_id`

แก้:

- `ecosystem-backend-nest-js/src/modules/work-schedule/work-schedule.module.ts` — import/register `HolidayMaxModule`
- `ecosystem-backend-nest-js/src/common/exceptions/error-codes.enum.ts` — เพิ่ม ErrorCode ใหม่

### 4.3 Enforce ใน Holiday create

แก้:

- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.spec.ts`

ข้อกำหนด implementation:

- Holiday Max validation ต้องอยู่ **ภายใน Serializable transaction เดิมและก่อน `workScheduleHoliday.create`**
- คง slot-overlap และ `verifyMinimumStaff` semantics เดิม
- สามารถ extract helper/แชร์ active-position data ระหว่าง Min และ Max ได้ แต่ output/behavior ของ Min ห้ามเปลี่ยน
- query Holiday Max rules ก่อน; ถ้าไม่มี applicable rule ให้ return โดยไม่ query active position staff/holidays เพิ่มสำหรับ Max
- dedupe Position IDs, Staff IDs และ absent Staff IDs
- candidate ต้องถูกตรวจทุก Position และทุก applicable rule
- business conflict ต้อง throw `AppException`, ห้ามถูก retry
- ทุก query/ข้อมูล intermediate ที่มีผลต่อ Holiday Max decision ต้องอยู่ใน transaction callback; เมื่อเกิด `P2034` รอบ retry ต้อง query rule/link/Holiday ใหม่และคำนวณ Max ใหม่ ห้าม reuse state จาก attempt ก่อนหน้า

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
- `details(userId)` / `detail(userId, positionId, holidayMaxId)`

หลัง create/update/delete ต้อง invalidate prefix `listsByPositionId(...)` เพื่อให้ทุก cached date range ของ Position refresh; update/delete ต้องจัดการ detail cache ไม่ให้ค้างตาม pattern Min/Max

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

- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/client-page.tsx` — เพิ่ม MenuCard ไป `/holiday-max` พร้อมข้อความที่ระบุชัดว่า “จำนวนพนักงานที่หยุดพร้อมกันสูงสุด”
- `ecosystem-frontend-next-js/src/constants/error-messages.ts` — เพิ่มข้อความ ErrorCode ใหม่

Frontend API ต้อง import Zod schema/contract จาก backend holiday-max DTO ตาม pattern Min/Max ปัจจุบัน

Form behavior:

- `max`: required number, integer, min 0
- `start_time`/`end_time`: `datetime-local` ใน UI แต่แปลงด้วย timezone ของ Place ก่อนส่ง API ตาม pattern Min/Max
- list แสดง `startTime`, `endTime`, `max`
- edit โหลด detail แล้ว fill ค่าเดิมใน Place timezone
- delete success กลับ list

### 4.5 Frontend tests

เพิ่มโดยยึดไฟล์ Min/Max ที่มีอยู่จริง:

```text
ecosystem-frontend-next-js/tests/work-schedule/holiday-max-api.test.tsx
ecosystem-frontend-next-js/tests/work-schedule/holiday-max-cache-invalidation.test.tsx
ecosystem-frontend-next-js/tests/work-schedule/holiday-max-edit-delete.test.tsx
```

ไม่เพิ่ม browser/E2E framework ใหม่

## 5. ขั้นตอน Implement และเกณฑ์ผ่าน

### Step 1 — Prisma model + migration

ทำ:

- เพิ่ม relation `WorkSchedulePosition -> WorkScheduleHolidayMax[]`
- เพิ่ม model ใหม่
- generate migration ใหม่
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
- `max = 0` ผ่าน
- negative/decimal/invalid datetime/`end <= start`/invalid UUID ถูก reject
- create overlap ใน Position เดียวกันถูก reject; adjacent ผ่าน; คนละ Position ใช้ช่วงเดียวกันได้
- update target ต้องอยู่ Position เดียวกันและ exclude ตัวเองจาก overlap
- update/delete/detail ที่ ID อยู่ Position อื่น -> `WORK_SCHEDULE_HOLIDAY_MAX_NOT_FOUND`
- list overlap filter และ ordering deterministic
- handler specs ยืนยันว่า Create/Update เรียก Position `FOR UPDATE` ภายใน transaction ก่อน overlap query เพื่อรักษา concurrency invariant

### Step 3 — Holiday Max enforcement

ทำ:

- เพิ่ม Max validation ก่อน insert Holiday ภายใน transaction เดิม

เกณฑ์ผ่าน:

- ไม่มี applicable rule -> behavior เดิม และไม่ query Staff/Holiday เพิ่มสำหรับ Max
- count หลัง candidate `< max` -> ผ่าน
- count `== max` -> ผ่าน
- count `> max` -> 409 `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` และไม่ insert
- `max = 0` -> candidate ที่ overlap ถูก reject
- boundary ที่แตะกันพอดีไม่ถูกนับ overlap
- Holiday ซ้อนหลาย record ของ Staff เดียวกันนับ 1 คน
- soft-deleted/non-member/other Place Staff ไม่ถูกนับ
- multi-position: ต้องผ่านทุก Position; เกิน Position เดียวก็ reject ทั้ง candidate
- overage ที่อยู่นอก candidate-rule intersection ไม่ทำให้ fail
- ถ้า attempt แรกเกิด `P2034` แล้วก่อน retry มี concurrent Holiday ใหม่ รอบ retry ต้องอ่าน Holiday/กฎ/สมาชิก Position ใหม่ คำนวณ Max ใหม่ และ reject ด้วย `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` หากเกิน; ต้องไม่ใช้ผลคำนวณจาก attempt เดิม
- FULL_DAY timezone, slot overlap, Min staffing และ Serializable/P2034 retry behavior เดิมยังเหมือนเดิม

### Step 4 — Frontend Admin CRUD

ทำ:

- API/query keys/hooks/forms
- list/new/detail routes
- Position menu
- error messages

เกณฑ์ผ่าน:

- Admin เข้า Holiday Max จาก Position ได้
- list filter date/time และแสดง max ถูกต้อง
- create/edit/delete ส่ง endpoint ใหม่และ timezone-correct ISO datetime
- mutation invalidate ทุก list date range ของ Position และไม่ทิ้ง stale detail cache
- access/error redirect ตาม pattern ปัจจุบัน
- UI ไม่ทำให้ Holiday Max สับสนกับ Slot Min/Max

### Step 5 — Regression / verification

เกณฑ์ผ่าน:

- backend specs ใหม่ครอบคลุม DTO, CRUD, authorization, overlap/adjacent, Position ownership, lock ordering, timeline boundaries, distinct Staff, multi-position, exceeded Max และ fresh re-evaluation หลัง `P2034`
- Holiday tests เดิม รวม Min/slot-overlap/retry ยังผ่าน
- frontend tests ใหม่และ Min/Max regression ที่เกี่ยวข้องผ่าน
- typecheck/lint/build ผ่านใน environment ที่มี dependency/config ครบ

## 6. สิ่งที่ Implementor ต้องระวัง

- ห้าม reuse `WorkScheduleMinMax.max` หรือแก้ความหมาย Slot Max
- ห้ามเพิ่ม Position ลง Holiday record
- ห้ามนับจำนวน Holiday records; ต้องนับ distinct Staff ต่อ subinterval
- ห้ามใช้ closed interval
- ห้ามทำ Create/Update Holiday Max overlap check นอก Position lock เพราะ concurrent request อาจสร้างช่วงทับกันได้
- ห้ามถือว่า application-level overlap query เพียงอย่างเดียวป้องกัน race ได้
- ห้ามทำให้ business `AppException` เข้า P2034 retry loop
- ห้ามคำนวณ/เก็บ Holiday Max rule, active Staff หรือ existing Holiday ที่ใช้ตัดสินผลไว้นอก `executeWithRetry` callback หรือ reuse ข้าม retry attempt; `P2034` ต้องทำให้ข้อมูลเหล่านี้ถูกอ่านใหม่ทั้งหมด
- ห้าม query Staff/Holiday จำนวนมากเมื่อไม่มี applicable Holiday Max rule
- ห้ามแก้/ลบ Holiday เก่าเมื่อ rule ถูก create/update/delete
- ห้ามเปลี่ยน `useCreateHoliday` ถ้า flow axios/global error store เดิมรองรับ ErrorCode ใหม่ได้; ให้เพิ่ม ErrorCode/message ก่อน
- ห้าม duplicate frontend contract ถ้า import backend Zod schema ได้ตาม pattern ปัจจุบัน
- migration ต้องเป็นไฟล์ใหม่ ห้าม rewrite migration เก่า
- ห้ามขยาย scope ไปเปลี่ยน auto-create Slot, Min staffing, Slot Max หรือ access-control อื่น

## 7. Test ที่ต้องเพิ่ม/แก้ และคำสั่งตรวจสอบ

### Backend

อย่างน้อย:

- `holiday-max.dto.spec.ts`
  - max integer/non-negative/required
  - UUID v7
  - offset datetime
  - end > start
- create/update/delete handler specs
  - admin access
  - overlap/adjacent
  - wrong Position/not found
  - `FOR UPDATE` ก่อน overlap check ใน Create/Update transaction
- list/detail query specs
  - admin access
  - overlap filtering
  - deterministic ordering
  - Position ownership
- `holiday/commands/create-holiday.handler.spec.ts`
  - no rule
  - below/equal/exceeded max
  - max=0
  - boundaries
  - duplicate holidays same Staff
  - inactive/other Position/other Place
  - multi-position
  - rule intersection
  - business `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED` เป็น `AppException` แล้วไม่ retry
  - จำลอง attempt แรกเกิด `P2034` หลังมี concurrent Holiday; retry ต้อง query Holiday Max state ใหม่และ reject หากจำนวนใหม่เกิน Max
  - regression Min, Slot overlap, FULL_DAY timezone, AppException/P2034 retry

คำสั่งจาก `ecosystem-backend-nest-js` (ยืนยันว่ามี scripts เหล่านี้ใน `package.json`):

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

คำสั่งจาก `ecosystem-frontend-next-js` (ยืนยัน scripts จาก `package.json`):

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
- Create/Update config serialize ด้วย Position row lock และไม่เกิด overlapping rules จาก concurrent writes ตาม application pattern ปัจจุบัน
- Staff สร้าง Holiday ได้เมื่อจำนวน distinct Staff ที่หยุดพร้อมกันในทุก active Position ไม่เกิน Max
- เกิน Max -> atomic reject ก่อน insert ด้วย 409 `WORK_SCHEDULE_HOLIDAY_MAX_EXCEEDED`
- exact Max ผ่าน, max=0 ทำงาน, half-open boundary, duplicate Holiday และ multi-position ถูกต้อง
- เมื่อ Serializable transaction retry เพราะ `P2034` ต้อง re-read และ re-evaluate Holiday Max ด้วย state ใหม่ก่อนตัดสิน insert
- Min staffing, Slot Max, Slot/Holiday overlap, timezone และ retry semantics เดิมไม่เปลี่ยน
- Frontend มี list/create/edit/delete และเมนูจาก Position พร้อม cache invalidation ที่ถูกต้อง
- ErrorCode/backend/frontend message ครบ
- tests, Prisma validation, typecheck, lint และ build ที่ environment รองรับผ่าน