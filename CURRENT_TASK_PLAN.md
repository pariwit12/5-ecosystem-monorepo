# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

สร้างระบบเชื่อมพนักงานของสถานที่ทำงานเข้ากับ Log-in ของพนักงาน เพื่อให้พนักงานสามารถเข้าสู่ work-schedule place ที่เป็นพนักงานอยู่ได้ และอนาคตจะทำระบบให้พนักงานมาลงวันหยุดเองได้

## 2. ข้อสรุปจากผู้ใช้และขอบเขต

ผู้ใช้อนุมัติในแชตให้ใช้ขั้นตอน Admin ออกโค้ด → พนักงานล็อกอิน กรอกโค้ด ตรวจชื่อและยืนยัน → Admin อนุมัติอีกครั้ง → ผูกบัญชี ไม่ต้องมีรหัสจากฝั่งพนักงานอีกชุด โค้ดมีอายุและใช้สำเร็จครั้งเดียว Admin ปฏิเสธคำขอและยกเลิกการผูกได้
รอบนี้พนักงานเห็นเฉพาะหน้าหลักข้อมูลสถานที่ ไม่รวมตารางเวร วันหยุด การแก้ตาราง หรือสิทธิ์ Admin การยกเลิกผูกเก็บ staff และตารางเวรเดิมไว้ การผูกใหม่ต้องเชิญใหม่
รายละเอียดทางเทคนิคต่อไปนี้เป็นข้อกำหนดของแผนสำหรับ Implementor ไม่ใช่คำอธิบายว่ามีอยู่แล้วในระบบ

## 3. โค้ดและ Business Logic ก่อนเริ่ม (ตรวจจากไฟล์จริง)

ใช้ path ด้านล่างเทียบกับ root repository:

- `ecosystem-backend-nest-js/prisma/schema/5-work-schedule.prisma`: `WorkScheduleStaff` มี nullable `personId` เชื่อม `Person`, `deletedAt` และ unique `(organizationWorkSchedulePlaceId, personId)` อยู่แล้ว staff เชื่อมตำแหน่งและ slot ผ่าน id เดิม
- `prisma/schema/1-person.prisma` ภายใต้ backend: `UserAccount.clerkId` unique และ `Person.userAccountId` unique แบบ nullable; ไม่ควรสร้างหรือรวม Person ใหม่ในงานนี้
- `src/common/access-control/access-control.service.ts` ภายใต้ backend: `verifyPerson` หา Clerk → UserAccount → Person; `verifyWorkScheduleAdminAccess` ตรวจ place ไม่ถูกลบและ active WorkScheduleAdmin ไม่ได้ให้สิทธิ์จาก staff
- `src/modules/work-schedule/staff/commands/create-work-schedule-staff.{command,handler}.ts`: body มี name เท่านั้น handler ตรวจ Admin แล้วสร้าง staff ที่ยังไม่ผูก person
- `src/modules/work-schedule/staff/queries/get-work-schedule-staff-by-place-id.{query,handler}.ts`: Admin อ่านเฉพาะ active staff คืน id/name ยังไม่มีสถานะผูก
- `src/modules/work-schedule/log-in/queries/get-user-roles-by-clerk-id.handler.ts`: คืน placesAsAdmin/placesAsStaff จาก personId ของผู้ล็อกอิน กรอง deletedAt ทั้ง place และ membership แล้วเรียงชื่อ
- `src/modules/work-schedule/place/queries/get-work-schedule-place-by-id.handler.ts`: อ่าน name/timezone ได้เฉพาะ Admin ห้ามเปลี่ยน endpoint นี้ให้ staff ใช้
- `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx`: แสดงรายการทั้งสองบทบาท แต่ลิงก์ Staff ยังเป็น `/`
- `src/app/work-schedule/admin/[placeId]/staff/client-page.tsx` ภายใต้ frontend: แสดง staff id/name มีปุ่มรายละเอียดที่ยังไม่มี action
- frontend `src/features/work-schedule/staff/` ใช้ api → TanStack query/mutation → component; import DTO schema/type จาก backend; query key แยกตาม userId; `src/features/work-schedule/log-in/work-schedule-log-in-keys.ts` มี lists(userId)
- ระบบเดิม `StaffInvitation` อยู่ใน backend `prisma/schema/2-dental-clinic.prisma`; `src/modules/organizations/commands/create-staff-invitation.handler.ts` สร้างโค้ด randomBytes(18) base64url เก็บ SHA-256 อายุ 7 วัน; `src/modules/person/commands/claim-staff-invitation.handler.ts` ให้สิทธิ์คลินิกทันทีและอาจสร้าง/ผูก Person ใช้ serializable transaction พร้อม retry P2034 จึงห้าม reuse model/handler นี้สำหรับ Work Schedule
- backend `src/main.ts` ใช้ ZodValidationPipe และ AllExceptionsFilter; `src/common/exceptions/app.exception.ts` รองรับ ErrorCode/HTTP status; frontend `src/constants/error-messages.ts` เป็น Record<ErrorCode,string> ต้องเพิ่มข้อความทุก enum ใหม่

## 4. Business Logic หลัง Implement และข้อกำหนดตายตัว

### 4.1 ตัวตนและสิทธิ์

ใช้ Person ของ session จาก verifyPerson เท่านั้น ไม่รับ personId ของผู้ขอจาก body ไม่ค้นหรือจับคู่ด้วยชื่อ/โทรศัพท์ ไม่สร้าง PersonStaff, affiliation องค์กร/คลินิก หรือ WorkScheduleAdmin การอนุมัติเปลี่ยนเฉพาะ WorkScheduleStaff.personId ของ staff ที่เลือก
Person เดียวอยู่ได้หลาย place แต่หนึ่ง place ผูกได้หนึ่ง staff ตาม unique เดิม รวมกรณี staff ที่ soft delete แล้ว: ถ้า unique ชนให้ conflict ไม่คืนชีพ/ถอดบัญชีของแถวอื่นอัตโนมัติ
Admin ของ place เท่านั้นออกโค้ด ดูผู้ขอ อนุมัติ ปฏิเสธ และถอดผูกได้ ไม่ให้ organization/clinic Admin ได้สิทธิ์เพิ่มเอง

### 4.2 วงจร invitation

- โค้ด randomBytes(18).toString('base64url') ยาว 24 ตัว case-sensitive; trim รอบนอกเท่านั้น เก็บ SHA-256 hex unique ใน DB ไม่เก็บ plain code และไม่ใส่ URL/log/query key/localStorage
- อายุ 7 วันนับจากสร้าง ตรวจเวลาฝั่ง server; expiresAt <= now ถือว่าหมดอายุ ครอบคลุมการ preview, submit และ approve การ expire ไม่ต้องมี cron: คำนวณ effective status จาก timestamp
- หนึ่ง staff มี invitation ที่เปิดอยู่ได้หนึ่งรายการ การออกใหม่ revoke รายการ ISSUED/PENDING เดิมรวมที่หมดอายุ ห้ามออกให้ staff ถูกลบ/place ถูกลบ/ผูกแล้ว
- สถานะ persisted: ISSUED, PENDING, APPROVED, REJECTED, REVOKED; EXPIRED เป็น effective status เมื่อ ISSUED/PENDING หมดอายุ รายการ terminal ไม่ถูกเปิดใช้อีก
- preview หลังกรอก code แสดงเฉพาะ invitationId, staffName, placeName, expiresAt ไม่มีสิทธิ์เข้าถึงสถานที่และยังไม่จองโค้ด
- submit ใช้ code เดิมหลังผู้ใช้กดยืนยัน server ตรวจซ้ำ เปลี่ยน ISSUED → PENDING จองให้ Person ผู้ขอคนเดียว เก็บ requestedAt; คนเดิมส่งซ้ำระหว่าง PENDING ที่ยังไม่หมดอายุคืนรายการเดิม คนอื่นได้ conflict ไม่เปิดเผยตัวผู้ขอ
- เมื่อ PENDING ห้าม claim คนอื่น; ปฏิเสธแล้ว REJECTED โค้ดนั้นใช้ใหม่ไม่ได้ ต้องให้ Admin ออกใหม่
- approve ใช้ผู้ขอจาก DB ตรวจ staff.personId ยัง null, staff/place active, invitation PENDING และยังไม่หมดอายุ แล้วผูก personId พร้อม APPROVED และผู้อนุมัติ/เวลาใน transaction เดียว
- reject เฉพาะ PENDING ที่ยังไม่หมดอายุ เก็บผู้ตัดสิน/เวลา ไม่มีการเปลี่ยน staff.personId
- APPROVED/REJECTED/REVOKED หรือหมดอายุ ทำ transition ซ้ำได้ conflict (ยกเว้น idempotent pending submit ข้างต้น)
- ถอดผูกโดย Admin: ตั้งเฉพาะ staff.personId=null, revoke invitation ISSUED/PENDING ที่เหลือของ staff และบันทึก audit เดียวกันใน transaction; ห้ามเปลี่ยน name, staff.id, positions, slots, Person หรือ UserAccount ถอดแถวที่ไม่ผูกได้ conflict
- การถอดผูกเพิกถอนเฉพาะสิทธิ์ Staff ของ place นี้ สิทธิ์ Admin ที่มีอยู่แยกต่างหากยังคงเดิม ทุก request ใหม่ตรวจ DB ไม่ฝังสิทธิ์ Staff ใน token

เหตุผล: การอนุมัติสองขั้นลดการผูกผิดคนเมื่อโค้ดถูกส่งต่อ, การเก็บ staff id ป้องกันตารางเวรเสีย, และแยกสิทธิ์ Staff ป้องกันเปิด Admin API โดยไม่ได้ตั้งใจ

## 5. โครงสร้างไฟล์และการเปลี่ยนแปลง

ไม่มีไฟล์ต้องลบ Path ใหม่ทุกไฟล์ในส่วนนี้เป็นสิ่งที่ต้องสร้าง ไม่ใช่ไฟล์ที่อ้างว่ามีอยู่

### ขั้น 1 — Schema และ migration

แก้ backend `prisma/schema/5-work-schedule.prisma` เพิ่ม enum `WorkScheduleStaffInvitationStatus` และ models:

1. `WorkScheduleStaffInvitation`: id UUIDv7 PK, staffId UUID FK Restrict ไป WorkScheduleStaff, codeHash unique string, status default ISSUED, createdByPersonId UUID FK Restrict, requestedByPersonId nullable UUID FK Restrict, decidedByPersonId nullable UUID FK Restrict, createdAt default now, expiresAt, requestedAt nullable, decidedAt nullable, revokedAt nullable (เวลาทั้งหมด Timestamptz); index staffId และ requestedByPersonId ใช้ snake_case map ตาราง `work_schedule_staff_invitation`
2. `WorkScheduleStaffLinkAudit`: id UUIDv7 PK, staffId FK Restrict, personId FK Restrict (บัญชีที่ถูกผูก/ถอด), actorPersonId FK Restrict, invitationId nullable FK Restrict, action enum LINK/UNLINK, createdAt default now Timestamptz; index staffId/createdAt; map `work_schedule_staff_link_audit`

เพิ่ม inverse relations ที่ WorkScheduleStaff และ Person ใน `prisma/schema/1-person.prisma` ใช้ relation names แยก creator/requester/decider/audit person/audit actor อย่างชัดเจน ห้ามแก้ unique staff เดิม
สร้าง `prisma/migrations/<timestamp>_work_schedule_staff_invitations/migration.sql` แบบ additive สร้าง partial unique index บน staff_id WHERE status IN ('ISSUED','PENDING') ด้วย SQL เพราะ Prisma schema ไม่แสดงเงื่อนไขนี้; รายการหมดอายุยังต้อง revoke ก่อนออกใหม่

ผ่านเมื่อ validate/generate ผ่าน migration ไม่แก้ข้อมูลเก่า ไม่อ้างตาราง staff_invitation คลินิก และมี FK/index ครบ ไม่รัน migrate ต่อ shared DB ในงาน implement

### ขั้น 2 — Backend invitation module ใหม่

สร้าง directory `ecosystem-backend-nest-js/src/modules/work-schedule/staff-invitation/`:

- `work-schedule-staff-invitation.module.ts`: import CqrsModule, ลงทะเบียน controller/service/handlers
- `work-schedule-staff-invitation.controller.ts`: ทุก route ใช้ ClerkAuthGuard และ ClerkUser.sub
- `work-schedule-staff-invitation.service.ts`: รวม transition/transaction/clock/hash/query logic ไม่ใส่ business logic ซ้ำใน controller
- `commands/{issue,submit,decide,unlink}-staff-invitation.{command,handler}.ts`
- `queries/{preview,list-mine,list-by-place}-staff-invitation.{query,handler}.ts`
- `work-schedule-staff-invitation.service.spec.ts`, `work-schedule-staff-invitation.controller.spec.ts`, `work-schedule-staff-invitation.dto.spec.ts`

DTO/schema อยู่ใน command/query ของแต่ละ operation ตาม pattern เดิม; UUIDv7 ของ path/id, code regex `[A-Za-z0-9_-]{24}`, decision enum APPROVE/REJECT; ไม่รับ identity/role จาก client
ลงทะเบียน module ที่ backend `src/modules/work-schedule/work-schedule.module.ts` ไม่เปลี่ยน staff create API เดิม

API contract ใหม่ (prefix `/api/work-schedule/staff-invitations`):

| Method/path | Input | Output และสิทธิ์ |
| --- | --- | --- |
| POST `/places/:place_id/staff/:staff_id/issue` | ไม่มี body | Admin: {invitationId,code,expiresAt}; code แสดงครั้งเดียว |
| POST `/preview` | {code} | ผู้มี Person: {invitationId,staffName,placeName,expiresAt}; เฉพาะ ISSUED |
| POST `/submit` | {code} | ผู้มี Person: {invitationId,status:'PENDING',expiresAt}; ตรวจเหมือน preview ก่อนจอง |
| GET `/mine` | ไม่มี | {invitations:[{id,staffName,placeName,status,expiresAt,requestedAt}]} เฉพาะ requestedByPersonId ของตน รวมประวัติ เรียง createdAt desc |
| GET `/places/:place_id` | ไม่มี | Admin: {invitations:[{id,staffId,staffName,status,expiresAt,requestedAt,requester:null\|{personId,firstName,lastName,nickname}}]} เรียง createdAt desc; ไม่ส่ง hash/code |
| POST `/places/:place_id/:invitation_id/decision` | {decision:'APPROVE'\|'REJECT'} | Admin: {invitationId,status}; ตรวจ invitation.staff.place ตรง path |
| DELETE `/places/:place_id/staff/:staff_id/link` | ไม่มี | Admin: 204; ตรวจ staff อยู่ใน place |

Response dates ส่ง ISO string ผ่าน Nest serialization; exported response types กำหนดเป็น string ไม่ใช้ Date ฝั่ง frontend; list effective status รวม EXPIRED. ไม่ส่งข้อมูลเอกสารตัวตน/โทรศัพท์/Clerk ID ให้ Admin
preview ของ code ที่ PENDING ตอบ conflict; การ submit ซ้ำของเจ้าของเดิมไม่ต้อง preview ใหม่

ทุก mutation ใช้ Prisma serializable transaction และ bounded retry P2034 สูงสุด 3 retries อ่าน scope/สิทธิ์ Admin/person ใหม่ภายใน transaction ทุกครั้ง (service รับ tx client สำหรับการตรวจ ไม่เรียก global Prisma นอก tx เพื่อยืนยันก่อนเขียนอย่างเดียว) การ issue/decision/unlink ต้อง re-read staff และ place/admin ภายใน tx; ใช้ conditional updateMany ตรวจ expected state/count=1 และ rollback เมื่อไม่ตรง ห้าม catch conflict แล้ว commit บางส่วน
approve เขียน audit LINK, unlink เขียน audit UNLINK ใน tx เดียวกับ staff update. audit เป็น immutable ไม่ต้องมี API history เพิ่มในรอบนี้
unique P2002 → 409 ไม่เปิดเผยข้อมูลแถวอื่น; codeHash collision เฉพาะตอน issue ให้สร้างใหม่ bounded 3 ครั้งแล้ว error ไม่ retry ไม่จำกัด; P2034 หมด retry → conflict ให้ผู้ใช้ลองใหม่

เพิ่ม enum/ข้อความไทยใน backend `src/common/exceptions/error-codes.enum.ts` และ frontend `src/constants/error-messages.ts`:
- WORK_SCHEDULE_STAFF_NOT_FOUND: 404 (รวม staff ผิด place/ถูกลบ)
- WORK_SCHEDULE_INVITATION_NOT_FOUND: 404 (code ไม่พบหรือ invitation ผิด scope)
- WORK_SCHEDULE_INVITATION_EXPIRED: 410
- WORK_SCHEDULE_INVITATION_CONFLICT: 409 (state/claim/concurrency)
- WORK_SCHEDULE_STAFF_LINK_CONFLICT: 409 (ผูกอยู่/unique ชน/ไม่มี link ให้ถอด)
ใช้ AppException และ ErrorCode เดิมสำหรับ Person/place/Admin

ผ่านเมื่อ flow ครบ ไม่มีสิทธิ์ก่อน approve, โค้ดเก่าใช้ไม่ได้หลัง issue ใหม่/reject/approve/unlink, ทุก operation ป้องกันการสลับ place/staff/invitation id และ rollback ได้

### ขั้น 3 — สิทธิ์ Staff และหน้า place API ใหม่

แก้ backend `src/common/access-control/access-control.service.ts` เพิ่ม `verifyWorkScheduleStaffAccess(clerkId,placeId)` ตรวจ place exists/active → verifyPerson → active WorkScheduleStaff ของ personId/placeId; คืน {personId,staffId}; ไม่เพิ่ม organization affiliation condition เพราะ staff เดิมใช้ personId โดยตรง
เพิ่ม `NOT_A_STAFF_OF_WORK_SCHEDULE_PLACE` (403) พร้อม error message และรายการใน `src/common/access-control/access-control-error-code.constant.ts`
สร้าง `src/modules/work-schedule/staff-place/{work-schedule-staff-place.module.ts,work-schedule-staff-place.controller.ts,queries/get-staff-place.query.ts,queries/get-staff-place.handler.ts,queries/get-staff-place.handler.spec.ts}` ลงทะเบียนที่ work-schedule.module.ts
GET `/api/work-schedule/staff-place/:place_id` ใช้ guard และ verifyWorkScheduleStaffAccess คืน {placeId,name,timezone,staff:{id,name}} เท่านั้น ห้ามคืนรายชื่อเพื่อนร่วมงาน/slot/ข้อมูล Admin
คง Admin endpoint และ verifyWorkScheduleAdminAccess เดิม; ไม่เพิ่ม Staff เข้า guard ของ positions/slots/staff/admin APIs
แก้ staff list query/handler เดิมเพิ่ม `isLinked:boolean` จาก personId != null โดยคง id/name และ shape หลัก

ผ่านเมื่อ Staff ที่ approve แล้วเข้าเฉพาะ place ของตนได้ หลัง unlink/soft delete request ถัดไปถูกปฏิเสธ และคนมีแต่ Admin เข้า staff API ไม่ได้ถ้าไม่ได้เป็น Staff ด้วย

### ขั้น 4 — Frontend

แก้ `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx`: เพิ่มลิงก์กรอกโค้ดและสถานะคำขอ; เปลี่ยน Staff card ไป `/work-schedule/staff/${place.id}` และข้อความเป็น “เข้าสู่สถานที่ทำงาน”; Admin card คงเดิม
แก้ `src/app/work-schedule/admin/[placeId]/staff/client-page.tsx`: แสดงสถานะผูก, ปุ่มออกโค้ดเมื่อยังไม่ผูก/ออกใหม่, ปุ่มถอดผูกเมื่อผูกอยู่ พร้อม dialog ยืนยันชื่อ staff และผลของการยกเลิกสิทธิ์; เพิ่มลิงก์จัดการคำขอ ปุ่มรายละเอียดเดิมไม่ต้องสร้างหน้ารายละเอียดเพิ่มเติม

สร้าง frontend files:
- `src/app/work-schedule/invitations/{page.tsx,client-page.tsx}`: form กรอกโค้ด → preview ชื่อ staff/place/expiry → ปุ่มยืนยันส่งคำขอ; ยกเลิก preview ได้โดยไม่จอง code; แสดงรายการ mine และปุ่ม refresh ไม่ต้อง realtime/polling
- `src/app/work-schedule/admin/[placeId]/staff/invitations/{page.tsx,client-page.tsx}`: Admin list, ชื่อผู้ขอและชื่อ staff เปรียบเทียบได้, ปุ่ม approve/reject เฉพาะ PENDING ยังไม่หมดอายุ, dialog ยืนยันก่อน action
- `src/app/work-schedule/staff/[placeId]/{page.tsx,client-page.tsx}`: page wrapper รับ Promise params ตาม pattern ที่มี; client อ่าน staff-place API แสดงชื่อสถานที่ timezone และชื่อ staff พร้อมกลับ /work-schedule; ไม่มีเมนู Admin/เวร/วันหยุด
- `src/features/work-schedule/staff-invitation/{work-schedule-staff-invitation-keys.ts,work-schedule-staff-invitation.queries.ts,api.ts,hooks/use-staff-invitation-actions.ts,components/issued-invitation-dialog.tsx}`: api wrappers ของ 7 operation; dialog แสดง code ครั้งเดียวและ copy ด้วยการกดของ Admin ไม่มีการส่ง email อัตโนมัติ
- `src/features/work-schedule/staff-place/{work-schedule-staff-place-keys.ts,work-schedule-staff-place.queries.ts,api/get-staff-place.api.ts}`

ทุก api ใช้ Bearer token + axios client เดิม validate DTO ด้วย schema backend ก่อนส่ง; frontend import เฉพาะ DTO/type ไม่ import service หรือ crypto/Prisma; query keys แยก userId/placeId ไม่เก็บ code ใน query cache ใช้ mutation สำหรับ preview; clear code/preview เมื่อ submit สำเร็จ เปลี่ยนบัญชี หรือออกหน้า
mutations invalidate admin list, staff list และ login role list ของ session ปัจจุบันตาม key เดิม; mine refetch เมื่อ focus/กลับหน้า/กด refresh ให้ผู้ขอเห็น approved; ไม่อ้างว่าสามารถ invalidate cache ข้ามเครื่องได้
ทุกหน้าใช้ DataStateWrapper/loading/error pattern เดิม; PERSON_NOT_FOUND ไป /person/new; ไม่มี session รอ Clerk/sign-in ไม่ยิง API; denied/deleted staff-place ล้างข้อมูลเดิมจากหน้าจอแล้วกลับ /work-schedule ห้ามแสดง stale place ระหว่าง authorization error; ผู้ใช้ที่เปิดหน้าค้างอาจเห็นข้อมูลที่โหลดแล้วจน refetch แต่ request ใหม่ไม่มีสิทธิ์ทันทีหลัง unlink
ปุ่ม mutation disable ระหว่าง pending, business error แสดงภาษาไทยและ refresh state; ไม่ซ่อน error แล้วแสดง success; ไม่เพิ่ม frontend test framework เพื่องานนี้

ผ่านเมื่อ typecheck/lint/build frontend ผ่าน routes ใหม่ครบ และ server ยังคุมสิทธิ์แม้เข้าด้วย URL โดยตรง

## 6. Tests ที่ต้องเพิ่มและเกณฑ์ยอมรับ

ทุก unit test mock Prisma/transaction ไม่เชื่อม DB จริง ใช้ fixed clock และ verify query scope/conditional writes ไม่ใช่แค่ mock ให้คืน success

1. Invitation service tests: issue hash ไม่เก็บ plaintext อายุ 7 วัน, revoke เก่าก่อนใหม่, ออกให้ linked/deleted/wrong scope ไม่ได้, ไม่มี Person ไม่ผ่าน, preview ไม่ mutate/ไม่เผย requester, submit pending ไม่ผูก staff, คนเดิม submit ซ้ำได้/คนอื่นไม่ได้, expired boundary, reject/approve/revoke code ใช้ซ้ำไม่ได้
2. Approval tests: เฉพาะ active Admin ของ place, อ่าน requester จาก DB, duplicate person ใน place รวม soft-deleted row → conflict, conditional update count=0 → rollback, staff link + decision + audit atomic, ผู้ขอไม่ต้องมี organization/clinic affiliation, person เดียวหลาย place ได้, P2034 retry bounded/P2002 conflict
3. Unlink/race tests: คง staff id/name/positions/slots และบัญชีเดิม, clear personId + audit + revoke pending atomic; approve-vs-unlink/issue-vs-submit/approve สองคำขอ/claim สองคน มีเพียง state ที่อนุญาต commit โดยจำลอง serializable conflict และ conditional count; mock tests ไม่ถือเป็นหลักฐาน concurrency DB จริง
4. Controller tests: guard metadata ทุก route, ส่ง Clerk sub ไม่รับ personId/role, method/path/success status และ route scope ถูกต้อง; DTO tests invalid code/id/decision ถูก reject
5. แก้ `src/common/access-control/access-control.service.spec.ts`: active own staff ผ่าน; stranger/admin-only/คนที่ถูก unlink/soft-deleted staff/place ไม่ผ่าน; Admin behavior เดิมยังผ่าน
6. ใหม่ `src/modules/work-schedule/log-in/queries/get-user-roles-by-clerk-id.handler.spec.ts`: role lookup กรอง active place/staff ใช้ person จาก session; ก่อนอนุมัติ/หลัง unlink ไม่มี staff place; สองบทบาทยังคืนได้ทั้งสอง list
7. ใหม่ `src/modules/work-schedule/staff/queries/get-work-schedule-staff-by-place-id.handler.spec.ts`: Admin scope เดิม, isLinked true/false ถูกต้อง ไม่รั่ว hash/code
8. Staff-place handler tests: คืนเฉพาะ contract, ปฏิเสธคนอื่น/หลัง unlink และไม่มีการเรียก Admin query แทน Staff guard
9. รัน regression clinic invitation tests เดิมให้ผ่าน ห้ามเปลี่ยน expected behavior เป็นรอ approve

## 7. คำสั่งตรวจสอบและหลักฐาน

เรียกจาก root ตามลำดับ:

```powershell
pnpm run prisma:validate
pnpm run prisma:generate
pnpm run test:backend -- --runInBand --testPathPatterns='staff-invitation|staff-place|access-control.service|work-schedule.*handler|claim-staff-invitation|create-staff-invitation'
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run verify
```

ถ้า wrapper ส่ง arguments ไม่ถูก ให้รัน narrow tests จาก backend ด้วย `pnpm exec jest --runInBand --testPathPatterns='staff-invitation|staff-place|access-control.service|work-schedule.*handler'` แล้ว regression ของ clinic แยกตามชื่อ test จริง ห้ามใช้ passWithNoTests เป็นหลักฐานว่าชุดใหม่รันแล้ว
`verify` ของ root รวม validate/generate/typechecks/lints/builds/backend tests/migration:test และไม่รวม e2e
ไม่ต้องรัน deployment e2e หรือ migrate deploy กับ shared DB; หากต้องทดสอบ migration/concurrency/Clerk ด้วยฐานข้อมูลและบัญชีจริง ให้ผู้ใช้ทำใน staging หลัง review และส่งผลผ่านแชต ไม่ใช้เป็นงานที่ Implementor ต้องควบคุม UI ภายนอกหรือจัดการข้อมูลจริง

## 8. สิ่งที่ห้ามเปลี่ยนและเงื่อนไขหยุด

- ไม่แตะระบบ clinic invitations/identity merge/legacy migration และไม่ reset/drop/truncate/db push
- ไม่ให้ staff ใช้ Admin API, ไม่เพิ่มสิทธิ์องค์กร/คลินิก, ไม่แก้ slot/timezone calculation หรือเพิ่มวันหยุด
- ไม่ลบ audit/invitations เดิม ไม่เขียนข้อมูลจริงเพื่อทำ test ไม่ deploy หรือ commit อัตโนมัติ
- หาก code จริงเปลี่ยนจากหลักฐานนี้จน contract/identity rule ใช้ไม่ได้ ให้กลับมาถาม Planner/ผู้ใช้ก่อนเปลี่ยนกติกา ห้ามเดาความสัมพันธ์ใหม่
- เมื่อ Implementor จบ ต้องแจ้ง tests ที่รันจริง/ผลและข้อจำกัด แยก mock race tests ออกจาก concurrency บน DB จริง

## 9. สถานะ Planner รอบนี้

ปรับแผนจากโครงร่างเป็นแผน Implementation ตาม Business Logic ที่ผู้ใช้อนุมัติแล้ว ยังไม่ได้ implement application code และไม่ลงช่อง Approve ในรอบที่แก้แผน แถว Approve CURRENT_TASK_PLAN ต้องว่างทุกช่อง (เดิมว่างอยู่แล้ว) แถวอื่นห้ามแก้

### หลักฐานการตรวจรอบ Planner (23 ตุลาคม 2026)

- อ่านไฟล์จริงตามรายการหลักฐานข้างต้น ไม่มีการแก้ application/schema/migration ในรอบนี้
- `pnpm --version` เรียกไม่สำเร็จด้วย `[ERROR] unable to open database file` จึงไม่ได้อ้างว่า pnpm verify ผ่าน
- ใช้ local executable จาก backend: `.\node_modules\.bin\jest.CMD --runInBand --runTestsByPath src/common/access-control/access-control.service.spec.ts src/modules/organizations/commands/create-staff-invitation.handler.spec.ts src/modules/person/commands/claim-staff-invitation.handler.spec.ts` ผ่าน 3 suites / 13 tests
- `.\node_modules\.bin\tsc.CMD --noEmit` จาก backend ผ่าน (ใช้ generated Prisma client ที่มีอยู่ ไม่ได้ generate ใหม่)
- `git diff --check` ผ่าน; แถว Approve เดิมว่างและยังว่าง ไม่มีการแก้แถวอื่น
- ยังไม่ได้รัน full verify, frontend checks หรือ migration/staging checks ผลข้างต้นเป็น baseline เดิม ไม่ใช่ผลรับรองฟีเจอร์ที่ยังไม่ได้ implement
- `.\node_modules\.bin\eslint.CMD "{src,apps,libs,test}/**/*.ts"` จาก backend ผ่าน (exit 0)

### หลักฐานการตรวจรอบ Planner รอบที่ 2 (23 ตุลาคม 2026 — Approve ช่อง 2)

- ยืนยัน `git status --short`: ไม่มีไฟล์ application/schema ใหม่ — ยังไม่มีการ implement (expected)
- `git log` backend: commit ล่าสุดคือ docs เท่านั้น ไม่มีการเปลี่ยนแปลง source code
- ยืนยันโครงสร้าง `src/modules/work-schedule/`: ไม่มี `staff-invitation/` หรือ `staff-place/` ตรงตามสถานะก่อน implement
- รัน baseline tests: 3 suites / 13 tests ผ่าน (access-control.service, create-staff-invitation.handler, claim-staff-invitation.handler)
- `tsc --noEmit` จาก backend exit 0
- `git diff --check` มีเฉพาะ LF/CRLF warning บน root markdown files ไม่ใช่ backend code
- ไม่พบสิ่งที่ต้องแก้แผน จึงลง Approve ช่อง 2

### หลักฐานการตรวจรอบ Planner รอบที่ 1 (23 ตุลาคม 2026 — Approve ช่อง 1)

**ไฟล์ที่อ่านและยืนยันจริงในรอบนี้:**
- `prisma/schema/5-work-schedule.prisma`: WorkScheduleStaff มี nullable personId, unique(placeId,personId), deletedAt ตรงตามแผน; ยังไม่มี WorkScheduleStaffInvitation/WorkScheduleStaffLinkAudit
- `src/common/access-control/access-control.service.ts`: ไม่มี verifyWorkScheduleStaffAccess (ต้องสร้างใหม่ในขั้น 3)
- `src/common/access-control/access-control-error-code.constant.ts`: ไม่มี NOT_A_STAFF_OF_WORK_SCHEDULE_PLACE (ต้องเพิ่มในขั้น 3)
- `src/common/exceptions/error-codes.enum.ts`: ไม่มี WORK_SCHEDULE_STAFF_NOT_FOUND, WORK_SCHEDULE_INVITATION_* (ต้องเพิ่มในขั้น 2)
- `src/modules/work-schedule/work-schedule.module.ts`: ไม่มี staff-invitation/staff-place (ต้องลงทะเบียนขั้น 2/3)
- `get-work-schedule-staff-by-place-id.handler.ts`: select เฉพาะ id/name; ยังไม่มี isLinked (ต้องแก้ขั้น 3)
- `get-user-roles-by-clerk-id.handler.ts`: กรอง deletedAt ถูกต้อง
- `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx`: Staff card href="/" ยังไม่เปลี่ยน
- `admin/[placeId]/staff/client-page.tsx`: ปุ่มรายละเอียดยังไม่มี action
- `src/constants/error-messages.ts`: ยังไม่มี error codes ใหม่
- directory `work-schedule/admin/[placeId]/staff/`: มี page.tsx, client-page.tsx, new/ ยืนยัน; ยังไม่มี invitations/

**Tests ที่รันจริง (รอบ Approve ช่อง 1):**
- 3 suites / 13 tests ผ่าน (access-control.service, create-staff-invitation.handler, claim-staff-invitation.handler)
- `tsc --noEmit` จาก backend exit 0
- ไม่พบสิ่งที่ต้องแก้แผน จึงลง Approve ช่อง 1
