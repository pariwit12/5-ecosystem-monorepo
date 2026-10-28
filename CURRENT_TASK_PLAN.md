# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ต้องการสร้างระบบสำหรับจัดตารางเวรอัตโนมัติโดยเป็น feature ใหม่ ของ admin โดยให้เลือกช่วงเวลาเริ่มต้นและสิ้นที่จะจัดเวรอัตโนมัติ และต้องมีให้เลือกว่าจะเลือก Template แบบไหนที่จะนำมาจัดเวรบ้างครับ โดยห้าม Template ที่เวลาทับซ้อนกันสำหรับ Version นี้ครับ แล้วก็ให้เลือกว่าจะเลือกพนักงานคนไหนที่จะนำมาจัดตารางเวรครับ แล้วก็การลงข้อมูลสำหรับ Version แรกนี้ ให้ลงพนักงานที่ลงได้ไล่ตาม ID ได้เลย โดยให้ลงให้ถึงจำนวนขั้นต่ำสำหรับแต่ละช่วงเวลา

## 2. ขอบเขตของ Version นี้

- เป็น feature ใหม่สำหรับ Admin ของ Work Schedule ภายใต้ Position เดิม
- เพิ่มวิธีสร้าง Slot แบบอัตโนมัติ โดยไม่เปลี่ยนพฤติกรรมของการสร้าง Slot แบบ manual และแบบใช้ Template ที่มีอยู่
- Admin ต้องเลือก:
  - ช่วงเวลา `start_time` ถึง `end_time` ที่ต้องการให้ระบบจัดเวร
  - Slot Template อย่างน้อย 1 รายการ
  - พนักงานของ Position อย่างน้อย 1 คน
- Version นี้ใช้กติกา deterministic แบบง่ายตามไอเดียต้นฉบับ: เมื่อจำเป็นต้องเพิ่มพนักงาน ให้พิจารณา `staffId` จากน้อยไปมาก และเลือกคนแรกที่ลงเวร occurrence นั้นได้
- Version นี้ไม่ทำ optimization, balancing, randomization, rotation, fairness ตามจำนวนเวรย้อนหลัง หรือ backtracking เพื่อหาชุดคำตอบที่ดีที่สุด
- Version นี้ไม่เพิ่ม/แก้ Prisma model และไม่ต้องมี migration เพราะข้อมูลหลักที่ต้องใช้มีอยู่แล้วใน `WorkScheduleSlotTemplate`, `WorkScheduleStaffPosition`, `WorkScheduleMinMax`, `WorkScheduleSlot`, `WorkScheduleHoliday`, `WorkScheduleSlotType` และ timezone ของ Place
- ช่วงเวลาทั้งหมดใช้ half-open interval `[start, end)` เช่นเดียวกับ logic overlap ปัจจุบัน: ปลายของรายการหนึ่งเท่ากับต้นของอีกรายการถือว่าไม่ทับกัน
- Backend เป็น source of truth ของการวางแผนทั้งหมด; Frontend มีหน้าที่เลือก input, validate local datetime ที่ผู้ใช้กรอก และส่ง request เท่านั้น ห้าม generate Slot สำเร็จรูปเพื่อเลี่ยง validation ฝั่ง Backend
- ไม่เพิ่ม arbitrary maximum scheduling range ใน Version นี้ เพราะ requirement ปัจจุบันไม่ได้กำหนดเพดานดังกล่าว

## 3. Business Logic ที่เกี่ยวข้องก่อนเริ่ม

### 3.1 Slot และ CreateMany ปัจจุบัน

ไฟล์ที่ยืนยันจากโค้ดจริง:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.spec.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.module.ts`

Behavior ปัจจุบันที่ต้องใช้เป็น reference:

- DTO ใช้ UUID v7 และ ISO datetime ที่มี offset
- ตรวจ Admin ของ Position ก่อน mutation
- Manual CreateMany ตรวจ payload overlap ของ Staff คนเดียวกันก่อน transaction
- Manual CreateMany ตรวจ active `WorkScheduleStaffPosition` ก่อน transaction
- transaction เป็น Serializable
- transaction lock Position ด้วย `SELECT ... FOR UPDATE`
- query existing Slot ของ selected Staff ทุก Position และ Slot ของ target Position เพื่อใช้ overlap/Max validation
- Holiday overlap และ Slot overlap ใช้ half-open semantics
- validate `WorkScheduleMinMax.max`
- insert batch หลัง validation ผ่าน
- retry Prisma serialization conflict `P2034`
- request เป็น all-or-nothing

Auto Create ต้องใช้ transaction/lock/retry style เดิมเป็น baseline แต่ **ต้องอ่าน StaffPosition/Template/ข้อมูลที่ใช้ planner ซ้ำภายใน transaction** เพราะข้อมูลเหล่านี้เป็น input ของ planning และต้องอยู่ใน snapshot เดียวกับ Slot/Holiday/MinMax ที่ใช้ตัดสินใจ

ห้ามแก้ behavior ของ Manual CreateMany ใน task นี้

### 3.2 Min/Max ปัจจุบัน

ไฟล์ที่ยืนยัน:

- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/update.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`

Behavior ที่เกี่ยวข้อง:

- `WorkScheduleMinMax` มี `startTime`, `endTime`, `min`, `max` ต่อ Position
- ต้องมีอย่างน้อย `min` หรือ `max`
- หากมีทั้งคู่ต้อง `min <= max`
- MinMax ของ Position เดียวกันถูกห้ามไม่ให้ overlap ตอน create/update
- Slot flow ปัจจุบันใช้ `max` เป็นข้อจำกัด concurrency ของ Slot
- ยังไม่มี flow ที่สร้าง Slot อัตโนมัติเพื่อเติม `min`
- Holiday creation ปัจจุบันใช้ `min` เป็น availability guard คนละมุมกับ Auto planner: `verifyMinimumStaff()` นับจำนวน Staff ที่ยัง active ใน Position แล้วหัก Staff ที่มี Holiday overlap ในแต่ละ atomic holiday segment; logic นี้ **ไม่ได้** นับ `WorkScheduleSlot` เพื่อหาว่ามีคนถูกจัดเวรครบ Min หรือไม่

สำหรับ Auto Create ให้ตีความ `min` เป็น target จำนวน concurrent `WorkScheduleSlot` ของ Position ในช่วง rule นั้นตาม requirement “ลงให้ถึงจำนวนขั้นต่ำสำหรับแต่ละช่วงเวลา”:

- Slot เดิมของ Position ทุก Staff นับเป็น coverage ก่อน
- Auto สร้างเฉพาะ deficit ที่ขาด
- `min = 0`, `min = null` หรือช่วงที่ถึง Min อยู่แล้วไม่ต้องสร้างเพิ่ม
- semantic นี้เป็นของ Auto planner เท่านั้น ห้ามเปลี่ยน Holiday/MinMax CRUD semantics เดิม และห้ามแก้ `CreateHolidayHandler.verifyMinimumStaff()` ให้เปลี่ยนไปนับ Slot ใน task นี้

### 3.3 Slot Template / Slot Type ปัจจุบัน

ไฟล์ที่ยืนยัน:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/commands/create.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/commands/create.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/queries/get-slot-templates-by-position-id.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/queries/get-slot-template-by-id.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-type/queries/get-slot-types-by-position-id.handler.ts`

ข้อเท็จจริงจากโค้ด:

- Template มี `workSchedulePositionId`, `slotTypeId`, `startTime`, `durationMinute`
- DTO สร้าง Template บังคับ `startTime` รูปแบบ `HH:mm`
- `durationMinute >= 1`
- Template ไม่มี weekday/recurrence field
- Template creation ปัจจุบันเขียน `slotTypeId` ลงตรง ๆ และไม่ได้ validate ใน handler ว่า Slot Type เป็น Position เดียวกันหรือ active
- Slot Type มี `positionId` และ `deletedAt`

ดังนั้น Auto Create ต้องป้องกันตัวเองภายใน transaction:

- selected Template ต้องอยู่ target Position
- Slot Type ของ Template ต้องอยู่ Position เดียวกันและ `deletedAt = null`
- Template `startTime`/`durationMinute` ที่อ่านจาก DB ต้องยัง valid ตาม invariant ปัจจุบัน; ข้อมูล legacy/malformed ต้องถูก reject ไม่ใช่ normalize เงียบ ๆ

ห้ามแก้ Template CRUD หรือ Slot Type CRUD เพื่อแก้ gap นี้ใน task ปัจจุบัน

### 3.4 StaffPosition / Holiday ปัจจุบัน

ไฟล์ที่ยืนยัน:

- `ecosystem-backend-nest-js/src/modules/work-schedule/staff-position/commands/create-many.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/staff-position/queries/get-staff-positions-by-position-id.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`

Behavior ที่เกี่ยวข้อง:

- Staff ที่เลือกสำหรับ Slot flow ต้องมี `WorkScheduleStaffPosition` ของ Position และ `deletedAt = null`
- StaffPosition list เรียงตาม Staff ID และ query ปัจจุบันกรองที่ `WorkScheduleStaffPosition.deletedAt` แต่ไม่ได้เพิ่ม filter `WorkScheduleStaff.deletedAt`
- StaffPosition CreateMany ปัจจุบัน authorize Position แล้วเขียนคู่ Staff/Position โดยตรง; task นี้ห้ามขยายไปแก้ CRUD ดังกล่าว
- Staff availability ของ Auto ต้องดู Slot ของ Staff จากทุก Position ไม่ใช่เฉพาะ target Position เพราะ Manual CreateMany ก็ตรวจ conflict ของ Staff ข้าม Position
- Holiday ที่ overlap occurrence ทำให้ Staff คนนั้นลง occurrence นั้นไม่ได้
- Holiday create flow ใช้ Serializable transaction + retry เฉพาะ `P2034` และใช้ half-open overlap semantics แต่ **ไม่ได้** lock Position ด้วย `SELECT ... FOR UPDATE`
- Holiday minimum-staff logic มี filter เพิ่มสำหรับ active `WorkScheduleStaff` และ active `WorkSchedulePosition` ใน Place; logic นี้เป็นกติกาของ Holiday availability ไม่ใช่เหตุผลให้เปลี่ยน eligibility contract ของ Manual Slot/StaffPosition ใน task นี้

สำหรับ Auto Create ให้ยึด active `WorkScheduleStaffPosition` เป็น selected-staff eligibility baseline แบบ Slot flow ปัจจุบัน และห้ามเพิ่ม Staff soft-delete/cross-Place validation ใหม่โดยพลการใน V1; หากพบว่าจำเป็นต้องแก้ invariant ของ StaffPosition เอง ต้องหยุดและแจ้งผู้ใช้เพราะเป็น Business Logic นอก scope

### 3.5 Authorization / Place / timezone ปัจจุบัน

ไฟล์:

- `ecosystem-backend-nest-js/src/common/access-control/access-control.service.ts`
- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`

`verifyWorkSchedulePositionByWorkScheduleAdmin(clerkId, positionId)` ตรวจ Position ว่ายังไม่ถูก soft-delete, ตรวจ Place ว่ายังไม่ถูก soft-delete และตรวจ active WorkScheduleAdmin ก่อน transaction แต่ Auto planner ยังต้อง re-read Position + Place ใน transaction หลัง lock เพื่อไม่ใช้ timezone/state ที่เปลี่ยนระหว่าง authorization กับ planning

Prisma schema ยืนยันว่า Position และ Place มี `deletedAt`, Place มี `timezone`, Template ไม่มี recurrence field และ Slot/Holiday/MinMax ใช้ `Timestamptz`

### 3.6 Frontend ปัจจุบัน

ไฟล์ reference:

- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/menu/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/create-many-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/components/create-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/create-many.api.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-create-many.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/place/work-schedule-place.queries.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/place/api/queries/get-work-schedule-place-by-id.api.ts`
- `ecosystem-frontend-next-js/jest.config.mjs`
- `ecosystem-frontend-next-js/package.json`

Pattern ที่ต้องรักษา:

- React Query + Clerk token
- Zod schema จาก backend ถูก import มาใช้ใน frontend API layer
- `datetime-local` ใน MinMax flow ถูกตีความด้วย timezone ของ Place ก่อนแปลงเป็น ISO with offset
- Place detail query ที่มีอยู่แล้วคืน `timezone` และใช้ซ้ำได้
- mutation hook invalidate Slot list หลัง success
- page/client/loading/error/redirect ใช้ pattern sibling routes แบบ “Server Internal Only + CSR”; sibling `page.tsx` ไม่ได้ใช้ Suspense wrapper
- Frontend test runner คือ Jest (`jest --runInBand`) และ `jest.config.mjs` match เฉพาะ `tests/**/*.test.ts` / `tests/**/*.test.tsx`; test ใหม่ที่ต้องอยู่ใน suite จึงต้องวางใต้ `ecosystem-frontend-next-js/tests/`

## 4. Business Logic ที่คาดหวังหลัง Implement

### 4.1 API contract

เพิ่ม endpoint:

`POST /api/work-schedule/slot/positions/:position_id/auto`

Param:

- `position_id`: UUID v7

Body:

```ts
{
  start_time: string;          // ISO 8601 มี explicit offset
  end_time: string;            // ISO 8601 มี explicit offset และ > start_time
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

กติกา:

- ไม่มี Min deficit ที่ต้องเติม => success `{ createdCount: 0 }`
- มี deficit แต่ Template/Staff ที่เลือกทำให้ถึง Min ไม่ได้ => reject ทั้ง request
- backend ห้าม silently skip invalid selection

### 4.2 DTO validation

`auto-create.command.ts` ต้อง validate:

- param `position_id` เป็น UUID v7
- `start_time`/`end_time` เป็น string datetime with offset แบบเดียวกับ `create-many.command.ts`
- `end_time > start_time`
- Template array / Staff array อย่างน้อย 1
- ทุก ID เป็น UUID v7
- ID ในแต่ละ array ห้ามซ้ำ

DTO validation ไม่ทำ scheduling logic

### 4.3 Authorization + transaction boundary

ลำดับบังคับ:

1. authorize ด้วย `verifyWorkSchedulePositionByWorkScheduleAdmin(clerkId, position_id)` ก่อน transaction
2. เปิด Serializable transaction ผ่าน retry helper แบบเดียวกับ CreateMany
3. lock target Position ด้วย `SELECT ... FOR UPDATE`
4. หลัง lock re-read Position พร้อม Place ใน transaction และ validate:
   - Position ยังไม่ถูก soft-delete
   - Place ยังไม่ถูก soft-delete
   - Position ยังผูกกับ Place ที่ใช้งานได้
   - Place timezone เป็น IANA timezone ที่ Luxon ใช้งานได้
5. ทุก read ที่ใช้วาง plan ต้องเกิดใหม่ในแต่ละ retry attempt
6. domain validation failure ห้าม retry; retry เฉพาะ `P2034`

เหตุผล: authorization ก่อน transaction เพียงอย่างเดียวไม่พอสำหรับ state/timezone ที่ใช้คำนวณแผน

### 4.4 Validate selected Templates / Slot Types / Staff ใน transaction

#### Template

อ่าน selected Templates โดย ID และ validate:

- จำนวนที่พบเท่ากับจำนวน ID ที่ request
- ทุก Template มี `workSchedulePositionId === position_id`
- `startTime` ตรง `HH:mm` จริง
- `durationMinute` เป็น integer และ `>= 1`
- related Slot Type มี `positionId === position_id`
- related Slot Type มี `deletedAt === null`

หากข้อมูล DB เก่าผิด invariant ให้ reject request โดยไม่เดาค่าแทน

#### StaffPosition

อ่าน active StaffPosition ใหม่ใน transaction:

- target Position ตรงกัน
- `deletedAt = null`
- จำนวน unique Staff ที่พบเท่ากับจำนวน `staff_ids`

ถ้าไม่ครบให้ reject ทั้ง request

เรียง Staff candidates ตาม `staffId` ascending ใน backend เสมอ ไม่เชื่อลำดับจาก request/Prisma

### 4.5 Time model และ half-open interval

ทุก overlap ใช้ `[start, end)`:

```text
overlap = a.start < b.end && a.end > b.start
```

`a.end === b.start` และ `b.end === a.start` ไม่ overlap

หลัง resolve local template wall time เป็น instant แล้ว การ compare overlap ใช้ instant/timestamp ไม่ใช้ string local time

### 4.6 Generate Template occurrence พร้อม duration lookback

Template ไม่มี recurrence metadata ดังนั้น selected Template เป็น candidate ทุก local calendar day

**ห้ามเริ่ม generate จาก local date ของ request start อย่างเดียว** เพราะ occurrence ของวันก่อนหน้าอาจมี duration ยาวจนลากเข้ามาทับ request และทับ Template อื่น

สำหรับ Template แต่ละรายการที่มี duration `D` นาที:

1. parse request start/end เป็น instants
2. คำนวณ `generationStartInstant = requestStart - D minutes`
3. แปลง `generationStartInstant` เป็น Place timezone แล้วเอา local calendar date เป็นวันเริ่ม generate ของ Template นั้น
4. local date สุดท้ายคือ local calendar date ของ request end ใน Place timezone
5. เดินวันด้วย calendar-day arithmetic (`plus({ days: 1 })`) ใน Place timezone ไม่ใช่ fixed 24-hour milliseconds
6. ในแต่ละวันประกอบ intended local wall time จาก `date + Template.startTime`
7. resolve wall time ตาม DST rules ในข้อ 4.7
8. `occurrenceEnd = resolved occurrenceStart instant + elapsed durationMinute`

จาก generated occurrences แยกเป็นสองชุด:

**Overlap-check set**

```text
occ.start < requestEnd && occ.end > requestStart
```

ใช้ตรวจกฎ “Template ห้ามเวลาทับซ้อนกัน” รวม occurrence ที่เริ่มก่อน request แต่ลากเข้ามา

**Scheduling candidate set**

```text
occ.start >= requestStart && occ.end <= requestEnd
```

เฉพาะชุดนี้เท่านั้นที่อนุญาตให้สร้าง Slot

ผลที่ต้องได้:

- occurrence ที่เริ่มก่อน request แต่ลากเข้ามาไม่ถูกสร้าง Slot แต่ยังเข้าร่วม overlap validation
- occurrence ที่จบหลัง request ไม่ถูกสร้าง Slot
- touching request boundary ตาม half-open semantics ไม่ถูกนับเป็น overlap

### 4.7 DST / ambiguous / nonexistent local time

การเช็กเพียง `DateTime.isValid` ไม่พอสำหรับ local wall time

Backend ต้องใช้กฎนี้ทุกครั้งที่ประกอบ Template occurrence:

1. parse `HH:mm` เป็น intended hour/minute
2. สร้าง DateTime จาก intended year/month/day/hour/minute ใน Place timezone
3. timezone ต้อง valid
4. round-trip local components ของ DateTime ที่ได้ต้องตรง intended year/month/day/hour/minute ทุกตัว
   - ถ้า library shift เวลาเพราะ wall time ไม่มีจริง ให้ reject
5. ใช้ Luxon `getPossibleOffsets()` กับ local wall time ที่ resolve แล้ว
   - ต้องได้ possible offset เพียงหนึ่งค่า
   - ถ้ามากกว่าหนึ่งค่าให้ถือว่า ambiguous และ reject
6. เมื่อ start instant ชัดเจนแล้วค่อยบวก elapsed `durationMinute` เพื่อหา end

Frontend ใช้ `datetime-local` จึงต้องใช้หลักเดียวกันกับ `start_time` / `end_time` **ก่อน** แปลงเป็น ISO with offset:

- round-trip local components
- reject nonexistent wall time
- reject ambiguous wall time
- ห้ามให้ผู้ใช้ submit แล้วปล่อยให้ Luxon เลือก/shift offset เงียบ ๆ

เหตุผล: เมื่อ frontend ส่ง instant ที่มี explicit offset ไปแล้ว backend ไม่สามารถย้อนรู้ได้ว่าค่า wall-clock ที่ผู้ใช้พิมพ์เดิม ambiguous/nonexistent หรือไม่

### 4.8 Selected Template occurrences ห้าม overlap

นำ **Overlap-check set** ของ selected Templates ทั้งหมดมา sort ตาม:

1. start instant ascending
2. end instant ascending
3. template ID ascending

ตรวจ half-open overlap

- พบ overlap ใด ๆ => reject request ทั้งก้อน
- รวม occurrence จากคนละ Template
- รวม occurrence คนละวันของ Template เดียวกัน เช่น duration ยาวจนซ้อนวันถัดไป
- boundary ที่แตะกันพอดีอนุญาต

ห้ามตรวจจาก `HH:mm` อย่างเดียว เพราะ duration, ข้ามวัน และ DST ทำให้ช่วง instant ต่างจากการเทียบ string

### 4.9 อ่าน planning data ภายใน transaction

อย่างน้อยต้องอ่าน:

- existing Position Slots ที่ overlap request สำหรับ Min/Max coverage
- existing Slots ของ selected Staff ที่ overlap request **ทุก Position** สำหรับ Staff availability
- Holidays ของ selected Staff ที่ overlap request
- MinMax rules ของ target Position ที่ overlap request

Query ต้องใช้ half-open predicate และอ่านใหม่ทุก Serializable retry

### 4.10 คำนวณ Min deficit แบบ atomic segments

พิจารณาเฉพาะ MinMax rule ที่ overlap request และ `min != null`

สำหรับแต่ละ rule:

1. clip rule เป็น target interval ที่ intersection กับ request
2. boundaries ประกอบด้วย:
   - target start/end
   - start/end ของ existing Position Slot ที่ตัดผ่าน target (clip เข้า target)
   - start/end ของ Scheduling candidate occurrence ที่ตัดผ่าน target (clip เข้า target)
3. sort + deduplicate boundaries
4. พิจารณาทุก atomic segment `[boundary[i], boundary[i+1])`
5. `existingCount` = จำนวน existing Position Slots ที่ overlap segment
6. `deficit = max(0, min - existingCount)`
7. ถ้า deficit เป็น 0 ไม่ต้องทำอะไร
8. ถ้า deficit > 0 ต้องมี Scheduling candidate occurrence ที่ครอบ segment ทั้งก้อน:
   - `occ.start <= segmentStart`
   - `occ.end >= segmentEnd`
9. เพราะ selected occurrences ห้าม overlap จึงต้องมี candidate ครอบ segment ได้ไม่เกินหนึ่ง occurrence
10. ถ้าไม่มี candidate ครอบ deficient segment => reject request ทั้งก้อน
11. สำหรับ occurrence หนึ่งรายการ ให้ `requiredAdditional` = maximum deficit ของ deficient segments ที่ occurrence นั้นครอบ
12. occurrence ที่ `requiredAdditional = 0` ไม่สร้าง Slot

ห้าม sum deficits หลาย segment ของ occurrence เดียวกัน เพราะ Slot ชุดเดียวกันครอบหลาย segment พร้อมกัน

### 4.11 เลือก Staff ตาม ID แบบ deterministic

ประมวลผล occurrences ที่ `requiredAdditional > 0` ตาม:

1. occurrence start ascending
2. occurrence end ascending
3. template ID ascending

Staff candidates เรียง `staffId` ascending

Staff ใช้ได้เมื่อ:

- active StaffPosition ผ่าน validation แล้ว
- ไม่มี existing Slot ของ Staff คนนั้นจาก Position ใด ๆ overlap occurrence
- ไม่มี Holiday overlap occurrence
- ไม่มี planned Slot ก่อนหน้าจาก request เดียวกัน overlap occurrence

สำหรับ occurrence แต่ละตัว:

- เดิน Staff ID จากน้อยไปมาก
- คนที่ใช้ไม่ได้ให้ข้าม
- เลือกจนได้ `requiredAdditional`
- ถ้าไม่ครบ => reject request ทั้งก้อน
- ห้าม fallback ไป Staff ที่ไม่ได้เลือก

planned Slot ใช้:

- target `positionId`
- selected `staffId`
- `slotTypeId` จาก Template
- occurrence start/end ที่ resolve แล้ว

### 4.12 Max validation และ no-op semantics

หลังคำนวณ tentative planned Slots:

#### ถ้า plan ว่าง

- return `{ createdCount: 0 }`
- ไม่เรียก `createMany`
- ไม่ fail เพียงเพราะข้อมูลเดิมมี Max violation อยู่แล้ว เนื่องจาก request นี้ไม่ได้เพิ่ม Slot หรือทำให้ violation แย่ลง

#### ถ้ามี planned Slots

สำหรับทุก Max rule ที่เกี่ยวข้อง:

1. สร้าง atomic boundaries จาก clipped Max rule, existing Position Slots และ planned Slots
2. ต่อ segment คำนวณ `existingCount` และ `plannedCount`
3. reject เมื่อ:

```text
plannedCount > 0 && existingCount + plannedCount > max
```

ดังนั้น Auto Create:

- ห้ามสร้าง/เพิ่ม Max violation
- แต่ไม่เป็น repair validator ที่ block no-op เพราะ violation เก่าที่ request ไม่ได้แตะ

หาก Min ต้องการ Slot แต่ Max ทำให้สร้างไม่ได้ ให้ reject ทั้ง request ไม่ลด Min และไม่ insert บางส่วน

### 4.13 Atomicity / retry

ภายในแต่ละ retry attempt ต้อง re-read + re-plan ทั้งหมด:

1. lock Position
2. re-read Position/Place
3. re-read Templates/SlotTypes
4. re-read StaffPositions
5. generate/validate occurrences
6. re-read Slot/Holiday/MinMax data
7. calculate deficits
8. assign Staff
9. validate Max
10. insert planned Slots เมื่อทุกอย่างผ่าน

ข้อกำหนด:

- `createMany` ไม่เกินหนึ่งครั้งต่อ successful attempt
- ห้าม insert ทีละ occurrence ก่อนรู้ว่าทั้ง request feasible
- P2034 => retry ด้วย snapshot ใหม่
- domain validation error => ไม่ retry
- retry exhausted => fail โดยไม่มี partial result

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
│  │  ├─ menu/client-page.tsx                                      M
│  │  └─ auto/
│  │     ├─ page.tsx                                               A
│  │     └─ client-page.tsx                                        A
│  └─ features/work-schedule/slot/
│     ├─ api/mutations/auto-create.api.ts                          A
│     ├─ hooks/use-auto-create.ts                                  A
│     └─ components/
│        └─ auto-create-form.tsx                                   A
└─ tests/work-schedule/
   └─ auto-create-form.test.tsx                                    A
```

ไฟล์ UI ที่มีอยู่แล้วใต้ `slot/new/` ได้แก่ `loading.tsx`, `error.tsx`, `error-code-redirect-list.ts`; Auto child route ให้ reuse ไฟล์/logic เหล่านี้ผ่าน import ที่เหมาะสมหรือการ inherit route boundary และไม่ต้องสร้างสำเนาโดย default

ไม่คาดหวังการแก้:

- Prisma schema / migrations
- Manual CreateMany
- MinMax CRUD
- Holiday CRUD
- Template CRUD
- Slot Type CRUD
- StaffPosition CRUD

หากต้องแก้ไฟล์นอก list เพียงเพื่อ import/type/build ให้แก้เท่าที่จำเป็นและห้ามเปลี่ยน Business Logic อื่น หากพบว่าจำเป็นต้องเปลี่ยน Business Logic ของ module อื่น ให้หยุดและแจ้งผู้ใช้ก่อน

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### 6.1 `slot/commands/auto-create.command.ts` — A

ใช้ style เดียวกับ `create-many.command.ts`

ต้อง export:

- Param schema / DTO
- Body schema / DTO
- `AutoCreateCommand`

Body fields ตามข้อ 4.1 และ uniqueness/cross-field validation ตามข้อ 4.2

ห้ามใส่ planner logic ใน schema

### 6.2 `slot/commands/auto-create.command.spec.ts` — A

ต้องทดสอบ DTO อย่างน้อย:

- valid payload
- empty Template array
- empty Staff array
- duplicate Template ID
- duplicate Staff ID
- non-v7 IDs
- datetime ไม่มี offset
- `end === start`
- `end < start`

ใช้ UUID v7 fixture ที่ valid จริง

### 6.3 `slot/commands/auto-create.handler.ts` — A

Dependency หลัก:

- `PrismaService`
- `AccessControlService`
- Luxon `DateTime`

Implement ตามลำดับ Business Logic ในข้อ 4 โดยเฉพาะ:

- authorization ก่อน tx
- Serializable retry
- Position lock
- in-transaction Position/Place revalidation
- Template/SlotType/StaffPosition validation
- duration lookback occurrence generation
- DST exact/ambiguous validation
- overlap-check set + scheduling candidate set
- Min segmentation
- deterministic Staff assignment
- Max touched-segment validation
- no-op early success หลัง planner ได้ planned list ว่าง
- atomic createMany

ห้าม:

- เรียก HTTP Manual CreateMany จาก backend
- วางแผนนอก transaction แล้วนำ plan เข้า transaction
- เชื่อ Prisma row order
- silently skip invalid Template/Staff
- insert ทีละ Slot
- ใช้ browser timezone

### 6.4 `slot/commands/auto-create.handler.spec.ts` — A

ใช้ mocked Prisma เท่านั้นตาม repository testing convention; ห้ามต่อ database จริง

#### Authorization / transaction / validation

1. authorize target Position
2. Serializable transaction + Position lock ถูกใช้
3. Position/Place ถูก re-read หลัง lock
4. Position/Place inactive => fail
5. invalid Place timezone => fail
6. Template หาไม่ครบ/ผิด Position => fail
7. Template SlotType ผิด Positionหรือ deleted => fail
8. malformed Template `HH:mm` => fail
9. invalid/non-positive `durationMinute` => fail
10. selected StaffPosition หาไม่ครบ => fail

#### Occurrence / overlap

11. normal timezone occurrence resolve ถูกต้อง
12. occurrence ใช้ calendar-day iteration
13. occurrence fully contained เป็น candidate
14. occurrence เริ่มก่อน request แต่ลากเข้ามาไม่ถูกสร้าง
15. occurrence จบหลัง request ไม่ถูกสร้าง
16. selected Template occurrences overlap => fail
17. Template เดียวกัน duration ยาวจน overlap occurrence วันถัดไป => fail
18. touching boundaries => ผ่าน
19. **critical:** occurrence เริ่มวันก่อน request และลากเข้ามาทับ selected occurrence ภายใน request => ต้องตรวจเจอ overlap และ fail

#### DST

20. nonexistent local Template time ใน spring-forward => fail
21. ambiguous local Template time ใน fall-back => fail
22. normal local time => ผ่าน
23. duration เป็น elapsed minutes หลัง resolve start และทำงานถูกเมื่อข้าม DST transition

ใช้ timezone fixture ที่มี DST และ timestamps ชัดเจน ห้ามพึ่ง timezone ของ test runner

#### Min

24. existing Position Slot ลด deficit ถูกต้อง
25. existing Slot ของ Staff ที่ไม่ได้เลือกยังนับ Min coverage
26. Min เต็มอยู่แล้ว => plan ว่าง
27. `min = 0` / `min = null` / ไม่มี Min rule => ไม่สร้าง
28. deficient segment มี candidate ครบ => สร้างเท่าที่ขาด
29. candidate ครอบหลาย deficient segments => ใช้ maximum deficit ไม่ sum
30. deficient segment ไม่มี candidate ครอบ => fail atomic

#### Staff availability

31. เลือก Staff ID ต่ำสุดที่ว่าง
32. Staff ID ต่ำกว่ามี Slot overlap target Position => ข้าม
33. Staff ID ต่ำกว่ามี Slot overlap Position อื่น => ข้าม
34. Staff มี Holiday overlap => ข้าม
35. touching Slot/Holiday boundary => ใช้ Staff ได้
36. planned overlap จาก request เดียวกัน => ข้าม
37. Staff ว่างไม่พอ => fail ไม่มี insert

#### Max / no-op

38. planned + existing เกิน Max ใน touched segment => fail
39. planned + existing ไม่เกิน Max => ผ่าน
40. plan ว่างและมี pre-existing Max violation => return 0 ไม่ failเพียงเพราะ violation เก่า
41. pre-existing Max violation ใน segment ที่มี `plannedCount > 0` => fail

#### Atomicity / retry

42. failure หลังคำนวณบาง occurrence => ไม่ insert บางส่วน
43. success plan => `createMany` ครั้งเดียว + `createdCount` ถูกต้อง
44. no-op => ไม่เรียก `createMany`
45. P2034 ครั้งแรกแล้ว retry สำเร็จ => re-read/re-plan ใหม่และไม่ duplicate
46. P2034 จนหมด retry => fail ไม่มี partial result
47. domain error => ไม่ retry

### 6.5 `slot.controller.ts` — M

เพิ่ม:

`@Post('positions/:position_id/auto')`

ใช้ auth/validated DTO/CommandBus pattern เดิม และคืน `{ createdCount }`

ห้ามเปลี่ยน route/behavior `@Post(':position_id')` เดิม

### 6.6 `slot.module.ts` — M

register Auto Create handler ใน CommandHandlers ตาม pattern เดิม

ไม่สร้าง module ใหม่ถ้า dependency เดิมเพียงพอ

### 6.7 `features/work-schedule/slot/api/mutations/auto-create.api.ts` — A

ตาม pattern `create-many.api.ts`:

- import Auto Create Zod schemas จาก backend
- `safeParse` param/body
- POST `/api/work-schedule/slot/positions/${positionId}/auto`
- Bearer token ผ่าน `apiClient`
- return `{ createdCount: number }`
- ไม่มี scheduling calculation ใน API client

### 6.8 `features/work-schedule/slot/hooks/use-auto-create.ts` — A

ตาม pattern `use-create-many.ts`:

- get Clerk token
- call Auto API
- on success invalidate Slot list query key ของ Position
- ไม่ optimistic-update allocation เอง

### 6.9 `app/.../slot/new/auto/page.tsx` — A

ใช้ sibling route pattern ที่ยืนยันจาก `slot/new/pre-fill/page.tsx`:

- Server Internal Only + CSR
- `params` เป็น Promise ตาม Next route ปัจจุบัน, resolve `placeId` / `positionId` แล้วส่งให้ client page
- ไม่ต้องเพิ่ม Suspense wrapper เพราะ sibling route ปัจจุบันไม่ได้ใช้
- ใช้ parent `slot/new/loading.tsx` / `error.tsx` route boundary ที่มีอยู่แล้ว เว้นแต่พบ requirement ที่ยืนยันได้ว่าต้องมี child-specific boundary

### 6.10 `app/.../slot/new/auto/client-page.tsx` — A

query อย่างน้อย:

- Slot Templates by Position
- StaffPositions by Position
- Place detail เพื่อ timezone

Behavior:

- loading/error/redirect ตาม sibling flow; reuse `slot/new/loading.tsx`, `slot/new/error.tsx` และ redirect mapping ที่มีอยู่เมื่อ error code ครอบคลุม ไม่สร้าง duplicate โดยไม่จำเป็น
- ไม่มี Template => แจ้งให้สร้าง Template ก่อนและไม่ render submit-able form
- ไม่มี StaffPosition => แจ้งให้เพิ่ม Staff ก่อนและไม่ render submit-able form
- ข้อมูลครบ => render AutoCreateForm
- Backend เป็นผู้ validate SlotType ownership/active และ planner state

### 6.11 `features/work-schedule/slot/components/auto-create-form.tsx` — A

Fields:

- `start_time` datetime-local
- `end_time` datetime-local
- multi-select/checkbox Templates
- multi-select/checkbox Staff
- submit/cancel

Validation:

- start/end required
- end > start
- Template อย่างน้อย 1
- Staff อย่างน้อย 1
- local datetime start/end ต้องมีจริงและ unambiguous ใน Place timezone ตามข้อ 4.7

ก่อน submit:

1. parse user wall time ด้วย Place timezone
2. round-trip components
3. reject nonexistent
4. reject ambiguous ผ่าน `getPossibleOffsets()`
5. แปลง valid values เป็น ISO with explicit offset
6. ส่ง selected IDs

ห้าม frontend generate occurrences, calculate Min/Max, choose Staff หรือทำ availability preflight เป็น business authority

Success:

- `createdCount > 0` => toast จำนวนที่สร้าง + กลับหน้า Slot
- `createdCount === 0` => แจ้งว่าไม่มี Slot ที่ต้องเพิ่ม + กลับหน้า Slot
- error => อยู่หน้าเดิมให้แก้ input

### 6.12 `tests/work-schedule/auto-create-form.test.tsx` — A

ต้องวางใต้ `ecosystem-frontend-next-js/tests/` เพราะ `jest.config.mjs` match เฉพาะ test ใต้ directory นี้

อย่างน้อย:

- required selections
- end <= start block submit
- valid wall time -> mutation payload เป็น ISO with offset + selected IDs
- nonexistent DST wall time block ก่อน mutation
- ambiguous DST wall time block ก่อน mutation
- success path แสดง/ใช้ `createdCount` และ navigation ตาม contract

หาก query invalidation assertion เหมาะกับ hook test มากกว่า ให้เพิ่ม test ใต้ `ecosystem-frontend-next-js/tests/work-schedule/` ได้ แต่ acceptance behavior ต้องยังถูกตรวจจริง

### 6.13 `slot/new/menu/client-page.tsx` — M

เพิ่ม MenuCard “จัดเวรอัตโนมัติ” ไป route `.../slot/new/auto`

Description สื่อว่าเลือกช่วงเวลา + Template + Staff เพื่อเติมจำนวนขั้นต่ำ

ห้ามเปลี่ยน href/behavior ของเมนูเดิม

## 7. Acceptance Criteria แยกตามขั้น

### ขั้น 1 — Contract

ผ่านเมื่อ:

- route ใหม่ compile
- DTO reject invalid UUID/datetime/duplicates/empty arrays/end<=start
- DTO tests ผ่าน

### ขั้น 2 — Transaction / entity invariants

ผ่านเมื่อ:

- authorization เดิมยังใช้
- Position lock + in-transaction Position/Place read มีจริง
- invalid Place timezone/Template/SlotType/StaffPosition fail ก่อน mutation
- Serializable + P2034 retry pattern สอดคล้อง flow เดิม

### ขั้น 3 — Occurrence / timezone

ผ่านเมื่อ:

- generate ทุก local calendar day ที่เกี่ยวข้อง
- duration lookback จับ occurrence จากวันก่อน request ได้
- scheduling candidate ต้อง fully contained
- ambiguous/nonexistent local Template time ถูก reject
- selected occurrences overlap ถูก reject รวมข้ามวัน/Template เดียวกัน

### ขั้น 4 — Min planner

ผ่านเมื่อ:

- existing Position Slots ทุก Staff นับ coverage
- deficit คำนวณทุก atomic segment
- สร้างเฉพาะจำนวนที่ขาด
- under-covered segment ที่ Template cover ไม่ได้ => fail atomic
- Min เต็มแล้วไม่สร้างเพิ่ม

### ขั้น 5 — Staff allocation

ผ่านเมื่อ:

- assignment deterministic ตาม Staff ID ascending
- existing Slot ทุก Position / Holiday / planned overlap ถูกเคารพ
- Staff ไม่พอ => fail ทั้ง request

### ขั้น 6 — Max / atomicity

ผ่านเมื่อ:

- request ไม่เพิ่ม Max violation
- no-op ไม่ fail เพราะ pre-existing Max violation ที่ไม่ถูก request เพิ่ม
- ไม่มี partial insert
- retry ไม่ reuse stale plan

### ขั้น 7 — Frontend

ผ่านเมื่อ:

- เข้า Auto Create จาก menu ได้
- เลือก range/Templates/Staff ได้หลายรายการ
- `datetime-local` ใช้ Place timezone
- ambiguous/nonexistent user wall time ถูก block ก่อน API
- payload ใช้ ISO with offset
- success invalidate Slot list และกลับ flow Slot
- Jest test ใหม่อยู่ใต้ `ecosystem-frontend-next-js/tests/` และถูกรันจริงโดย `pnpm run test:frontend`
- Manual/Pre-fill ไม่เปลี่ยน behavior

## 8. สิ่งที่ Implementor ต้องระวัง

1. ห้ามแก้ข้อความไอเดียต้นฉบับในไฟล์นี้
2. ห้ามเริ่ม occurrence generation จาก request-start local date อย่างเดียว; ต้องทำ duration lookback ต่อ Template
3. ห้ามใช้ `DateTime.isValid` อย่างเดียวสำหรับ DST
4. ห้ามบวกวันด้วย fixed 24 ชั่วโมง; ใช้ local calendar day
5. ห้ามคำนวณ occurrence end ด้วยการประกอบ wall-clock end ใหม่; resolve start แล้วบวก elapsed duration
6. ห้ามใช้ inclusive end ใน overlap
7. ห้ามเทียบ Template overlap จาก `HH:mm` อย่างเดียว
8. ห้ามสร้าง occurrence ที่เลย request boundary แม้จะใช้ occurrence นั้นตรวจ overlap
9. ห้ามเชื่อ SlotType ใน Template โดยไม่ validate ownership/active
10. ห้ามนับเฉพาะ selected Staff เป็น Min coverage
11. ห้ามจำกัด Staff Slot availability แค่ target Position
12. ห้ามใช้ browser timezone เป็น authority
13. ห้าม insert ก่อน planner ทั้ง request feasible
14. ห้าม retry domain validation error
15. ห้าม reuse planned result จาก retry attempt ก่อนหน้า
16. ห้าม block zero-plan เพราะ Max violation เก่าที่ request ไม่ได้เพิ่ม
17. ห้ามเพิ่ม arbitrary range cap โดยไม่มี requirement เพิ่ม
18. ห้ามแก้ Manual CreateMany / Holiday / MinMax / Template / SlotType / StaffPosition Business Logic โดยพลการ
19. ห้ามแก้ Prisma schema/migration สำหรับงานนี้
20. ห้ามวาง frontend Jest test ใต้ `src/` แล้วถือว่าผ่าน เพราะ config ปัจจุบันไม่เก็บ test จาก path นั้น

## 9. Tests และคำสั่งตรวจสอบ

Repository ใช้ `pnpm@11.10.0`

### 9.1 Narrow backend tests

```bash
pnpm --dir ecosystem-backend-nest-js exec jest src/modules/work-schedule/slot/commands/auto-create.command.spec.ts --runInBand
pnpm --dir ecosystem-backend-nest-js exec jest src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts --runInBand
pnpm --dir ecosystem-backend-nest-js exec jest src/modules/work-schedule/slot/commands/create-many.handler.spec.ts --runInBand
```

### 9.2 Frontend test

Frontend package ใช้ Jest และ config เก็บ test ใต้ `tests/**` เท่านั้น ให้รัน test ใหม่แบบ narrow ด้วยคำสั่ง:

```bash
pnpm --dir ecosystem-frontend-next-js exec jest tests/work-schedule/auto-create-form.test.tsx --runInBand
```

จากนั้นต้องรัน frontend test suite ผ่าน root script:

```bash
pnpm run test:frontend
```

### 9.3 Static/build checks

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

Root `verify` ครอบคลุม frontend tests, Prisma validate/generate, backend/frontend typecheck, lint, builds, backend tests และ migration tests ตาม `package.json`

`test:e2e` ไม่เป็น acceptance requirement ของ task นี้หาก environment ต้องพึ่ง deployment/database ภายนอก; ห้ามต่อหรือแก้ shared database โดยไม่ได้รับอนุญาต

## 10. Definition of Done

งาน Implement ผ่านเมื่อครบทั้งหมด:

- Admin มีเมนู/หน้า Auto Create
- Admin เลือกช่วงเวลา, Templates หลายรายการ และ Staff หลายคนได้
- Backend validate selection ภายใน transaction
- Position/Place/timezone ถูก revalidate หลัง lock
- Template legacy malformed และ invalid SlotType relation ถูก reject
- occurrence generation รองรับ duration lookback
- nonexistent/ambiguous DST wall time ไม่ถูก silently shift/เลือก offset
- selected Template occurrences ห้าม overlap รวมกรณีข้ามวัน
- Slot ที่สร้างต้อง fully contained ใน request
- Min deficit ถูกเติมตาม atomic segments โดยนับ existing Position Slots ทุก Staff
- Staff ถูกเลือกตาม ID และข้าม Slot/Holiday conflicts ทุก Position
- request ไม่ทำให้ touched Max segment เกิน Max
- no-op return 0 โดยไม่ถูก block จาก unrelated pre-existing Max violation
- infeasible plan ล้มทั้ง request ไม่มี partial insert
- Serializable retry re-read/re-plan ทุก attempt
- Manual/Pre-fill/MinMax/Holiday/Template/SlotType/StaffPosition Business Logic เดิมไม่เปลี่ยน
- frontend test ใหม่ถูก Jest suite เก็บและรันจริง
- ไม่มี Prisma schema/migration change
- test ที่เพิ่ม, regression tests และ `pnpm run verify` ผ่านใน environment ของ Implementor
