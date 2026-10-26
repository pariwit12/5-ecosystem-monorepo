# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

admin สามารถเข้าไปจัดการ min/max (แก้ไข/ลบ)

## 2. เป้าหมายและขอบเขต

เพิ่มความสามารถให้ผู้ดูแล Work Schedule เปิดรายการ min/max ที่มีอยู่ แล้วแก้ไขหรือลบได้ โดยใช้หน้ารายละเอียดตามลิงก์ที่มีอยู่แล้วในหน้ารายการ ไม่เปลี่ยน flow สร้างรายการเดิม และไม่เปลี่ยนกฎการจัดตารางเวร/วันหยุดที่ใช้ min/max อยู่

ขอบเขตคือ feature `work-schedule/min-max` ใน backend NestJS และ frontend Next.js เท่านั้น ไม่ต้องแก้ Prisma schema หรือสร้าง migration เพราะ model ปัจจุบันมี field ที่ต้องใช้ครบแล้ว

## 3. Business Logic และโค้ดก่อนเริ่ม (ตรวจจาก branch `main`)

### 3.1 Business Logic ปัจจุบัน

- `WorkScheduleMinMax` เก็บ `id`, `workSchedulePositionId`, `min`, `max`, `startTime`, `endTime`; `min` และ `max` เป็น nullable integer และ model ไม่มี `deletedAt`
- การสร้างรายการบังคับให้ระบุ `min` หรือ `max` อย่างน้อยหนึ่งค่า แต่ละค่าถ้าระบุต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป และห้าม `min > max` เมื่อระบุทั้งคู่ เวลาเป็น ISO 8601 ที่มี timezone และต้อง `start_time < end_time`
- รายการ min/max ภายใต้ตำแหน่งงานเดียวกันห้ามมีช่วงเวลาทับซ้อน การตรวจปัจจุบันใช้เงื่อนไข `existing.startTime < new.endTime && existing.endTime > new.startTime`; ช่วงที่ต่อกันพอดีจึงไม่ถือว่าทับซ้อน
- การสร้างล็อกแถว `work_schedule_position` ด้วย `SELECT ... FOR UPDATE` ภายใน transaction ก่อนตรวจช่วงเวลาทับซ้อน เพื่อป้องกัน race กับการสร้างรายการพร้อมกัน
- ทั้ง API สร้างและค้นหารายการตรวจสิทธิ์ด้วย `AccessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin`
- หน้ารายการ min/max แสดงข้อมูลตามช่วงเวลาที่ผู้ใช้เลือก และปุ่ม “เลือก” ลิงก์ไป `/work-schedule/admin/:placeId/position/:positionId/min-max/:minMaxId` แต่ยังไม่มี route `[minMaxId]` ใน frontend ปัจจุบัน
- backend ปัจจุบันมีเพียง endpoint สร้างและค้นหาตามตำแหน่ง/ช่วงเวลา ยังไม่มี endpoint อ่านรายการตาม ID, แก้ไข หรือลบ

### 3.2 ไฟล์และจุดอ้างอิงปัจจุบัน

- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`: model `WorkScheduleMinMax` และ index `[workSchedulePositionId, startTime, endTime]`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.command.ts`: Zod validation สำหรับค่า min/max และช่วงเวลา
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/create.handler.ts`: ตรวจสิทธิ์, transaction, lock ตำแหน่งงาน และป้องกันช่วงเวลาทับซ้อน
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/queries/get-min-maxs-by-position-id-start-time-end-time.handler.ts`: query รายการพร้อม `id/min/max/startTime/endTime` และเรียงตามเวลา
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/min-max.controller.ts` และ `min-max.module.ts`: ลงทะเบียน route/handler ปัจจุบัน
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/client-page.tsx`: ตารางรายการและลิงก์ “เลือก” ที่จะเปิด route รายละเอียด
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/new/client-page.tsx` และ `ecosystem-frontend-next-js/src/features/work-schedule/min-max/components/create-form.tsx`: รูปแบบ route/form สร้างรายการและการแปลง timezone
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/work-schedule-min-max-keys.ts` และ `work-schedule-min.queries.ts`: query keys และ TanStack Query
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/update-slot.handler.ts` และ `create-many.handler.ts`: ใช้ค่า `max` ตรวจการจัดเวร
- `ecosystem-backend-nest-js/src/modules/work-schedule/holiday/commands/create-holiday.handler.ts`: ใช้ค่า `min` ตรวจจำนวนพนักงานขั้นต่ำเมื่อสร้างวันหยุด
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/[slotId]` และ `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-edit-delete.test.tsx`: รูปแบบอ้างอิงสำหรับหน้า detail, update/delete, การยืนยันลบ, error redirect และการ invalidate cache
- `ecosystem-backend-nest-js/src/common/exceptions/error-codes.enum.ts` และ `ecosystem-frontend-next-js/src/constants/error-messages.ts`: รายการ API error codes และข้อความที่ frontend ต้อง map ให้ครบ

## 4. Business Logic ที่คาดหวังหลัง Implement

1. ผู้ดูแลที่มีสิทธิ์ของตำแหน่งงานสามารถเปิดรายการจากลิงก์ “เลือก” อ่านค่า min/max และช่วงเวลาเดิม แก้ไขแล้วบันทึก หรือเลือกยืนยันลบได้
2. การอ่าน/แก้ไข/ลบต้องตรวจสิทธิ์ของตำแหน่งงานฝั่ง backend เสมอ และต้องตรวจว่ารายการ ID นั้นเป็นของ `position_id` ที่ส่งมาด้วย ห้ามแก้ไขหรือลบข้ามตำแหน่งงาน
3. การแก้ไขต้องใช้ validation หลักเดียวกับการสร้าง: min/max เป็นจำนวนเต็มไม่ติดลบ, ต้องเหลือค่า min หรือ max อย่างน้อยหนึ่งค่า, min ไม่เกิน max เมื่อระบุทั้งคู่ และ end time ต้องมากกว่า start time
4. ใน payload ของการแก้ไขให้แทนช่อง min/max ที่ผู้ใช้ล้างเป็น `null` อย่างชัดเจน เพื่อให้สามารถล้างค่าเดิมของ field นั้นในฐานข้อมูลได้; อย่าใช้ `undefined` ที่ Prisma ตีความว่าไม่ต้องแก้ field. อนุญาตให้ล้างได้หนึ่ง field แต่ห้ามล้างทั้งสอง field พร้อมกันตามกฎเดิม
5. การแก้ไขต้องไม่ทำให้เกิดช่วงเวลาทับซ้อนกับรายการอื่นของตำแหน่งงานเดียวกัน ต้องตัดรายการที่กำลังแก้ไขออกจากการตรวจ overlap และใช้ transaction/row lock แบบเดียวกับ create เพื่อไม่ให้ชนกับการสร้างหรือแก้ไขพร้อมกัน
6. การลบเป็น hard delete เพราะ model ไม่มี `deletedAt`; ก่อนลบต้องตรวจสิทธิ์และ scope ด้วยทั้ง `min_max_id` และ `position_id`. หากไม่พบรายการในตำแหน่งงานนั้น ให้ตอบ not-found ที่ชัดเจน ไม่ลบรายการอื่น
7. เก็บ contract ของ create/list เดิมไว้ และไม่เปลี่ยน algorithm ของการจัดเวรหรือการสร้างวันหยุด ค่า min/max ที่แก้ไขหรือลบจะมีผลต่อการตรวจสอบครั้งต่อ ๆ ไปตาม handler ที่ใช้งานอยู่ ไม่ต้องแก้ไขย้อนหลังหรือสร้าง/ลบเวรและวันหยุดอัตโนมัติ

## 5. ขั้นตอน Implement และเกณฑ์ยอมรับ

### ขั้นตอนที่ 1 — เพิ่ม backend detail/update/delete

เพิ่ม query อ่านตาม ID และ command สำหรับ update/delete โดยยึดรูปแบบ CQRS และ Zod ที่มีอยู่

API contract ใหม่ภายใต้ `/api/work-schedule/min-max`:
- `GET /positions/:position_id/min-maxs/:min_max_id` — อ่านรายการเดียว
- `PATCH /positions/:position_id/min-maxs/:min_max_id` — แก้ไขค่า min/max และเวลา
- `DELETE /positions/:position_id/min-maxs/:min_max_id` — ลบรายการและตอบ `204 No Content`

คง endpoint ปัจจุบัน `POST /:position_id` และ `GET /by-position-id-start-time-end-time/:position_id` ไว้โดยไม่เปลี่ยน contract

รายละเอียด:
- DTO ของทุก route ที่มี ID ต้องตรวจ UUID v7 ทั้ง `position_id` และ `min_max_id`
- response ของ detail ใช้ `{ id, min, max, startTime, endTime }` โดยเวลาเป็น ISO string ในรูปแบบเดียวกับ query list
- ใน update ให้ตรวจสิทธิ์ก่อน แล้วล็อกแถว position ใน transaction; อ่านรายการด้วยทั้ง ID และ position ID; ตรวจ overlap เฉพาะรายการอื่น; จากนั้น update เฉพาะรายการเป้าหมาย
- ใน delete ให้ตรวจสิทธิ์ แล้วลบด้วยเงื่อนไขทั้ง ID และ position ID; ถ้าไม่พบรายการ ให้ส่ง not-found
- เพิ่ม `WORK_SCHEDULE_MIN_MAX_NOT_FOUND` ใน `ErrorCode` และข้อความใน `API_ERROR_MESSAGES` เพื่อให้ frontend จัดการ not-found ได้ตาม pattern ของ Slot
- ลงทะเบียน controller routes และ query/command handlers ใหม่ใน `MinMaxModule`

เกณฑ์ผ่าน:
- อ่าน/แก้ไข/ลบรายการของ position ที่ถูกต้องได้
- ID ที่ไม่มีอยู่หรืออยู่คนละ position ได้ not-found และไม่แก้ไข/ลบข้อมูลอื่น
- ผู้ไม่มีสิทธิ์เป็น Work Schedule Admin ไม่สามารถอ่าน/แก้ไข/ลบได้
- update ปฏิเสธข้อมูล invalid และช่วงเวลาทับซ้อน แต่ยอมรับช่วงเวลาที่ต่อกันพอดี
- endpoint สร้างและ list เดิมยังทำงานตาม contract เดิม

### ขั้นตอนที่ 2 — เพิ่มหน้า detail/edit/delete ใน frontend

สร้าง route `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/[minMaxId]/` โดยใช้หน้า Slot detail เป็นแนวทาง:
- `page.tsx`, `client-page.tsx`, `loading.tsx`, `error.tsx`, `error-code-redirect-list.ts`
- โหลด timezone ของ place และข้อมูล min/max ด้วย `positionId` + `minMaxId`; แสดง redirect/error/loading ตาม pattern ที่มีอยู่
- เพิ่ม `features/work-schedule/min-max/components/edit-form.tsx` ให้ prefill min/max และเวลาเดิม; แสดงเวลาใน timezone ของ place และแปลงเป็น ISO ก่อนส่ง API
- ใช้ปุ่มบันทึกและยกเลิกตาม pattern ของ `CreateForm`; หลังบันทึกสำเร็จแจ้งผลและกลับหน้ารายการ
- ลบต้องมีขั้นตอนยืนยันก่อนส่ง request; การยกเลิกการยืนยันต้องไม่เรียก API; เมื่อกำลังบันทึก/ลบให้ปิดปุ่มที่เกี่ยวข้องเพื่อกันการส่งซ้ำ
- error redirect ของหน้า detail ต้อง map not-found กลับไปหน้ารายการ min/max, และ map person/place/position/permission errors ตาม pattern ที่มีอยู่

เกณฑ์ผ่าน:
- ลิงก์ “เลือก” ในหน้ารายการเปิด detail route ที่เพิ่มใหม่ได้จริง
- ค่าในฟอร์มเริ่มจากข้อมูลที่โหลดมา และเวลาไม่เลื่อนจาก timezone ที่ตั้งไว้ของ place
- เมื่อ update สำเร็จกลับหน้ารายการและเห็นข้อมูลล่าสุด; เมื่อ error ให้เก็บค่าที่ผู้ใช้กรอกไว้และแสดง error โดยไม่แสดง success
- กดยกเลิกการลบแล้วไม่มี API call; ยืนยันลบแล้วลบรายการและกลับหน้ารายการ
- API not-found และ permission error ใช้ redirect flow ที่สอดคล้องกับหน้า Slot detail

### ขั้นตอนที่ 3 — เชื่อม query keys และ cache invalidation

เพิ่ม API client สำหรับ get-by-id/update/delete, hooks สำหรับ update/delete, และ detail query ใน `work-schedule-min.queries.ts`. เพิ่ม detail key ใน `work-schedule-min-max-keys.ts` โดยรวม user ID, position ID และ minMax ID เหมือนรูปแบบ query key ของ Slot

เมื่อ update/delete สำเร็จ:
- invalidate prefix `listsByPositionId(userId, positionId)` เพื่อ refresh list ทุกช่วงเวลาที่ถูก cache
- invalidate detail key ของรายการที่เปลี่ยนหรือลบ
- อย่าล้าง cache ของ position หรือ user อื่น

เกณฑ์ผ่าน:
- API client ตรวจ param/body ด้วย schema ก่อนส่ง request และส่ง Authorization token ตาม pattern เดิม
- query ถูกเปิดใช้เฉพาะเมื่อ user ID, position ID และ minMax ID พร้อม
- update/delete invalidate เฉพาะข้อมูลที่เกี่ยวข้องตามรายการด้านบน

### ขั้นตอนที่ 4 — เพิ่ม tests

เพิ่ม backend tests สำหรับ DTO และ handler ใหม่ และ frontend tests สำหรับ form/detail route โดยทำตามรูปแบบ mock ของ tests ที่มีอยู่ ห้ามให้ unit tests เชื่อมต่อฐานข้อมูลจริง

เกณฑ์ผ่านขั้นต่ำ:
- Backend: validation ของ ID, min/max และช่วงเวลา; update สำเร็จ; ปฏิเสธ overlap; ไม่ถือช่วงเวลาต่อกันเป็น overlap; ตัด ID ปัจจุบันออกจาก overlap check; not-found; authorization; delete ต้องลบเฉพาะ ID + position ที่ตรงกัน
- Frontend: prefill/แปลง timezone; validation และส่ง `null` เมื่อล้าง min หรือ max; update success/error; confirm/cancel delete; disable controls ระหว่าง pending; invalidate list/detail cache; redirect not-found/permission
- Tests ใช้ Prisma mock และ API mock ไม่เรียกฐานข้อมูลหรือ service ภายนอกจริง

## 6. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### ไฟล์ที่ต้องแก้ไข

- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/min-max.controller.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/min-max.module.ts`
- `ecosystem-backend-nest-js/src/common/exceptions/error-codes.enum.ts`
- `ecosystem-frontend-next-js/src/constants/error-messages.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/work-schedule-min-max-keys.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/work-schedule-min.queries.ts`

### ไฟล์ใหม่ที่ต้องสร้าง

Backend:
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/update.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/update.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/delete.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/commands/delete.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/queries/get-min-max-by-id.query.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/queries/get-min-max-by-id.handler.ts`
- tests สำหรับ update/delete/get-by-id และ validation ของ DTO ใหม่ ใน directory `ecosystem-backend-nest-js/src/modules/work-schedule/min-max/`

Frontend:
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/[minMaxId]/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/[minMaxId]/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/[minMaxId]/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/[minMaxId]/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/[minMaxId]/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/api/queries/get-min-max-by-id.api.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/api/mutations/update.api.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/api/mutations/delete.api.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/hooks/use-update.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/hooks/use-delete.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/components/edit-form.tsx`
- `ecosystem-frontend-next-js/tests/work-schedule/min-max-edit-delete.test.tsx`

ไม่ต้องลบไฟล์เดิม ไม่ต้องแก้ Prisma schema/migration และไม่ต้องเปลี่ยนไฟล์หน้ารายการ min/max เว้นแต่พบจากการ implement จริงว่าจำเป็นต่อการใช้ route ที่มีลิงก์อยู่แล้ว

## 7. สิ่งที่ Implementor ต้องระวัง

- ห้ามลบหรือเปลี่ยน validation ของ create เดิม และอย่าเปลี่ยน URL/response contract เดิมโดยไม่จำเป็น
- ใช้ authorization ฝั่ง backend ทุก endpoint; การซ่อนปุ่มบน frontend ไม่ใช่การควบคุมสิทธิ์
- ทุก get/update/delete ต้อง scope ด้วย `position_id` คู่กับ `min_max_id` เพื่อป้องกัน IDOR ข้ามตำแหน่งงาน
- update ต้อง exclude รายการปัจจุบันจาก overlap query แต่ต้องไม่ exclude รายการอื่น และต้อง lock position ภายใน transaction ตาม create เพื่อรองรับ concurrent writes
- เมื่อฟอร์มแก้ไขช่อง min/max ให้แปลงช่องว่างเป็น `null` จริง ๆ; อย่าส่ง `undefined` จนทำให้ค่าเดิมค้างอยู่โดยไม่ตั้งใจ และอย่าอนุญาตให้ทั้งสองช่องว่างพร้อมกัน
- รักษาการแปลง timezone ของ place สำหรับค่า datetime ทั้งการแสดงและการส่งข้อมูล
- อย่าแก้ `create-many.handler.ts`, `update-slot.handler.ts` หรือ `create-holiday.handler.ts` ในงานนี้ การอ่านค่า min/max เพื่อเช็คกฎจัดเวร/วันหยุดต้องทำงานเหมือนเดิม
- ห้ามเพิ่มการปรับแก้ตารางเวร/วันหยุดย้อนหลังหรือ migration ใหม่ เพราะไม่ได้อยู่ในขอบเขตนี้

## 8. คำสั่งตรวจสอบ

รันจาก root repository ตามคำสั่งและ package scripts ที่มีอยู่:

```bash
pnpm install --frozen-lockfile
pnpm --dir ecosystem-backend-nest-js exec jest --runInBand src/modules/work-schedule/min-max
pnpm --dir ecosystem-frontend-next-js exec jest --runInBand tests/work-schedule/min-max-edit-delete.test.tsx
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run verify
```

ใช้ test เฉพาะ feature ก่อน จากนั้นรัน typecheck/lint ทั้งสอง package และ `pnpm run verify` ซึ่งเป็นคำสั่ง verification มาตรฐานของ repository. ตรวจผล GitHub Actions ที่เกิดจาก commit ของ Implementor ด้วย; หากคำสั่งใดรันไม่ได้ใน environment ให้รายงานคำสั่งและผลที่เกิดขึ้นจริงแทนการอ้างว่าผ่าน
