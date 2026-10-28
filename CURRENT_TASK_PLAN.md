# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ต้องการสร้างระบบสำหรับจัดตารางเวรอัตโนมัติโดยเป็น feature ใหม่ ของ admin โดยให้เลือกช่วงเวลาเริ่มต้นและสิ้นที่จะจัดเวรอัตโนมัติ และต้องมีให้เลือกว่าจะเลือก Template แบบไหนที่จะนำมาจัดเวรบ้างครับ โดยห้าม Template ที่เวลาทับซ้อนกันสำหรับ Version นี้ครับ แล้วก็ให้เลือกว่าจะเลือกพนักงานคนไหนที่จะนำมาจัดตารางเวรครับ แล้วก็การลงข้อมูลสำหรับ Version แรกนี้ ให้ลงพนักงานที่ลงได้ไล่ตาม ID ได้เลย โดยให้ลงให้ถึงจำนวนขั้นต่ำสำหรับแต่ละช่วงเวลา

## 2. ขอบเขตของ Version นี้

- เป็น feature ใหม่สำหรับ Admin ของ Work Schedule ภายใต้ตำแหน่งงาน (Position) เดิม
- เพิ่มวิธีสร้าง Slot แบบอัตโนมัติ โดยไม่เปลี่ยนพฤติกรรมของการสร้าง Slot แบบ manual และแบบใช้ Template ที่มีอยู่
- Admin ต้องเลือก:
  - ช่วงเวลา `start_time` ถึง `end_time` ที่ต้องการให้ระบบจัดเวร
  - Slot Template อย่างน้อย 1 รายการ
  - พนักงานของ Position อย่างน้อย 1 คน
- Version นี้ใช้กติกา deterministic แบบง่ายตามไอเดียต้นฉบับ: เมื่อจำเป็นต้องเพิ่มพนักงาน ให้พิจารณา `staffId` จากน้อยไปมาก และเลือกคนแรกที่ลงเวรช่วงนั้นได้
- Version นี้ไม่ทำ optimization, balancing, randomization, rotation, fairness ตามจำนวนเวรย้อนหลัง หรือ backtracking เพื่อหาชุดคำตอบที่ดีที่สุด
- Version นี้ไม่เพิ่ม/แก้ Prisma model และไม่ต้องมี migration เพราะข้อมูลที่ต้องใช้มีอยู่แล้วใน `WorkScheduleSlotTemplate`, `WorkScheduleStaffPosition`, `WorkScheduleMinMax`, `WorkScheduleSlot`, `WorkScheduleHoliday` และ timezone ของ Place
- ช่วงเวลาทั้งหมดใช้หลัก half-open interval `[start, end)` เช่นเดียวกับ logic overlap ปัจจุบัน: ช่วงที่ปลายของรายการหนึ่งเท่ากับต้นของอีกรายการถือว่าไม่ทับกัน

## 3. Business Logic ที่เกี่ยวข้องก่อนเริ่ม

### 3.1 Slot และการสร้าง Slot ปัจจุบัน

- `WorkScheduleSlot` ผูกกับ Position, Staff และ Slot Type และเก็บ `actualStartTime` / `actualEndTime` เป็น `Timestamptz`
- การสร้าง Slot แบบหลายรายการ (`CreateMany`) ปัจจุบัน:
  - ตรวจสิทธิ์ Admin ของ Position ก่อน
  - ตรวจว่า Staff ทุกคนที่ส่งมามี `WorkScheduleStaffPosition` ของ Position และ link นั้นยังไม่ถูกลบ
  - ปฏิเสธ Slot ที่ทับกันภายใน payload สำหรับ Staff คนเดียวกัน
  - ตรวจ Slot เดิมที่ทับกับช่วงคำขอ โดย Staff คนเดียวกันห้ามมี Slot ทับกันแม้จะเป็นคนละ Position
  - ตรวจ Holiday ของ Staff และปฏิเสธหาก Holiday ทับกับ Slot
  - ตรวจ `WorkScheduleMinMax.max` ของ Position และปฏิเสธเมื่อจำนวน Slot พร้อมกันเกิน `max`
  - ทำงานใน Serializable transaction, lock Position และ retry เมื่อ Prisma แจ้ง serialization conflict (`P2034`)
  - ทั้ง batch เป็นลักษณะ all-or-nothing; หาก validation ใดไม่ผ่านจะไม่ insert บางส่วน

### 3.2 Min/Max ปัจจุบัน

- `WorkScheduleMinMax` มี `min`, `max`, `startTime`, `endTime` ต่อ Position
- `min` หรือ `max` อย่างน้อยหนึ่งค่าต้องมี; หากมีทั้งคู่ `min <= max`
- Min/Max ของ Position เดียวกันถูกห้ามไม่ให้มีช่วงเวลาทับซ้อนกันตั้งแต่ตอนสร้าง
- การสร้าง Slot ปัจจุบันใช้ `max` เป็นข้อจำกัดจำนวน Slot พร้อมกัน แต่ยังไม่มี flow ที่สร้าง Slot อัตโนมัติเพื่อเติมจำนวนให้ถึง `min`
- Holiday flow ใช้ `min` เพื่อป้องกันการอนุมัติวันหยุดจนจำนวนพนักงานที่พร้อมทำงานต่ำกว่า Min ซึ่งยืนยันว่า Min เป็นข้อกำหนดขั้นต่ำด้านกำลังคนของ Position

### 3.3 Slot Template ปัจจุบัน

- `WorkScheduleSlotTemplate` เก็บ:
  - `workSchedulePositionId`
  - `slotTypeId`
  - `name`
  - `startTime` รูปแบบ `HH:mm`
  - `durationMinute`
- Template ปัจจุบันเป็นแบบร่างช่วยกรอกการสร้าง Slot; ยังไม่สร้าง Slot เอง
- Template ไม่มี field วันในสัปดาห์หรือ recurrence ดังนั้นสำหรับ Version นี้ เมื่อเลือก Template ระบบจะถือว่า Template นั้นเป็น candidate ของทุก local calendar day ภายในช่วงที่ Admin เลือก
- เวลาจริงของ candidate ต้องสร้างจาก `startTime` ของ Template ใน timezone ของ Work Schedule Place แล้วบวก `durationMinute`

### 3.4 Staff ของ Position ปัจจุบัน

- รายการ Staff ที่ใช้กับ Position มาจาก `WorkScheduleStaffPosition` ที่ `deletedAt = null`
- Query ปัจจุบันคืน `staffId` และชื่อของ Staff และเรียงตาม `workScheduleStaffId` จากน้อยไปมาก
- การจัดเวรอัตโนมัติจะใช้เฉพาะ Staff ที่ Admin เลือกจากกลุ่มนี้เท่านั้น

### 3.5 Frontend ปัจจุบัน

- หน้า `slot/new/menu` มี 2 วิธีสร้าง Slot: ใช้แบบร่าง และไม่ใช้แบบร่าง
- Manual create page มี pattern ที่ใช้ได้กับ feature นี้อยู่แล้ว:
  - query Slot Template
  - query Staff Position
  - query Place เพื่อเอา timezone
  - แปลง `datetime-local` เป็น ISO ด้วย Luxon และ timezone ของ Place ก่อนส่ง Backend
  - ใช้ React Query mutation และ invalidate Slot list หลังสร้างสำเร็จ

## 4. ส่วนของโค้ดที่เกี่ยวข้องก่อนเริ่ม

### Backend

- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`
  - มี schema ของ Place/Position/StaffPosition/MinMax/SlotType/SlotTemplate/Slot/Holiday ครบแล้ว
  - ห้ามแก้ schema ใน task นี้
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts`
  - endpoint สำหรับ CreateMany/Update/Delete/Get Slot อยู่ที่ controller นี้
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.module.ts`
  - register Slot command/query handlers
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.command.ts`
  - DTO ของ batch create ปัจจุบัน
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts`
  - แหล่งอ้างอิงกติกา Staff Position, Staff-slot overlap, Holiday, Max, transaction/lock/retry ที่ Auto Create ต้องรักษาให้สอดคล้อง
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.spec.ts`
  - regression reference สำหรับ half-open overlap, Holiday และ Serializable retry
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/queries/get-slot-templates-by-position-id.handler.ts`
  - list Template ของ Position ปัจจุบันคืน `id`, `name`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot-template/queries/get-slot-template-by-id.handler.ts`
  - detail Template ยืนยัน field `slotTypeId`, `startTime`, `durationMinute`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.handler.ts`
  - ยืนยันว่า Min/Max ของ Position เดียวกันห้ามทับกัน
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.command.ts`
  - validation `min`, `max`, `start_time`, `end_time`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`
  - reference เรื่อง Min, half-open interval, Serializable transaction และ timezone handling
- `ecosystem-backend-nest-js/src/modules/work-schedule/staff-position/queries/get-staff-positions-by-position-id.handler.ts`
  - source ของ Staff ที่สังกัด Position

### Frontend

- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/menu/client-page.tsx`
  - จุดเพิ่มเมนู “จัดเวรอัตโนมัติ”
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/client-page.tsx`
  - reference สำหรับ query Template/Staff/Place และ error/loading pattern
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/client-page.tsx`
  - reference สำหรับการแสดงรายการ Template ให้เลือก
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/create-many-form.tsx`
  - reference สำหรับเลือก Staff, timezone conversion และ UX ของการสร้าง Slot
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/components/create-form.tsx`
  - reference สำหรับ input `datetime-local` และการแปลงเป็น ISO ตาม Place timezone
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/create-many.api.ts`
  - reference API mutation
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-create-many.ts`
  - reference React Query mutation และการ invalidate Slot list

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

เหตุผล:
- Backend ต้องเป็น source of truth ของการจัดเวร ไม่ให้ frontend คำนวณผลลัพธ์แล้วส่ง Slot ที่จัดเสร็จมาเอง เพราะข้อมูล Slot/Holiday/MinMax อาจเปลี่ยนพร้อมกันได้
- `createdCount = 0` เป็น success ที่ถูกต้องเมื่อจำนวน Slot เดิมถึง Min ครบทุกช่วงที่เกี่ยวข้องแล้ว

### 5.2 Authorization และ validation ของ selection

ก่อนวางแผน Slot:

1. ใช้ `verifyWorkSchedulePositionByWorkScheduleAdmin(clerkId, position_id)` เหมือน CreateMany ปัจจุบัน
2. Template ID ทุกตัวต้องมีอยู่และต้องเป็นของ `position_id` เดียวกัน
3. Staff ID ทุกตัวต้องมี active `WorkScheduleStaffPosition` (`deletedAt = null`) ของ `position_id` เดียวกัน
4. หาก Template หรือ Staff ที่ส่งมามีบางรายการไม่ถูกต้อง ให้ reject ทั้ง request ห้ามเงียบแล้วตัดรายการนั้นทิ้ง
5. DTO ต้อง reject array ที่ว่างและ ID ซ้ำ เพื่อให้ผลลัพธ์ deterministic

### 5.3 การสร้างช่วงเวลาจาก Template

1. อ่าน timezone จาก Work Schedule Place ของ Position
2. แปลง `start_time` / `end_time` เป็น instant จริง แต่ใช้ timezone ของ Place เมื่อต้องแตกเป็น local calendar date
3. สำหรับทุก local date ตั้งแต่วันที่ของ `start_time` ถึงวันที่ของ `end_time`:
   - นำ `Template.startTime` (`HH:mm`) มาประกอบกับ local date ใน Place timezone
   - `candidateEnd = candidateStart + durationMinute`
4. รับ candidate เป็น Slot occurrence เฉพาะเมื่อทั้ง occurrence อยู่ภายในช่วงที่ Admin เลือก:
   - `candidateStart >= requestStart`
   - `candidateEnd <= requestEnd`
5. การบวก duration ต้องใช้ Luxon/timezone-aware DateTime ไม่ใช้การบวก string หรือสมมติว่าทุกวันยาว 24 ชั่วโมง เพื่อไม่ทำเวลาเพี้ยนเมื่อ timezone มี DST
6. ถ้า local DateTime ที่สร้างได้ไม่ valid ให้ reject request แทนการสร้างเวลาโดยเดา

เหตุผลที่ใช้ “ทุกวัน” ใน Version นี้: schema ของ Template มีเฉพาะเวลาเริ่มและ duration ไม่มี weekday/recurrence rule จึงไม่มีข้อมูลอื่นที่รองรับรูปแบบ recurrence แบบอื่นโดยไม่แต่ง Business Logic เพิ่ม

### 5.4 กฎ “Template ห้ามเวลาทับซ้อนกัน” ของ Version นี้

หลัง generate occurrences แล้ว:

1. sort occurrence ด้วย `start`, `end`, `templateId`
2. ตรวจ overlap ด้วยกติกา half-open (`a.start < b.end && a.end > b.start`)
3. หาก occurrence จาก Template ที่เลือกทับกันแม้เพียงคู่เดียว ให้ reject ทั้ง request ก่อน insert
4. ต้องตรวจรวมกรณี Template ข้ามวันด้วย ไม่ใช่เปรียบเทียบแค่ string `HH:mm`
5. ช่วงที่แตะกันพอดี เช่น Template A จบ 12:00 และ Template B เริ่ม 12:00 อนุญาต

เหตุผล: ตรงตามข้อกำหนด Version แรกและทำให้ 1 ช่วงเวลาอยู่ภายใต้ candidate Template ได้ไม่เกินหนึ่ง occurrence ซึ่งทำให้ algorithm เติม Min deterministic และตรวจสอบได้ง่าย

### 5.5 วิธีตีความ Min และการคำนวณจำนวนที่ต้องเพิ่ม

- พิจารณาเฉพาะ `WorkScheduleMinMax` ของ Position ที่:
  - ทับกับ request range
  - `min != null`
- target ของแต่ละ rule คือ intersection ระหว่าง Min rule กับ request range เท่านั้น
- Slot เดิมของ Position ทุกคนต้องถูกนับเป็น coverage ของ Min ไม่ว่าจะเป็น Staff ที่ Admin เลือกใน request นี้หรือไม่ เพราะ Min เป็นข้อกำหนดระดับ Position
- `min = 0` ไม่ต้องสร้าง Slot เพิ่ม
- หากไม่มี Min rule ที่ต้องเติม หรือ Slot เดิมทำให้ถึง Min แล้วทุก segment ให้ตอบ `createdCount: 0`

เพื่อให้ Min ถูกต้องตลอดทั้งช่วง ไม่ใช่เฉพาะจุดเริ่ม:

1. สำหรับแต่ละ target Min interval สร้าง boundary จาก:
   - target start/end
   - start/end ของ Slot เดิมของ Position ที่ตัดผ่าน target
   - start/end ของ generated Template occurrence ที่ตัดผ่าน target
2. sort/deduplicate boundary แล้วพิจารณาแต่ละ atomic segment `[boundary[i], boundary[i+1])`
3. นับจำนวน Slot เดิมของ Position ที่ครอบ segment นั้น
4. ถ้าจำนวนเดิม `< min`:
   - segment นั้นต้องถูกครอบทั้งหมดโดย generated Template occurrence 1 รายการ
   - ถ้าไม่มี occurrence ครอบ segment ให้ถือว่าไม่สามารถทำให้ถึง Min ด้วย Template ที่ Admin เลือก และ reject ทั้ง request
5. สำหรับ Template occurrence หนึ่งรายการ ให้จำนวน Slot ใหม่ที่ต้องสร้างเท่ากับ deficit สูงสุดของทุก under-covered segment ที่ occurrence นั้นครอบ เพื่อให้ Slot ชุดเดียวเติมทุก segment ของ occurrence ได้โดยไม่สร้างเกินความจำเป็น

### 5.6 การเลือก Staff ตาม ID

สำหรับแต่ละ Template occurrence ให้ process ตามลำดับ:

1. occurrence start จากน้อยไปมาก
2. occurrence end จากน้อยไปมาก
3. `templateId` จากน้อยไปมากเป็น tie-breaker

ก่อนเลือก Staff ให้ sort `staff_ids` จากน้อยไปมาก และ Staff คนหนึ่ง “ลงได้” เมื่อครบทุกเงื่อนไข:

- มี active StaffPosition ของ Position นี้ตาม validation ข้อ 5.2
- ไม่มี Slot เดิมของ Staff คนนั้นทับกับ occurrence ไม่ว่าจะเป็น Slot ของ Position ใด
- ไม่มี Holiday ของ Staff คนนั้นทับกับ occurrence
- ไม่มี Slot ที่วางแผนไว้ก่อนหน้าใน auto request เดียวกันทับกับ occurrence

จากนั้นเลือก Staff ที่ลงได้ตามลำดับ ID จนครบ `requiredAdditional` ของ occurrence

- ถ้า Staff ID ต่ำกว่าลงไม่ได้ ให้ข้ามไป ID ถัดไป
- ห้ามสลับลำดับด้วย random หรือจำนวนเวรเดิมใน Version นี้
- ถ้าจำนวน Staff ที่ลงได้ไม่พอให้ถึง Min ให้ reject ทั้ง request และห้าม insert Slot บางส่วน

เหตุผล: ตรงตามไอเดีย “ลงพนักงานที่ลงได้ไล่ตาม ID” และให้ผลลัพธ์เดิมเมื่อ database state เดิม

### 5.7 Max ต้องยังถูกบังคับ

ก่อน insert planned Slot ทั้งชุด:

- ตรวจ `WorkScheduleMinMax` ที่ `max != null` และทับกับ request range
- นับ concurrency ของ `existing position slots + planned slots` ทุก atomic segment ด้วย half-open semantics
- หาก segment ใดเกิน `max` ให้ reject ทั้ง request
- ห้าม bypass หรือทำให้กติกา Max ของ CreateMany ปัจจุบันอ่อนลง

กรณีที่ Min ของช่วงหนึ่งบังคับให้สร้าง Slot ซึ่ง Slot นั้นยาวไปทับช่วง Max rule อื่นและทำให้เกิน Max ต้องถือว่าแผนนี้ทำไม่ได้และ rollback ทั้งหมด

### 5.8 Atomicity และ concurrency

Auto Create ต้องทำ planning + final validation + insert ใน Serializable transaction เดียวกัน เพราะข้อมูลต่อไปนี้เปลี่ยนพร้อมกันได้:

- existing Slot
- Holiday
- Min/Max
- StaffPosition
- Template

ภายใน transaction:

1. lock Position ด้วย `SELECT ... FOR UPDATE` ตาม pattern ของ CreateMany ปัจจุบัน
2. อ่านข้อมูลที่ใช้วางแผนใหม่ทุกครั้งภายใน transaction
3. วางแผน Slot
4. validate Staff overlap/Holiday/Min/Max ด้วย state ใน transaction
5. `createMany` planned Slot เพียงครั้งเดียวเมื่อทุก validation ผ่าน
6. เมื่อ Prisma เป็น `P2034` ให้ retry ด้วย Serializable transaction ใหม่ตาม pattern เดิม; ต้องคำนวณแผนใหม่ทุก retry ห้าม reuse planned result จาก attempt ก่อนหน้า
7. domain/validation conflict ไม่ต้อง retry

ผลที่ต้องได้คือไม่มีกรณีที่ request สำเร็จครึ่งหนึ่ง หรือใช้แผนจากข้อมูลเก่าหลังเกิด concurrent update

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
- Slot Template CRUD
- Staff Position CRUD

หากระหว่าง Implement พบว่าต้องแก้ไฟล์นอกโครงสร้างนี้เพื่อให้ compile เท่านั้น ให้แก้ได้เท่าที่จำเป็นและต้องไม่เปลี่ยน Business Logic อื่น; หากต้องเปลี่ยน Business Logic นอกขอบเขตให้หยุดและแจ้งผู้ใช้ก่อน

## 7. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### 7.1 Backend: `slot/commands/auto-create.command.ts` — A

- สร้าง Zod DTO param `position_id` UUID v7
- สร้าง body schema ตาม contract ในข้อ 5.1
- `slot_template_ids` และ `staff_ids`:
  - array min 1
  - element UUID v7
  - refine ให้ไม่มีค่าซ้ำ
- refine `end_time > start_time`
- สร้าง `AutoCreateCommand` เก็บ `clerkId`, param, body

เกณฑ์ผ่าน:
- invalid UUID, empty array, duplicate ID, invalid datetime, `end <= start` ถูก reject ก่อนเข้า handler

### 7.2 Backend: `slot/commands/auto-create.handler.ts` — A

- implement Business Logic ข้อ 5 ทั้งหมด
- ใช้ Prisma + AccessControlService ที่มีอยู่
- ใช้ Luxon สำหรับ Place timezone และ Template occurrence
- ใช้ `Date`/timestamp สำหรับ comparison หลัง resolve timezone แล้ว
- query Existing Slot ให้ได้สองมุมที่ต่างกัน:
  - Slot ของ Position ทั้งหมดที่ทับ request เพื่อคำนวณ Min/Max
  - Slot ของ selected Staff ที่ทับ request ไม่ว่าจะอยู่ Position ใด เพื่อเช็กว่า Staff ลงได้หรือไม่
- query Holiday ของ selected Staff ที่ทับ request
- query MinMax ของ Position ที่ทับ request
- query selected Template details ภายใน transaction
- query selected StaffPosition links ภายใน transaction
- sort ทุก collection ที่มีผลต่อผลลัพธ์ก่อนใช้ เพื่อไม่ให้ผลขึ้นกับ order ที่ Prisma/database คืนมา
- insert เฉพาะเมื่อวางแผนและ validation ผ่านทั้งหมด
- return `{ createdCount: plannedSlots.length }`

ข้อห้าม:
- ห้ามเรียก HTTP endpoint CreateMany จาก backend
- ห้ามวางแผนนอก transaction แล้วค่อย insert ใน transaction อื่น
- ห้าม silently skip Template/Staff ID ที่ไม่ถูกต้อง
- ห้ามแก้ manual CreateMany behavior เพื่อให้ Auto Create ทำงาน

เกณฑ์ผ่าน:
- DB state เดียวกัน + input เดียวกัน ต้องได้ Staff assignment เดิม
- ไม่มี partial insert เมื่อทำ Min ไม่สำเร็จหรือชน Max/Holiday/Slot
- rerun หลัง Min เต็มแล้วต้องไม่สร้าง Slot เกิน Min โดยไม่มีเหตุผล

### 7.3 Backend: `slot/commands/auto-create.handler.spec.ts` — A

ใช้ mocked Prisma เท่านั้นตาม `AGENTS.md`; ห้ามต่อ database จริง

อย่างน้อยต้องมี test cases:

1. Admin authorization ถูกเรียกด้วย Position ที่ส่งมา
2. reject เมื่อ Template บาง ID ไม่ใช่ของ Position/หาไม่ครบ
3. reject เมื่อ Staff บาง ID ไม่มี active StaffPosition ของ Position
4. reject generated Template occurrences ที่ overlap รวมกรณีข้ามวัน; boundary ที่แตะกันพอดีต้องผ่าน
5. existing Position slots ถูกนับก่อนคำนวณ Min และ Staff ที่ไม่ได้เลือกก็ยังนับ coverage
6. เมื่อมี deficit ให้เลือก Staff ตาม ID จากน้อยไปมาก
7. Staff ID ต่ำกว่าที่มี existing Slot ทับหรือ Holiday ทับถูกข้าม แล้วใช้ ID ถัดไป
8. existing Slot ของ Staff ใน Position อื่นก็ทำให้ Staff คนนั้นลง occurrence ไม่ได้
9. เมื่อไม่มี Template occurrence ครอบ under-covered Min segment ให้ reject และไม่ insert
10. เมื่อ Staff ที่ลงได้ไม่พอให้ถึง Min ให้ reject และไม่ insert
11. planned slots + existing slots ห้ามเกิน Max
12. `min = 0`, `min = null`, หรือ Min เต็มแล้ว ต้องไม่สร้าง Slot เพิ่ม
13. success ใช้ `createMany` ครั้งเดียวและคืน `createdCount` ถูกต้อง
14. Serializable transaction และ Position lock ถูกใช้
15. `P2034` ทำให้ retry และ re-read/re-plan; domain conflict ไม่ retry

### 7.4 Backend: `slot.controller.ts` — M

- import AutoCreate DTO/Command
- เพิ่ม `@Post('positions/:position_id/auto')`
- ใช้ `ClerkAuthGuard`
- ส่ง `request.auth.userId`, param, body เข้า CommandBus
- return `{ createdCount }` จาก handler
- ห้ามเปลี่ยน path หรือ behavior ของ endpoint เดิม

เกณฑ์ผ่าน:
- endpoint ใหม่ไม่ชน route เดิม และ endpoint เดิมยัง compile/ทำงานตาม test เดิม

### 7.5 Backend: `slot.module.ts` — M

- register `AutoCreateHandler` ใน `CommandHandlers`
- ไม่สร้าง WorkSchedule feature module ใหม่ เพราะ Auto Create เป็น lifecycle ของ Slot และใช้ controller เดิม

เกณฑ์ผ่าน:
- Nest dependency resolution ผ่าน build/typecheck

### 7.6 Frontend: `features/work-schedule/slot/api/mutations/auto-create.api.ts` — A

- POST ไป `/api/work-schedule/slot/positions/${positionId}/auto`
- payload ใช้ชื่อ field ตาม DTO backend โดยตรง
- return type `{ createdCount: number }`
- ใช้ axios/error handling pattern เดียวกับ `create-many.api.ts`

เกณฑ์ผ่าน:
- type ของ request/response ตรงกับ backend และไม่ทำ scheduling calculation ใน API client

### 7.7 Frontend: `features/work-schedule/slot/hooks/use-auto-create.ts` — A

- pattern เดียวกับ `use-create-many.ts`
- ขอ Clerk token ก่อนเรียก mutation
- หลัง success invalidate `workScheduleSlotKeys.listsByPositionId(userId, positionId)`

เกณฑ์ผ่าน:
- หลังสร้างอัตโนมัติ หน้า Slot list ไม่ค้าง cache เก่า

### 7.8 Frontend: `features/work-schedule/slot/components/auto-create-form.tsx` — A

Form ต้องมี:

- `start_time` แบบ `datetime-local`
- `end_time` แบบ `datetime-local`
- checkbox รายการ Template ทั้งหมดของ Position
- checkbox รายการ Staff ทั้งหมดของ Position
- ปุ่ม select all/clear all ของ Template และ Staff ทำได้ แต่ไม่บังคับหากทำให้ implementation ซับซ้อน; validation อย่างน้อยต้องบังคับเลือกอย่างละ 1
- ปุ่มยกเลิก และปุ่ม submit พร้อม disabled state ระหว่าง mutation

ก่อนส่ง:

- แปลง datetime-local เป็น ISO ด้วย `placeTimezone` ตาม pattern ของ MinMax form
- ส่ง selected Template IDs และ Staff IDs เท่านั้น; ห้าม frontend generate Slot เอง

หลังส่ง:

- `createdCount > 0`: แจ้ง success พร้อมจำนวนที่สร้าง แล้วกลับหน้า Slot ของ Position
- `createdCount === 0`: แจ้งว่าในช่วงที่เลือกมีจำนวนถึง Min แล้ว/ไม่มี Slot ที่ต้องเพิ่ม แล้วกลับหน้า Slot
- error: ห้าม redirect เป็น success และต้องเปิดให้ผู้ใช้แก้ selection/ช่วงเวลาแล้วลองใหม่

เกณฑ์ผ่าน:
- ไม่ submit หากช่วงเวลาไม่ถูกต้อง หรือไม่ได้เลือก Template/Staff
- timezone conversion ใช้ Place timezone ไม่ใช้ timezone ของ browser โดยปริยาย

### 7.9 Frontend: `app/.../slot/new/auto/page.tsx` — A

- ใช้ pattern Server Internal Only + CSR เหมือน sibling route
- resolve `placeId`, `positionId` แล้วส่งให้ `client-page.tsx`

### 7.10 Frontend: `app/.../slot/new/auto/client-page.tsx` — A

- query พร้อมกันตาม pattern หน้า manual create:
  - Slot Templates ของ Position
  - Staff Positions ของ Position
  - Place เพื่ออ่าน timezone
- ใช้ access/error redirect pattern เดิม; สามารถ reuse `../error-code-redirect-list`, `../error`, `../loading` ได้ ไม่ต้องสร้างสำเนาใหม่ถ้า import ได้ตรงตาม Next.js/TypeScript
- ถ้าไม่มี Template ให้แสดงข้อความให้ Admin ไปสร้าง Template ก่อน
- ถ้าไม่มี Staff Position ให้แสดงข้อความให้ Admin เพิ่ม Staff เข้า Position ก่อน
- เมื่อมีข้อมูลครบ render `AutoCreateForm`
- back/cancel กลับ `.../slot/new/menu`
- success route กลับ `.../slot`

เกณฑ์ผ่าน:
- หน้าไม่ render form ที่ submit ได้เมื่อไม่มี Template หรือ Staff
- access-control error ยัง redirect ตาม behavior เดิม

### 7.11 Frontend: `slot/new/menu/client-page.tsx` — M

- เพิ่ม MenuCard ใหม่ไป `.../slot/new/auto`
- title ให้สื่อว่า “จัดเวรอัตโนมัติ”
- description ระบุว่าใช้ช่วงเวลา + Template + พนักงานที่เลือกเพื่อเติมจำนวนขั้นต่ำ
- ห้ามเปลี่ยน href/behavior ของ 2 เมนูเดิม

เกณฑ์ผ่าน:
- Admin เข้าหน้า Auto Create ได้จาก flow เดิมโดยไม่กระทบ manual options

## 8. ลำดับ Implementation ที่ Implementor ต้องทำ

### ขั้นที่ 1 — Backend contract และ handler

- เพิ่ม DTO/Command, Handler, Controller route และ register Module
- ยังไม่แตะ Frontend จน backend unit tests หลักผ่าน

ผ่านเมื่อ:
- auto handler tests ผ่าน
- create-many handler regression test เดิมยังผ่าน
- backend typecheck/lint ผ่าน

### ขั้นที่ 2 — Frontend API/hook/form/page

- เพิ่ม API mutation + hook
- เพิ่ม Auto form/page
- เพิ่มเมนู entry

ผ่านเมื่อ:
- frontend typecheck/lint/build ผ่าน
- form ส่ง payload ตาม backend contract
- ไม่มี TypeScript error จากการ reuse backend DTO/types

### ขั้นที่ 3 — Full verification

- รัน root verification หลัง narrow tests ผ่าน

ผ่านเมื่อ:
- `pnpm run verify` ผ่าน
- ไม่มีการเปลี่ยน Prisma schema/migration โดยไม่ได้วางแผนไว้

## 9. สิ่งที่ Implementor ต้องระวัง

- ห้ามแก้ข้อความไอเดียต้นฉบับในไฟล์นี้
- ห้ามตีความ “เรียงตาม ID” เป็น round-robin/random/fairness algorithm; Version นี้ต้อง deterministic ตาม ID
- ห้ามนับเฉพาะ selected Staff เป็น coverage ของ Min; Slot เดิมของ Position ทุกคนต้องนับ
- ห้ามถือว่า Staff ที่ไม่มี Slot ใน Position นี้ว่างเสมอ ต้องตรวจ Slot ของ Staff ทุก Position
- ห้ามถือว่า Staff ว่างถ้ามี Holiday ทับ
- ห้ามใช้ browser timezone เพื่อสร้าง Template occurrence; Backend ต้องใช้ Place timezone เป็น authority
- ห้ามเทียบ Template overlap แค่ `HH:mm` เพราะ duration อาจข้ามวัน
- ห้ามสร้าง occurrence ที่เลย request boundary
- ห้ามถือว่า end == start ของอีกช่วงคือ overlap; ใช้ half-open semantics ให้เหมือนระบบเดิม
- ห้ามลด/ปิด Max validation เพื่อให้ Auto Create เติม Min ผ่าน
- ห้าม insert ทีละ Slot แล้วปล่อย partial result เมื่อภายหลังพบว่าเติม Min ไม่ครบ
- ห้ามคำนวณ plan นอก Serializable transaction แล้วเชื่อว่า state ยังเหมือนเดิม
- ห้ามพึ่ง order จาก Prisma โดยไม่ sort collection ที่มีผลต่อการเลือก Staff/Template
- ห้ามแก้ business behavior ของ `create-many.handler.ts`; ใช้เป็น reference/regression guard
- Unit test ต้อง mock Prisma และห้ามต่อ DB จริง

## 10. Tests และคำสั่งตรวจสอบ

จาก repository root:

### Narrow backend tests ก่อน

```bash
pnpm --dir ecosystem-backend-nest-js run test -- auto-create.handler.spec.ts --runInBand
pnpm --dir ecosystem-backend-nest-js run test -- create-many.handler.spec.ts --runInBand
```

ถ้า Jest forwarding argument ของ script ใน environment ใช้งานไม่ได้ ให้ใช้คำสั่งเทียบเท่า:

```bash
pnpm --dir ecosystem-backend-nest-js exec jest src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts --runInBand
pnpm --dir ecosystem-backend-nest-js exec jest src/modules/work-schedule/slot/commands/create-many.handler.spec.ts --runInBand
```

### Static/build checks หลัง backend + frontend พร้อม

```bash
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run build:backend
pnpm run build:frontend
```

### Standard repository verification ก่อนส่งงาน

```bash
pnpm run verify
```

`pnpm run verify` เป็น standard pre-commit verification ของ repository และครอบคลุม frontend tests, Prisma validate/generate, typecheck, lint, builds, backend tests และ migration tests

ไม่บังคับ `pnpm run test:e2e` ใน task นี้ เพราะ repository ระบุว่า e2e อาจต้องใช้ deployment-specific environment/database; รันเฉพาะเมื่อ environment พร้อม และห้ามเชื่อม/แก้ shared database โดยไม่ได้รับอนุญาต

## 11. Definition of Done

งาน Implement ผ่านเมื่อครบทั้งหมด:

- Admin มีเมนูและหน้า Auto Create ใหม่
- Admin เลือกช่วงเวลา, Template หลายรายการ และ Staff หลายคนได้
- Template occurrences ที่ทับกันถูกปฏิเสธ
- ระบบเติม Slot เฉพาะเท่าที่จำเป็นให้ถึง Min ในทุก under-covered segment ที่อยู่ในช่วงที่เลือก
- การเลือก Staff เป็น deterministic ตาม ID และข้ามคนที่ติด Slot/Holiday
- existing Slot ของ Position ถูกนับก่อนเติม Min
- ไม่สร้างเกิน Max
- ทำไม่ได้เมื่อไร request ต้องล้มทั้งชุด ไม่มี partial insert
- transaction/retry ป้องกัน race ตาม pattern ปัจจุบัน
- manual Slot creation behavior เดิมไม่เปลี่ยน
- ไม่มี Prisma schema/migration change
- narrow tests และ `pnpm run verify` ผ่านใน environment ที่ Implementor ใช้งาน
