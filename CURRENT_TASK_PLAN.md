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

Frontend ที่ `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts` import `AutoCreateDtoBodySchema` จาก backend โดยตรงเพื่อ infer type และ validate payload ก่อน POST ดังนั้น contract ใหม่ต้องเพิ่มที่ backend schema เพียงแหล่งเดียว และ frontend API layer จะ validate schema เดียวกัน

Endpoint ปัจจุบันใน `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts` คือ `POST /api/work-schedule/slot/positions/:position_id/auto` และส่ง `AutoCreateDtoBody` เข้า `AutoCreateCommand`; endpoint path และ controller wiring ไม่ต้องเปลี่ยน

### 3.2 การคำนวณจำนวน slot ที่ต้องเพิ่มปัจจุบัน

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts` ทำงานภายใต้ Serializable transaction และ lock `work_schedule_position` ก่อนอ่านข้อมูลสำคัญซ้ำ ภายใน flow เดิมมี invariant ที่ต้องรักษา:

1. ตรวจสิทธิ์ Work Schedule Admin ก่อนเริ่ม transaction
2. lock Position ด้วย `SELECT ... FOR UPDATE` แล้วอ่าน Position/Place ซ้ำใน transaction
3. ตรวจ Position/Place ว่ายังใช้งานได้และ timezone เป็น IANA timezone ที่ถูกต้อง
4. ตรวจ selected Slot Template/Slot Type ว่าอยู่ใน Position เดียวกันและข้อมูลเวลา/duration ถูกต้อง
5. ตรวจ selected Staff ทุกคนว่ามี active `WorkScheduleStaffPosition` ใน Position เป้าหมาย
6. สร้าง occurrence จาก template ตาม local calendar ของ Place, รองรับ DST และปฏิเสธ selected templates ที่ overlap กัน
7. query slot เดิมที่ overlap request ด้วย `actualStartTime < request.end` และ `actualEndTime > request.start` โดย query เดียวครอบคลุมทั้ง target-position coverage และ conflict ของ selected staff ข้าม Position
8. query Holiday และ Min/Max ที่ overlap request
9. `target_mode === 'MINIMUM'` ใช้ `calculateRequirements(...)` เพื่อเติมเฉพาะ deficit ให้ถึง Min
10. `target_mode === 'MAXIMUM'` ใช้ `calculateMaximumCapacity(...)` เพื่อเติมได้มากที่สุดภายใต้ Max; ถ้าไม่มี finite Max ความจุอาจเป็น `Infinity` และ flow เดิมจะหยุดจากจำนวน selected staff ที่มีจริง
11. ก่อน insert เรียก `validateMaximum(...)` และเขียนเฉพาะ slot ใหม่ด้วย `workScheduleSlot.createMany(...)`
12. `P2034` ถูก retry โดยสร้าง transaction ใหม่และอ่าน planning input ใหม่ทุกครั้ง

### 3.3 วิธีเลือกพนักงานปัจจุบันและ canonical Staff ID

หลัง validate Staff แล้ว handler สร้าง `staffCandidates` จาก `workScheduleStaffPosition.findMany(...)`, de-duplicate และ `.sort()` จากนั้นสำหรับแต่ละ occurrence จะวน Staff ID ตาม lexical ascending และเลือก “คนแรกที่ว่าง” จนครบ `requiredAdditional` หรือหมดพนักงานที่ว่าง โดย `isStaffAvailable(...)` ปฏิเสธ staff ที่ overlap กับ slot เดิม, Holiday หรือ slot ที่วางแผนไว้ในคำขอเดียวกัน

โค้ดปัจจุบันระบุไว้ชัดเจนว่า PostgreSQL คืน UUID เป็น lowercase แม้ input จะใช้ uppercase และ DTO ยอมรับ UUID ตัวพิมพ์ใหญ่ได้ ดังนั้น:

- `staffCandidates` ที่อ่านกลับจากฐานข้อมูลเป็น canonical Staff ID สำหรับ logic ภายใน handler
- state/map ของ strategy ใหม่ต้อง key และ lookup ด้วย canonical ID ชุดเดียวกัน หรือ normalize ให้เหมือนกันก่อนใช้
- ห้ามสร้าง count/boundary map จาก raw `body.staff_ids` แล้ว lookup ด้วย `staffCandidates` โดยไม่ normalize เพราะ request ตัวพิมพ์ใหญ่จะทำให้ key ไม่ตรงกันได้

ดังนั้นก่อนงานนี้ระบบมี deterministic order แต่ยังไม่มี optimization ตามเวลาพักหรือจำนวนเวร

### 3.4 UI ปัจจุบัน

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx` มี fieldset “เป้าหมายการจัดเวร” สำหรับ `MINIMUM`/`MAXIMUM`, ช่องเวลา, template และ staff เท่านั้น และมี default ของ `target_mode` เป็น `MINIMUM`

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts` สร้าง payload โดยส่ง `target_mode`, เวลา, template IDs และ staff IDs ยังไม่มี assignment strategy

### 3.5 Schema ฐานข้อมูลที่เกี่ยวข้อง

`ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma` มี `WorkScheduleSlot` พร้อม `positionId`, `staffId`, `slotTypeId`, `actualStartTime`, `actualEndTime` และ index `positionId + actualStartTime` กับ `staffId + actualStartTime` ข้อมูลที่ต้องใช้สำหรับสอง strategy มีครบ และ strategy ไม่ต้องถูก persist จึงไม่ต้องแก้ Prisma schema หรือสร้าง migration ในงานนี้

`ecosystem-backend-nest-js/package.json` ประกาศ `prisma` และ `@prisma/client` เป็น `^7.8.0`; การอ่าน boundary สำหรับ `MAXIMIZE_REST` ให้ใช้ `groupBy(...)`/aggregate ที่คืนเพียง endpoint ที่จำเป็น แทนการโหลด slot history ทั้งหมดหรือทำ query ต่อ staff ทีละคน

### 3.6 Test fixtures ปัจจุบันที่ได้รับผลโดยตรงจาก contract ใหม่

- `auto-create.command.spec.ts` มี base body ที่ปัจจุบันไม่ระบุ `target_mode` เพื่อทดสอบ default `MINIMUM`; หลังเพิ่ม `assignment_mode` แบบ required fixture นี้ต้องระบุ `assignment_mode` เสมอ เว้นแต่ test ที่ตั้งใจทดสอบ missing strategy
- `auto-create.handler.spec.ts` มี helper `command(...)` ที่สร้าง `AutoCreateDtoBody` โดยตรง และมี test ที่ parse body ซึ่งละ `target_mode` เพื่อยืนยัน default `MINIMUM`; helper/fixture เหล่านี้ต้องเพิ่ม `assignment_mode` ที่ชัดเจน โดยคง test ของ `target_mode` default ไว้
- `auto-create.handler.spec.ts` มี regression ที่รับ UUID selection/position ตัวพิมพ์ใหญ่แล้วทำงานกับ UUID canonical จากฐานข้อมูลได้อยู่แล้ว; strategy tests ใหม่ต้องไม่ทำให้ invariant นี้หาย
- `auto-create-form.test.tsx` มีหลาย test ที่ submit form โดยยังไม่มี strategy; test ที่ไม่ได้ทดสอบ validation ของ strategy ต้องเลือก strategy แบบ explicit ก่อน submit
- `auto-create-api.test.tsx` มี `body: AutoCreateDtoBody` และ hook fixture ที่ปัจจุบันมีเฉพาะ `target_mode`; หลัง contract เปลี่ยนต้องเพิ่ม strategy ทั้งใน direct API และ hook mutation fixture
- `auto-create-client-page.test.tsx` มี regression test ที่ submit formจริงเพื่อยืนยัน Place timezone/navigation; เมื่อ strategy เป็น required test นี้ต้องเลือก strategy ก่อน submit มิฉะนั้น mutation จะไม่ถูกเรียก

## 4. Business Logic ที่คาดหวังหลัง Implement

### 4.1 แยก “จำนวนที่ต้องสร้าง” ออกจาก “เลือกใครมาลง”

ลำดับการตัดสินใจต้องเป็น:

1. ใช้ logic เดิมของ `target_mode` คำนวณ `requiredAdditional` ของแต่ละ occurrence ก่อน
2. ถ้า `requiredAdditional <= 0` ไม่ต้องเลือก staff สำหรับ occurrence นั้น
3. ถ้าต้องเพิ่ม ให้กรองเฉพาะ staff ที่ `isStaffAvailable(...)` ตาม hard constraints เดิม
4. ใช้ `assignment_mode` จัดอันดับเฉพาะ staff ที่ว่าง แล้วเลือกทีละ 1 คน
5. หลังเลือกแต่ละคน ให้เพิ่ม slot เข้า `planned` ทันที แล้ว update state ของ strategy ที่เกี่ยวข้องก่อนคำนวณ candidate/score ครั้งถัดไป
6. ทุก iteration ต้อง break ทันทีเมื่อไม่มี available candidate แม้ `requiredAdditional` จะเป็น `Infinity`; ห้ามมี loop ที่พึ่งพา `Infinity` เป็นตัวหยุด
7. ถ้าจำนวน staff ที่ว่างน้อยกว่า `requiredAdditional` ให้รักษาพฤติกรรมเดิมคือสร้างได้เท่าที่ feasible โดยไม่ทำให้เกิด overlap/ผิด Holiday/เกิน Max; ห้ามสร้าง slot ผิด constraint เพื่อให้ครบตัวเลข
8. ทุก in-memory strategy state ที่ผูกกับ Staff ID ต้องใช้ canonical ID ชุดเดียวกับ `staffCandidates`; raw `body.staff_ids` ใช้เป็น input query ได้ แต่ห้ามเป็น key อีกชุดหนึ่งโดยไม่ normalize

เหตุผล: strategy ใหม่ต้องเปลี่ยนเฉพาะ “ใครถูกเลือก” ไม่ใช่เปลี่ยน Min/Max, availability, occurrence generation หรือจำนวนที่ระบบอนุญาตให้พยายามสร้าง และต้องรักษาพฤติกรรมเดิมเมื่อ request UUID ใช้ uppercase

### 4.2 `BALANCE_TOTAL`: กระจายจำนวนเวรรวมให้ใกล้เคียงกัน

สำหรับ selected staff ทุกคน ให้สร้าง `totalCount` ที่เริ่มจาก existing slots และเพิ่มตาม planned slots:

- `existingCount`: จำนวน `WorkScheduleSlot` ของ staff คนนั้นที่ overlap ช่วง request ตาม half-open predicate เดิม โดยนับข้ามทุก Position
- `plannedCount`: จำนวน slot ใน `planned` ของ staff คนนั้นที่เพิ่มจาก request ปัจจุบัน
- `totalCount = existingCount + plannedCount`

วิธี implement ที่คาดหวัง:

1. สร้าง count map จาก canonical `staffCandidates` ทุกคน เริ่มต้นเป็น 0
2. ใช้ผล `existingSlots` จาก range query เดิมเท่านั้นในการเพิ่ม existing count; ห้าม query ประวัตินอก request สำหรับโหมดนี้
3. ตอนนับ existing row ให้ lookup ด้วย `slot.staffId` ซึ่งเป็น canonical DB value และเพิ่มเฉพาะเมื่อ key อยู่ใน count map
4. ก่อน assignment แต่ละครั้ง กรอง available candidates ด้วย `isStaffAvailable(...)`
5. เลือก candidate ที่ `totalCount` ต่ำที่สุด
6. ถ้า count เท่ากัน ให้เลือก `staffId` lexical ascending
7. หลัง `planned.push(...)` ให้เพิ่ม count ของ canonical staff ID ที่เลือกทันที เพื่อให้ occurrence ถัดไปเห็นยอดใหม่

ข้อจำกัดที่ยอมรับ:

- slot ที่อยู่นอก request และไม่ overlap request ไม่นับ
- slot ที่คร่อมขอบ request และ overlap จริงนับ 1
- slot ที่เพียงแตะขอบ (`actualEndTime === request.start` หรือ `actualStartTime === request.end`) ไม่นับ
- ถ้าเวรเดิมไม่สมดุล หรือ availability/Holiday/Min-Max บังคับให้เลือกบางคน ระบบไม่ต้องและห้ามแก้เวรเดิมเพื่อทำยอดให้เท่ากันย้อนหลัง

### 4.3 `MAXIMIZE_REST`: เพิ่มเวลาพักระหว่างเวรให้มากที่สุด

สำหรับ available candidate แต่ละคนและ occurrence ที่กำลังจะลง ให้พิจารณา slot ของ staff คนนั้นข้ามทุก Position จาก 3 แหล่ง:

1. existing slots ที่ overlap request จาก range query เดิม
2. nearest boundary ก่อน/หลัง request ที่อ่านเพิ่มเฉพาะโหมดนี้
3. `planned` slots จาก request ปัจจุบัน

นิยาม neighbor:

- `previous`: slot ที่จบไม่เกิน `occurrence.start` และมี `end` มากที่สุด
- `next`: slot ที่เริ่มไม่น้อยกว่า `occurrence.end` และมี `start` น้อยที่สุด
- candidate ที่มี slot overlap occurrence ถูกตัดออกด้วย `isStaffAvailable(...)` ก่อน scoring

คำนวณ:

- `previousGap = occurrence.start - previous.end` ถ้ามี previous มิฉะนั้น `Infinity`
- `nextGap = next.start - occurrence.end` ถ้ามี next มิฉะนั้น `Infinity`
- `restScore = min(previousGap, nextGap)`

เลือก candidate ที่ `restScore` มากที่สุด และ tie ด้วย `staffId` lexical ascending

ข้อกำหนดสำคัญของ boundary query เพื่อไม่ให้เกิด N+1 หรือโหลด history ทั้งหมด:

- รันเฉพาะเมื่อ `body.assignment_mode === 'MAXIMIZE_REST'`
- previous boundary ใช้ `tx.workScheduleSlot.groupBy(...)` ตาม `staffId` ของ selected staff, filter `actualEndTime <= request.start`, ไม่ filter `positionId`, และ aggregate `_max.actualEndTime`
- next boundary ใช้ `tx.workScheduleSlot.groupBy(...)` ตาม `staffId` ของ selected staff, filter `actualStartTime >= request.end`, ไม่ filter `positionId`, และ aggregate `_min.actualStartTime`
- query filter ใช้ selected staff IDs ได้ แต่ผล aggregate ที่คืนจาก DB ต้องแปลงเป็น map โดยใช้ `row.staffId` canonical และ scoring ต้อง lookup ด้วย canonical candidate ID จาก `staffCandidates`
- boundary map ต้องไม่ key ด้วย raw request casing โดยไม่ normalize
- boundary query แต่ละด้านต้องคืนอย่างมากหนึ่ง aggregate row ต่อ selected staff และต้องไม่อ่าน slot history มาเก็บใน memory
- range query เดิมยังเป็น source ของ slot ภายใน/คร่อม request; aggregate boundary ใช้เฉพาะบริเวณนอก request
- เมื่อ transaction retry จาก `P2034` ต้องรัน boundary aggregates ใหม่ภายใน transaction รอบใหม่ด้วย

เหตุผลที่ aggregate endpoint เพียงพอ: occurrence ใหม่ทั้งหมดอยู่เต็มภายใน request; slot ที่อยู่ในหรือคร่อม request มีใน range query เดิมแล้ว ดังนั้น slot นอก request ที่มีผลต่อ nearest neighbor มีเพียงเวลาจบที่มากที่สุดก่อนขอบซ้าย และเวลาเริ่มที่น้อยที่สุดหลังขอบขวาของแต่ละ staff

ข้อกำหนด scoring เพิ่มเติม:

- slot ที่แตะ occurrence พอดีไม่ overlap แต่ให้ gap = 0
- ถ้าไม่มี previous และ next ทั้งคู่ `restScore = Infinity`
- ห้าม sort ด้วยการลบ score แบบ `bScore - aScore` เพราะ `Infinity - Infinity` ให้ `NaN`; ให้ compare แบบ explicit แล้วใช้ Staff ID เป็น tie-break
- หลังเพิ่ม slot เข้า `planned` ต้องให้ slot นั้นมีผลต่อ neighbor ของ assignment/occurrence ถัดไปทันที

### 4.4 Existing slots ต้อง immutable

ทั้งสอง strategy มีสิทธิ์อ่าน slot เดิมเพื่อ availability/count/score เท่านั้น ห้ามเรียก update/delete หรือแก้เวลา/staff/slot type ของ record เดิม การ persist หลังคำนวณสำเร็จต้องยังเป็น `workScheduleSlot.createMany(...)` สำหรับ `planned` เท่านั้น

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
9. `ecosystem-frontend-next-js/tests/work-schedule/auto-create-client-page.test.tsx`

### ไฟล์ที่ยืนยันว่าเกี่ยวข้องแต่ไม่คาดว่าต้องแก้

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts`: endpoint/command wiring รับ body DTO อยู่แล้ว
- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`: schema มีข้อมูลที่ต้องใช้ครบและ strategy ไม่ต้อง persist
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts`: import schema/type จาก backend และ POST `parsedBody.data` ทั้งก้อน จึงควรรับ field ใหม่โดยไม่แก้ source; ต้องใช้ test ยืนยัน
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/auto/client-page.tsx`: strategy เป็น state ภายใน form ไม่ต้องเพิ่ม prop จาก page

### ไฟล์ที่ไม่ต้องสร้างหรือลบ

- ไม่สร้าง migration
- ไม่สร้าง Prisma model/enum สำหรับ strategy
- ไม่สร้าง endpoint ใหม่
- ไม่สร้าง service/module ใหม่
- ถ้าระหว่าง Implement พบว่าจำเป็นต้องเปลี่ยน schema, endpoint semantics หรือ architecture นอกไฟล์ข้างต้น ให้หยุดและส่งกลับ Planner แทนการขยาย scope เอง

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์และเกณฑ์ผ่าน

### ขั้นที่ 1 — เพิ่ม API contract และปรับ fixture ของ DTO tests

แก้ `auto-create.command.ts`:

- เพิ่ม `assignment_mode: z.enum(['MAXIMIZE_REST', 'BALANCE_TOTAL'])`
- ห้ามเปลี่ยน enum/default ของ `target_mode`
- ห้ามเพิ่ม default ให้ `assignment_mode`

แก้ `auto-create.command.spec.ts`:

- base body ต้องมี `assignment_mode` ที่ valid เพื่อให้ test เดิมโฟกัส validation เดิมได้
- test `target_mode` omitted ต้องยัง parse เป็น `MINIMUM` เมื่อ `assignment_mode` ถูกระบุ
- รับ `MAXIMIZE_REST`
- รับ `BALANCE_TOTAL`
- reject assignment mode ที่ invalid และ string ว่าง
- reject body ที่ไม่มี `assignment_mode`
- regression ของ UUID, datetime offset และ `end > start` ต้องยังผ่าน

**เกณฑ์ผ่าน:** API มี assignment strategy 2 ค่าเท่านั้น, request ต้องระบุ strategy ชัดเจน และ `target_mode` default เดิมยังทำงานโดยไม่กลายเป็น default ของ strategy

### ขั้นที่ 2 — Refactor assignment loop โดยรักษา hard constraints เดิม

แก้ `auto-create.handler.ts`:

- คง `staffCandidates` ที่ sort lexical เพื่อใช้เป็น deterministic candidate set/tie-break และเป็น canonical Staff ID set ของ in-memory strategy state
- แยกขั้น “กรอง available candidates” ออกจาก “เลือก candidate ตาม strategy”
- สำหรับแต่ละ occurrence ให้เลือกทีละ assignment, `planned.push(...)` ทันที และคำนวณ candidate ใหม่
- เมื่อไม่มี available candidate ให้ break แม้ `requiredAdditional` เป็น `Infinity`
- state/map ที่ key ด้วย Staff ID ต้องใช้ `staffCandidates`/DB-returned canonical IDs อย่างสอดคล้องกัน ห้ามสลับกับ raw request casing โดยไม่ normalize
- คง `isStaffAvailable(...)`, `calculateRequirements(...)`, `calculateMaximumCapacity(...)`, `validateMaximum(...)`, timezone/DST/template validation, Serializable transaction, row lock, retry และ `createMany` semantics เดิม

แก้ `auto-create.handler.spec.ts` fixture หลัก:

- `command(...)` ต้องใส่ `assignment_mode: 'BALANCE_TOTAL'` เป็น explicit baseline เพื่อให้ regression tests เดิมยัง deterministic และไม่พึ่ง default ที่ไม่มีจริง
- test ที่ parse body โดยละ `target_mode` ต้องเพิ่ม `assignment_mode` และยังยืนยันได้ว่าเฉพาะ `target_mode` default เป็น `MINIMUM`
- regression UUID ตัวพิมพ์ใหญ่เดิมต้องยังผ่านหลัง refactor

**เกณฑ์ผ่าน:** จำนวน slot ที่ต้องพยายามสร้างยังมาจาก `target_mode`; strategy มีผลเฉพาะ staff selection; loop จบได้เมื่อ candidate หมดทั้งใน finite และ infinite capacity case; request UUID casing ไม่เปลี่ยนผล logic

### ขั้นที่ 3 — Implement `BALANCE_TOTAL`

ใน `auto-create.handler.ts`:

- สร้าง count map ของ canonical selected staff จาก `staffCandidates`
- นับจาก range-limited `existingSlots` เดิม เฉพาะ row ที่ `staffId` อยู่ใน count map
- นับ slot ของ selected staff ข้ามทุก Position
- ไม่ query slot นอก request
- เรียง/เลือก candidate ตาม `(totalCount asc, staffId asc)`
- เพิ่ม count ทันทีหลัง staff ถูก push เข้า `planned`

เพิ่ม/แก้ test ใน `auto-create.handler.spec.ts` อย่างน้อย:

1. คนที่ existing count ต่ำกว่าถูกเลือกก่อน แม้ Staff ID จะไม่ได้มาก่อน
2. count รวม slot ข้าม Position
3. slot ก่อน/หลัง request ที่ไม่ overlap ไม่ถูกนับ
4. slot ที่คร่อมขอบและ overlap ถูกนับ ส่วน slot ที่แตะขอบพอดีไม่ถูกนับ
5. planned จาก occurrence ก่อนหน้าทำให้ occurrence ถัดไปเห็น count ใหม่
6. count เท่ากันเลือก Staff ID lexical ascending
7. staff ที่ count ต่ำแต่ไม่ว่าง/ติด Holiday ต้องไม่ถูกเลือก
8. behavior ของ `MINIMUM`/`MAXIMUM` เดิมยังคงจำนวน slot ตาม capacity เดิมเมื่อ strategy เป็น `BALANCE_TOTAL`
9. เมื่อ `staff_ids` ใน request ใช้ uppercase แต่ DB/existing slots คืน lowercase, count map ยัง match canonical staff และเลือกคนตาม count ที่ถูกต้อง

**เกณฑ์ผ่าน:** ทุก slot ใหม่เลือก selected staff ที่มี `existing + planned` count ต่ำที่สุดในกลุ่ม available ณ จุดนั้น โดยไม่แก้ slot เดิม และไม่ขึ้นกับ casing ของ UUID input

### ขั้นที่ 4 — Implement `MAXIMIZE_REST` ด้วย boundary aggregates

ใน `auto-create.handler.ts`:

- เพิ่ม two aggregate reads เฉพาะ `MAXIMIZE_REST` ตามข้อ 4.3:
  - previous: group by `staffId`, `_max.actualEndTime`, filter `actualEndTime <= request.start`
  - next: group by `staffId`, `_min.actualStartTime`, filter `actualStartTime >= request.end`
- ทั้งสอง query ใช้ selected staff IDs และห้าม filter `positionId`
- สร้าง maps ของ boundary endpoints จาก canonical `row.staffId` ที่ DB คืน
- score โดยรวม boundary maps + existing slots ใน request + `planned`
- lookup boundary maps ด้วย canonical candidate ID จาก `staffCandidates`
- กรอง availability ก่อน scoring
- tie-break ด้วย Staff ID และ compare `Infinity` แบบ explicit
- ห้าม query ต่อ staff ทีละคน และห้ามโหลด full history

แก้ mock ใน `auto-create.handler.spec.ts` ให้ `tx.workScheduleSlot` รองรับ `groupBy` และตั้ง default เป็น empty array

เพิ่ม/แก้ test อย่างน้อย:

1. previous aggregate ก่อน request มีผลต่อ first/early occurrence
2. next aggregate หลัง request มีผลต่อ last/late occurrence
3. เลือกคนที่ minimum rest gap มากกว่า
4. existing slot ภายใน request มีผลต่อ previous/next neighbor
5. planned slot มีผลต่อ occurrence ถัดไป
6. slot ของ staff ใน Position อื่นมีผลต่อ rest score
7. touching slot ให้ gap 0 แต่ไม่ overlap
8. ไม่มี neighbor ทั้งสองด้านให้ score `Infinity`
9. score เท่ากัน—including `Infinity` เท่ากัน—เลือก Staff ID lexical ascending
10. candidate ที่มี score สูงแต่ overlap/Holiday ถูกตัดก่อน scoring
11. `BALANCE_TOTAL` ต้องไม่เรียก boundary `groupBy`
12. boundary `groupBy` ไม่มี `positionId` filter และใช้ selected staff IDs เท่านั้น
13. boundary aggregates ไม่เปลี่ยน target-position Min/Max coverage
14. เมื่อเกิด `P2034` ใน `MAXIMIZE_REST`, boundary aggregates ถูกอ่านใหม่ใน transaction รอบ retry
15. เมื่อ request `staff_ids` ใช้ uppercase แต่ aggregate rows คืน lowercase, boundary map ยัง lookup ด้วย canonical candidate ได้และ rest score มีผลต่อการเลือกจริง

**เกณฑ์ผ่าน:** candidate ที่ถูกเลือกมี `restScore` สูงสุดในกลุ่ม available ตามนิยาม, ใช้ข้อมูลนอก request เท่าที่จำเป็น, ไม่มี N+1/full-history read และไม่ขึ้นกับ casing ของ UUID input

### ขั้นที่ 5 — เพิ่มตัวเลือก UI และส่ง contract ใหม่

แก้ `auto-create-form.tsx`:

- เพิ่ม `assignment_mode` ใน form schema เป็น `MAXIMIZE_REST | BALANCE_TOTAL`
- field ต้อง required และกรณีไม่เลือกต้องได้ข้อความ validation “กรุณาเลือกวิธีจัดพนักงาน”
- ห้ามกำหนด default value ของ `assignment_mode`
- เพิ่ม fieldset แยกจาก “เป้าหมายการจัดเวร” ชื่อเช่น “วิธีจัดพนักงาน” พร้อม radio 2 ค่า:
  - `MAXIMIZE_REST` — “เพิ่มเวลาพักระหว่างเวรให้มากที่สุด” พร้อม help text ว่าพิจารณาเวรก่อน/หลังที่มีอยู่แล้วโดยไม่แก้เวรเดิม
  - `BALANCE_TOTAL` — “กระจายจำนวนเวรรวมให้ใกล้เคียงกัน” พร้อม help text ว่านับเวรที่ overlap ช่วงเวลาที่เลือกและเวรใหม่ที่กำลังจัด
- fieldset ใหม่ต้อง disabled ระหว่าง `isPending`
- `onSubmit` ส่ง `assignmentMode: values.assignment_mode`
- ห้ามเปลี่ยน timezone conversion/DST validation เดิม

แก้ `use-auto-create.ts`:

- เพิ่ม mutation variable `assignmentMode: AutoCreateDtoBody['assignment_mode']`
- map เป็น `assignment_mode: assignmentMode` ใน body
- คง auth token และ query invalidation เดิม

แก้ `auto-create-form.test.tsx`:

- test ที่ไม่ได้โฟกัส missing strategy ต้องเลือก strategy explicit ก่อน submit
- แสดง radio strategy 2 ค่าแยกจาก Min/Max
- ไม่เลือก strategyแล้ว submitไม่ได้ และแสดง “กรุณาเลือกวิธีจัดพนักงาน”
- เลือกแต่ละ strategy แล้ว mutation ได้ค่าถูกต้อง
- `targetMode` และ `assignmentMode` เลือกอิสระจากกัน และ payload มีทั้งสองค่า
- strategy fieldset disabled ขณะ pending
- timezone/DST, selections, toast/navigation เดิมยังผ่าน

แก้ `auto-create-api.test.tsx`:

- base `body` ต้องมี `assignment_mode`
- POST contract สำหรับ strategy ทั้งสองค่าผ่าน validation
- invalid/missing `assignment_mode` ถูก block ก่อน HTTP
- hook variable มี `assignmentMode` และ network payload มี `assignment_mode` ตรงกัน
- target mode tests ยังทดสอบได้โดยเปลี่ยน `target_mode` แยกจาก assignment mode
- cache invalidation success/failure behavior เดิมไม่เปลี่ยน

**เกณฑ์ผ่าน:** ผู้ใช้ต้องเลือก strategy ก่อน submit, request ทุกครั้งมี `assignment_mode`, Min/Max ยังเป็นคนละมิติ และ frontend ไม่มี scheduling optimization logic

### ขั้นที่ 6 — ปรับ client-page regression test ที่ submit form

แก้ `ecosystem-frontend-next-js/tests/work-schedule/auto-create-client-page.test.tsx`:

- ใน test ที่ submit form เพื่อยืนยัน Place timezone/navigation ให้เลือก strategy radio หนึ่งค่าอย่าง explicit ก่อนกด submit
- assertion หลักเรื่อง Position-derived Place, timezone offset และ navigation ต้องคงเดิม
- ไม่ต้องแก้ `client-page.tsx` เพื่อส่ง strategy prop เพราะ form จัดการ field นี้เอง

**เกณฑ์ผ่าน:** regression test ยังยืนยัน Place timezone/navigation ได้จริงหลัง form เพิ่ม required strategy และ mutation ถูกเรียกจากการ submit ที่ valid

## 7. สิ่งที่ Implementor ต้องระวัง

- ห้ามเปลี่ยนความหมาย `MINIMUM`/`MAXIMUM`
- ห้ามสร้าง default ของ `assignment_mode` ทั้ง backend และ UI
- ห้ามแก้ endpoint path หรือสร้าง endpoint แยกตาม strategy
- backend ต้องเป็น source of truth ของการจัด staff; frontend มีหน้าที่เลือก strategy และส่ง contract เท่านั้น
- ห้ามแก้ existing `WorkScheduleSlot`
- availability, balance count และ rest context ของ selected staff ต้องพิจารณาข้ามทุก Position
- target-position coverage สำหรับ Min/Max ต้องยังนับตาม Position เป้าหมายเท่านั้น
- รักษา half-open overlap semantics (`start < other.end && end > other.start`)
- อย่าเปลี่ยน timezone/DST occurrence generation
- อย่าลด transaction isolation, ถอด row lock หรือถอด retry
- gap ให้ใช้ epoch milliseconds เช่นเดียวกับ handler ปัจจุบัน
- ห้าม random tie-break
- ระวัง `Infinity` ทั้งใน `requiredAdditional` และ `restScore`: loop ต้อง break เมื่อ candidate หมด และ comparator ห้ามใช้ `Infinity - Infinity`
- `MAXIMIZE_REST` ห้าม N+1 query ต่อ staff และห้ามโหลด slot history ทั้งหมด; ใช้ 2 boundary aggregates + range query เดิม
- boundary aggregates ต้องอยู่ใน transaction เดียวกับ planning reads และต้องถูกอ่านใหม่เมื่อ transaction retry
- UUID request อาจเป็น uppercase แต่ UUID ที่อ่านจาก PostgreSQL เป็น lowercase; in-memory strategy maps/counters/boundary lookups ต้องใช้ canonical ID ชุดเดียวกับ `staffCandidates` หรือ normalize อย่างสม่ำเสมอ
- ถ้าพบข้อจำกัดจริงที่ทำให้ต้อง migration, เปลี่ยน endpoint semantics หรือขยาย architecture ให้หยุดและส่งกลับ Planner

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

### Final verification

จาก root repository ให้รัน:

```bash
pnpm run verify
```

`pnpm run verify` เป็นคำสั่งที่ GitHub Actions CI เรียกใช้ และครอบคลุม frontend tests, Prisma validation/generation, backend/frontend typecheck, lint, build, backend tests และ migration tests

## 9. Acceptance Criteria รวม

งาน Implement ถือว่าผ่านเมื่อครบทุกข้อ:

1. API รับ `assignment_mode` เฉพาะ `MAXIMIZE_REST` หรือ `BALANCE_TOTAL` และ request ที่ไม่ระบุ/ระบุผิดถูก reject
2. `target_mode` ยัง default เป็น `MINIMUM` เมื่อ omitted แต่ `assignment_mode` ไม่มี default
3. `target_mode` ควบคุมจำนวน slot ที่ต้องเพิ่มตาม logic เดิม และ assignment strategy ควบคุมเฉพาะการเลือก staff
4. `BALANCE_TOTAL` นับ existing slots เฉพาะที่ overlap request ข้ามทุก Position รวม planned slots และเลือก lowest-count available staff แบบ deterministic
5. `MAXIMIZE_REST` เลือก available staff ที่มี minimum gap ถึง nearest previous/next slot มากที่สุด โดยใช้ range query เดิม + previous/next aggregate endpoints ข้ามทุก Position
6. `MAXIMIZE_REST` ไม่เกิด N+1/full-history read และ `BALANCE_TOTAL` ไม่เรียก boundary aggregates
7. strategy state ทุกแบบใช้ canonical Staff ID อย่างสอดคล้องกัน จึงให้ผลถูกต้องแม้ request UUID ใช้ uppercase แต่ DB/aggregate คืน lowercase
8. availability, Holiday, template validation, timezone/DST, Min/Max, Serializable transaction, row lock, retry และ maximum validation เดิมยังทำงาน
9. infinite capacity/score cases จบแบบ deterministic และไม่เกิด infinite loop/`NaN` comparator behavior
10. ไม่มี update/delete existing `WorkScheduleSlot`; persist เฉพาะ slot ใหม่ผ่าน `createMany`
11. UI แสดง strategy 2 ตัวเลือกแยกจาก Min/Max, บังคับให้เลือก strategy และส่งค่าถึง backend
12. frontend API layer ยังคงใช้ backend schema เป็น contract source เดียว
13. client-page regression test submit form ได้หลังเลือก strategy และยังยืนยัน Place timezone/navigation เดิม
14. ไม่มี Prisma migration/schema change และไม่มี endpoint ใหม่
15. targeted tests ที่ระบุผ่าน และ `pnpm run verify` ผ่านทั้งหมด
