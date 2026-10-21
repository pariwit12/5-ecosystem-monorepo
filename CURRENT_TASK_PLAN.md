# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ปรับหน้า UI ของโปรแกรม Work-Schedule ให้เรียบร้อยพร้อมสำหรับใช้งานจริง

## 2. ขอบเขตงานและข้อจำกัด

- เป้าหมายหลักคือปรับปรุง UI ของ Work-Schedule ใน Next.js Frontend ปัจจุบัน ไม่ใช่แอป Express/React รุ่นเก่า
- ผู้ใช้อนุญาตให้ปรับ `AGENTS.md` และเอกสารใน `docs/` ได้ทั้งหมด แต่ให้แก้เฉพาะเอกสารที่จำเป็นต่อการอธิบายหรือรักษาขอบเขตงานนี้ ห้ามแก้เอกสาร migration ที่ไม่เกี่ยวข้องเพียงเพราะได้รับอนุญาตให้แก้ได้
- เน้นงานนำเสนอ (layout, spacing, responsive behavior, typography, visual consistency, accessible controls) และรักษา Business Logic, API calls, authentication, redirects, role grouping, query/cache behavior และเส้นทาง navigation เดิม เว้นแต่จำเป็นต้องแก้เพื่อให้ UI ใช้งานได้และมีหลักฐานรองรับ
- ห้ามเพิ่ม backend endpoint, เปลี่ยน schema/database, เปลี่ยน access-control, เปลี่ยนสิทธิ์ของ Admin/Staff หรือสร้างฟังก์ชันการทำงานใหม่ที่ไม่ได้มีอยู่ในโค้ด
- ใช้ component และ styling convention ที่มีอยู่ใน frontend ก่อนเพิ่ม dependency หรือสร้าง design system ใหม่
- ไม่แก้ตัวอย่างใน `docs/snippets/work-schedule/` ให้กลายเป็น runtime implementation; snippets เป็นตัวอย่างเอกสารและอยู่นอก `src/`
- หากระหว่างตรวจโค้ดพบว่าการปรับ UI ต้องตัดสินใจเรื่อง Business Logic, ปลายทางของลิงก์ Staff หรือพฤติกรรมที่ยังไม่ชัดเจน ให้หยุดและถามผู้ใช้ก่อน ไม่ให้ Implementor คิดแทน

## 3. Business Logic ก่อนเริ่ม

### หน้าเลือกสถานที่ทำงาน

ไฟล์ `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx` ทำงานดังนี้ตามโค้ดที่ตรวจแล้ว:

1. ใช้ Clerk `useAuth()` เพื่ออ่าน `getToken`, `userId`, `isLoaded` และเรียก React Query ผ่าน `workScheduleLogInQueries.userRolesByClerkId(userId, getToken, [ErrorCode.PERSON_NOT_FOUND])`
2. หาก query พบ `PERSON_NOT_FOUND` จะ redirect ไป `/person/new?error=...` และแสดงข้อความระหว่าง redirect เพื่อป้องกัน UI flash
3. แสดง `DataStateWrapper` ตามสถานะ auth/query; เมื่อ fetch ซ้ำล้มเหลวแต่มีข้อมูลเดิม จะแสดง toast แจ้งผู้ใช้ว่าดูข้อมูลเดิมได้
4. แยกข้อมูลเป็น `placesAsAdmin` และ `placesAsStaff` โดย fallback เป็น array ว่าง
5. ถ้าไม่มีสถานที่ทั้งสองกลุ่ม แสดง empty state
6. ถ้ามีข้อมูล แสดงการ์ด Admin และ Staff แยกกลุ่มกัน การ์ด Admin นำไป `/work-schedule/admin/${place.id}`; ลิงก์ Staff ปัจจุบันชี้ไป `/` และมี comment ว่าให้ปรับตามการใช้งานจริง จึงห้ามเปลี่ยนปลายทางเองโดยไม่มีข้อกำหนดเพิ่ม

### หน้าเมนูผู้ดูแลของสถานที่

ไฟล์ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/page.tsx` อ่าน `placeId` จาก route params แล้วส่งให้ client component โดยไม่ได้เพิ่ม logic อื่น

ไฟล์ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/layout.tsx` ตรวจรูปแบบ `placeId` ด้วย regex UUIDv7 และ redirect ไป `/work-schedule?error=${PageErrorList.INVALID_ID}` เมื่อไม่ถูกต้อง ต้องรักษาการตรวจนี้ไว้

ไฟล์ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/client-page.tsx` แสดงหน้า Admin Mode และลิงก์หลักสองรายการ:
- จัดการตารางเวร: `/work-schedule/admin/${placeId}/position`
- จัดการพนักงาน: `/work-schedule/admin/${placeId}/staff`

ต้องคง href และค่า `placeId` ที่ส่งต่อไว้เหมือนเดิม

### รูปแบบโครงการที่เกี่ยวข้อง

- Frontend คือ Next.js App Router, React และ TypeScript; package มี Tailwind CSS, `lucide-react`, shadcn/Radix UI และ Sonner อยู่แล้ว
- Root scripts ที่ยืนยันจาก `package.json`: `pnpm run typecheck:frontend`, `pnpm run lint:frontend`, `pnpm run build:frontend` และ `pnpm run verify`
- `AGENTS.md` กำหนดให้รักษา behavior เดิม, เพิ่ม/ปรับ test สำหรับ behavior ที่ไม่ trivial, รัน checks ที่เกี่ยวข้อง และไม่ commit โดยอัตโนมัติใน workflow ที่แก้ไฟล์ local
- `docs/README.md` อธิบายว่า `docs/snippets/` เก็บตัวอย่างที่ยังไม่สมบูรณ์และอยู่นอก application compilation

## 4. Business Logic ที่คาดหวังหลัง Implement

- ข้อมูลและการแบ่งกลุ่ม Admin/Staff ต้องมาจาก query และ fields เดิม ไม่สร้างข้อมูลจำลองเพื่อใช้แทนข้อมูลจริง
- Authentication loading, query loading/error, redirect เมื่อ `PERSON_NOT_FOUND`, toast เมื่อ refresh ล้มเหลวแต่ยังมีข้อมูลเดิม และ empty state ต้องยังทำงานเหมือนเดิม
- การ์ดสถานที่ Admin ยังคงเปิดหน้า admin ของสถานที่ที่เลือก; การ์ดเมนู Admin ยังคงเปิด route ของ position และ staff ตามเดิม
- ลิงก์ Staff คงปลายทางปัจจุบัน `/` จนกว่าจะมีการตัดสินใจจากผู้ใช้
- การเปลี่ยนแปลงหลักเป็นการปรับความอ่านง่าย ความสม่ำเสมอ การจัดวาง และ responsive UI ไม่ใช่การเปลี่ยน workflow หรือสิทธิ์
- เหตุผล: ลดความเสี่ยงที่งาน UI จะทำให้ authentication, route protection, data fetching หรือ workflow ตารางงานที่มีอยู่เสียหาย

## 5. โครงสร้างไฟล์ที่คาดหวัง

### ไฟล์ที่คาดว่าต้องแก้

1. `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx`
   - ปรับ UI ของหน้าเลือกสถานที่ทำงาน, header, empty state และการ์ด Admin/Staff ให้เป็นระบบและ responsive
   - รักษา query, redirect, toast, DataStateWrapper, data fields และ href เดิม
2. `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/client-page.tsx`
   - ปรับ UI หน้าเมนูผู้ดูแลให้มี header, card hierarchy, spacing และ responsive layout ที่สอดคล้องกับหน้า Work-Schedule
   - รักษาข้อความ/ความหมายของเมนู, `placeId` และ href เดิม เว้นแต่การเปลี่ยนข้อความเป็นเพียงการปรับความชัดเจนโดยไม่เปลี่ยนความหมาย

### ไฟล์ที่อาจแก้เมื่อมีเหตุผลจากการตรวจโค้ด

- `AGENTS.md`: เพิ่มข้อกำหนดเฉพาะสำหรับงาน UI/การรักษา behavior ได้หากจำเป็นและไม่ขัดกับคำสั่งเดิม
- `docs/README.md` หรือ `docs/development.md`: อัปเดตเฉพาะเมื่อจำเป็นต้องบันทึก workflow หรือคำสั่งตรวจสอบที่เปลี่ยนจริง
- test files ที่มีอยู่ของหน้า/feature ที่ได้รับผลกระทบ: ปรับหรือเพิ่มเฉพาะตามโครงสร้าง test ที่พบจริง
- shared component หรือ stylesheet: แก้ได้เมื่อยืนยันแล้วว่าหน้าทั้งสองใช้ร่วมกันและการแก้ไม่ทำให้หน้าอื่นเสียหาย

### ไฟล์ที่ไม่ควรแก้โดยไม่มีหลักฐานว่าจำเป็น

- Backend, Prisma schema/migrations, API contracts และ access-control
- `VERIFICATION_TABLE.md`: เนื่องจากมีการแก้ไขแผนในรอบนี้ ให้ reset เครื่องหมายทุกช่องในแถว `Approve CURRENT_TASK_PLAN` เป็นว่างทั้งหมด และห้ามลงอนุมัติในรอบเดียวกับการแก้แผน
- เอกสาร migration ที่ไม่เกี่ยวข้อง
- `docs/snippets/work-schedule/*` เว้นแต่ต้องแก้ตัวอย่างเพื่อให้เอกสารอธิบาย implementation ปัจจุบันได้ถูกต้อง โดยไม่ย้าย snippet เข้า `src/`

## 6. รายละเอียดงานตามลำดับ

### ขั้นที่ 1: ตรวจ UI และส่วนประกอบที่ใช้ร่วมกัน

- อ่านไฟล์หน้า Work-Schedule, หน้า Admin, shared layout/styles และ UI components ที่จะใช้จริงก่อนแก้
- ตรวจ route ย่อยและ tests ที่เกี่ยวข้อง เพื่อไม่ให้การปรับ UI ไปเปลี่ยนเส้นทางหรือ flow ที่มีอยู่
- เลือกใช้ component/style convention ที่มีอยู่; หลีกเลี่ยงการเพิ่ม dependency
- **เกณฑ์ผ่าน:** รายการไฟล์ที่จะเปลี่ยนมีเหตุผลจากโค้ดจริง และไม่มีการสมมติ API/field/route ใหม่

### ขั้นที่ 2: ปรับหน้าเลือกสถานที่ทำงาน

- จัด header และเนื้อหาให้มีลำดับชั้นชัดเจนและแสดงผลได้ดีทั้งจอเล็กและจอใหญ่
- ปรับ empty state ให้สื่อว่าผู้ใช้ยังไม่มีสถานที่ทำงาน โดยไม่แสดงปุ่มสร้างที่ไม่มี handler/route รองรับ
- ปรับการ์ด Admin/Staff ให้ชื่อสถานที่และ action อ่านง่าย, พื้นที่กดเหมาะสม และมี focus state ที่มองเห็นได้
- รักษาสถานะ loading/fetching/error และการแยกกลุ่ม Admin/Staff
- **เกณฑ์ผ่าน:** สถานะทั้ง empty, loading, error, stale data และมีสถานที่ยังสื่อสารได้ครบ; href และ data mapping ไม่เปลี่ยน

### ขั้นที่ 3: ปรับหน้าเมนู Admin

- ทำให้ header, ปุ่มกลับ, badge Admin Mode และเมนูทั้งสองมีลำดับชั้นและการจัดวางสอดคล้องกัน
- ตรวจ responsive layout, keyboard focus, contrast และข้อความที่ไม่ล้นใน viewport แคบ
- รักษาลิงก์ไป position/staff และไม่เพิ่มเมนูที่ไม่มี route/implementation
- **เกณฑ์ผ่าน:** ทั้งสองเมนูยังไป route เดิมด้วย `placeId` ที่ถูกต้อง และหน้าใช้งานได้ในขนาดหน้าจอแคบ/กว้าง

### ขั้นที่ 4: เอกสารและคำแนะนำสำหรับ Agent

- แก้ `AGENTS.md` หรือเอกสารใน `docs/` เฉพาะเมื่อช่วยให้ขอบเขต UI, วิธีตรวจสอบ หรือข้อจำกัดที่ค้นพบชัดเจนขึ้น
- ห้ามเขียนว่า test ผ่านหากไม่ได้รันจริง และห้ามบันทึกคำสั่งที่ไม่มีใน package scripts
- **เกณฑ์ผ่าน:** เอกสารตรงกับโค้ดและคำสั่งจริง ไม่มีการเปลี่ยนเนื้อหา migration ที่ไม่เกี่ยวข้อง

### ขั้นที่ 5: ตรวจสอบผลลัพธ์

- ดู `git diff` และ `git status` เพื่อยืนยันว่าไม่มีไฟล์ไม่เกี่ยวข้องถูกเปลี่ยน
- รัน checks ตามลำดับในหัวข้อ 8
- **เกณฑ์ผ่าน:** typecheck, lint และ build ของ frontend ผ่าน; ไม่มี regression ของ routes, query, redirect หรือ role grouping; ถ้าคำสั่งใดรันไม่ได้ ให้รายงานเหตุผลจริงและอย่าอ้างว่าผ่าน

## 7. ข้อควรระวังสำหรับ Implementor

- ห้ามย้าย query หรือ auth logic เพียงเพื่อจัด markup ใหม่ หากไม่จำเป็น
- ห้ามลบ `DataStateWrapper`, error handling, redirect, toast หรือ fetching indicator
- ห้ามเปลี่ยน `ErrorCode.PERSON_NOT_FOUND`, `PageErrorList.INVALID_ID` หรือ regex UUIDv7 ในงาน UI นี้
- ห้ามเปลี่ยน URL ของลิงก์ Admin, Staff, Position หรือ Staff management โดยพลการ
- ห้ามทำให้การ์ด/ปุ่มที่ดูเหมือนกดได้ไม่มี action จริง และห้ามเพิ่ม action ปลอม
- หากเปลี่ยน native link เป็น component อื่น ต้องรักษา semantics, keyboard navigation และ accessible name
- หลีกเลี่ยงสี/spacing แบบ hard-code ที่ขัดกับ tokens หรือ patterns ที่มีอยู่; ตรวจ `globals.css` และ shared UI ก่อนเพิ่ม style ใหม่
- อย่าแก้ shared styles แบบกว้างจนกระทบหน้าระบบอื่น; หากจำเป็นต้องแก้ global style ต้องมีเหตุผลชัดเจนและตรวจผลกระทบ
- ห้ามเพิ่ม package โดยไม่จำเป็น และไม่แก้ lockfile หากไม่มีการเปลี่ยน dependency
- อย่าแก้ migration docs, backend หรือ database เพราะอยู่นอกขอบเขต
- ห้ามเพิ่ม snapshot/visual test framework ใหม่เพียงเพื่อ task นี้ หาก repository ไม่มีอยู่แล้ว; ใช้ checks ที่มีและ tests ที่โครงสร้างปัจจุบันรองรับ

## 8. Tests และคำสั่งตรวจสอบ

รันจาก repository root:

```bash
pnpm run typecheck:frontend
pnpm run lint:frontend
pnpm run build:frontend
```

จากนั้น หากไม่มีเหตุขัดข้องและสภาพแวดล้อมพร้อม ให้รัน:

```bash
pnpm run verify
```

- `pnpm run verify` รวม checks ของ backend, frontend, Prisma และ migration จึงอาจต้องใช้ environment ที่เหมาะสม; ห้ามใช้คำสั่งที่เปลี่ยน shared/production database
- ตรวจ tests ที่มีอยู่จริงภายใต้ frontend ก่อนเลือกคำสั่ง test เฉพาะ; package frontend ที่ตรวจพบมี scripts `dev`, `build`, `start`, `typecheck`, `lint` แต่ไม่มี script `test` ที่ประกาศใน package.json
- หากเพิ่ม/แก้ test ให้ใช้ test runner ที่ repository มีอยู่จริง ห้ามสมมติว่ามี runner หรือเพิ่ม dependency โดยไม่มีเหตุผล
- การทดสอบ responsive/visual ใน browser ที่ environment ไม่มีให้ทำ ให้ระบุเป็นข้อจำกัดและขอให้ผู้ใช้ตรวจด้วยตนเอง แทนการอ้างว่าทดสอบแล้ว

## 9. Definition of Done

- [ ] หน้า `/work-schedule` ได้รับการปรับ UI โดยรักษา query, auth/error behavior, role grouping และ href เดิม
- [ ] หน้า `/work-schedule/admin/[placeId]` ได้รับการปรับ UI โดยรักษา validation และ navigation เดิม
- [ ] Layout รองรับ viewport แคบและกว้าง พร้อม keyboard focus ที่มองเห็นได้
- [ ] ไม่มี backend, schema, access-control หรือ business workflow เปลี่ยนโดยไม่ได้รับอนุญาต
- [ ] เอกสารที่แก้มีความจำเป็นและสอดคล้องกับโค้ดจริง
- [ ] ตรวจ diff แล้วไม่มีการเปลี่ยนแปลงนอกขอบเขต
- [ ] รายงานผล typecheck/lint/build/test ตามที่รันจริง
- [ ] `VERIFICATION_TABLE.md` แถว `Approve CURRENT_TASK_PLAN` ถูก reset เป็นช่องว่างทั้งหมดในรอบที่แก้แผน

## Implementation Progress

### รอบ Implementor: 2026-10-21

- อ่านแผนและโค้ดจริงจาก branch `main` ของ GitHub เนื่องจากไม่มีไฟล์ repository ใน environment นี้
- ปรับ `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx`: ปรับ header, empty state, responsive card grid, spacing และ focus-visible states; คง Clerk auth, React Query, redirect `PERSON_NOT_FOUND`, toast, `DataStateWrapper`, role grouping, data fields และ href เดิม รวมถึงลิงก์ Staff ไป `/`.
- ปรับ `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/client-page.tsx`: ปรับ header, Admin Mode badge, menu card hierarchy, responsive layout และ focus-visible states; คงข้อความ/ความหมายเมนู, `placeId` และ href ไป `position` และ `staff` เดิม.
- ตรวจอ่าน `globals.css`, `DataStateWrapper`, frontend `package.json` และ root `package.json`; ใช้ Tailwind tokens/conventions ที่มีอยู่ ไม่เพิ่ม dependency หรือเปลี่ยน global style.
- ไม่เปลี่ยน business logic, API, authentication, validation/UUIDv7 redirect, role/access control หรือ navigation destinations.
- การเปลี่ยนแปลงถูกบันทึกเป็น commits บน `main`: `86ccc51` (หน้าเลือกสถานที่) และ `c72e7b1` (หน้า Admin menu).
- ข้อจำกัดการตรวจสอบ: environment นี้ไม่มี working copy/local CLI จึงยังไม่ได้รัน typecheck, lint, build หรือ `pnpm run verify`; GitHub status ที่ตรวจหลัง commit `c72e7b1` แสดง Vercel เป็น `pending`. ยังไม่อ้างว่าการทดสอบผ่าน และยังไม่ทำเครื่องหมาย Coding Agent Check Complete จนกว่าจะมีผลตรวจที่ยืนยันได้.
- ยังไม่ได้แก้เอกสารอื่นหรือเพิ่ม tests เนื่องจากไม่พบ test script ใน `ecosystem-frontend-next-js/package.json` และไม่มี local environment สำหรับรัน checks.

### รอบ Implementor: 2026-10-21 (ตรวจสอบต่อ)

- อ่านซ้ำไฟล์ runtime ทั้งสองหน้า, `layout.tsx`, route `page.tsx`, `globals.css`, `AGENTS.md` และ frontend `package.json` จาก `main`; ยืนยันว่าหน้า UI ที่แผนระบุถูกปรับแล้ว และ UUIDv7 validation/redirect กับ navigation destinations ยังอยู่ตามเดิม
- ตรวจ branch head ปัจจุบัน: `fb374682327caa35fdfac1d2ca33af15344e7960` (commit บันทึก progress) และตรวจ combined status ของ `c72e7b1`; พบ Vercel ยังเป็น `pending`
- ไม่มี working copy หรือ CLI ใน environment นี้ จึงไม่สามารถรัน typecheck/lint/build/verify หรือยืนยันผล visual browser ได้; ไม่ทำเครื่องหมาย Coding Agent Check Complete เพราะเกณฑ์ตรวจสอบยังไม่มีหลักฐานว่าผ่าน
- ไม่พบประเด็น Business Logic ใหม่ที่ต้องถามผู้ใช้ และไม่ได้เปลี่ยนโค้ด runtime ในรอบตรวจสอบนี้


### รอบ Implementor: 2026-10-21 (ยืนยันสถานะล่าสุด)

- อ่านไฟล์ runtime จริงจาก branch `main` อีกครั้ง ได้แก่ `ecosystem-frontend-next-js/src/app/work-schedule/page.tsx`, `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/client-page.tsx` และ `layout.tsx`; ยืนยันว่าการปรับ UI ตามแผนมีอยู่แล้ว และ validation UUIDv7/redirect ยังอยู่
- อ่าน `ecosystem-frontend-next-js/package.json`; ยืนยันว่ามี scripts `typecheck`, `lint`, `build` ภายในแพ็กเกจ แต่ environment ปัจจุบันไม่มี working copy/CLI สำหรับรันคำสั่งเหล่านี้
- ตรวจ combined status ของ commit ปัจจุบัน `fb374682327caa35fdfac1d2ca33af15344e7960`; GitHub แสดง Vercel เป็น `success` (เป็นผล deployment/status check ไม่ใช่หลักฐานว่า typecheck/lint ผ่าน)
- ไม่เปลี่ยน runtime code เพิ่ม เพราะ implementation ที่แผนระบุมีอยู่แล้ว และไม่พบเหตุผลที่มีหลักฐานรองรับให้เปลี่ยน Business Logic หรือ navigation
- ยังไม่ทำเครื่องหมาย `Coding Agent Check Complete Implement` ใน `VERIFICATION_TABLE.md` เนื่องจากยังไม่มีผลยืนยัน typecheck/lint/build และการตรวจ responsive ใน browser; ไม่อ้างว่าการตรวจเหล่านี้ผ่าน


### รอบ Implementor: 2026-10-21 (ตรวจสอบตามคำขอล่าสุด)

- อ่านแผน `CURRENT_TASK_PLAN.md` และไฟล์ runtime จริงจาก `main` อีกครั้ง: หน้าเลือกสถานที่, หน้าเมนู Admin, `layout.tsx` สำหรับ UUIDv7 validation และ `package.json` ของ frontend/root
- ยืนยันว่า UI ตามขอบเขตแผนมีอยู่ในโค้ดปัจจุบันแล้ว: responsive grids, header/empty state, focus-visible styles, Admin/Staff grouping และ href เดิม; ไม่พบเหตุผลที่มีหลักฐานรองรับให้แก้ runtime เพิ่มในรอบนี้
- ตรวจ GitHub commit ล่าสุดที่พบ `cd2882c4cf3a7a8f073eaa0c620a5f3851bf9b32`; combined status แสดง Vercel `success`. สถานะนี้ยืนยันเฉพาะ check ของ Vercel ไม่ใช่ผล typecheck/lint/build โดยตรง
- Environment นี้ไม่มี working copy/local CLI จึงยังรัน `pnpm run typecheck:frontend`, `pnpm run lint:frontend`, `pnpm run build:frontend` หรือ `pnpm run verify` ไม่ได้ และยังยืนยัน responsive behavior ใน browser ไม่ได้
- ไม่เปลี่ยน Business Logic, API, auth, redirect, role grouping, UUIDv7 validation หรือ navigation; ไม่ทำเครื่องหมาย Coding Agent Check Complete เพราะยังไม่มีหลักฐานผลตรวจครบตามเกณฑ์แผน


### รอบ Implementor: 2026-10-21 (ตรวจสอบเบื้องต้นผ่าน GitHub Actions)

- ตามคำขอผู้ใช้ ให้ใช้ workflow CI ที่มีอยู่ใน `.github/workflows/ci.yml` ซึ่ง trigger เมื่อ push ไป `main` หรือเปิด PR เข้า `main`; workflow ติดตั้ง dependencies ด้วย `pnpm install --frozen-lockfile` แล้วรัน `pnpm run verify`.
- บันทึก progress นี้บน `main` เพื่อให้ CI workflow ที่กำหนด trigger แบบ push เริ่มตรวจสอบ repository ได้ โดยไม่ได้แก้ runtime code หรือเปลี่ยน Business Logic.
- ต้องตรวจสอบผล run/check ของ commit นี้ก่อนสรุปว่า test ผ่าน; Vercel status เพียงอย่างเดียวไม่ใช่หลักฐานของ `pnpm run verify` และยังไม่ทำเครื่องหมาย `Coding Agent Check Complete Implement` จนกว่าจะเห็นผล CI ที่ยืนยันได้.


### รอบ Implementor: 2026-10-21 (ผล GitHub Actions ไม่ผ่าน)

- ตรวจ GitHub Actions run [#39565834945](https://github.com/pariwit12/5-ecosystem-monorepo/actions/runs/39565834945) ของ commit `b38310a0a4514b53e5e1d1e9f35e185d6938ac5a`: workflow `CI` จบด้วย `failure`; checkout, setup pnpm, setup Node.js และติดตั้ง dependencies ผ่าน แต่ขั้น `pnpm run verify` ไม่ผ่าน
- จาก job log, migration tests ผ่าน 35/36; test ที่ล้มคือ `rejects missing acknowledgement and repository-local files` ใน `ecosystem-backend-nest-js/scripts/migration/identity-apply-safety.test.mjs:41`, โดย assertion บรรทัด 50 แจ้ง `Missing expected exception.` การทดสอบส่ง path แบบ Windows (`D:\\repo\\private\\identity.json`) แต่ CI ใช้ `ubuntu-latest`; ฟังก์ชัน `outsideRepository` ใช้ `node:path.resolve/relative` ตาม platform ปัจจุบัน จึงมีแนวโน้มว่า path ตัวอย่างไม่ถูกจำแนกเป็น path ภายใน repository บน Linux
- Failure นี้อยู่ใน backend migration safety tests ไม่ใช่ Work-Schedule UI checks โดยตรง; ตามขอบเขตแผนนี้จึงยังไม่แก้ backend/migration code ที่ไม่ได้รับอนุญาต และไม่ทำเครื่องหมาย `Coding Agent Check Complete Implement` หรืออ้างว่า verify ผ่าน


### รอบ Implementor: 2026-10-21 (แก้ migration path safety ตามคำอนุญาตผู้ใช้)

- ผู้ใช้อนุญาตให้ดำเนินการแก้ปัญหาต่อจาก CI failure ใน migration safety test แม้ไฟล์ดังกล่าวอยู่นอกขอบเขต UI เดิม
- แก้ `ecosystem-backend-nest-js/scripts/migration/common/identity-apply-safety.mjs` ให้ตรวจ path ด้วย path implementation ที่ตรงกับรูปแบบ absolute path (Windows หรือ native platform) และตรวจ containment ด้วย relative path ที่คำนวณจาก root ที่ resolve แล้ว; ปรับการตรวจ parent traversal ให้เทียบกับ path separator ที่ถูกต้อง ไม่ใช้ `startsWith('..')` แบบกว้าง
- เพิ่ม regression test ใน `ecosystem-backend-nest-js/scripts/migration/identity-apply-safety.test.mjs` สำหรับ repository-local POSIX path ขณะที่คง test Windows path ที่ล้มเหลวใน Ubuntu CI
- บันทึก runtime fix และ regression test บน `main` ใน commits `13cce9b186eb568c9d8ea83e9ea17813f6816955` และ `f7868108754e4d882185b11570410a6de062aaa4` ตามลำดับ
- ต้องตรวจ GitHub Actions run ที่เกิดจาก commits เหล่านี้ก่อนสรุปผล; ยังไม่อ้างว่า tests ผ่านและยังไม่ทำเครื่องหมาย `Coding Agent Check Complete Implement` จนกว่าจะมีผล CI ที่ยืนยันได้
