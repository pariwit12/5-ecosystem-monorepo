# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ต้องการสร้างระบบสำหรับจัดตารางเวรอัตโนมัติโดยเป็น feature ใหม่ ของ admin โดยให้เลือกช่วงเวลาเริ่มต้นและสิ้นที่จะจัดเวรอัตโนมัติ และต้องมีให้เลือกว่าจะเลือก Template แบบไหนที่จะนำมาจัดเวรบ้างครับ โดยห้าม Template ที่เวลาทับซ้อนกันสำหรับ Version นี้ครับ แล้วก็ให้เลือกว่าจะเลือกพนักงานคนไหนที่จะนำมาจัดตารางเวรครับ แล้วก็การลงข้อมูลสำหรับ Version แรกนี้ ให้ลงพนักงานที่ลงได้ไล่ตาม ID ได้เลย โดยให้ลงให้ถึงจำนวนขั้นต่ำสำหรับแต่ละช่วงเวลา

## 2. ขอบเขตของ Version นี้

- เป็น feature ใหม่สำหรับ Admin ของ Work Schedule ภายใต้ Position เดิม
- เพิ่มวิธีสร้าง Slot แบบอัตโนมัติ โดยไม่เปลี่ยน behavior ของการสร้าง Slot แบบ manual หรือแบบใช้ Template ที่มีอยู่
- Admin ต้องเลือก:
  - ช่วงเวลา `start_time` ถึง `end_time` ที่ต้องการให้ระบบจัดเวร
  - Slot Template อย่างน้อย 1 รายการ
  - พนักงานของ Position อย่างน้อย 1 คน
- Version นี้ใช้กติกา deterministic แบบง่ายตามไอเดียต้นฉบับ: เมื่อจำเป็นต้องเพิ่มพนักงาน ให้พิจารณา `staffId` จากน้อยไปมาก และเลือกคนแรกที่ลง occurrence นั้นได้
- Version นี้ไม่ทำ optimization, balancing, randomization, rotation, fairness ตามจำนวนเวรย้อนหลัง หรือ backtracking เพื่อหาชุดคำตอบที่ดีที่สุด
- Template ไม่มี recurrence/weekday field ใน schema ปัจจุบัน ดังนั้น selected Template เป็น candidate ของทุก local calendar day ที่เกี่ยวข้องกับช่วง request
- ช่วงเวลาทั้งหมดใช้ half-open interval `[start, end)` เหมือน Slot/Holiday/MinMax logic ที่มีอยู่: ปลายของรายการหนึ่งเท่ากับต้นของอีกรายการถือว่าไม่ทับกัน
- Backend เป็น source of truth ของ scheduling plan ทั้งหมด Frontend มีหน้าที่เลือก input, validate local datetime ที่ผู้ใช้กรอก และส่ง request เท่านั้น
- ห้าม Frontend generate final Slot list, คำนวณ Min/Max, เลือก Staff หรือทำ availability preflight แล้วถือเป็น business authority
- ไม่เพิ่ม arbitrary maximum scheduling range ใน Version นี้ เพราะ requirement ปัจจุบันไม่ได้กำหนดเพดานดังกล่าว
- ไม่เพิ่ม/แก้ Prisma model และไม่ต้องมี migration สำหรับ feature นี้

## 3. Business Logic และโค้ดที่เกี่ยวข้องก่อนเริ่ม

### 3.1 Manual Slot CreateMany ปัจจุบัน

ไฟล์ที่ตรวจจาก `main`:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.spec.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.module.ts`

Behavior ที่ต้องใช้เป็น baseline:

- Param `position_id` ใช้ UUID v7
- Slot datetime ใช้ ISO 8601 string ที่มี explicit offset
- handler authorize ด้วย `verifyWorkSchedulePositionByWorkScheduleAdmin()` ก่อน mutation
- Manual CreateMany ตรวจ incoming overlap ของ Staff คนเดียวกันก่อน transaction
- Manual CreateMany ตรวจ active `WorkScheduleStaffPosition` ก่อน transaction
- transaction ใช้ `Prisma.TransactionIsolationLevel.Serializable`
- transaction lock Position ด้วย `SELECT id FROM "work_schedule_position" ... FOR UPDATE`
- query existing Slot ใช้ half-open overlap และรวม:
  - Slot ของ selected Staff จากทุก Position เพื่อเช็ก staff conflict
  - Slot ของ target Position เพื่อเช็ก Max
- query Holiday ของ selected Staff และใช้ half-open overlap
- query `WorkScheduleMinMax` ที่มี `max` เพื่อ validate concurrency
- insert ด้วย `createMany` หลัง validation ผ่าน
- retry เฉพาะ Prisma serialization conflict `P2034`
- request เป็น all-or-nothing

Auto Create ต้องใช้ transaction/lock/retry style นี้เป็น baseline แต่ต่างจาก Manual CreateMany ตรงที่ข้อมูลซึ่งเป็น input ของ planner เช่น Template, SlotType, StaffPosition, Position/Place ต้องถูกอ่านใหม่ภายใน transaction ทุก retry attempt ห้ามวางแผนนอก transaction แล้ว reuse plan เดิม

ห้ามแก้ behavior ของ Manual CreateMany ใน task นี้

### 3.2 Min/Max ปัจจุบัน

ไฟล์ที่ตรวจ:

- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/update.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`

ข้อเท็จจริงจากโค้ด:

- `WorkScheduleMinMax` มี `startTime`, `endTime`, `min`, `max` ต่อ Position
- DTO บังคับอย่างน้อย `min` หรือ `max`
- ถ้ามีทั้งคู่ต้อง `min <= max`
- `min`/`max` เป็น integer และต้อง `>= 0`
- Create/Update MinMax lock Position และห้าม MinMax ของ Position เดียวกัน overlap กันด้วย half-open predicate
- Manual Slot flow ใช้ `max` เป็นข้อจำกัด concurrency ของ Slot
- ยังไม่มี flow ที่สร้าง Slot อัตโนมัติเพื่อเติม `min`
- Holiday creation ใช้ `verifyMinimumStaff()` ซึ่งนับ active StaffPosition/Staff ของ Position แล้วหัก Staff ที่มี Holiday overlap; logic นี้ไม่ได้ใช้จำนวน `WorkScheduleSlot` เป็น coverage ของ Min
- Holiday creation ตรวจ Slot overlap ของผู้ขอวันหยุดภายใน Serializable transaction และ retry `P2034`

สำหรับ Auto Create ให้ตีความ `min` เป็น target จำนวน concurrent `WorkScheduleSlot` ของ target Position ในช่วง rule นั้น ตาม requirement “ลงให้ถึงจำนวนขั้นต่ำสำหรับแต่ละช่วงเวลา”:

- Slot เดิมของ target Position ทุก Staff นับเป็น coverage ก่อน
- Auto สร้างเฉพาะ deficit ที่ขาด
- `min = 0`, `min = null`, ไม่มี Min rule หรือช่วงที่ถึง Min อยู่แล้ว ไม่ต้องสร้างเพิ่ม
- semantic นี้ใช้เฉพาะ Auto planner
- ห้ามเปลี่ยน Holiday/MinMax CRUD semantics เดิม
- ห้ามแก้ `CreateHolidayHandler.verifyMinimumStaff()` ให้เปลี่ยนไปนับ Slot ใน task นี้

### 3.3 Slot Template / Slot Type ปัจจุบัน

ไฟล์ที่ตรวจ:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/commands/create.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/commands/create.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/queries/get-slot-templates-by-position-id.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-type/queries/get-slot-types-by-position-id.handler.ts`
- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`

ข้อเท็จจริง:

- Template มี `workSchedulePositionId`, `slotTypeId`, `startTime`, `durationMinute`
- `startTime` ตอน create ถูก validate รูปแบบ `HH:mm`
- `durationMinute` ตอน create เป็น integer และ `>= 1`
- Template ไม่มี soft-delete field และไม่มี weekday/recurrence field
- Template create handler เขียน `slotTypeId` ลงตรง ๆ และไม่ได้ validate ว่า Slot Type อยู่ Position เดียวกันหรือ active
- Slot Type มี `positionId` และ `deletedAt`
- Slot Type list query ปัจจุบันกรอง `deletedAt = null`
- Template list query สำหรับ Position คืน `id` และ `name` และเรียง `id` ascending

ดังนั้น Auto Create ต้องป้องกันตัวเองภายใน transaction:

- selected Template ทุกตัวต้องอยู่ target Position
- related Slot Type ของ Template ต้องอยู่ target Position และ `deletedAt = null`
- Template `startTime` ที่อ่านจาก DB ต้องตรง `HH:mm` จริง
- `durationMinute` ที่อ่านจาก DB ต้องเป็น integer และ `>= 1`
- legacy/malformed data ต้อง reject request ห้าม normalize หรือเดาค่าแทน

ห้ามขยาย scope ไปแก้ Template CRUD หรือ Slot Type CRUD ใน task นี้

### 3.4 StaffPosition / Staff availability ปัจจุบัน

ไฟล์ที่ตรวจ:

- `ecosystem-backend-nest-js/src/modules/work-schedule/staff-position/queries/get-staff-positions-by-position-id.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`

ข้อเท็จจริง:

- Staff ที่ใช้ใน Manual Slot flow ต้องมี `WorkScheduleStaffPosition` ของ Position และ `deletedAt = null`
- StaffPosition list query กรอง `WorkScheduleStaffPosition.deletedAt = null` และเรียง `workScheduleStaffId` ascending
- StaffPosition list query ไม่ได้เพิ่ม filter `WorkScheduleStaff.deletedAt`
- Manual CreateMany เช็ก Staff Slot conflict ข้าม Position
- Holiday ที่ overlap ช่วง Slot ทำให้ Staff คนนั้นใช้ไม่ได้

Auto Create ต้องยึด active `WorkScheduleStaffPosition` เป็น eligibility baseline เช่นเดียวกับ Manual Slot flow และห้ามเพิ่ม Staff soft-delete/cross-Place business rule ใหม่โดยพลการใน V1

Staff candidate order ต้อง sort `staffId` ascending ใน backend เสมอ ห้ามเชื่อลำดับจาก request หรือ implicit Prisma row order

### 3.5 Authorization / Place / timezone / schema ปัจจุบัน

ไฟล์ที่ตรวจ:

- `ecosystem-backend-nest-js/src/common/access-control/access-control.service.ts`
- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`
- `ecosystem-backend-nest-js/package.json`

`verifyWorkSchedulePositionByWorkScheduleAdmin(clerkId, positionId)` ปัจจุบันตรวจ:

- Position มีอยู่
- Position ยังไม่ soft-delete
- Place ของ Position ยังไม่ soft-delete
- caller มี active `WorkScheduleAdmin` ของ Place

Schema ยืนยันว่า:

- Place มี `timezone`
- Position และ Place มี `deletedAt`
- Slot/Holiday/MinMax ใช้ `Timestamptz`
- Template ไม่มี recurrence field

Backend และ Frontend มี Luxon `3.7.2` จึงใช้ `DateTime`, `IANAZone` และ `DateTime#getPossibleOffsets()` ได้

Authorization ยังทำก่อน transaction ตาม pattern เดิม แต่ Auto planner ต้อง lock แล้ว re-read Position + Place ใน transaction เพื่อให้ timezone/state ที่ใช้คำนวณ plan มาจาก snapshot เดียวกับ planning data

### 3.6 Frontend ปัจจุบัน

ไฟล์ที่ตรวจ:

- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/menu/client-page.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/create-many.api.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-create-many.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/create-many-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/components/create-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/staff-position/work-schedule-staff-position.queries.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/place/work-schedule-place.queries.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/place/api/queries/get-work-schedule-place-by-id.api.ts`
- `ecosystem-frontend-next-js/jest.config.mjs`
- `ecosystem-frontend-next-js/package.json`

Pattern ที่ต้องรักษา:

- React Query + Clerk token
- frontend API layer import Zod schema จาก backend แล้ว `safeParse` ก่อนส่ง request
- Slot mutation hook invalidate `workScheduleSlotKeys.listsByPositionId(userId, positionId)` หลัง success
- Place detail query คืน `timezone`
- StaffPosition query คืน `{ staffId, name }[]`
- Template list queryคืน `{ id, name }[]`
- หน้า `slot/new/client-page.tsx` แสดง pattern การรวมหลาย queries, redirect handling, query error handling และ Place timezone
- `pre-fill/page.tsx` ยืนยัน pattern Server Internal Only + CSR และ `params` เป็น Promise
- `pre-fill` มี `error.tsx`, `loading.tsx`, `error-code-redirect-list.ts` ของตัวเองจริง แต่ Auto route **ไม่ต้องสร้างสำเนาเพิ่ม**: ให้ import parent `slot/new/error.tsx`, `slot/new/loading.tsx`, `slot/new/error-code-redirect-list.ts` ผ่าน `../error`, `../loading`, `../error-code-redirect-list` เพื่อ reuse component/mapping ที่ครอบคลุม Position + Place access errors อยู่แล้ว
- ไม่ต้องเพิ่ม Suspense wrapper เพราะ sibling route ปัจจุบันไม่ได้ใช้
- MinMax form ปัจจุบันแปลง `datetime-local` ด้วย Place timezone แต่ยังไม่ได้ตรวจ ambiguous/nonexistent DST อย่างเข้มงวด; Auto form ต้องเพิ่ม validation นี้เฉพาะ feature ใหม่ ห้ามเปลี่ยน MinMax form ใน task นี้

### 3.7 Test runner / repository verification ปัจจุบัน

ไฟล์ที่ตรวจ:

- `package.json`
- `ecosystem-backend-nest-js/package.json`
- `ecosystem-frontend-next-js/package.json`
- `ecosystem-frontend-next-js/jest.config.mjs`
- `.github/workflows/ci.yml`

ข้อเท็จจริง:

- repository ใช้ `pnpm@11.10.0`
- backend Jest `rootDir` คือ `src` และเก็บ `*.spec.ts`
- frontend test script คือ `jest --runInBand`
- frontend Jest config match เฉพาะ `<rootDir>/tests/**/*.test.ts` และ `tests/**/*.test.tsx`
- root `pnpm run verify` รัน frontend tests, Prisma validate/generate, typecheck, lint, build, backend tests และ migration tests
- GitHub Actions `CI` รัน `pnpm install --frozen-lockfile` แล้ว `pnpm run verify` บน push/PR ที่ `main`

## 4. Business Logic ที่คาดหวังหลัง Implement

### 4.1 API contract

เพิ่ม endpoint:

```text
POST /api/work-schedule/slot/positions/:position_id/auto
```

Param:

```ts
{
  position_id: string; // UUID v7
}
```

Body:

```ts
{
  start_time: string;          // ISO 8601 + explicit offset
  end_time: string;            // ISO 8601 + explicit offset, > start_time
  slot_template_ids: string[]; // UUID v7, min 1, unique
  staff_ids: string[];         // UUID v7, min 1, unique
}
```

Response:

```ts
{
  createdCount: number;
}
```

ให้ export type/interface `AutoCreateResponse` จาก command file เพื่อใช้ type ใน controller และ frontend API ได้โดยไม่สร้าง contract ซ้ำโดยไม่จำเป็น

กติกา:

- ไม่มี Min deficit ที่ต้องเติม => success `{ createdCount: 0 }`
- มี deficit แต่ selected Template/Staff ทำให้ถึง Min ไม่ได้ => reject ทั้ง request
- invalid selected Template/Staff => reject ทั้ง request
- Backend ห้าม silently skip invalid selection

### 4.2 DTO validation

`auto-create.command.ts` ต้องมี Zod schemas + Nest DTO ตาม style ของ `create-many.command.ts`

ต้อง validate:

- `position_id` เป็น UUID v7
- `start_time`/`end_time` เป็น string datetime ที่มี offset
- `end_time > start_time`
- `slot_template_ids` อย่างน้อย 1
- `staff_ids` อย่างน้อย 1
- ทุก ID เป็น UUID v7
- ID ในแต่ละ array ห้ามซ้ำ

DTO validation ห้ามทำ scheduling logic

### 4.3 Authorization + transaction boundary

ลำดับบังคับ:

1. authorize ก่อน transaction ด้วย `verifyWorkSchedulePositionByWorkScheduleAdmin(clerkId, position_id)`
2. เปิด transaction ผ่าน retry helper แบบเดียวกับ Manual CreateMany โดยใช้ Serializable
3. lock target Position ด้วย `SELECT ... FOR UPDATE`
4. หลัง lock re-read Position พร้อม Place ภายใน `tx` และ validate:
   - Position ยังมีอยู่
   - Position `deletedAt === null`
   - Place ยังมีอยู่ผ่าน relation
   - Place `deletedAt === null`
   - `IANAZone.isValidZone(place.timezone) === true`
5. ทุก read ที่ใช้วาง plan ต้องเกิดใหม่ภายใน retry attempt นั้น
6. retry เฉพาะ `P2034`
7. domain validation error/BadRequest/AppException อื่นให้ throw ทันที ห้าม retry

เหตุผล: authorization ก่อน transaction เพียงอย่างเดียวไม่รับประกันว่า state/timezone ที่ใช้ planner จะเป็น snapshot เดียวกับ Slot/Holiday/MinMax ที่ใช้ตัดสินใจ

### 4.4 Validate selected Templates / Slot Types / Staff ภายใน transaction

#### Template + SlotType

อ่าน selected Templates ด้วย `id in slot_template_ids` และ select อย่างน้อย:

- Template `id`
- `workSchedulePositionId`
- `startTime`
- `durationMinute`
- related SlotType `id`, `positionId`, `deletedAt`

Validate:

- จำนวน unique Template ที่พบเท่ากับจำนวน IDs ใน request
- ทุก Template `workSchedulePositionId === position_id`
- `startTime` ตรง regex `^([01]\d|2[0-3]):([0-5]\d)$`
- `Number.isInteger(durationMinute)` และ `durationMinute >= 1`
- SlotType `positionId === position_id`
- SlotType `deletedAt === null`

หากไม่ผ่านข้อใดให้ reject ทั้ง request

#### StaffPosition

อ่าน `WorkScheduleStaffPosition` ใหม่ใน transaction โดย:

- `workSchedulePositionId === position_id`
- `workScheduleStaffId in staff_ids`
- `deletedAt === null`

Validate จำนวน unique Staff ที่พบเท่ากับจำนวน `staff_ids`

จากนั้นสร้าง `staffCandidates` แล้ว sort `staffId` ascending ใน code เองเสมอ

### 4.5 Time model และ overlap semantics

ทุก overlap ใช้สูตรเดียว:

```text
a.start < b.end && a.end > b.start
```

ดังนั้น:

- `a.end === b.start` ไม่ overlap
- `b.end === a.start` ไม่ overlap

หลัง resolve local Template wall time เป็น instant แล้ว การ compare ทั้งหมดใช้ timestamp/instant ไม่ใช้ `HH:mm` string

### 4.6 Generate Template occurrence พร้อม duration lookback

เพราะ Template ไม่มี recurrence field selected Template จึงเป็น candidate ทุก local calendar day

ห้ามเริ่ม generate จาก local date ของ request start อย่างเดียว เพราะ occurrence ของวันก่อนหน้าที่ duration ยาวอาจลากเข้ามาทับ request หรือทับ selected occurrence ภายใน request

สำหรับแต่ละ Template ที่มี duration `D` นาที:

1. parse `requestStart`/`requestEnd` เป็น instants
2. `generationStartInstant = requestStart - D minutes`
3. แปลง `generationStartInstant` ไป Place timezone แล้วใช้ local calendar date เป็นวันเริ่ม generate ของ Template นั้น
4. local date สุดท้ายใช้ local calendar date ของ `requestEnd` ใน Place timezone
5. เดินวันด้วย calendar arithmetic `plus({ days: 1 })` ใน Place timezone ห้ามบวก fixed 24-hour milliseconds
6. ในแต่ละวันประกอบ intended year/month/day/hour/minute จาก local date + Template `startTime`
7. resolve wall time ตามกฎ DST ข้อ 4.7
8. เมื่อได้ start instant ที่แน่นอนแล้ว ให้ `occurrenceEnd = occurrenceStart + durationMinute` แบบ elapsed minutes

แยก occurrence เป็น 2 ชุด:

**Overlap-check set**

```text
occ.start < requestEnd && occ.end > requestStart
```

ใช้ตรวจ selected Template occurrences overlap รวม occurrence ที่เริ่มก่อน request แต่ลากเข้ามา

**Scheduling candidate set**

```text
occ.start >= requestStart && occ.end <= requestEnd
```

เฉพาะชุดนี้เท่านั้นที่อนุญาตให้สร้าง Slot

ผลที่ต้องได้:

- occurrence เริ่มก่อน request แต่ลากเข้ามา: ใช้ตรวจ overlap แต่ห้ามสร้าง Slot
- occurrence จบหลัง request: ห้ามสร้าง Slot
- occurrence แตะ boundary พอดี: ไม่ถือว่า overlap ตาม half-open semantics

### 4.7 DST / ambiguous / nonexistent local wall time

การเช็ก `DateTime.isValid` อย่างเดียวไม่พอ

Backend ต้องใช้กฎนี้ตอน resolve Template wall time:

1. parse `HH:mm` เป็น intended hour/minute
2. สร้าง `DateTime.fromObject({ year, month, day, hour, minute }, { zone: placeTimezone })`
3. object ที่ได้ต้อง `isValid`
4. round-trip `year/month/day/hour/minute` ต้องตรงค่าที่ตั้งใจทุกตัว
   - ถ้า Luxon shift เวลาเพราะ wall time ไม่มีจริง ให้ reject
5. เรียก `getPossibleOffsets()`
   - ต้องได้ exactly 1 possible offset
   - ถ้ามากกว่า 1 ให้ถือว่า ambiguous และ reject
6. เมื่อ start ชัดเจนแล้วจึงบวก elapsed duration เพื่อหา end

Frontend ต้องใช้กฎเดียวกันกับ `datetime-local` ของ `start_time`/`end_time` ก่อนแปลงเป็น ISO:

- Place timezone ต้องเป็น valid IANA zone
- round-trip local components ต้องตรง
- nonexistent local time => block submit
- ambiguous local time => block submit
- valid value => แปลงเป็น ISO string ที่มี explicit offset

เหตุผล: หลัง Frontend ส่ง explicit instant/offset แล้ว Backend ไม่สามารถย้อนรู้ input wall-clock เดิมที่ผู้ใช้พิมพ์ได้ ดังนั้น ambiguity ของ input UI ต้องถูก block ที่ Frontend ขณะที่ Template wall time ซึ่ง Backend สร้างเองต้องถูก validate ที่ Backend

### 4.8 Selected Template occurrences ห้าม overlap

นำ Overlap-check set ของ selected Templates ทั้งหมดมา sort ตาม:

1. start instant ascending
2. end instant ascending
3. template ID ascending

จากนั้นตรวจ adjacent intervals ด้วย half-open rule

ต้อง reject เมื่อพบ overlap รวมถึง:

- คนละ Template
- Template เดียวกันคนละวันแต่ duration ยาวจนซ้อนกัน
- occurrence วันก่อน request ที่ลากเข้ามาทับ occurrence ภายใน request

boundary ที่แตะกันพอดีต้องผ่าน

ห้ามตรวจ overlap จาก `HH:mm` อย่างเดียว

### 4.9 Planning data ที่ต้องอ่านภายใน transaction

หลัง validate selection/occurrences แล้ว อ่านใหม่ภายใน `tx` อย่างน้อย:

- existing Slots ที่ overlap request และเข้าเงื่อนไขอย่างใดอย่างหนึ่ง:
  - `positionId === target position`
  - `staffId in selected staff`
- Holidays ของ selected Staff ที่ overlap request
- MinMax rules ของ target Position ที่ overlap request

ใช้ half-open DB predicates:

```text
start < requestEnd
end > requestStart
```

จาก Slot query เดียวสามารถแยกเป็น:

- `existingPositionSlots` สำหรับ Min/Max coverage
- `existingSelectedStaffSlots` สำหรับ Staff availability ข้ามทุก Position

ทุก retry attempt ต้อง query ใหม่ ห้าม reuse array จาก attempt ก่อน

### 4.10 คำนวณ Min deficit แบบ atomic segments

พิจารณาเฉพาะ MinMax rule ที่ overlap request และ `min !== null`

สำหรับแต่ละ rule:

1. clip rule เป็น intersection กับ request: `[targetStart, targetEnd)`
2. boundaries ประกอบด้วย:
   - target start/end
   - start/end ของ existing Position Slots ที่ตัดผ่าน target โดย clip เข้า target
   - start/end ของ Scheduling candidate occurrences ที่ตัดผ่าน target โดย clip เข้า target
3. sort + deduplicate boundaries
4. พิจารณาทุก atomic segment `[boundary[i], boundary[i+1])`
5. `existingCount` = จำนวน existing Position Slots ที่ overlap segment
6. `deficit = Math.max(0, min - existingCount)`
7. deficit 0 => ไม่ต้องทำอะไร
8. deficit > 0 => ต้องมี Scheduling candidate occurrence ที่ครอบ segment ทั้งก้อน:
   - `occ.start <= segmentStart`
   - `occ.end >= segmentEnd`
9. เนื่องจาก selected occurrences ถูกบังคับไม่ให้ overlap จึงมี candidate ที่ครอบ segment ได้ไม่เกินหนึ่ง occurrence
10. ไม่มี candidate ครอบ deficient segment => reject request ทั้งก้อน
11. ต่อ occurrence ให้ `requiredAdditional` = maximum deficit ของ deficient segments ทั้งหมดที่ occurrence นั้นครอบ
12. occurrence ที่ `requiredAdditional === 0` ไม่สร้าง Slot

ห้าม sum deficits ของหลาย segment ภายใน occurrence เดียว เพราะ Slot ชุดเดียวกันครอบหลาย segmentพร้อมกัน

### 4.11 เลือก Staff ตาม ID แบบ deterministic

ประมวลผล occurrences ที่ `requiredAdditional > 0` ตาม:

1. occurrence start ascending
2. occurrence end ascending
3. template ID ascending

Staff candidates เรียง `staffId` ascending

Staff ใช้ occurrence ได้เมื่อ:

- ผ่าน StaffPosition validation แล้ว
- ไม่มี existing Slot ของ Staff คนนั้นจาก Position ใด ๆ overlap occurrence
- ไม่มี Holiday ของ Staff คนนั้น overlap occurrence
- ไม่มี planned Slot ก่อนหน้าจาก request เดียวกัน overlap occurrence

สำหรับแต่ละ occurrence:

- scan Staff จาก ID ต่ำไปสูง
- ข้ามคนที่ใช้ไม่ได้
- เลือกจนได้ `requiredAdditional`
- ถ้าเลือกไม่ครบ => reject ทั้ง request
- ห้าม fallback ไป Staff ที่ไม่ได้เลือก

planned Slot ต้องใช้:

- `positionId` = target Position
- `staffId` = selected candidate
- `slotTypeId` = SlotType ของ Template occurrence
- `actualStartTime`/`actualEndTime` = resolved occurrence instants

### 4.12 Max validation และ no-op semantics

หลังได้ tentative planned Slots:

#### กรณี plan ว่าง

- return `{ createdCount: 0 }`
- ห้ามเรียก `createMany`
- ไม่ fail เพียงเพราะมี pre-existing Max violation อยู่แล้ว เพราะ request นี้ไม่ได้เพิ่ม Slot

#### กรณีมี planned Slots

สำหรับ Max rule ที่ overlap request และ `max !== null`:

1. clip rule กับ request
2. boundaries = clipped rule start/end + clipped existing Position Slots + clipped planned Slots
3. sort + deduplicate
4. ต่อ atomic segment คำนวณ `existingCount` และ `plannedCount`
5. reject เมื่อ:

```text
plannedCount > 0 && existingCount + plannedCount > max
```

ผลคือ Auto Create:

- ห้ามสร้างหรือเพิ่ม Max violation
- ไม่ทำหน้าที่ repair/validator ที่ block zero-plan เพราะ violation เก่า
- ถ้า Min ต้องการ Slot แต่ Max ทำให้สร้างไม่ได้ => reject request ทั้งก้อน ห้ามลดจำนวนต่ำกว่า Min และห้าม insert บางส่วน

### 4.13 Atomicity / retry

ภายใน retry attempt ต้องทำใหม่ทั้งหมดตามลำดับ:

1. lock Position
2. re-read Position/Place + validate timezone/state
3. re-read Templates/SlotTypes
4. re-read StaffPositions
5. generate/validate occurrences
6. re-read Slot/Holiday/MinMax planning data
7. calculate Min deficits
8. assign Staff
9. validate Max
10. ถ้า plan ว่าง return 0
11. ถ้ามี plan ให้ `tx.workScheduleSlot.createMany()` ครั้งเดียว
12. return `{ createdCount: createManyResult.count }`

ข้อกำหนด:

- ห้าม insert ทีละ occurrence
- ห้าม insert ก่อนรู้ว่าทั้ง request feasible
- `P2034` => retry ด้วย snapshot ใหม่และ re-plan ใหม่ทั้งหมด
- domain validation failure => ไม่ retry
- retry exhausted => fail โดยไม่มี partial result

### 4.14 Frontend behavior หลัง Implement

หน้า Auto Create ต้อง:

- query Template list by Position
- query StaffPosition list by Position
- query Place detail เพื่อ timezone
- ใช้ query/error/redirect pattern ของ `slot/new/client-page.tsx`
- import `ErrorQuery` จาก `../error`
- import `Loading` จาก `../loading`
- import `workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList` จาก `../error-code-redirect-list`
- ไม่สร้าง `auto/error.tsx`, `auto/loading.tsx`, `auto/error-code-redirect-list.ts`
- ถ้า Template list ว่าง: แสดงข้อความให้สร้าง Template ก่อน และห้าม render submit-able form
- ถ้า StaffPosition list ว่าง: แสดงข้อความให้เพิ่ม Staff ก่อน และห้าม render submit-able form
- ถ้าข้อมูลพร้อม: render AutoCreateForm

AutoCreateForm fields:

- `start_time` แบบ `datetime-local`
- `end_time` แบบ `datetime-local`
- Template checkbox/multi-select
- Staff checkbox/multi-select
- submit/cancel

Frontend form schema ต้องเป็น schema สำหรับ UI wall-clock values โดยเฉพาะ ไม่ใช้ backend body schema เป็น form resolver ตรง ๆ เพราะ backend schema ต้องการ ISO datetime ที่มี offset แต่ `datetime-local` ยังไม่มี offset

ก่อน mutation:

1. validate required fields/selections
2. validate `end > start` ใน intended Place timezone
3. validate IANA zone + nonexistent/ambiguous wall times ตามข้อ 4.7
4. แปลง start/end เป็น ISO with explicit offset
5. ส่ง selected Template IDs + Staff IDs ไป Auto API

Success:

- `createdCount > 0`: toast จำนวน Slot ที่สร้าง แล้ว navigate กลับหน้า Slot
- `createdCount === 0`: toast/ข้อความว่าไม่มี Slot ที่ต้องเพิ่ม แล้ว navigate กลับหน้า Slot
- mutation hook invalidate Slot list query key ของ Position

Error:

- อยู่หน้าเดิม
- แสดง error ตาม pattern ปัจจุบัน
- ห้าม optimistic-create Slot list เอง

## 5. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

สัญลักษณ์: `A` = เพิ่ม, `M` = แก้, `-` = ไม่แก้

```text
CURRENT_TASK_PLAN.md                                               -
VERIFICATION_TABLE.md                                              -

ecosystem-backend-nest-js/
└─ src/modules/work-schedule/slot/
   ├─ slot.controller.ts                                           M
   ├─ slot.module.ts                                               M
   └─ commands/
      ├─ auto-create.command.ts                                    A
      ├─ auto-create.command.spec.ts                               A
      ├─ auto-create.handler.ts                                    A
      ├─ auto-create.handler.spec.ts                               A
      ├─ create-many.command.ts                                    -
      └─ create-many.handler.ts                                    -

ecosystem-frontend-next-js/
├─ src/
│  ├─ app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/
│  │  ├─ error.tsx                                                 -
│  │  ├─ loading.tsx                                               -
│  │  ├─ error-code-redirect-list.ts                               -
│  │  ├─ menu/client-page.tsx                                      M
│  │  └─ auto/
│  │     ├─ page.tsx                                               A
│  │     └─ client-page.tsx                                        A
│  └─ features/work-schedule/slot/
│     ├─ api/mutations/auto-create.api.ts                          A
│     ├─ hooks/use-auto-create.ts                                  A
│     └─ components/auto-create-form.tsx                           A
└─ tests/work-schedule/
   └─ auto-create-form.test.tsx                                    A
```

ไม่คาดหวังการแก้:

- Prisma schema / migrations
- Manual CreateMany files
- Holiday CRUD
- MinMax CRUD
- Template CRUD
- Slot Type CRUD
- StaffPosition CRUD
- parent `slot/new/error.tsx`, `loading.tsx`, `error-code-redirect-list.ts`

หาก implementation จำเป็นต้องแก้ไฟล์นอก list เพียงเพื่อ import/type/build ให้แก้เท่าที่จำเป็นและห้ามเปลี่ยน Business Logic อื่น หากพบว่าต้องเปลี่ยน Business Logic ของ module อื่น ให้หยุดและแจ้งผู้ใช้ก่อน

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### 6.1 `slot/commands/auto-create.command.ts` — A

ต้อง export:

- `AutoCreateDtoParamSchema`
- `AutoCreateDtoParam`
- `AutoCreateDtoBodySchema`
- `AutoCreateDtoBody`
- `AutoCreateResponse`
- `AutoCreateCommand`

ใช้ style `createZodDto` + Zod เหมือน command เดิม

Uniqueness ให้ validate ใน schema ด้วย refine/superRefine ห้ามปล่อยไปให้ handler silently deduplicate

### 6.2 `slot/commands/auto-create.command.spec.ts` — A

ต้องทดสอบอย่างน้อย:

- valid payload
- empty Template array
- empty Staff array
- duplicate Template ID
- duplicate Staff ID
- invalid/non-v7 Position ID
- invalid/non-v7 Template ID
- invalid/non-v7 Staff ID
- datetime ไม่มี offset
- `end === start`
- `end < start`

ใช้ UUID v7 fixtures ที่ valid จริง

### 6.3 `slot/commands/auto-create.handler.ts` — A

Dependencies หลัก:

- `PrismaService`
- `AccessControlService`
- Luxon `DateTime`, `IANAZone`

ให้แยก private helpers ตามความเหมาะสมเพื่อไม่ให้ `execute()` กลายเป็นก้อน logic เดียว โดย helpers ต้อง pure เท่าที่ทำได้ เช่น:

- parse/validate Template `HH:mm`
- resolve local wall time + DST ambiguity
- generate occurrence sets
- half-open overlap helper
- build/deduplicate timeline boundaries
- calculate Min requirements
- Max validation

แต่ห้ามแยกออกเป็น service/module ใหม่โดยไม่จำเป็น

Implement ตามลำดับข้อ 4 และต้องรักษา:

- authorization ก่อน tx
- Serializable retry
- Position row lock
- in-transaction Position/Place revalidation
- Template/SlotType/StaffPosition validation
- duration lookback
- DST exact + ambiguous validation
- overlap-check set + scheduling candidate set
- Min atomic segments
- deterministic Staff assignment
- Max touched-segment validation
- no-op return 0
- atomic createMany

ห้าม:

- เรียก HTTP Manual CreateMany จาก backend
- reuse Manual handler ด้วยการสร้าง nested command ที่ทำให้เกิด transaction แยก
- plan นอก transaction แล้วนำ result เข้า transaction
- เชื่อ Prisma row order
- silently skip invalid Template/Staff
- insert ทีละ Slot
- ใช้ system/browser timezone เป็น authority

### 6.4 `slot/commands/auto-create.handler.spec.ts` — A

ใช้ mocked Prisma ตาม convention ของ `create-many.handler.spec.ts`; ห้ามต่อ database จริง

ต้อง cover อย่างน้อย:

#### Authorization / transaction / invariants

1. authorize target Position
2. Serializable transaction ถูกใช้
3. Position row lock ถูกเรียก
4. Position/Place ถูก re-read หลัง lock
5. Position missing/deleted => fail
6. Place deleted => fail
7. invalid/non-IANA Place timezone => fail
8. Template หาไม่ครบ => fail
9. Template ผิด Position => fail
10. Template SlotType ผิด Position => fail
11. Template SlotType deleted => fail
12. malformed Template `HH:mm` => fail
13. invalid/non-positive/non-integer `durationMinute` => fail
14. selected StaffPosition หาไม่ครบ => fail

#### Occurrence / overlap

15. normal timezone occurrence resolve ถูกต้อง
16. iterate วันแบบ calendar-day
17. occurrence fully contained เป็น Scheduling candidate
18. occurrence เริ่มก่อน request แต่ลากเข้ามาอยู่เฉพาะ overlap-check set
19. occurrence จบหลัง request ไม่เป็น Scheduling candidate
20. selected Template occurrences overlap => fail
21. Template เดียวกัน duration ยาวจน overlap วันถัดไป => fail
22. touching occurrence boundaries => ผ่าน
23. occurrence วันก่อน request ลากเข้ามาทับ occurrence ภายใน request => fail

#### DST

24. nonexistent Template wall time ใน spring-forward => fail
25. ambiguous Template wall time ใน fall-back => fail
26. normal wall time => ผ่าน
27. duration ใช้ elapsed minutes และถูกต้องเมื่อข้าม DST transition

ใช้ timezone fixture ที่มี DST และ explicit timestamps ห้ามพึ่ง timezone ของ test runner

#### Min

28. existing Position Slot ลด deficit ถูกต้อง
29. existing Slot ของ Staff ที่ไม่ได้เลือกยังนับ Min coverage
30. Min เต็มอยู่แล้ว => plan ว่าง
31. `min = 0` => ไม่สร้าง
32. `min = null` => ไม่สร้างจาก rule นั้น
33. ไม่มี Min rule => ไม่สร้าง
34. deficient segment มี candidate ครบ => สร้างเท่าที่ขาด
35. candidate ครอบหลาย deficient segments => ใช้ maximum deficit ไม่ sum
36. deficient segment ไม่มี candidate ครอบ => fail atomic

#### Staff availability

37. เลือก Staff ID ต่ำสุดที่ว่าง
38. Staff ID ต่ำกว่ามี Slot overlap target Position => ข้าม
39. Staff ID ต่ำกว่ามี Slot overlap Position อื่น => ข้าม
40. Staff มี Holiday overlap => ข้าม
41. touching Slot boundary => ใช้ได้
42. touching Holiday boundary => ใช้ได้
43. planned Slot ก่อนหน้า overlap => ข้าม
44. Staff ว่างไม่พอ => fail และไม่ insert

#### Max / no-op

45. planned + existing เกิน Max ใน segment ที่ planned แตะ => fail
46. planned + existing ไม่เกิน Max => ผ่าน
47. plan ว่าง + pre-existing Max violation => return 0 ไม่ failเพียงเพราะ violation เก่า
48. pre-existing Max violation ใน segment ที่มี `plannedCount > 0` => fail

#### Atomicity / retry

49. failure หลังคำนวณบาง occurrence => ไม่มี partial insert
50. success => `createMany` ครั้งเดียวใน successful attempt และ `createdCount` ตรง count ที่ Prisma คืน
51. no-op => ไม่เรียก `createMany`
52. P2034 ครั้งแรกแล้ว retry สำเร็จ => planning reads ถูกเรียกใหม่
53. P2034 จนหมด retry => fail ไม่มี partial result
54. domain error => ไม่ retry

### 6.5 `slot.controller.ts` — M

เพิ่ม route:

```ts
@Post('positions/:position_id/auto')
```

ใช้:

- `ClerkAuthGuard`
- `@Param()` + Auto DTO
- `@Body()` + Auto DTO
- `@ClerkUser()`
- `CommandBus`

return type เป็น `AutoCreateResponse`

ห้ามเปลี่ยน route/behavior `@Post(':position_id')` เดิม

### 6.6 `slot.module.ts` — M

import และเพิ่ม Auto Create handler ใน `CommandHandlers`

ไม่สร้าง module ใหม่

### 6.7 `features/work-schedule/slot/api/mutations/auto-create.api.ts` — A

ตาม pattern `create-many.api.ts`:

- import Auto Create schemas/type จาก backend command
- ประกอบ param/body แล้ว `safeParse`
- invalid local payload => `useErrorStore.showError()` + throw
- POST `/api/work-schedule/slot/positions/${positionId}/auto`
- Bearer token ผ่าน `apiClient`
- return `response.data` เป็น `AutoCreateResponse`
- ไม่มี scheduling calculation ใน API client

### 6.8 `features/work-schedule/slot/hooks/use-auto-create.ts` — A

ตาม pattern `use-create-many.ts`:

- `useAuth()` เพื่อ get token/userId
- `useMutation()` เรียก Auto API
- on success invalidate:

```ts
workScheduleSlotKeys.listsByPositionId(userId, positionId)
```

- return mutation result ให้ form ใช้ `createdCount`
- ไม่ optimistic-update Slot allocation

### 6.9 `app/.../slot/new/auto/page.tsx` — A

ตาม `pre-fill/page.tsx`:

- Server Internal Only + CSR
- `params` เป็น Promise
- resolve `placeId` / `positionId`
- render `<Client placeId={...} positionId={...} />`
- ไม่ต้องเพิ่ม Suspense wrapper

### 6.10 `app/.../slot/new/auto/client-page.tsx` — A

ใช้ multi-query pattern จาก parent `slot/new/client-page.tsx`

Queries:

1. `workScheduleSlotTemplateQueries.queryGetSlotTemplatesByPositionId(positionId, ...)`
2. `workScheduleStaffPositionQueries.queryGetStaffPositionsByPositionId(positionId, ...)`
3. `workSchedulePlaceQueries.queryGetWorkSchedulePlaceById(placeId, ...)`

Error handling:

- Position-based queries ใช้ `AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin`
- Place query ใช้ `AccessControlErrorCode.verifyWorkScheduleAdminAccess`
- ใช้ `useEffectCheckError()` แยก query ตาม pattern ปัจจุบัน
- import redirect mapping จาก `../error-code-redirect-list`
- import `ErrorQuery` จาก `../error`
- import `Loading` จาก `../loading`
- query error ที่ไม่มี cached data => render ErrorQuery พร้อม refetch ของ query นั้น
- loading/data undefined => render Loading

Rendering:

- header back ไป `.../slot/new/menu`
- Template ว่าง => แจ้งให้สร้าง Template ก่อน
- StaffPosition ว่าง => แจ้งให้เพิ่ม Staff ก่อน
- form render เฉพาะเมื่อทั้งสอง list มีข้อมูลและ Place data พร้อม

### 6.11 `features/work-schedule/slot/components/auto-create-form.tsx` — A

สร้าง UI schema แยกจาก backend payload schema เพราะ `datetime-local` ไม่มี offset

Fields อย่างน้อย:

- start datetime-local
- end datetime-local
- Template checkboxes/multi-select
- Staff checkboxes/multi-select
- submit/cancel

Validation UI:

- start/end required
- Template อย่างน้อย 1
- Staff อย่างน้อย 1
- Place timezone valid IANA
- start/end local wall times ต้อง exist และ unambiguous
- end instant ต้อง > start instant

แนะนำให้มี pure helper ภายในไฟล์หรือ helper function ที่ test ได้สำหรับ resolve wall time เพื่อไม่เขียน logic ซ้ำระหว่าง start/end

ก่อน submit:

- resolve start/end ด้วย Place timezone
- convert เป็น ISO with explicit offset
- ส่ง IDs ตาม selection
- ห้าม generate Template occurrences
- ห้ามคำนวณ Min/Max
- ห้ามเลือก Staff ให้ backend

Success ใช้ `createdCount` ตามข้อ 4.14

### 6.12 `tests/work-schedule/auto-create-form.test.tsx` — A

ต้องอยู่ใต้ `ecosystem-frontend-next-js/tests/` เพื่อให้ Jest config เก็บจริง

อย่างน้อยต้อง test:

- required Template selection
- required Staff selection
- end <= start block submit
- valid wall time => mutation payload เป็น ISO with offset + selected IDs
- nonexistent DST wall time => block ก่อน mutation
- ambiguous DST wall time => block ก่อน mutation
- invalid Place timezone => block ก่อน mutation
- success `createdCount > 0` => success feedback + navigation
- success `createdCount === 0` => no-op feedback + navigation

ถ้าต้อง test hook invalidation แยก ให้เพิ่ม test file ใต้ `tests/work-schedule/` ได้ แต่ห้ามย้าย test ไปใต้ `src/` แล้วถือว่า frontend suite จะเก็บ

### 6.13 `slot/new/menu/client-page.tsx` — M

เพิ่ม `MenuCard` สำหรับ “จัดเวรอัตโนมัติ”

href:

```text
/work-schedule/admin/{placeId}/position/{positionId}/slot/new/auto
```

Description ต้องสื่อว่าเลือกช่วงเวลา + Template + Staff เพื่อเติมจำนวนขั้นต่ำ

ห้ามเปลี่ยน href/behavior ของ “ใช้แบบร่าง” และ “ไม่ใช้แบบร่าง” เดิม

## 7. Acceptance Criteria แยกตามขั้น

### ขั้น 1 — API Contract / DTO

ผ่านเมื่อ:

- route ใหม่ compile
- response เป็น `{ createdCount }`
- DTO reject invalid UUID, datetime ไม่มี offset, duplicate IDs, empty arrays และ `end <= start`
- command specs ผ่าน

### ขั้น 2 — Transaction / entity invariants

ผ่านเมื่อ:

- authorization เดิมยังใช้
- Serializable transaction + Position lock มีจริง
- Position/Place ถูก re-read หลัง lock
- invalid/deleted Position/Place และ invalid IANA timezone fail ก่อน mutation
- Template/SlotType/StaffPosition ถูก re-read และ validate ภายใน transaction
- retry เฉพาะ P2034

### ขั้น 3 — Occurrence / timezone

ผ่านเมื่อ:

- generate candidate ทุก relevant local calendar day
- duration lookback จับ occurrence จากวันก่อน request ได้
- scheduling candidate ต้อง fully contained ใน request
- nonexistent/ambiguous Template wall time ถูก reject
- selected occurrences overlap ถูก reject รวมข้ามวันและ Template เดียวกัน
- touching boundary ผ่าน

### ขั้น 4 — Min planner

ผ่านเมื่อ:

- existing target Position Slots ทุก Staff นับ coverage
- deficit คำนวณทุก atomic segment
- สร้างเฉพาะจำนวนที่ขาด
- occurrence ครอบหลาย segment ใช้ maximum deficit
- deficient segment ที่ไม่มี selected candidate ครอบ => fail atomic
- Min เต็ม/0/null/ไม่มี rule => ไม่สร้าง

### ขั้น 5 — Staff allocation

ผ่านเมื่อ:

- assignment deterministic ตาม Staff ID ascending
- existing Slot ทุก Position, Holiday และ planned Slot overlap ถูกเคารพ
- touching boundary ไม่ block
- Staff ไม่พอ => fail ทั้ง request

### ขั้น 6 — Max / atomicity

ผ่านเมื่อ:

- request ไม่เพิ่ม Max violation
- zero-plan ไม่ fail เพราะ pre-existing Max violation ที่ request ไม่ได้เพิ่ม
- ไม่มี partial insert
- successful plan ใช้ `createMany` batch เดียว
- retry re-read/re-plan ใหม่ทั้งหมด

### ขั้น 7 — Frontend

ผ่านเมื่อ:

- เข้า Auto Create จาก menu ได้
- query Template/Staff/Place ตาม existing query layer
- Auto route reuse parent error/loading/redirect filesผ่าน `../...` imports และไม่สร้าง duplicate files
- เลือก range/Templates/Staff ได้หลายรายการ
- datetime-local ใช้ Place timezone
- ambiguous/nonexistent wall time ถูก block ก่อน API
- payload ใช้ ISO with offset
- success invalidate Slot list และกลับหน้า Slot
- `createdCount` 0 และ >0 มี feedback ต่างกัน
- frontend test ใหม่อยู่ใต้ `tests/` และถูกรันจริงโดย frontend Jest suite
- Manual/Pre-fill behavior ไม่เปลี่ยน

## 8. สิ่งที่ Implementor ต้องระวัง

1. ห้ามแก้ข้อความไอเดียต้นฉบับในไฟล์นี้
2. ห้ามเปลี่ยน Business Logic ของ Manual CreateMany
3. ห้ามเริ่ม occurrence generation จาก request-start local date อย่างเดียว ต้อง duration lookback ต่อ Template
4. ห้ามใช้ `DateTime.isValid` อย่างเดียวสำหรับ DST
5. ห้ามบวก local calendar day ด้วย fixed 24 ชั่วโมง
6. ห้ามประกอบ occurrence end เป็น wall-clock ใหม่ ให้ resolve start แล้วบวก elapsed duration
7. ห้ามใช้ inclusive end ใน overlap
8. ห้ามเทียบ Template overlap จาก `HH:mm` อย่างเดียว
9. ห้ามสร้าง occurrence ที่เลย request boundary แม้ occurrence นั้นยังต้องใช้ตรวจ overlap
10. ห้ามเชื่อ Template SlotType โดยไม่ validate ownership/active
11. ห้ามนับเฉพาะ selected Staff เป็น Min coverage
12. ห้ามจำกัด Staff Slot availability แค่ target Position
13. ห้ามเชื่อลำดับ Staff จาก request/Prisma
14. ห้ามใช้ browser/system timezone เป็น authority
15. ห้าม insert ก่อน planner รู้ว่าทั้ง request feasible
16. ห้าม retry domain validation error
17. ห้าม reuse planned result จาก retry attempt ก่อนหน้า
18. ห้าม block no-op เพราะ Max violation เก่าที่ request ไม่ได้เพิ่ม
19. ห้ามเพิ่ม arbitrary range cap โดยไม่มี requirement เพิ่ม
20. ห้ามแก้ Holiday/MinMax/Template/SlotType/StaffPosition CRUD business logic ใน task นี้
21. ห้ามแก้ Prisma schema/migration
22. ห้ามสร้าง `auto/error.tsx`, `auto/loading.tsx`, `auto/error-code-redirect-list.ts`; ให้ reuse parent ตามแผน
23. ห้ามวาง frontend Jest test ใต้ `src/` แล้วถือว่าถูก suite เก็บ
24. ถ้าพบว่าจำเป็นต้องเพิ่ม business invariant ใหม่ เช่น Staff soft-delete/cross-Place validation หรือ range cap ให้หยุดและแจ้งผู้ใช้ก่อน เพราะอยู่นอก scope ที่ยืนยันแล้ว

## 9. Tests และคำสั่งตรวจสอบ

### 9.1 Narrow backend tests

```bash
pnpm --dir ecosystem-backend-nest-js exec jest modules/work-schedule/slot/commands/auto-create.command.spec.ts --runInBand
pnpm --dir ecosystem-backend-nest-js exec jest modules/work-schedule/slot/commands/auto-create.handler.spec.ts --runInBand
pnpm --dir ecosystem-backend-nest-js exec jest modules/work-schedule/slot/commands/create-many.handler.spec.ts --runInBand
```

หมายเหตุ: backend Jest `rootDir` คือ `ecosystem-backend-nest-js/src` ดังนั้นเมื่อเรียก Jest ผ่าน `--dir ecosystem-backend-nest-js` path ของ test ให้ relative จาก `src` ตาม config; หาก Jest ใน environment resolve path แบบ repository path ได้ต่างออกไป ให้ใช้ path ที่ runner แสดง แต่ test file เดิมต้องถูกรันจริง

### 9.2 Frontend narrow test

```bash
pnpm --dir ecosystem-frontend-next-js exec jest tests/work-schedule/auto-create-form.test.tsx --runInBand
```

จากนั้นรัน frontend suite:

```bash
pnpm run test:frontend
```

### 9.3 Static / build checks

```bash
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run build:backend
pnpm run build:frontend
```

### 9.4 Standard repository verification

```bash
pnpm run verify
```

`pnpm run verify` เป็น acceptance command หลักของ repository และเป็น command เดียวกับที่ GitHub Actions CI ใช้หลัง install dependencies

`test:e2e` ไม่เป็น acceptance requirement ของ task นี้หาก environment ต้องพึ่ง deployment/database ภายนอก ห้ามต่อหรือแก้ shared database โดยไม่ได้รับอนุญาต

## 10. Definition of Done

งาน Implement ผ่านเมื่อครบทั้งหมด:

- Admin มีเมนูและหน้า Auto Create
- Admin เลือกช่วงเวลา, Templates หลายรายการ และ Staff หลายคนได้
- Backend validate selected entities ภายใน Serializable transaction
- Position/Place/timezone ถูก revalidate หลัง lock
- Template legacy malformed และ invalid/deleted SlotType relation ถูก reject
- occurrence generation รองรับ duration lookback และ local calendar-day iteration
- nonexistent/ambiguous DST wall time ไม่ถูก silently shift/เลือก offset
- selected Template occurrences ห้าม overlap รวมกรณีข้ามวัน
- Slot ที่สร้างต้อง fully contained ใน request
- Min deficit ถูกเติมตาม atomic segments โดยนับ existing target Position Slots ทุก Staff
- Staff ถูกเลือกตาม ID ascending และข้าม Slot/Holiday/planned conflicts
- request ไม่ทำให้ Max segment ที่มี planned Slot เกิน Max
- no-op return `{ createdCount: 0 }` โดยไม่ถูก block จาก unrelated pre-existing Max violation
- infeasible plan ล้มทั้ง request ไม่มี partial insert
- P2034 retry re-read/re-plan ใหม่ทุก attempt
- Frontend reuse parent error/loading/redirect components ตาม file plan
- Manual/Pre-fill/MinMax/Holiday/Template/SlotType/StaffPosition Business Logic เดิมไม่เปลี่ยน
- ไม่มี Prisma schema/migration change
- tests ที่เพิ่ม, regression test ของ Manual CreateMany และ `pnpm run verify` ผ่านใน environment ของ Implementor
