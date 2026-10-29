# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ตรวจสอบการเคลียร์ cache เมื่อมีการแก้ไข/สร้าง/ลบข้อมูล minmax หน่อยครับ ตอนนี้ผมตรวจสอบในหน้าดูตารางเวรรวมของ admin แล้วพบว่าเหมือน cache เก่าจะยังค้างอยู่ ช่วยเพิ่มการเคลียร์ cache ของการแสดงผลให้ถูกต้องหน่อยครับ

## 2. เป้าหมายและขอบเขต

แก้เฉพาะการ invalidation ของ TanStack Query cache ฝั่ง `ecosystem-frontend-next-js` หลัง mutation ของ Work Schedule Min/Max สำเร็จ เพื่อให้ข้อมูล Min/Max ที่ฝังอยู่ใน response ของหน้าตารางเวรรวมของ admin ไม่ค้างจาก cache เดิม

ขอบเขตนี้ **ไม่เปลี่ยน** API contract, validation, payload, backend business rule, การคำนวณ Min/Max, การสร้าง/แก้ไข/ลบข้อมูลในฐานข้อมูล, UI ของตารางเวร, routing, toast หรือ error handling เดิม เว้นแต่การเพิ่ม cache invalidation ที่ระบุในแผนนี้

## 3. Business Logic ก่อนเริ่ม Implement

1. การสร้าง Min/Max ใช้ `useCreate()` และเมื่อ mutation สำเร็จจะ invalidate เฉพาะ `workScheduleMinMaxKeys.listsByPositionId(userId, positionId)`
2. การแก้ไข Min/Max ใช้ `useUpdate()` และเมื่อ mutation สำเร็จจะ invalidate:
   - `workScheduleMinMaxKeys.listsByPositionId(userId, positionId)`
   - `workScheduleMinMaxKeys.detail(userId, positionId, minMaxId)`
3. การลบ Min/Max ใช้ `useDelete(positionId)` และเมื่อ mutation สำเร็จจะ invalidate cache Min/Max สองกลุ่มเดียวกับข้อ 2
4. หน้าตารางเวรรวมของ admin ที่ `src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx` **ไม่ได้อ่าน Min/Max จาก query namespace ของ `min-max` โดยตรง** แต่ใช้ `workScheduleSlotQueries.queryGetSlotsByPositionIdStartTimeEndTime(...)` แล้วส่ง `dataQuerySlot.minMaxs` เข้า `WorkScheduleBoard`
5. response contract ของ backend สำหรับ `GetSlotsByPositionIdStartTimeEndTimeResponse` มี `minMaxs` อยู่ใน response เดียวกับ `workScheduleSlots` และ `workScheduleHolidays`
6. slot query ดังกล่าวใช้ key `workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(userId, positionId, startTime, endTime)` และมี `staleTime: 60 * 1000`
7. ดังนั้น mutation ของ Min/Max ในปัจจุบันไม่ได้ invalidate cache namespace ของ slot แม้ข้อมูล `minMaxs` ที่หน้าตารางเวรรวมใช้จะถูกเก็บอยู่ใน cache ของ slot query นั้น ทำให้มีโอกาสเห็น snapshot เก่าของ Min/Max จนกว่า slot query จะถูก refetch ด้วยเหตุอื่น

## 4. ส่วนของโค้ดที่เกี่ยวข้องก่อนเริ่ม

### 4.1 Min/Max mutation hooks ที่ต้องแก้

- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/hooks/use-create.ts`
  - มี `onSuccess` และ invalidate Min/Max list ตาม `userId + positionId`
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/hooks/use-update.ts`
  - มี `onSuccess` และ invalidate Min/Max list + detail
- `ecosystem-frontend-next-js/src/features/work-schedule/min-max/hooks/use-delete.ts`
  - มี `onSuccess` และ invalidate Min/Max list + detail

### 4.2 Query key ที่ต้องใช้เพิ่ม

`ecosystem-frontend-next-js/src/features/work-schedule/slot/work-schedule-slot-keys.ts` มี hierarchy:

```ts
workScheduleSlotKeys.listsByPositionId(userId, positionId)
workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(
  userId,
  positionId,
  startTime,
  endTime,
)
```

โดย key แบบ `listsByPositionIdStartTimeEndTime(...)` ต่อท้ายจาก `listsByPositionId(...)` ดังนั้นให้ใช้ `listsByPositionId(userId, positionId)` เป็น prefix สำหรับ invalidation เพื่อครอบคลุม slot-table cache ทุกช่วงเวลาของ position เดียวกัน โดยไม่ล้าง slot cache ของ position อื่น

### 4.3 Consumer ที่ทำให้ต้อง invalidate slot cache

`ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx` อ่านข้อมูลด้วย:

```ts
workScheduleSlotQueries.queryGetSlotsByPositionIdStartTimeEndTime(...)
```

และนำข้อมูลไปแสดงด้วย:

```tsx
<WorkScheduleBoard
  slots={dataQuerySlot.workScheduleSlots}
  minMaxs={dataQuerySlot.minMaxs}
  workScheduleHolidays={dataQuerySlot.workScheduleHolidays}
  ...
/>
```

จุดนี้เป็นเหตุผลที่การ invalidate เฉพาะ `workScheduleMinMaxKeys` ไม่เพียงพอสำหรับหน้าตารางเวรรวม

### 4.4 Test ที่มีอยู่และเกี่ยวข้อง

- `ecosystem-frontend-next-js/tests/work-schedule/min-max-edit-delete.test.tsx`
  - มีการ spy `queryClient.invalidateQueries`
  - ตรวจว่า update/delete invalidate Min/Max list และ detail อยู่แล้ว
- test frontend ใช้ Jest + Testing Library และสร้าง `QueryClient`/`QueryClientProvider` ใน test ได้อยู่แล้ว

## 5. Business Logic ที่คาดหวังหลัง Implement

เมื่อ mutation ของ Min/Max **สำเร็จเท่านั้น**:

1. **Create**
   - invalidate Min/Max list เดิม
   - invalidate slot list prefix ของ `userId + positionId` เพิ่มเติม
2. **Update**
   - invalidate Min/Max list เดิม
   - invalidate Min/Max detail เดิม
   - invalidate slot list prefix ของ `userId + positionId` เพิ่มเติม
3. **Delete**
   - invalidate Min/Max list เดิม
   - invalidate Min/Max detail เดิม
   - invalidate slot list prefix ของ `userId + positionId` เพิ่มเติม
4. mutation ที่ล้มเหลวต้องไม่เพิ่มการ invalidate cache เพราะ logic ใหม่ต้องอยู่ใน `onSuccess` เดิม
5. ห้าม invalidate slot cache ทั้งระบบ เช่น `workScheduleSlotKeys.all(userId)` หรือ `workScheduleSlotKeys.lists(userId)` เพราะกว้างเกินความจำเป็นและอาจทำให้ query ของ position/place อื่น refetch โดยไม่เกี่ยวข้อง

**เหตุผล:** หน้าตารางเวรรวมใช้ Min/Max จาก slot-query response จึงต้อง invalidate cache ของ data source ที่หน้าจออ่านจริง การใช้ prefix `listsByPositionId(...)` ทำให้ทุก date range ที่เคย cache สำหรับ position นั้นถูก invalidated โดยยังจำกัดผลกระทบไว้ที่ position เดียว

## 6. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### ไฟล์ที่ต้องแก้

1. `ecosystem-frontend-next-js/src/features/work-schedule/min-max/hooks/use-create.ts`
2. `ecosystem-frontend-next-js/src/features/work-schedule/min-max/hooks/use-update.ts`
3. `ecosystem-frontend-next-js/src/features/work-schedule/min-max/hooks/use-delete.ts`

### ไฟล์ test ที่ต้องสร้าง

4. `ecosystem-frontend-next-js/tests/work-schedule/min-max-cache-invalidation.test.tsx`

### ไฟล์ที่เกี่ยวข้องแต่ไม่ควรแก้สำหรับงานนี้

- `ecosystem-frontend-next-js/src/features/work-schedule/slot/work-schedule-slot-keys.ts`
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/work-schedule-slot.queries.ts`
- `ecosystem-frontend-next-js/src/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page.tsx`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.query.ts`

ไม่คาดว่าต้องลบไฟล์ใด และไม่คาดว่าต้องแก้ backend สำหรับ root cause นี้

## 7. รายละเอียดการเปลี่ยนแปลงระดับไฟล์

### ขั้นตอน 1 — `use-create.ts`

1. import `workScheduleSlotKeys` จาก `@/features/work-schedule/slot/work-schedule-slot-keys`
2. ใน `onSuccess` ภายใน guard เดิม `if (userId && variables.positionId)` ให้ **คง** Min/Max invalidation เดิมไว้
3. เพิ่ม:

```ts
queryClient.invalidateQueries({
  queryKey: workScheduleSlotKeys.listsByPositionId(
    userId,
    variables.positionId,
  ),
});
```

**เกณฑ์ผ่านขั้นตอนนี้**
- create สำเร็จแล้ว invalidate ทั้ง Min/Max list และ slot-list prefix ของ position เดียวกัน
- ไม่เกิด invalidation เมื่อไม่มี `userId`/`positionId` ตาม guard เดิม
- mutation input, API call, auth token handling และ callback behavior เดิมไม่เปลี่ยน

### ขั้นตอน 2 — `use-update.ts`

1. import `workScheduleSlotKeys` จาก path เดียวกับขั้นตอน 1
2. ใน `onSuccess` ให้คง invalidation ของ Min/Max list และ detail เดิมทุกจุด
3. เพิ่ม slot invalidation ด้วย:

```ts
queryClient.invalidateQueries({
  queryKey: workScheduleSlotKeys.listsByPositionId(
    userId,
    variables.positionId,
  ),
});
```

**เกณฑ์ผ่านขั้นตอนนี้**
- update สำเร็จแล้ว invalidate Min/Max list + detail + slot-list prefix
- ใช้ `variables.positionId` เดียวกับ mutation ที่สำเร็จ ห้าม derive position จาก route/global state อื่น
- error path ไม่ invalidate เพิ่ม

### ขั้นตอน 3 — `use-delete.ts`

1. import `workScheduleSlotKeys` จาก path เดียวกับขั้นตอน 1
2. ใน `onSuccess` ให้คงการ normalize `minMaxId` และ Min/Max invalidation เดิม
3. เพิ่ม slot invalidation โดยใช้ `positionId` argument ของ hook:

```ts
queryClient.invalidateQueries({
  queryKey: workScheduleSlotKeys.listsByPositionId(userId, positionId),
});
```

**เกณฑ์ผ่านขั้นตอนนี้**
- delete สำเร็จแล้ว invalidate Min/Max list + deleted detail + slot-list prefix
- รองรับ input ของ mutation ทั้งแบบ string และ object เหมือนเดิม
- error path และ confirmation/UI flow ไม่เปลี่ยน

### ขั้นตอน 4 — เพิ่ม regression test `min-max-cache-invalidation.test.tsx`

สร้าง test ระดับ hooks เพื่อยืนยัน dependency ระหว่าง Min/Max mutations กับ slot query cache โดยไม่ต้องเปลี่ยน UI test ที่มีอยู่

Test setup ที่ต้องใช้:

1. mock `@clerk/nextjs` ให้ `userId = "admin-user"` และ `getToken()` คืน token
2. mock API mutation ทั้งสาม:
   - `create`
   - `update`
   - `deleteMinMax`
3. สร้าง `QueryClient` ใหม่ต่อ test และ wrap hook ด้วย `QueryClientProvider`
4. ใช้ position ตัวอย่างเดียวกันสำหรับ mutation และ slot cache เช่น `pos-1`
5. seed cache อย่างน้อย 2 keys:
   - range key ของ `pos-1` ด้วย `workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(...)`
   - range key ของ position อื่น เช่น `pos-2`
6. trigger mutation แล้วรอให้ mutation สำเร็จ

Test cases ขั้นต่ำ:

- `useCreate`
  - Min/Max list ของ `pos-1` ถูก invalidate ตาม behavior เดิม
  - slot range cache ของ `pos-1` ถูก invalidated ผ่าน prefix ใหม่
  - slot range cache ของ `pos-2` ไม่ถูก invalidated
- `useUpdate`
  - Min/Max list และ detail เดิมยังถูก invalidate
  - slot range cache ของ `pos-1` ถูก invalidated
  - `pos-2` ไม่ถูก invalidated
- `useDelete`
  - Min/Max list และ detail เดิมยังถูก invalidate
  - slot range cache ของ `pos-1` ถูก invalidated
  - `pos-2` ไม่ถูก invalidated
- failure อย่างน้อยหนึ่ง mutation
  - เมื่อ API reject ต้องไม่มี slot-cache invalidation ใหม่เกิดขึ้น

ให้ตรวจด้วย query state (`queryClient.getQueryState(key)?.isInvalidated`) หรือ assertion ที่เทียบผลเทียบเท่าซึ่งพิสูจน์ได้ว่า child range key ของ position เป้าหมายถูก invalidate จริง ไม่ใช่ตรวจเพียงว่ามีการเรียก function ด้วย key ใด key หนึ่ง

**เกณฑ์ผ่านขั้นตอนนี้**
- test fail กับ behavior เดิมที่ไม่ invalidate slot cache และ pass หลังแก้
- test พิสูจน์ว่า invalidation จำกัดอยู่ที่ position เป้าหมาย
- regression เดิมใน `min-max-edit-delete.test.tsx` ยังผ่าน

## 8. Acceptance Criteria รวม

งานถือว่าผ่านเมื่อครบทุกข้อ:

1. create/update/delete Min/Max ที่สำเร็จ invalidate slot list cache ด้วย `workScheduleSlotKeys.listsByPositionId(userId, positionId)`
2. invalidation เดิมของ `workScheduleMinMaxKeys` ไม่ถูกลบหรือเปลี่ยน scope
3. slot cache ของ position อื่นไม่ถูก invalidated จาก Min/Max mutation ของ position เป้าหมาย
4. mutation failure ไม่ทำให้เกิด invalidation ใหม่
5. หน้าตารางเวรรวมของ admin ยังคงใช้ query/API/UI เดิม แต่เมื่อ slot query ถูกอ่านหลัง Min/Max mutation สำเร็จจะไม่อาศัย cache snapshot เดิมของ position นั้น
6. ไม่มีการแก้ backend contract, schema, database หรือ business rule อื่น
7. focused regression test, frontend test suite, typecheck และ lint ผ่าน
8. GitHub Action `CI` ซึ่งรัน `pnpm run verify` ต้องผ่านหลัง implementation

## 9. สิ่งที่ Implementor ต้องระวัง

- ห้ามแทนที่ Min/Max invalidation เดิมด้วย slot invalidation; ต้องมีทั้งสองชุดเพราะหน้า Min/Max เองยังพึ่ง cache เดิม
- ห้าม invalidate `workScheduleSlotKeys.all(userId)` หรือ `lists(userId)` เพื่อแก้แบบกว้าง เพราะจะกระทบ cache ที่ไม่เกี่ยวกับ position นี้
- ห้ามแก้ `staleTime` เป็นวิธีแก้ปัญหา เพราะ root cause คือ mutation ไม่ได้ invalidate data source ของตารางเวร และการลด/ปิด cache จะเปลี่ยน performance behavior ของระบบกว้างเกิน scope
- ห้ามใช้ `queryClient.clear()` หรือ `removeQueries()` เพราะจะล้าง cache มากเกินจำเป็นและเปลี่ยน UX/loading behavior
- ห้ามย้าย invalidation ไปก่อน API mutation สำเร็จ; ต้องอยู่ใน `onSuccess` เพื่อไม่ให้ refresh ข้อมูลโดยไม่จำเป็นเมื่อ mutation ล้มเหลว
- ห้ามเปลี่ยน key hierarchy ใน `work-schedule-slot-keys.ts`; key ปัจจุบันรองรับ prefix invalidation ที่ต้องการอยู่แล้ว
- ห้ามเปลี่ยน payload, route, toast, form validation, confirmation delete หรือ error-code handling ที่ไม่เกี่ยวกับ cache
- ถ้าระหว่าง Implement พบ consumer อื่นที่เก็บ `minMaxs` ใน cache คนละ namespace นอกเหนือจาก slot query ที่ยืนยันในแผนนี้ ให้หยุดขยาย scope และส่งข้อมูลกลับ Planner ก่อน

## 10. Test และคำสั่งตรวจสอบ

หลังแก้โค้ดให้รันตามลำดับ:

```bash
pnpm --dir ecosystem-frontend-next-js run test -- tests/work-schedule/min-max-cache-invalidation.test.tsx
pnpm --dir ecosystem-frontend-next-js run test -- tests/work-schedule/min-max-edit-delete.test.tsx
pnpm run typecheck:frontend
pnpm run lint:frontend
pnpm run test:frontend
```

จากนั้นรัน verification ของ repository ซึ่งเป็นคำสั่งเดียวกับ GitHub Action `CI`:

```bash
pnpm run verify
```

หาก environment ของ Implementor ไม่สามารถรัน `pnpm run verify` เต็มชุดได้ ให้รายงานคำสั่งที่รันจริงและ error/ข้อจำกัดที่พบโดยไม่อ้างว่าผ่านส่วนที่ไม่ได้รัน
