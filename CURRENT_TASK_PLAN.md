# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ปรับระบบจัดเวรอัตโนมัติ โดยให้เอาข้อจำกัดออกหาก slotTemplate หรือ พนักงานที่เลือก ไม่พอที่จะทำให้ทุกช่วงเวลาถึงข้อกำหนดจำนวนขั้นต่ำ และให้จัดตารางเวรให้ได้มากที่สุดโดยไม่จำเป็นว่าหลังใส่ตารางเวรแล้วต้องผ่านทุกช่วงเวลา

## 2. เป้าหมายและขอบเขตของงาน

ปรับเฉพาะ Business Logic ของการจัดเวรอัตโนมัติ (`POST /api/work-schedule/slot/positions/:position_id/auto`) จากเดิมที่ถือว่า minimum coverage เป็นเงื่อนไขแบบ all-or-nothing ให้เป็นการพยายามเติมเวรแบบ best effort เท่าที่ Slot Template ที่เลือกและพนักงานที่เลือกสามารถทำได้ โดยยังคงข้อจำกัดด้านความถูกต้องและความปลอดภัยอื่นทั้งหมดไว้เหมือนเดิม

คำว่า “จัดตารางเวรให้ได้มากที่สุด” ในขอบเขตงานนี้ให้หมายถึง:

- ยังคงคำนวณจำนวนเวรที่ขาด (`deficit`) จากกฎ `min` แบบเดิม
- สำหรับช่วงเวลาที่มี Slot Template ที่เลือกครอบคลุม ให้พยายามเติมพนักงานที่ยังว่างให้ได้มากที่สุด แต่ไม่เกินจำนวนที่ขาดของ occurrence นั้น
- หากบางช่วงเวลาที่ต่ำกว่า `min` ไม่มี Slot Template ที่เลือกครอบคลุม ให้ข้ามเฉพาะช่วงเวลานั้นและยังคงจัด occurrence อื่นที่ทำได้
- หากพนักงานที่เลือกและยังว่างมีจำนวนน้อยกว่าจำนวนที่ขาด ให้เก็บ assignment ที่ทำได้ทั้งหมดและดำเนินการต่อ แทนการยกเลิกทั้งคำขอ
- หากไม่มี assignment ที่ทำได้เลย ให้ตอบ `{ createdCount: 0 }` ตาม contract เดิม ไม่ถือว่า minimum ที่ยังขาดเป็น error
- ไม่เปลี่ยนงานนี้ให้เป็น optimization solver รูปแบบใหม่ และไม่สร้างเวรเกิน deficit เพียงเพื่อเพิ่ม `createdCount`; ให้คงลำดับ occurrence และลำดับพนักงานแบบ deterministic ที่โค้ดปัจจุบันใช้อยู่

สิ่งที่อยู่นอกขอบเขต:

- ไม่เปลี่ยน request/response DTO หรือ URL ของ endpoint
- ไม่เปลี่ยนหน้าจอ auto-create, API client หรือ hook ฝั่ง frontend
- ไม่เปลี่ยน schema/database/migration
- ไม่ผ่อนข้อจำกัด `max` หรือ validation อื่นที่ไม่ใช่กรณี “ทำ minimum ให้ครบไม่ได้”

## 3. Business Logic ปัจจุบันก่อน Implement

### 3.1 การรับคำขอและ validation หลัก

`AutoCreateDtoBodySchema` กำหนดให้คำขอมี `start_time`, `end_time`, `slot_template_ids` และ `staff_ids`; ต้องเลือก Slot Template และ Staff อย่างน้อยอย่างละ 1 รายการ, UUID ต้องไม่ซ้ำแบบ case-insensitive และ `end_time` ต้องมากกว่า `start_time`

`SlotController.autoCreate()` รับคำขอที่ `POST /api/work-schedule/slot/positions/:position_id/auto`, ใช้ `ClerkAuthGuard` และส่งต่อไป `AutoCreateCommand`

`AutoCreateHandler.execute()` ตรวจสิทธิ์ผู้ดูแลตารางเวรของ position ก่อนเริ่ม transaction จากนั้นทำงานภายใน Serializable transaction พร้อม lock ของ `work_schedule_position`

### 3.2 Slot Template และ occurrence

Handler อ่าน Slot Template ตาม `slot_template_ids` ที่เลือก และ `validateTemplates()` ยังคงบังคับว่า:

- ต้องพบ Slot Template ที่เลือกครบทุก ID
- template ต้องอยู่ใน position ที่ร้องขอ
- `startTime` ต้องเป็นรูปแบบ `HH:mm`
- `durationMinute` ต้องเป็นจำนวนเต็มบวก
- Slot Type ต้องอยู่ใน position เดียวกันและต้องไม่ถูกลบ

`generateOccurrences()` สร้าง occurrence ตาม timezone ของสถานที่ทำงาน, ตรวจ wall time ที่ไม่มีจริง/กำกวมจาก DST, เรียง occurrence แบบ deterministic และ reject Slot Template ที่ทำให้ occurrence ทับซ้อนกัน ก่อนคืนเฉพาะ occurrence ที่อยู่เต็มช่วง request

### 3.3 พนักงานและ availability

Handler อ่าน `workScheduleStaffPosition` แล้วบังคับว่าพนักงานทุกคนที่ผู้ใช้เลือกต้องมี active position registration ใน position นี้ หากมี selected staff ที่ไม่เข้าเงื่อนไขจะ reject คำขอ

`isStaffAvailable()` ป้องกันไม่ให้พนักงานคนเดียวกันถูกวางเวรทับกับ:

- existing slot ของพนักงาน แม้อยู่คนละ position
- holiday ของพนักงาน
- slot ที่กำลัง plan ในคำขอนี้

พนักงาน candidate ถูก deduplicate และเรียงตาม `staffId`; allocation ปัจจุบันจึง deterministic

### 3.4 การคำนวณ minimum coverage ปัจจุบัน

`calculateRequirements()` อ่านกฎ `min` ที่ overlap กับ request, แบ่งช่วงตาม boundaries ของ existing slots และ generated occurrences แล้วคำนวณ `deficit = max(0, min - existingCount)` ของแต่ละ segment

สำหรับ occurrence ที่ครอบคลุมหลาย segment จะเก็บ requirement เป็น deficit สูงสุดของ occurrence นั้น ไม่ใช่ผลรวมของทุก segment

ปัจจุบันมี hard failure ที่ขัดกับไอเดียใหม่ 2 จุด:

1. หาก segment ใดมี deficit แต่ไม่มี selected occurrence ที่ครอบคลุม segment นั้น `calculateRequirements()` throw `BadRequestException` ด้วยข้อความ `Slot Template ที่เลือกไม่ครอบคลุมช่วงเวลาที่จำนวนเวรต่ำกว่าขั้นต่ำ` ทำให้ไม่มีเวรใดถูกสร้าง แม้ segment/occurrence อื่นจะจัดได้
2. หลัง allocation ของแต่ละ occurrence หาก `assigned < requiredAdditional` handler throw `BadRequestException` ด้วยข้อความ `พนักงานที่เลือกไม่เพียงพอสำหรับจำนวนขั้นต่ำในช่วงเวลาที่ต้องการ` ทำให้ transaction ทั้งคำขอล้ม แม้จะมี assignment บางส่วนที่ถูกต้องแล้ว

### 3.5 ข้อจำกัด maximum และ transaction ปัจจุบัน

หลังสร้าง `planned` แล้ว `validateMaximum()` ตรวจทุก segment ที่ได้รับ planned slot และ reject หาก `existingCount + plannedCount > max`

หาก `planned` ว่าง handler ตอบ `{ createdCount: 0 }`; หากมีรายการจึง `createMany()` หนึ่ง batch และคืนจำนวนที่ Prisma รายงานจริง

`executeWithRetry()` ใช้ Serializable transaction และ retry เฉพาะ Prisma `P2034`; validation/application errors ไม่ถูก retry

## 4. ส่วนของโค้ดที่เกี่ยวข้องก่อน Implement

### 4.1 ไฟล์ที่จะต้องแก้

#### `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts`

ส่วนที่เกี่ยวข้องโดยตรง:

- `execute()` ช่วง allocation ของ `staffCandidates` เข้าแต่ละ occurrence
- `calculateRequirements()` ช่วงหา occurrence ที่ครอบคลุม deficient segment
- `isStaffAvailable()` และ `validateMaximum()` เป็นข้อจำกัดที่ต้องคง semantics เดิม
- `executeWithRetry()` เป็น transaction/retry behavior ที่ต้องคงเดิม

#### `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts`

มี unit tests ของ handler ครอบคลุม validation, timezone/DST, template overlap, minimum coverage, staff availability, maximum, batching และ retry อยู่แล้ว และมี test ที่ยืนยัน all-or-nothing behavior เดิมโดยตรง ได้แก่:

- `fails atomically when a deficient segment has no fully contained candidate`
- `rejects when selected staff are insufficient without using unselected staff`
- `does not insert an earlier feasible occurrence when a later one lacks staff`

สามกรณีนี้ต้องเปลี่ยน expectation ให้ตรงกับ best-effort behavior ใหม่

### 4.2 ไฟล์ที่ตรวจแล้วแต่ไม่คาดว่าจะต้องแก้

#### `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts`

request schema และ `AutoCreateResponse { createdCount: number }` รองรับ behavior ใหม่อยู่แล้ว จึงไม่ต้องเพิ่ม field สำหรับ partial success

#### `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts`

controller เพียงรับคำขอและ dispatch `AutoCreateCommand`; endpoint/auth contract ไม่ต้องเปลี่ยน

#### `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts`

frontend ใช้ DTO/response type จาก backend โดยตรงและคืน `response.data`; ไม่มี logic ที่บังคับว่าต้องเติม minimum ครบ

#### `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts`

hook ส่ง request เดิมและ invalidate slot list หลัง success; ไม่ต้องเปลี่ยนเมื่อ backend ตอบ partial `createdCount`

#### `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx`

form แสดง success จาก `createdCount` อยู่แล้ว: ถ้ามากกว่า 0 แสดงจำนวนที่สร้างจริง และถ้าเป็น 0 แสดงว่าไม่มีตารางเวรที่ต้องเพิ่ม จึงรองรับ best-effort response โดยไม่ต้องเปลี่ยน UI

## 5. Business Logic ที่คาดหวังหลัง Implement

### 5.1 Minimum เป็น target สำหรับ auto-create ไม่ใช่ atomic success condition

เมื่อระบบพบช่วงเวลาที่ต่ำกว่า `min` ให้ยังใช้ deficit เดิมเป็น “เป้าหมายสูงสุดที่ต้องพยายามเติม” แต่การทำให้ครบทุก segment ไม่ใช่เงื่อนไขก่อน commit อีกต่อไป

เหตุผล: ตรงกับไอเดียที่ต้องการให้ระบบสร้างตารางเวรเท่าที่ข้อมูลที่ผู้ใช้เลือกสามารถรองรับได้ แทนการสูญเสีย assignment ที่ถูกต้องทั้งหมดเพราะมีบางช่วงที่ทำให้ครบไม่ได้

### 5.2 Slot Template ไม่พอครอบคลุมทุก deficient segment

เมื่อ `calculateRequirements()` พบ `deficit > 0` แต่หา selected occurrence ที่ครอบคลุม segment ไม่ได้:

- ห้าม throw ด้วยเหตุผล “Slot Template ไม่ครอบคลุมขั้นต่ำ”
- ให้ข้าม segment นั้น
- ต้องคำนวณ requirement ของ segment อื่นต่อ
- หาก occurrence อื่นครอบคลุม deficient segment ได้ ต้องยังถูกนำไป plan ตาม deficit ของมัน

หากทุก deficient segment ไม่สามารถ map ไป occurrence ได้ จะไม่มี requirement ที่จัดได้ และผลลัพธ์ต้องเป็น `{ createdCount: 0 }` โดยไม่สร้าง row

### 5.3 พนักงานที่เลือกไม่พอเติม requirement

สำหรับแต่ละ occurrence ให้คง loop พนักงานเดิมและเพิ่ม planned slot เฉพาะคนที่ `isStaffAvailable()` ผ่าน จนกว่าจะครบ `requiredAdditional` หรือหมด candidate

เมื่อหมด candidate แล้วแต่ `assigned < requiredAdditional`:

- ห้าม throw ด้วยเหตุผล “พนักงานไม่เพียงพอสำหรับขั้นต่ำ”
- เก็บ planned slot ที่ assign สำเร็จแล้วทั้งหมด
- ไปประมวลผล occurrence ถัดไป

หากไม่มีพนักงานว่างเลยสำหรับทุก requirement ให้ตอบ `{ createdCount: 0 }` โดยไม่เรียก `createMany()`

### 5.4 Behavior ที่ต้องคงเดิม

การผ่อนเงื่อนไขนี้จำกัดเฉพาะ “ไม่สามารถทำ minimum ให้ครบ” เท่านั้น ข้อกำหนดต่อไปนี้ยังเป็น hard constraints เหมือนเดิม:

- authorization ของ work-schedule admin
- position/place ต้องพร้อมใช้งาน และ timezone ต้อง valid
- selected Slot Template ต้องครบและ valid
- selected Staff ทุกคนต้องมี active registration ใน position
- selected template occurrences ต้องไม่ overlap กัน
- wall time/DST validation
- staff ต้องไม่ชน existing slot, holiday หรือ planned slot ของตัวเอง
- existing slot ของพนักงานที่ไม่ได้เลือกยังนับเป็น coverage ของ target position ตามเดิม
- `max` ยังห้ามเกิน และ `validateMaximum()` ยังสามารถ reject ทั้ง transaction ได้
- Serializable transaction, position lock และ `P2034` retry behavior
- สร้างข้อมูลด้วย `createMany()` batch เดียวเมื่อมี planned slots
- response contract ยังคง `{ createdCount: number }`

## 6. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

```text
5-ecosystem-monorepo/
├── ecosystem-backend-nest-js/
│   └── src/modules/work-schedule/slot/commands/
│       ├── auto-create.handler.ts       # แก้: minimum insufficiency เป็น best effort
│       └── auto-create.handler.spec.ts  # แก้: tests จาก atomic failure เป็น partial success + regression
├── ecosystem-frontend-next-js/          # ไม่ต้องแก้สำหรับงานนี้
├── CURRENT_TASK_PLAN.md                 # แผนงานนี้
└── VERIFICATION_TABLE.md
```

ไฟล์ implementation ที่คาดว่าจะสร้างใหม่: ไม่มี

ไฟล์ implementation ที่คาดว่าจะลบ: ไม่มี

หาก Implementor พบว่าจำเป็นต้องแก้ไฟล์นอก 2 backend files ข้างต้นเพื่อให้ behavior นี้ทำงาน ต้องหยุดและตรวจสอบเหตุผลกับ Planner ก่อน เพราะ contract/frontend ปัจจุบันรองรับผลลัพธ์ใหม่อยู่แล้ว

## 7. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### ขั้นตอน 1 — ปรับ `auto-create.handler.ts`: template coverage เป็น best effort

ใน `calculateRequirements()` ให้เปลี่ยนเฉพาะ branch ที่ปัจจุบัน throw เมื่อ `!occurrence`

พฤติกรรมที่ต้องได้:

- `deficit === 0` ยัง skip เหมือนเดิม
- `deficit > 0` และมี occurrence ครอบคลุม: ยัง update requirement ของ occurrence ด้วย `Math.max(requirements.get(occurrence) ?? 0, deficit)` เหมือนเดิม
- `deficit > 0` และไม่มี occurrence ครอบคลุม: skip segment นั้นแล้วทำ segment/rule ถัดไป โดยไม่เพิ่ม requirement ปลอมให้ occurrence อื่น

ห้ามเปลี่ยน definition ของ overlap, boundary splitting, existing coverage count หรือการใช้ maximum deficit ต่อ occurrence

**เกณฑ์ผ่านขั้นตอน 1**

- deficient segment ที่ไม่มี template ครอบคลุมไม่ทำให้ request fail
- deficient segment อื่นที่มี template ครอบคลุมยังถูกคำนวณและจัดเวรได้
- กรณีทุก deficient segment ไม่มี template ครอบคลุมจบด้วย `createdCount: 0`
- validation ของ invalid/overlapping templates ยังคง fail เหมือนเดิม

### ขั้นตอน 2 — ปรับ `auto-create.handler.ts`: staff shortage เป็น best effort

ใน allocation loop ของ `execute()` ให้ยกเลิก hard failure ที่เกิดจาก `assigned < requiredAdditional` หลังลอง staff candidates ครบแล้ว

พฤติกรรมที่ต้องได้:

- ยังคงหยุด assign occurrence เมื่อ `assigned === requiredAdditional` เพื่อไม่สร้างเกิน deficit
- ยังคงเรียก `isStaffAvailable()` ก่อนเพิ่ม planned slot ทุกครั้ง
- หาก staff ว่างมีน้อยกว่า requirement ให้ planned slots ที่ทำได้คงอยู่
- ต้องดำเนิน occurrence ถัดไปต่อ ไม่ rollback เพียงเพราะ occurrence หนึ่งเติม minimum ไม่ครบ
- ถ้า `planned.length === 0` ให้ใช้ return เดิม `{ createdCount: 0 }`
- ถ้ามี planned slots ให้ยังผ่าน `validateMaximum()` ก่อน `createMany()`

**เกณฑ์ผ่านขั้นตอน 2**

- min ต้องการ 3 แต่เลือกพนักงาน valid/available 2 คน: สร้าง 2 รายการและคืน `createdCount: 2` แทน BadRequest
- occurrence แรกจัดได้ แต่อ occurrence หลังจัดไม่ได้เพราะ staff ไม่ว่าง: occurrence แรกยังถูกสร้าง
- ไม่มี staff ว่างเลย: ไม่ throw เพราะ minimum ไม่ครบ, ไม่เรียก `createMany()`, คืน `createdCount: 0`
- ไม่ใช้พนักงานที่ไม่ได้อยู่ใน `staff_ids` เพื่อพยายามเติม minimum
- staff conflict/holiday ยังคงทำให้พนักงานคนนั้นไม่ถูก assign

### ขั้นตอน 3 — ปรับ `auto-create.handler.spec.ts` ให้ล็อก Business Logic ใหม่

แก้ tests เดิมที่ผูกกับ atomic failure ดังนี้:

1. `fails atomically when a deficient segment has no fully contained candidate`
   - fixture ปัจจุบันใช้ template 08:00 ระยะ 120 นาทีใน request 08:00–12:00 กับ min ที่ครอบคลุม request
   - expectation ใหม่ต้องยืนยันว่า segment 08:00–10:00 ที่ template ครอบคลุมยังสร้างได้ 1 slot แม้ segment 10:00–12:00 ยังต่ำกว่า minimum
   - ต้องไม่คาดหวัง BadRequest จาก template coverage อีก

2. `rejects when selected staff are insufficient without using unselected staff`
   - fixture ปัจจุบันตั้ง `min = 3` แต่เลือก staff 2 คน
   - expectation ใหม่ต้องเป็น `createdCount: 2`
   - ยืนยันว่า inserted staff มีเฉพาะ selected staff 2 คนตาม deterministic order และไม่ดึง unselected staff มาใช้

3. `does not insert an earlier feasible occurrence when a later one lacks staff`
   - fixture ปัจจุบันมี occurrence 08:00–10:00 และ 10:00–12:00 โดย staff ทั้งสองติด holiday ใน occurrence หลัง
   - expectation ใหม่ต้องยืนยันว่า occurrence แรกที่ feasible ถูกสร้าง และ occurrence หลังถูกข้ามเพราะไม่มี staff ว่าง
   - ต้องไม่ rollback occurrence แรก

เพิ่ม regression case สำหรับ “ทุก selected staff ไม่ว่างใน occurrence ที่ต้องเติม” หากยังไม่มี test ที่ยืนยัน behavior นี้โดยตรง:

- ตั้ง min ให้เกิด requirement
- ทำให้ selected staff ทุกคน unavailable ด้วย existing slot/holiday ที่ overlap
- คาดหวัง `{ createdCount: 0 }`
- `createMany()` ต้องไม่ถูกเรียก
- ต้องไม่ throw เพียงเพราะ minimum ยังไม่ครบ

Tests อื่นเกี่ยวกับ max, invalid templates, overlapping templates, DST, authorization, staff registration, transaction/retry ต้องคงอยู่และผ่านโดยไม่ลด assertion เพื่อให้การแก้ครั้งนี้ไม่ผ่อน constraint อื่นโดยไม่ได้ตั้งใจ

**เกณฑ์ผ่านขั้นตอน 3**

- tests ใหม่/ที่แก้แสดง partial success ทั้งจาก template coverage ไม่พอและ staff ไม่พอ
- มี test ยืนยัน zero-result success เมื่อจัดไม่ได้เลยเพราะ availability
- tests ของ hard constraints เดิมยังผ่าน

### ขั้นตอน 4 — ยืนยันว่า contract/frontend ไม่ถูกเปลี่ยน

ไม่แก้ `auto-create.command.ts`, `slot.controller.ts` หรือ frontend files ตราบใดที่ implementation ยังคืน `{ createdCount: number }` ตามเดิม

**เกณฑ์ผ่านขั้นตอน 4**

- request fields และ endpoint เดิมใช้งานได้
- partial success ส่งจำนวนที่สร้างจริงผ่าน `createdCount`
- `createdCount = 0` ยังคงเป็น successful response ไม่ใช่ error จาก minimum insufficiency
- frontend ยังสามารถแสดง success toast และ invalidate slot list ด้วย contract เดิม

## 8. ลำดับการ Implement ที่ Implementor ต้องทำ

1. แก้ `calculateRequirements()` ให้ deficient segment ที่ไม่มี selected occurrence ถูก skip แทนการ throw
2. แก้ allocation loop ให้ staff shortage ไม่ throw และเก็บ assignment ที่สำเร็จ
3. ปรับ 3 tests ที่ยืนยัน atomic behavior เดิมให้ยืนยัน best-effort behavior ใหม่
4. เพิ่ม regression test กรณี requirement มีอยู่แต่ selected staff ทุกคน unavailable และผลลัพธ์เป็น zero success หากกรณีนี้ยังไม่ถูกทดสอบโดยตรง
5. รัน focused unit test ของ auto-create handler
6. รัน verification ทั้ง repository ตามคำสั่งเดียวกับ GitHub Actions
7. ห้ามแก้ frontend/DTO/controller/schema เว้นแต่พบข้อเท็จจริงใหม่ที่ทำให้แผนนี้ไม่เพียงพอ; หากเกิดกรณีนั้นให้หยุดและส่งกลับ Planner

## 9. เกณฑ์ยอมรับรวม

Implementation ถือว่าผ่านเมื่อครบทุกข้อ:

- Slot Template ที่เลือกไม่ครอบคลุม minimum บางช่วงไม่ทำให้ auto-create ทั้งคำขอล้ม
- ระบบยังสร้างเวรใน occurrence ที่ครอบคลุม deficit และทำได้จริง
- พนักงานที่เลือกไม่พอเติม minimum ไม่ทำให้ assignment ที่ถูกต้องก่อนหน้า/ใน occurrence เดียวกันถูก rollback
- ระบบสร้างได้ไม่เกิน requirement ที่คำนวณจาก min deficit; ไม่สร้างเวรเพิ่มแบบไม่มี requirement
- ถ้าจัดไม่ได้เลยด้วย selected templates/staff ที่ valid ระบบตอบ success ด้วย `createdCount: 0`
- ระบบไม่เลือก staff นอก `staff_ids`
- invalid selected staff registration ยังคง reject; งานนี้ไม่ได้แปลว่าให้ยอมรับ staff ที่ไม่อยู่ใน position
- staff overlap และ holiday ยังคง block การ assign รายบุคคล
- invalid/overlapping Slot Template ยังคง reject
- `max` ยังคงเป็น hard constraint และ request ที่จะทำให้ segment ที่ touched เกิน max ยังคง reject
- timezone/DST behavior ไม่เปลี่ยน
- transaction lock, Serializable isolation และ retry `P2034` ไม่เปลี่ยน
- endpoint, DTO และ response `{ createdCount }` ไม่เปลี่ยน
- focused auto-create tests ผ่าน
- repository verification ตาม CI ผ่าน

## 10. สิ่งที่ Implementor ต้องระวัง

- อย่าลบ `BadRequestException` ทั้งหมดจาก handler; ให้เอาออกเฉพาะ 2 failure paths ที่เกิดเพราะ selected template/staff ทำ minimum ให้ครบไม่ได้
- อย่าตีความ “เอาข้อจำกัดออก” ว่าให้ปิด `max`, overlap, holiday, registration, timezone หรือ template validity
- อย่าเปลี่ยน `calculateRequirements()` ให้ sum deficit ของหลาย segment; behavior ปัจจุบันใช้ maximum deficit ต่อ occurrence และต้องคงไว้
- อย่า assign มากกว่า `requiredAdditional` ของ occurrence แม้ยังมี staff ว่าง เพราะจะเปลี่ยนจากเติม minimum deficit ไปเป็นสร้างเวรเกินความต้องการ
- อย่าใช้ staff ที่ไม่ได้เลือกเป็น fallback
- อย่าเปลี่ยน ordering โดยไม่จำเป็น; occurrence ถูก sort และ staff candidates ถูก sort เพื่อให้ผลลัพธ์ deterministic
- อย่าเปลี่ยน transaction boundary หรือสร้างหลาย `createMany()` batches เพื่อรองรับ partial result; partial result ในงานนี้หมายถึง partial ต่อ business target ไม่ใช่ partial database commit
- `validateMaximum()` ต้องทำกับ planned batch ทั้งหมดก่อน insert เช่นเดิม เพื่อรักษา atomicity ของ hard constraints
- อย่าปรับข้อความ UI หรือเพิ่ม partial-success field ใหม่ เพราะ `createdCount` ปัจจุบันเพียงพอสำหรับผลลัพธ์ที่ต้องการ

## 11. Test ที่ต้องเพิ่ม/แก้ และคำสั่งตรวจสอบ

### Focused test

จาก root ของ repository:

```bash
pnpm --dir ecosystem-backend-nest-js run test -- auto-create.handler.spec.ts --runInBand
```

Focused test ต้องผ่านทุกกรณีใน `auto-create.handler.spec.ts` รวมทั้ง regression cases ที่ปรับตามแผนนี้

### Full repository verification

GitHub Actions ของ repository ใช้คำสั่งนี้หลัง `pnpm install --frozen-lockfile`:

```bash
pnpm run verify
```

`verify` ครอบคลุม frontend tests, Prisma validate/generate, backend/frontend typecheck, backend/frontend lint, backend/frontend build, backend tests และ migration tests

**เกณฑ์สุดท้าย:** ทั้ง focused test และ `pnpm run verify` ต้อง exit code 0 โดยไม่ลด/skip tests ที่มีอยู่เพื่อทำให้ผ่าน
