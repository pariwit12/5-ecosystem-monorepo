# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ต้องการสร้างระบบสำหรับจัดตารางเวรอัตโนมัติ

- ให้เลือกว่าจะให้จัดพนักงานโดยอิง เวลาพักของพนักงานระหว่างเวรให้มากที่สุด, อิงจำนวนเวรรวมของแต่ละคนให้เท่าๆกัน โดยทั้ง 2 โหมด ให้นับเวรที่มีอยู่แล้วมาพิจารณาด้วย แต่ไม่สามารถแก้ไขเวรที่สร้างไว้อยู่แล้วได้

## 2. ขอบเขตและคำตัดสินที่ใช้ในแผนนี้

คำตัดสินเพิ่มเติมจากผู้ใช้สำหรับความหมายของ “เวรที่มีอยู่แล้ว” ให้ใช้แบบผสมดังนี้

- โหมดกระจายจำนวนเวรรวม: นับเฉพาะ `WorkScheduleSlot` ของพนักงานที่เลือกซึ่ง overlap กับช่วงคำขอ `start_time`–`end_time` โดยใช้ semantics แบบครึ่งเปิดเดียวกับโค้ดเดิม (`actualStartTime < end` และ `actualEndTime > start`) รวมกับ slot ใหม่ที่วางแผนไว้ในคำขอปัจจุบัน
- โหมดเพิ่มเวลาพัก: ใช้ slot ที่ overlap ช่วงคำขอทั้งหมด และต้องพิจารณา slot ที่อยู่ก่อน/หลังช่วงคำขอเท่าที่จำเป็นเพื่อหา “เวรก่อนหน้าที่ใกล้ที่สุด” และ “เวรถัดไปที่ใกล้ที่สุด” ของพนักงานแต่ละคนด้วย เพื่อให้การคำนวณระยะพักบริเวณขอบช่วงถูกต้อง
- ทั้งสองโหมดห้าม update/delete slot เดิม การเปลี่ยนแปลงข้อมูลจริงของ flow นี้ยังต้องเป็นการ `createMany` slot ใหม่เท่านั้น
- `target_mode` (`MINIMUM`/`MAXIMUM`) เป็น “เป้าหมายจำนวนคนต่อช่วงเวลา” ที่มีอยู่แล้ว และต้องคงความหมายเดิมทั้งหมด ตัวเลือกใหม่เป็น “วิธีเลือกพนักงาน” แยกจาก `target_mode`
- ชื่อ contract ใหม่ที่ต้องใช้ให้ตรงกันทั้ง backend/frontend คือ `assignment_mode` โดยมีค่าเพียง `MAXIMIZE_REST` และ `BALANCE_TOTAL`
- ไม่กำหนด default ให้ `assignment_mode` ใน API เพราะการเลือก strategy เปลี่ยนผลการจัดเวรอย่างมีนัยสำคัญ จึงให้ request ระบุค่าอย่างชัดเจน แทนการตีความ request เก่าที่ไม่มี field นี้แบบเงียบ ๆ; หน้า UI ต้องให้ผู้ใช้เลือกหนึ่งในสองค่าและแสดง validation หากยังไม่เลือก

## 3. Business Logic และโค้ดที่เกี่ยวข้องก่อนเริ่ม Implement

### 3.1 API contract ปัจจุบัน

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts` มี `AutoCreateDtoBodySchema` ที่รับ:

- `target_mode: 'MINIMUM' | 'MAXIMUM'` และ default เป็น `MINIMUM`
- `start_time`, `end_time` เป็น datetime ที่มี offset และบังคับ `end_time > start_time`
- `slot_template_ids` และ `staff_ids` เป็น UUID v7 อย่างน้อย 1 รายการและห้ามซ้ำแบบ case-insensitive

ยังไม่มี field ที่บอกวิธีเลือกพนักงาน

Frontend ที่ `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts` import `AutoCreateDtoBodySchema` จาก backend โดยตรงเพื่อ infer type และ validate payload ก่อน POST จึงไม่ควรสร้าง schema ซ้ำอีกชุดสำหรับ contract นี้

Endpoint ปัจจุบันใน `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts` คือ `POST /api/work-schedule/slot/positions/:position_id/auto` และส่ง `AutoCreateDtoBody` เข้า `AutoCreateCommand`; endpoint นี้ไม่ต้องเปลี่ยน path

### 3.2 การคำนวณจำนวน slot ที่ต้องเพิ่มปัจจุบัน

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts` ทำงานภายใต้ Serializable transaction และ lock `work_schedule_position` ก่อนอ่านข้อมูลสำคัญซ้ำ ภายใน flow เดิมมี invariant ที่ต้องรักษา:

1. ตรวจสิทธิ์ Work Schedule Admin ก่อนเริ่ม transaction
2. ตรวจว่า Position/Place ยังใช้งานได้และ timezone เป็น IANA timezone ที่ถูกต้อง
3. ตรวจ selected Slot Template/Slot Type ว่าอยู่ใน Position เดียวกันและข้อมูลเวลา/duration ถูกต้อง
4. ตรวจ selected Staff ทุกคนว่ามี active `WorkScheduleStaffPosition` ใน Position เป้าหมาย
5. สร้าง occurrence จาก template ตาม local calendar ของ Place, รองรับ DST และปฏิเสธ selected templates ที่ overlap กัน
6. query slot เดิมที่ overlap request ด้วยเงื่อนไข `actualStartTime < end` และ `actualEndTime > start`; query เดียวนี้ปัจจุบันครอบคลุมทั้ง target-position coverage และ conflict ของ selected staff ข้าม Position
7. query Holiday และ Min/Max ที่ overlap request
8. `target_mode === 'MINIMUM'` ใช้ `calculateRequirements(...)` เพื่อเติมเฉพาะ deficit ให้ถึง Min
9. `target_mode === 'MAXIMUM'` ใช้ `calculateMaximumCapacity(...)` เพื่อเติมได้มากที่สุดภายใต้ Max และจำนวนพนักงานที่ว่าง
10. ก่อน insert เรียก `validateMaximum(...)` และเขียนเฉพาะ slot ใหม่ด้วย `workScheduleSlot.createMany(...)`

### 3.3 วิธีเลือกพนักงานปัจจุบัน

หลัง validate Staff แล้ว handler สร้าง `staffCandidates` จาก Staff ID ที่ active แล้ว `.sort()` จากนั้นสำหรับแต่ละ occurrence จะวนตามลำดับ Staff ID และเลือก “คนแรกที่ว่าง” จนครบ `requiredAdditional` โดย `isStaffAvailable(...)` ปฏิเสธ staff ที่ overlap กับ slot เดิม, Holiday หรือ slot ที่วางแผนไว้ในคำขอเดียวกัน

ดังนั้นก่อนงานนี้ระบบมี deterministic order แต่ยังไม่มี optimization ตามเวลาพักหรือจำนวนเวร

### 3.4 UI ปัจจุบัน

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx` มี fieldset “เป้าหมายการจัดเวร” สำหรับ `MINIMUM`/`MAXIMUM`, ช่องเวลา, template และ staff เท่านั้น และ `use-auto-create.ts` สร้าง payload โดยส่ง `target_mode`, เวลา, template IDs และ staff IDs ยังไม่มี assignment strategy

### 3.5 Schema ฐานข้อมูลที่เกี่ยวข้อง

`ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma` มี `WorkScheduleSlot` พร้อม `positionId`, `staffId`, `slotTypeId`, `actualStartTime`, `actualEndTime` และมี index ที่ `positionId + actualStartTime` กับ `staffId + actualStartTime` อยู่แล้ว ข้อมูลที่ต้องใช้สำหรับสอง strategy มีครบและ strategy ไม่ต้องถูก persist จึงไม่ต้องแก้ Prisma schema หรือสร้าง migration ในงานนี้

## 4. Business Logic ที่คาดหวังหลัง Implement

### 4.1 แยก “จำนวนที่ต้องสร้าง” ออกจาก “เลือกใครมาลง”

ลำดับการตัดสินใจต้องเป็น:

1. ใช้ logic เดิมของ `target_mode` คำนวณ `requiredAdditional` ของแต่ละ occurrence ก่อน
2. ถ้า `requiredAdditional <= 0` ไม่ต้องเลือก staff สำหรับ occurrence นั้น
3. ถ้าต้องเพิ่ม ให้กรองเฉพาะ staff ที่ `isStaffAvailable(...)` ตาม hard constraints เดิม
4. ใช้ `assignment_mode` จัดอันดับเฉพาะ staff ที่ว่าง แล้วเลือกทีละ 1 คน
5. หลังเลือกแต่ละคน ให้เพิ่ม slot เข้า `planned` ทันที แล้วคำนวณ candidate/score ใหม่สำหรับ assignment ถัดไป เพื่อให้ slot ที่เพิ่งวางแผนมีผลต่อการตัดสินใจครั้งถัดไป
6. ถ้าจำนวน staff ที่ว่างน้อยกว่า `requiredAdditional` ให้รักษาพฤติกรรมเดิมคือสร้างได้เท่าที่ feasible โดยไม่ทำให้เกิด overlap/ผิด Holiday/เกิน Max; ห้ามสร้าง slot ผิด constraint เพื่อให้ครบตัวเลข

เหตุผล: strategy ใหม่ควรเปลี่ยนเฉพาะ “ใครถูกเลือก” ไม่ใช่เปลี่ยน Min/Max, availability หรือจำนวน occurrence ที่ระบบเดิมคำนวณ

### 4.2 `BALANCE_TOTAL`: กระจายจำนวนเวรรวมให้ใกล้เคียงกัน

สำหรับแต่ละ selected staff ให้สร้าง/อัปเดตจำนวนเวรดังนี้:

- `existingCount`: จำนวน record ของ `WorkScheduleSlot` ของ staff คนนั้นที่ overlap ช่วง request ตาม half-open predicate เดิม (`slot.start < request.end && slot.end > request.start`) โดยนับ slot ข้าม Position ด้วย เพราะเป็นภาระเวรของพนักงานคนนั้น
- `plannedCount`: จำนวน slot ใน `planned` ของ staff คนนั้นที่ถูกเพิ่มในคำขอปัจจุบัน
- `totalCount = existingCount + plannedCount`

ตอนต้องเลือก staff 1 คน:

1. ตัด staff ที่ไม่ว่างด้วย `isStaffAvailable(...)` ออกก่อน
2. เลือกคนที่ `totalCount` ต่ำที่สุด
3. ถ้าเท่ากัน ให้เลือก `staffId` ตาม lexical ascending เพื่อให้ผล deterministic
4. หลังเพิ่มเข้า `planned` ต้องเพิ่ม count ของคนดังกล่าวก่อนเลือก assignment ถัดไป

ข้อจำกัดที่ต้องยอมรับ: ถ้าเวรเดิมไม่สมดุลอยู่แล้ว หรือ availability/Holiday/Min-Max ทำให้บางคนรับเวรไม่ได้ ระบบไม่ต้องและห้ามแก้เวรเดิมเพื่อบังคับให้ยอดเท่ากัน สิ่งที่ต้องรับประกันคือทุก assignment ใหม่เลือกจาก “คนที่มี totalCount ต่ำที่สุดในกลุ่มที่ว่าง ณ ขณะนั้น” ตาม tie-break ข้างต้น

slot ที่อยู่นอก request และไม่ overlap request ต้องไม่ถูกนำมานับในโหมดนี้ ส่วน slot ที่คร่อมขอบ request และ overlap จริงให้นับ 1 เวร; slot ที่เพียงแตะขอบ (`actualEndTime === request.start` หรือ `actualStartTime === request.end`) ไม่นับ

### 4.3 `MAXIMIZE_REST`: เพิ่มเวลาพักระหว่างเวรให้มากที่สุด

สำหรับ candidate ที่ว่างแต่ละคนและ occurrence ที่กำลังจะลง ให้หา slot ของ staff คนนั้นข้ามทุก Position โดยรวมทั้ง existing slots และ `planned`:

- `previous`: slot ที่จบไม่เกิน `occurrence.start` และมี `end` ใกล้ `occurrence.start` ที่สุด
- `next`: slot ที่เริ่มไม่น้อยกว่า `occurrence.end` และมี `start` ใกล้ `occurrence.end` ที่สุด
- slot ที่ overlap occurrence ต้องถูกตัดออกจาก candidate ตั้งแต่ `isStaffAvailable(...)` จึงไม่เข้าสู่การให้ score

คำนวณ:

- `previousGap = occurrence.start - previous.end` ถ้ามี previous มิฉะนั้นเป็น `Infinity`
- `nextGap = next.start - occurrence.end` ถ้ามี next มิฉะนั้นเป็น `Infinity`
- `restScore = min(previousGap, nextGap)`

การเลือก:

1. เลือก staff ที่ `restScore` มากที่สุด เพื่อ maximize “ช่วงพักด้านที่สั้นกว่า” รอบเวรใหม่ ไม่ให้ช่องว่างด้านหนึ่งที่ยาวมากกลบอีกด้านที่ชิดมาก
2. ถ้า score เท่ากัน ให้เลือก `staffId` lexical ascending เพื่อให้ deterministic
3. slot ที่แตะกันพอดีถือว่าไม่ overlap ตาม logic เดิม แต่ให้ gap = 0
4. ถ้าไม่มี previous และ next ทั้งคู่ score เป็น `Infinity`; เมื่อหลายคนเป็น `Infinity` ให้ใช้ Staff ID tie-break
5. หลังเพิ่ม slot ใหม่เข้า `planned` ต้องนำ slot นั้นมาใช้เป็น neighbor ในการให้ score occurrence ถัดไปทันที

เพื่อให้ขอบช่วง request ถูกต้อง โดยไม่โหลดประวัติทั้งหมด:

- ใช้ slot ที่ overlap request จาก query เดิมเป็น context ภายในช่วง
- เฉพาะ `MAXIMIZE_REST` ให้โหลดเพิ่มต่อ selected staff อย่างมาก context ก่อนและหลังอย่างละ 1 record: เวรที่จบล่าสุดที่ `actualEndTime <= request.start` และเวรที่เริ่มเร็วที่สุดที่ `actualStartTime >= request.end`, ข้ามทุก Position
- ห้าม query/load “slot ทั้งหมดตลอดประวัติ” ของ staff เพื่อคำนวณ score เพราะไม่จำเป็นต่อ correctness ของ nearest-neighbor รอบ occurrence ที่อยู่ภายใน request
- สามารถทำ helper ภายใน `auto-create.handler.ts`; ไม่ต้องสร้าง service/module ใหม่สำหรับ feature นี้

เหตุผลของขอบเขตนี้: occurrence ใหม่ทั้งหมดถูกสร้างภายใน request; slot ที่อยู่ภายในหรือคร่อม request มีอยู่ใน range query เดิมแล้ว ดังนั้น slot นอกช่วงที่มีผลต่อ nearest neighbor ได้มีเพียงตัวที่ใกล้ขอบซ้ายและขอบขวาที่สุดของ staff แต่ละคน

### 4.4 Existing slots ต้อง immutable

ทั้งสอง strategy มีสิทธิ์อ่าน slot เดิมเพื่อ availability/count/score เท่านั้น ห้ามเรียก update/delete หรือแก้เวลา/staff/slot type ของ record เดิม การ persist หลังคำนวณสำเร็จต้องยังเป็น `createMany` สำหรับ `planned` เท่านั้น

## 5. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### ไฟล์ที่ต้องแก้

1. `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts`
2. `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.spec.ts`
3. `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts`
4. `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts`
5. `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx`
6. `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts`
7. `ecosystem-frontend-next-js/tests/work-schedule/auto-create-form.test.tsx`
8. `ecosystem-frontend-next-js/tests/work-schedule/auto-create-api.test.tsx`

### ไฟล์ที่ยืนยันว่าเกี่ยวข้องแต่ไม่คาดว่าต้องแก้

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts`: endpoint/command wiring รองรับ body DTO เดิมอยู่แล้ว
- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`: schema ปัจจุบันมีข้อมูลเพียงพอ ไม่มี field ใหม่ที่ต้อง persist
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts`: import schema/type จาก backend และส่ง body ทั้งก้อนอยู่แล้ว จึงควรรับ contract ใหม่อัตโนมัติ; ต้องใช้ test ยืนยัน
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/auto/client-page.tsx`: strategy เป็น state ภายใน form ไม่ต้องเพิ่ม prop จาก page
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-client-page.test.tsx`: ไม่คาดว่าต้องแก้ assertion ปัจจุบัน แต่ต้องรันเป็น regression test เพื่อยืนยัน page ยังใช้ Place timezone/navigation ถูกต้อง

### ไฟล์ที่ไม่ต้องสร้างหรือลบ

- ไม่สร้าง migration
- ไม่สร้าง Prisma model/enum สำหรับ strategy
- ไม่สร้าง endpoint ใหม่
- ไม่สร้าง service/module ใหม่ เว้นแต่ระหว่าง Implement พบข้อจำกัดของไฟล์จริงที่ทำให้ helper ภายใน handler ไม่สามารถใช้งานได้; หากเกิดกรณีนั้นต้องหยุดและส่งกลับ Planner แทนการขยาย architecture เอง

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์และเกณฑ์ผ่าน

### ขั้นที่ 1 — เพิ่ม API contract ของ assignment strategy

แก้ `auto-create.command.ts`:

- เพิ่ม `assignment_mode: z.enum(['MAXIMIZE_REST', 'BALANCE_TOTAL'])`
- ห้ามเปลี่ยน enum/default ของ `target_mode`
- ห้ามเพิ่ม default ให้ `assignment_mode`

แก้ `auto-create.command.spec.ts` ให้ทดสอบ:

- รับ `MAXIMIZE_REST`
- รับ `BALANCE_TOTAL`
- ปฏิเสธค่าที่ไม่อยู่ใน enum และ string ว่าง
- ปฏิเสธ body ที่ไม่มี `assignment_mode`
- regression ของ `target_mode`, UUID, datetime offset และ `end > start` เดิมต้องผ่าน

**เกณฑ์ผ่าน:** contract มี strategy 2 ค่าเท่านั้น, request ต้องระบุ strategy ชัดเจน และ behavior validation เดิมไม่เปลี่ยน

### ขั้นที่ 2 — Refactor assignment loop ให้เลือก candidate ตาม strategy โดยรักษา hard constraints เดิม

แก้ `auto-create.handler.ts`:

- คงการสร้าง/sort `staffCandidates` เพื่อใช้เป็น deterministic baseline/tie-break แต่ห้ามใช้ “first available by ID” เป็น decision หลักอีกต่อไป
- แยก logic “กรอง available candidates” ออกจาก “เลือก candidate ตาม strategy” ให้ทดสอบได้ผ่าน public behavior ของ handler
- เปลี่ยน loop ให้เลือกทีละ assignment และเพิ่มเข้า `planned` ทันที
- คง `isStaffAvailable(...)`, `calculateRequirements(...)`, `calculateMaximumCapacity(...)`, `validateMaximum(...)`, timezone/DST/template validation, transaction/lock/retry และ createMany semantics เดิม

**เกณฑ์ผ่าน:** จำนวน slot ที่ต้องพยายามสร้างยังมาจาก `target_mode` เดิม; strategy มีผลเฉพาะ staff selection; ไม่มี assignment ที่ overlap slot/Holiday/planned slot และไม่มีการข้าม Max

### ขั้นที่ 3 — Implement `BALANCE_TOTAL`

ใน `auto-create.handler.ts`:

- ใช้ range-limited existing slot query เดิมเป็นแหล่ง count เพื่อไม่ต้อง query ประวัตินอกช่วง
- สร้าง count ต่อ selected staff จาก slot records ที่ overlap request ข้ามทุก Position
- รวม `planned` ที่เกิดระหว่าง request ปัจจุบันเข้ากับ count ก่อนเลือกครั้งถัดไป
- เรียง candidate ตาม `(totalCount asc, staffId asc)`
- ห้ามนำ slot ที่อยู่นอก request และไม่ overlap มานับ

เพิ่ม/แก้ test ใน `auto-create.handler.spec.ts` อย่างน้อย:

1. คนที่มี existing count ต่ำกว่าถูกเลือกก่อน แม้ Staff ID จะไม่ได้มาก่อน
2. count รวม slot ข้าม Position ของ staff
3. slot ก่อน/หลัง request ที่ไม่ overlap ไม่ถูกนับ
4. slot ที่คร่อมขอบและ overlap ถูกนับ ส่วน slot ที่แตะขอบพอดีไม่ถูกนับ
5. `planned` จาก occurrence ก่อนหน้าทำให้ occurrence ถัดไปเลือกคนที่ count ต่ำกว่า
6. เมื่อ count เท่ากันเลือก Staff ID lexical ascending
7. staff ที่ count ต่ำแต่ไม่ว่าง/ติด Holiday ต้องไม่ถูกเลือก

**เกณฑ์ผ่าน:** ทุก slot ใหม่เลือก staff ที่มี `existing + planned` count ต่ำที่สุดในกลุ่ม available ณ จุดนั้นตาม tie-break ที่กำหนด โดยไม่แก้ slot เดิม

### ขั้นที่ 4 — Implement `MAXIMIZE_REST`

ใน `auto-create.handler.ts`:

- ใช้ existing slots ใน request เป็น context เดิม
- เพิ่มการอ่าน nearest boundary slot ก่อน/หลัง request เฉพาะเมื่อ `assignment_mode === 'MAXIMIZE_REST'`
- boundary lookup ต้อง filter ด้วย `staffId` และต้องไม่ filter `positionId`
- previous boundary = record ที่มี `actualEndTime <= request.start` และ `actualEndTime` มากที่สุด
- next boundary = record ที่มี `actualStartTime >= request.end` และ `actualStartTime` น้อยที่สุด
- อย่าอ่าน slot history ทั้งหมดของ staff; ใช้ nearest record ต่อด้านเท่านั้น
- ให้ score candidate ตาม `min(previousGap, nextGap)` และ tie ด้วย Staff ID
- context สำหรับ score ต้องรวม existing slot ภายในช่วง, boundary slot และ `planned`

เพิ่ม/แก้ test ใน `auto-create.handler.spec.ts` อย่างน้อย:

1. previous slot ก่อน request มีผลต่อ first/early occurrence
2. next slot หลัง request มีผลต่อ last/late occurrence
3. เลือกคนที่ minimum rest gap มากกว่า
4. slot ภายใน request มีผลต่อ previous/next neighbor
5. `planned` ที่เพิ่งสร้างมีผลต่อ occurrence ถัดไป
6. slot ของ staff ใน Position อื่นมีผลต่อ rest score
7. touching slot ให้ gap 0 แต่ไม่ถือว่า overlap
8. ไม่มี neighbor ทั้งสองด้านให้ score `Infinity`
9. score เท่ากันเลือก Staff ID lexical ascending
10. candidate ที่มี score สูงแต่ overlap/Holiday ต้องถูกตัดก่อน scoring
11. `BALANCE_TOTAL` ต้องไม่ทำ boundary lookup ที่ไม่จำเป็น
12. context query เพิ่มเติมต้องไม่ทำให้ target-position Min/Max coverage เปลี่ยน

**เกณฑ์ผ่าน:** candidate ที่ถูกเลือกมี restScore สูงสุดในกลุ่ม available ตามนิยาม และ boundary slot นอก request มีผลเฉพาะโหมดนี้โดยไม่ถูกแก้ไข

### ขั้นที่ 5 — เพิ่มตัวเลือก UI และส่ง contract ใหม่

แก้ `auto-create-form.tsx`:

- เพิ่ม `assignment_mode` ใน form schema เป็น `MAXIMIZE_REST | BALANCE_TOTAL`
- ไม่ตั้งค่าเริ่มต้นให้ field นี้; ผู้ใช้ต้องเลือกก่อน submit
- เพิ่ม fieldset แยกจาก “เป้าหมายการจัดเวร” ชื่อเช่น “วิธีจัดพนักงาน” พร้อม radio 2 ค่า:
  - `MAXIMIZE_REST` — “เพิ่มเวลาพักระหว่างเวรให้มากที่สุด” และ help text ว่าระบบพิจารณาเวรก่อน/หลังที่มีอยู่แล้วโดยไม่แก้เวรเดิม
  - `BALANCE_TOTAL` — “กระจายจำนวนเวรรวมให้ใกล้เคียงกัน” และ help text ว่านับเวรที่ overlap ช่วงเวลาที่เลือก รวมเวรใหม่ที่กำลังจัด
- หากยังไม่เลือก ให้แสดง validation message “กรุณาเลือกวิธีจัดพนักงาน” และห้ามเรียก mutation
- fieldset ใหม่ต้อง disabled ระหว่าง `isPending` เช่นเดียวกับ input อื่น
- `onSubmit` ส่ง `assignmentMode: values.assignment_mode` ไป hook
- ห้ามเปลี่ยน timezone conversion และ validation DST เดิม

แก้ `use-auto-create.ts`:

- เพิ่ม mutation variable `assignmentMode: AutoCreateDtoBody['assignment_mode']`
- map เป็น `assignment_mode: assignmentMode` ใน body
- คง auth token และ query invalidation เดิม

แก้ `auto-create-form.test.tsx` ให้ทดสอบ:

- แสดง radio strategy ทั้ง 2 ค่าแยกจาก Min/Max
- ไม่เลือก strategy แล้ว submit ไม่ได้และมีข้อความ validation
- เลือกแต่ละ strategy แล้ว mutation ได้ค่าที่ถูกต้อง
- `targetMode` และ `assignmentMode` เลือกได้อิสระจากกัน และ payload มีทั้งสองค่า
- strategy fieldset disabled ขณะ pending
- timezone/DST, selections, toast/navigation เดิมยังผ่าน

แก้ `auto-create-api.test.tsx` ให้ทดสอบ:

- body ที่มี strategy แต่ละค่าถูก validate และ POST ตามเดิม
- strategy invalid/หายไปถูก block ก่อน HTTP
- hook ส่ง `assignment_mode` ตรงกับ input
- cache invalidation success/failure behavior เดิมไม่เปลี่ยน

**เกณฑ์ผ่าน:** ผู้ใช้เลือก strategy ได้จริง, request ทุกครั้งที่ออกจาก UI มี `assignment_mode`, Min/Max ยังเป็นคนละตัวเลือก และ frontend ไม่สร้าง logic จัดเวรเอง

## 7. สิ่งที่ Implementor ต้องระวัง

- ห้ามเปลี่ยนความหมาย `MINIMUM`/`MAXIMUM` เพื่อรองรับ strategy ใหม่
- ห้ามแก้ endpoint path หรือสร้าง endpoint แยกต่อ strategy
- ห้ามย้าย optimization ไป frontend; backend ต้องเป็น source of truth เพราะต้องใช้ transaction และข้อมูล slot ล่าสุด
- ห้ามแก้ slot เดิมเพื่อทำให้ผลดูสมดุลหรือเพิ่มเวลาพัก
- ต้องพิจารณา selected staff ข้ามทุก Position ทั้ง availability, balance count และ rest context; ห้ามจำกัด slot ของ staff เฉพาะ Position เป้าหมาย
- target-position coverage สำหรับ Min/Max ต้องยังนับ slot ของ Position เป้าหมายตาม logic เดิม ไม่เกี่ยวกับ assignment strategy
- ต้องรักษา half-open overlap semantics เดิม (`start < other.end && end > other.start`) เพื่อให้ slot ที่แตะขอบไม่ถูกมองว่า overlap
- อย่าเปลี่ยน timezone/DST generation; occurrence ยังต้องใช้ Place timezone และต้องอยู่เต็มช่วง request ตาม behavior เดิม
- อย่าลด isolation level, ถอด row lock หรือถอด transaction retry เพราะ strategy ใหม่ต้องตัดสินใจจาก snapshot เดียวกับ slot ที่จะ insert
- อย่าใช้ floating point/หน่วยเวลาอื่นโดยไม่จำเป็น; handler ปัจจุบันใช้ epoch milliseconds ให้คำนวณ gap ด้วยหน่วยเดียวกัน
- อย่าใช้ random tie-break เพราะจะทำให้ test และผลจัดเวรไม่ deterministic
- อย่าโหลดประวัติ slot ทั้งหมดเพื่อ `MAXIMIZE_REST`; ใช้ range query เดิม + nearest boundary record เท่านั้น
- ถ้าพบว่า schema/constraint จริงทำให้ cannot implement ตาม contract นี้โดยไม่ต้อง migration, เปลี่ยน endpoint semantics หรือแก้ Business Logic อื่น ให้หยุดและส่งกลับ Planner ก่อน ไม่ให้ตัดสินใจขยาย scope เอง

## 8. Tests และคำสั่งตรวจสอบ

### Targeted tests ระหว่างพัฒนา

Backend:

```bash
pnpm --dir ecosystem-backend-nest-js run test -- auto-create.command.spec.ts auto-create.handler.spec.ts
```

Frontend:

```bash
pnpm --dir ecosystem-frontend-next-js run test -- tests/work-schedule/auto-create-api.test.tsx tests/work-schedule/auto-create-form.test.tsx tests/work-schedule/auto-create-client-page.test.tsx
```

`auto-create-client-page.test.tsx` เป็น regression test แม้ไม่คาดว่าต้องแก้ไฟล์ เพราะต้องยืนยันว่า page ยัง resolve Place timezone/navigation และ render form ได้หลัง form contract เปลี่ยน

### Final verification

จาก root repository ให้รัน:

```bash
pnpm run verify
```

คำสั่งนี้เป็นคำสั่งเดียวกับ CI ปัจจุบันและครอบคลุม frontend tests, Prisma validation/generation, backend/frontend typecheck, lint, build, backend tests และ migration tests

## 9. Acceptance Criteria รวม

งาน Implement ถือว่าผ่านเมื่อครบทุกข้อ:

1. API รับ `assignment_mode` เฉพาะ `MAXIMIZE_REST` หรือ `BALANCE_TOTAL` และ request ที่ไม่ระบุ/ระบุผิดถูก reject
2. `target_mode` ยังควบคุมจำนวน slot ที่ต้องเพิ่มตาม Min/Max แบบเดิม และ assignment strategy ควบคุมเฉพาะการเลือก staff
3. `BALANCE_TOTAL` นับ existing slots เฉพาะที่ overlap request ข้ามทุก Position รวม planned slots และเลือก lowest-count available staff แบบ deterministic
4. `MAXIMIZE_REST` เลือก available staff ที่มี minimum gap ถึง nearest previous/next slot มากที่สุด รวม context ก่อน/หลัง request ตามที่กำหนด และใช้ planned slots ในการตัดสินใจครั้งถัดไป
5. availability, Holiday, template validation, timezone/DST, Min/Max, Serializable transaction, row lock, retry และ maximum validation เดิมยังทำงาน
6. ไม่มี update/delete existing `WorkScheduleSlot`; persist เฉพาะ slot ใหม่ผ่าน create flow เดิม
7. UI แสดง strategy 2 ตัวเลือกแยกจาก Min/Max, บังคับให้เลือก strategy และส่งค่าถึง backend
8. ไม่มี Prisma migration/schema change และไม่มี endpoint ใหม่สำหรับงานนี้
9. targeted tests ที่ระบุผ่าน และ `pnpm run verify` ผ่านทั้งหมด
