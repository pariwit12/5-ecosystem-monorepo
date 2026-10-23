# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

สร้างหน้าต่างให้พนักงานสามารถดูวันทำงานของตัวเองได้

## 2. ขอบเขตงาน

เพิ่มส่วนแสดงตารางวัน/ช่วงเวลาที่พนักงานคนปัจจุบันมีเวรในสถานที่ทำงานที่ตนมีสิทธิ์เข้าถึง โดยต่อยอดจากหน้า Staff ของ Work Schedule ที่มีอยู่แล้ว

- เป็นฟังก์ชันอ่านข้อมูลเท่านั้น ไม่เพิ่ม/แก้ไข/ลบเวร และไม่เปลี่ยนกฎการจัดตารางเวร
- แสดงเฉพาะเวรของพนักงานที่ผูกกับผู้ใช้ที่เข้าสู่ระบบและสถานที่ที่เลือก
- ใช้การแบ่งหน้าตามเดือน พร้อมปุ่มเดือนก่อนหน้า/ถัดไป และแสดงรายการเวรภายในเดือนที่เลือก
- แสดงวันที่ เวลาเริ่มต้น เวลาสิ้นสุด และประเภทเวร โดยใช้ข้อมูล Slot ที่มีอยู่จริง
- ใช้ timezone ของสถานที่ทำงานในการจัดกลุ่มและแสดงวันที่/เวลา
- ไม่รวมรายการวันหยุดเป็นวันทำงาน และไม่เปลี่ยน Business Logic ของระบบวันหยุด

## 3. Business Logic ที่เกี่ยวข้องก่อนเริ่ม

1. หน้า `/work-schedule/staff/[placeId]` แสดงข้อมูลสถานที่และพนักงานของผู้ใช้ พร้อม `HolidayForm` และ `HolidayList` อยู่แล้ว
2. `GET /api/work-schedule/staff-place/:place_id` ใช้ `ClerkAuthGuard` และ `AccessControlService.verifyWorkScheduleStaffAccess` เพื่อยืนยันสิทธิ์พนักงาน แล้วคืน `placeId`, `name`, `timezone` และ `staff.id/name`
3. ระบบ Slot อยู่ในโมดูล `src/modules/work-schedule/slot` และข้อมูลที่มีอยู่ประกอบด้วยพนักงาน ประเภทเวร เวลาเริ่มต้นจริง และเวลาสิ้นสุดจริง
4. Endpoint ที่ตรวจพบ `GET /api/work-schedule/slot/by-position-id-start-time-end-time/:position_id` ตรวจสิทธิ์ด้วย `verifyWorkSchedulePositionByWorkScheduleAdmin` จึงเป็น endpoint สำหรับผู้ดูแลตำแหน่ง ไม่ควรนำมาใช้เป็น endpoint ของพนักงาน
5. `WorkScheduleModule` ลงทะเบียน `SlotModule`, `WorkScheduleStaffPlaceModule` และ `HolidayModule` อยู่แล้ว
6. ฝั่ง frontend ใช้ Next.js App Router, Clerk `useAuth`, TanStack Query และ API client กลาง และมีรูปแบบแยก API/query/component ตาม feature
7. ตารางตรวจสอบ `VERIFICATION_TABLE.md` มีแถว `Approve CURRENT_TASK_PLAN` ว่างทุกช่องอยู่แล้วก่อนเริ่มงานนี้

## 4. ส่วนของโค้ดที่เกี่ยวข้องก่อนเริ่ม (ตรวจจาก branch main)

### Frontend

- `ecosystem-frontend-next-js/src/app/work-schedule/staff/[placeId]/page.tsx` รับ `placeId` จาก route แล้วส่งให้ `client-page`
- `ecosystem-frontend-next-js/src/app/work-schedule/staff/[placeId]/client-page.tsx` โหลดข้อมูลผ่าน `workScheduleStaffPlaceQueries.detail(userId, getToken, placeId, ...)` และแสดงชื่อสถานที่ timezone ข้อมูลพนักงาน รวมถึง `HolidayForm` และ `HolidayList`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/queries/get-slots-by-position-id-start-time-end-time.api.ts` เป็น API client ของ query Slot ฝั่งผู้ดูแลตำแหน่ง ต้องไม่เปลี่ยนสิทธิ์ของ endpoint นี้เพื่อรองรับหน้าพนักงาน
- `ecosystem-frontend-next-js/src/features/work-schedule/staff-place/work-schedule-staff-place.queries.ts` แสดงรูปแบบ query ที่ใช้ `userId`, `getToken`, `placeId`, `enabled` และ `staleTime`

### Backend

- `ecosystem-backend-nest-js/src/modules/work-schedule/staff-place/work-schedule-staff-place.controller.ts` ประกาศ endpoint `GET /api/work-schedule/staff-place/:place_id` และบังคับ Clerk authentication
- `ecosystem-backend-nest-js/src/modules/work-schedule/staff-place/queries/get-staff-place.handler.ts` ใช้ `verifyWorkScheduleStaffAccess` เพื่อ resolve `staffId` จากผู้ใช้ปัจจุบัน และคืน timezone ของสถานที่
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts` ประกาศ endpoint query Slot ของผู้ดูแล โดยส่งงานผ่าน CQRS QueryBus
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.handler.ts` อ่าน `workScheduleSlot` และส่งคืน `slotTypeName`, `actualStartTime`, `actualEndTime` แต่ตรวจสิทธิ์ผู้ดูแลตำแหน่งเท่านั้น
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.module.ts` ลงทะเบียน controller และ CQRS handlers ของ Slot
- `ecosystem-backend-nest-js/src/modules/work-schedule/work-schedule.module.ts` ลงทะเบียน feature modules ของ Work Schedule

หมายเหตุ: ยังไม่ได้ยืนยันเนื้อหา Prisma schema จากเส้นทางไฟล์ที่คาดไว้ เนื่องจากไม่พบ schema file ในเส้นทางเหล่านั้นบน branch main ที่อ่านได้ หาก Implementor ต้องตรวจชื่อ relation/field เพิ่มเติม ให้ตรวจ schema ที่กำหนดใน `ecosystem-backend-nest-js/prisma.config.ts` (`schema: 'prisma/schema'`) ก่อนเขียน query และห้ามเดาชื่อ relation

## 5. Business Logic ที่คาดหวังหลัง Implement (พร้อมเหตุผล)

1. พนักงานที่เข้าสู่ระบบและผ่านสิทธิ์ของ `placeId` สามารถเปิดดูตารางเวรของตนเองในสถานที่นั้นได้ เพื่อให้เห็นวันและเวลาที่ต้องทำงาน
2. Backend ต้องหา `staffId` จากตัวตนที่ผ่าน `verifyWorkScheduleStaffAccess` เท่านั้น ห้ามรับ `staffId` จาก client มาใช้เลือกข้อมูลโดยตรง เพื่อป้องกันการอ่านตารางเวรของพนักงานคนอื่น
3. Query ต้องจำกัดข้อมูลด้วยช่วงเวลาเริ่มต้น/สิ้นสุดของเดือนที่ร้องขอ และเลือกเฉพาะ Slot ที่ทับซ้อนช่วงเดือนนั้น โดยใช้เงื่อนไขช่วงเวลาแบบ `actualStartTime < end` และ `actualEndTime > start` เพื่อไม่พลาดเวรที่เริ่มก่อนเดือนแต่จบในเดือน
4. Backend คืนเฉพาะฟิลด์ที่หน้าจอต้องใช้: รหัส Slot, ชื่อประเภทเวร, เวลาเริ่มต้นจริง และเวลาสิ้นสุดจริง (รวมเฉพาะข้อมูลที่จำเป็นต่อ UI) เรียงตามเวลาเริ่มต้นและเวลาเลิก
5. Frontend แสดงเวรตาม timezone ของสถานที่ (`data.timezone`) ไม่ใช่ timezone ของเครื่องผู้ใช้ เพื่อให้วันทำงานตรงกับสถานที่ที่จัดตาราง
6. หน้าจอมีสถานะกำลังโหลด, ไม่มีเวรในเดือนนั้น และโหลดข้อมูลไม่สำเร็จ แยกกันชัดเจน และใช้การจัดการ error ตาม pattern ปัจจุบัน
7. เปลี่ยนเดือนแล้ว query key ต้องเปลี่ยนตามช่วงเวลาที่เลือก เพื่อไม่แสดงข้อมูลค้างจากเดือนก่อน
8. หน้านี้เป็น read-only เท่านั้น ห้ามเพิ่ม action สำหรับสร้าง/แก้ไข/ลบ Slot และห้ามเปลี่ยนกฎตรวจเวรซ้อน, min/max, การอนุญาต, วันหยุด หรือการจัดการสถานที่

## 6. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### ต้องสร้าง

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-my-work-schedule-slots.query.ts` — DTO/Query/Response สำหรับคำขอดูเวรของผู้ใช้ปัจจุบันและช่วงเวลา
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-my-work-schedule-slots.handler.ts` — ตรวจสิทธิ์, resolve staffId, query Slot และ map response
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/queries/get-my-work-schedule-slots.api.ts` — API client สำหรับ endpoint ใหม่
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/work-schedule-slot-keys.ts` — query key สำหรับข้อมูลของผู้ใช้/สถานที่/ช่วงเวลา หากไม่มี key ที่เหมาะสมอยู่แล้ว ให้ตรวจไฟล์จริงก่อนสร้างซ้ำ
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/work-schedule-slot.queries.ts` — TanStack Query options สำหรับ endpoint ใหม่ หากมีไฟล์นี้อยู่แล้วให้แก้ไขไฟล์เดิมแทนการสร้างซ้ำ
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/my-work-schedule-calendar.tsx` — UI สำหรับเปลี่ยนเดือนและดูรายการเวรของพนักงาน

### ต้องแก้ไข

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts` — เพิ่ม authenticated GET endpoint ใหม่สำหรับเวรของผู้ใช้ปัจจุบัน โดยไม่เปลี่ยน endpoint ของผู้ดูแล
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.module.ts` — ลงทะเบียน query handler ใหม่
- `ecosystem-frontend-next-js/src/app/work-schedule/staff/[placeId]/client-page.tsx` — แสดง component ตารางเวรในหน้าพนักงาน โดยส่ง `placeId` และ timezone ที่โหลดได้แล้ว

### อาจแก้ไขเมื่อจำเป็นและตรวจสอบแล้ว

- ไฟล์ test ของ Slot query/handler/controller และ component/query ที่เพิ่มใหม่
- ไฟล์ query key/queries ที่มีอยู่จริงใน feature Slot หากพบว่าโครงสร้างปัจจุบันมีไฟล์เหล่านี้แล้ว ให้ reuse แทนการสร้างไฟล์ซ้ำ

### ไม่ควรแก้ไขหรือลบ

- `VERIFICATION_TABLE.md` ไม่ต้องแก้ไข หากแถว Approve ยังว่างทุกช่องตามที่ตรวจพบก่อนเริ่ม
- ไม่ต้องแก้ schema/migration เพราะงานนี้เป็นการอ่านข้อมูล Slot ที่มีอยู่แล้ว เว้นแต่การตรวจ schema จริงพิสูจน์ว่าจำเป็นและ Planner อนุมัติขอบเขตเพิ่มเติมก่อน
- ห้ามเปลี่ยนหรือลบ `HolidayForm`, `HolidayList`, endpoint สำหรับผู้ดูแล, access control หรือ Business Logic การสร้างเวร

## 7. รายละเอียดการเปลี่ยนแปลงและเกณฑ์ยอมรับตามขั้นตอน

### ขั้นตอน 1 — Backend query สำหรับเวรของผู้ใช้ปัจจุบัน

1. ตรวจ schema จริงและ pattern ของ query/handler ที่เกี่ยวข้องก่อนลงมือ
2. เพิ่ม DTO ที่ตรวจสอบ `place_id`, `start_time` และ `end_time`; ใช้ UUID v7 ตาม convention ที่มีใน feature และ ISO 8601 datetime ที่มี offset ตาม query ปัจจุบัน
3. ปฏิเสธคำขอเมื่อ `end_time <= start_time`
4. ใช้ `AccessControlService.verifyWorkScheduleStaffAccess(clerkId, place_id)` เพื่อยืนยันสิทธิ์และรับ `staffId`
5. ค้นหาเฉพาะ `workScheduleSlot` ของ `staffId` ดังกล่าวที่ทับซ้อนช่วงเวลา โดยเลือกเฉพาะฟิลด์ที่จำเป็นและเรียงตาม `actualStartTime` จากน้อยไปมาก
6. คืนค่าเวลาเป็น ISO string เพื่อให้สอดคล้องกับ endpoint Slot ปัจจุบัน
7. เกณฑ์ผ่าน: ไม่สามารถใช้พารามิเตอร์จาก client เพื่อขอข้อมูลของ staff คนอื่นได้; ผู้ไม่มีสิทธิ์ในสถานที่ถูกปฏิเสธ; query คืนเฉพาะช่วงเวลาที่ทับซ้อนและข้อมูลของพนักงานปัจจุบัน

### ขั้นตอน 2 — ลงทะเบียน endpoint และ CQRS handler

1. เพิ่ม route ใหม่ใน `SlotController` โดยใช้ `ClerkAuthGuard`, `ClerkUser`, QueryBus และ DTO ตาม pattern เดิม
2. ลงทะเบียน handler ใน `slot.module.ts`
3. ห้ามลด/เปลี่ยน guard หรือ access-control ของ route ที่มีอยู่
4. เกณฑ์ผ่าน: endpoint ใหม่เรียก handler ได้ผ่าน CQRS; endpoint เดิมของผู้ดูแลทำงานและใช้สิทธิ์เดิมเหมือนเดิม

### ขั้นตอน 3 — Frontend API/query

1. สร้าง API client ที่เรียก endpoint ใหม่ด้วย token จาก Clerk และตรวจสอบข้อมูล request ตาม schema ที่แชร์จาก backend ตาม pattern ใน `get-slots-by-position-id-start-time-end-time.api.ts`
2. สร้าง query key ที่แยกตาม user, place และ start/end ของช่วงเดือน เพื่อไม่ใช้ cache ข้ามผู้ใช้หรือข้ามเดือน
3. เปิด query เฉพาะเมื่อมี `userId`, `placeId` และช่วงเวลาที่ถูกต้อง
4. เกณฑ์ผ่าน: request ส่ง token และช่วงเวลาถูกต้อง; เปลี่ยนเดือนแล้วโหลด query ของช่วงใหม่; ข้อมูลเก่าของผู้ใช้อื่นไม่ถูกนำมาแสดง

### ขั้นตอน 4 — UI ในหน้าพนักงาน

1. เพิ่ม `MyWorkScheduleCalendar` ใน `client-page.tsx` ภายในส่วนที่มี `data` แล้วเท่านั้น โดยส่ง `placeId` และ `data.timezone`
2. เริ่มต้นที่เดือนปัจจุบันตาม timezone ของสถานที่ และให้เปลี่ยนไปเดือนก่อน/ถัดไปได้
3. แสดงรายการเวรของเดือนที่เลือก โดยจัดวันและเวลาใน timezone ของสถานที่ และแสดงประเภทเวร
4. แสดงสถานะ loading, empty state และ error state อย่างชัดเจน
5. คงข้อมูลสถานที่ ข้อมูลพนักงาน `HolidayForm`, `HolidayList` และลิงก์กลับไว้
6. เกณฑ์ผ่าน: พนักงานเห็นเฉพาะเวรของตนเอง; วันที่/เวลาแสดงตาม timezone สถานที่; เดือนที่ไม่มีเวรแสดง empty state; ไม่มีปุ่มแก้ไขข้อมูลเวร

### ขั้นตอน 5 — Tests และตรวจสอบ regression

เพิ่มหรือปรับ test ตามรูปแบบที่มีอยู่จริง โดยอย่างน้อยต้องครอบคลุม:

- Backend handler: query เฉพาะ staff ที่ได้จาก access control; ช่วงเวลาทับซ้อนขอบเขตเดือน; เรียงลำดับเวลา; คืนฟิลด์และ ISO timestamps ตาม contract
- Backend access: ผู้ใช้ที่ไม่ใช่ staff ของสถานที่และสถานที่ที่ไม่ถูกอนุญาตต้องถูกปฏิเสธตาม access control เดิม
- DTO: ปฏิเสธ UUID/วันที่ไม่ถูกต้องและช่วงเวลาที่ end ไม่มากกว่า start
- Frontend query: สร้าง query key ต่างกันเมื่อ user/place/month ต่างกัน และไม่ query เมื่อข้อมูลจำเป็นยังไม่พร้อม
- Frontend UI: loading, empty, error, แสดงรายการเวรและการเปลี่ยนเดือน โดย timezone มาจากสถานที่
- Regression: คง behavior ของหน้า Staff เดิม, HolidayForm/HolidayList และ endpoint สำหรับผู้ดูแล

คำสั่งตรวจสอบที่กำหนดจาก scripts ที่มีใน root `package.json`:

```bash
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run test:backend
pnpm run build:backend
pnpm run build:frontend
```

หากแก้ test ฝั่ง frontend และไม่มี script test frontend ใน `package.json` ที่ตรวจพบ ให้ใช้ test runner ที่มีอยู่จริงใน repository หากไม่มี test runner ที่รองรับ ให้รายงานข้อจำกัด ห้ามเพิ่มเครื่องมือทดสอบใหม่โดยไม่จำเป็น

เกณฑ์ผ่านรวม: คำสั่งที่เกี่ยวข้องทั้งหมดผ่าน; ไม่มีการเปลี่ยน Business Logic ที่ไม่เกี่ยวข้อง; ผู้ใช้ไม่สามารถอ่านเวรของพนักงานอื่นผ่าน endpoint ใหม่; หน้าเดิมและ endpoint ผู้ดูแลยังคงทำงานตามเดิม

## 8. สิ่งที่ Implementor ต้องระวัง

- ตรวจไฟล์จริงก่อนแก้ไข เพราะ branch main อาจเปลี่ยนหลังจัดทำแผน
- ตรวจ schema ที่ `ecosystem-backend-nest-js/prisma.config.ts` ชี้ไปก่อนเขียน Prisma query; อย่าสมมติชื่อ field/relation
- ห้ามใช้ endpoint `by-position-id-start-time-end-time` ของผู้ดูแลในหน้าพนักงาน และห้ามเปลี่ยน access control ของ endpoint เดิม
- ห้ามรับ `staffId` จาก frontend เป็นตัวกำหนดเจ้าของข้อมูล; ต้อง resolve จาก Clerk identity และ access control ของสถานที่บน backend
- ใช้ช่วงเวลาที่มี timezone offset และแสดงผลด้วย timezone ของสถานที่; ระวังเวรที่ข้ามเที่ยงคืนหรือข้ามขอบเขตเดือน
- ใช้เงื่อนไข overlap `actualStartTime < requestedEnd` และ `actualEndTime > requestedStart`; อย่าใช้เงื่อนไขที่ตัดเวรซึ่งเริ่มก่อนต้นเดือนแต่สิ้นสุดในเดือน
- ไม่แก้การสร้างเวร, overlap validation, min/max rules, slot type, holiday rules, soft-delete หรือการอนุญาตในส่วนอื่น
- อย่าทำให้หน้า Staff โหลด component ตารางเวรก่อนข้อมูลสถานที่และ timezone พร้อมใช้งาน
- รักษา conventions เดิมของ CQRS, Zod DTO, API client, TanStack Query, error handling และ style
- ห้ามเพิ่ม migration หรือ dependency ใหม่โดยไม่มีเหตุผลที่ตรวจสอบได้
