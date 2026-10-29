# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ต้องการสร้างระบบสำหรับจัดตารางเวรอัตโนมัติ

- ให้เลือกโหมดเป้าหมายในการจัดได้ โดยมีให้เลือกระหว่างจัดเวรให้ถึงขั้นต่ำของจำนวนคนที่งานในแต่ละช่วงเวลา กับจัดตารางเวรให้มากที่สุดโดยไม่เกิน max ของแต่ละช่วงเวลา

## 2. เป้าหมายของงาน

เพิ่มตัวเลือก “เป้าหมายการจัดเวร” ให้ flow จัดเวรอัตโนมัติ (Run Draft / Auto Create) โดยผู้ใช้เลือกได้ 2 โหมดก่อนสั่งจัดเวร:

1. `MINIMUM` — จัดเพิ่มเฉพาะจำนวนที่ขาด เพื่อให้จำนวนคนทำงานถึง `min` ของแต่ละช่วงเวลา โดยต้องรักษาพฤติกรรมเดิมของระบบให้เหมือนก่อนมี feature นี้
2. `MAXIMUM` — จัดพนักงานที่เลือกและยังว่างให้ได้มากที่สุด แต่ห้ามทำให้จำนวนคนในตำแหน่งงานเกิน `max` ของช่วงเวลาที่มีการกำหนด `max`

งานนี้เป็นการเปลี่ยน Business Logic ของ Auto Create เท่านั้น ไม่ต้องเปลี่ยน schema ฐานข้อมูล, Prisma model, Min/Max CRUD, Slot Template, Slot Type, Holiday หรือ route ของ Auto Create

## 3. Business Logic และโค้ดที่เกี่ยวข้องก่อนเริ่ม

### 3.1 Request ของ Auto Create ปัจจุบันยังไม่มีโหมดเป้าหมาย

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts` กำหนด body ปัจจุบันเป็น:

```ts
{
  start_time,
  end_time,
  slot_template_ids,
  staff_ids,
}
```

เงื่อนไขที่มีอยู่และต้องรักษาไว้:

- `position_id`, `slot_template_ids`, `staff_ids` ต้องเป็น UUID v7 ตาม schema เดิม
- ต้องเลือก Slot Template อย่างน้อย 1 รายการ
- ต้องเลือก Staff อย่างน้อย 1 รายการ
- ID ที่เลือกต้องไม่ซ้ำกัน แม้ส่ง UUID ตัวพิมพ์ใหญ่/เล็กต่างกัน
- `start_time` และ `end_time` ต้องเป็น ISO datetime ที่มี offset
- `end_time` ต้องมากกว่า `start_time`
- response ปัจจุบันคือ `{ createdCount: number }`

### 3.2 Auto Create ปัจจุบันทำงานแบบ “เติมให้ถึง Min” เท่านั้น

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts` ทำงานภายใน Serializable transaction และ lock `work_schedule_position` ก่อนอ่านข้อมูลที่ใช้วางแผน จากนั้น:

1. ตรวจ position/place/timezone
2. ตรวจ Slot Template และสร้าง occurrence ตาม local calendar ของ Place timezone
3. ตรวจ Staff ที่เลือกว่ามี active position ในตำแหน่งงานนี้
4. อ่าน Slot เดิมที่ทับช่วง request ทั้งของตำแหน่งเป้าหมายและของ Staff ที่เลือก
5. อ่าน Holiday ของ Staff ที่เลือก
6. อ่าน Min/Max ที่ overlap ช่วง request ด้วย half-open overlap (`start < end` และ `end > start`)
7. `calculateRequirements(...)` คำนวณจำนวนที่ “ขาดจาก min” ต่อ occurrence
8. ไล่ Staff candidate ตาม `workScheduleStaffId` ที่ sort แล้ว และเลือกเฉพาะคนที่ไม่ชน Slot เดิม, Holiday หรือ Slot ที่กำลังวางแผน
9. ถ้ามีแผนที่จะสร้าง จึงเรียก `validateMaximum(...)` ป้องกันไม่ให้ Slot ใหม่ทำให้ช่วงที่มี `max` เกินเพดาน
10. สร้าง Slot ทั้ง batch ด้วย `createMany`
11. retry เมื่อเกิด Prisma serialization conflict `P2034` ตาม logic เดิม

ดังนั้นพฤติกรรมเดิมคือ “Min เป็น target, Max เป็น safety cap” และต้องกลายเป็นโหมด `MINIMUM` โดยไม่เปลี่ยนผลลัพธ์เดิม

### 3.3 ความหมายของ Min/Max ที่ต้องนำไปใช้กับโหมดใหม่

จาก implementation ปัจจุบัน:

- `min = null` หรือ `min = 0` ไม่สร้าง requirement ขั้นต่ำในช่วงนั้น
- `max = null` หมายถึงไม่มี upper bound จาก Min/Max ในช่วงนั้น เพราะ `validateMaximum(...)` ข้าม rule ที่ `max === null`
- ถ้าไม่มี Min/Max rule ครอบคลุมช่วงหนึ่ง ช่วงนั้นไม่มีทั้ง minimum target และ maximum cap จาก Min/Max
- Slot เดิมของพนักงานคนใดก็ตามใน target position ถูกนับเป็นจำนวนคนที่มีอยู่แล้ว แม้พนักงานคนนั้นไม่ได้อยู่ใน `staff_ids` ของ request
- Slot เดิมของ Staff ที่เลือกในตำแหน่งงานอื่น และ Holiday ของ Staff ที่เลือก มีผลต่อ availability แต่ไม่ถูกนับเป็น coverage ของ target position
- boundary ที่แตะกันพอดีไม่ถือว่า overlap

### 3.4 การสร้าง occurrence และ availability ต้องไม่เปลี่ยน

โค้ดปัจจุบันมี logic ที่ต้องรักษาไว้ ได้แก่:

- Slot Template ใช้ `startTime` แบบ wall time ของ Place timezone
- occurrence เพิ่มวันตาม local calendar ไม่ใช่เพิ่มทีละ 24 ชั่วโมง เพื่อรองรับ DST
- ปฏิเสธ wall time ที่ไม่มีอยู่จริงหรือ ambiguous ใน timezone
- duration เป็น elapsed minutes และรองรับกะข้ามวัน/DST
- occurrence ที่ไม่อยู่ภายใน request ทั้งก้อนไม่ถูกสร้าง
- Slot Template ที่เลือกต้องไม่ overlap กัน และ occurrence รายวันที่เกิดจาก template เดียวกันก็ต้องไม่ overlap กัน
- Staff คนเดิมห้ามถูกจัดทับ Slot เดิม, Holiday หรือ planned Slot อื่น
- Staff candidate ถูก sort ก่อนจัด ทำให้ผลลัพธ์ deterministic ตาม ID

โหมดใหม่ห้ามเปลี่ยนกฎเหล่านี้

### 3.5 Frontend ปัจจุบันไม่มีตัวเลือกเป้าหมาย

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx` ปัจจุบันให้เลือก:

- เวลาเริ่มต้น/สิ้นสุด
- Slot Template
- Staff

แล้วส่งผ่าน `useAutoCreate()` ไปยัง API โดยไม่มี mode

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts` สร้าง request body ปัจจุบันเป็น:

```ts
{
  start_time: startTime,
  end_time: endTime,
  slot_template_ids: slotTemplateIds,
  staff_ids: staffIds,
}
```

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts` ใช้ `AutoCreateDtoBodySchema` จาก backend ตรวจ body ก่อน POST ไป route เดิม จึงไม่ต้องสร้าง API route ใหม่

## 4. Business Logic ที่คาดหวังหลัง Implement

### 4.1 เพิ่ม field `target_mode` ใน Auto Create request

ใน `AutoCreateDtoBodySchema` ให้เพิ่ม field:

```ts
target_mode: z.enum(["MINIMUM", "MAXIMUM"]).default("MINIMUM")
```

ให้ export type/schema ที่จำเป็นจากไฟล์เดิมได้ แต่ไม่ต้องสร้าง database enum เพราะค่า mode ใช้เฉพาะ request ครั้งนั้นและไม่ต้อง persist ลง Slot

เหตุผลที่ต้องมี default `MINIMUM`:

- request เก่าที่ไม่ได้ส่ง `target_mode` ต้องยังทำงานด้วยพฤติกรรมเดิม
- ลด breaking change สำหรับ caller อื่นที่อาจเรียก endpoint เดิม
- frontend ใหม่ต้องส่ง mode ที่ผู้ใช้เลือกอย่าง explicit แต่ backend ยัง backward compatible

### 4.2 โหมด `MINIMUM`: รักษาพฤติกรรมเดิมทั้งหมด

เมื่อ `target_mode === "MINIMUM"`:

- ใช้ logic requirement จาก `min` แบบเดิม
- สร้างเฉพาะจำนวน Slot ที่ขาดเพื่อให้ถึง Min
- ถ้า Min ถูกเติมครบแล้ว, `min = 0`, `min = null` หรือไม่มี rule ที่มี Min ครอบคลุม occurrence ให้ไม่สร้าง Slot เพิ่มจาก occurrence นั้น
- ยังคงใช้ `max` เป็น safety cap ผ่านการตรวจ maximum เดิม
- ถ้าพนักงานที่เลือกและว่างไม่พอ ให้สร้างเท่าที่ทำได้จาก selected staff เท่านั้น ห้ามดึง staff ที่ไม่ได้เลือก
- ลำดับ Staff และ occurrence ต้อง deterministic เหมือนเดิม

เกณฑ์สำคัญคือ request เดิมที่ไม่ส่ง `target_mode` ต้องให้ผลเท่ากับการส่ง `target_mode: "MINIMUM"`

### 4.3 โหมด `MAXIMUM`: จัดให้มากที่สุดโดยไม่เกิน Max

เมื่อ `target_mode === "MAXIMUM"` ให้ `min` ไม่ใช่ target สำหรับการคำนวณจำนวนที่จะเพิ่ม แต่ยังคงข้อมูล Min/Max เดิมไว้โดยไม่แก้ไข

สำหรับ occurrence แต่ละช่วง ให้คำนวณ “จำนวน Slot เพิ่มสูงสุดที่ยังอนุญาต” ดังนี้:

1. แบ่ง occurrence เป็น atomic segments จาก boundary ที่เกี่ยวข้อง ได้แก่:
   - จุดเริ่ม/สิ้นสุด occurrence
   - จุดเริ่ม/สิ้นสุด Min/Max rule ที่ overlap occurrence
   - จุดเริ่ม/สิ้นสุด existing Slot ของ target position ที่ overlap occurrence
   - planned Slot ที่ overlap occurrence หาก helper ถูกใช้แบบทั่วไป
2. สำหรับแต่ละ segment ให้นับจำนวน `existing target-position slots` ที่ overlap segment
3. ถ้า segment มี rule และ `max !== null`:
   - `remainingCapacity = max(0, max - existingCount - plannedCount)`
4. ถ้า segment ไม่มี rule หรือ rule มี `max === null`:
   - segment นั้นไม่มีเพดานจาก Min/Max
5. capacity ของ occurrence ทั้งก้อนต้องเป็นค่าต่ำสุดของ `remainingCapacity` จากทุก segment ที่มี finite `max` เพราะ Slot ที่สร้างจาก occurrence ครอบคลุม occurrence ทั้งก้อนและห้ามทำให้ segment ใด segment หนึ่งเกิน Max
6. ถ้า occurrence ไม่มี finite `max` ในทุก segment ให้ถือว่า Min/Max ไม่จำกัดจำนวนเพิ่ม และเพดานจริงคือจำนวน Staff ที่ผู้ใช้เลือกและผ่าน availability เท่านั้น
7. ไล่ Staff candidate ตามลำดับ deterministic เดิม แล้วสร้างได้ไม่เกิน capacity และไม่เกินจำนวน Staff ที่ว่างจริง
8. หลังสร้าง plan แล้วให้คง `validateMaximum(...)` หรือ defensive check ที่เทียบเท่าไว้ เพื่อป้องกัน regression/bug ในการคำนวณ capacity ก่อน `createMany`

ตัวอย่างผลลัพธ์ที่ต้องได้:

| สถานการณ์ | ผลของ `MAXIMUM` |
| --- | --- |
| existing = 0, max = 2, selected available = 3 | สร้าง 2 |
| existing = 1, max = 2, selected available = 3 | สร้าง 1 |
| existing = 2, max = 2 | สร้าง 0 |
| existing > max | สร้าง 0 ใน occurrence ที่โดนเพดานนั้น; ห้ามเพิ่ม violation |
| max = 0 | สร้าง 0 |
| max = null | ไม่มีเพดานจาก Min/Max; สร้าง Staff ที่เลือกและว่างได้ทั้งหมด |
| ไม่มี Min/Max rule | ไม่มีเพดานจาก Min/Max; สร้าง Staff ที่เลือกและว่างได้ทั้งหมด |
| min = 2, max = 4, selected available = 3, existing = 0 | สร้าง 3 เพราะโหมดนี้ maximize ไม่ได้หยุดที่ Min |
| occurrence ครอบคลุม segment ที่เหลือ capacity 3 และ segment ที่เหลือ capacity 1 | สร้างได้สูงสุด 1 |

### 4.4 Pre-existing Max violation

รักษาหลักการเดิมว่า Auto Create ไม่ควรล้มเหลวเพียงเพราะข้อมูลที่มีอยู่ก่อน request เกิน Max หาก request นี้ไม่ได้เพิ่ม Slot เข้าไปใน segment นั้น

สำหรับ `MAXIMUM`:

- ถ้า existing count เท่ากับหรือเกิน Max ให้ remaining capacity ของ segment เป็น 0
- occurrence ที่ทับ segment นั้นจึงสร้างเพิ่มไม่ได้
- ไม่ต้องลบหรือแก้ existing Slot อัตโนมัติ
- ห้ามทำให้ violation เดิมแย่ลง

### 4.5 Availability และการนับ coverage ต้องแยกกันเหมือนเดิม

ทั้ง 2 mode ต้องใช้กฎเดียวกัน:

- coverage/capacity ของ target position นับ Slot ทุกคนในตำแหน่งนั้น ไม่จำกัดเฉพาะ selected staff
- eligibility ของคนที่จะเพิ่มตรวจ Slot ของ Staff คนนั้นข้ามทุก position, Holiday และ planned Slot
- Staff ที่ไม่ได้อยู่ใน `staff_ids` ห้ามถูกสร้าง Slot ใหม่
- Slot ที่แตะ boundary พอดีไม่ถือว่าชน

### 4.6 ไม่มีการเปลี่ยนข้อมูลถาวรอื่น

งานนี้ไม่ต้อง:

- เพิ่ม/แก้ Prisma model หรือ migration
- บันทึก `target_mode` ลง `work_schedule_slot`
- เปลี่ยน Min/Max CRUD หรือ semantics ของ `min`/`max`
- เปลี่ยน Slot Template/Slot Type
- เปลี่ยน response `{ createdCount }`
- เปลี่ยน endpoint หรือ authorization

เหตุผล: mode เป็น strategy ของการสร้าง schedule ใน request นั้น ไม่ใช่ property ของ Slot ที่สร้างเสร็จแล้ว

## 5. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### 5.1 ไฟล์ที่ต้องแก้

Backend:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts`
  - เพิ่ม `target_mode` enum/default ใน request schema
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts`
  - แยกการคำนวณจำนวนที่จะเพิ่มตาม mode
  - รักษา minimum algorithm เดิม
  - เพิ่ม maximum-capacity algorithm
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.spec.ts`
  - เพิ่ม test schema/default/mode invalid
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts`
  - เพิ่ม test Business Logic ของทั้ง 2 mode และ regression ของ mode เดิม

Frontend:

- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx`
  - เพิ่ม field และ UI ให้เลือก target mode
  - default เป็น `MINIMUM`
  - ส่ง mode ไป mutation
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts`
  - รับ `targetMode`
  - ส่ง `target_mode` เข้า request body
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-api.test.tsx`
  - ตรวจ request payload/validation ของ target mode
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-form.test.tsx`
  - ตรวจ default mode, การเลือกอีก mode และ payload ที่ส่ง

### 5.2 ไฟล์ที่คาดว่าไม่ต้องแก้

- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts`
  - ใช้ shared `AutoCreateDtoBodySchema` และส่ง parsed body ทั้งก้อนอยู่แล้ว จึงควรรองรับ field ใหม่โดยไม่ต้องเปลี่ยน route/function contract นอกจากกรณี TypeScript บังคับให้ปรับ type จาก schema ใหม่
- Auto Create controller/route เดิม
- Prisma schema และ migrations
- Min/Max handlers/queries
- Schedule board query/display

หาก Implementor พบว่าจำเป็นต้องแก้ไฟล์นอกเหนือรายการนี้เพื่อให้ compile/test ผ่าน ให้แก้เฉพาะ plumbing ที่เกิดจาก `target_mode` และต้องไม่ขยาย Business Logic อื่น

### 5.3 ไฟล์ที่ต้องสร้าง/ลบ

- ไม่คาดว่าต้องสร้างไฟล์ production ใหม่
- ไม่คาดว่าต้องลบไฟล์ใด
- ถ้าจำเป็นต้องแยก pure helper ออกจาก `auto-create.handler.ts` เพื่อให้ทดสอบง่าย สามารถสร้าง helper ภายใต้โมดูล `work-schedule/slot` ได้ แต่ต้องไม่เปลี่ยน semantics ที่ระบุในแผนนี้ และต้องมี unit test ของ helper นั้น

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### ขั้นที่ 1 — เพิ่ม request contract ของ target mode

ไฟล์: `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts`

ให้เพิ่ม `target_mode` เป็น enum สองค่าเท่านั้น:

```ts
"MINIMUM" | "MAXIMUM"
```

และกำหนด default เป็น `"MINIMUM"`

ห้าม:

- รับ arbitrary string
- ใช้ boolean ที่อ่านความหมายยาก เช่น `maximize: true`
- เปลี่ยนชื่อ field เดิม
- เปลี่ยน response

เกณฑ์ผ่าน:

- body เก่ายัง parse ผ่านและได้ `target_mode === "MINIMUM"` หลัง parse
- `MINIMUM` และ `MAXIMUM` parse ผ่าน
- ค่าอื่น parse ไม่ผ่าน
- validation เวลา/UUID/duplicate เดิมยังผ่าน test เดิม

### ขั้นที่ 2 — แยก minimum target ออกจาก maximum target ใน planner

ไฟล์: `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts`

ให้รักษา `calculateRequirements(...)` เดิมเป็น logic ของ `MINIMUM` จะ rename ให้สื่อความหมายชัดขึ้นได้ แต่ห้ามเปลี่ยนผลของ algorithm เดิม

เพิ่ม logic สำหรับ `MAXIMUM` ที่คำนวณจำนวนสูงสุดต่อ occurrence จาก residual max capacity ตามหัวข้อ 4.3

รูปแบบ implementation ที่ต้องการ:

- branch ตาม `body.target_mode` ที่จุดกำหนด “จำนวนที่ต้องการ assign ต่อ occurrence”
- reuse ขั้นตอน validate template, generate occurrence, read existing data, availability, createMany, transaction/retry เดิม
- อย่าทำ handler สองชุดที่ duplicate transaction/read logic
- อย่าให้ `MAXIMUM` เรียก minimum deficit เพื่อกำหนดจำนวน เพราะเป้าหมายคนละแบบ
- อย่าให้ `MINIMUM` เปลี่ยนไปเติมจนถึง Max

เกณฑ์ผ่าน:

- `MINIMUM` ให้ผลเดิม
- `MAXIMUM` ไม่หยุดเมื่อถึง Min หากยังมี Staff ว่างและยังไม่ชน Max
- `MAXIMUM` ไม่เกิน Max ในทุก atomic segment ที่ Slot ใหม่ครอบคลุม
- ไม่มี Max = ไม่มีเพดานจาก Min/Max ไม่ใช่ capacity 0
- Staff unavailable ไม่ถูกจัด
- selected staff ไม่พอ = สร้างเท่าที่ทำได้ ไม่ throw เพียงเพราะจัดไม่เต็ม target

### ขั้นที่ 3 — รักษา Max validation เป็น safety invariant

ไฟล์: `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts`

หลังได้ planned slots ให้ยังมี final maximum validation ก่อน `createMany`

สำหรับ `MAXIMUM` การคำนวณ capacity ควรทำให้ validation นี้ไม่ fail ในกรณีปกติ; ถ้า fail แปลว่า planner คำนวณผิดหรือเกิด invariant ที่ไม่คาดคิด และต้องไม่เขียน partial data

รักษา behavior เดิม:

```ts
if (planned.length === 0) return { createdCount: 0 };
```

เพื่อไม่ให้ request ที่ไม่ได้เพิ่มอะไรล้มเพราะ pre-existing max violation

เกณฑ์ผ่าน:

- ไม่มี partial insert เมื่อ validation fail
- `createMany` ยังถูกเรียกครั้งเดียวต่อ successful transaction attempt
- P2034 retry ยัง rebuild plan จากข้อมูลที่ reread ภายใน transaction ทุกครั้ง

### ขั้นที่ 4 — เพิ่ม UI เลือกเป้าหมายก่อน Run Draft

ไฟล์: `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx`

เพิ่ม field `target_mode` ใน form schema/default values และแสดงเป็น radio group หรือ control ที่เห็นความแตกต่างชัดเจน โดยใช้ค่าจริง `MINIMUM` / `MAXIMUM`

ข้อความ UI ที่ควรสื่อความหมายอย่างน้อย:

- `MINIMUM`: “ให้ถึงจำนวนขั้นต่ำ (Min)” — สร้างเฉพาะจำนวนที่ขาดเพื่อให้ถึง Min
- `MAXIMUM`: “จัดให้มากที่สุดภายใต้จำนวนสูงสุด (Max)” — จัด Staff ที่เลือกและว่างให้มากที่สุด โดยช่วงที่มี Max จะไม่เกิน Max

ให้มี helper text สำหรับ `MAXIMUM` ว่า ถ้าช่วงใดไม่ได้กำหนด Max ระบบจะไม่มีเพดานจาก Min/Max ในช่วงนั้น และจะถูกจำกัดด้วย Staff ที่เลือก/availability เท่านั้น

UI requirements:

- default `MINIMUM`
- control disabled ระหว่าง mutation pending เหมือน input อื่น
- มี label/legend ที่ screen reader เข้าใจได้
- validation error ของ mode (ถ้ามี) แสดงใน form pattern เดียวกับ field อื่น
- ห้ามเปลี่ยน timezone conversion ของ start/end

เกณฑ์ผ่าน:

- เปิด form ใหม่เห็น `MINIMUM` ถูกเลือก
- เปลี่ยนเป็น `MAXIMUM` แล้ว submit ส่งค่าถูกต้อง
- field เดิม Slot Template/Staff/time ยังทำงานเหมือนเดิม

### ขั้นที่ 5 — ส่ง mode ผ่าน mutation layer

ไฟล์: `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts`

เพิ่ม `targetMode` ใน mutation variables และสร้าง body:

```ts
{
  target_mode: targetMode,
  start_time: startTime,
  end_time: endTime,
  slot_template_ids: slotTemplateIds,
  staff_ids: staffIds,
}
```

`auto-create.api.ts` ต้องยัง parse body ด้วย shared backend schema และส่ง parsed body ไป endpoint เดิม

เกณฑ์ผ่าน:

- request network payload มี mode ที่ผู้ใช้เลือก
- token handling, skipErrorCodes และ query invalidation เดิมไม่เปลี่ยน
- endpoint เดิมถูกใช้

## 7. Test ที่ต้องเพิ่มหรือแก้

### 7.1 Backend DTO tests

แก้ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.spec.ts`

ต้องครอบคลุมอย่างน้อย:

- omitted `target_mode` => parse สำเร็จและ output เป็น `MINIMUM`
- explicit `MINIMUM` => สำเร็จ
- explicit `MAXIMUM` => สำเร็จ
- ค่าอื่น/empty string => fail
- validation เดิมทั้งหมดของ date/UUID/duplicate ยังผ่าน

### 7.2 Backend handler tests — regression ของ `MINIMUM`

แก้ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts`

ต้องยืนยันว่า:

- request ที่ไม่ส่ง mode ยังคงสร้างเฉพาะ missing Min เท่าเดิม
- explicit `MINIMUM` ให้ผลเหมือน omitted mode
- minimum already covered => 0
- `min = 0`, `min = null`, no rule => 0 ใน MINIMUM
- existing target-position slot ยังนับ coverage
- unavailable staff และ selected-staff-only rule ยังเหมือนเดิม
- maximum safety tests เดิมยังผ่าน

### 7.3 Backend handler tests — `MAXIMUM`

เพิ่ม test อย่างน้อย:

1. existing 0 / max 2 / available selected 3 => สร้าง 2
2. existing 1 / max 2 => สร้าง 1
3. existing = max => 0
4. existing > max => 0 สำหรับ occurrence ที่ทับ segment นั้น และไม่มี insert เพิ่ม violation
5. max 0 => 0
6. max null => สร้าง selected staff ที่ว่างทั้งหมด
7. no Min/Max rule => สร้าง selected staff ที่ว่างทั้งหมด
8. min ต่ำกว่า capacity เช่น min 1 / max 3 / available 3 => สร้าง 3 เพื่อพิสูจน์ว่า MAXIMUM ไม่หยุดที่ Min
9. occurrence ครอบคลุมหลาย Max segments => ใช้ residual capacity ที่แคบที่สุด
10. existing Slot ที่ครอบคลุมเพียงบาง segment ต้องถูกนับเฉพาะ segment ที่ overlap และจำกัด occurrence ตาม segment ที่ตึงที่สุด
11. Staff ที่ติด Holiday หรือ Slot ใน position อื่นไม่ถูกเลือก แม้ยังมี Max capacity
12. selected staff ไม่พอ capacity => สร้างเท่าที่ว่าง
13. touching boundaries ยังไม่ถือว่า overlap
14. final validation ไม่ยอมให้ planned + existing > max
15. serialization retry ยัง reread และคำนวณ MAXIMUM plan ใหม่ ไม่ reuse plan เก่าจาก attempt ก่อน

### 7.4 Frontend API/hook tests

แก้ `ecosystem-frontend-next-js/tests/work-schedule/auto-create-api.test.tsx`

ต้องยืนยัน:

- `MINIMUM` และ `MAXIMUM` ผ่าน shared schema และถูก POST ไป endpoint เดิม
- invalid mode ถูก reject ก่อน request
- Authorization/skipErrorCodes behavior เดิมไม่เปลี่ยน
- hook ส่ง `target_mode` ตาม variables จริง
- success ยัง invalidate slot list ของ user/position เดิมเท่านั้น

### 7.5 Frontend form tests

แก้ `ecosystem-frontend-next-js/tests/work-schedule/auto-create-form.test.tsx`

ต้องยืนยัน:

- default UI เลือก `MINIMUM`
- user เปลี่ยนเป็น `MAXIMUM` ได้
- submit ส่ง mode ที่เลือกพร้อม ISO time ที่ resolve ด้วย Place timezone เดิม
- pending state disable mode control ด้วย
- validation เวลา DST/nonexistent/ambiguous และ validation selection เดิมไม่ regress

## 8. คำสั่งตรวจสอบ

ให้ Implementor รันจาก repository root ตามลำดับ โดยเริ่มจาก test ที่แคบที่สุดก่อน:

```bash
pnpm --dir ecosystem-backend-nest-js exec jest src/modules/work-schedule/slot/commands/auto-create.command.spec.ts src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts --runInBand
pnpm --dir ecosystem-frontend-next-js exec jest tests/work-schedule/auto-create-api.test.tsx tests/work-schedule/auto-create-form.test.tsx --runInBand
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run verify
```

ถ้า environment มี database/deployment ที่เหมาะสมและต้องการรัน e2e เพิ่ม ให้ใช้คำสั่งที่ repository มีอยู่:

```bash
pnpm run test:e2e
```

แต่ e2e ไม่ใช่ข้อบังคับของ `pnpm run verify` ตาม repository instruction และห้ามเชื่อม unit test กับ database จริง

## 9. Acceptance Criteria รวม

งานถือว่าผ่านเมื่อครบทุกข้อ:

- Auto Create UI มี 2 mode ตามไอเดียต้นฉบับและ default เป็น `MINIMUM`
- API contract รับ `target_mode` สองค่าเท่านั้น และ request เก่าที่ไม่ส่ง mode ยังมี behavior เดิม
- `MINIMUM` สร้างเฉพาะจำนวนที่ขาดเพื่อถึง Min และไม่ regress logic เดิม
- `MAXIMUM` สร้าง Staff ที่เลือกและว่างให้ได้มากที่สุด ภายใต้ finite Max ทุก segment ที่ Slot ครอบคลุม
- `MAXIMUM` ไม่ใช้ Min เป็นจุดหยุด
- `max = null` หรือไม่มี rule หมายถึงไม่มี upper bound จาก Min/Max ใน MAXIMUM mode
- existing target-position Slot ถูกนับก่อนคำนวณ capacity
- Holiday, Slot ของ Staff ใน position อื่น และ planned Slot ยัง block availability เหมือนเดิม
- ห้ามสร้าง Staff ที่ไม่ได้เลือก
- ไม่มี Slot ใหม่ทำให้ finite Max ถูกเกิน
- pre-existing Max violation ไม่ถูกแก้อัตโนมัติและไม่ถูกทำให้แย่ลง
- timezone/DST/overnight/template-overlap behavior เดิมไม่เปลี่ยน
- transaction, position lock, Serializable isolation, P2034 retry และ atomic batch insert เดิมยังอยู่
- ไม่มี Prisma/schema/migration change สำหรับ feature นี้
- test ที่ระบุผ่าน และ `pnpm run verify` ผ่านใน environment ที่ Implementor ใช้

## 10. สิ่งที่ Implementor ต้องระวัง

- อย่าตีความ `MAXIMUM` ว่า “สร้างเท่ากับค่า max” โดยตรง เพราะต้องหัก existing coverage และต้องคำนึงถึงหลาย segment ภายใน occurrence
- อย่าคำนวณ capacity จากจำนวน selected staff อย่างเดียว; Max เป็นจำนวนคนทั้งหมดใน target position ณ segment นั้น
- อย่านับ Slot ของ Staff ใน position อื่นเป็น target-position coverage แต่ต้องใช้ Slot นั้น block Staff availability
- อย่าถือ `max = null` เป็น 0; semantics เดิมคือไม่มี Max constraint
- อย่าให้ `MINIMUM` เริ่มเติมเกิน Min เพียงเพราะเพิ่มโหมด MAXIMUM
- อย่าแก้ existing Slot เพื่อให้เข้ากับ Max; feature นี้สร้าง Slot ใหม่เท่านั้น
- อย่าข้าม final Max validation แม้ MAXIMUM planner จะคำนวณ capacity แล้ว
- อย่าย้ายการอ่านข้อมูลวางแผนออกนอก Serializable transaction เพราะจะทำให้ concurrency safety ถอยหลัง
- อย่าเปลี่ยน deterministic staff ordering เว้นแต่มี requirement ใหม่โดยชัดเจน
- อย่าเปลี่ยน half-open overlap semantics เพราะ test และ scheduling logic เดิมพึ่งพา boundary นี้
- อย่าเปลี่ยน wall-time/timezone/DST logic ของ Slot Template ในงานนี้
- อย่าเพิ่ม migration หรือ persist mode ลงฐานข้อมูลโดยไม่มี requirement เพิ่มเติม
