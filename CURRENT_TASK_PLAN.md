# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ปรับหน้า UI ทุกหน้าให้สามารถเปิดในมือถือ และ tablet ได้ด้วยความเรียบร้อยด้วยครับ แล้วก็ต้องการให้เปลี่ยนสไตล์เป็นแนว minimal พร้อมด้วยสีที่ใช้ต้องการให้เป็นสีที่สบายตา ไม่ทำให้ตาล้าด้วยครับ

## 2. ขอบเขตและหลักการ

- ปรับเฉพาะ UI ของ frontend ที่อยู่ใน `ecosystem-frontend-next-js` ให้ responsive สำหรับมือถือและ tablet และใช้ visual style ที่ minimal สบายตาและสม่ำเสมอ
- ต้องครอบคลุมทุก route/page ที่มีอยู่จริงใน `ecosystem-frontend-next-js/src/app` ไม่ใช่เฉพาะหน้า Home หรือหน้า Work Schedule ที่ตรวจเห็นก่อน แนะนำให้เริ่มด้วยคำสั่งนี้เพื่อยืนยัน inventory จาก working tree จริง:
  ```sh
  find ecosystem-frontend-next-js/src/app -type f \( -name 'page.tsx' -o -name 'client-page.tsx' -o -name 'layout.tsx' -o -name 'loading.tsx' -o -name 'error.tsx' -o -name 'not-found.tsx' \) -print | sort
  ```
  ตรวจเส้นทางที่ค้นพบทั้งหมดและไล่ตาม component ที่แต่ละ route render ก่อนเริ่มแก้ ห้ามถือว่ารายการตัวอย่างในเอกสารนี้เป็นรายการ route ทั้งหมด
- ใช้ Tailwind CSS v4, CSS variables/theme tokens และ component system ที่มีอยู่แล้ว ห้ามเพิ่ม UI framework หรือ dependency ใหม่เพียงเพื่อทำ responsive styling
- ไม่ทำ redesign ด้านข้อมูลหรือเพิ่ม feature ใหม่ งานนี้เป็นการเปลี่ยน presentation/layout เท่านั้น
- ใช้ breakpoint utility ของ Tailwind ที่มีอยู่ (`sm`, `md`, `lg`) และกำหนด behavior ชัดเจนสำหรับมือถือ, tablet portrait และ tablet landscape โดยไม่สร้าง breakpoint system ใหม่
- ขนาด viewport ขั้นต่ำที่ต้องพิจารณา: 320px และ 375px สำหรับมือถือ, 768px สำหรับ tablet portrait และ 1024px สำหรับ tablet landscape
- กำหนดโทน visual กลาง: พื้นหลัง neutral อ่อนโทนเย็น, card สีขาว/neutral, ตัวอักษรสี graphite ที่อ่านง่าย, muted text สีเทาระดับกลาง และ primary accent เป็น muted blue เพียงชุดหลัก ลดการใช้สี blue/purple ที่ต่างกันโดยไม่มีความหมาย ยกเว้นสีที่สื่อบทบาทหรือสถานะจริง
- ใช้ semantic tokens เช่น `background`, `foreground`, `card`, `muted`, `muted-foreground`, `primary`, `primary-foreground`, `accent`, `border`, `ring` และ `destructive` ที่ประกาศไว้ใน `src/app/globals.css` แทนการตั้งสีดิบกระจัดกระจายเมื่อ token เดียวกันรองรับได้อยู่แล้ว รักษา contrast ที่อ่านได้ชัดเจนทั้งตัวอักษรและ control
- ใช้ spacing, heading scale, border, radius และ shadow ที่สม่ำเสมอ ลดเงา/สีตกแต่งที่ไม่จำเป็น แต่คง visual hierarchy และ affordance ของปุ่ม/ลิงก์
- interactive target หลักบนมือถือควรสูงอย่างน้อย 44px โดยไม่ทำให้ control ภายใน component system เดิมเสีย layout
- คง behavior ของ dark theme tokens ที่มีอยู่ ไม่เพิ่มระบบสลับ theme ใหม่ และตรวจไม่ให้การแก้ light theme ทำให้ class `.dark` หรือ component ที่ใช้ semantic tokens ผิดสี

## 3. Business Logic ที่เกี่ยวข้องก่อนเริ่ม

1. Root layout ครอบแอปด้วย `ClerkProvider` และ `TanStackProvider`; แสดง Sign In เมื่อ signed out และ `UserButton` เมื่อ signed in; มี `OfflineBanner`, `GlobalErrorModal`, `Toaster` และ `ToastNotifier`. Sidebar ถูก import แต่ไม่ render เพราะ JSX ถูก comment; ต้องคงสภาพนี้
2. Home แยก UI ตาม Clerk auth state; เมื่อ signed in มีลิงก์ไป `/work-schedule`; Coming Soon ยัง disabled และ Toothcraft JSX ถูก comment. ห้ามเปิด feature หรือเปลี่ยนปลายทาง
3. Organizations page ใช้ `organizationsQueries.lists(userId, getToken)`, แสดง `OrganizationsLoading`, อ่าน query string `error` เพื่อ toast แล้วลบ query string ด้วย `history.replaceState`; เลือกองค์กรแล้วไป `/organizations/${orgId}/settings`; `CreateOrgModal` ใช้ Zod/React Hook Form และ mutation สำหรับสร้างองค์กร. คง query, id, toast, mutation, form validation และ navigation เดิม
4. Organization settings, general settings, dental-clinic list/new และ organization work-schedule list/new มี server wrappers ที่ตรวจ `orgId` ด้วย regex UUIDv7 ก่อน render และ redirect invalid id ไป `/organizations?error=invalid_id`; อย่าลบหรือย้าย validation นี้ไป client. Settings general ใช้ form schema ที่เลือก `name` จาก `UpdateOrganizationByIdDtoBodySchema`, mutation update และ toast/error redirect เดิม
5. Dental Clinic list page มีการแสดงสถานะ/empty UI และ link ไปหน้า `/dental-clinic/new`; ตัวอย่าง/mock clinic data ใน client source เป็น comment ไม่ใช่ data fetching ที่ใช้งานอยู่ จึงห้ามเพิ่ม API หรือเปลี่ยนข้อมูลเพื่อให้หน้า responsive. หน้า new clinic เป็น wizard สามขั้น (`StepWelcome`, `StepSetup`, `StepSuccess`) โดย state `currentStep`, query organization details, และ redirect ตาม error code; คงขั้นตอน/ปุ่ม/validation/state ตาม source จริง
6. Organization Work Schedule list ใช้ `workSchedulePlacesQueries.listByOrganizationId`, แสดงรายการสถานที่/empty/loading/error state และ redirect เมื่อ person/organization/role error; หน้าสร้างใช้ `CreateWorkSchedulePlaceForm(orgId)`. คง `orgId`, query, role access/error handling, submit behavior และปลายทาง
7. Person creation ผ่าน `CreatePersonForm` และ `useCreatePerson`; submit สำเร็จมี success toast แล้วกลับ `/`, error มี error toast และปุ่มถูก disabled ระหว่าง pending. ห้ามเปลี่ยน mutation, toast, pending state หรือ route
8. Work Schedule landing ใช้ `workScheduleLogInQueries.userRolesByClerkId`, แยก `placesAsAdmin` กับ `placesAsStaff`, แสดง empty state เมื่อไม่มีสถานที่ และลิงก์ไป invitations/admin/staff destinations; `PERSON_NOT_FOUND` redirect ไป `/person/new`. คงการแบ่ง role, query/error state และลิงก์ทั้งหมด
9. Admin place layout ตรวจ `placeId` เป็น UUIDv7 และ redirect โดยใช้ `PageErrorList.INVALID_ID` ไปยัง `/work-schedule?error=...` เมื่อไม่ถูกต้อง. Admin place dashboard เป็นเมนูเข้าสู่ position/staff. ห้าม bypass ID validation หรือเปลี่ยน role/access behavior
10. Admin position list/detail ใช้ query สำหรับ position/list และ position id; position layout ตรวจ `positionId` UUIDv7 ก่อน render. Query error ถูกแปลงเป็น redirect, loading/error UI หรือ toast ผ่าน route-specific helper. คง access control, error-code mapping, query, refetch, navigation และ `placeId/positionId`
11. Position subroutes มี min-max rules, slot templates, slot types, slots และ staff-position assignments. หน้ารายการใช้ query ที่ตรงกับ resource; หน้า create ใช้ feature forms/checkbox selection และปลายทาง success/cancel ที่กำหนดไว้. ห้ามสลับ query ของ template/type, ลบ access-control/error redirect helper หรือเปลี่ยน payload/validation ของ forms
12. Slot board ใช้ข้อมูล slots, min-max, staff positions, holidays, place timezone และช่วงวันที่; มี filter ประเภท slot และ board UI. `slot-date-range.ts` แปลง/format datetime โดย timezone; `slot/new/page.tsx` รองรับ query `prefillId` และตรวจ UUIDv7 ก่อนแสดง form; route new/menu/pre-fill เลือก flow สำหรับสร้าง slot. คง timezone/date conversion, min/max rules, filter, holiday/staff counts, prefill, query และ mutation semantics เดิม
13. Admin staff list ใช้ query รายชื่อ staff และ `useStaffInvitationActions(placeId)` สำหรับออก invitation/unlink staff พร้อม confirmation state/dialog; `staff/new` ใช้ `CreateWorkScheduleStaffForm(placeId)`; `staff/invitations` แสดงคำขอและตัดสินใจ APPROVE/REJECT ด้วย mutation/refetch. คง confirmation, invitation actions, status/expiry, error handling และ role checks
14. User invitations route ใช้ `workScheduleStaffInvitationQueries.mine`; preview ตรวจ code และแสดงรายละเอียดคำเชิญ; submit สำเร็จเคลียร์ preview/code และ refetch รายการ. Staff place route ใช้ `workScheduleStaffPlaceQueries.detail`, `HolidayForm`, `HolidayList`, และ `MyWorkScheduleCalendar`; เมื่อเจอ person/place/role error ให้ redirect ตามเดิม. ห้ามเปลี่ยน holiday/calendar data flow หรือ invitation flow
15. `/agent` เป็น interactive chat: เก็บ messages/input/isSending/conversationId, ขอ Clerk token, POST ไป `/api/program/agent/chat` และแสดง response/error ตาม code. ต้องปรับ input/message panel/action ให้ responsive แต่ห้ามเปลี่ยน API URL, Authorization header, request payload, message order หรือ pending/error behavior
16. Catch-all `/[...notFound]` มีปุ่ม `router.back()` และลิงก์ Home; `src/app/error.tsx` เป็น Error Boundary ที่ log error แล้วเรียก `reset()`. Shared loading/error/offline/modal/toast states ต้องอ่านได้ทุก viewport และคงเงื่อนไขแสดงผลเดิม


## 4. ส่วนของโค้ดที่ตรวจพบก่อนเริ่ม

### 4.1 สภาพจริงของ shared shell, theme และหน้าที่ตรวจแล้ว

- `ecosystem-frontend-next-js/src/app/layout.tsx`: ยืนยันจาก source จริงว่า `html` มี `h-full overflow-y-auto scrollbar-gutter-stable`; `body` มี `min-h-full flex flex-col bg-gray-50`; header ใช้ `bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50`; ข้อความต้อนรับซ่อนด้วย `hidden sm:block`; shell ด้านล่างใช้ `flex flex-1 overflow-hidden`; main ใช้ `flex-1`. `Sidebar` ถูก import แต่ JSX `<Sidebar />` ถูก comment อยู่ ห้ามเปิดระหว่างงานนี้
- `ecosystem-frontend-next-js/src/app/globals.css`: Tailwind CSS v4 และ shadcn theme ใช้ CSS variables ที่ `:root` และ `.dark` อยู่แล้ว; token ครอบคลุม background/foreground/card/muted/primary/border/input/ring/destructive และ chart/sidebar colors. ค่า light theme ปัจจุบันเป็น neutral ขาว/เทาและ primary เป็น neutral ไม่ใช่ muted blue ตาม visual direction ที่ต้องการ; ให้เปลี่ยน token กลางแทนไล่ hard-code สีทั่วระบบ และตรวจ `.dark` คู่กัน
- `ecosystem-frontend-next-js/src/app/page.tsx`: UI signed-out/signed-in ใช้ `Show` จาก Clerk; grid `grid-cols-1 md:grid-cols-3` มีอยู่แล้ว; Work Schedule ลิงก์ไป `/work-schedule`; Coming Soon เป็น disabled; Toothcraft block ถูก comment. งานนี้เปลี่ยน layout/appearance เท่านั้น ห้ามเปิด feature ที่ปิดไว้
- `ecosystem-frontend-next-js/src/app/organizations/page.tsx` และ `src/app/organizations/loading.tsx`: ทั้งคู่ใช้ container `p-8 w-full max-w-6xl` และ grid `grid-cols-1 md:grid-cols-3`; ใช้ loading component ที่มีอยู่. หน้า Organizations แสดง `CreateOrgModal` และนำไป `/organizations/${orgId}/settings`; การเปลี่ยนแปลงต้องไม่แก้ query/toast/route
- Work Schedule root และหน้าระบบย่อยมี style สองรูปแบบปะปนกัน: บางหน้าใช้ `p-8`, `bg-white`, `text-gray-*` และสี purple/blue แบบ hard-coded; บางหน้ามี responsive utilities และ semantic tokens เช่น `px-4 sm:px-6 lg:px-8`, `min-w-0`, `break-words`, `min-h-11`, `@container`, และ `text-muted-foreground` อยู่แล้ว. ให้ปรับตามความจำเป็นและรักษา responsive behavior ที่มีอยู่ ไม่แทนที่รูปแบบที่ดีอยู่แล้วด้วย layout ที่ถอยหลัง
- `ecosystem-frontend-next-js/src/components/ui/button.tsx`: shared Button ใช้ CVA และ semantic tokens; sizes ปัจจุบันมีหลายระดับรวมถึงความสูงต่ำกว่า 44px. ห้ามเปลี่ยน primitive กลางทั้งระบบโดยอัตโนมัติ ให้ตรวจ use sites ก่อนและทำเฉพาะเมื่อจำเป็น
- `src/components/data-state-wrapper.tsx`: มี auth/query loading state, error state และ reload button ที่ปรากฏหลัง timer 5 วินาที; คงเงื่อนไขและ timer เดิมขณะจัด layout ให้ responsive
- `src/components/use-by-layout/global-error-modal.tsx` และ `src/components/use-by-layout/offline-banner.tsx`: modal ใช้ fixed overlay/padding และ banner แสดงเมื่อ offline เท่านั้น; ปรับการ wrap/ขนาดภายใน viewport โดยไม่เปลี่ยน state/การปิด modal/เงื่อนไข offline
- `src/app/[...notFound]/page.tsx`: เป็น fallback 404 ที่มีปุ่ม `router.back()` และลิงก์ Home; `src/app/error.tsx` เป็น Error Boundary ที่เรียก `reset()`. ไม่สร้างหรือเปลี่ยน fallback route โดยไม่จำเป็น
- `src/app/agent/page.tsx`: เป็น chat UI ที่ใช้ Clerk token แล้ว POST ไป `${NEXT_PUBLIC_API_BASE_URL}/api/program/agent/chat` พร้อม `message` และ `conversationId`; ต้องรวมในขอบเขต responsive ด้วย แต่ห้ามเปลี่ยน protocol/request/state ของแชต
- CI จริงใน `.github/workflows/ci.yml` ใช้ Node 22, `pnpm install --frozen-lockfile` และ `pnpm run verify`; root `package.json` มี scripts `test:frontend`, `lint:frontend`, `typecheck:frontend`, `build:frontend` และ `verify`. ห้ามแก้ workflow/scripts/dependencies เพื่อแก้ปัญหา UI โดยไม่มีเหตุผลนอกเหนือจากขอบเขต

### 4.2 Inventory route component ที่ยืนยันจาก GitHub `main`

ตรวจ Git tree ของ `main` (tree SHA ณ snapshot ก่อนแก้เอกสาร: `5f9472f9ba9d3326cac6a1a93fd0890753f5ed79`) พบไฟล์ที่เป็น `page.tsx`, `client-page.tsx`, `layout.tsx`, `loading.tsx` หรือ `error.tsx` รวม **90 ไฟล์**: `page.tsx` 33, `client-page.tsx` 28, `layout.tsx` 3, `loading.tsx` 13 และ `error.tsx` 13. รายการนี้เป็น baseline ที่ต้องให้ความสำคัญครบทุก path; อย่าตัด route ออกจากงานเพราะไม่อยู่ในแผนฉบับก่อน

#### Root, fallback และ global error (5 files)
- `ecosystem-frontend-next-js/src/app/[...notFound]/page.tsx`
- `ecosystem-frontend-next-js/src/app/agent/page.tsx`
- `ecosystem-frontend-next-js/src/app/error.tsx`
- `ecosystem-frontend-next-js/src/app/layout.tsx`
- `ecosystem-frontend-next-js/src/app/page.tsx`

#### Organizations routes (14 files)
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/dental-clinic/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/dental-clinic/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/dental-clinic/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/dental-clinic/page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/settings/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/settings/general/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/settings/general/page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/settings/page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/work-schedule/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/work-schedule/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/work-schedule/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/work-schedule/page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/loading.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/page.tsx`

#### Person routes (2 files)
- `ecosystem-frontend-next-js/src/app/person/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/person/new/page.tsx`

#### Work Schedule routes (69 files)
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/layout.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/layout.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/new/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/new/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/new/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/new/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-type/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-type/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-type/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-type/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-type/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-type/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/menu/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/menu/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/new/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/new/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/error.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/loading.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/staff/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/staff/invitations/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/staff/invitations/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/staff/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/staff/new/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/staff/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/invitations/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/invitations/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/staff/[placeId]/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/staff/[placeId]/page.tsx`

### 4.3 ไฟล์ route-local ที่ไม่ใช่ page wrapper แต่มีผลกับ UI/behavior

ไฟล์เหล่านี้พบใน source tree จริงและต้องอ่านเมื่อปรับหน้าที่เกี่ยวข้อง โดยเฉพาะ helper ที่คุม error redirect, wizard และ schedule board:

- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/dental-clinic/new/_components/step-1-welcome.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/dental-clinic/new/_components/step-2-setup.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/dental-clinic/new/_components/step-3-success.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/new/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-template/new/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot-type/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board-component-slot-type-selector.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/pre-fill/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/slot-date-range.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/error-code-redirect-list.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/staff-position/new/error-code-redirect-list.ts`

### 4.4 Shared UI และ feature components ที่ route import ใช้ร่วมกัน

ตรวจ existence จาก Git tree แล้ว; ไล่ตาม call sites ก่อนแก้ shared behavior:

- `ecosystem-frontend-next-js/src/app/globals.css`
- `ecosystem-frontend-next-js/src/components/data-state-wrapper.tsx`
- `ecosystem-frontend-next-js/src/components/use-by-layout/global-error-modal.tsx`
- `ecosystem-frontend-next-js/src/components/use-by-layout/offline-banner.tsx`
- `ecosystem-frontend-next-js/src/components/use-by-layout/sidebar.tsx`
- `ecosystem-frontend-next-js/src/components/use-by-layout/toast-notifier.tsx`
- `ecosystem-frontend-next-js/src/components/ui/button.tsx`
- `ecosystem-frontend-next-js/src/components/children-header.tsx`
- `ecosystem-frontend-next-js/src/components/menu-grid/menu-gird.tsx`
- `ecosystem-frontend-next-js/src/components/menu-grid/menu-card.tsx`
- `ecosystem-frontend-next-js/src/components/menu-grid/icon.tsx`
- `ecosystem-frontend-next-js/src/components/input/datetime-input.tsx`
- `ecosystem-frontend-next-js/src/components/redirect/redirect-ui.tsx`
- `ecosystem-frontend-next-js/src/constants/page-error-list.enum.ts`
- `ecosystem-frontend-next-js/src/hooks/use-effect-check-error.ts`
- `ecosystem-frontend-next-js/src/features/organizations/components/create-organization-modal.tsx`
- `ecosystem-frontend-next-js/src/features/person/components/create-person-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/places/components/create-work-schedule-place-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/position/components/create-work-schedule-position-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/staff/components/create-work-schedule-staff-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/components/create-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot-template/components/create-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot-type/components/create-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/create-many-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/staff-position/components/create-many-check-box.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/holiday/components/holiday-form.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/holiday/components/holiday-list.tsx`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/my-work-schedule-calendar.tsx`

นอกจากนี้ route files ที่เกี่ยวข้อง import feature hooks/query/mutation และ shared providers (เช่น `organizationsQueries`, `workSchedulePlacesQueries`, `workSchedulePositionQueries`, `workScheduleSlotQueries`, `workScheduleSlotTemplateQueries`, `workScheduleSlotTypeQueries`, `workScheduleStaffPositionQueries`, `workScheduleStaffQueries`, และ `workScheduleStaffInvitationQueries`). ให้เปลี่ยน class/layout เท่านั้นโดยไม่ปรับ key, payload, query options, mutation callbacks หรือสิทธิ์เข้าถึง.

### 4.5 Test baseline ที่ตรวจพบจริง

- `ecosystem-frontend-next-js/jest.config.mjs` ใช้ `next/jest`, `testEnvironment: "jsdom"`, และ `testMatch` ภายใต้ `tests/**/*.test.ts(x)`; มี path alias `@/` และ `@backend/` ตาม monorepo
- Test files ที่พบใน frontend package มี 4 ไฟล์:
  - `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-board-holidays.test.tsx`
  - `ecosystem-frontend-next-js/tests/work-schedule/admin-slot-date-range.test.tsx`
  - `ecosystem-frontend-next-js/tests/work-schedule/create-many-holiday-blocking.test.tsx`
  - `ecosystem-frontend-next-js/tests/work-schedule/slot-date-range.test.ts`
- Tests ที่มีอยู่ทดสอบ holiday rendering/filtering, date-range/timezone และ create-many holiday-blocking logic; รักษา assertions เหล่านี้ไว้ และเพิ่ม responsive/UI regression tests ใน directory/convention เดิมตาม component ที่แก้. Jest/jsdom ไม่ได้พิสูจน์ visual overflow จริงใน browser


## 5. Business Logic ที่คาดหวังหลัง Implement

- Business Logic, API calls, query keys, mutation payloads, validation rules, auth checks, redirects, URL parameters, toast/error codes และ route destinations ต้องไม่เปลี่ยนจากก่อนเริ่ม
- เนื้อหาและ action เดิมทุกหน้าเข้าถึงได้บนมือถือ/tablet โดยไม่มี horizontal overflow ของหน้าโดยรวม, ไม่มีปุ่มสำคัญหรือข้อความถูกตัด/ซ่อน และไม่มี modal/form ล้น viewport
- หน้าและ shared component ใช้ theme/spacing/typography เดียวกัน; สีเน้นถูกใช้เท่าที่จำเป็นและแยกสีตามความหมายของสถานะ/บทบาทเท่านั้น เหตุผลคือทำให้หน้าจอทุกส่วนดูเรียบง่าย ลดความต่างที่ไม่จำเป็น และช่วยให้อ่านเนื้อหาได้ง่ายขึ้น
- Layout ปรับจากหนึ่งคอลัมน์บนมือถือไปเป็นหลายคอลัมน์ตามพื้นที่ที่เพียงพอ; header/actions สามารถ wrap หรือ stack เมื่อพื้นที่ไม่พอ; form inputs และ action buttons ต้องกดได้สะดวก
- ตารางหรือข้อมูลที่มีความกว้างมาก ต้องใช้ layout สำหรับจอเล็กที่เลือกอย่างชัดเจน: จัดเป็น stacked content เมื่อไม่ทำให้ความสัมพันธ์ของข้อมูลหายไป หรือให้เลื่อนแนวนอนได้เฉพาะ wrapper ของตาราง ห้ามทำให้ทั้งหน้า scroll แนวนอน และห้ามซ่อนข้อมูล/action ที่จำเป็น
- Empty/loading/error/offline/modal/toast states ต้อง responsive และยังมีข้อความที่อ่านได้ โดยไม่เปลี่ยนเงื่อนไขที่ทำให้ state เหล่านั้นแสดง

## 6. ขั้นตอน Implement และเกณฑ์ยอมรับ

### ขั้นตอนที่ 1 — ตรวจ inventory และกำหนด baseline

งาน:
- รันคำสั่ง inventory ในหัวข้อ 2 กับ working tree จริงก่อนเริ่มแก้
- Baseline ที่ Planner ตรวจจาก GitHub `main` พบ route component 90 ไฟล์ (33 `page.tsx`, 28 `client-page.tsx`, 13 `loading.tsx`, 13 `error.tsx`, 3 `layout.tsx`); รายการ path ทั้งหมดระบุไว้ใน Section 4.2
- ถ้า inventory ใน checkout ของ Implementor ต่างจาก baseline (มี route เพิ่ม/หาย/เปลี่ยนชื่อ) ให้หยุดก่อนแก้ source และรายงาน Planner เพื่อปรับแผน ไม่ตัดสินใจข้าม route หรือขยาย scope เอง
- ตรวจทุก route component ตาม Section 4.2 และตาม imports ไปยัง route-local/shared components ใน Section 4.3–4.4; ตรวจ href/router destinations ที่มีอยู่จริง รวมถึง form/modal, nested loading/error, wizard และ slot board ห้ามจำกัดงานไว้เฉพาะ route ที่แสดงอยู่ใน navigation หลัก
- ค้น class ที่อาจก่อปัญหาบน viewport เล็ก เช่น fixed padding/width, single-row flex, grid columns ที่ไม่ responsive, `overflow-hidden`, long ID/text, form action groups และ table/container ที่กว้าง
- สำรวจรูปแบบ Jest/Testing Library และ test ที่มีอยู่ก่อนเพิ่มหรือแก้ test

เกณฑ์ผ่าน:
- inventory จาก working tree ถูกเทียบกับ baseline 90 paths ใน Section 4.2 แล้ว; ทุก route ที่ตรงกันถูกกำหนดขอบเขต UI ที่ต้องตรวจ และไม่มีการเดาชื่อไฟล์
- ระบุจุดแก้ style ต่อไฟล์และ business logic ที่ต้องคงอยู่ก่อนเริ่มแก้
- ไม่มีไฟล์ backend, API, schema, migration หรือ business logic ถูกแก้ในขั้นตอนนี้

### ขั้นตอนที่ 2 — ปรับ theme และ shared shell

ไฟล์หลัก:
- `ecosystem-frontend-next-js/src/app/globals.css`
- `ecosystem-frontend-next-js/src/app/layout.tsx`

งาน:
- ปรับค่า semantic theme tokens ให้ได้พื้นหลัง neutral อ่อน, surface/card ชัดเจน, foreground/muted ที่อ่านง่าย และ primary muted blue ที่มี contrast เพียงพอ; ทำชุด `.dark` ให้สอดคล้องกับ token เดิมด้วย
- ปรับ header ให้ชื่อระบบและ auth action อยู่ได้ทั้งจอแคบและกว้าง โดยไม่ซ่อน Sign In/UserButton; ให้ข้อความ/ปุ่ม wrap หรือย่อ spacing ที่ breakpoint อย่างเหมาะสม
- ปรับ outer layout ให้เนื้อหากว้างได้เต็มพื้นที่ที่ใช้ได้, อนุญาตให้ content wrap และ scroll แนวตั้งตามปกติ; แก้ `overflow-hidden` เฉพาะเมื่อทำให้เนื้อหาถูกตัดหรือ scroll ไม่ได้
- คง `ClerkProvider`, `TanStackProvider`, `OfflineBanner`, `GlobalErrorModal`, `Toaster`, `ToastNotifier` และสถานะ signed-in/signed-out ตามเดิม

เกณฑ์ผ่าน:
- ที่ 320px และ 375px header ไม่มี horizontal overflow และ auth action ยังใช้งานได้
- ทุก route สามารถ scroll ลงไปถึง content/action ด้านล่างได้ ไม่มีเนื้อหาถูก shell ตัด
- semantic token consumers ยังได้ foreground/background/border/ring ที่อ่านได้ทั้ง light และ `.dark`
- ไม่มีการเปิด sidebar, เปลี่ยน title/metadata, หรือเปลี่ยน auth/navigation behavior โดยไม่เกี่ยวข้อง

### ขั้นตอนที่ 3 — ปรับทุกหน้าและ shared UI ให้ responsive/minimal

ไฟล์ route/UI ที่ต้องครอบคลุมทั้งหมดคือ 90 paths ตาม Section 4.2 (อย่าใช้รายการหน้าเดิมที่สั้นกว่านี้เป็น scope limit). อ่าน supporting components ตาม Section 4.3–4.4 เมื่อ route import ใช้งาน โดยให้พิจารณาเป็นอย่างน้อย:
- root shell/theme และ global error/fallback/agent
- Organizations/settings, Dental Clinic list + wizard และ Organization Work Schedule list/create
- Person creation
- Work Schedule landing/invitations, admin dashboard, position list/detail, min-max, slot-template, slot-type, slot/slot new/menu/pre-fill, staff-position assignment, staff list/create/invitations และ staff-side holiday/calendar
- ทุก `loading.tsx`, `error.tsx`, `layout.tsx` ที่อยู่ใน nested route และ shared UI components ที่หน้าดังกล่าว render

งาน:
- ปรับ container padding จากค่าคงที่ที่กว้างเกินบนมือถือให้ responsive; จำกัด max width เฉพาะเนื้อหาที่เหมาะสม และใช้ `min-w-0`/wrapping เพื่อกันข้อความยาวดัน layout
- ให้ card/grid เป็นหนึ่งคอลัมน์บนมือถือ และเพิ่มคอลัมน์เมื่อพื้นที่รองรับ; รักษาการจัดกลุ่ม/ลำดับข้อมูลเดิม
- ปรับ header, breadcrumbs/back link, page action และ form action ให้ wrap/stack โดย action ยังเห็นได้และ reachable
- ทำสี card, link, button, status badge, border และ muted text ให้สอดคล้องกับ theme tokens; เก็บความต่างสีที่จำเป็นสำหรับ Admin/Staff หรือสถานะ error/success ไว้เฉพาะเมื่อสื่อความหมาย
- ให้ form/modal/error state อยู่ภายใน viewport, input กว้างตาม container, action buttons กดง่าย และ disabled/pending/error states ยังคงเดิม
- ทำให้ skeleton/loading layout ตรงกับ layout จริง เพื่อไม่ให้กระโดดขนาดชัดเจนระหว่างโหลด
- สำหรับทุก route ใน inventory Section 4.2 ให้ใช้เกณฑ์เดียวกันและบันทึกไฟล์ที่แก้ใน commit description/รายงานงาน; ห้ามเลือกไม่ปรับ route เพียงเพราะไม่อยู่ในรายการตัวอย่าง และห้ามสร้าง route ใหม่เพื่อทดแทน route เดิม

เกณฑ์ผ่าน:
- ทุก route ที่ inventory ได้รับการตรวจบน viewport 320px, 375px, 768px และ 1024px
- ไม่มี page-level horizontal overflow; หากข้อมูลตารางกว้าง เลื่อนแนวนอนได้เฉพาะพื้นที่ตารางและยังเข้าถึงทุก field/action ได้
- heading, form labels, error messages, status badges, card titles และ primary actions อ่านได้ครบ ไม่ทับกันหรือถูก clip
- visual style สม่ำเสมอทั้งหน้า Home, Organizations, person creation, Organization settings และ Work Schedule ทุก role/subroute ที่มีอยู่
- ไม่มีการเปลี่ยนเงื่อนไข signed-in/signed-out, query/mutation, form schema, redirect, error code, loading/error handling หรือ link target

### ขั้นตอนที่ 4 — เพิ่ม/ปรับ regression tests

งาน:
- ใช้ Jest และ Testing Library ตาม `ecosystem-frontend-next-js/jest.config.mjs` (jsdom, `tests/**/*.test.ts(x)`); ปรับ test เดิมก่อนสร้าง test ใหม่และทำ mock ตาม conventions จริง
- รักษา test baseline 4 ไฟล์ใน Section 4.5 โดยเฉพาะ holiday rendering/filtering, slot date range/timezone และ create-many holiday-blocking; อย่าเปลี่ยนข้อยืนยันของ business logic เหล่านี้เพื่อให้ responsive test ผ่าน
- เพิ่ม regression tests สำหรับ shared shell/theme consumers และ route component ที่เปลี่ยนโครงสร้าง โดยครอบคลุม heading, link/route target, form/action, pending/disabled state และ loading/error/empty state ที่เกี่ยวข้อง; ให้ใช้ mock provider/query/token ตาม pattern ของ tests ปัจจุบันและไม่เรียก backend จริง
- เพิ่ม assertions ที่ตรวจ responsive utility classes/structure ในหน้าที่แก้ (เช่น mobile padding, grid breakpoints, wrap/stack actions, min-w-0 และ scroll wrapper เฉพาะตาราง) โดยไม่อ้างว่า jsdom ตรวจวัด visual overflow จริงได้; ต้องตรวจทุก route ด้วย code review/class inspection แต่ไม่สร้าง test 90 ชุดซ้ำกันโดยไม่มี value
- เพิ่ม/คง regression coverage ของ conditional auth UI, organization navigation/error-state และ invitation/person form interactions เท่าที่เข้ากับ test setup ที่มีอยู่
- ไม่เพิ่ม Playwright/browser automation dependency เพียงเพื่องานนี้ หาก repository ไม่มี browser test harness อยู่แล้ว; การตรวจด้วย browser จริงไม่ใช่เงื่อนไขที่ Implementor ต้องทำผ่าน CLI

เกณฑ์ผ่าน:
- test ที่เกี่ยวข้องผ่านและมี assertions ต่อ behavior ที่เปลี่ยน/เสี่ยง ไม่ใช่เพียง snapshot กว้าง ๆ; test baseline ทั้ง 4 ไฟล์ยังอยู่และไม่ลด assertions เดิม
- test ไม่ต้องเรียก backend จริง และไม่มี secrets/env จริงจำเป็นสำหรับ unit tests
- ไม่มีการแก้ test เพื่อปิดบัง regression หรือข้าม assertions เดิม

### ขั้นตอนที่ 5 — ตรวจสอบก่อนส่งงาน

รันจาก root repository:
```sh
pnpm run test:frontend
pnpm run lint:frontend
pnpm run typecheck:frontend
pnpm run build:frontend
pnpm run verify
```

เกณฑ์ผ่าน:
- ทุก command ที่ environment สามารถรันได้จบด้วย exit code 0; หาก command ใดทำไม่ได้เพราะ environment/dependency/secret ให้รายงาน command และ output จริงโดยไม่อ้างว่าผ่าน
- `pnpm run verify` ใช้ตรวจแบบเดียวกับ `.github/workflows/ci.yml` ซึ่งติดตั้ง dependencies ด้วย frozen lockfile แล้วเรียก root verification script
- ตรวจ diff รอบสุดท้ายว่าไม่มีการแก้ไฟล์ backend, API contract, database/schema/migration, route behavior หรือ dependencies โดยไม่จำเป็น
- สรุป route ที่ตรวจจริง, test commands ที่รันจริง และผลที่พบ

## 7. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

- แก้ไข `src/app/globals.css` และ `src/app/layout.tsx` เพื่อจัด semantic theme tokens และ shared shell
- ตรวจและปรับเฉพาะ presentation/layout ของ route component ทุก path ใน inventory Section 4.2 (รวม 90 ไฟล์ตาม source snapshot) โดยใช้ Section 4.3 สำหรับ route-local wizard/board/redirect helpers และ Section 4.4 สำหรับ shared UI/feature components ที่จำเป็น
- ครอบคลุมทุก route family: root/fallback/error, Home, Agent, Organizations/settings, Dental Clinic list/wizard, Organization Work Schedule list/create, Person creation, Work Schedule landing/invitations/staff/admin dashboard, position list/detail, min-max, slot-template, slot-type, slot/slot creation flow และ staff-position assignment
- ปรับ loading/error/layout boundary ของ nested routes ให้สอดคล้องกับหน้าหลัก โดยรักษา error boundary, loading skeleton, redirect helper และ UUIDv7 validation; ไม่สร้างหรือเปลี่ยน pathname
- เพิ่ม/แก้ regression tests ภายใต้ `ecosystem-frontend-next-js/tests/` โดยใช้ `jest.config.mjs` และ conventions เดิม; คง test files 4 รายการที่ระบุใน Section 4.5 และเพิ่ม coverage เฉพาะ UI behavior ที่แก้
- ไม่เพิ่ม dependency/browser test framework, ไม่แก้ package/lockfile, backend, API/database/migration, query/mutation contract หรือ CI scripts
- `CURRENT_TASK_PLAN.md` เป็นไฟล์เอกสารที่ Planner ปรับในรอบนี้; เนื่องจากมีการแก้แผน ต้องคงทุกช่อง Approve CURRENT_TASK_PLAN ว่าง และห้าม mark approve ใน commit นี้

## 8. สิ่งที่ต้องระวัง

- ห้ามเปลี่ยน business logic ขณะ refactor className: อย่าย้าย/ลบ conditional branch, handler, hook, query, mutation, Zod/React Hook Form configuration หรือ redirect
- ห้ามเปลี่ยน Clerk behavior, provider order, auth gate, route pathname, URL query parameter, error code, toast contents หรือ role-specific navigation
- ห้ามลบ content หรือใช้ `hidden` เพื่อแก้ overflow; ให้เปลี่ยน wrapping/layout หรือทำ overflow เฉพาะ container ข้อมูลที่จำเป็น
- อย่าตั้ง fixed width ที่เกิน viewport หรือใช้ `w-screen`/fixed positioning โดยไม่จำเป็น; ใช้ `w-full`, `max-w-*`, `min-w-0`, wrapping และ breakpoint utilities ตามบริบท
- อย่าปรับ global button/input primitives จนกระทบทุกหน้าโดยไม่ตรวจ use sites; หากแก้ shared component ต้องรัน test และดู call sites ที่เกี่ยวข้อง
- อย่าเปิด Sidebar ที่ปัจจุบันถูก comment, อย่าเปิด modal/feature ที่ปิดไว้, และอย่าเปลี่ยน Coming Soon state
- อย่าแก้ package/lockfile, backend, database หรือ API เพียงเพื่อรองรับ styling
- อย่ารายงาน visual browser testing ที่ไม่ได้ทำ; Jest/jsdom ใช้ตรวจ DOM/behavior ได้ แต่ไม่ใช่หลักฐานว่าไม่มี overflow จริงบน browser
- ห้ามแต่ง route/file inventory: ใช้รายการ main ที่ยืนยันไว้ใน Section 4.2 แล้วเทียบกับ filesystem ของ working tree; ถ้าแตกต่างให้หยุดและรายงาน Planner ก่อนแก้ code ห้ามข้าม route เงียบ ๆ

## 9. ข้อจำกัดของงาน

- ขอบเขตคือ code, tests และ CI/CLI verification เท่านั้น ไม่รวมการ deploy, เปลี่ยน production config, ทดสอบบนอุปกรณ์จริง หรือการเปลี่ยน business/product policy
- หากระหว่างตรวจพบว่าจำเป็นต้องเปลี่ยน business logic, API contract, route flow หรือเพิ่ม dependency เพื่อทำ UI ให้ responsive ให้หยุดการเปลี่ยนส่วนนั้นและรายงานเหตุผลก่อนขยาย scope
