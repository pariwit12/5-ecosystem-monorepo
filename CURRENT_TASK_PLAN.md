# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ทำหน้าต่างให้ admin จัดเวรให้พนักงาน โดยต้องแสดงวันหยุดและรายละเอียดอย่างอื่นที่จำเป็นสำหรับการจัดตารางเวรด้วย ดูข้อมูลหน้าต่างแสดงตารางเวรของ admin เพื่อประกอบการวางแผนได้ หรือจะปรับจากหน้าต่างไหนก็ได้ เพื่อให้ admin สามารถจัดเวรให้พนักงานได้อย่างมีประสิทธิภาพ โดยหาก admin จัดตารางเวรลงทับวันที่พนักงานขอหยุดให้ขึ้นแจ้งเตือนและไม่สามารถดำเนินการได้

## 2. ขอบเขตและข้อสรุปจากโค้ดจริงก่อน Implement

ตรวจจากไฟล์ใน `main` ของ repository นี้แล้ว พบว่ามีระบบเก็บวันหยุด/เวลาที่พนักงานไม่พร้อมทำงานอยู่แล้ว จึงไม่ต้องสร้างโมเดลข้อมูลวันหยุดใหม่ งานนี้เน้นเชื่อมข้อมูลนั้นเข้ากับหน้าตารางเวรของ admin และป้องกันการสร้างเวรทับช่วงวันหยุดทั้งฝั่ง UI และ backend

ข้อเท็จจริงสำคัญจากโค้ดปัจจุบัน:

- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma` มี `WorkScheduleHoliday` ซึ่งเก็บ `workScheduleStaffId`, `startTime`, `endTime` และ `createdAt`; ไม่มี field สถานะอนุมัติ ดังนั้นรายการที่มีอยู่ให้ถือเป็นช่วงเวลาที่ไม่สามารถจัดเวรให้พนักงานคนนั้นได้
- การสร้างวันหยุดฝั่งพนักงานอยู่ที่ `src/modules/work-schedule/holiday/commands/create-holiday.handler.ts` ซึ่งแปลงวันหยุดเต็มวันโดยใช้ timezone ของสถานที่ทำงาน และปฏิเสธเมื่อช่วงวันหยุดทับเวรที่มีอยู่แล้ว นอกจากนี้ยังตรวจเงื่อนไขจำนวนพนักงานขั้นต่ำ (Min)
- `src/modules/work-schedule/holiday/queries/list-my-holidays.handler.ts` อ่านวันหยุดของพนักงานที่ล็อกอินอยู่เพียงคนเดียว จึงไม่เหมาะสำหรับแสดงวันหยุดของพนักงานทุกคนให้ admin ดู
- หน้าดูกระดานเวร admin อยู่ที่ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx` และ `component-work-schedule-board.tsx`; API ที่เรียกคือ `GET /api/work-schedule/slot/by-position-id-start-time-end-time/:position_id` ซึ่งปัจจุบันคืน `workScheduleSlots` กับ `minMaxs`
- แบบฟอร์มสร้างเวรอยู่ที่ `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/create-many-form.tsx`. ฟอร์มเลือกหลายวัน หลายพนักงาน เวลาเริ่ม และระยะเวลา แล้วสร้าง slot ทุกคู่ของวันกับพนักงานก่อนส่ง `POST /api/work-schedule/slot/:position_id`
- `src/modules/work-schedule/slot/commands/create-many.handler.ts` ตรวจสิทธิ์ admin, เวรที่ซ้อนกันใน payload, ความสัมพันธ์พนักงานกับตำแหน่ง, เวรเดิมที่ซ้อนกัน และค่า Max ก่อน `createMany` ภายใน transaction แต่ **ยังไม่ได้ตรวจ `WorkScheduleHoliday`** จึงสามารถมีช่องโหว่จากการสร้างเวรทับวันหยุดได้
- `VERIFICATION_TABLE.md` มีเครื่องหมาย `✓` ในช่องรอบที่ 1 ของแถว `Approve CURRENT_TASK_PLAN`; เมื่อแก้แผนในรอบนี้ต้องล้างเครื่องหมายทุกช่องในแถวดังกล่าว เพื่อให้ตรวจอนุมัติแผนฉบับปรับปรุงใหม่ และห้ามทำเครื่องหมายผ่านในรอบเดียวกัน

## 3. Business Logic ก่อนเริ่ม

1. วันหยุดเป็นช่วงเวลาแบบเริ่มต้นรวม/เวลาสิ้นสุดไม่รวม โดยการตรวจ overlap ให้ใช้เงื่อนไข `slotStart < holidayEnd && slotEnd > holidayStart` เหมือนรูปแบบการค้นหารายการที่ทับช่วงเวลาในโค้ดเดิม ไม่เปรียบเทียบเฉพาะข้อความวันที่
2. วันหยุดเต็มวันถูกเก็บเป็นช่วงตั้งแต่เที่ยงคืนของวันที่เลือกจนถึงเที่ยงคืนของวันถัดไปตาม timezone ของสถานที่ ส่วนวันหยุดบางช่วงเก็บจาก `start_time`/`end_time` ที่ส่งมา ดังนั้นเวรที่คาบเกี่ยวข้ามเที่ยงคืนก็ต้องตรวจจาก timestamp จริง
3. หน้ากระดาน admin แสดงพนักงานตาม `staffPositions` และวาดเวรเป็นช่วงเวลาบน timeline; ตัวเลือกประเภทเวรกรองเฉพาะ slot. การคำนวณจำนวนผู้ทำงานและแถว Compare/Min-Max อิงข้อมูล slot ไม่ใช่รายการวันหยุด
4. backend สร้างหลาย slot เป็นชุดเดียวใน transaction เดียว หากรายการใดรายการหนึ่งไม่ผ่าน validation จะต้องไม่ insert รายการใดในชุดนั้น
5. การตรวจใน frontend เพียงอย่างเดียวไม่ใช่ขอบเขตความปลอดภัย เพราะ API สามารถถูกเรียกโดยตรงและข้อมูลวันหยุดอาจเปลี่ยนหลังจากแสดงหน้าได้

## 4. Business Logic ที่คาดหวังหลัง Implement (พร้อมเหตุผล)

1. **แสดงวันหยุดบนกระดานเวร admin:** API ช่วงเวลาสำหรับตำแหน่งงานจะคืนวันหยุดที่ทับกับช่วงเวลาที่ขอดู สำหรับพนักงานที่ยัง active และผูกกับตำแหน่งนั้นเท่านั้น จากนั้นแสดงช่วงวันหยุดในแถวของพนักงานคนเดียวกัน ใช้ timezone ของสถานที่และตัดขอบการแสดงผลเมื่อช่วงวันหยุดยื่นออกนอกช่วงกระดาน
2. **วันหยุดต้องมองเห็นเสมอ:** การเปลี่ยนตัวกรองชนิดเวรต้องไม่ซ่อนวันหยุด และวันหยุดต้องไม่ถูกนับเป็น slot หรือถูกนำไปรวมในจำนวนคนทำงาน/การคำนวณ Min-Max เดิม เพราะจะเปลี่ยนความหมายของการคำนวณที่มีอยู่
3. **เตือนและหยุดก่อนส่งแบบฟอร์ม:** เมื่อ admin ส่งฟอร์ม ให้สร้าง candidate slots ด้วยกฎวัน เวลา ระยะเวลา และ timezone เดียวกับ payload จริง จากนั้นดึงข้อมูลช่วงเวลาของตำแหน่งจาก query admin เดิมโดยใช้ขอบเขตตั้งแต่เวลาเริ่มที่เร็วที่สุดถึงเวลาสิ้นสุดที่ช้าที่สุด แล้วตรวจ candidate ทุก slot กับวันหยุดของ `staffId` เดียวกัน หากพบอย่างน้อยหนึ่งช่วงที่ทับกัน ให้แสดงคำเตือนที่อ่านรู้เรื่อง (ระบุพนักงานและช่วงเวลา/วันที่ที่ขัดแย้ง) และ **ห้ามเรียก mutation เพื่อสร้าง slot ใด ๆ ในชุดนั้น** หากโหลดข้อมูลเพื่อตรวจวันหยุดไม่ได้ ให้หยุดการส่งไว้ก่อนและแจ้งให้ลองตรวจใหม่ แทนการเดาว่าไม่มีวันหยุด
4. **backend เป็นกฎบังคับสุดท้าย:** ภายใน transaction ของ `CreateWorkScheduleSlotHandler` ให้ดึงวันหยุดของพนักงานที่อยู่ใน payload ซึ่งทับช่วงเวลาที่จะสร้าง และปฏิเสธเมื่อ slot ใดทับวันหยุดด้วย error code และข้อความเฉพาะ ห้ามอาศัย preflight ของ frontend เพียงอย่างเดียว
5. **รักษาความถูกต้องเมื่อคำสั่งเกิดพร้อมกัน:** การสร้างวันหยุดมี transaction แบบ Serializable และ retry เมื่อพบ Prisma `P2034` อยู่แล้ว ให้ปรับ transaction การสร้าง slot ให้ใช้ isolation/retry ที่เข้ากัน เพื่อให้กรณี admin จัดเวรพร้อมกับพนักงานส่งวันหยุดถูกตรวจใหม่หลัง retry แทนที่จะปล่อยให้ทั้งสองรายการผ่านโดยทับกัน การตรวจวันหยุดต้องอยู่ใน transaction เดียวกับการ insert และคงการ lock ตำแหน่งเดิมไว้
6. **ไม่เปลี่ยนกฎวันหยุดเดิม:** ยังคงปฏิเสธการสร้างวันหยุดทับเวรเดิม และคงการตรวจ Min ที่มีอยู่ ห้ามเพิ่ม approval workflow, สถานะวันหยุด, ตารางฐานข้อมูล หรือ migration เพราะไม่พบสิ่งเหล่านี้ในโมเดลปัจจุบันและไม่จำเป็นต่อไอเดียต้นฉบับ

## 5. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### ไฟล์ที่ต้องแก้ไข

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.query.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts`
- `ecosystem-backend-nest-js/src/common/exceptions/error-codes.enum.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/create-many-form.tsx`
- `ecosystem-frontend-next-js/src/constants/error-messages.ts`
- `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-date-range.test.tsx`

### ไฟล์ทดสอบที่ต้องสร้าง

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.spec.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.handler.spec.ts`
- `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-board-holidays.test.tsx`
- `ecosystem-frontend-next-js/tests/work-schedule/create-many-holiday-blocking.test.tsx`

ไม่ต้องลบไฟล์ใด ไม่ต้องเพิ่ม/แก้ Prisma schema หรือ migration และไม่จำเป็นต้องแก้ API client/query-key แยก หากยังใช้ query และ response type จาก `get-slots-by-position-id-start-time-end-time.query.ts` เดิมตามแผนนี้

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### 6.1 Backend: ส่งวันหยุดสำหรับกระดาน admin

**ไฟล์ `slot/queries/get-slots-by-position-id-start-time-end-time.handler.ts`**

- รักษา `verifyWorkSchedulePositionByWorkScheduleAdmin` ก่อนอ่านข้อมูล
- เพิ่มการอ่าน `WorkScheduleHoliday` ในช่วง `start_time` ถึง `end_time` ที่ทับช่วงเวลาที่ขอ
- จำกัดผลลัพธ์เฉพาะพนักงานที่ยัง active และมี `WorkScheduleStaffPosition` ที่ยัง active ใน `position_id` นี้ ห้ามใช้รายการวันหยุดของ user ปัจจุบันแทน
- คืน field ใหม่ `workScheduleHolidays` พร้อมอย่างน้อย `id`, `staffId`, `startTime`, `endTime` โดยคืนเวลาเป็น ISO string เหมือน field เวลาอื่น
- คงการ query และการคำนวณของ `workScheduleSlots` และ `minMaxs` เดิมไว้

**ไฟล์ `slot/queries/get-slots-by-position-id-start-time-end-time.query.ts`**

- เพิ่ม `workScheduleHolidays` ใน interface `GetSlotsByPositionIdStartTimeEndTimeResponse` ให้ตรงกับผลลัพธ์จริง
- ไม่เปลี่ยน validation ของ `position_id`, `start_time` หรือ `end_time`

### 6.2 Frontend: แสดงวันหยุดบนกระดาน

**ไฟล์ `slot/client-page.tsx`**

- ส่ง `dataQuerySlot.workScheduleHolidays` ไปยัง `WorkScheduleBoard`
- คงการเลือกช่วงเวลา, การแปลงเวลา, loading/error/redirect และปุ่ม refresh ตามเดิม

**ไฟล์ `component-work-schedule-board.tsx`**

- เพิ่ม type ของวันหยุดจาก response ใหม่ และรับ prop `workScheduleHolidays`
- วาดช่วงวันหยุดใน row ของ `staffId` ที่ตรงกัน โดยใช้พิกัดและขอบเขตเวลาเดียวกับ timeline ของกระดาน และแสดงข้อความ/tooltip ที่แยกวันหยุดจาก slot ได้ชัดเจน
- แสดงวันหยุดแม้พนักงานยังไม่มี slot ในช่วงนั้น และให้วันหยุดคงอยู่เมื่อเปลี่ยนตัวกรอง `slotTypeId`
- ไม่แปลงวันหยุดเป็น slot และไม่ส่งวันหยุดเข้า `staffChangeSlices` หรือ `compareSlices`; ตัวเลขคนทำงานและ Min/Max ต้องคงความหมายเดิม

### 6.3 Frontend: ป้องกันการส่งฟอร์มที่ทับวันหยุด

**ไฟล์ `features/work-schedule/slot/components/create-many-form.tsx`**

- ใช้ `useAuth` และ `useQueryClient`/query เดิมของ `workScheduleSlotQueries.queryGetSlotsByPositionIdStartTimeEndTime` เพื่อ preflight ก่อนเรียก `mutateCreateMany`; ไม่เพิ่ม endpoint ใหม่
- สร้าง candidate slots ด้วย logic เดียวกับที่ใช้ส่ง payload ปัจจุบัน โดยใช้ `placeTimezone` และช่วงเวลาเริ่ม/จบจริงของแต่ละวัน รวมกรณีเวรข้ามเที่ยงคืน
- คำนวณขอบเขต query จาก candidate slots ทั้งชุด ไม่ใช้แค่วันแรก/วันสุดท้ายโดยละเลยระยะเวลาเวร และบังคับให้ preflight อ่านข้อมูลล่าสุด (ไม่ยอมใช้ cache ที่ยัง fresh โดยไม่ตรวจใหม่)
- เปรียบเทียบ candidate แต่ละรายการกับ `workScheduleHolidays` ของพนักงานเดียวกันด้วย timestamp overlap หากมี conflict แม้เพียงรายการเดียว ให้แสดง inline alert ที่เข้าถึงได้ด้วย `role="alert"` และไม่เรียก `mutateCreateMany` เลย
- ข้อความเตือนต้องระบุพนักงานและวันที่/ช่วงเวลาที่ชนกันเท่าที่ข้อมูล response ยืนยันได้ หาก preflight โหลดไม่สำเร็จ ให้หยุดการส่งและให้ผู้ใช้ลองใหม่
- เมื่อไม่พบ conflict ให้คงเส้นทาง mutation, success toast และ navigation เดิมไว้
- ป้องกันการ submit ซ้ำขณะ preflight หรือ mutation ยังทำงาน

**ไฟล์ `error-codes.enum.ts` และ `constants/error-messages.ts`**

- เพิ่ม error code ใหม่ที่มีความหมายชัดเจน เช่น `WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP` (อย่าใช้ `WORK_SCHEDULE_HOLIDAY_SLOT_OVERLAP` เดิมซึ่งหมายถึงการสร้างวันหยุดทับเวร)
- เพิ่มข้อความสำหรับ error code ใหม่นี้ใน `API_ERROR_MESSAGES` โดยสื่อว่าจัดเวรไม่ได้เพราะพนักงานมีวันหยุดทับช่วงเวลา
- ใน `create-many-form.tsx` ให้แสดง error ที่ map ได้สำหรับ conflict จาก backend แทนการแสดงแต่ข้อความทั่วไป ส่วน error อื่นให้คง fallback ที่ไม่เปิดเผยรายละเอียดภายใน

### 6.4 Backend: บังคับกฎก่อน insert

**ไฟล์ `slot/commands/create-many.handler.ts`**

- รักษาการตรวจสิทธิ์, staff-position membership, incoming payload overlap, existing slot overlap, Max และ lock `work_schedule_position` เดิม
- ภายใน transaction เดียวกัน ให้ query `WorkScheduleHoliday` ของ `staffIds` ที่กำลังสร้างและทับ bounding interval ของ candidate slots
- วนตรวจทุก `body.slots` เทียบกับวันหยุดของ `staff_id` เดียวกันด้วย `newStart < holiday.endTime && newEnd > holiday.startTime`; ช่วงที่แตะกันเฉพาะขอบเวลาแต่ไม่ทับกันต้องไม่ถูกปฏิเสธ
- เมื่อพบ conflict ให้ throw exception ที่มี error code ใหม่และ HTTP conflict status ก่อนถึง `tx.workScheduleSlot.createMany`; ต้องไม่มีบางส่วนถูก insert
- ปรับ transaction ให้ใช้ `Serializable` และเพิ่ม retry loop ครอบ `$transaction` สำหรับ Prisma serialization conflict `P2034` ตามรูปแบบที่มีอยู่ใน `CreateHolidayHandler`; ทุก attempt ต้องเปิด transaction ใหม่และทำ lock ตำแหน่ง, query/ตรวจ existing slots, ตรวจ holiday overlap และ query/ตรวจ Min/Max ใหม่ทั้งหมดก่อน `createMany`. ห้าม retry validation error โดยเฉพาะ conflict วันหยุด; คง payload self-overlap และ staff-position membership validation เดิมไว้ และอย่าเปลี่ยนกฎเหล่านี้เกินจำเป็น
- ไม่เปลี่ยนลำดับ/ความหมายของกฎ Max และ overlap เดิมเกินกว่าที่จำเป็นต่อการตรวจวันหยุด และไม่แก้กฎสร้าง/ลบวันหยุดเดิม

### 6.5 Tests

**Backend create-many handler test**

เพิ่ม `create-many.handler.spec.ts` โดย mock Prisma/AccessControlService แบบ unit test และไม่ต่อฐานข้อมูลจริง ต้องครอบคลุมอย่างน้อย:

- สร้างเวรสำเร็จเมื่อไม่มีวันหยุดทับ
- ปฏิเสธเมื่อวันหยุดของพนักงานคนเดียวกันทับบางส่วนหรือเต็มช่วงเวลา และ assert ว่า `createMany` ไม่ถูกเรียก
- วันหยุดของพนักงานคนอื่นไม่ขวางการสร้างเวรให้คนที่เลือก
- เวรที่จบตรงเวลาเริ่มวันหยุด หรือเริ่มตรงเวลาสิ้นสุดวันหยุด ไม่ถือว่าทับกัน
- หาก payload มีหลาย slot และมีเพียง slot เดียวที่ทับวันหยุด ต้องปฏิเสธทั้ง batch
- transaction ใช้ Serializable/retry สำหรับ `P2034` และไม่ retry เมื่อเจอ validation conflict

**Backend query handler test**

เพิ่ม `get-slots-by-position-id-start-time-end-time.handler.spec.ts` เพื่อตรวจว่า response มีวันหยุดที่ทับช่วงเวลาที่ร้องขอ, จำกัดพนักงานตาม active staff-position ของตำแหน่ง, คืน timestamp ตามรูปแบบ ISO และยังคืน `workScheduleSlots`/`minMaxs` เดิมได้

**Frontend tests**

- อัปเดต mock response ใน `admin-slot-date-range.test.tsx` ให้มี `workScheduleHolidays: []` และตรวจ prop ใหม่ที่ส่งให้ board โดยไม่ทำให้ test ช่วงเวลา/refresh/error เดิมเสีย
- `admin-slot-board-holidays.test.tsx`: ทดสอบการแสดงวันหยุดใน row ของพนักงานที่ถูกต้อง, วันหยุดยังแสดงเมื่อกรองประเภทเวร และวันหยุดไม่ถูกนับเป็น slot/คนทำงาน
- `create-many-holiday-blocking.test.tsx`: ทดสอบ preflight ที่พบวันหยุดแล้วแสดง alert และไม่เรียก mutation, conflict ของพนักงานที่ไม่ได้เลือกไม่ขวาง, ช่วงเวลาที่ไม่ทับกันส่ง mutation ได้ และเมื่อ query ตรวจวันหยุดล้มเหลวต้องไม่ส่ง mutation

## 7. เกณฑ์ผ่าน / Acceptance Criteria แยกตามขั้นตอน

1. **Query และ response:** เมื่อ admin ขอช่วงเวลาสำหรับตำแหน่งที่ตนมีสิทธิ์ response มีวันหยุดที่ทับช่วงนั้นของพนักงาน active ในตำแหน่งเท่านั้น; ผู้ไม่มีสิทธิ์ยังถูกปฏิเสธ; slot และ Min/Max เดิมไม่เปลี่ยน
2. **กระดาน admin:** วันหยุดปรากฏในแถวของพนักงานที่ถูกต้อง เวลาอ่านตาม timezone ของสถานที่ ช่วงที่อยู่นอกกระดานถูก clip และตัวกรองชนิดเวรไม่ซ่อนวันหยุด
3. **ฟอร์ม admin:** เมื่อ candidate slot อย่างน้อยหนึ่งรายการทับวันหยุด ต้องเห็นคำเตือนและไม่มี POST/mutation เกิดขึ้น; เมื่อไม่ทับวันหยุด เส้นทางสร้างเวรเดิมทำงานต่อได้
4. **Backend:** API ปฏิเสธ payload ที่ทับวันหยุดแม้ข้าม frontend มาโดยตรง และไม่ insert บางส่วน; การเปรียบเทียบใช้ช่วงเวลาจริง รวมเวรข้ามวันและขอบเขตที่เท่ากัน
5. **กฎเดิม:** การป้องกันเวรซ้อนกัน, staff-position membership, Max, การสร้างวันหยุดทับเวรเดิม และ Min ของวันหยุดยังทำงานตามเดิม
6. **Regression / Types / Lint:** tests ใหม่และเดิมที่ระบุผ่าน, backend/frontend typecheck และ lint ผ่าน และ `pnpm run verify` ผ่าน
7. **ขอบเขตฐานข้อมูล:** ไม่มี Prisma schema/migration ใหม่ และไม่มีไฟล์ที่ต้องลบจากงานนี้

## 8. สิ่งที่ Implementor ต้องระวัง

- ห้ามใช้ `listMyHolidays` เพื่อโหลดวันหยุดของพนักงานทุกคน เพราะ endpoint นี้คืนเฉพาะพนักงานที่ล็อกอินอยู่
- ตรวจวันหยุดใน backend ด้วย และอย่าถือว่า frontend preflight เป็น security boundary
- ใช้ช่วงเวลาแบบ half-open interval ตาม overlap rule ข้างต้น; ห้ามตรวจด้วยการเทียบเฉพาะ `YYYY-MM-DD` เพราะวันหยุดบางช่วงและเวรข้ามเที่ยงคืนจะผิดพลาด
- ใช้ `placeTimezone` สำหรับการประกอบเวลาจากฟอร์ม/การแสดงผล และส่ง ISO timestamp ให้ backend; อย่าเปลี่ยน timestamp ที่เก็บใน database
- หากมี conflict ใน batch ให้หยุดทั้งชุด ไม่ใช่ละเว้นเฉพาะ slot ที่ชนแล้วสร้างส่วนที่เหลือ
- ห้ามเพิ่มวันหยุดเข้าไปใน array ของ slot เพื่อให้วาด UI ได้ เพราะจะทำให้จำนวนคนทำงานและ Min/Max ผิด
- คง access-control checks และการกรองพนักงาน active/soft delete ของระบบเดิม ไม่คืนวันหยุดของ staff ที่ไม่ได้ผูกกับตำแหน่ง
- ใช้ error code ใหม่สำหรับการจัดเวรชนวันหยุด เพื่อไม่ให้ข้อความของ error code สำหรับ “พนักงานสร้างวันหยุดทับเวรเดิม” มีความหมายกลับด้าน
- Unit tests ต้อง mock Prisma; ห้ามใช้ database จริง, `prisma db push`, reset/drop/truncate หรือแก้ schema ที่ไม่จำเป็น
- จำกัดการเปลี่ยนแปลงไว้ที่วันหยุด/การตรวจ conflict/การแสดงผลตามแผน ห้ามเปลี่ยนการจัดเรียง slot, การกรองประเภทเวร, แปลง timezone, การสร้าง template หรือกฎจำนวนพนักงานโดยไม่จำเป็น

## 9. คำสั่งตรวจสอบ

รันจาก root repository ตามที่ `AGENTS.md` กำหนด โดยเริ่มจาก tests เฉพาะที่เปลี่ยนก่อน:

```bash
pnpm --dir ecosystem-backend-nest-js exec jest --runInBand modules/work-schedule/slot/commands/create-many.handler.spec.ts modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.handler.spec.ts modules/work-schedule/holiday/commands/create-holiday.handler.spec.ts
pnpm --dir ecosystem-frontend-next-js exec jest --runInBand tests/work-schedule/admin-slot-date-range.test.tsx tests/work-schedule/admin-slot-board-holidays.test.tsx tests/work-schedule/create-many-holiday-blocking.test.tsx
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run verify
```

Workflow `.github/workflows/ci.yml` รัน `pnpm run verify` บน push ไป `main` และ pull request ที่ target `main`. ผู้ Implementor ต้องตรวจผล GitHub Actions หลังมี commit/PR จริง และรายงาน test ที่รันไม่ได้หรือมีข้อจำกัดของ environment โดยไม่อ้างผลผ่านหากยังไม่มีผลยืนยัน
