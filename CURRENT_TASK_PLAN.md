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
- ช่วงเวลาทั้งหมดใช้หลัก half-open interval `[start, end)` เช่นเดียวกับ logic overlap ปัจจุบัน: ช่วงที่ปลายของรายการหนึ่งเท่ากับต้นของอีกรายการถือว่าไม่ทับกัน
- Backend เป็น source of truth ของการวางแผนทั้งหมด; Frontend มีหน้าที่เลือก input และส่ง request เท่านั้น ห้าม generate Slot สำเร็จรูปเพื่อเลี่ยง validation ฝั่ง Backend

## 3. Business Logic ที่เกี่ยวข้องก่อนเริ่ม

### 3.1 Slot และการสร้าง Slot ปัจจุบัน

`WorkScheduleSlot` ผูกกับ Position, Staff และ Slot Type และเก็บ `actualStartTime` / `actualEndTime` เป็น `Timestamptz`

การสร้าง Slot แบบหลายรายการ (`CreateMany`) ปัจจุบันมี behavior ที่ต้องรักษาเป็น reference:

- ตรวจสิทธิ์ Admin ของ Position ก่อน
- ตรวจว่า Staff ทุกคนที่ส่งมามี `WorkScheduleStaffPosition` ของ Position และ link นั้นยังไม่ถูกลบ
- ปฏิเสธ Slot ที่ทับกันภายใน payload สำหรับ Staff คนเดียวกัน
- ตรวจ Slot เดิมที่ทับกับช่วงคำขอ โดย Staff คนเดียวกันห้ามมี Slot ทับกันแม้จะเป็นคนละ Position
- ตรวจ Holiday ของ Staff และปฏิเสธหาก Holiday ทับกับ Slot
- ตรวจ `WorkScheduleMinMax.max` ของ Position และปฏิเสธเมื่อจำนวน Slot พร้อมกันเกิน `max`
- ทำงานใน Serializable transaction, lock Position และ retry เมื่อ Prisma แจ้ง serialization conflict (`P2034`)
- ทั้ง batch เป็น all-or-nothing; validation conflict ต้องเกิดก่อน `createMany`

ข้อสังเกตที่ยืนยันจากโค้ดจริง:

- StaffPosition validation ของ manual CreateMany ปัจจุบันทำก่อน transaction แต่ Auto Create ใน task นี้จะอ่าน StaffPosition ที่ใช้วางแผนซ้ำภายใน transaction เพราะ StaffPosition เป็น input ของ planner
- Manual CreateMany ไม่ validate ว่า `slot_type_id` เป็นของ Position เดียวกันกับ `position_id`; task นี้ห้ามแก้ behavior manual แต่ Auto Create ต้องไม่ขยายช่องโหว่นี้จากข้อมูล Template

### 3.2 Min/Max ปัจจุบัน และความหมายที่ใช้ใน Auto Create

- `WorkScheduleMinMax` มี `min`, `max`, `startTime`, `endTime` ต่อ Position
- `min` หรือ `max` อย่างน้อยหนึ่งค่าต้องมี; หากมีทั้งคู่ `min <= max`
- Min/Max ของ Position เดียวกันถูกห้ามไม่ให้มีช่วงเวลาทับซ้อนกันตั้งแต่ตอนสร้าง
- การสร้าง Slot ปัจจุบันใช้ `max` เป็นข้อจำกัดจำนวน Slot พร้อมกัน แต่ยังไม่มี flow ที่สร้าง Slot อัตโนมัติเพื่อเติมจำนวนให้ถึง `min`
- Holiday flow ปัจจุบันใช้ `min` เพื่อป้องกันการสร้าง Holiday เมื่อจำนวน StaffPosition ที่ยังพร้อมทำงานหลังหัก Holiday จะต่ำกว่า `min`; flow นี้ไม่ได้ตรวจจำนวน WorkScheduleSlot ที่ถูกจัดจริง

สำหรับ task นี้ ให้ยึดไอเดียต้นฉบับว่า “ลงให้ถึงจำนวนขั้นต่ำสำหรับแต่ละช่วงเวลา” ดังนั้น **เฉพาะ Auto Create** ให้ตีความ `WorkScheduleMinMax.min` เป็น target จำนวน concurrent `WorkScheduleSlot` ของ Position ที่ planner ต้องทำให้ถึงในช่วง rule นั้น โดย:

- Slot เดิมของ Position นับเป็น coverage ก่อน
- planner สร้างเพิ่มเฉพาะ deficit
- ห้ามแก้ Holiday behavior เดิมหรืออ้างว่า Holiday flow เปลี่ยนมาใช้จำนวน Slot

เหตุผล: เป็น behavior ใหม่ที่จำเป็นต่อ feature ตามข้อความต้นฉบับ ขณะที่โค้ดเดิมยังไม่มี auto-scheduling logic ให้ reuse ตรง ๆ

### 3.3 Slot Template และ Slot Type ปัจจุบัน

`WorkScheduleSlotTemplate` เก็บ:

- `workSchedulePositionId`
- `slotTypeId`
- `name`
- `startTime` รูปแบบ `HH:mm`
- `durationMinute`

พฤติกรรมปัจจุบันที่ยืนยันแล้ว:

- Template เป็นแบบร่างช่วยกรอกการสร้าง Slot; ยังไม่สร้าง Slot เอง
- Template ไม่มี field วันในสัปดาห์หรือ recurrence
- DTO สร้าง Template บังคับ `startTime` เป็น `HH:mm` และ `durationMinute >= 1`
- list Template ของ Position คืนเพียง `id`, `name` และเรียง `id` ascending
- detail Template คืน `slotTypeId`, `startTime`, `durationMinute`
- `WorkScheduleSlotType` มี `positionId` และ `deletedAt`; list Slot Type ของ Position ปัจจุบันคืนเฉพาะ `deletedAt = null`
- schema ของ Template มี `workSchedulePositionId` และ `slotTypeId` เป็น relation แยกกัน และ handler สร้าง Template ปัจจุบันไม่ได้ validate ว่า Slot Type เป็นของ Position เดียวกัน

ผลต่อ Auto Create:

- เมื่อเลือก Template ระบบจะถือว่า Template เป็น candidate ของทุก local calendar day ภายในช่วงที่ Admin เลือก เพราะไม่มีข้อมูล recurrence แบบอื่นให้ใช้
- Backend ต้องอ่าน Template detail พร้อม relation ของ Slot Type ภายใน transaction
- ต้อง reject request หาก Template ไม่ใช่ของ Position, Slot Type ของ Template ไม่ใช่ Position เดียวกัน หรือ Slot Type ถูก soft-delete แล้ว
- ห้ามแก้ Template CRUD/Slot Type CRUD เพื่อแก้ invariant นี้ใน task นี้; validation ต้องอยู่ใน Auto Create เท่านั้น

### 3.4 Staff ของ Position ปัจจุบัน

- รายการ Staff ที่ใช้กับ Position มาจาก `WorkScheduleStaffPosition` ที่ `deletedAt = null`
- Query ปัจจุบันคืน `staffId` และชื่อของ Staff และเรียงตาม `workScheduleStaffId` จากน้อยไปมาก
- Auto Create ใช้เฉพาะ Staff ที่ Admin เลือกจากกลุ่มนี้เท่านั้น
- Slot overlap ของ Staff ต้องตรวจทุก Position ไม่ใช่เฉพาะ Position ปัจจุบัน ตาม behavior ของ manual CreateMany

### 3.5 Authorization และ Place ปัจจุบัน

- `verifyWorkSchedulePositionByWorkScheduleAdmin(clerkId, positionId)` ตรวจว่า Position มีอยู่, Position/Place ไม่ถูกลบ และผู้ใช้เป็น Work Schedule Admin ของ Place
- method นี้คืน `organizationWorkSchedulePlaceId` ได้ แต่เป็น authorization step ก่อน transaction
- Auto Create ยังต้องอ่าน Position/Place timezone ที่ใช้วางแผนจาก database ภายใน transaction เพื่อให้ planning ใช้ transaction snapshot เดียวกับข้อมูลอื่น

### 3.6 Frontend ปัจจุบัน

- หน้า `slot/new/menu` มี 2 วิธีสร้าง Slot: ใช้แบบร่าง และไม่ใช้แบบร่าง
- Manual create page มี pattern ที่ใช้ได้กับ feature นี้อยู่แล้ว:
  - React Query + Clerk token
  - query Staff Position
  - query Place เพื่อเอา timezone
  - query Template/detail เมื่อใช้ prefill
  - แปลงค่าจาก input เป็น ISO ด้วย Luxon และ timezone ของ Place ก่อนส่ง Backend
  - mutation hook invalidate Slot list หลังสร้างสำเร็จ
- หน้าเลือก prefill ใช้ query list Template ของ Position ซึ่งคืน `id`, `name`; data รูปแบบนี้เพียงพอสำหรับ checkbox รายการ Template ของ Auto Create

## 4. ส่วนของโค้ดที่เกี่ยวข้องก่อนเริ่ม

### Backend

- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`
  - schema ของ Place/Position/StaffPosition/MinMax/SlotType/SlotTemplate/Slot/Holiday
  - ยืนยันว่า Template→Position และ Template→SlotType ไม่ได้ enforce ว่าอยู่ Position เดียวกัน
  - ห้ามแก้ schema ใน task นี้
- `ecosystem-backend-nest-js/src/common/access-control/access-control.service.ts`
  - `verifyWorkSchedulePositionByWorkScheduleAdmin`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts`
  - endpoint CreateMany/Update/Delete/Get Slot ปัจจุบัน
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.module.ts`
  - register Slot command/query handlers
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.command.ts`
  - DTO pattern ของ Slot command และ UUID v7/ISO validation
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts`
  - reference กติกา StaffPosition, Staff-slot overlap, Holiday, Max, transaction/lock/retry
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.spec.ts`
  - regression reference สำหรับ half-open Holiday overlap, atomic insert และ Serializable retry
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/commands/create.command.ts`
  - ยืนยัน format `HH:mm` และ `durationMinute >= 1`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/commands/create.handler.ts`
  - ยืนยันว่า Template creation ปัจจุบันไม่ได้ validate Slot Type ว่าเป็น Position เดียวกัน
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/queries/get-slot-templates-by-position-id.handler.ts`
  - list Template คืน `id`, `name`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/queries/get-slot-template-by-id.handler.ts`
  - detail Template คืน `slotTypeId`, `startTime`, `durationMinute`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-type/queries/get-slot-types-by-position-id.handler.ts`
  - ยืนยันว่า active Slot Type ใช้ `deletedAt = null`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.handler.ts`
  - ยืนยัน Min/Max ของ Position เดียวกันห้าม overlap
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.command.ts`
  - validation `min`, `max`, `start_time`, `end_time`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`
  - reference half-open interval, Serializable retry, Luxon timezone และ semantic ปัจจุบันของ `min` ใน Holiday flow
- `ecosystem-backend-nest-js/src/modules/work-schedule/staff-position/queries/get-staff-positions-by-position-id.handler.ts`
  - source ของ Staff ใน Position และ order ตาม ID
- `ecosystem-backend-nest-js/package.json`
  - มี `luxon` และ `@types/luxon` อยู่แล้ว

### Frontend

- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/menu/client-page.tsx`
  - จุดเพิ่มเมนู “จัดเวรอัตโนมัติ”
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/page.tsx`
  - reference Server Internal Only + CSR route pattern
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/client-page.tsx`
  - reference query Staff/Place/error/loading pattern
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/client-page.tsx`
  - reference list Template ของ Position
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/create-many-form.tsx`
  - reference Staff selection, Luxon timezone และ submit UX
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/components/create-form.tsx`
  - reference `datetime-local` + Place timezone
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/create-many.api.ts`
  - reference import Zod schema จาก backend, safeParse และ axios pattern
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-create-many.ts`
  - reference Clerk token + React Query invalidate

### Repository verification

- `AGENTS.md`
  - Unit test ต้อง mock Prisma และห้ามต่อ database จริง
  - ให้รัน narrow test ก่อน แล้ว typecheck/lint
  - `pnpm run verify` เป็น standard pre-commit verification และไม่รวม e2e
- `package.json`
  - ยืนยัน root scripts สำหรับ typecheck/lint/build/test/verify

## 5. Business Logic ที่คาดหวังหลัง Implement

### 5.1 API contract ใหม่

เพิ่ม endpoint ของ Slot สำหรับ Admin:

`POST /api/work-schedule/slot/positions/:position_id/auto`

Request body:

```ts
{
  start_time: string;          // ISO 8601 มี offset
  end_time: string;            // ISO 8601 มี offset และต้อง > start_time
  slot_template_ids: string[]; // UUID v7, อย่างน้อย 1, ห้ามซ้ำ
  staff_ids: string[];         // UUID v7, อย่างน้อย 1, ห้ามซ้ำ
}
```

Response เมื่อสำเร็จ:

```ts
{
  createdCount: number;
}
```

กติกา response:

- `createdCount > 0`: จำนวน Slot ที่สร้างจริง
- `createdCount = 0`: success ที่ถูกต้องเมื่อไม่มี Min deficit ที่ต้องเติมภายในช่วง request
- หากมี Min deficit แต่ทำให้ถึง Min ไม่ได้ด้วย Template/Staff ที่เลือก ต้อง reject request ไม่ใช่ตอบ `0`

เหตุผล: Backend ต้องเป็น source of truth เพราะ Slot/Holiday/StaffPosition/Template/MinMax อาจเปลี่ยนพร้อมกันได้

### 5.2 Authorization และ validation ของ selection

ก่อน planning:

1. เรียก `verifyWorkSchedulePositionByWorkScheduleAdmin(clerkId, position_id)` เพื่อ authorize ตาม behavior เดิม
2. DTO ต้อง reject:
   - invalid UUID v7
   - invalid ISO datetime
   - `end_time <= start_time`
   - `slot_template_ids` ว่าง
   - `staff_ids` ว่าง
   - ID ซ้ำภายในแต่ละ array
3. ภายใน Serializable transaction อ่าน selected Templates ใหม่และต้องได้ครบทุก ID
4. Template ทุกตัวต้องมี `workSchedulePositionId === position_id`
5. Slot Type ของ Template ทุกตัวต้อง:
   - `slotType.positionId === position_id`
   - `slotType.deletedAt === null`
6. ภายใน transaction อ่าน selected StaffPosition ใหม่และต้องได้ครบทุก Staff ID โดย `workSchedulePositionId === position_id` และ `deletedAt === null`
7. หาก Template/SlotType/Staff รายการใดไม่ผ่าน ให้ reject ทั้ง request ห้าม silently skip

เหตุผลของข้อ 5: schema/Template create handler ปัจจุบันไม่ enforce cross-relation นี้ จึงต้องกัน Auto Create ไม่ให้สร้าง Slot ที่ Position กับ Slot Type คนละ Position หรือใช้ Slot Type ที่ถูกลบแล้ว โดยไม่เปลี่ยน behavior ของ feature เดิม

### 5.3 Timezone และการสร้าง occurrence จาก Template

ภายใน transaction:

1. อ่าน Position พร้อม Place timezone ที่สัมพันธ์กับ `position_id`
2. parse `start_time` / `end_time` เป็น instant แล้วแปลงมุมมองเป็น Place timezone เมื่อต้องแตก local calendar date
3. สำหรับทุก local date ตั้งแต่ local date ของ request start ถึง local date ของ request end:
   - นำ `Template.startTime` (`HH:mm`) มาประกอบกับ local date ใน Place timezone
   - `occurrenceEnd = occurrenceStart.plus({ minutes: durationMinute })`
4. ถ้า Luxon สร้าง local DateTime ไม่ valid ให้ reject request แทนการเดาเวลา
5. occurrence ที่ใช้เป็น candidate สำหรับสร้าง Slot ต้องอยู่ภายใน request ทั้งช่วง:
   - `occurrenceStart >= requestStart`
   - `occurrenceEnd <= requestEnd`
6. ใช้ Luxon/timezone-aware DateTime สำหรับการประกอบ local time และบวก duration; หลัง resolve เป็น instant แล้วจึงใช้ timestamp/`Date` เพื่อ compare

เหตุผลที่ใช้ทุก local day: Template schema ไม่มี weekday/recurrence field จึงไม่มีข้อมูลรองรับ recurrence แบบอื่นโดยไม่แต่ง Business Logic เพิ่ม

### 5.4 กฎ “Template ห้ามเวลาทับซ้อนกัน”

กติกานี้ต้องตรวจจาก occurrence จริงใน Place timezone ไม่เทียบเพียง string `HH:mm`

1. generate occurrence ของ selected Templates สำหรับ local dates ที่เกี่ยวข้องกับ request
2. สำหรับ overlap validation ให้พิจารณา occurrence ที่มี intersection กับ request เพื่อไม่ให้ Template ที่เลือกซ้อนกันในช่วง scheduling window แม้ occurrence หนึ่งจะถูกตัดออกจาก candidate เพราะเลย request boundary
3. sort ด้วย `start`, `end`, `templateId`
4. overlap ใช้ half-open rule: `a.start < b.end && a.end > b.start`
5. ถ้าพบ overlap ระหว่าง occurrence ใด ๆ ของ selected Templates ให้ reject ทั้ง request
6. ต้องครอบคลุมกรณี duration ข้ามวัน และกรณี occurrence ของ Template เดียวกันซ้อน occurrence วันถัดไป
7. boundary ที่แตะกันพอดี เช่น A จบ 12:00 และ B เริ่ม 12:00 อนุญาต

หลัง overlap validation ให้ใช้เฉพาะ occurrence ที่ fully contained ตามข้อ 5.3 เป็น scheduling candidates

### 5.5 การตีความ Min และการคำนวณ deficit

พิจารณาเฉพาะ `WorkScheduleMinMax` ของ Position ที่:

- ทับกับ request range
- `min != null`

สำหรับ Auto Create เท่านั้น:

- target ของแต่ละ rule คือ intersection ระหว่าง Min rule กับ request range
- `min` คือจำนวน concurrent Slot ของ Position ที่ต้องมีตลอด target interval
- Slot เดิมของ Position ทุก Staff นับเป็น coverage ไม่ว่าจะเป็น Staff ที่ Admin เลือกใน request นี้หรือไม่
- `min = 0` ไม่ต้องสร้างเพิ่ม
- ถ้าไม่มี Min rule ที่ต้องเติม หรือ Slot เดิมทำให้ถึง Min แล้วทุก segment ให้ตอบ `{ createdCount: 0 }`

วิธีคำนวณให้ถูกต้องตลอดช่วง:

1. สำหรับแต่ละ target Min interval สร้าง boundary จาก:
   - target start/end
   - start/end ของ existing Position Slot ที่ตัดผ่าน target
   - start/end ของ candidate Template occurrence ที่ตัดผ่าน target
2. clip boundary ที่มาจาก Slot/occurrence ให้อยู่ใน target, sort และ deduplicate
3. พิจารณา atomic segment ทุกคู่ `[boundary[i], boundary[i+1])`
4. นับ existing Position Slot ที่ครอบ segment นั้นด้วย half-open semantics
5. `deficit = max(0, min - existingCount)`
6. หาก `deficit > 0`:
   - segment ต้องถูกครอบทั้งหมดโดย candidate Template occurrence 1 รายการ
   - เพราะ selected Template occurrences ถูกห้าม overlap จึงต้องมีได้ไม่เกิน 1 occurrence ที่ครอบ segment
   - ถ้าไม่มี occurrence ครอบ segment ให้ reject ทั้ง request เพราะ Template ที่เลือกไม่สามารถทำให้ถึง Min
7. สำหรับ Template occurrence หนึ่งรายการ ให้ `requiredAdditional` เท่ากับ deficit สูงสุดของทุก under-covered segment ที่ occurrence นั้นครอบ
8. occurrence ที่ `requiredAdditional = 0` ไม่ต้องสร้าง Slot ใหม่

เหตุผลของข้อ 7: Slot ที่สร้างจาก occurrence เดียวครอบทุก segment ของ occurrence พร้อมกัน จึงต้องสร้างเท่ากับ deficit สูงสุด ไม่ใช่ sum deficit ของแต่ละ segment

### 5.6 การเลือก Staff ตาม ID

process candidate occurrences ที่ `requiredAdditional > 0` ตามลำดับ:

1. occurrence start จากน้อยไปมาก
2. occurrence end จากน้อยไปมาก
3. `templateId` จากน้อยไปมากเป็น tie-breaker

sort `staff_ids` จากน้อยไปมากก่อนเลือก

Staff คนหนึ่ง “ลงได้” สำหรับ occurrence เมื่อครบทุกเงื่อนไข:

- มี active StaffPosition ของ Position ตาม validation ข้อ 5.2
- ไม่มี existing Slot ของ Staff คนนั้นทับ occurrence ไม่ว่าจะเป็น Position ใด
- ไม่มี Holiday ของ Staff คนนั้นทับ occurrence
- ไม่มี planned Slot ก่อนหน้าจาก request เดียวกันทับ occurrence

จากนั้นเลือก Staff ตาม ID จนครบ `requiredAdditional`

- ID ต่ำกว่าที่ลงไม่ได้ให้ข้ามไป ID ถัดไป
- ห้าม random, round-robin หรือ balance ตามเวรย้อนหลังใน Version นี้
- ถ้า Staff ที่ลงได้ไม่พอ ให้ reject ทั้ง request และห้าม insert บางส่วน

### 5.7 Max ต้องยังถูกบังคับ

ก่อน insert planned Slots:

1. อ่าน MinMax ของ Position ที่ทับ request และ `max != null`
2. สำหรับแต่ละ Max rule ตรวจ concurrency ของ `existing Position Slots + planned Slots` ตลอด intersection กับ request
3. ใช้ atomic boundaries จาก rule start/end, existing slot start/end และ planned slot start/end เพื่อไม่ตรวจเฉพาะจุดเริ่ม
4. หาก segment ใด `concurrent > max` ให้ reject ทั้ง request
5. ใช้ half-open semantics เหมือนส่วนอื่น

กรณีที่ Min บังคับให้สร้าง Slot ซึ่ง Slot นั้นยาวไปทับช่วง Max rule อื่นและทำให้เกิน Max ต้องถือว่า plan ทำไม่ได้และ rollback ทั้งหมด

ห้ามลด/ปิด Max validation ของ manual CreateMany; task นี้เพิ่ม validation ใน Auto Create เท่านั้น

### 5.8 Atomicity และ concurrency

Auto Create ต้องทำ mutable planning state ทั้งหมดใน Serializable transaction เดียวกัน

ก่อน transaction:

- ทำ authorization ด้วย `verifyWorkSchedulePositionByWorkScheduleAdmin`
- DTO validation ทำตาม Nest/Zod pipeline ปกติ

ภายใน transaction ทุก retry:

1. lock Position ด้วย `SELECT ... FOR UPDATE` ตาม pattern ของ CreateMany/MinMax
2. re-read Position + Place timezone
3. re-read selected Templates + related Slot Type
4. re-read selected StaffPositions
5. re-read existing Position Slots และ existing Slots ของ selected Staff
6. re-read Holidays ของ selected Staff
7. re-read MinMax rules
8. generate occurrences และวางแผนใหม่ทั้งหมด
9. validate Template overlap, Min feasibility, Staff availability และ Max
10. `createMany` planned Slots เพียงครั้งเดียวเมื่อทุก validation ผ่าน
11. return `{ createdCount: plannedSlots.length }`

retry behavior:

- ใช้ Serializable transaction
- เมื่อ Prisma error code เป็น `P2034` ให้ retry transaction ใหม่ตาม pattern เดิม
- ต้อง re-read/re-plan ใหม่ทุก retry ห้าม cache planned result จาก attempt ก่อนหน้า
- domain/validation conflict ไม่ retry

ผลที่ต้องได้:

- ไม่มี partial insert
- ไม่มี success จาก plan ที่ถูกคำนวณนอก transaction แล้วนำมาใช้กับ state ใหม่
- concurrent Holiday/Slot/MinMax/StaffPosition/Template change ต้องถูกจัดการด้วย transaction snapshot + Serializable retry semantics ไม่ใช่ frontend preflight

## 6. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

สัญลักษณ์: `A` = เพิ่มไฟล์, `M` = แก้ไฟล์, `-` = ไม่แก้

```text
CURRENT_TASK_PLAN.md                                               - (Implementor ไม่ต้องแก้)
VERIFICATION_TABLE.md                                              - (Implementor ไม่ต้องแก้)

ecosystem-backend-nest-js/
└─ src/modules/work-schedule/slot/
   ├─ slot.controller.ts                                           M
   ├─ slot.module.ts                                               M
   └─ commands/
      ├─ auto-create.command.ts                                    A
      ├─ auto-create.handler.ts                                    A
      ├─ auto-create.handler.spec.ts                               A
      ├─ create-many.command.ts                                    -
      └─ create-many.handler.ts                                    -

ecosystem-frontend-next-js/
└─ src/
   ├─ app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/
   │  ├─ menu/client-page.tsx                                      M
   │  └─ auto/
   │     ├─ page.tsx                                               A
   │     └─ client-page.tsx                                        A
   └─ features/work-schedule/slot/
      ├─ api/mutations/auto-create.api.ts                          A
      ├─ hooks/use-auto-create.ts                                  A
      └─ components/auto-create-form.tsx                           A
```

ไม่คาดหวังการแก้:

- Prisma schema / migration
- manual `create-many` DTO/handler
- Min/Max CRUD
- Holiday CRUD
- Slot Template CRUD
- Slot Type CRUD
- Staff Position CRUD

หาก Implementor พบว่าต้องแก้ไฟล์นอกโครงสร้างนี้เพียงเพื่อ import/type/build ให้แก้ได้เท่าที่จำเป็นและต้องไม่เปลี่ยน Business Logic อื่น หากต้องเปลี่ยน Business Logic ของ module อื่นให้หยุดและแจ้งผู้ใช้ก่อน

## 7. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### 7.1 Backend: `slot/commands/auto-create.command.ts` — A

สร้าง DTO/Command โดยใช้ pattern เดียวกับ Slot commands ปัจจุบัน

Param:

- `position_id`: UUID v7

Body:

- `start_time`: ISO datetime ที่มี offset
- `end_time`: ISO datetime ที่มี offset
- `slot_template_ids`: UUID v7 array, min 1
- `staff_ids`: UUID v7 array, min 1

validation เพิ่มเติม:

- `end_time > start_time`
- `slot_template_ids` ห้ามซ้ำ
- `staff_ids` ห้ามซ้ำ

สร้าง `AutoCreateCommand` เก็บ `clerkId`, param, body

เกณฑ์ผ่าน:

- invalid UUID, invalid datetime, empty array, duplicate ID, `end <= start` ถูก reject ก่อน handler

### 7.2 Backend: `slot/commands/auto-create.handler.ts` — A

Dependency:

- `PrismaService`
- `AccessControlService`
- Luxon `DateTime`

ต้อง implement Business Logic ข้อ 5 ทั้งหมด โดยให้โครง flow ชัดเจน:

1. authorize Position
2. เรียก helper retry ที่เปิด Serializable transaction
3. lock Position
4. query Position + Place timezone
5. query selected Templates พร้อม:
   - `id`
   - `workSchedulePositionId`
   - `slotTypeId`
   - `startTime`
   - `durationMinute`
   - `slotType.positionId`
   - `slotType.deletedAt`
6. validate Template count/ownership/SlotType ownership/SlotType active
7. query selected active StaffPosition links และ validate count
8. generate + sort occurrences, validate overlap
9. query data ที่ใช้ planning:
   - existing Position Slots ที่ทับ request สำหรับ Min/Max
   - existing Slots ของ selected Staff ที่ทับ request ไม่ว่าจะอยู่ Position ใด สำหรับ Staff availability
   - Holidays ของ selected Staff ที่ทับ request
   - MinMax rules ของ Position ที่ทับ request
10. คำนวณ Min deficits ตาม atomic segments
11. assign Staff ตาม ID โดยคำนึง existing + planned Slot/Holiday
12. validate Max ด้วย existing + planned
13. หาก planned list ว่าง return `{ createdCount: 0 }` โดยไม่เรียก `createMany`
14. หากมี planned list เรียก `tx.workScheduleSlot.createMany` ครั้งเดียว
15. return `{ createdCount: plannedSlots.length }`

ข้อกำหนดด้าน determinism:

- sort Template/occurrence ทุกครั้งก่อน planning
- sort selected Staff IDs ascending
- อย่าพึ่ง order จาก Prisma เว้นแต่ query ระบุ `orderBy` และยังต้องรักษา tie-breaker ตามแผน

ข้อห้าม:

- ห้ามเรียก HTTP endpoint CreateMany จาก backend
- ห้ามวางแผนนอก transaction แล้วค่อย insert
- ห้าม silently skip invalid Template/SlotType/Staff
- ห้ามแก้ manual CreateMany behavior
- ห้ามใช้ browser/client timezone เป็น authority
- ห้าม insert ทีละ Slot

เกณฑ์ผ่าน:

- input + DB snapshot เดียวกันให้ assignment เดิม
- Template ที่ Slot Type คนละ Positionหรือถูกลบต้อง fail ก่อน insert
- ไม่มี partial insert เมื่อ Min ทำไม่ได้, Staff ไม่พอ, Holiday/Slot conflict หรือ Max conflict
- rerun เมื่อ Min เต็มแล้วไม่สร้าง Slot เพิ่ม
- `createMany` ถูกเรียกสูงสุดหนึ่งครั้งต่อ successful attempt

### 7.3 Backend: `slot/commands/auto-create.handler.spec.ts` — A

ใช้ mocked Prisma เท่านั้นตาม `AGENTS.md`; ห้ามต่อ database จริง

อย่างน้อยต้องมี cases ต่อไปนี้:

1. Admin authorization ถูกเรียกด้วย Position ที่ส่งมา
2. reject เมื่อ Template ID หาไม่ครบหรือไม่ใช่ Position
3. reject เมื่อ Template อ้าง Slot Type คนละ Position
4. reject เมื่อ Template อ้าง Slot Type ที่ `deletedAt != null`
5. reject เมื่อ Staff ID บางตัวไม่มี active StaffPosition ของ Position
6. generate occurrences ด้วย Place timezone และ reject invalid local DateTime
7. reject selected Template occurrences ที่ overlap รวมกรณีข้ามวัน/Template เดียวกันซ้อนวันถัดไป
8. touching half-open boundary ผ่าน
9. occurrence ที่ไม่ fully contained ใน request ไม่ถูกใช้สร้าง Slot
10. existing Position Slots ถูกนับก่อนคำนวณ Min และ Slot ของ Staff ที่ไม่ได้เลือกก็ยังนับ coverage
11. เมื่อมี deficit เลือก Staff ตาม ID จากน้อยไปมาก
12. Staff ID ต่ำกว่าที่มี existing Slot ทับถูกข้าม แล้วใช้ ID ถัดไป
13. Staff ID ต่ำกว่าที่มี Holiday ทับถูกข้าม แล้วใช้ ID ถัดไป
14. existing Slot ของ Staff ใน Position อื่นทำให้ Staff คนนั้นลง occurrence ไม่ได้
15. planned Slot ก่อนหน้าจาก request เดียวกันทำให้ Staff คนนั้นลง occurrence ที่ overlap ไม่ได้
16. เมื่อไม่มี candidate occurrence ครอบ under-covered Min segment ให้ reject และไม่ insert
17. เมื่อ Staff ที่ลงได้ไม่พอให้ถึง Min ให้ reject และไม่ insert
18. planned + existing Slots ห้ามเกิน Max ตลอด atomic segments
19. `min = 0`, `min = null`, ไม่มี Min rule หรือ Min เต็มแล้ว ต้องไม่สร้าง Slot เพิ่ม
20. success ที่มี plan ใช้ `createMany` ครั้งเดียวและคืน `createdCount` ถูกต้อง
21. success ที่ไม่มี plan คืน `createdCount: 0` และไม่เรียก `createMany`
22. Serializable transaction และ Position lock ถูกใช้
23. `P2034` ทำให้ retry และ re-read/re-plan; domain conflict ไม่ retry

Test fixtures ต้องใช้ UUID v7 ที่ valid และ timestamps ชัดเจน ห้ามพึ่ง timezone ของ test runner

### 7.4 Backend: `slot.controller.ts` — M

- import AutoCreate DTO/Command/response type ตามที่สร้าง
- เพิ่ม `@Post('positions/:position_id/auto')`
- ใช้ `ClerkAuthGuard`
- ส่ง `clerkUser.sub`, param, body เข้า CommandBus
- return `{ createdCount }`
- ห้ามเปลี่ยน path/behavior endpoint เดิม (`@Post(':position_id')` และอื่น ๆ)

เกณฑ์ผ่าน:

- route ใหม่ compile และไม่ชน route เดิม
- manual endpoint เดิมยัง compile/test ผ่าน

### 7.5 Backend: `slot.module.ts` — M

- import/register Auto Create handler ใน `CommandHandlers`
- ไม่สร้าง feature module ใหม่

เกณฑ์ผ่าน:

- Nest dependency resolution ผ่าน build/typecheck

### 7.6 Frontend: `features/work-schedule/slot/api/mutations/auto-create.api.ts` — A

- import `AutoCreateDtoParamSchema` / `AutoCreateDtoBodySchema` จาก backend แบบเดียวกับ `create-many.api.ts`
- `safeParse` param/body ก่อนยิง request
- POST `/api/work-schedule/slot/positions/${positionId}/auto`
- payload ใช้ field backend ตรง ๆ
- response type `{ createdCount: number }`
- ใช้ `apiClient` + Authorization Bearer token ตาม pattern เดิม

เกณฑ์ผ่าน:

- request/response type ตรง Backend
- frontend API client ไม่มี scheduling calculation

### 7.7 Frontend: `features/work-schedule/slot/hooks/use-auto-create.ts` — A

- ใช้ `useMutation` pattern เดียวกับ `use-create-many.ts`
- ขอ Clerk token ก่อนเรียก API
- mutation variables มี `positionId`, `startTime`, `endTime`, `slotTemplateIds`, `staffIds` และ optional error handling parameterเฉพาะถ้าจำเป็นตาม pattern เดิม
- หลัง success invalidate `workScheduleSlotKeys.listsByPositionId(userId, positionId)`

เกณฑ์ผ่าน:

- หลังสร้างอัตโนมัติ Slot list ไม่ค้าง cache เก่า

### 7.8 Frontend: `features/work-schedule/slot/components/auto-create-form.tsx` — A

Form ต้องมี:

- `start_time` แบบ `datetime-local`
- `end_time` แบบ `datetime-local`
- checkbox Template ทั้งหมดของ Position
- checkbox Staff ทั้งหมดของ Position
- ปุ่ม cancel
- submit button ที่ disabled ระหว่าง mutation

Validation ขั้นต่ำฝั่ง UI:

- ต้องเลือก Template อย่างน้อย 1
- ต้องเลือก Staff อย่างน้อย 1
- start/end ต้องมีค่าและ end > start

ก่อนส่ง:

- แปลง `datetime-local` ด้วย Place timezone ตาม Luxon pattern ของ MinMax form
- ตรวจ `DateTime.isValid`; ถ้า invalid ให้แสดง validation error และห้ามส่ง
- ส่งเฉพาะ selected Template IDs + Staff IDs + ISO start/end
- ห้าม frontend generate Slot หรือคำนวณ Min/Max/availability

หลังส่ง:

- `createdCount > 0`: toast success พร้อมจำนวนที่สร้าง แล้วกลับหน้า Slot ของ Position
- `createdCount === 0`: แจ้งว่าไม่มี Slot ที่ต้องเพิ่มในช่วงที่เลือก แล้วกลับหน้า Slot
- error: ไม่ redirect เป็น success และเปิดให้ผู้ใช้แก้ช่วงเวลา/selection แล้ว submit ใหม่

เลือกทำ select-all/clear-all สำหรับ Template/Staff ได้ แต่ไม่ใช่ acceptance requirement

เกณฑ์ผ่าน:

- UI ไม่ submit input ที่ไม่ครบ
- timezone conversion ใช้ Place timezone ไม่ใช้ browser timezone โดยปริยาย

### 7.9 Frontend: `app/.../slot/new/auto/page.tsx` — A

- ใช้ Server Internal Only + CSR pattern แบบ sibling route
- resolve `placeId`, `positionId` แล้วส่งให้ `client-page.tsx`
- task นี้ไม่มี query param เพิ่ม จึงไม่ต้องเพิ่ม validation logic ที่ไม่จำเป็น

### 7.10 Frontend: `app/.../slot/new/auto/client-page.tsx` — A

query พร้อมกัน:

- Slot Templates by Position
- Staff Positions by Position
- Place by ID เพื่อ timezone

ใช้ pattern เดิมของ `useAuth`, `useQuery`, `useEffectCheckError`, Redirect UI, Error และ Loading

การ reuse error/loading:

- สามารถ import sibling `../error-code-redirect-list`, `../error`, `../loading` หาก path/type ใช้ได้ตรง ๆ
- ถ้า TypeScript/Next route boundary บังคับให้มีไฟล์เฉพาะ route ให้เพิ่มเฉพาะไฟล์ที่จำเป็นต่อ compile และไม่เปลี่ยน Business Logic

render behavior:

- ไม่มี Template: แสดงข้อความให้ Admin สร้าง Template ก่อนและไม่ render form ที่ submit ได้
- ไม่มี StaffPosition: แสดงข้อความให้ Admin เพิ่ม Staff ก่อนและไม่ render form ที่ submit ได้
- มีข้อมูลครบ: render `AutoCreateForm`
- back/cancel: `.../slot/new/menu`
- success: `.../slot`

หมายเหตุ: Auto page ใช้ list Template แค่ `id`, `name`; validation Slot Type ownership/active เป็นหน้าที่ Backend ตามข้อ 5.2

### 7.11 Frontend: `slot/new/menu/client-page.tsx` — M

เพิ่ม MenuCard ใหม่:

- href: `.../slot/new/auto`
- title สื่อว่า “จัดเวรอัตโนมัติ”
- description สื่อว่าเลือกช่วงเวลา + Template + พนักงานเพื่อเติมจำนวนขั้นต่ำ
- reuse icon เดิมได้

ห้ามแก้ href/behavior ของ 2 เมนูเดิม

เกณฑ์ผ่าน:

- Admin เข้า Auto Create ได้จาก flow เดิม
- manual/prefill navigation เดิมไม่เปลี่ยน

## 8. ลำดับ Implementation ที่ Implementor ต้องทำ

### ขั้นที่ 1 — Backend contract

- เพิ่ม `auto-create.command.ts`
- ต่อ route/controller/module
- ให้ typecheck ผ่านก่อนเริ่ม logic ยาวถ้าทำได้

ผ่านเมื่อ:

- DTO tests หรือ compile ยืนยัน schema ถูกต้อง
- route/module compile

### ขั้นที่ 2 — Backend planner + tests

- implement transaction/retry
- Template/SlotType/Staff validation
- occurrence generation/overlap
- Min deficit
- Staff assignment
- Max validation
- insert/return
- เพิ่ม `auto-create.handler.spec.ts`

ผ่านเมื่อ:

- auto handler tests ผ่าน
- `create-many.handler.spec.ts` regression ผ่าน
- backend typecheck/lint ผ่าน

### ขั้นที่ 3 — Frontend

- API mutation
- hook
- form
- auto page/client page
- menu entry

ผ่านเมื่อ:

- frontend typecheck/lint/build ผ่าน
- payload ตรง backend contract
- ไม่มี scheduling logic รั่วมาอยู่ frontend

### ขั้นที่ 4 — Full verification

ผ่านเมื่อ:

- `pnpm run verify` ผ่าน
- ไม่มี Prisma schema/migration change
- diff ไม่แก้ manual CreateMany/MinMax/Holiday/Template/SlotType/StaffPosition Business Logic โดยไม่ได้วางแผน

## 9. สิ่งที่ Implementor ต้องระวัง

- ห้ามแก้ข้อความไอเดียต้นฉบับในไฟล์นี้
- ห้ามเปลี่ยน semantic ของ Holiday `min`; task นี้เพิ่ม semantic สำหรับ Auto planner เท่านั้น
- ห้ามตีความ “เรียงตาม ID” เป็น round-robin/random/fairness
- ห้ามนับเฉพาะ selected Staff เป็น Min coverage; existing Slot ของ Position ทุก Staff ต้องนับ
- ห้ามถือว่า Staff ไม่มี Slot ใน Position นี้แล้วว่าง ต้องตรวจ Slot ทุก Position
- ห้ามถือว่า Staff ว่างเมื่อมี Holiday ทับ
- ห้ามเชื่อ `slotTypeId` ใน Template โดยไม่ตรวจว่า Slot Type เป็น Position เดียวกันและยัง active
- ห้ามแก้ Template CRUD/Slot Type CRUD เพื่อแก้ validation gap นี้ใน task ปัจจุบัน
- ห้ามใช้ browser timezone เป็น authority ใน planner
- ห้ามเทียบ Template overlap แค่ `HH:mm`; duration อาจข้ามวันและ DST อาจเปลี่ยน offset
- ห้ามสร้าง Slot จาก occurrence ที่เลย request boundary
- ห้ามถือ `end === start` ว่า overlap
- ห้ามลด/ปิด Max เพื่อให้ Min ผ่าน
- ห้าม sum deficit ของหลาย segment ใน occurrence เดียว; ใช้ deficit สูงสุดของ occurrence
- ห้าม insert ทีละ Slot หรือปล่อย partial result
- ห้าม reuse plan จาก Serializable attempt ที่เจอ `P2034`
- ห้ามพึ่ง Prisma/database row order สำหรับ logic deterministic
- ห้ามแก้ business behavior ของ `create-many.handler.ts`; ใช้เป็น reference/regression guard
- Unit test ต้อง mock Prisma และห้ามต่อ DB จริง

## 10. Tests และคำสั่งตรวจสอบ

จาก repository root

### Narrow backend tests

```bash
pnpm --dir ecosystem-backend-nest-js run test -- auto-create.handler.spec.ts --runInBand
pnpm --dir ecosystem-backend-nest-js run test -- create-many.handler.spec.ts --runInBand
```

ถ้า argument forwarding ของ script ใช้ไม่ได้ ให้ใช้:

```bash
pnpm --dir ecosystem-backend-nest-js exec jest src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts --runInBand
pnpm --dir ecosystem-backend-nest-js exec jest src/modules/work-schedule/slot/commands/create-many.handler.spec.ts --runInBand
```

### Static/build checks

```bash
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run build:backend
pnpm run build:frontend
```

### Standard repository verification

```bash
pnpm run verify
```

`pnpm run verify` เป็น standard pre-commit verification ของ repository และครอบคลุม frontend tests, Prisma validate/generate, backend/frontend typecheck, lint, builds, backend tests และ migration tests

ไม่บังคับ `pnpm run test:e2e` ใน task นี้ เพราะ `AGENTS.md` ระบุว่า e2e อาจต้องใช้ deployment-specific environment/database; รันเฉพาะเมื่อ environment พร้อม และห้ามเชื่อม/แก้ shared database โดยไม่ได้รับอนุญาต

## 11. Definition of Done

งาน Implement ผ่านเมื่อครบทั้งหมด:

- Admin มีเมนูและหน้า Auto Create ใหม่
- Admin เลือกช่วงเวลา, Template หลายรายการ และ Staff หลายคนได้
- Backend reject Template ที่ไม่ใช่ Position, Slot Type คนละ Position หรือ Slot Type ถูกลบ
- Template occurrences ที่ทับกันใน scheduling window ถูกปฏิเสธ รวมข้ามวัน
- ระบบเติม Slot เท่าที่จำเป็นให้ถึง Min ในทุก under-covered atomic segment ของช่วง request
- existing Slot ของ Position ทุก Staff ถูกนับก่อนเติม Min
- การเลือก Staff deterministic ตาม ID และข้ามคนที่ติด Slot/Holiday/planned overlap
- ไม่สร้างเกิน Max
- ถ้า Min ทำไม่ได้ด้วย Template/Staff ที่เลือก request ต้องล้มทั้งชุด
- ไม่มี partial insert
- Serializable retry re-read/re-plan ทุก attempt
- manual Slot creation, Holiday, MinMax, Template, SlotType และ StaffPosition Business Logic เดิมไม่เปลี่ยน
- ไม่มี Prisma schema/migration change
- narrow tests และ `pnpm run verify` ผ่านใน environment ของ Implementor
