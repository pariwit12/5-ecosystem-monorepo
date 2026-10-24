# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ปรับหน้า UI ทุกหน้าให้สามารถเปิดในมือถือ และ tablet ได้ด้วยความเรียบร้อยด้วยครับ แล้วก็ต้องการให้เปลี่ยนสไตล์เป็นแนว minimal พร้อมด้วยสีที่ใช้ต้องการให้เป็นสีที่สบายตา ไม่ทำให้ตาล้าด้วยครับ

## 2. ขอบเขตและหลักการ

- ปรับเฉพาะ UI ของ frontend ที่อยู่ใน `ecosystem-frontend-next-js` ให้ responsive สำหรับมือถือและ tablet และใช้ visual style ที่ minimal สบายตาและสม่ำเสมอ
- ต้องครอบคลุมทุก route/page ที่มีอยู่จริงใน `ecosystem-frontend-next-js/src/app` ไม่ใช่เฉพาะหน้า Home หรือหน้า Work Schedule ที่ตรวจเห็นก่อน แนะนำให้เริ่มด้วยคำสั่งนี้เพื่อยืนยัน inventory จาก working tree จริง:
  ```sh
  find ecosystem-frontend-next-js/src/app -type f \\( -name 'page.tsx' -o -name 'client-page.tsx' -o -name 'layout.tsx' -o -name 'loading.tsx' -o -name 'error.tsx' -o -name 'not-found.tsx' \\) -print | sort
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

1. Root layout ครอบแอปด้วย `ClerkProvider` และ `TanStackProvider`; แสดงปุ่ม Sign In เมื่อ signed out และ `UserButton` เมื่อ signed in, พร้อม `OfflineBanner`, `GlobalErrorModal`, `Toaster` และ `ToastNotifier` ซึ่งมีอยู่แล้ว ต้องคงการทำงานทั้งหมดนี้
2. Sidebar ถูก import ไว้ใน `src/app/layout.tsx` แต่ JSX ที่ render `<Sidebar />` ถูก comment อยู่ใน source ที่ตรวจแล้ว ห้ามเปิด sidebar หรือเปลี่ยน navigation behavior โดยอัตโนมัติในงานนี้
3. Home (`src/app/page.tsx`) แยก UI ตามสถานะ signed-in/signed-out; เมื่อ login แล้วมี link ไป `/work-schedule`; card Coming Soon ยัง disabled และ card Toothcraft มี code ที่ comment ไว้ ต้องคงเงื่อนไขและปลายทางเดิม
4. Organizations (`src/app/organizations/page.tsx`) ใช้ `organizationsQueries.lists`, แสดง loading state, จัดการ query-string error toast และนำไป `/organizations/[orgId]/settings`; `CreateOrgModal` อยู่ในหน้านี้ ต้องไม่เปลี่ยน query, ID ที่แสดง, toast หรือ navigation
5. Organization settings ตรวจรูปแบบ UUIDv7 ที่ server component ก่อน render และ redirect ไป `/organizations?error=invalid_id` เมื่อไม่ถูกต้อง; client component ใช้ query/error code สำหรับ redirect; general settings ใช้ React Hook Form/Zod และ mutation เพื่อแก้ชื่อองค์กร ต้องคง validation, request, redirect และ success/error handling
6. Work Schedule (`src/app/work-schedule/page.tsx`) ดึง role/data ผ่าน query; แสดง empty state เมื่อไม่มีสถานที่; แยกสถานที่ของ Admin และ Staff; link ต่อไปยัง admin/staff dashboard และ invitations; เมื่อเจอ `PERSON_NOT_FOUND` จะ redirect ไป `/person/new` ต้องคงการแบ่ง role และ route ทั้งหมด
7. Invitations ใช้ state ของรหัสเชิญ, preview mutation, submit mutation, เคลียร์ข้อมูลเมื่อสำเร็จและ refetch รายการคำเชิญ ต้องคง flow นี้
8. Admin/staff dashboard ใช้ `placeId`, query และ error code เพื่อตรวจสิทธิ์/สถานะสถานที่; หน้าย่อย admin มี navigation ไปจัดการ position/staff; staff page แสดงข้อมูลสถานที่, holiday form/list และ calendar ต้องคงสิทธิ์, query, redirect, forms และข้อมูลเดิม
9. Person creation ใช้ `CreatePersonForm`; เมื่อสำเร็จจะแสดง success toast และกลับ Home; เมื่อผิดพลาดจะแสดง error toast ต้องคง submit, pending/disabled state และปลายทาง
10. `DataStateWrapper`, loading skeletons, offline banner, global error modal และ toast เป็นสถานะระบบที่ต้องยังอ่านได้และใช้งานได้ทุก viewport

## 4. ส่วนของโค้ดที่ตรวจพบก่อนเริ่ม

- `ecosystem-frontend-next-js/src/app/layout.tsx`: header ปัจจุบันใช้ class `bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50`; shell ด้านล่างใช้ `flex flex-1 overflow-hidden` และ `main.flex-1`. ต้องตรวจ header overflow และป้องกัน shell ตัดเนื้อหา/การ scroll บนจอเล็ก
- `ecosystem-frontend-next-js/src/app/globals.css`: import Tailwind/shadcn theme และประกาศ semantic tokens ใน `:root` กับ `.dark`; base layer ตั้ง border, outline, background และ foreground ผ่าน token อยู่แล้ว ควรใช้เป็นแหล่ง theme กลาง
- `ecosystem-frontend-next-js/src/app/page.tsx`: หน้า Home ใช้ `p-8`, fixed heading scale และ card grid `grid grid-cols-1 md:grid-cols-3`; card มีสีและ shadow กำหนดแยกเป็นราย element
- `ecosystem-frontend-next-js/src/app/organizations/page.tsx` และ `src/app/organizations/loading.tsx`: ใช้ `p-8`, card styles และ skeleton grid; loading layout ต้องสอดคล้องกับหน้า content ทั้งขนาด container และ breakpoint
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/settings/client-page.tsx` และ `.../settings/general/client-page.tsx`: มี header ที่แบ่งปุ่มย้อนกลับ/หัวข้อ/action ด้วย flex และมี card/forms; ตรวจ wrap/stack และการย่อข้อความบนมือถือ
- `ecosystem-frontend-next-js/src/app/person/new/client-page.tsx` กับ `src/features/person/components/create-person-form.tsx`: ใช้ `p-8`, header แบบ flex และ action buttons แบบวางบรรทัดเดียว; จัด padding และ action controls ให้เหมาะกับมือถือโดยรักษา form submit behavior
- `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx`: มี responsive grid อยู่แล้ว (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) แต่ header และ link invitations รวมถึงสีของ Admin/Staff ยังต้องตรวจ overflow/ความสม่ำเสมอ
- `ecosystem-frontend-next-js/src/app/work-schedule/invitations/client-page.tsx`, `src/app/work-schedule/admin/[placeId]/client-page.tsx`, `src/app/work-schedule/admin/[placeId]/position/client-page.tsx`, `src/app/work-schedule/staff/[placeId]/client-page.tsx` และ route component ที่ค้นพบเพิ่มจาก inventory: ตรวจ header, menu grid, form, calendar, tables/lists และ control ของแต่ละหน้าที่มีอยู่จริง
- Shared components ที่ตรวจยืนยันแล้ว ได้แก่ `src/components/data-state-wrapper.tsx`, `src/components/use-by-layout/global-error-modal.tsx`, `src/components/use-by-layout/offline-banner.tsx`, `src/components/use-by-layout/sidebar.tsx`, `src/features/organizations/components/create-organization-modal.tsx` และ `src/components/ui/button.tsx`; แก้เฉพาะส่วน presentation ที่จำเป็นและมีผลจริง
- `package.json` ที่ root มี scripts สำหรับ frontend test/lint/typecheck/build และ `.github/workflows/ci.yml` รัน `pnpm install --frozen-lockfile` ตามด้วย `pnpm run verify`; ใช้ commands ที่มีอยู่เป็นเกณฑ์ตรวจ ไม่เปลี่ยน scripts โดยไม่มีเหตุผลที่จำเป็น

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
- รันคำสั่ง inventory ในหัวข้อ 2 กับ working tree จริง
- ตรวจทุก `page.tsx`, `client-page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` และ `not-found.tsx` ที่พบ รวมถึง component ที่หน้าเหล่านั้นใช้; ไล่ตาม link/navigation ที่อยู่ใน UI เพื่อไม่พลาด route ที่มีอยู่
- ค้น class ที่อาจก่อปัญหาบน viewport เล็ก เช่น fixed padding/width, single-row flex, grid columns ที่ไม่ responsive, `overflow-hidden`, long ID/text, form action groups และ table/container ที่กว้าง
- สำรวจรูปแบบ Jest/Testing Library และ test ที่มีอยู่ก่อนเพิ่มหรือแก้ test

เกณฑ์ผ่าน:
- มีการตรวจ route inventory จาก working tree จริงครบทั้ง frontend และไม่มีการเดาชื่อไฟล์ route ที่ยังไม่ยืนยัน
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

ไฟล์ที่ยืนยันว่ามีอยู่และควรตรวจ/ปรับตามความจำเป็น:
- `ecosystem-frontend-next-js/src/app/page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/loading.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/settings/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/organizations/[orgId]/settings/general/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/person/new/client-page.tsx`
- `ecosystem-frontend-next-js/src/features/person/components/create-person-form.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/invitations/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/client-page.tsx`
- `ecosystem-frontend-next-js/src/app/work-schedule/staff/[placeId]/client-page.tsx`
- `ecosystem-frontend-next-js/src/components/data-state-wrapper.tsx`
- `ecosystem-frontend-next-js/src/components/use-by-layout/global-error-modal.tsx`
- `ecosystem-frontend-next-js/src/components/use-by-layout/offline-banner.tsx`
- `ecosystem-frontend-next-js/src/features/organizations/components/create-organization-modal.tsx`
- route UI และ shared component อื่นทุกไฟล์ที่ยืนยันจาก inventory จริงในขั้นตอนที่ 1

งาน:
- ปรับ container padding จากค่าคงที่ที่กว้างเกินบนมือถือให้ responsive; จำกัด max width เฉพาะเนื้อหาที่เหมาะสม และใช้ `min-w-0`/wrapping เพื่อกันข้อความยาวดัน layout
- ให้ card/grid เป็นหนึ่งคอลัมน์บนมือถือ และเพิ่มคอลัมน์เมื่อพื้นที่รองรับ; รักษาการจัดกลุ่ม/ลำดับข้อมูลเดิม
- ปรับ header, breadcrumbs/back link, page action และ form action ให้ wrap/stack โดย action ยังเห็นได้และ reachable
- ทำสี card, link, button, status badge, border และ muted text ให้สอดคล้องกับ theme tokens; เก็บความต่างสีที่จำเป็นสำหรับ Admin/Staff หรือสถานะ error/success ไว้เฉพาะเมื่อสื่อความหมาย
- ให้ form/modal/error state อยู่ภายใน viewport, input กว้างตาม container, action buttons กดง่าย และ disabled/pending/error states ยังคงเดิม
- ทำให้ skeleton/loading layout ตรงกับ layout จริง เพื่อไม่ให้กระโดดขนาดชัดเจนระหว่างโหลด
- สำหรับ route ที่ได้จาก inventory แต่ไม่อยู่ในรายการข้างต้น ให้ใช้เกณฑ์เดียวกันและบันทึกว่าแก้ไฟล์ใดใน commit description/รายงานงาน ไม่สร้าง route ใหม่เพื่อทดแทน route เดิม

เกณฑ์ผ่าน:
- ทุก route ที่ inventory ได้รับการตรวจบน viewport 320px, 375px, 768px และ 1024px
- ไม่มี page-level horizontal overflow; หากข้อมูลตารางกว้าง เลื่อนแนวนอนได้เฉพาะพื้นที่ตารางและยังเข้าถึงทุก field/action ได้
- heading, form labels, error messages, status badges, card titles และ primary actions อ่านได้ครบ ไม่ทับกันหรือถูก clip
- visual style สม่ำเสมอทั้งหน้า Home, Organizations, person creation, Organization settings และ Work Schedule ทุก role/subroute ที่มีอยู่
- ไม่มีการเปลี่ยนเงื่อนไข signed-in/signed-out, query/mutation, form schema, redirect, error code, loading/error handling หรือ link target

### ขั้นตอนที่ 4 — เพิ่ม/ปรับ regression tests

งาน:
- ใช้ Jest และ Testing Library ตาม dependency/test setup ที่มีอยู่; ปรับ test เดิมก่อนสร้าง test ใหม่ และทำ mock ตาม conventions ของ repository
- เพิ่ม test สำหรับ shared shell/component และหน้าหลักที่มีการเปลี่ยนโครงสร้าง เพื่อยืนยันว่า heading, link, form/action สำคัญ และ loading/error/empty states ยัง render ตามเดิม
- เพิ่ม assertions ที่ตรวจ responsive utility classes/structure ที่เป็นส่วนของ requirement (เช่น responsive grid, wrapping/header container และ mobile-friendly action layout) โดยไม่อ้างว่า jsdom ตรวจวัด visual overflow จริงได้
- เพิ่ม/คง regression coverage ของ conditional auth UI, organization navigation/error-state และ invitation/person form interactions เท่าที่เข้ากับ test setup ที่มีอยู่
- ไม่เพิ่ม Playwright/browser automation dependency เพียงเพื่องานนี้ หาก repository ไม่มี browser test harness อยู่แล้ว; การตรวจด้วย browser จริงไม่ใช่เงื่อนไขที่ Implementor ต้องทำผ่าน CLI

เกณฑ์ผ่าน:
- test ที่เกี่ยวข้องผ่านและมี assertions ต่อ behavior ที่เปลี่ยน/เสี่ยง ไม่ใช่เพียง snapshot กว้าง ๆ
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

- แก้ไขไฟล์ CSS/theme และ shared shell ที่มีอยู่ โดยเฉพาะ `src/app/globals.css` และ `src/app/layout.tsx`
- แก้ไขเฉพาะ route/page/client component และ shared UI component ที่ inventory/ตรวจโค้ดยืนยันว่าจำเป็นต่อ responsive behavior; รายการไฟล์ต้องสอดคล้องกับ actual inventory ไม่เพิ่ม path โดยการคาดเดา
- เพิ่มหรือแก้ test files เฉพาะตามรูปแบบที่มีอยู่จริงเพื่อทดสอบ regressions; ไม่มี dependency เพิ่มถ้าไม่จำเป็น
- ไม่สร้างหรือลบ route, ไม่สร้าง design system แยกชุดใหม่ และไม่แก้ไฟล์ backend/API/database/migration
- `CURRENT_TASK_PLAN.md` เป็นไฟล์เอกสารที่ Planner ปรับในรอบนี้; `VERIFICATION_TABLE.md` ต้องคงช่อง Approve CURRENT_TASK_PLAN ว่างทั้งหมดในรอบที่แก้แผน ห้าม mark approve ใน commit นี้

## 8. สิ่งที่ต้องระวัง

- ห้ามเปลี่ยน business logic ขณะ refactor className: อย่าย้าย/ลบ conditional branch, handler, hook, query, mutation, Zod/React Hook Form configuration หรือ redirect
- ห้ามเปลี่ยน Clerk behavior, provider order, auth gate, route pathname, URL query parameter, error code, toast contents หรือ role-specific navigation
- ห้ามลบ content หรือใช้ `hidden` เพื่อแก้ overflow; ให้เปลี่ยน wrapping/layout หรือทำ overflow เฉพาะ container ข้อมูลที่จำเป็น
- อย่าตั้ง fixed width ที่เกิน viewport หรือใช้ `w-screen`/fixed positioning โดยไม่จำเป็น; ใช้ `w-full`, `max-w-*`, `min-w-0`, wrapping และ breakpoint utilities ตามบริบท
- อย่าปรับ global button/input primitives จนกระทบทุกหน้าโดยไม่ตรวจ use sites; หากแก้ shared component ต้องรัน test และดู call sites ที่เกี่ยวข้อง
- อย่าเปิด Sidebar ที่ปัจจุบันถูก comment, อย่าเปิด modal/feature ที่ปิดไว้, และอย่าเปลี่ยน Coming Soon state
- อย่าแก้ package/lockfile, backend, database หรือ API เพียงเพื่อรองรับ styling
- อย่ารายงาน visual browser testing ที่ไม่ได้ทำ; Jest/jsdom ใช้ตรวจ DOM/behavior ได้ แต่ไม่ใช่หลักฐานว่าไม่มี overflow จริงบน browser
- ห้ามแต่ง route/file inventory: ให้ยึดผลจาก filesystem ของ working tree ที่ Implementor ได้รับ และระบุข้อจำกัดถ้าไม่สามารถตรวจ route ใดได้

## 9. ข้อจำกัดของงาน

- ขอบเขตคือ code, tests และ CI/CLI verification เท่านั้น ไม่รวมการ deploy, เปลี่ยน production config, ทดสอบบนอุปกรณ์จริง หรือการเปลี่ยน business/product policy
- หากระหว่างตรวจพบว่าจำเป็นต้องเปลี่ยน business logic, API contract, route flow หรือเพิ่ม dependency เพื่อทำ UI ให้ responsive ให้หยุดการเปลี่ยนส่วนนั้นและรายงานเหตุผลก่อนขยาย scope
