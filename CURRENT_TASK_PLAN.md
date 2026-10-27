# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ปรับให้เข้าหน้า แก้ไข/ลบ min/max ได้จากหน้าดูตารางเวรรวมได้มั้ยครับ แล้วก็เพิ่มปุ่มสำหรับสร้าง min/max จากหน้าดูตารางเวรด้วยเลยครับ

## 2. เป้าหมายและขอบเขต

เพิ่มทางเข้าจัดการข้อมูล min/max จากหน้าดูตารางเวรของตำแหน่งงานเดียวกัน โดยใช้หน้าสร้างและหน้าแก้ไข/ลบที่มีอยู่แล้วเป็นปลายทาง ไม่สร้างฟอร์ม CRUD ซ้ำในกระดาน และไม่เปลี่ยน API, database schema, migration หรือกติกาธุรกิจของ min/max

ผลลัพธ์ที่ต้องได้:
- หน้าแสดงตารางเวรมีปุ่มสร้าง min/max ที่ใช้งานได้ แม้ยังไม่ได้เลือกช่วงเวลาเพื่อแสดงตาราง หรือกำลังกรองประเภทกะอยู่
- แถบข้อมูล min/max แต่ละรายการบนกระดานคลิกไปยังหน้าแก้ไข/ลบของรายการนั้นได้
- ปุ่มสร้างตารางเวรเดิมในหัวหน้าจอยังคงทำงานเหมือนเดิม
- การสร้าง แก้ไข ลบ การยืนยันก่อนลบ การตรวจสอบข้อมูล การตรวจสอบสิทธิ์ และการแจ้งข้อผิดพลาดยังใช้พฤติกรรมเดิมของหน้าจอและ API ที่มีอยู่

## 3. Business Logic ที่เกี่ยวข้องก่อนเริ่ม

### หน้าดูตารางเวร

ไฟล์ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx` เรียก `workScheduleSlotQueries.queryGetSlotsByPositionIdStartTimeEndTime(...)` ตาม `positionId` และช่วงเวลา UTC ที่ยืนยันแล้ว จากนั้นส่งข้อมูล `dataQuerySlot.minMaxs`, `placeId` และ `positionId` ให้ `WorkScheduleBoard`

ใน `component-work-schedule-board.tsx`:
- `compareSlices` ใช้ `slots` และ `minMaxs` เพื่อคำนวณการเปรียบเทียบจำนวนคนกับเกณฑ์ในแต่ละช่วงเวลา
- แถว `Min / Max` แสดงแต่ละรายการจาก `minMaxs` เป็นกล่องที่กำหนดตำแหน่งตามเวลา แต่ปัจจุบันกล่องเป็น `div` ที่ไม่มีลิงก์ไปหน้ารายการ
- หน้าตารางเวรมี `ChildrenHeader` ที่กำหนด `createHref` ไปยัง `/slot/new/menu` เพื่อสร้างรายการเวรอยู่แล้ว ห้ามเปลี่ยนปลายทางนี้เพื่อใช้สร้าง min/max แทน

### หน้าสร้างและหน้าแก้ไข/ลบ min/max ที่มีอยู่

- หน้าสร้าง: `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/new/client-page.tsx` โหลดข้อมูลสถานที่และ timezone จากนั้นใช้ `CreateForm` ใน `features/work-schedule/min-max/components/create-form.tsx`
- หน้าแก้ไข/ลบ: `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/[minMaxId]/client-page.tsx` โหลด min/max ตาม `positionId` และ `minMaxId` แล้วใช้ `EditForm` ใน `features/work-schedule/min-max/components/edit-form.tsx`
- หน้า `EditForm` รองรับการแก้ไขค่า min/max และเวลา รวมทั้งการลบที่ต้องยืนยันก่อนส่งคำขอ ลิงก์จากกระดานต้องพาไปหน้ารายละเอียดนี้ ไม่ลบข้อมูลจากการคลิกกล่องบนกระดานโดยตรง
- ปลายทางที่มีอยู่แล้วคือ:
  - สร้าง: `/work-schedule/admin/{placeId}/position/{positionId}/min-max/new`
  - แก้ไข/ลบรายการ: `/work-schedule/admin/{placeId}/position/{positionId}/min-max/{minMaxId}`
- หน้า Create และ EditForm ในปัจจุบันใช้ URL ของหน้ารายการ min/max เป็นปลายทางหลังบันทึกหรือยกเลิก ต้องคงพฤติกรรมปลายทางนี้ไว้ในงานนี้

### กติกา min/max ที่ต้องคงเดิม

จาก schema และ handler ใน `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/`:
- ต้องมีค่า min หรือ max อย่างน้อยหนึ่งค่า ห้ามปล่อยทั้งสองค่าให้ว่าง/เป็น null พร้อมกัน
- ค่า min และ max ที่ระบุ ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป และเมื่อมีทั้งสองค่าต้องมี min ไม่มากกว่า max
- `end_time` ต้องมากกว่า `start_time` และเวลาต้องเป็น ISO 8601 ที่มี offset ตาม schema
- รายการ min/max ของตำแหน่งงานเดียวกันห้ามมีช่วงเวลาทับซ้อนกัน การสร้างและการแก้ไขมีการตรวจสอบการทับซ้อนใน backend อยู่แล้ว
- ต้องผ่านการตรวจสอบสิทธิ์ admin ของตำแหน่งงานตามกลไกเดิม ห้ามหลีกเลี่ยงหรือแทนที่ access control ด้วยการตรวจเฉพาะฝั่ง UI

## 4. Business Logic ที่คาดหวังหลัง Implement

1. เมื่อผู้ใช้เปิดหน้าดูตารางเวรของ `placeId` และ `positionId` ที่ระบุ จะเห็นปุ่มสร้าง min/max ที่พาไปหน้าสร้างเดิม โดยไม่ต้องเปลี่ยนช่วงเวลาหรือเลือกประเภทกะก่อน
2. เมื่อผู้ใช้คลิกกล่อง min/max ที่มองเห็นบนกระดาน จะไปยังหน้าจัดการของ `mm.id` ที่ตรงกับกล่องนั้น ภายใต้ `placeId` และ `positionId` ปัจจุบัน
3. ผู้ใช้แก้ไขหรือเลือกลบได้ผ่าน `EditForm` เดิม การลบยังต้องกดยืนยัน และการสำเร็จ/ล้มเหลวใช้การแจ้งผล การ redirect และ validation เดิม
4. การกดปุ่มสร้างเวรเดิมยังเปิดเมนูสร้างเวรตามเส้นทางเดิม
5. การแสดงผลและการคำนวณ Compare Row, จำนวนผู้ปฏิบัติงาน, การกรองประเภทกะ, ช่วงวันที่ และ timezone ต้องไม่เปลี่ยน นอกเหนือจากการเพิ่มจุดนำทาง
6. ไม่เพิ่ม backend endpoint, schema, migration หรือกฎการสร้าง/แก้ไข/ลบใหม่ เพราะปลายทางและกติกาที่ต้องใช้มีอยู่แล้ว

เหตุผล: คำขอนี้เป็นการเพิ่มทางเข้าถึง CRUD ที่มีอยู่จากหน้า overview ไม่ใช่การเปลี่ยนวิธีคำนวณตารางเวรหรือกติกาการจัดเก็บ min/max

## 5. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

แก้ไขเฉพาะไฟล์ต่อไปนี้ใน repository root:

1. `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx`
   - เพิ่มลิงก์/ปุ่มไปหน้าสร้าง min/max แยกจาก `ChildrenHeader.createHref` เดิม
2. `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board.tsx`
   - ทำให้กล่อง min/max แต่ละรายการเป็นลิงก์ไปยังหน้าจัดการของรายการนั้น
3. `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-date-range.test.tsx`
   - เพิ่ม test ยืนยันว่าปุ่มสร้าง min/max แสดงและมีปลายทางถูกต้อง โดยยังไม่ต้องแสดงผลตารางเวรก็ได้
4. `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-board-holidays.test.tsx`
   - เพิ่ม test ยืนยันว่ากล่อง min/max เชื่อมไปยัง route ของ `minMaxId` ที่ตรงกัน และ test เดิมของกระดานยังผ่าน

ไม่จำเป็นต้องสร้างหรือลบไฟล์ และไม่ควรแก้ไฟล์อื่นหากไม่พบเหตุจำเป็นที่ยืนยันได้จากโค้ดและไม่สามารถแก้ภายในขอบเขตนี้ได้ หากพบข้อจำกัดเช่นนั้น ให้หยุดและถามก่อนขยายขอบเขต

## 6. รายละเอียดการเปลี่ยนแปลงและเกณฑ์ยอมรับรายขั้นตอน

### ขั้นที่ 1 — เพิ่มทางเข้าหน้าสร้าง min/max

ไฟล์: `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx`

- เพิ่มการใช้ `Link` จาก `next/link` หากยังไม่มี
- เพิ่มปุ่ม/ลิงก์ที่มีชื่อชัดเจน เช่น `สร้าง Min / Max` และใช้ปลายทาง `/work-schedule/admin/${placeId}/position/${positionId}/min-max/new`
- วางปุ่มแยกจากเงื่อนไขการแสดง `WorkScheduleBoard` และอยู่นอกส่วนที่แสดงเฉพาะเมื่อเลือก `selectedSlotTypeId === "all"` เพื่อให้เข้าถึงได้ก่อนเลือกช่วงเวลาและระหว่างกรองประเภทกะ
- คง `ChildrenHeader.createHref` เดิมที่ชี้ไปยัง `/slot/new/menu` ไว้ ห้ามแทนที่หรือเปลี่ยนพฤติกรรมสร้างรายการเวร

เกณฑ์ผ่าน:
- ปุ่มสร้าง min/max แสดงในหน้าดูตารางเวรได้แม้ยังไม่มีผลลัพธ์ตาราง
- ปุ่มมี href ที่ใช้ `placeId` และ `positionId` ปัจจุบันอย่างถูกต้อง
- ปุ่มสร้างเวรเดิมยังมี href และข้อความเดิม

### ขั้นที่ 2 — เพิ่มทางเข้าหน้าแก้ไข/ลบจากกล่อง min/max

ไฟล์: `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board.tsx`

- เปลี่ยนเฉพาะ element ที่สร้างจาก `minMaxs.map((mm) => ...)` ในแถว `Min / Max` ให้เป็น `Link` ที่ปลายทาง `/work-schedule/admin/${placeId}/position/${positionId}/min-max/${mm.id}`
- คงตำแหน่ง `style.left` และ `style.width`, การคำนวณ `getCoordinates`, title, การ clip ขอบซ้าย/ขวา, ข้อความ min/max และเวลาเริ่ม/สิ้นสุด
- เพิ่มสไตล์ hover/focus หรือ accessible name เท่าที่จำเป็นเพื่อให้รู้ว่ากล่องเปิดหน้าจัดการได้ โดยไม่เพิ่ม element แบบ interactive ซ้อนกัน
- ห้ามทำให้ Compare Row เป็นลิงก์ และห้ามยิง mutation ลบหรือแก้ไขจากการคลิกกล่อง

เกณฑ์ผ่าน:
- กล่อง min/max ที่แสดงอยู่มี href ไปหน้ารายละเอียดที่ตรงกับ `mm.id`
- route ใช้ `placeId` และ `positionId` ของกระดานปัจจุบัน ไม่ใช้ id จาก slot หรือรายการอื่น
- รูปแบบการแสดงและการคำนวณสถานะ Compare Row ไม่เปลี่ยน
- การเปิดหน้าจัดการไม่ทำให้เกิดการแก้ไขหรือลบข้อมูลโดยอัตโนมัติ

### ขั้นที่ 3 — เพิ่ม regression tests

ไฟล์ `tests/work-schedule/admin-slot-date-range.test.tsx`:
- เพิ่ม test ว่าปุ่ม `สร้าง Min / Max` ปรากฏหลัง render หน้าดูตารางเวร แม้ยังไม่กด `แสดงตารางเวร`
- ยืนยัน href ว่าใช้ `test-place` และ `test-position` กับ route `/min-max/new`
- ยืนยันว่าปุ่มสร้างเวรเดิมยังคงแสดงอยู่และชี้ไปยังเส้นทางเดิม หากโครงสร้าง test ตรวจสอบได้โดยตรง

ไฟล์ `tests/work-schedule/admin-slot-board-holidays.test.tsx`:
- ใช้ fixture min/max ที่มีอยู่หรือเพิ่ม fixture ที่ระบุ id แน่นอน
- ยืนยันว่ากล่อง min/max เป็น link และ href ลงท้ายด้วย id ของ fixture ภายใต้ place/position ที่ส่งให้ `WorkScheduleBoard`
- คง assertions เดิมสำหรับวันหยุด จำนวนคน และการเลื่อนกระดานแนวนอนไว้

เกณฑ์ผ่าน:
- tests ใหม่ยืนยันทั้งปลายทางสร้างและปลายทางแก้ไข/ลบ
- tests เดิมเกี่ยวกับช่วงเวลา วันหยุด การกรองประเภทกะ และ layout ของกระดานยังผ่าน
- ไม่มี test ที่ต้องเชื่อมต่อฐานข้อมูลจริงหรือเรียก API จริง

## 7. สิ่งที่ Implementor ต้องระวัง

- ใช้ `mm.id` ที่มาจากรายการ min/max จริงเท่านั้น ห้ามสร้างหรือประกอบ id ขึ้นเอง
- ห้ามส่ง `placeId` หรือ `positionId` ของหน้าปัจจุบันไปผิด route; ต้องรักษาการ scope รายการ min/max ตามตำแหน่งงาน
- อย่าใช้ `ChildrenHeader.createHref` ซ้ำสำหรับ CTA ใหม่ เพราะ action เดิมคือการสร้าง slot
- อย่าวาง CTA สร้าง min/max ไว้ภายในแถวที่แสดงเฉพาะตอน `selectedSlotTypeId === "all"` เพราะผู้ใช้จะมองไม่เห็นเมื่อกรองประเภทกะ
- อย่าลบหรือแก้ไข min/max จากกระดานโดยตรง ต้องผ่านหน้า detail และขั้นตอนยืนยันลบเดิม
- อย่าเปลี่ยน `compareSlices`, การคำนวณช่วงเวลาที่ทับกัน, logic timezone, date range, slot filter หรือ query parameters เพื่อทำให้ลิงก์ทำงาน
- อย่าเปลี่ยน validation, access control, API contract, cache keys, redirect/error mapping หรือปลายทางหลังบันทึก/ยกเลิกของฟอร์มที่มีอยู่ โดยไม่มีเหตุจำเป็นที่ยืนยันได้
- Unit tests ต้อง mock dependencies ตามแนวทางของชุดทดสอบปัจจุบัน ไม่ใช้ฐานข้อมูลจริง และห้ามใช้ `prisma db push` กับฐานข้อมูลร่วม/production

## 8. Test และคำสั่งตรวจสอบ

รันจาก root repository:

1. Tests ที่เกี่ยวข้อง:
   ```bash
   pnpm --dir ecosystem-frontend-next-js exec jest --runInBand --runTestsByPath tests/work-schedule/admin-slot-date-range.test.tsx tests/work-schedule/admin-slot-board-holidays.test.tsx
   ```
2. TypeScript:
   ```bash
   pnpm run typecheck:frontend
   ```
3. Lint frontend:
   ```bash
   pnpm run lint:frontend
   ```
4. Build frontend:
   ```bash
   pnpm run build:frontend
   ```
5. ตรวจรวมตามมาตรฐาน repository/CI เมื่อ environment รองรับ:
   ```bash
   pnpm run verify
   ```

เกณฑ์ผ่านสุดท้าย: คำสั่ง targeted tests, typecheck, lint และ build ต้องผ่าน; test ของ board เดิมต้องไม่ regression; GitHub Actions ที่รันกับการเปลี่ยนแปลงต้องผ่านด้วย หาก environment ไม่รองรับการรันคำสั่ง ให้รายงานคำสั่งที่ไม่ได้รันอย่างชัดเจน ห้ามอ้างว่าผ่านโดยไม่มีผลทดสอบจริง
