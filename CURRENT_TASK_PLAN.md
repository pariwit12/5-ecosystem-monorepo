# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

สำหรับหน้าดูตารางเวรของ admin ต้องการให้มีปุ่มลัดสำหรับเลือกช่วงเวลา เป็นระดับ เดือนนี้, สัปดาห์นี้ (จันทร์ - อาทิตย์), 1 วัน พร้อมปุ่มถัดไปและย้อนกลับ สำหรับแต่ละระดับ

## 2. สิ่งที่ยืนยันจากโค้ดจริงก่อนเริ่ม

### หน้าจอและสถานะปัจจุบัน

- หน้าจอเป้าหมายคือ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx` ซึ่ง render `DateTimeRangePicker` และ `WorkScheduleBoard`
- หน้านี้มี `draftStartDateTime`, `draftEndDateTime`, `appliedRange` และ `validationError` แยกกัน โดยค่าเริ่มต้นของ draft ว่างและ `appliedRange` เป็น `null`
- การแก้วันเวลาในช่องปัจจุบันเป็นการแก้ draft เท่านั้น การส่ง form ผ่าน `handleSubmit` จึงเรียก `parseSlotDateRange` แล้วจึงเปลี่ยน `appliedRange` ทำให้ query เปลี่ยน
- ระหว่าง `isFetchingSlot` form fieldset ถูก disable อยู่แล้ว และการรีเฟรชปัจจุบันใช้ช่วงที่ apply แล้วผ่าน `refetchSlot`
- เขตเวลาของสถานที่ถูกอ่านจาก `dataQueryPlace.timezone` (`place.timezone`) และถูกส่งให้ parser และ board

### การแปลงช่วงเวลาและการดึงข้อมูล

- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/slot-date-range.ts` ใช้ Luxon (`DateTime`) ตรวจสอบค่า `datetime-local`, ตรวจสอบเขตเวลาและลำดับ start/end แล้วแปลงขอบเขตเป็น ISO UTC
- Query ใน `ecosystem-frontend-next-js/src/features/work-schedule/slot/work-schedule-slot.queries.ts` ถูก enable เมื่อมี `userId`, `positionId`, `startTime` และ `endTime` ครบ และใช้ query key ที่ผูกกับ UTC bounds
- API ใช้ `get-slots-by-position-id-start-time-end-time.api.ts` ส่ง `start_time` และ `end_time` ไป backend
- Backend ที่ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.handler.ts` เลือก slot, min/max และ holiday ที่ทับซ้อนกับช่วงที่ขอ โดยใช้ start ของรายการ `< end_time` และ end ของรายการ `> start_time` ดังนั้นช่วงปฏิทินต้องใช้ขอบเขตสิ้นสุดแบบไม่รวม (exclusive end)
- `component-work-schedule-board.tsx` รับ start/end/timezone และแสดง marker รายวันอยู่แล้ว ไม่จำเป็นต้องเปลี่ยนการคำนวณจำนวนพนักงาน เกณฑ์ Min/Max หรือ holiday สำหรับงานเพิ่มปุ่มลัดนี้

### Tests และคำสั่งที่มีอยู่

- Unit tests ของ parser อยู่ใน `ecosystem-frontend-next-js/tests/work-schedule/slot-date-range.test.ts`
- Integration tests ของหน้า admin รวมถึงพฤติกรรม draft/apply, validation, loading, refresh, cache และ error handling อยู่ใน `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-date-range.test.tsx`
- Frontend ใช้ Jest ผ่าน script `test` ใน `ecosystem-frontend-next-js/package.json`; root มี scripts `typecheck:frontend`, `lint:frontend`, `build:frontend` และ `verify`

## 3. Business Logic ก่อนเริ่ม

1. ผู้ใช้ระบุ start/end ด้วย `datetime-local` และกด “แสดงตารางเวร” เพื่อ apply ช่วงเวลาที่ต้องการ
2. การแก้ค่า draft ยังไม่เปลี่ยน board และไม่ทำ request ใหม่จนกว่าจะ submit
3. ช่วงที่ apply แล้วเก็บทั้งค่า draft ที่ใช้ตอน submit, UTC start/end และ timezone snapshot ไว้ เพื่อแสดง label และ board ให้ตรงกับผลลัพธ์ที่ร้องขอ
4. การ query ใช้ UTC bounds และ cache key ตามช่วงเวลา ส่วน backend ส่งกลับรายการเวร, min/max และ holiday ที่ทับซ้อนกับช่วงนั้น
5. validation, auth/access-control, redirect-on-error, refresh และ query cache เป็นพฤติกรรมเดิมที่ต้องคงไว้

## 4. Business Logic ที่คาดหวังหลัง Implement

1. เพิ่มตัวเลือก 3 ระดับในหน้าเดิม: เดือนนี้, สัปดาห์นี้ (จันทร์ถึงอาทิตย์) และ 1 วัน (วันนี้) โดยแต่ละระดับมีปุ่มย้อนกลับและถัดไป
2. ช่วง “เดือนนี้” คือเวลาเริ่มต้นวันแรกของเดือน ณ เวลา 00:00 ใน `place.timezone` จนถึงเวลา 00:00 ของวันแรกของเดือนถัดไป
3. ช่วง “สัปดาห์นี้” เริ่มวันจันทร์ 00:00 ตาม `place.timezone` และสิ้นสุดที่วันจันทร์ถัดไป 00:00 โดยช่วงที่แสดงครอบคลุมวันจันทร์ถึงวันอาทิตย์
4. ช่วง “1 วัน” เริ่ม 00:00 ของวันนี้ตาม `place.timezone` และสิ้นสุด 00:00 ของวันถัดไป
5. ปุ่มย้อนกลับ/ถัดไปเลื่อนทีละหนึ่งเดือน, หนึ่งสัปดาห์ หรือหนึ่งวันตามระดับของปุ่มนั้น โดยคงระดับที่กำลังนำทางไว้เพื่อให้กดเลื่อนซ้ำได้ เมื่อเริ่มนำทางด้วยระดับอื่น ให้ยึดช่วงปัจจุบันของระดับนั้นก่อนแล้วเลื่อนตามทิศทางที่กด ปุ่ม preset ที่มีชื่อ “เดือนนี้/สัปดาห์นี้/1 วัน” ให้กลับไปยังช่วงปัจจุบันของระดับนั้นเสมอ
6. ขอบเขตต้นและปลายทุกช่วงคำนวณจาก `place.timezone` ด้วย Luxon ไม่ใช้ timezone ของเครื่อง browser และไม่คำนวณด้วยจำนวนชั่วโมงคงที่ เพราะเดือน, สัปดาห์, วัน และการเปลี่ยนเวลาออมแสงอาจมีความยาวไม่เท่ากัน
7. ปุ่ม preset และปุ่มย้อนกลับ/ถัดไปเติมค่าใน draft start/end เท่านั้น ต้องไม่เปลี่ยน `appliedRange` และต้องไม่ trigger query โดยอัตโนมัติ ผู้ใช้ยังต้องกด “แสดงตารางเวร” เพื่อใช้ช่วงใหม่ เหตุผลคือรักษาพฤติกรรม draft/apply ที่มีอยู่และมี tests ยืนยันแล้ว
8. เมื่อมี `appliedRange` และผู้ใช้เลือก preset หรือเลื่อนช่วง draft ให้แสดง dirty hint ที่มีอยู่ และคง board เดิมไว้จนกว่าจะ submit สำเร็จ การเลือก preset ก่อน apply ครั้งแรกต้องไม่สร้าง board หรือ request
9. เมื่อ submit แล้ว ให้คงการตรวจสอบช่วงเวลาและการแปลงเป็น UTC ผ่าน `parseSlotDateRange` ตามเดิม ช่วงที่ส่ง backend ต้องใช้ end ของช่วงปฏิทินเป็นขอบเขต exclusive เพื่อให้รายการที่เริ่มตรงขอบเขตของช่วงถัดไปไม่ถูกนับซ้ำ
10. หากกำลัง fetch อยู่ controls ใหม่ต้องถูก disable เช่นเดียวกับ form เดิม การกด controls ใหม่ต้องไม่ยกเลิกหรือเปลี่ยน request ที่กำลังทำงาน

## 5. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### ไฟล์ที่ควรแก้

- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx` — เพิ่ม controls และการเชื่อมต่อกับ draft state
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/slot-date-range.ts` — เพิ่ม helper ที่ทดสอบได้สำหรับสร้างและเลื่อนช่วงปฏิทินตาม preset
- `ecosystem-frontend-next-js/tests/work-schedule/slot-date-range.test.ts` — เพิ่ม unit tests ของการคำนวณช่วงและการเลื่อนช่วง
- `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-date-range.test.tsx` — เพิ่ม integration tests ของ controls กับพฤติกรรม draft/apply ที่มีอยู่

### ไฟล์ที่ไม่ควรต้องเปลี่ยนในงานนี้

- Backend handler/query/API, query keys และ React Query options ไม่ต้องเปลี่ยน
- `component-work-schedule-board.tsx` ไม่ต้องเปลี่ยน หากยังรับช่วงเวลาเต็มที่ส่งเข้าและแสดงผลได้ตามเดิม ห้ามแก้ logic ของ slot, holiday, staffing counts หรือ Min/Max เพียงเพื่อเพิ่ม controls
- ไม่ต้องเพิ่ม dependency, environment variable, migration หรือ endpoint ใหม่
- `VERIFICATION_TABLE.md` ได้ตรวจแล้วว่าแถว `Approve CURRENT_TASK_PLAN` ว่างทุกช่องอยู่ก่อนเริ่ม จึงคงว่างไว้ทั้งหมดในรอบที่มีการแก้แผน และไม่ทำเครื่องหมายช่องใดในรอบนี้

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### 6.1 `slot-date-range.ts`

- เพิ่ม type สำหรับระดับช่วงเวลา เช่น `month`, `week`, `day` และ helper สำหรับสร้างช่วงของระดับนั้นจาก reference datetime กับ timezone ที่ระบุ
- เพิ่ม helper สำหรับเลื่อนช่วงตามระดับและทิศทางก่อนหน้า/ถัดไป โดย normalize เป็น start-of-month, start-of-week หรือ start-of-day ก่อนเลื่อนหนึ่งหน่วย
- คืนค่า draft strings ในรูปแบบที่ `input[type="datetime-local"]` ใช้ได้ (`yyyy-MM-dd'T'HH:mm`) โดย start คือ start ของ period และ end คือ start ของ period ถัดไป
- helper ต้องรับ reference datetime หรือ reference value ที่กำหนดจาก test ได้ เพื่อให้ unit tests ใช้วันที่คงที่และไม่ flaky ตามวันรันจริง
- คง `AppliedSlotRange`, `parseSlotDateRange` และ `formatSlotDateRange` ให้รองรับ manual input เดิม ห้ามลด validation หรือเปลี่ยนวิธีแปลง UTC ของช่วงที่ผู้ใช้กรอกเอง

### 6.2 `client-page.tsx`

- เพิ่ม state ที่จำเป็นสำหรับระดับ preset ที่เลือก/กำลังนำทาง โดยไม่รวม draft state กับ applied state เข้าด้วยกัน
- เพิ่ม control group 3 กลุ่ม แต่ละกลุ่มประกอบด้วยปุ่มย้อนกลับ, ปุ่ม preset ของระดับนั้น และปุ่มถัดไป; ปุ่ม preset เลือก period ปัจจุบันของระดับ ส่วนลูกศรเลื่อน period ทีละหนึ่งหน่วย
- ใช้ helper จาก `slot-date-range.ts` เพื่อ set ค่า `draftStartDateTime` และ `draftEndDateTime`; ห้าม duplicate date arithmetic ใน JSX handler
- วาง controls ภายใน form/fieldset ที่มีอยู่ เพื่อให้ disabled ตอน `isFetchingSlot` และกำหนดปุ่มที่ไม่ใช่ submit เป็น `type="button"`
- เมื่อเลือก preset หรือเลื่อนช่วง ให้ล้าง `validationError` เดิมในลักษณะเดียวกับการแก้ date input แต่ไม่เรียก `setAppliedRange`, `refetchSlot` หรือ API
- คงปุ่ม “แสดงตารางเวร”, dirty hint, label ของช่วงที่ apply แล้ว, `ChildrenHeader`, refresh, redirect และ error flow เดิม
- ใช้ accessible name/label ภาษาไทยที่แยกได้ชัดสำหรับแต่ละระดับและทิศทาง เพื่อให้ทดสอบผ่าน `getByRole` ได้โดยไม่พึ่ง CSS selector

### 6.3 `slot-date-range.test.ts`

- เพิ่มกรณี month: start เป็นวันแรกของเดือนเวลา 00:00 และ end เป็นวันแรกของเดือนถัดไปเวลา 00:00 รวมกรณีข้ามเดือน/ปี
- เพิ่มกรณี week: start เป็นวันจันทร์ 00:00 และ end เป็นวันจันทร์ถัดไป 00:00 ทั้ง reference date ที่เป็นวันจันทร์และวันอาทิตย์
- เพิ่มกรณี day: start เป็นเที่ยงคืนของวันที่อ้างอิงและ end เป็นเที่ยงคืนวันถัดไป
- เพิ่มกรณี previous/next สำหรับทุกระดับ รวมการเลื่อนข้ามเดือนและข้ามปี
- ยืนยันว่าการคำนวณอ้างอิง timezone ที่ส่งเข้ามา ไม่ใช่ timezone ของ environment; เก็บ tests ของ parser เดิมไว้ทั้งหมด

### 6.4 `admin-slot-date-range.test.tsx`

- ทดสอบว่าการกด preset แต่ละระดับอัปเดตเฉพาะค่า input และไม่เรียก `getSlotsByPositionIdStartTimeEndTime` ก่อน submit
- ทดสอบ previous/next ของ month/week/day ว่าเปลี่ยนช่วงได้หนึ่ง period ตามทิศทาง รวมการกดเลื่อนซ้ำ
- submit หลังเลือก preset แล้วต้องส่ง UTC bounds ที่ตรงกับขอบเขตใน `place.timezone` เพียงครั้งเดียว และแสดงผลจากช่วงที่ apply แล้ว
- หลังเคย apply ช่วง A แล้วเลือก/เลื่อนเป็นช่วง B ให้ยังแสดงผล A และ dirty hint จนกว่า B จะถูก submit; เมื่อ submit B สำเร็จจึงแสดง B
- ทดสอบว่า controls ถูก disable ระหว่าง fetch และปุ่มย้อนกลับ/ถัดไปไม่ submit form โดยไม่ตั้งใจ
- คง tests เดิมทั้งหมดสำหรับ manual editing, validation, cache, refresh, retry, redirect และ error behavior

## 7. ขั้นตอน Implement และเกณฑ์ยอมรับ

### ขั้นที่ 1 — เพิ่ม helper สำหรับ period range

เกณฑ์ผ่าน:
- helper สร้าง start/end ตามเดือน, สัปดาห์ ISO ที่เริ่มวันจันทร์ และวัน ใน timezone ที่ส่งให้
- end เป็น start ของ period ถัดไปแบบ exclusive และผ่าน `parseSlotDateRange` ได้
- previous/next เลื่อนได้ทีละหนึ่ง period โดยรองรับการเปลี่ยนเดือน/ปี
- unit tests ใหม่ผ่าน และ unit tests เดิมของ parser ไม่เสีย

### ขั้นที่ 2 — เพิ่ม controls ในหน้า admin

เกณฑ์ผ่าน:
- แสดง control groups ครบ 3 ระดับพร้อมปุ่มก่อนหน้า/ถัดไปใน route เดิม
- controls ตั้ง draft start/end ตาม period และไม่ยิง query จนกด “แสดงตารางเวร”
- หลังมีผลลัพธ์แล้ว การเปลี่ยน draft แสดง dirty hint และไม่ลบ/แทนที่ board ที่ apply แล้ว
- ระหว่าง query ทำงาน controls ถูก disable; ไม่มีการเปลี่ยน refresh, auth, redirect หรือ error flow

### ขั้นที่ 3 — ทดสอบ integration และตรวจ frontend

เกณฑ์ผ่าน:
- integration tests ใหม่และเดิมใน `admin-slot-date-range.test.tsx` ผ่าน
- frontend typecheck, lint และ build ผ่าน
- ไม่แก้ไฟล์ backend, query contract, query key หรือ calculation ของ board โดยไม่มีเหตุจำเป็นที่ยืนยันจากการทดสอบ

## 8. Test และคำสั่งตรวจสอบ

รันจาก repository root ตามลำดับ:

1. ทดสอบเฉพาะไฟล์ที่เกี่ยวข้อง:

   `pnpm --dir ecosystem-frontend-next-js exec jest --runInBand tests/work-schedule/slot-date-range.test.ts tests/work-schedule/admin-slot-date-range.test.tsx`

2. ตรวจ type ของ frontend:

   `pnpm run typecheck:frontend`

3. ตรวจ lint ของ frontend:

   `pnpm run lint:frontend`

4. ตรวจ build ของ frontend:

   `pnpm run build:frontend`

5. หาก environment และ dependencies พร้อม ให้รัน verification มาตรฐานของ repository ซึ่งเป็นคำสั่งเดียวกับที่ CI ใช้:

   `pnpm run verify`

หากคำสั่งใดรันไม่ได้เพราะ environment/dependencies ไม่พร้อม ให้รายงานคำสั่งและ error จริง ห้ามนับว่าเป็น test ผ่าน และห้ามเปลี่ยนไปใช้ database จริงเพื่อให้ test ผ่าน

## 9. ข้อควรระวังและขอบเขตที่ห้ามเปลี่ยนโดยไม่ตั้งใจ

- ใช้ `place.timezone` สำหรับความหมายของวันนี้/เดือนนี้/สัปดาห์นี้เสมอ ไม่ใช้ timezone ของ browser หรือ `toISOString()` เพื่อกำหนดวันท้องถิ่น
- หลีกเลี่ยง end-of-day แบบ `23:59` หรือการบวกชั่วโมงคงที่; ใช้ exclusive end ที่ start ของ period ถัดไปให้ตรงกับเงื่อนไข overlap ใน backend
- ห้ามให้ปุ่มลัดทำ auto-fetch เพราะจะเปลี่ยน contract draft/apply ที่ tests เดิมระบุไว้
- ห้ามให้ปุ่มย้อนกลับ/ถัดไปกลายเป็น form submit; controls ต้องเป็นปุ่มชนิด button และมี accessible names ที่ชัดเจน
- ห้ามเปลี่ยน query keys, `enabled`, `staleTime`, endpoint, permission checks, error routing, refresh/retry behavior หรือข้อมูลที่ส่งให้ `WorkScheduleBoard`
- ห้ามลบหรือทำให้ tests เดิมอ่อนลงเพื่อให้ tests ใหม่ผ่าน; เพิ่ม assertion สำหรับ behavior ใหม่ควบคู่กับ regressions เดิม
- งานนี้ไม่รวมการปรับดีไซน์หรือ logic ภายในกระดานรายชื่อเวรนอกเหนือจากการส่งช่วงเวลาใหม่ให้ board

## 10. กติกาการตรวจแผน

- หลังบันทึกแผนฉบับนี้ แถว `Approve CURRENT_TASK_PLAN` ใน `VERIFICATION_TABLE.md` ต้องว่างทั้งหมดเพื่อรอการตรวจแผนฉบับใหม่; ห้ามทำเครื่องหมายอนุมัติในรอบเดียวกับที่แก้แผน
- ห้ามทำเครื่องหมายในแถวอื่นของ `VERIFICATION_TABLE.md`
