# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

admin สามารถ ลบ / แก้ไข slot

## 2. ขอบเขตและแหล่งข้อมูลที่ตรวจสอบ

แผนนี้อ้างอิงไฟล์จริงบน GitHub branch **main** ณ commit **cdd67e10f338c65aa6a7c4c12f4dbc4be596d221** เพราะ environment ที่ทำงานไม่มี working copy ของ repository จึงไม่สามารถอ่านหรือแก้ไฟล์ local ได้

เป้าหมายคือ Slot ที่สร้างไว้เป็นเวรจริงในตาราง **WorkScheduleSlot** เท่านั้น ไม่ใช่ Slot Template หรือ Slot Type โดยให้ผู้ดูแล Work-Schedule ของ Position ที่เกี่ยวข้องสามารถเปิดรายการเวร แก้ไขข้อมูล และลบรายการเวรได้ผ่านหน้ารายละเอียดที่ Board ลิงก์ไปอยู่แล้ว

ไม่อยู่ในขอบเขต: แก้ flow สร้างเวรเดิม, เพิ่ม/เปลี่ยนกฎ Min/Max, แก้วันหยุด, แก้ Slot Template/Slot Type, แก้ schema หรือทำ data migration, เพิ่ม audit/history, เพิ่มการแก้ไข note ซึ่ง UI ปัจจุบันไม่ได้เปิดให้จัดการ

## 3. Business Logic ก่อนเริ่ม

### 3.1 Slot ปัจจุบัน

ยืนยันจาก **ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma** ว่า **WorkScheduleSlot** มีข้อมูลหลักดังนี้

- **id**: รหัส Slot
- **positionId**: Position ของเวร
- **staffId**: พนักงานที่ได้รับเวร โดยสัมพันธ์กับ **WorkScheduleStaffPosition**
- **slotTypeId**: ประเภทกะ
- **note**: nullable แต่หน้าสร้างและ Board ปัจจุบันไม่ได้ใช้เป็นช่องแก้ไข
- **actualStartTime** และ **actualEndTime**: เวลาเริ่มและสิ้นสุดจริงแบบ timestamptz

Model นี้ไม่มี **deletedAt** จึงไม่มีสถานะ soft delete สำหรับ Slot ใน schema ปัจจุบัน การลบในงานนี้จึงใช้การลบ record จริง ไม่เพิ่ม migration เพื่อสร้าง soft-delete โดยไม่มีข้อกำหนดรองรับ

### 3.2 สิทธิ์และ API ปัจจุบัน

ไฟล์ **ecosystem-backend-nest-js/src/common/access-control/access-control.service.ts** มี **verifyWorkSchedulePositionByWorkScheduleAdmin** ซึ่งตรวจว่า Position มีอยู่และไม่ได้ถูกลบ รวมถึง Place ที่เป็นเจ้าของ และตรวจว่าผู้เรียกเป็น Admin ที่ active ของ Place นั้น ต้องเรียกตรวจนี้ในทุก API ใหม่ที่อ่าน/แก้ไข/ลบ Slot ห้ามพึ่งการซ่อนปุ่มฝั่ง frontend แทนการตรวจสิทธิ์ server

ไฟล์ **ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts** มี endpoint สำหรับสร้างหลาย Slot และอ่าน Slot ตาม Position/ช่วงเวลา รวมถึง query ของ Staff แต่ยังไม่มี endpoint สำหรับอ่าน Slot เดี่ยว แก้ไข หรือ ลบ

ไฟล์ **ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.module.ts** ลงทะเบียน CQRS command/query handlers ที่ใช้กับ controller ต้องลงทะเบียน handler ใหม่ใน module นี้ด้วย

### 3.3 กฎการสร้างเวรที่ต้องรักษา

ตรวจจาก **ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/create-many.handler.ts** และ **create-many.handler.spec.ts**:

1. ผู้เรียกต้องเป็น Admin ของ Position
2. Staff ที่ส่งมาต้องมีความสัมพันธ์กับ Position และ **WorkScheduleStaffPosition.deletedAt** ต้องเป็น **null**
3. ช่วงเวลาเริ่มต้องก่อนเวลาสิ้นสุด
4. เวรของ Staff คนเดียวกันห้ามทับซ้อนกัน โดยใช้เงื่อนไขช่วงเวลาที่ทับซ้อนคือ **newStart < existingEnd && newEnd > existingStart** ดังนั้นเวรที่จบตรงกับเวลาเริ่มของอีกเวรถือว่าไม่ทับซ้อน
5. ห้ามสร้างเวรทับช่วงวันหยุดของ Staff โดยคืน error code **WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP** และ HTTP 409
6. ตรวจค่า **max** ของ **WorkScheduleMinMax** ด้วย sweep-line จากเวรเดิมและเวรใหม่ของ Position เดียวกัน ปฏิเสธเมื่อจำนวนคนทำงานมากกว่า max; โค้ดสร้างเวรปัจจุบันไม่ได้ตรวจค่า min ห้ามเพิ่มข้อกำหนด min ในงานนี้
7. การสร้างทำใน transaction ระดับ Serializable พร้อม lock แถว Position และ retry เมื่อ Prisma ส่ง error **P2034**
8. ตรวจทั้ง payload ก่อน insert และบันทึก batch แบบ all-or-none

การแก้ไขต้องตรวจเงื่อนไขที่เกี่ยวข้องกับ Slot ใหม่เช่นเดียวกัน โดยยกเว้น Slot เดิมที่กำลังแก้จากชุดข้อมูลเปรียบเทียบ เพื่อไม่ให้เกิด false conflict กับตัวเอง ส่วนกฎสร้างเวรเดิมต้องไม่เปลี่ยนความหมาย

### 3.4 Frontend ปัจจุบัน

- **ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board.tsx** แสดง Slot และสร้างลิงก์ไป **/work-schedule/admin/{placeId}/position/{positionId}/slot/{slot.id}**
- ตรวจ tree ของ branch **main** แล้วไม่พบ route **slot/[slotId]** ดังกล่าว จึงต้องสร้างหน้าให้ตรงกับลิงก์ที่มีอยู่ ไม่เปลี่ยน URL ของ Board โดยไม่จำเป็น
- หน้า Board ใน **.../slot/client-page.tsx** อ่าน Place/Timezone, StaffPosition และ Slot ตามช่วงเวลา โดยใช้ React Query
- feature API/hook/query/key สำหรับ Slot อยู่ใต้ **ecosystem-frontend-next-js/src/features/work-schedule/slot/**
- **workScheduleSlotKeys.listsByPositionId(userId, positionId)** เป็น prefix ของ query รายการ Slot ตาม Position ควร invalidate prefix นี้หลังแก้ไข/ลบเพื่อให้ Board ทุกช่วงเวลาที่ cache ไว้โหลดข้อมูลใหม่
- **ecosystem-frontend-next-js/src/features/work-schedule/holiday/components/holiday-list.tsx** เป็นตัวอย่างปัจจุบันสำหรับยืนยันการลบ, disable ระหว่าง mutation และแสดง toast

## 4. Business Logic ที่คาดหวังหลัง Implement

### 4.1 API contract

เพิ่ม API ใต้ controller เดิมโดยใช้ path ที่ไม่ชนกับ route ปัจจุบัน:

- **GET /api/work-schedule/slot/positions/:position_id/slots/:slot_id**: อ่าน Slot เดี่ยวสำหรับหน้าแก้ไข
- **PATCH /api/work-schedule/slot/positions/:position_id/slots/:slot_id**: แก้ไข Slot
- **DELETE /api/work-schedule/slot/positions/:position_id/slots/:slot_id**: ลบ Slot และตอบ HTTP 204 เมื่อสำเร็จ

อย่าใช้ route รูปแบบ **/:position_id/:slot_id** เพราะอาจชนกับเส้นทางอ่านข้อมูลแบบเดิมที่มีส่วน path คล้ายกัน

รายละเอียดของ Slot ที่ GET ต้องคืนอย่างน้อย: **id**, **staffId**, **staffName**, **slotTypeId**, **slotTypeName**, **actualStartTime**, **actualEndTime** โดยส่งเวลาเป็น ISO string ใน UTC ให้รูปแบบสอดคล้องกับ response ของ query ปัจจุบัน

PATCH รับ JSON fields เดียวกับข้อมูล Slot รายการเดียวใน create API: **staff_id**, **slot_type_id**, **actual_start_time**, **actual_end_time** โดยเวลาเป็น ISO 8601 ที่ระบุ offset และเวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด อัปเดตเฉพาะ 4 fields นี้ ห้ามเปลี่ยน **id**, **positionId** หรือ **note**

ใช้ error code ใหม่ **WORK_SCHEDULE_SLOT_NOT_FOUND** สำหรับ Slot ที่ไม่มีอยู่หรือไม่ได้เป็นของ Position ใน path ตอบ HTTP 404 โดยข้อความไม่เปิดเผยว่ามี Slot อยู่ใน Position อื่นหรือไม่ เพิ่มข้อความของ error code นี้ใน **ecosystem-frontend-next-js/src/constants/error-messages.ts** ซึ่งเป็น **Record<ErrorCode, string>**

ทุก API ต้องเรียก **verifyWorkSchedulePositionByWorkScheduleAdmin** ก่อนดำเนินการ และทุกการอ่าน/แก้ไข/ลบ Slot ต้องระบุทั้ง **slot_id** และ **position_id** ในเงื่อนไขฐานข้อมูล ห้ามอนุญาตให้ Admin ของ Position หนึ่งเข้าถึง Slot ของอีก Position โดยอาศัยการรู้ ID เท่านั้น

### 4.2 Update

ก่อนบันทึกต้องตรวจสอบว่า Slot เดิมตรงกับทั้ง **slot_id** และ **position_id**; Staff ใหม่ผูกกับ Position นี้และความสัมพันธ์ยัง active; Slot Type ที่เลือกเป็นประเภทกะของ Position นี้และไม่ได้ถูก soft-delete; และข้อมูลวันเวลาไม่ผิดรูปแบบ

การตรวจ overlap, วันหยุด และค่า max ต้องทำภายใน transaction แบบ Serializable ซึ่งล็อก Position เหมือน create handler ที่มีอยู่ โดย:
- หาเวรเดิมที่ชนกับ Staff ใหม่หรือ Position นี้ในช่วงเวลาใหม่
- ตัด Slot ID ที่กำลังแก้ไขออกจากชุดเวรเดิมเสมอ
- ตรวจเวรใหม่กับเวรเดิมที่เหลือและปฏิเสธช่วงเวลาที่ Staff คนเดียวกันทับซ้อน
- ตรวจวันหยุดของ Staff ใหม่ด้วยกฎ overlap เดิม และใช้ **WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP** / HTTP 409 เมื่อชน
- ตรวจ max โดยนับเวรเดิมของ Position ที่ไม่ใช่ Slot ที่กำลังแก้รวมกับค่าของ Slot หลังแก้เพียงครั้งเดียว ห้ามนับ Slot เดิมซ้ำ
- ใช้ retry สำหรับ Prisma **P2034** ให้สอดคล้องกับ create handler; อย่า retry validation/business errors

เมื่อ update ผ่านให้คืนข้อมูล Slot ที่อัปเดตแล้วตาม response ของ GET ข้างต้น ไม่ทำการลบแล้วสร้างใหม่ เพราะจะเปลี่ยน identity ของ Slot และทำให้ลิงก์/การอ้างอิงเดิมเสีย

### 4.3 Delete

ลบได้ต่อเมื่อ Admin ผ่านการตรวจสิทธิ์และพบ record ที่ตรงทั้ง Slot ID และ Position ID เท่านั้น ถ้าไม่พบให้ตอบ **WORK_SCHEDULE_SLOT_NOT_FOUND** / HTTP 404 หากลบสำเร็จให้ตอบ 204 โดยตั้ง `@HttpCode(HttpStatus.NO_CONTENT)` บน DELETE controller method อย่างชัดเจน (NestJS ไม่ได้ใช้ 204 เป็นค่าเริ่มต้นของ DELETE โดยอัตโนมัติ) และห้ามคืน response body เมื่อสำเร็จ

หน้าเว็บต้องมีการยืนยันก่อนลบ และมีปุ่มยกเลิกที่ไม่เรียก API ระหว่างลบให้ disable การยืนยันซ้ำ เมื่อสำเร็จให้แสดง toast, invalidate query list ของ Position และกลับไปหน้า Board

### 4.4 หน้าแก้ไข

เพิ่ม route ให้ตรงกับลิงก์ที่ Board สร้างไว้ ป้อนค่าปัจจุบันในฟอร์มและให้แก้ได้เฉพาะ Staff, Slot Type, เวลาเริ่ม และเวลาสิ้นสุด ห้ามแก้ Position ผ่านฟอร์ม เนื่องจาก Position เป็นส่วนหนึ่งของ identity/ขอบเขตสิทธิ์ของ URL

ใช้ข้อมูล Place เพื่อแสดงและ parse เวลาใน timezone ของ Place ไม่ใช่ timezone ของ browser โดยแปลงค่าที่ส่ง API เป็น ISO datetime ที่มี offset/UTC อย่างถูกต้อง ใช้รายชื่อ StaffPosition และ Slot Type ของ Position ปัจจุบันเป็นตัวเลือก หาก `staffId` หรือ `slotTypeId` ปัจจุบันไม่มีในรายการ active (เช่น relation หรือ Slot Type ถูก soft-delete แต่ Slot ยังอยู่) ต้องยังแสดงค่าปัจจุบันจาก GET อย่างชัดเจนในตัวเลือกที่ระบุว่าไม่ active ห้ามปล่อย select ว่างหรือแทนค่าด้วยตัวเลือกแรกแบบเงียบ ๆ ตาม validation ที่กำหนดไว้ ผู้ใช้ต้องเลือก StaffPosition และ Slot Type ที่ active ก่อนบันทึกได้ แต่ต้องยังลบ Slot ดังกล่าวได้

เมื่อ update สำเร็จแสดง toast และ invalidate query รายการ Slot ของ Position รวมทั้ง query รายละเอียด Slot; เมื่อผิดพลาดให้คงค่าที่ผู้ใช้กรอกไว้และแสดงข้อผิดพลาดให้ลองใหม่ได้ ห้ามทำ optimistic update ที่ทำให้ Slot ดูเหมือนบันทึกสำเร็จก่อน server ยืนยัน

## 5. ไฟล์ที่คาดหวังหลัง Implement

### 5.1 Backend — สร้าง

- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/update-slot.command.ts**
- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/update-slot.handler.ts**
- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/update-slot.handler.spec.ts**
- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/delete-slot.command.ts**
- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/delete-slot.handler.ts**
- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/delete-slot.handler.spec.ts**
- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slot-by-id.query.ts**
- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slot-by-id.handler.ts**
- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slot-by-id.handler.spec.ts**

### 5.2 Frontend — สร้าง

- **ecosystem-frontend-next-js/src/features/work-schedule/slot/api/queries/get-slot-by-id.api.ts**
- **ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/update-slot.api.ts**
- **ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/delete-slot.api.ts**
- **ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-update-slot.ts**
- **ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-delete-slot.ts**
- **ecosystem-frontend-next-js/src/features/work-schedule/slot/components/edit-slot-form.tsx**
- **ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/[slotId]/page.tsx**
- **ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/[slotId]/client-page.tsx**
- **ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/[slotId]/loading.tsx**
- **ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/[slotId]/error.tsx**
- **ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/[slotId]/error-code-redirect-list.ts**
- **ecosystem-frontend-next-js/tests/work-schedule/admin-slot-edit-delete.test.tsx**

หากรูปแบบ error/loading ของ route เดิมเปลี่ยนไป ให้ยึด convention ของ sibling routes ภายใต้ **ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/** แต่อย่าสร้าง abstraction กลางใหม่โดยไม่จำเป็น

### 5.3 ไฟล์เดิม — แก้ไข

- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts**: ลงทะเบียน GET/PATCH/DELETE ใหม่และ DTO/Command/Query ที่เกี่ยวข้อง ใช้ auth guard เดิม
- **ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.module.ts**: register query/command handlers ใหม่
- **ecosystem-backend-nest-js/src/common/exceptions/error-codes.enum.ts**: เพิ่ม **WORK_SCHEDULE_SLOT_NOT_FOUND**
- **ecosystem-frontend-next-js/src/constants/error-messages.ts**: เพิ่มข้อความ error code ให้ครบกับ enum
- **ecosystem-frontend-next-js/src/features/work-schedule/slot/work-schedule-slot-keys.ts**: เพิ่ม query key สำหรับ Slot เดี่ยว โดยคง key format เดิม
- **ecosystem-frontend-next-js/src/features/work-schedule/slot/work-schedule-slot.queries.ts**: เพิ่ม query option สำหรับ Slot เดี่ยว
- ไฟล์ frontend route ใหม่ด้านบนใช้ redirect mapping เพื่อพา error Slot not found กลับไป Board และจัดการ error ด้านสิทธิ์ตาม convention เดิม



### 5.4 ไฟล์ที่ไม่ควรเปลี่ยน

- ไม่แก้ schema หรือสร้าง Prisma migration เพราะ field ปัจจุบันเพียงพอสำหรับ update/delete และไม่มี soft-delete field ของ Slot
- ไม่เปลี่ยน **create-many.command.ts** / **create-many.handler.ts** เว้นแต่จำเป็นจริง ๆ สำหรับการแชร์ validator; หากแชร์โค้ด ต้องมี regression tests ยืนยันว่ากฎการสร้างเดิมไม่เปลี่ยน และห้ามเปลี่ยน response/error semantics เดิม
- ไม่เปลี่ยน Board URL, Slot Template, Slot Type, Holiday APIs, Staff APIs หรือ Min/Max APIs
- ไม่ลบไฟล์ที่มีอยู่

## 6. ขั้นตอนทำงานและเกณฑ์ยอมรับ

### ขั้นที่ 1 — DTO, query และ authorization

สร้าง DTO สำหรับ Slot ID/Position ID และ request update โดยยึด Zod conventions ที่ใช้อยู่ ตรวจ UUID ตาม format เดิม (UUID v7) และ ISO datetime ที่มี offset พร้อม refine ให้ start < end

**ผ่านเมื่อ**
- DTO ปฏิเสธ ID/วันที่ที่ผิดรูปแบบ, end <= start และข้อมูลจำเป็นที่หายไป
- GET detail ตรวจ admin access ก่อน และคืนเฉพาะ Slot ที่ตรงทั้ง slot ID และ position ID
- ID ที่ไม่มีอยู่หรืออยู่คนละ Position ตอบ 404 error code เดียวกัน
- endpoint เดิมทั้ง create-many และ query ตามช่วงเวลายังมี path/contract เดิม

### ขั้นที่ 2 — Update business logic และ tests

สร้าง command/handler สำหรับ update โดยตรวจ staff-position, slot type, overlap, holiday และ max ตามข้อ 4.2; ทำ validation และ update ใน transaction ที่รักษา concurrency safety

**ผ่านเมื่อ**
- เปลี่ยน Staff/Slot Type/เวลาได้ครบทุก field ใน contract และเปลี่ยนเฉพาะ field ที่อนุญาต
- ไม่สามารถแก้ Slot ข้าม Position หรือทำรายการโดยไม่ใช่ Admin ได้
- update Slot โดยไม่เปลี่ยน ID หรือ note
- ไม่ตรวจพบ overlap ปลอมกับ Slot ตัวเอง
- overlap กับเวรอื่นของ Staff คนเดียวกันถูกปฏิเสธ; กรณีช่วงเวลาชนขอบพอดียังผ่านตามกฎ half-open เดิม
- overlap กับ holiday ถูกปฏิเสธด้วย code/status เดิม
- กรณีทำให้จำนวนคนของ Position เกิน max ถูกปฏิเสธ; การคำนวณไม่นับ Slot เดิมซ้ำ
- มี tests สำหรับ Serializable transaction, lock/retry P2034 และไม่มีการ retry business-validation error
- test เดิมของ create-many ผ่านโดยไม่มีการแก้ expected behavior

### ขั้นที่ 3 — Delete business logic และ tests

สร้าง command/handler สำหรับลบ โดยใช้ access control และ delete แบบ scope ด้วย Slot ID + Position ID

**ผ่านเมื่อ**
- Admin ลบ Slot ของ Position ตัวเองได้และได้ HTTP 204
- Slot ที่ไม่มีหรืออยู่คนละ Position ถูกตอบ 404 code เดียวกัน
- ผู้ที่ไม่มีสิทธิ์ Admin ไม่สามารถลบได้
- handler ใช้ query ที่จำกัดทั้ง ID และ Position ID; ไม่มีการลบด้วย slot ID เดี่ยว ๆ
- unit tests mock Prisma และไม่เชื่อม database จริง

### ขั้นที่ 4 — Frontend query, mutations และหน้าแก้ไข/ลบ

เพิ่ม API/hook/query-key และ route รายละเอียดตามไฟล์ในข้อ 5; ใช้รูปแบบ authentication token และ React Query ที่ feature ปัจจุบันใช้อยู่

**ผ่านเมื่อ**
- คลิก Slot บน Board เปิด route **/work-schedule/admin/{placeId}/position/{positionId}/slot/{slotId}** ได้
- ฟอร์มแสดง Staff, Slot Type, เวลาเริ่ม และเวลาสิ้นสุดของ Slot ที่เลือกอย่างถูกต้อง และแสดง/แปลงเวลาตาม timezone ของ Place
- หาก StaffPosition หรือ Slot Type ที่ผูกกับ Slot ปัจจุบันไม่อยู่ในรายการ active ฟอร์มยังแสดงค่าปัจจุบันและระบุว่าไม่ active อย่างชัดเจน ไม่แทนค่าด้วยตัวเลือกอื่นโดยเงียบ ๆ และจะบันทึกได้ต่อเมื่อเลือกค่าที่ active ตาม validation; การลบยังใช้งานได้
- บันทึกส่งข้อมูลรูปแบบ API ที่ถูกต้อง พร้อมเวลา ISO ที่มี offset/UTC ตาม contract
- ระหว่าง update/delete มี pending state ป้องกันการส่งซ้ำ
- update สำเร็จแสดง toast และ invalidate query detail/list ที่เกี่ยวข้อง
- update ล้มเหลวไม่แสดงว่าบันทึกสำเร็จ และคงข้อมูลที่ผู้ใช้กรอกเพื่อ retry
- การลบต้องมี confirm/cancel; cancel ไม่ส่ง request, confirm ส่งเพียงครั้งเดียว; delete สำเร็จแจ้งผล, invalidate Slot list ของ Position และกลับ Board
- error slot not found กลับไป Board; error authentication/authorization ยังคงใช้ redirect convention ของ Work-Schedule
- test UI ครอบคลุม prefill, timezone conversion, update success/failure, delete confirm/cancel/success และ pending state

### ขั้นที่ 5 — Regression และ verification

**ผ่านเมื่อ**
- frontend tests ที่เกี่ยวกับ Slot, Holiday, date-range และการสร้างเวรผ่านทั้งหมด
- backend tests ของ slot ทั้งหมดผ่าน
- typecheck, lint และ build ของ backend/frontend ผ่าน
- root **pnpm run verify** ผ่านใน environment ที่ติดตั้ง dependencies แล้ว
- GitHub Actions CI หลัง commit ของ Implementor สำเร็จ
- ถ้าคำสั่งใดรันไม่ได้หรือพึ่งพา environment/DB ภายนอก ต้องรายงานคำสั่งและ error จริง ห้ามกล่าวว่า test ผ่านโดยไม่มีผลรัน

## 7. Test ที่ต้องเพิ่ม/รัน

### Backend

เพิ่ม unit tests ใน spec ที่กำหนด โดย mock Prisma และ AccessControlService:
- DTO validation: UUID v7, ISO datetime พร้อม offset, start < end
- GET detail: access control, response mapping, not found, Slot อยู่คนละ Position
- Update: valid update, missing/wrong-position Slot, unauthorized admin, staff ไม่ได้ผูก Position, Slot Type ไม่อยู่ใน Position/ถูกลบ, overlap กับ slot/holiday, touching boundaries, max exceeded, Slot ตัวเองไม่ก่อ conflict, field ที่ไม่อนุญาตคงเดิม, transaction/retry
- Delete: success, not found/wrong-position, unauthorized admin และ where clause ที่ระบุทั้ง slot ID กับ position ID
- Regression ของ create-many: overlap/holiday/max และ retry semantics เดิม

คำสั่งรันจาก root repository:

    pnpm --dir ecosystem-backend-nest-js exec jest --runInBand modules/work-schedule/slot

จากนั้นรัน backend test ทั้งชุดด้วย **pnpm run test:backend**

### Frontend

เพิ่ม **tests/work-schedule/admin-slot-edit-delete.test.tsx** โดยใช้รูปแบบ mocks ที่มีอยู่ใน tests ปัจจุบัน:
- แสดงค่าจาก query เดี่ยวและฟอร์มตาม timezone ของ Place
- current StaffPosition/Slot Type ที่ไม่อยู่ในรายการ active ยังแสดงเป็นค่าปัจจุบันที่ระบุสถานะไม่ active; ไม่มีการแทนค่าเงียบ ๆ และต้องเลือกค่าที่ active ก่อน update
- validate ช่วงเวลาไม่ถูกต้องก่อนส่ง request
- update สำเร็จเรียก API ด้วย ID/fields ถูกต้อง แสดงผลสำเร็จ และ invalidate query
- update ล้มเหลวคงฟอร์มและแสดง error
- delete ต้องยืนยันก่อน, cancel ไม่เรียก API, confirm เรียกครั้งเดียว, disable ระหว่าง pending และกลับ Board เมื่อสำเร็จ
- error not-found/authorization ใช้ redirect behavior ที่กำหนด

คำสั่งรันจาก root repository:

    pnpm --dir ecosystem-frontend-next-js exec jest --runInBand tests/work-schedule

จากนั้นรัน frontend test ทั้งชุดด้วย **pnpm run test:frontend**

### Verification รวม

รันตาม scripts ที่กำหนดใน root **package.json**:

    pnpm install --frozen-lockfile
    pnpm run typecheck:backend
    pnpm run typecheck:frontend
    pnpm run lint:backend
    pnpm run lint:frontend
    pnpm run build:backend
    pnpm run build:frontend
    pnpm run verify

**pnpm run verify** เป็น pre-commit verification มาตรฐานของ repository และมี test, Prisma validate/generate, typecheck, lint, build และ migration tests โดยไม่รวม e2e ตาม **AGENTS.md**; ไม่ต้องใช้ production/shared DB หรือ **prisma db push**

## 8. สิ่งที่ Implementor ต้องระวัง

1. ห้ามให้ frontend เป็นด่านเดียวของ authorization; GET/PATCH/DELETE ต้องตรวจ Admin ใน backend ทุกครั้ง
2. ห้ามยอมรับ Slot ID ที่อยู่คนละ Position แม้ผู้เรียกมีสิทธิ์ Admin ของ Position ที่ใส่ใน URL
3. ขณะ update ต้อง exclude record ปัจจุบันจาก overlap/max calculation และนับค่าใหม่เพียงครั้งเดียว
4. ใช้ interval overlap แบบเดิม ไม่เปลี่ยนการตัดสินช่วงที่แตะขอบเวลา
5. ต้องรักษา Serializable transaction/position lock/retry สำหรับป้องกัน concurrent update ทำให้กฎ overlap/max ถูกข้าม
6. ใช้ timezone ของ Place ในการแสดง/แก้เวลา ไม่ parse local datetime โดยพึ่ง timezone ของเครื่องผู้ใช้
7. ห้ามแอบเพิ่มกฎ min, ลบ Slot อัตโนมัติเมื่อเปลี่ยน Staff/Position, ปรับวันหยุด หรือแก้ create-many ให้เปลี่ยน behavior ใน task เดียวกัน
8. ไม่เพิ่ม soft-delete หรือ migration เพราะ schema ไม่มี field รองรับและ scope นี้กำหนดให้ลบ record จริงตาม schema ปัจจุบัน
9. **note** ยังไม่อยู่ใน form/response สำหรับ Board: อย่าเคลียร์หรือเขียนทับ note ระหว่าง update
10. ใช้ error code ใหม่ที่ frontend แสดงข้อความได้ครบ เพราะ **API_ERROR_MESSAGES** เป็น Record ที่ต้องครอบคลุม ErrorCode enum
11. สร้าง tests ด้วย mock; ห้ามเรียกฐานข้อมูลจริง และห้ามรันคำสั่งที่ทำลาย/รีเซ็ตข้อมูล
12. ห้ามแก้ไฟล์ที่ไม่อยู่ในรายการหรือเปลี่ยน flow อื่น เว้นแต่มี compile/test failure ที่พิสูจน์ได้ว่าเกิดจากงานนี้และอธิบายเหตุผลในรายงาน
