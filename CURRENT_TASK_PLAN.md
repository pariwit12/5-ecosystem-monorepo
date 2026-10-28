# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ปรับหน้าต่างแสดงรายการ slot เพื่อแสดง

- รวมขึ้นกี่เวร + นับจำนวนชั่วโมง/นาที ที่ทำงาน สำหรับพนักงานแต่ละคน
- รวมวันหยุด กี่วัน (หรือกี่ชั่วโมง/นาที) สำหรับพนักงานแต่ละคน

## 2. ขอบเขตของงาน

เพิ่มข้อมูลสรุปต่อพนักงานในกระดานรายการ slot ของหน้า Admin Work Schedule โดยคำนวณจากข้อมูล `slots` และ `workScheduleHolidays` ที่หน้าเดิมโหลดมาอยู่แล้วสำหรับช่วงเวลาที่ผู้ใช้เลือก

งานนี้เป็นการเพิ่ม derived display ฝั่ง frontend เท่านั้น:

- ไม่เพิ่ม/เปลี่ยน endpoint
- ไม่เปลี่ยน response contract ของ slot query
- ไม่เปลี่ยน Prisma schema หรือ migration
- ไม่เปลี่ยนกฎการสร้าง/แก้ไข/ลบ slot หรือวันหยุด
- ไม่เปลี่ยน logic อัตรากำลัง Min/Max และแถว `รวมคนทำงานจริง` / `เปรียบเทียบเกณฑ์`

## 3. Business Logic ก่อนเริ่ม Implement

### 3.1 ช่วงเวลาที่หน้า slot ใช้

`ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx`

- หน้าใช้ `appliedRange.startTime` และ `appliedRange.endTime` เป็นช่วงที่นำไป query และส่งเข้า `WorkScheduleBoard`
- หน้าโหลด `workScheduleSlots`, `minMaxs` และ `workScheduleHolidays` จาก query เดียว แล้วส่ง raw records ให้ board
- ดังนั้น board มีข้อมูลที่ต้องใช้คำนวณ summary อยู่แล้ว ไม่ต้องเรียก API เพิ่ม

### 3.2 ข้อมูล slot/วันหยุดที่ backend ส่งมา

`ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.handler.ts`

- slot ถูกเลือกเมื่อ `actualStartTime < end_time` และ `actualEndTime > start_time`
- วันหยุดถูกเลือกเมื่อ `startTime < end_time` และ `endTime > start_time`
- เงื่อนไขเป็น overlap แบบครึ่งเปิด: record ที่แตะขอบช่วงพอดีแต่ไม่มีเวลาทับกันจริงจะไม่ถูกส่งมา
- backend ส่งเวลาเดิมของ record กลับมา ไม่ได้ clip เวลาให้ตรงขอบช่วงที่ query
- ผลคือ record ที่เริ่มก่อนช่วงหรือจบหลังช่วงยังถูกส่งทั้ง interval และ frontend ต้อง clip ก่อนนำเวลามารวม มิฉะนั้น summary จะนับเวลานอกช่วงที่ผู้ใช้เลือก

### 3.3 กฎ overlap ที่เกี่ยวกับการรวมเวลา

`ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts`

- backend ป้องกัน slot ของพนักงานคนเดียวกันไม่ให้ทับซ้อนกัน ทั้งภายใน payload และกับ slot ที่มีอยู่แล้ว
- จึงสามารถรวมเวลาทำงานของ slot ที่ผ่านการ clip ทีละรายการได้โดยไม่เกิด double-count จาก slot ของพนักงานคนเดียวกัน

`ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`

- การสร้างวันหยุดป้องกันวันหยุดทับกับ slot ของพนักงาน
- แต่ไม่ได้ห้าม holiday records ของพนักงานคนเดียวกันทับกัน
- logic ตรวจ minimum staffing ของ backend ระบุชัดว่าพนักงานที่มีวันหยุดหลายรายการทับกันต้องถูกนับว่า absent เพียงครั้งเดียว
- เพราะฉะนั้น `เวลาหยุดรวม` ห้ามบวก duration ของ holiday records ตรง ๆ; ต้อง merge/union ช่วงวันหยุดที่ทับกันก่อนรวมเวลา

### 3.4 Behavior ของ `WorkScheduleBoard` ปัจจุบัน

`ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board.tsx`

- `selectedSlotTypeId` ใช้สร้าง `filteredSlots`
- `rows` ถูกสร้างจากพนักงานใน `staffPositions`; slot ที่ผ่าน filter จะถูกผูกเข้ากับแต่ละ row
- holiday ถูกผูกกับ row จาก `workScheduleHolidays` โดยไม่ขึ้นกับ slot type filter
- row พิเศษ `unassigned` ใช้แสดง slot ที่ไม่มีพนักงาน และไม่ใช่พนักงานจริง
- `getCoordinates()` มีแนวคิด clip interval อยู่แล้ว โดยใช้ `Math.max(startMs, itemStart)` และ `Math.min(endMs, itemEnd)` ก่อนคำนวณตำแหน่งบน timeline
- แถว `รวมคนทำงานจริง` ใช้ `filteredSlots` จึงเปลี่ยนตาม slot type filter
- แถว `เปรียบเทียบเกณฑ์` ใช้ `slots` ทั้งหมดและแสดงเฉพาะเมื่อ filter เป็น `all`

ชุดทดสอบ `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-board-holidays.test.tsx` ยืนยัน behavior สำคัญที่ต้องรักษา:

- holiday ที่คร่อมขอบช่วงถูก clip ตอนแสดงผล
- holiday ไม่ถูกนับใน staffing count
- holiday ยังคงแสดงเมื่อเปลี่ยน slot type filter
- board ยังคง scroll แนวนอนภายใน container บนหน้าจอแคบ

## 4. Business Logic ที่คาดหวังหลัง Implement

### 4.1 Summary ต่อพนักงาน

สำหรับทุก row ที่เป็นพนักงานจริง (`row.id !== "unassigned"`) ให้แสดงข้อมูลสรุปใน cell รายชื่อพนักงาน โดยอยู่ใต้ชื่อ/ป้าย `พนักงานนอกลิสต์` เพื่อให้ summary ติดกับเจ้าของ row และไม่แทรกเข้า timeline

ให้แสดง 2 บรรทัดในรูปแบบนี้:

- `เวร: {N} เวร · ทำงาน: {H} ชม. {M} นาที`
- `หยุด: {H} ชม. {M} นาที`

ต้องแสดงค่า `0` ด้วย เช่น `เวร: 0 เวร · ทำงาน: 0 ชม. 0 นาที` และ `หยุด: 0 ชม. 0 นาที` เพื่อให้พนักงานทุกคนมี summary ที่อ่านได้โดยไม่ต้องอนุมานจากช่องว่าง

ไม่ต้องแสดง summary บน row `ยังไม่ระบุพนักงาน` เพราะ row นี้เป็นกลุ่ม slot ที่ไม่มีพนักงาน ไม่ใช่ “พนักงานแต่ละคน” ตามไอเดียต้นฉบับ

### 4.2 จำนวนเวรและเวลาทำงาน

สำหรับแต่ละ staff row:

1. ใช้ `row.slots` เป็น source เท่านั้น เพื่อให้ summary สอดคล้องกับ slot ที่กำลังแสดงหลัง slot type filter
2. สำหรับแต่ละ slot ให้หาช่วงที่ทับกับ `[startMs, endMs)`:
   - `clippedStart = max(startMs, slotStartMs)`
   - `clippedEnd = min(endMs, slotEndMs)`
3. ถ้า `clippedEnd <= clippedStart` ให้ไม่นับ record นั้นในจำนวนเวรและ duration
4. `จำนวนเวร` = จำนวน slot ที่มี positive overlap หลัง clip
5. `เวลาทำงานรวม` = ผลรวม `clippedEnd - clippedStart` ของ slot เหล่านั้น

เหตุผล: backend query คืน record ที่ overlap ช่วงมาแบบไม่ clip; การรวม full interval จะทำให้เวลาทำงานเกินช่วงที่ผู้ใช้กำลังดู

### 4.3 Slot type filter ต้องเปลี่ยน work summary แต่ไม่เปลี่ยน holiday summary

เมื่อ `selectedSlotTypeId !== "all"`:

- จำนวนเวรและเวลาทำงานต้องคำนวณจาก `filteredSlots` ผ่าน `row.slots` เหมือน slot ที่มองเห็นบน board
- summary ของ slot ที่ไม่อยู่ในประเภทที่เลือกต้องหายจากยอดรวม
- `เวลาหยุดรวม` ต้องไม่เปลี่ยนตาม slot type filter เพราะ holiday ไม่มี slot type และ behavior ปัจจุบันตั้งใจให้ holiday ยังคงแสดงเมื่อเปลี่ยน filter

ห้ามเปลี่ยน behavior ของ `staffChangeSlices` และ `compareSlices` เพื่อทำ summary นี้

### 4.4 เวลาหยุดรวมต้องเป็น union ของช่วงวันหยุด

สำหรับ `row.holidays`:

1. clip holiday ทุก record ให้เหลือเฉพาะส่วนที่ทับ `[startMs, endMs)` ด้วยกฎเดียวกับ slot
2. ตัด interval ที่ไม่มี positive overlap ออก
3. sort interval ตามเวลาเริ่ม จากน้อยไปมาก
4. merge interval ที่ทับกัน (หรือแตะกันพอดี) ให้เป็นช่วงเดียว โดยใช้ end ที่มากที่สุด
5. รวม duration ของ interval หลัง merge เท่านั้น

ตัวอย่างที่ต้องได้:

- ช่วงที่ดู `08:00-12:00`
- holiday A `07:00-10:00` -> หลัง clip = `08:00-10:00`
- holiday B `09:00-11:00` -> หลัง clip = `09:00-11:00`
- union = `08:00-11:00`
- `เวลาหยุดรวม` ต้องเป็น 3 ชั่วโมง ไม่ใช่ 4 ชั่วโมง

เหตุผล: backend อนุญาตให้ holiday records ของพนักงานคนเดียวกันทับกันได้ และ business logic ฝั่ง minimum staffing ถือว่าพนักงาน absent เพียงครั้งเดียวในช่วงที่ทับกัน

### 4.5 รูปแบบ duration

สร้าง formatter กลางใน module ของ board และใช้ร่วมกันทั้งเวลาทำงาน/เวลาหยุด:

- แปลง duration เป็นจำนวน “นาทีเต็ม” ก่อน (`floor(ms / 60_000)`)
- `hours = floor(totalMinutes / 60)`
- `minutes = totalMinutes % 60`
- แสดง `{hours} ชม. {minutes} นาที`
- ชั่วโมงสามารถเกิน 24 ได้ เช่น `27 ชม. 30 นาที`; **ห้าม** แปลงเป็นจำนวนวัน

เหตุผล: response ที่ board ได้มีเพียง `startTime`/`endTime` ของ holiday ไม่มีข้อมูลว่า record เดิมถูกสร้างเป็น `FULL_DAY` หรือช่วงเวลา จึงไม่ควรเดาว่า 24 ชั่วโมงเท่ากับ “1 วันหยุด” และไม่ควรสร้าง semantics ของวันปฏิทิน/DST ที่ API ไม่ได้ส่งมา งานนี้จึงใช้ชั่วโมง/นาทีตามข้อความต้นฉบับที่อนุญาตไว้

## 5. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

ไม่มีไฟล์ใหม่และไม่มีไฟล์ที่ต้องลบ

```text
5-ecosystem-monorepo/
├── ecosystem-frontend-next-js/
│   ├── src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/
│   │   └── component-work-schedule-board.tsx                 # MODIFY
│   └── tests/work-schedule/
│       └── admin-slot-board-holidays.test.tsx                 # MODIFY
├── CURRENT_TASK_PLAN.md                                       # Planner document only
└── VERIFICATION_TABLE.md                                      # Verification workflow only
```

ไฟล์ต่อไปนี้เกี่ยวข้องกับ flow แต่ **ไม่ควรแก้เพื่อทำ task นี้** เว้นแต่ Implementor พบข้อเท็จจริงใหม่ที่ทำให้แผนใช้ไม่ได้และหยุดรายงาน Planner ก่อน:

- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/queries/get-slots-by-position-id-start-time-end-time.api.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.query.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.handler.ts`
- Prisma schema/migrations ทั้งหมด

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### ขั้นตอน 1 — `component-work-schedule-board.tsx`

เพิ่ม helper แบบ pure function ที่ระดับ module (นอก component) หรือ helper ที่ไม่มี side effect สำหรับงานต่อไปนี้ โดยไม่เปลี่ยน interface ของ props:

1. clip ISO interval ให้เหลือเฉพาะ `[startMs, endMs)` และคืน `null` เมื่อไม่มี positive overlap
2. รวม duration ของ slot หลัง clip
3. merge clipped holiday intervals และคืน union duration
4. format duration เป็น `{H} ชม. {M} นาที`

หลัง `rows`, `startMs` และ `endMs` พร้อมใช้งาน ให้คำนวณ summary ต่อ row ด้วย `useMemo` หรือ derived calculation ที่ equivalent โดย:

- เก็บ grouping logic ของ `rows` เดิมไว้ เพื่อไม่เปลี่ยน behavior ของ slot/holiday rendering
- work summary ใช้ `row.slots`
- holiday summary ใช้ `row.holidays`
- ไม่สร้าง network request ใหม่
- ไม่ mutate `slots`, `filteredSlots`, `workScheduleHolidays` หรือ arrays ใน props

ใน staff-name cell:

- คงชื่อพนักงานและป้าย `พนักงานนอกลิสต์` เดิม
- เพิ่ม summary สองบรรทัดเฉพาะ `row.id !== "unassigned"`
- ใช้ typography ขนาดเล็ก/สีรองให้เป็นข้อมูลประกอบ ไม่แย่ง hierarchy จากชื่อพนักงาน
- ถ้าพื้นที่แนวตั้งไม่พอ ให้เพิ่มเฉพาะ minimum height/padding ของ employee rows เท่าที่จำเป็น; ห้ามเปลี่ยนการคำนวณตำแหน่งตามแกน X หรือความหมายของ timeline
- ต้องคง horizontal scroll container และ `min-w-[720px]` เดิม

**เกณฑ์ผ่านขั้นตอน 1**

- พนักงานแต่ละ row มีจำนวนเวร, เวลาทำงานรวม, เวลาหยุดรวม
- ค่า work summary เปลี่ยนตาม slot type filter
- ค่า holiday summary ไม่เปลี่ยนตาม slot type filter
- slot/holiday ที่คร่อมขอบช่วงถูกนับเฉพาะส่วนที่อยู่ในช่วงที่เลือก
- overlapping holidays ไม่ถูก double-count
- row `unassigned` ไม่มี employee summary
- board timeline, staffing count, Min/Max compare row และ links เดิมยังทำงานตาม logic เดิม

### ขั้นตอน 2 — `admin-slot-board-holidays.test.tsx`

ขยาย test fixture/test cases ในไฟล์เดิมแทนการสร้าง test suite ซ้ำซ้อน ให้ครอบคลุมอย่างน้อย:

1. **work summary ปกติ**
   - fixture เดิม: Staff One มี Day 08:00-10:00 ภายใน board 08:00-12:00
   - ต้องเห็น `เวร: 1 เวร · ทำงาน: 2 ชม. 0 นาที`

2. **slot clipping**
   - เพิ่ม/ปรับ fixture ให้มี slot ที่คร่อมขอบ board แล้ว assert ว่า duration นับเฉพาะส่วนที่ overlap
   - จำนวนเวรยังนับ 1 เมื่อมี positive overlap

3. **holiday clipping**
   - fixture เดิม Holiday `07:00-10:00` บน board `08:00-12:00` ต้องให้ summary หยุด 2 ชั่วโมง พร้อมคง assertion geometry เดิม (`left: 0%`, `width: 50%`)

4. **overlapping holiday union**
   - เพิ่ม holiday ของ Staff One อีกช่วงที่ overlap เช่น `09:00-11:00`
   - summary ต้องเป็น `หยุด: 3 ชม. 0 นาที` สำหรับ union `08:00-11:00` ไม่ใช่ 4 ชั่วโมง
   - การมีหลาย holiday records ไม่ควรทำให้ staffing count เดิมเปลี่ยน เพราะ holiday ไม่ถูกนับเป็นคนทำงาน

5. **slot type filter**
   - หลังเลือก `night`, Staff One ที่มีเฉพาะ Day slot ต้องเป็น `เวร: 0 เวร · ทำงาน: 0 ชม. 0 นาที`
   - Staff Two ที่มี Night slot ต้องยังแสดงยอดของ Night slot
   - holiday summary ของ Staff One ต้องยังเท่าเดิม และ assertion เดิมที่ holiday ยัง visible ต้องผ่าน

6. **zero state ต่อพนักงาน**
   - เพิ่ม staff ที่ไม่มี slot และ holiday หรือใช้ fixture ที่ทำให้ row ไม่มี slot หลัง filter
   - ต้องแสดง zero summary อย่างชัดเจน

7. **regression เดิม**
   - min/max management link ยังถูกต้อง
   - holiday clipping/visibility เดิมยังผ่าน
   - horizontal scrolling assertion เดิมยังผ่าน

อย่า assert ด้วย text query ที่ ambiguous หากหลาย staff มีข้อความ summary เหมือนกัน; ใช้ row/container ที่สัมพันธ์กับชื่อพนักงานหรือ `within(...)` เพื่อให้ test ระบุเจ้าของ summary ชัดเจน

**เกณฑ์ผ่านขั้นตอน 2**

- test ใหม่ fail บน behavior เดิมก่อน implementation และ pass หลัง implementation
- test เดิมทั้งหมดในไฟล์ยัง pass
- ไม่มีการลด/ลบ assertion เดิมเพื่อทำให้ test ผ่าน

## 7. Acceptance Criteria รวม

Implementation ถือว่าผ่านเมื่อครบทุกข้อ:

- หน้ารายการ slot แสดงจำนวนเวรและเวลาทำงานต่อพนักงาน
- work summary แสดงเฉพาะ slot type ที่ผู้ใช้กำลังเลือก และกลับมารวมทั้งหมดเมื่อเลือก `all`
- เวลาที่นำมารวมถูกจำกัดให้อยู่ภายในช่วงเวลาที่ผู้ใช้กำลังดู
- หน้ารายการ slot แสดงเวลาหยุดรวมต่อพนักงานเป็นชั่วโมง/นาที
- overlapping holiday records ถูก union ก่อนรวม duration
- holiday summary ไม่ถูกกรองด้วย slot type filter
- พนักงานที่ไม่เข้าเวร/ไม่มีวันหยุดในช่วงนั้นยังเห็นค่า 0 อย่างชัดเจน
- synthetic `ยังไม่ระบุพนักงาน` row ไม่ถูกนำเสนอเหมือนเป็นพนักงาน
- ไม่มี endpoint/query contract/schema/migration ใหม่สำหรับ summary นี้
- staffing count และ Min/Max comparison ไม่ถูกเปลี่ยนความหมาย
- regression tests เดิมของ board ยังผ่าน

## 8. สิ่งที่ Implementor ต้องระวัง

- อย่ารวม full duration ของ record ก่อน clip เพราะ query คืน interval ที่คร่อมขอบช่วงมาเต็ม record
- อย่าบวก holiday durations ตรง ๆ เพราะ holiday records ของพนักงานคนเดียวกันอาจ overlap
- อย่าใช้ `slots` ตรง ๆ สำหรับ work summary ถ้ามี slot type filter; ต้องใช้ข้อมูลเดียวกับ row ที่มองเห็น (`row.slots` / `filteredSlots`)
- อย่ากรอง holiday ตาม slot type เพราะ holiday ไม่มี slot type และ behavior เดิมตั้งใจให้ยังมองเห็นหลังเปลี่ยน filter
- อย่านำ holiday ไปหัก/เพิ่ม `staffChangeSlices` หรือ `compareSlices`; task นี้เป็น summary display และ behavior staffing เดิมต้องคงไว้
- อย่าแก้ row grouping อื่นที่ไม่เกี่ยวข้อง รวมถึงชื่อของ extra-staff row แม้จะพบโค้ดที่ดูผิดปกติ เพราะเป็นนอก scope ของ task นี้
- อย่าเพิ่ม backend aggregate endpoint, response field หรือ database column เมื่อข้อมูลดิบปัจจุบันเพียงพอ
- ใช้ `timezone`/Luxon ตาม pattern เดิมของ board เมื่อ parse ISO เพื่อไม่สร้างวิธีจัดการเวลาอีกแบบหนึ่งใน component เดียวกัน
- อย่าแปลง holiday duration เป็น “จำนวนวัน” โดยเดาจาก 24 ชั่วโมง เพราะ API ที่ board ได้ไม่บอก holiday type และอาจเกิด timezone/DST semantics ที่ task นี้ไม่ได้กำหนด
- รักษา accessibility และ responsive behavior เดิม: link ของ slot, `role="note"` ของ holiday, board `role="region"`, horizontal scrolling และ minimum board width

## 9. Tests และคำสั่งตรวจสอบ

รันจาก repository root ตาม `AGENTS.md` และ scripts ปัจจุบัน

### Narrow test สำหรับ task นี้

```bash
pnpm --dir ecosystem-frontend-next-js run test -- tests/work-schedule/admin-slot-board-holidays.test.tsx
```

### Static checks ที่เกี่ยวข้อง

```bash
pnpm run typecheck:frontend
pnpm run lint:frontend
```

### Final repository verification

```bash
pnpm run verify
```

`pnpm run verify` เป็น standard pre-commit verification ของ repository และรวม frontend tests, Prisma validate/generate, backend/frontend typecheck, lint, build, backend tests และ migration tests โดยไม่รวม e2e ตามข้อกำหนดของ repository

ไม่ต้องรัน `pnpm run test:e2e` สำหรับ task นี้ เว้นแต่ environment/ผู้ดูแลกำหนดเพิ่มเติม เพราะ task ไม่เปลี่ยน backend/API/database และ repository ระบุว่า e2e อาจต้องพึ่ง environment/database เฉพาะ deployment

**เกณฑ์ผ่านการตรวจสอบ**

- narrow frontend test ผ่าน
- frontend typecheck ผ่าน
- frontend lint ผ่าน
- `pnpm run verify` ผ่านใน environment ที่ dependencies/configuration พร้อมใช้งาน
- หาก `verify` fail ด้วยปัญหา environment ที่ไม่เกี่ยวกับการเปลี่ยนแปลง ให้รายงาน command, stage ที่ fail และ error จริง ห้ามแก้ business logic นอก scope เพียงเพื่อทำให้ pipeline ผ่าน
