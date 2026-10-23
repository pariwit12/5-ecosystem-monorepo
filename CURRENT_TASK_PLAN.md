# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

สร้างระบบให้พนักงานลงวันหยุดเองได้

## 2. ขอบเขตและ Business Logic ที่ยืนยันแล้ว

- พนักงานที่เข้าสู่ระบบและเชื่อมบัญชีกับพนักงานของสถานที่ทำงานแล้ว สามารถสร้างรายการวันหยุดของตนเองได้
- รองรับ 2 รูปแบบ:
  - **เต็มวัน**: ระบุวันที่ และตีความช่วงเวลาตาม timezone ของสถานที่ทำงาน ตั้งแต่เวลาเริ่มวันจนถึงเวลาเริ่มวันถัดไป
  - **บางช่วงเวลา**: ระบุวันและเวลาเริ่มต้น/สิ้นสุดอย่างชัดเจน
- รายการวันหยุดมีผลทันทีเมื่อบันทึกสำเร็จ ไม่มีกระบวนการอนุมัติ ไม่มีสถานะ pending/approved/rejected สำหรับรายการวันหยุด
- หากช่วงวันหยุดทับซ้อนกับเวรที่พนักงานถูกจัดลงไว้ใน `WorkScheduleSlot` ต้องปฏิเสธการบันทึกและแจ้งเหตุผลที่ผู้ใช้เข้าใจได้ ห้ามบันทึกแบบเตือนเฉย ๆ
- พนักงานดูรายการวันหยุดของตนเองได้ และลบรายการของตนเองได้ แต่ไม่มีความสามารถแก้ไขรายการเดิม หากต้องเปลี่ยนเวลาให้ลบแล้วสร้างรายการใหม่
- ห้ามผู้ใช้ดู/ลบรายการวันหยุดของพนักงานคนอื่นผ่านการเปลี่ยน ID ใน URL หรือ payload
- ใช้รูปแบบ module, CQRS, Prisma, authentication และ access control ที่มีอยู่ใน repository แทนการสร้างสถาปัตยกรรมคู่ขนาน

## 3. สภาพระบบปัจจุบันจากโค้ดที่ตรวจแล้ว

### Backend

- จุดรวมโมดูลคือ `ecosystem-backend-nest-js/src/modules/work-schedule/work-schedule.module.ts` ซึ่ง import feature modules ของ work schedule และปัจจุบันยังไม่มีโมดูลวันหยุด
- ตัวอย่างโครงสร้าง CQRS ที่มีอยู่คือ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.module.ts` มี controller, command handler และ query handler ลงทะเบียนผ่าน `CqrsModule`
- `ecosystem-backend-nest-js/src/modules/work-schedule/staff/work-schedule-staff.controller.ts` ใช้ `ClerkAuthGuard`, `@ClerkUser()`, `CommandBus` และ `QueryBus`; endpoint ปัจจุบันจัดการสร้าง/ค้นหาข้อมูล staff ไม่ใช่วันหยุด
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.handler.ts` ใช้เงื่อนไข overlap แบบ `actualStartTime < requestedEnd` และ `actualEndTime > requestedStart` สำหรับค้นหาเวรที่คาบเกี่ยวกัน สามารถใช้หลักเดียวกันในการตรวจช่วงเวลาวันหยุด
- ตารางเวรจริงอยู่ใน Prisma model `WorkScheduleSlot` ใน `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma` มี `staffId`, `positionId`, `actualStartTime`, `actualEndTime`; `staffId` อ้างผ่าน `WorkScheduleStaffPosition` ไปยัง `WorkScheduleStaff`
- `WorkScheduleStaff` มี `personId` ซึ่งเป็น nullable และสัมพันธ์กับ `Person`; ต้องใช้กลไกเชื่อมตัวตนและ access control ที่มีอยู่จริง ห้ามถือว่า Clerk subject เป็น Person ID โดยตรง
- `OrganizationWorkSchedulePlace` เก็บ `timezone` เป็น timezone มาตรฐาน IANA และมีความสัมพันธ์กับ staff ของสถานที่นั้น
- Prisma schema เป็นแบบหลายไฟล์ใน `ecosystem-backend-nest-js/prisma/schema/`; Prisma config ระบุ schema directory `prisma/schema` และ migrations directory `prisma/migrations`
- ยังไม่พบโมเดลหรือ endpoint วันหยุดจากโครงสร้างและไฟล์ที่ตรวจในรอบนี้

### Frontend

- หน้ารวม `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx` แสดงสถานที่ทำงานของผู้ใช้ และลิงก์พนักงานไป `/work-schedule/staff/[placeId]`
- Feature frontend สำหรับ work schedule อยู่ใต้ `ecosystem-frontend-next-js/src/features/work-schedule/`; feature staff ใช้โฟลเดอร์ย่อย `api`, `components`, `hooks`, query keys และ React Query
- หน้าพนักงานที่เกี่ยวข้องอยู่ที่ `ecosystem-frontend-next-js/src/app/work-schedule/staff/[placeId]/` จึงควรเพิ่ม UI วันหยุดในบริบทสถานที่ทำงานของพนักงาน ไม่สร้างหน้าที่ไม่มีทางเข้าถึงจาก flow ปัจจุบัน

## 4. Business Logic หลัง Implement และเหตุผล

1. **ระบุตัวพนักงานอย่างปลอดภัย**: ทุก request ต้องยืนยันตัวตนผ่าน Clerk และ resolve ไปยัง Person/WorkScheduleStaff ที่เชื่อมบัญชีแล้วในสถานที่เป้าหมายด้วย service/access-control pattern ที่ repository ใช้อยู่ หากไม่มี staff link ที่ถูกต้องให้ปฏิเสธ
2. **สร้างวันหยุดเต็มวัน**: รับวันที่ปฏิทินและสร้างช่วงเวลา `[local midnight, next local midnight)` โดยใช้ timezone ของสถานที่ ไม่สมมติว่า 1 วันเท่ากับ 24 ชั่วโมง เพราะบาง timezone มี DST
3. **สร้างวันหยุดบางช่วงเวลา**: รับเวลาเริ่มต้นและสิ้นสุดที่มีความหมายชัดเจนใน timezone ของสถานที่ แปลงเป็น instant ที่ใช้เก็บในฐานข้อมูล ตรวจว่า start ก่อน end และปฏิเสธ input ที่ไม่ถูกต้อง
4. **ตรวจเวรทับซ้อนฝั่ง backend ก่อนบันทึก**: ค้นหา `WorkScheduleSlot` ของ staff เป้าหมายที่ `actualStartTime < leaveEnd` และ `actualEndTime > leaveStart`; หากพบอย่างน้อยหนึ่งรายการ ให้ตอบ error code/message ที่ frontend แสดงเหตุผลได้ และไม่สร้างรายการวันหยุด
5. **ป้องกัน race/ข้อมูลผิดพลาด**: การตรวจ overlap และสร้างรายการต้องทำใน transaction เมื่อทำได้ตามรูปแบบ Prisma ปัจจุบัน; ระบุข้อจำกัดหาก transaction ไม่สามารถป้องกันการเพิ่มเวรพร้อมกันได้อย่างสมบูรณ์ อย่าพึ่งพา validation ฝั่ง frontend อย่างเดียว
6. **ดูรายการ**: ส่งกลับเฉพาะรายการของ staff ที่ resolve จากผู้ใช้ปัจจุบันและสถานที่นั้น เรียงตามเวลาเริ่มต้น
7. **ลบรายการ**: อนุญาตเฉพาะรายการที่เป็นของ staff ปัจจุบันในสถานที่ที่ได้รับสิทธิ์ ใช้ soft delete เฉพาะเมื่อเป็น convention ของ feature ที่เลือกใช้และรองรับ query อย่างสม่ำเสมอ; มิฉะนั้นใช้วิธีที่สอดคล้องกับนโยบายข้อมูลเดิม พร้อมพิจารณา FK/ประวัติข้อมูล ห้ามเพิ่ม endpoint update
8. **ไม่มี approval workflow**: ไม่สร้างสถานะอนุมัติหรือปุ่มส่งคำขออนุมัติ รายการที่บันทึกผ่าน validation สำเร็จคือวันหยุดที่มีผลทันที
9. **UI**: มีตัวเลือกเต็มวัน/บางช่วงเวลา, แสดงรายการของตนเอง, แสดงเหตุผลเมื่อช่วงเวลาทับซ้อนเวร, ยืนยันก่อนลบ และไม่มี UI แก้ไขรายการเดิม

เหตุผลหลัก: ตรวจ business rule ที่ backend เพื่อป้องกันการข้าม UI, ใช้ timezone ของสถานที่เพื่อให้ความหมายของวันถูกต้อง, และจำกัดข้อมูลตามตัวตน/สถานที่เพื่อไม่ให้พนักงานจัดการข้อมูลของผู้อื่น

## 5. ไฟล์ที่คาดว่าจะสร้าง/แก้ไข

รายการนี้เป็นแผนสำหรับ Implementor ให้ตรวจ convention ของแต่ละโฟลเดอร์ก่อนสร้างไฟล์ และปรับชื่อย่อยให้ตรงกับรูปแบบที่มีอยู่จริง ห้ามสร้างไฟล์ซ้ำหากพบ implementation เดิมระหว่างทำงาน

### Backend — สร้าง

- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/holiday.module.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/holiday.controller.ts`
- command สำหรับ create และ delete ใน `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/`
- query สำหรับ list รายการของผู้ใช้ใน `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/queries/`
- DTO/validation และ unit tests ตาม convention ที่พบใน command/query ของ work-schedule
- Prisma migration ใหม่ใน `ecosystem-backend-nest-js/prisma/migrations/<timestamp>_add_work_schedule_holidays/migration.sql`

### Backend — แก้ไข

- `ecosystem-backend-nest-js/src/modules/work-schedule/work-schedule.module.ts`: import/register HolidayModule
- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`: เพิ่ม model สำหรับรายการวันหยุดและ relation/index ที่จำเป็น โดยตรวจ relation ฝั่งตรงข้ามและ naming convention ก่อน
- ถ้าการเพิ่ม relation ต้องแก้ schema ไฟล์อื่น ให้แก้เฉพาะไฟล์ที่จำเป็นและระบุไว้ใน commit/ผลสรุป
- error code enum/exception mapping เฉพาะเมื่อรูปแบบ error ที่มีอยู่ต้องเพิ่มรหัสสำหรับ overlap

### Frontend — สร้าง

- feature ภายใต้ `ecosystem-frontend-next-js/src/features/work-schedule/holiday/` ให้สอดคล้องกับรูปแบบ staff เช่น API functions, query keys/queries, mutations, hooks และ components
- component/form สำหรับสร้างวันหยุดและ list พร้อม delete confirmation; เพิ่ม unit/component test หาก repository มี test convention ที่เกี่ยวข้อง

### Frontend — แก้ไข

- `ecosystem-frontend-next-js/src/app/work-schedule/staff/[placeId]/client-page.tsx` หรือ component ที่หน้านี้ใช้อยู่จริง: เพิ่มส่วนจัดการวันหยุดโดยไม่ทำให้ flow ตารางเวรเดิมเสีย
- เพิ่ม route หรือ link เฉพาะเมื่อจำเป็นตามโครงสร้าง UI ที่ตรวจจาก client page จริง

### ไม่ควรแก้/ลบ

- ไม่แก้ข้อความต้นฉบับในหัวข้อ 1
- ไม่เพิ่ม approval status/workflow
- ไม่เพิ่ม endpoint สำหรับ update วันหยุด
- ไม่เปลี่ยนพฤติกรรมการสร้าง/ค้นหา/จัดเวรเดิมนอกเหนือจาก integration ที่จำเป็น

## 6. รายละเอียดการเปลี่ยนแปลงรายไฟล์

- **Prisma model**: เก็บอย่างน้อย ID, staff owner FK, start/end instant, createdAt และข้อมูลที่จำเป็นต่อการ audit; ใช้ชื่อ field/table ตาม convention ใน schema จริง เพิ่ม index ที่เหมาะกับการ query ช่วงเวลาของ staff และ relation แบบ Restrict หากสอดคล้องกับ schema ปัจจุบัน
- **Migration SQL**: สร้างตารางและ FK/index ให้ตรงกับ Prisma schema; ห้ามแก้ migration เก่าที่ apply ไปแล้ว ให้สร้าง migration ใหม่และตรวจ SQL ที่สร้างจริง
- **HolidayModule**: ลงทะเบียน controller และ CQRS handlers โดยใช้ pattern ของ SlotModule; ลงทะเบียน HolidayModule ใน WorkScheduleModule
- **Controller**: ใช้ ClerkAuthGuard และ ClerkUser pattern; มี create, list-my-holidays และ delete เท่านั้น ใช้ DTO ที่ validate param/body/query และไม่รับ staff owner identity จาก client เป็นแหล่งอำนาจ
- **Create command/handler**: resolve current user → Person → staff link/place ผ่านกลไกที่มีอยู่, validate time range/type, query assigned slots for overlap, reject with actionable reason if overlap, then persist in transaction where practical
- **List query/handler**: ตรวจสิทธิ์สถานที่และ scope ตาม staff ปัจจุบัน; ห้ามคืนรายการของ staff อื่น
- **Delete command/handler**: ตรวจ ownership ในเงื่อนไข database query เดียวกันกับ ID; ID ที่ไม่มีอยู่หรือไม่ใช่ของผู้ใช้ต้องไม่เปิดเผยข้อมูลเจ้าของ และต้องไม่สามารถลบข้ามคน
- **Frontend API/query/mutation**: ใช้ API client, token retrieval, React Query invalidation และ error mapping แบบเดียวกับ feature staff ที่มีอยู่ ไม่เรียก fetch แบบแยก convention
- **Form/component**: แสดง field ตามประเภทเต็มวัน/บางช่วงเวลา; validate เบื้องต้น; แสดง backend overlap reason; disable submit ระหว่าง mutation; หลังสร้าง/ลบสำเร็จ invalidate query และอัปเดตรายการ
- **Staff client page**: ตรวจไฟล์จริงก่อนแทรก component และรักษา loading/error/auth patterns ที่มีอยู่

## 7. Acceptance Criteria

- [ ] ผู้ใช้ที่ล็อกอินและเชื่อมบัญชีกับ staff ถูกต้องสร้างวันหยุดเต็มวันได้
- [ ] วันหยุดเต็มวันคำนวณจาก timezone ของสถานที่ทำงาน ไม่ใช่ timezone ของ browser/server โดยปริยาย
- [ ] ผู้ใช้สร้างวันหยุดบางช่วงเวลาได้ และระบบปฏิเสธช่วงที่ start >= end
- [ ] เมื่อวันหยุดคาบเกี่ยวกับ `WorkScheduleSlot` ของ staff ระบบปฏิเสธการบันทึกและส่งข้อความ/error code ที่อธิบายว่าเวลาชนกับเวร; ไม่มี record ใหม่ถูกสร้าง
- [ ] ช่วงที่ไม่ทับซ้อนเวรบันทึกสำเร็จและมีผลทันที โดยไม่ต้องอนุมัติ
- [ ] พนักงานเห็นเฉพาะรายการวันหยุดของตนในสถานที่ที่เกี่ยวข้อง
- [ ] พนักงานลบรายการของตนเองได้ และลบรายการของผู้อื่นไม่ได้
- [ ] ไม่มี UI/API สำหรับแก้ไขรายการเดิม
- [ ] การตรวจสิทธิ์ทำที่ backend ไม่ได้อาศัยการซ่อนปุ่มใน frontend
- [ ] migration ใหม่ตรงกับ Prisma schema; Prisma validate/generate ผ่าน
- [ ] เพิ่ม tests สำหรับเต็มวัน/timezone, partial range validation, overlap, authorization/ownership, create/list/delete และ error response
- [ ] typecheck/lint/test/build ของ package ที่เกี่ยวข้องผ่าน และ regression ของ feature work-schedule เดิมไม่เสีย

## 8. ความเสี่ยงและข้อควรระวัง

- **Identity mapping**: `WorkScheduleStaff.personId` เป็น nullable; ห้ามสมมติว่า Clerk ID เท่ากับ Person ID และห้ามเปิดให้ส่ง staffId เองเพื่อข้าม ownership checks
- **Timezone**: ใช้ IANA timezone ของสถานที่; ระวังวัน DST ที่มี 23/25 ชั่วโมง และอย่าตีความวันที่เต็มวันเป็น UTC midnight โดยไม่แปลง
- **Overlap semantics**: ใช้ช่วงแบบ half-open `[start, end)`; เวรที่สิ้นสุดตรงกับเวลาเริ่มวันหยุดไม่ถือว่าทับซ้อน แต่เวลาที่คาบเกี่ยวกันจริงต้องถูกบล็อก
- **Concurrent writes**: เวรอาจถูกสร้างพร้อมกับวันหยุดหลังจากการตรวจ overlap; ระบุและทดสอบกลยุทธ์ลด race ตาม transaction/locking capabilities ของฐานข้อมูลและ Prisma ที่ใช้อยู่
- **Existing schedule behavior**: อย่าเปลี่ยนการ query slot หรือการจัดเวรเดิมโดยไม่จำเป็น; หากการสร้างเวรในอนาคตต้องปฏิเสธช่วงที่มีวันหยุดด้วย ให้เพิ่มเป็น integration ที่ชัดเจนและทดสอบทั้งสองทิศทาง ไม่ถือว่าเงื่อนไขนี้เกิดขึ้นเองจากการตรวจวันหยุดตอนสร้าง
- **Data retention**: ตรวจ convention เรื่อง soft delete/audit และ FK ก่อนเลือกวิธีลบ
- **Error UX**: อย่าแสดงเพียง “เกิดข้อผิดพลาด”; frontend ต้อง map error overlap เป็นเหตุผลที่ใช้งานได้
- **Migration**: ห้ามแก้ migration ที่มีอยู่แล้ว ให้เพิ่ม migration ใหม่เท่านั้น

## 9. การทดสอบและคำสั่งตรวจสอบ

จาก root repository ใช้ pnpm ตาม package scripts ที่มี:

1. `pnpm --filter ecosystem-backend-nest-js prisma:validate` (หรือคำสั่งที่ตรงกับชื่อ package จริงใน package.json)
2. `pnpm --filter ecosystem-backend-nest-js prisma:generate`
3. `pnpm --filter ecosystem-backend-nest-js typecheck`
4. `pnpm --filter ecosystem-backend-nest-js lint:check`
5. `pnpm --filter ecosystem-backend-nest-js test -- --runInBand` หรือ syntax ที่ package manager/Jest config รองรับ
6. `pnpm --filter ecosystem-frontend-next-js typecheck`
7. `pnpm --filter ecosystem-frontend-next-js lint`
8. `pnpm --filter ecosystem-frontend-next-js build`
9. รัน root `pnpm verify` เมื่อ environment และ dependencies พร้อม
10. ทดสอบ integration ด้วยกรณี: วันเต็มที่มีเวรทับซ้อน, วันเต็มที่ไม่มีเวร, partial overlap, adjacent boundary, invalid range, timezone ของสถานที่ต่างจาก UTC, staff ที่ยังไม่ link person, user อื่นพยายาม list/delete, และการลบรายการของตนเอง

หมายเหตุ: คำสั่งเป็นรายการตรวจสอบสำหรับ Implementor ยังไม่ได้รันในขั้นตอนจัดทำแผนนี้ ต้องรายงานผลจริงแยกจากรายการที่วางแผนไว้
