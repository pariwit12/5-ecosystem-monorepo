# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

2026-10-30

- สำหรับระบบจัดตารางเวรอัตโนมัติ ตรงวิธีจัดพนักงาน เพิ่มตัวเลือก แบบดั้งเดิม เป็นค่า Default ด้วยครับ

## 2. ขอบเขตและคำตัดสินที่ใช้ในแผนนี้

จากการตรวจโค้ดปัจจุบันและ Git history ของ auto-create ก่อน task ที่เพิ่มวิธีจัดพนักงานสองแบบ ยืนยันได้ว่า “แบบดั้งเดิม” ในระบบ auto-create เดิมมีพฤติกรรมดังนี้: หลังตรวจว่า Staff ที่เลือกมี active `WorkScheduleStaffPosition` แล้ว ระบบสร้าง `staffCandidates` จาก canonical Staff ID ที่อ่านจากฐานข้อมูล, de-duplicate, `.sort()` แบบ lexical ascending และสำหรับแต่ละ occurrence จะเลือก “พนักงานคนแรกที่ว่าง” ตามลำดับนั้นจนครบจำนวนที่ต้องเพิ่มหรือจนไม่มีคนว่าง โดยไม่มี scoring เรื่องเวลาพักหรือจำนวนเวร

แผนนี้จึงกำหนดขอบเขตดังนี้:

- ใช้ field เดิม `assignment_mode` ต่อไป ไม่เพิ่ม field หรือ endpoint ใหม่
- ขยายค่า `assignment_mode` จากเดิม `MAXIMIZE_REST | BALANCE_TOTAL` เป็น `TRADITIONAL | MAXIMIZE_REST | BALANCE_TOTAL`
- กำหนด `TRADITIONAL` เป็น default ทั้งที่ API contract และหน้า Auto Create เพื่อให้ “แบบดั้งเดิม” เป็นค่า Default จริงทั้งกรณีใช้งานผ่าน UI และกรณี request ที่ไม่ได้ส่ง `assignment_mode`
- `TRADITIONAL` ต้องคืนพฤติกรรมเลือกพนักงานของ auto-create เดิมตามที่ยืนยันจาก history: lexical ascending ของ canonical Staff ID และเลือกคนแรกที่ว่าง โดยยังใช้ hard constraints เดิมทั้งหมด
- `MAXIMIZE_REST` และ `BALANCE_TOTAL` ต้องรักษา Business Logic ปัจจุบันทุกประการ รวมถึงวิธีนับข้อมูลเดิม, score, tie-break และ query ที่ใช้ประกอบการตัดสินใจ
- `target_mode` (`MINIMUM`/`MAXIMUM`) เป็นคนละมิติกับ `assignment_mode`; งานนี้ห้ามเปลี่ยนความหมายหรือ default ของ `target_mode`
- งานนี้ไม่เปลี่ยน schema ฐานข้อมูล, Prisma model, migration, endpoint path หรือ response shape
- การเปลี่ยนแปลงข้อมูลจริงยังเป็นการสร้าง `WorkScheduleSlot` ใหม่ผ่าน `createMany` เท่านั้น ห้าม update/delete slot เดิม

เหตุผลที่ให้ backend schema มี default ด้วย ไม่ใช่เฉพาะ UI: frontend API layer ใช้ `AutoCreateDtoBodySchema` จาก backend เพื่อ parse payload ก่อน POST และ backend ใช้ schema เดียวกันเป็น DTO contract ดังนั้น default ที่ schema ทำให้พฤติกรรมสอดคล้องกันทุก entry point และทำให้ request ที่ละ `assignment_mode` มีความหมายชัดเจนเป็น “แบบดั้งเดิม” แทนที่จะถูก reject แบบปัจจุบัน

## 3. Business Logic และโค้ดที่เกี่ยวข้องก่อนเริ่ม Implement

### 3.1 API contract ปัจจุบัน

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts` มี `AutoCreateDtoBodySchema` ที่รับ:

- `target_mode: 'MINIMUM' | 'MAXIMUM'` และ default เป็น `MINIMUM`
- `assignment_mode: 'MAXIMIZE_REST' | 'BALANCE_TOTAL'` และ **ไม่มี default**
- `start_time`, `end_time` เป็น datetime ที่มี offset และบังคับ `end_time > start_time`
- `slot_template_ids` และ `staff_ids` เป็น UUID v7 อย่างน้อย 1 รายการและห้ามซ้ำแบบ case-insensitive

ผลคือ request ที่ไม่ส่ง `assignment_mode` ถูก reject ในปัจจุบัน

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts` import `AutoCreateDtoBodySchema` จาก backend โดยตรง, infer `AutoCreateDtoBody` จาก schema, ใช้ `safeParse(...)` ก่อนยิง request และ POST `parsedBody.data` ไปที่ backend ดังนั้นเมื่อ schema มี default แล้ว payload ที่ละ `assignment_mode` จะถูก normalize ให้มี `assignment_mode: 'TRADITIONAL'` ก่อน POST โดยไม่ต้องสร้าง schema ซ้ำใน frontend

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts` ใช้ endpoint `POST /api/work-schedule/slot/positions/:position_id/auto` และส่ง `AutoCreateDtoBody` เข้า `AutoCreateCommand`; endpoint และ controller wiring นี้ไม่ต้องเปลี่ยน

### 3.2 Flow ของ Auto Create ปัจจุบันที่ต้องรักษา

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts` ทำงานภายใต้ flow สำคัญดังนี้:

1. ตรวจสิทธิ์ Work Schedule Admin ก่อนเริ่ม transaction
2. ใช้ Serializable transaction และ lock Position ด้วย `SELECT ... FOR UPDATE`
3. อ่าน Position/Place ซ้ำใน transaction และตรวจว่าใช้งานได้ รวมถึงตรวจ IANA timezone
4. ตรวจ selected Slot Template/Slot Type ว่าอยู่ใน Position เดียวกันและข้อมูลเวลา/duration ถูกต้อง
5. ตรวจ selected Staff ทุกคนว่ามี active `WorkScheduleStaffPosition` ใน Position เป้าหมาย
6. สร้าง `staffCandidates` จาก canonical Staff ID ที่ฐานข้อมูลคืนมา, de-duplicate และ `.sort()`
7. สร้าง occurrence จาก template ตาม local calendar ของ Place, รองรับ DST และปฏิเสธ selected templates ที่ overlap กัน
8. query slot เดิมที่ overlap request ด้วย half-open predicate `actualStartTime < request.end` และ `actualEndTime > request.start`; query เดียวครอบคลุม target-position coverage และ conflict ของ selected staff ข้าม Position
9. query Holiday และ Min/Max ที่ overlap request
10. `target_mode === 'MINIMUM'` ใช้ `calculateRequirements(...)` เพื่อเติมเฉพาะ deficit ให้ถึง Min
11. `target_mode === 'MAXIMUM'` ใช้ `calculateMaximumCapacity(...)` เพื่อเติมได้มากที่สุดภายใต้ Max; ถ้าไม่มี finite Max ความจุอาจเป็น `Infinity` และ loop จะหยุดเมื่อไม่มี staff ที่ว่าง
12. ก่อน insert เรียก `validateMaximum(...)`
13. เขียนเฉพาะ slot ใหม่ด้วย `workScheduleSlot.createMany(...)`
14. retry error `P2034` โดยสร้าง transaction ใหม่ตาม logic เดิม

ทุกข้อข้างต้นเป็น invariant ของงานนี้และห้ามเปลี่ยนเว้นแต่ส่วนการ “เลือก candidate” ตาม `assignment_mode`

### 3.3 วิธีจัดพนักงานปัจจุบัน

หลังคำนวณ `requiredAdditional` ต่อ occurrence แล้ว handler ปัจจุบันทำดังนี้:

- กรอง `availableCandidates` ด้วย `isStaffAvailable(...)`; function นี้ปฏิเสธ staff ที่ overlap กับ slot เดิม, Holiday หรือ slot ที่วางแผนไว้ในคำขอเดียวกัน
- `BALANCE_TOTAL`: ใช้จำนวน slot เดิมของ selected staff ที่อยู่ใน query ช่วงคำขอ รวมกับ slot ใหม่ใน `planned` เป็น score; score ต่ำกว่าถูกเลือกก่อน และ tie-break ด้วย Staff ID lexical ascending
- `MAXIMIZE_REST`: query boundary ก่อน/หลังช่วงคำขอด้วย `groupBy(...)`, คำนวณ rest score จาก slot เดิมและ `planned`; score สูงกว่าถูกเลือกก่อน และ tie-break ด้วย Staff ID lexical ascending
- หลังเลือกแต่ละคนจะ push slot เข้า `planned` และ update state ที่เกี่ยวข้องก่อนเลือกคนถัดไป
- boundary query ก่อน/หลังช่วงคำขอถูกเรียกเฉพาะเมื่อ `assignment_mode === 'MAXIMIZE_REST'`

ปัจจุบันไม่มี branch สำหรับวิธีแบบดั้งเดิม

### 3.4 พฤติกรรม “แบบดั้งเดิม” ที่ยืนยันจาก Git history

ก่อนเพิ่ม `assignment_mode` สอง strategy ปัจจุบัน handler ใช้ `staffCandidates` ชุดเดียวกันที่เรียง lexical ascending แล้วสำหรับแต่ละ occurrence ทำ loop ตามลำดับ Staff ID:

1. ถ้าจัดครบ `requiredAdditional` ให้หยุด
2. ถ้า `isStaffAvailable(...)` เป็น false ให้ข้ามคนนั้น
3. ถ้าว่าง ให้ push `{ ...occurrence, staffId }` เข้า `planned`
4. เพิ่มจำนวน assigned แล้วไป candidate ถัดไป

ดังนั้น “แบบดั้งเดิม” ไม่ใช่การเรียงตามลำดับ checkbox ใน UI และไม่ใช่การสุ่ม แต่เป็น deterministic lexical order ของ canonical Staff ID จากฐานข้อมูล และยังคง best-effort behavior เดิมเมื่อจำนวนคนว่างไม่พอ

### 3.5 UI ปัจจุบัน

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx` มี fieldset “วิธีจัดพนักงาน” พร้อม radio สองค่า:

- `MAXIMIZE_REST` — “เพิ่มเวลาพักระหว่างเวรให้มากที่สุด”
- `BALANCE_TOTAL` — “กระจายจำนวนเวรรวมให้ใกล้เคียงกัน”

Form schema บังคับให้เลือกหนึ่งค่า แต่ `defaultValues` ไม่มี `assignment_mode` จึงไม่มี radio ใดถูกเลือกตอนเปิดหน้า และ submit โดยไม่เลือกจะแสดง “กรุณาเลือกวิธีจัดพนักงาน”

`onSubmit` ส่ง `values.assignment_mode` ต่อไปยัง `useAutoCreate()` เป็น `assignmentMode`; hook แปลงกลับเป็น `assignment_mode` ใน request body จึงรองรับค่าใหม่ผ่าน type ที่ infer จาก backend schema ได้โดยไม่ต้องเปลี่ยนรูปแบบ hook

### 3.6 Test ปัจจุบันที่ได้รับผลโดยตรง

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.spec.ts` ยืนยันว่ารับเฉพาะ `MAXIMIZE_REST`/`BALANCE_TOTAL` และยืนยันว่า missing `assignment_mode` ต้อง fail; expectation นี้ต้องเปลี่ยนตาม requirement ใหม่
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts` มี helper `command(...)` ที่กำหนด `assignment_mode: 'BALANCE_TOTAL'` และมีชุด test แยกสำหรับ `MAXIMIZE_REST`/`BALANCE_TOTAL`; ต้องเพิ่ม coverage ของ `TRADITIONAL` โดยไม่ลด regression coverage ของสอง mode เดิม
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-form.test.tsx` ยืนยันว่ามีสอง strategy, ไม่มี default และต้องเลือก strategy ก่อน mutation; ทั้งสาม expectation ต้องเปลี่ยน
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-api.test.tsx` ทดสอบเฉพาะสอง mode และยืนยันว่า missing `assignment_mode` ถูก block ก่อน HTTP; หลังงานนี้ missing field ต้อง parse เป็น `TRADITIONAL` และยิง payload ที่ normalize แล้วแทน
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-client-page.test.tsx` มี flow submit จริงของ form ที่ปัจจุบันต้อง click `BALANCE_TOTAL`; สามารถใช้ test นี้เป็น regression ระดับ page ว่าค่า default `TRADITIONAL` ถูกส่งได้โดยไม่ต้อง click strategy

## 4. Business Logic ที่คาดหวังหลัง Implement

### 4.1 Contract ของ `assignment_mode`

Backend schema ต้องเป็นแนวคิดเดียวกับ:

```ts
assignment_mode: z
  .enum(['TRADITIONAL', 'MAXIMIZE_REST', 'BALANCE_TOTAL'])
  .default('TRADITIONAL')
```

เกณฑ์ผ่าน:

- omitted `assignment_mode` parse สำเร็จและได้ `TRADITIONAL`
- explicit `TRADITIONAL`, `MAXIMIZE_REST`, `BALANCE_TOTAL` parse สำเร็จ
- ค่าอื่นหรือ empty string ยังถูก reject
- `target_mode` ยัง default `MINIMUM` เหมือนเดิม
- response ยังคง `{ createdCount: number }`

### 4.2 Algorithm ของ `TRADITIONAL`

หลังคำนวณ `requiredAdditional` แล้ว เมื่อ `body.assignment_mode === 'TRADITIONAL'` ต้องได้ผลเทียบเท่า algorithm auto-create เดิม:

1. ใช้ `staffCandidates` canonical IDs ที่ de-duplicate และ sort lexical ascending อยู่แล้ว ห้ามใช้อันดับจาก `body.staff_ids` หรืออันดับจาก response ของ query โดยตรง
2. สำหรับ occurrence ตามลำดับ deterministic เดิม ให้พิจารณา candidate ตาม lexical ascending
3. ใช้ `isStaffAvailable(...)` เดิมเป็น hard gate โดยต้องตรวจ slot เดิมทุก Position ของ staff ที่ query มา, Holiday และ `planned` ของ request ปัจจุบัน
4. เลือก candidate คนแรกที่ว่าง แล้วเพิ่มเข้า `planned` ทันที
5. ทำต่อจนได้ `requiredAdditional` หรือหมด candidate ที่ว่าง
6. ถ้าคนว่างน้อยกว่าจำนวนที่ต้องเพิ่ม ให้สร้างได้เท่าที่ feasible ตาม behavior เดิม ห้ามฝืน overlap/Holiday/Max เพื่อให้ครบ
7. ห้ามใช้ `totalCounts`, rest score หรือ boundary ก่อน/หลังช่วงคำขอเป็นตัวจัดอันดับใน mode นี้
8. ไม่ต้อง query previous/next slot boundaries สำหรับ mode นี้; query ดังกล่าวต้องยังเกิดเฉพาะ `MAXIMIZE_REST`

การ implement จะใช้ loop แบบเดิมโดยตรงหรือใช้ `availableCandidates` แล้วเลือก candidate lexical ต่ำสุดก็ได้ **เฉพาะเมื่อผลลัพธ์และ query behavior เทียบเท่า algorithm ข้างต้น**; Implementor ห้ามเปลี่ยน semantics เพื่อ reuse scoring branch แบบผิดความหมาย

### 4.3 `MAXIMIZE_REST` และ `BALANCE_TOTAL`

สอง mode เดิมต้องเป็น regression-preservation scope:

- `MAXIMIZE_REST` ยังเลือก score เวลาพักสูงสุด, พิจารณา slot เดิมที่ overlap และ nearest boundary ก่อน/หลังช่วงคำขอ, update `planned` ทุกครั้ง และ tie-break ด้วย Staff ID lexical ascending
- `BALANCE_TOTAL` ยังเลือก total count ต่ำสุดจากข้อมูลช่วงคำขอ + `planned`, update count หลัง assignment และ tie-break ด้วย Staff ID lexical ascending
- ห้ามเปลี่ยน query window, score definition, canonical-ID handling หรือ tie-break ของสอง mode นี้เพื่อรองรับ `TRADITIONAL`

### 4.4 Default ของ UI

ใน `auto-create-form.tsx`:

- เพิ่ม radio `value="TRADITIONAL"` ใน fieldset “วิธีจัดพนักงาน”
- label ที่ผู้ใช้เห็นให้เป็น **“แบบดั้งเดิม”**
- วางตัวเลือกนี้ก่อนสอง mode เดิมเพื่อให้ default เห็นชัด
- help text ให้สื่อความหมายโดยไม่กล่าวว่าเป็นการ balance/optimize เช่น **“ใช้วิธีจัดพนักงานเดิม โดยเลือกพนักงานที่ว่างตามลำดับเดิม”**
- เพิ่ม `assignment_mode: 'TRADITIONAL'` ใน `defaultValues`
- เปิดหน้าแล้ว radio “แบบดั้งเดิม” ต้อง checked ทันที; สอง radio เดิมไม่ checked
- ผู้ใช้ยังเปลี่ยนไป `MAXIMIZE_REST` หรือ `BALANCE_TOTAL` ได้ตามเดิม
- valid form ที่ผู้ใช้ไม่ได้แตะ field “วิธีจัดพนักงาน” ต้อง submit ได้และส่ง `assignmentMode: 'TRADITIONAL'`
- pending/disabled state ต้อง disable fieldset ทั้งสามตัวเลือกเหมือนเดิม

### 4.5 Default ของ frontend API

`auto-create.api.ts` ไม่คาดว่าต้องแก้ เพราะใช้ backend schema อยู่แล้ว หลัง schema มี default:

- external/incomplete payload ที่ไม่มี `assignment_mode` เมื่อเข้าผ่าน `autoCreate(...)` ต้อง `safeParse` สำเร็จ
- request ที่ส่งจริงต้องใช้ `parsedBody.data` และมี `assignment_mode: 'TRADITIONAL'`
- invalid assignment mode ยังต้อง fail ก่อน HTTP และเปิด error store แบบเดิม

`use-auto-create.ts` ไม่คาดว่าต้องแก้ logic เพราะ `assignmentMode` อ้าง type จาก `AutoCreateDtoBody['assignment_mode']` และส่ง field เดิมอยู่แล้ว; เมื่อ backend schema เพิ่ม union member type จะขยายตามโดยอัตโนมัติ

## 5. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### ไฟล์ที่ต้องแก้

Backend:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.spec.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts`

Frontend:

- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx`
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-form.test.tsx`
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-api.test.tsx`
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-client-page.test.tsx`

### ไฟล์ที่ตรวจแล้วแต่ไม่คาดว่าต้องแก้

- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts` — ใช้ backend schema และ POST `parsedBody.data` อยู่แล้ว
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts` — ส่ง `assignment_mode` ผ่าน type ที่ infer จาก backend อยู่แล้ว
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts` — endpoint และ DTO wiring รองรับ contract เดิมโดยไม่ต้องเปลี่ยน
- Prisma schema/migrations — ไม่มีข้อมูลใหม่ที่ต้อง persist

### ไฟล์ที่ต้องสร้างหรือลบ

- ไม่มี

หาก Implementor พบว่าต้องแก้ไฟล์นอกชุดข้างต้นเพื่อให้ requirement นี้ทำงาน ให้หยุดและตรวจเหตุผลกับแผน/โค้ดจริงก่อน ห้ามขยาย scope เพื่อ refactor ที่ไม่จำเป็น

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์และเกณฑ์ผ่าน

### ขั้นที่ 1 — ขยาย backend contract และกำหนด default

ไฟล์:

- `auto-create.command.ts`
- `auto-create.command.spec.ts`

การเปลี่ยนแปลง:

1. เพิ่ม `TRADITIONAL` ใน enum ของ `assignment_mode`
2. ใส่ `.default('TRADITIONAL')`
3. ปรับ test base fixture/expectation ให้สะท้อน default ใหม่
4. เพิ่ม/ปรับ test ให้ครอบคลุม:
   - missing assignment mode -> `TRADITIONAL`
   - explicit ทั้งสามค่าผ่าน
   - invalid/empty ยัง fail
   - default/explicit ของ `target_mode` ไม่เปลี่ยน

เกณฑ์ผ่าน:

- DTO schema ทำงานตามข้อ 4.1 ทุกข้อ
- ไม่มีการเปลี่ยน param schema, datetime validation, selected-ID validation หรือ response type

### ขั้นที่ 2 — เพิ่ม `TRADITIONAL` ใน handler โดยคืน algorithm เดิม

ไฟล์:

- `auto-create.handler.ts`
- `auto-create.handler.spec.ts`

การเปลี่ยนแปลง:

1. แยก branch/ranking behavior สำหรับ `TRADITIONAL` อย่างชัดเจน ห้ามปล่อยให้ค่าใหม่ตกเข้า `else` ของ `MAXIMIZE_REST` โดยอัตโนมัติ
2. ให้ `TRADITIONAL` เลือก candidate ตาม canonical Staff ID lexical ascending และ hard constraints เดิม
3. คง `MAXIMIZE_REST`/`BALANCE_TOTAL` logic เดิมโดยไม่เปลี่ยน score/tie-break
4. คง `groupBy` previous/next boundary ให้ถูกเรียกเฉพาะ `MAXIMIZE_REST`
5. เพิ่ม test อย่างน้อยสำหรับ:
   - เมื่อ DB คืน Staff IDs ไม่เรียงและ request order ไม่เรียง `TRADITIONAL` ยังเลือก lexical-smallest canonical available Staff ID ก่อน
   - เมื่อ candidate แรกไม่ว่างจาก existing slot/Holiday/planned ให้ข้ามไป candidate ถัดไปตามลำดับ
   - `TRADITIONAL` ไม่เรียก boundary `groupBy` ที่สงวนไว้สำหรับ `MAXIMIZE_REST`
   - best-effort เมื่อคนว่างไม่พอ ยังไม่สร้าง slot ที่ conflict
   - test ที่ยืนยันไม่ update/delete slot เดิมให้ครอบคลุม `TRADITIONAL` เพิ่มจากสอง mode เดิม
   - regression tests ของ `MAXIMIZE_REST` และ `BALANCE_TOTAL` ยังผ่านทั้งหมด

เกณฑ์ผ่าน:

- ผล `TRADITIONAL` เทียบเท่า auto-create algorithm ก่อนมี strategy optimization
- hard constraints, Min/Max, DST, transaction, retry และ write behavior ไม่เปลี่ยน
- ไม่มี query history เพิ่มสำหรับ `TRADITIONAL`

### ขั้นที่ 3 — เพิ่ม radio “แบบดั้งเดิม” และตั้งเป็น UI default

ไฟล์:

- `auto-create-form.tsx`
- `auto-create-form.test.tsx`

การเปลี่ยนแปลง:

1. ขยาย form schema ให้รับ `TRADITIONAL`
2. เพิ่ม `assignment_mode: 'TRADITIONAL'` ใน `defaultValues`
3. เพิ่ม radio “แบบดั้งเดิม” เป็นตัวเลือกแรก พร้อม help text ตามข้อ 4.4
4. รักษา markup/accessibility pattern เดิม (`fieldset`, `legend`, `label`, `aria-describedby`, disabled state)
5. ปรับ test จาก “สอง strategy ไม่มี default” เป็น:
   - มีกลุ่ม “วิธีจัดพนักงาน” และมีสาม radio
   - “แบบดั้งเดิม” checked ตอน render
   - สอง mode เดิมไม่ checked
6. เปลี่ยน test “ต้องเลือก strategy ก่อน mutation” เป็น regression ว่า valid form submit โดยไม่แตะ strategy แล้ว mutation ได้ `assignmentMode: 'TRADITIONAL'`
7. ขยาย matrix ของ `target_mode` × `assignment_mode` ให้ครอบคลุม `TRADITIONAL`, `MAXIMIZE_REST`, `BALANCE_TOTAL` โดยยืนยันว่า target และ assignment เป็นอิสระต่อกัน
8. test validation เวลา/template/staff และ pending state ต้องยังผ่าน; อย่าลบ coverage ที่ไม่เกี่ยวกับ assignment mode

เกณฑ์ผ่าน:

- ผู้ใช้เห็น “แบบดั้งเดิม” เป็นค่า selected ทันที
- valid submission โดยไม่เลือก strategy เพิ่มเติมส่ง `TRADITIONAL`
- ผู้ใช้เลือกสอง mode เดิมได้และ payload ถูกต้อง
- ไม่มี regression ของ timezone/DST/form validation

### ขั้นที่ 4 — ปรับ frontend API/page regression tests ให้ยืนยัน default แบบ end-to-end ของ frontend layer

ไฟล์:

- `auto-create-api.test.tsx`
- `auto-create-client-page.test.tsx`

การเปลี่ยนแปลงใน `auto-create-api.test.tsx`:

1. เพิ่ม `TRADITIONAL` ใน explicit-mode matrix และ hook payload matrix
2. เปลี่ยน test “missing assignment mode ถูก block ก่อน HTTP” เป็น:
   - ส่ง external-like body ที่ละ `assignment_mode`
   - schema parse ผ่าน
   - HTTP ถูกเรียกด้วย body ที่ normalize แล้วและมี `assignment_mode: 'TRADITIONAL'`
3. invalid assignment mode ยังต้องถูก block ก่อน HTTP
4. cache invalidation/auth/error behavior เดิมต้องไม่เปลี่ยน

การเปลี่ยนแปลงใน `auto-create-client-page.test.tsx`:

1. ใน regression test ที่ submit form จริงเพื่อยืนยัน Place timezone/navigation ให้ไม่จำเป็นต้อง click strategy ก่อน submit
2. ยืนยัน mutation ได้ `assignmentMode: 'TRADITIONAL'` พร้อมเวลา offset ของ Place เดิม
3. tests เรื่อง loading/error/Place lookup ยังคงเดิม

เกณฑ์ผ่าน:

- frontend schema normalization, hook payload และ page form สอดคล้องกันว่า default คือ `TRADITIONAL`
- explicit advanced modes ยังส่งค่าตรงตามที่ผู้ใช้เลือก

## 7. สิ่งที่ Implementor ต้องระวัง

- ห้ามใช้ลำดับ `body.staff_ids` เป็นลำดับของ “แบบดั้งเดิม”; behavior เดิมใช้ canonical IDs จากฐานข้อมูลที่ `.sort()` แล้ว
- PostgreSQL อาจคืน UUID เป็น lowercase แม้ input ใช้ uppercase; map/set/state ภายใน handler ต้องใช้ canonical IDs ชุดเดียวกัน ห้ามทำ key จาก raw request แล้ว lookup ด้วย canonical ID โดยไม่ normalize
- ห้าม implement `TRADITIONAL` ด้วย branch fallback ที่ปัจจุบันหมายถึง rest score เพราะจะทำให้ behavior กลายเป็น `MAXIMIZE_REST` โดยไม่ตั้งใจ
- ห้ามเปลี่ยน tie-break หรือ score ของ `MAXIMIZE_REST`/`BALANCE_TOTAL`
- ห้ามเปลี่ยน `target_mode` semantics/default เพื่อทำงานนี้
- ห้ามเปลี่ยน half-open overlap semantics (`start < other.end && end > other.start`)
- ห้ามผ่อน validation ของ Staff Position, Slot Template/Slot Type, Holiday, Min/Max หรือ DST
- ห้ามแก้ไข slot เดิม; flow นี้ยังต้อง insert เฉพาะ `planned` slots
- ห้ามย้าย boundary query ของ `MAXIMIZE_REST` ให้รันทุก mode เพราะ `TRADITIONAL` ไม่ต้องใช้ข้อมูลนั้นและจะเพิ่ม query โดยไม่จำเป็น
- การที่ missing `assignment_mode` เปลี่ยนจาก “reject” เป็น “default TRADITIONAL” เป็น Business Logic ที่ตั้งใจในงานนี้; อย่าคง test/validation เก่าที่บังคับ explicit selection
- frontend API ต้องส่ง `parsedBody.data` ต่อไป เพื่อให้ default จาก schema ถูก materialize ใน payload; ห้ามเปลี่ยนกลับไปส่ง raw body
- ไม่ต้องเพิ่ม Prisma migration หรือ persist `assignment_mode`; mode เป็น input ของการคำนวณครั้งนั้นเท่านั้น
- หลีกเลี่ยง refactor ขนาดใหญ่ใน handler ขณะเพิ่ม branch ใหม่ เพราะมี logic transaction/DST/MinMax/retry ที่ไม่อยู่ใน scope

## 8. Test ที่ต้องเพิ่มหรือแก้ และคำสั่งตรวจสอบ

### Backend tests ที่ต้องครอบคลุม

- DTO: default `TRADITIONAL`, explicit 3 modes, invalid mode
- Handler `TRADITIONAL`: lexical canonical order, unavailable-candidate skip, best-effort, no rest-boundary query, no update/delete existing rows
- Handler regression: `MAXIMIZE_REST` และ `BALANCE_TOTAL` ชุดเดิมทั้งหมดต้องผ่าน

รัน narrow backend tests ก่อน:

```bash
pnpm --dir ecosystem-backend-nest-js exec jest \
  src/modules/work-schedule/slot/commands/auto-create.command.spec.ts \
  src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts \
  --runInBand
```

### Frontend tests ที่ต้องครอบคลุม

- Form: 3 radios, default “แบบดั้งเดิม”, submit default ได้, explicit advanced modes ได้, pending/validation เดิมไม่เสีย
- API: missing mode normalize เป็น `TRADITIONAL`, explicit 3 modes, invalid mode ยัง block ก่อน HTTP
- Page: valid submit โดยไม่แตะ strategy ส่ง `TRADITIONAL` พร้อม Place timezone ที่ถูกต้อง

รัน narrow frontend tests ก่อน:

```bash
pnpm --dir ecosystem-frontend-next-js exec jest \
  tests/work-schedule/auto-create-form.test.tsx \
  tests/work-schedule/auto-create-api.test.tsx \
  tests/work-schedule/auto-create-client-page.test.tsx \
  --runInBand
```

### Static checks ที่ต้องผ่านหลัง narrow tests

```bash
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
```

### Final repository verification

```bash
pnpm run verify
```

Root `verify` เป็นคำสั่งเดียวกับที่ GitHub Actions workflow ใช้ และครอบคลุม frontend tests, Prisma validate/generate, backend/frontend typecheck, lint, build, backend tests และ migration tests

งานนี้ไม่กำหนด manual browser test หรือ test ที่ต้องใช้ฐานข้อมูลจริงเป็น acceptance criterion; unit/integration tests และ `pnpm run verify` อยู่ในขอบเขตที่ Implementor ทำได้ผ่าน command line/GitHub Action ตามกติกา repository

## 9. Definition of Done

ถือว่า Implement เสร็จเมื่อครบทุกข้อ:

1. `assignment_mode` รองรับ `TRADITIONAL | MAXIMIZE_REST | BALANCE_TOTAL` และ default เป็น `TRADITIONAL`
2. request ที่ละ `assignment_mode` ได้ behavior แบบดั้งเดิมแทนการถูก reject
3. `TRADITIONAL` ใช้ deterministic lexical canonical Staff ID + first-available algorithm เทียบเท่า auto-create เดิม
4. หน้า Auto Create แสดง “แบบดั้งเดิม” และเลือกเป็นค่าเริ่มต้น
5. `MAXIMIZE_REST`, `BALANCE_TOTAL`, `MINIMUM`, `MAXIMUM` และ hard constraints เดิมไม่มี regression
6. ไม่แก้ endpoint, database schema/migration หรือ slot เดิม
7. narrow tests, typecheck, lint และ `pnpm run verify` ผ่าน
