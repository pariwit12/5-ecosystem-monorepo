# CURRENT_TASK_PLAN.md

## 1. ไอเดียต้นฉบับ (ห้ามแก้ไขข้อความ)

ต้องการสร้างระบบสำหรับจัดตารางเวรอัตโนมัติ

- ให้เลือกโหมดเป้าหมายในการจัดได้ โดยมีให้เลือกระหว่างจัดเวรให้ถึงขั้นต่ำของจำนวนคนที่งานในแต่ละช่วงเวลา กับจัดตารางเวรให้มากที่สุดโดยไม่เกิน max ของแต่ละช่วงเวลา

## 2. เป้าหมายและขอบเขตของงาน

เพิ่มตัวเลือก “เป้าหมายการจัดเวร” ให้ flow จัดเวรอัตโนมัติ (Auto Create) โดยผู้ใช้เลือกได้ 2 โหมดก่อนสั่งจัดเวร:

1. `MINIMUM` — จัดเพิ่มเฉพาะจำนวนที่ขาด เพื่อให้จำนวนคนทำงานถึง `min` ของแต่ละช่วงเวลา โดยต้องรักษาพฤติกรรมเดิมของ Auto Create ให้เหมือนก่อนมี feature นี้
2. `MAXIMUM` — จัดพนักงานที่ผู้ใช้เลือกและยังว่างให้ได้มากที่สุด แต่ห้ามทำให้จำนวนคนในตำแหน่งงานเกิน `max` ของช่วงเวลาที่มี finite `max`

งานนี้เปลี่ยน Business Logic เฉพาะ strategy ที่ Auto Create ใช้กำหนด “จำนวน Slot ที่ควรเพิ่มต่อ occurrence” และเพิ่ม UI/contract สำหรับเลือก strategy เท่านั้น

ไม่อยู่ในขอบเขต:

- เปลี่ยน Prisma schema หรือ migration
- บันทึก mode ลง `work_schedule_slot`
- เปลี่ยน Min/Max CRUD หรือ semantics เดิมของ Min/Max
- เปลี่ยน Slot Template, Slot Type, Holiday หรือ Staff Position CRUD
- เปลี่ยน endpoint/route หรือ authorization ของ Auto Create
- เปลี่ยน response `{ createdCount: number }`
- เปลี่ยน schedule board/query/display ที่ไม่เกี่ยวกับการส่ง `target_mode`

## 3. Business Logic และโค้ดที่เกี่ยวข้องก่อนเริ่ม

### 3.1 Request contract ของ Auto Create ปัจจุบันยังไม่มี target mode

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts` กำหนด body ปัจจุบันเป็น:

```ts
{
  start_time,
  end_time,
  slot_template_ids,
  staff_ids,
}
```

เงื่อนไขปัจจุบันที่ต้องรักษา:

- `position_id`, `slot_template_ids`, `staff_ids` ต้องเป็น UUID v7
- `slot_template_ids` ต้องมีอย่างน้อย 1 รายการ
- `staff_ids` ต้องมีอย่างน้อย 1 รายการ
- ID ในแต่ละ array ต้องไม่ซ้ำกัน แม้ต่างกันเฉพาะตัวพิมพ์ใหญ่/เล็ก
- `start_time` และ `end_time` ต้องเป็น ISO datetime ที่มี offset
- `end_time` ต้องเป็น instant ที่มากกว่า `start_time`
- response คือ `{ createdCount: number }`

Backend เปิด `ZodValidationPipe` แบบ global ใน `ecosystem-backend-nest-js/src/main.ts` ดังนั้น default ที่เพิ่มใน Zod schema จะถูกเติมเมื่อ HTTP request ผ่าน validation pipe

ข้อควรระวังสำหรับ unit test: test ของ `AutoCreateHandler` ปัจจุบันสร้าง `AutoCreateCommand` โดยตรง จึงไม่ได้ผ่าน `ZodValidationPipe` หรือ `AutoCreateDtoBodySchema.parse(...)` อัตโนมัติ ถ้าต้องทดสอบ behavior “request ไม่ส่ง mode” ให้ test parse fixture ผ่าน schema ก่อนสร้าง command หรือกำหนด fixture ให้ตรงกับ parsed contract ห้ามสมมติว่า constructor ของ `AutoCreateCommand` จะเติม Zod default ให้เอง

### 3.2 Auto Create ปัจจุบันทำงานแบบ “เติมให้ถึง Min” เท่านั้น

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts` ทำงานดังนี้:

1. normalize `position_id` เป็น lowercase แล้วตรวจ authorization ก่อนเปิด transaction
2. เปิด Prisma transaction ด้วย `Serializable`
3. lock row ของ `work_schedule_position` ด้วย `FOR UPDATE`
4. reread position/place และตรวจ Place timezone
5. อ่านและ validate Slot Template ที่เลือก
6. อ่าน Staff Position และยืนยันว่า Staff ที่เลือกทุกคนยังมี active position ในตำแหน่งงานนี้ จากนั้น sort `workScheduleStaffId` เพื่อให้ลำดับ deterministic
7. สร้าง occurrence จาก Slot Template ตาม local calendar ของ Place timezone และตรวจ template/occurrence overlap
8. อ่าน Slot เดิมที่ overlap request โดยรวมทั้ง Slot ของ target position และ Slot ของ selected staff ทุก position
9. อ่าน Holiday ของ selected staff
10. อ่าน Min/Max ของ target position ที่ overlap request
11. แยก `positionSlots` สำหรับ coverage ของ target position
12. `calculateRequirements(...)` คำนวณจำนวนที่ขาดจาก `min` ต่อ occurrence
13. ไล่ occurrence ตามลำดับที่ sort แล้ว และไล่ Staff candidate ตาม ID ที่ sort แล้ว เลือกเฉพาะคนที่ไม่ชน existing Slot, Holiday หรือ planned Slot
14. ถ้า `planned.length === 0` คืน `{ createdCount: 0 }` โดยไม่เรียก maximum validation หรือ insert
15. ถ้ามี planned Slot ให้ `validateMaximum(...)` ตรวจว่า request นี้ไม่เพิ่ม Slot จนเกิน finite Max
16. insert ทั้ง plan ด้วย `createMany` ครั้งเดียว แล้วคืน count ที่ Prisma รายงาน
17. ถ้าเกิด Prisma serialization conflict `P2034` ให้ retry transaction และ reread/rebuild plan ใหม่ตาม logic เดิม

ดังนั้นพฤติกรรมเดิมคือ “Min เป็น target, Max เป็น safety cap” และต้องกลายเป็นโหมด `MINIMUM` โดยผลลัพธ์เดิมต้องไม่เปลี่ยน

### 3.3 Semantics ของ Min/Max ปัจจุบัน

จาก `auto-create.handler.ts` และ Min/Max CRUD ปัจจุบัน:

- `min = null` หรือ `min = 0` ไม่สร้าง minimum requirement
- `max = null` หมายถึงไม่มี upper bound จาก Min/Max เพราะ `validateMaximum(...)` ข้าม rule ที่ `max === null`
- ถ้าไม่มี Min/Max rule ครอบคลุมช่วงหนึ่ง ช่วงนั้นไม่มี minimum target และไม่มี maximum cap จาก Min/Max
- existing Slot ทุกคนใน target position ถูกนับเป็น coverage แม้ Staff คนนั้นไม่ได้อยู่ใน `staff_ids`
- existing Slot ของ selected staff ใน position อื่น block availability แต่ไม่ถูกนับเป็น coverage ของ target position
- Holiday ของ selected staff block availability แต่ไม่ใช่ coverage
- overlap ใช้ half-open semantics: `start < other.end && end > other.start` ดังนั้น boundary ที่แตะกันพอดีไม่ถือว่า overlap
- Min/Max create/update ปัจจุบัน lock position row และ reject rule อื่นใน position เดียวกันที่ overlap ด้วย half-open predicate ดังนั้นข้อมูลที่สร้างผ่าน CRUD ปกติจะไม่มี Min/Max หลาย rule ทับกันใน instant เดียว
- DTO ของ Min/Max อนุญาตให้มีเฉพาะ `min`, เฉพาะ `max` หรือทั้งคู่ และเมื่อมีทั้งคู่ต้อง `min <= max`

Feature นี้ห้ามเปลี่ยน semantics ข้างต้น

### 3.4 การสร้าง occurrence และ availability ปัจจุบันต้องไม่เปลี่ยน

Logic ที่ยืนยันจาก `auto-create.handler.ts` และ test ปัจจุบัน:

- Slot Template ใช้ `startTime` แบบ wall time ของ Place timezone
- iterate วันด้วย local calendar (`plus({ days: 1 })`) ไม่ใช่เพิ่มทีละ 24 ชั่วโมง
- ปฏิเสธ wall time ที่ nonexistent หรือ ambiguous ใน timezone
- duration ใช้ elapsed minutes และ test ครอบคลุม DST spring-forward/fall-back
- occurrence ที่ overlap request แต่ไม่ได้อยู่ภายใน request ทั้งก้อนไม่ถูกสร้าง
- selected templates ห้ามสร้าง occurrence ที่ overlap กัน
- template เดียวกันที่ duration ยาวจน occurrence ข้ามวันและทับ occurrence วันถัดไปถูก reject
- occurrence ที่แตะ boundary กันพอดีอนุญาต
- Staff คนเดิมห้ามถูกจัดทับ existing Slot, Holiday หรือ planned Slot อื่น
- Staff candidate ถูก sort ก่อนจัด และ occurrence ถูก sort ก่อนจัด ทำให้ผล deterministic

`MAXIMUM` ต้อง reuse กฎเหล่านี้ ห้ามสร้าง scheduler path ใหม่ที่ข้าม validation เดิม

### 3.5 Frontend ปัจจุบันไม่มีตัวเลือกเป้าหมาย

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx` ปัจจุบันมี form fields:

- `start_time`
- `end_time`
- `slot_template_ids`
- `staff_ids`

ก่อน submit form จะ resolve `datetime-local` เป็น ISO datetime ด้วย Place timezone และปฏิเสธ invalid/nonexistent/ambiguous wall time

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts` สร้าง request body ปัจจุบันเป็น:

```ts
{
  start_time: startTime,
  end_time: endTime,
  slot_template_ids: slotTemplateIds,
  staff_ids: staffIds,
}
```

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts`:

- import `AutoCreateDtoParamSchema` และ `AutoCreateDtoBodySchema` จาก backend
- `safeParse` param/body ก่อน POST
- POST ไป endpoint เดิม `/api/work-schedule/slot/positions/:position_id/auto`
- ส่ง `parsedBody.data` ทั้งก้อนไป backend

ดังนั้น field ใหม่ใน shared body schema สามารถไหลผ่าน API function เดิมได้ และไม่ต้องสร้าง endpoint ใหม่

### 3.6 Test และ verification ที่ repository รองรับ

มี test files ที่เกี่ยวข้องอยู่แล้ว:

Backend:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.spec.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts`

Frontend:

- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-api.test.tsx`
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-form.test.tsx`

Root `package.json` มี `typecheck:*`, `lint:*`, `test:*` และ `verify` และ `AGENTS.md` ระบุให้เริ่มจาก test ที่แคบที่สุดก่อน แล้วจึง typecheck/lint/verify

## 4. Business Logic ที่คาดหวังหลัง Implement

### 4.1 เพิ่ม `target_mode` ใน Auto Create request

เพิ่มใน `AutoCreateDtoBodySchema`:

```ts
target_mode: z.enum(["MINIMUM", "MAXIMUM"]).default("MINIMUM")
```

เหตุผล:

- HTTP request เดิมที่ไม่ได้ส่ง `target_mode` ต้อง parse แล้วได้ `MINIMUM`
- endpoint เดิมยัง backward compatible ในระดับ runtime/API contract
- frontend ใหม่ต้องส่ง mode ที่ผู้ใช้เลือกอย่าง explicit เพื่อให้ payload ชัดเจน
- mode เป็น strategy ของ request ครั้งนั้น ไม่ต้อง persist ใน database

ข้อควรระวังด้าน TypeScript:

- Zod schema ที่มี default มี input/output type ต่างกันได้
- `auto-create.api.ts` ปัจจุบัน export `AutoCreateDtoBody = z.infer<typeof AutoCreateDtoBodySchema>` ซึ่งเป็น type ของ parsed output ที่ใช้ใน code ปัจจุบัน
- คง `AutoCreateDtoBody` ใน API function เป็น parsed output type เดิม (`z.infer`) ไม่ต้องเปลี่ยนเป็น input type ในงานนี้; hook และ valid API fixtures ต้องส่ง `target_mode` อย่าง explicit
- body ของ `AutoCreateCommand` ต้องเป็น parsed contract; ให้เติม `target_mode: "MINIMUM"` ใน helper `command(...)` ของ handler tests ก่อน spread overrides เพื่อให้ test เดิมยังทดสอบโหมดเดิม และให้แต่ละ MAXIMUM test override mode เอง
- ทดสอบ omission โดยส่ง fixture ที่ไม่มี mode เข้า `AutoCreateDtoBodySchema.parse(...)` ก่อนสร้าง command; ห้ามเติม mode ใน fixture นั้นเองจนไม่ได้ทดสอบ default จริง
- ห้ามแก้ด้วย `any`/unsafe cast หรือเพิ่ม fallback ใน handler เพื่อกลบ contract

### 4.2 โหมด `MINIMUM`: รักษาพฤติกรรมเดิมทั้งหมด

เมื่อ parsed `target_mode === "MINIMUM"`:

- ใช้ minimum requirement algorithm เดิมจาก `calculateRequirements(...)`
- สร้างเฉพาะจำนวน Slot ที่ขาดเพื่อให้ถึง Min
- ถ้า minimum ถูกเติมครบแล้ว ให้สร้าง 0
- `min = 0`, `min = null` หรือไม่มี rule ที่มี Min ครอบคลุม occurrence ให้สร้าง 0 จาก occurrence นั้น
- `max` ยังเป็น safety cap ผ่าน final maximum validation เดิม
- ถ้า selected/available staff ไม่พอ ให้สร้างเท่าที่ทำได้ ห้ามดึง Staff ที่ไม่ได้เลือก
- staff ordering, occurrence ordering, timezone, overlap และ transaction behavior ต้องเหมือนเดิม

Acceptance สำคัญ: payload เดิมที่ omit `target_mode` หลัง schema parse ต้องให้ Business Logic เท่ากับ explicit `target_mode: "MINIMUM"`

ข้อจำกัดเดิมที่ต้องรักษา: `calculateRequirements(...)` ใช้ deficit สูงสุดของช่วงย่อยที่ occurrence ครอบคลุม ไม่ใช่ผลรวมของ deficit และไม่ได้ลด target ด้วย Max ก่อนจัด ถ้า Slot เต็ม occurrence ที่เติม Min ของช่วงหนึ่งทำให้อีกช่วงเกิน Max ต้อง reject ทั้ง plan ด้วย final validation เหมือนเดิม ห้ามนำ capacity ของ MAXIMUM มา clamp MINIMUM โดยไม่ได้รับงานเพิ่ม

ตัวอย่างที่มีอยู่ใน handler tests: occurrence 08:00–12:00, rule `min = 2, max = 2` ตลอดช่วง, existing Slot ของ unselected staff เฉพาะ 08:00–10:00 และ selected staff ว่าง 2 คน => MINIMUM วางแผนเพิ่ม 2 แล้ว reject เพราะ 08:00–10:00 จะมี 3 Slots; ส่วน MAXIMUM ต้องเพิ่มได้ 1 อย่างสำเร็จ

### 4.3 โหมด `MAXIMUM`: จัดให้มากที่สุดโดยไม่เกิน Max

เมื่อ `target_mode === "MAXIMUM"`:

- `min` ไม่ใช่ target และห้ามใช้ minimum deficit เป็นจำนวนที่ต้อง assign
- selected/available staff คือ candidate pool สูงสุด
- finite `max` เป็น upper bound ของจำนวน Slot ทั้งหมดใน target position ณ ทุก segment ที่ Slot ใหม่ครอบคลุม

ให้คำนวณ capacity ต่อ occurrence โดยยึด Slot ทั้ง occurrence เป็นหน่วยที่สร้าง ห้าม split occurrence เป็น Slot ย่อยเพียงเพื่อให้ใส่คนได้มากขึ้น

Algorithm ที่ Implementor ต้องใช้:

เพิ่ม private helper `calculateMaximumCapacity(occurrence: Interval, rules: MinMaxRule[], existing: Interval[]): number` ภายใน `auto-create.handler.ts` โดยใช้ `Interval`, `MinMaxRule`, `boundaries(...)` และ `overlaps(...)` ที่มีอยู่แล้ว ไม่ต้องสร้าง production file ใหม่

1. รับ `existing` เป็น `positionSlots` เท่านั้น ห้ามส่ง `slots` ทุก position เข้า helper นี้
2. ใช้ `boundaries(occurrence, [...rules, ...existing])` เพื่อได้ occurrence start/end และขอบ rule/Slot ที่ overlap โดย clip ให้อยู่ภายใน occurrence, deduplicate และ sort ด้วย helper เดิม
3. ตั้ง capacity เริ่มต้นเป็น `Number.POSITIVE_INFINITY` แล้วไล่แต่ละ non-empty atomic segment ระหว่าง boundary ติดกัน
4. นับ `existingCount` เฉพาะ existing target-position Slots ที่ overlap segment นั้น
5. สำหรับทุก rule ที่ overlap segment และ `rule.max !== null` ให้คำนวณ residual แล้วสะสมค่าต่ำสุด:

```ts
const residual = Math.max(0, rule.max - existingCount);
capacity = Math.min(capacity, residual);
```

แม้ CRUD ปกติจะไม่ให้ rules ทับกัน ให้ใช้ทุก finite rule ที่ overlap segment ไม่ใช่เลือก rule แรก; วิธีนี้สอดคล้องกับ final validator เดิมที่ตรวจทุก rule โดยไม่เพิ่มนโยบายแก้ข้อมูลเดิม

6. segment ที่ไม่มี rule หรือมีแต่ `max === null` ไม่ลด capacity; ถ้าไม่มี finite Max เลยให้คืน `Number.POSITIVE_INFINITY` ห้ามแทนด้วย 0 หรือเอา `min` มาคำนวณ
7. คำนวณ capacity เพียงครั้งเดียวต่อ occurrence ก่อนเริ่มไล่ staff ของ occurrence นั้น แล้วใช้เป็น `requiredAdditional` ของ assignment loop เดิม
8. ให้ `assigned` ของ loop เดิมเป็นตัวใช้ capacity; ห้ามลด capacity ซ้ำหลัง push Slot และห้ามคำนวณใหม่โดยหัก Slots ที่เพิ่ง push แล้วนำไปเปรียบเทียบกับ `assigned` อีกครั้ง
9. ไม่ต้องหัก `plannedCount` ใน helper นี้: `generateOccurrences(...)` reject occurrences ที่ overlap กันอยู่แล้ว ดังนั้น Slots ที่วางแผนไว้จาก occurrence ก่อนหน้าไม่ overlap occurrence ปัจจุบัน ส่วน Slots ของ occurrence ปัจจุบันยังไม่มีในตอนเรียก helper และถูกจำกัดด้วย `assigned` เมื่อจัดจริง
10. ไล่ Staff candidate ตาม ordering เดิม ข้ามคนที่ไม่ว่างโดยไม่เพิ่ม `assigned`; เมื่อ capacity เป็น Infinity loop ยังจบที่จำนวน selected staff ที่มีจริง ไม่ได้สร้าง Slot ไม่จำกัด
11. ยังต้องเรียก final `validateMaximum(request, rules, positionSlots, planned)` ร่วมกันทั้งสอง mode ก่อน `createMany` และคง zero-plan early return เดิม

เหตุผลที่ต้องใช้ capacity ต่ำสุด: Slot ใหม่ครอบคลุม occurrence ทั้งก้อน ดังนั้นถ้าช่วงย่อยใดเหลือ capacity เพียง 1 แม้ช่วงอื่นเหลือ 3 ก็สร้าง Slot เต็ม occurrence ได้สูงสุด 1 รายการ

ตัวอย่างผลที่ต้องได้:

| สถานการณ์ | ผลของ `MAXIMUM` |
| --- | --- |
| existing = 0, max = 2, selected available = 3 | สร้าง 2 |
| existing = 1, max = 2, selected available = 3 | สร้าง 1 |
| existing = 2, max = 2 | สร้าง 0 |
| existing > max | สร้าง 0 ใน occurrence ที่ทับ segment นั้น; ห้ามเพิ่ม violation |
| max = 0 | สร้าง 0 |
| max = null | ไม่มี cap จาก Min/Max; สร้าง selected staff ที่ว่างได้ทั้งหมด |
| ไม่มี Min/Max rule | ไม่มี cap จาก Min/Max; สร้าง selected staff ที่ว่างได้ทั้งหมด |
| min = 2, max = 4, selected available = 3, existing = 0 | สร้าง 3 เพราะ MAXIMUM ไม่หยุดที่ Min |
| occurrence ครอบคลุม finite-Max segment ที่เหลือ capacity 3 และอีก segment เหลือ 1 | สร้างได้สูงสุด 1 |

### 4.4 Pre-existing Max violation

รักษาหลักการเดิมว่า Auto Create ไม่แก้ existing data และไม่ควรล้มเพียงเพราะมี pre-existing Max violation ถ้า request นี้ไม่ได้เพิ่ม Slot เข้า violation นั้น

สำหรับ `MAXIMUM`:

- ถ้า `existingCount >= max` ให้ residual capacity ของ segment เป็น 0
- occurrence ที่ครอบคลุม segment นั้นจึงเพิ่ม Slot ไม่ได้
- ไม่ต้องลบ แก้ หรือย้าย existing Slot
- ถ้า planner ได้ `planned.length === 0` ให้คง early return เดิมเพื่อไม่เรียก final validation บน zero plan
- ถ้ามี planned Slot ใน segment อื่น final validation ต้อง reject เฉพาะกรณี request นี้เพิ่มจนละเมิด finite Max ตาม semantics เดิม
- capacity 0 ของ occurrence หนึ่งต้องข้ามเฉพาะ occurrence นั้น แล้วจัด occurrence ถัดไปตามปกติ ห้าม return `{ createdCount: 0 }` จากภายใน occurrence loop จนทำให้ plan ที่ทำได้ในช่วงอื่นหายไป

### 4.5 Coverage กับ availability ต้องแยกกันเหมือนเดิม

ทั้ง 2 mode:

- coverage/capacity ของ target position นับ existing Slot ทุกคนใน target position
- availability ของ candidate ตรวจ existing Slot ของ Staff คนนั้นข้ามทุก position
- Holiday และ planned Slot ของ Staff คนนั้น block availability
- Staff ที่ไม่ได้อยู่ใน `staff_ids` ห้ามถูกสร้าง Slot ใหม่
- touching boundary ไม่ถือว่า overlap

### 4.6 Transaction/concurrency invariant ต้องไม่เปลี่ยน

ทั้ง 2 mode ต้องยัง:

- authorize ก่อน transaction
- ใช้ Serializable transaction
- lock target `work_schedule_position` ก่อนอ่าน planning inputs
- reread position/template/staff/slot/holiday/min-max ภายในทุก retry attempt
- rebuild plan ใหม่ทุก `P2034` retry ห้าม reuse plan จาก attempt ก่อน
- validate ทั้ง plan ก่อน `createMany`
- insert batch แบบ atomic ใน transaction เดิม

## 5. โครงสร้างไฟล์ที่คาดหวังหลัง Implement

### 5.1 ไฟล์ที่ต้องแก้

Backend:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts`
  - เพิ่ม `target_mode` enum/default
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts`
  - branch strategy ตาม parsed mode เฉพาะส่วนกำหนดจำนวนที่จะ assign ต่อ occurrence
  - รักษา MINIMUM algorithm เดิม
  - เพิ่ม MAXIMUM residual-capacity algorithm
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.spec.ts`
  - เพิ่ม DTO/default/invalid-mode tests
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts`
  - เพิ่ม mode tests และ regression tests

Frontend:

- `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx`
  - เพิ่ม field/UI เลือก target mode และส่งค่าที่เลือก
- `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts`
  - เพิ่ม `targetMode` ใน mutation variables และ body
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-api.test.tsx`
  - ปรับ payload fixtures และเพิ่ม target-mode validation/request tests
- `ecosystem-frontend-next-js/tests/work-schedule/auto-create-form.test.tsx`
  - เพิ่ม default/selection/payload/pending-state tests ของ mode

### 5.2 ไฟล์ที่คาดว่าไม่ต้องแก้

- `ecosystem-frontend-next-js/src/features/work-schedule/slot/api/mutations/auto-create.api.ts`
  - ปัจจุบันใช้ shared body schema และ POST `parsedBody.data` อยู่แล้ว จึงไม่ควรต้องเปลี่ยน logic; แก้ได้เฉพาะ type plumbing ที่จำเป็นและต้องไม่ลด validation
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/slot.controller.ts`
- Prisma schema/migrations
- Min/Max commands/queries
- Slot Template/Slot Type/Holiday modules
- schedule board/query/display

ถ้า Implementor พบ compile error ที่บังคับให้แก้ไฟล์นอกเหนือจากรายการ “ต้องแก้” ให้แก้เฉพาะ plumbing ที่เกิดโดยตรงจาก `target_mode` และห้ามขยาย Business Logic อื่น

### 5.3 ไฟล์ที่ต้องสร้าง/ลบ

- ไม่คาดว่าต้องสร้าง production file ใหม่
- ไม่คาดว่าต้องลบไฟล์ใด
- helper ใหม่ของ MAXIMUM อยู่ภายใน `auto-create.handler.ts` ตามหัวข้อ 4.3 และทดสอบผ่าน handler เป็นหลัก ไม่ต้องแยก file/module หรือเปลี่ยน visibility ของ production methods เพื่อให้ test เข้าถึง

## 6. รายละเอียดการเปลี่ยนแปลงระดับไฟล์และเกณฑ์ผ่านแต่ละขั้น

### ขั้นที่ 1 — เพิ่ม request contract ของ target mode

ไฟล์:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.spec.ts`

ให้เพิ่ม field สองค่าเท่านั้น:

```ts
target_mode: z.enum(["MINIMUM", "MAXIMUM"]).default("MINIMUM")
```

ห้าม:

- รับ arbitrary string
- ใช้ boolean เช่น `maximize: true`
- rename field เดิม
- เปลี่ยน response
- ใช้ `any` เพื่อเลี่ยง type จาก schema

เกณฑ์ผ่าน:

- schema parse body เดิมที่ omit mode สำเร็จ และ parsed output มี `target_mode === "MINIMUM"`
- explicit `MINIMUM` parse ผ่าน
- explicit `MAXIMUM` parse ผ่าน
- invalid/empty mode parse ไม่ผ่าน
- date/UUID/duplicate validation เดิมยังผ่าน

### ขั้นที่ 2 — แยก minimum target กับ maximum target ใน backend planner

ไฟล์:

- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts`
- `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts`

รูปแบบ implementation ที่ต้องการ:

- reuse transaction/read/validation/occurrence/availability/createMany flow เดิม
- branch ตาม `body.target_mode` ที่จุดกำหนดจำนวนที่จะ assign ต่อ occurrence
- `MINIMUM` เรียก `calculateRequirements(request, rules, positionSlots, occurrences)` เดิมและเก็บผลใน `Map<Occurrence, number>` เหมือนเดิม ไม่ rename หรือเปลี่ยน algorithm
- `MAXIMUM` เติม map ของ occurrences เดียวกันด้วย `calculateMaximumCapacity(occurrence, rules, positionSlots)` ตามหัวข้อ 4.3 โดยไม่เรียก `calculateRequirements(...)`
- ใช้ assignment loop เดิมร่วมกันทั้งสอง mode ให้ `requiredAdditional` มาจาก map และนับ `assigned` เพียงจุดเดียว; map และ planned array ต้องสร้างภายใน callback ของ transaction แต่ละ attempt และเรียก helper คำนวณ capacity ใหม่ใน attempt นั้น
- ห้าม duplicate handler เป็นสอง transaction flows
- ห้ามให้ `MAXIMUM` เรียก minimum deficit เพื่อกำหนด target
- ห้ามให้ `MINIMUM` เติมต่อจนถึง Max
- คง final maximum validation เป็น defensive invariant

เกณฑ์ผ่าน:

- existing MINIMUM tests เดิมยังผ่าน
- omitted mode ที่ผ่าน schema parse ให้ผลเหมือน explicit MINIMUM
- MAXIMUM ไม่หยุดที่ Min
- MAXIMUM ไม่เกิน finite Max ใน atomic segment ใดที่ Slot ใหม่ครอบคลุม
- max null/no rule ไม่ถูกตีความเป็น capacity 0
- selected staff ไม่พอ -> สร้างเท่าที่ว่าง ไม่ throw เพราะเติม target ไม่ครบ
- unavailable staff ไม่ถูกจัด
- pre-existing Max violation ไม่ถูกทำให้แย่ลง
- zero plan ยังคืน `{ createdCount: 0 }` โดยไม่ insert
- `P2034` retry ยัง reread และ rebuild plan

### ขั้นที่ 3 — เพิ่ม UI เลือกเป้าหมายก่อน submit

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/components/auto-create-form.tsx`

ให้เพิ่ม `target_mode: z.enum(["MINIMUM", "MAXIMUM"])` ใน `createFormSchema(...)` และ `target_mode: "MINIMUM"` ใน `useForm` default values (ไม่ต้องใส่ Zod default ใน form schema เพื่อให้ input/output ของ form ตรงกัน)

เพิ่ม native radio inputs สองตัวภายใน `<fieldset disabled={isPending}>` หลังข้อความ Place timezone และก่อน fields เวลา ใช้ `<legend>เป้าหมายการจัดเวร</legend>` และ `register("target_mode")` สำหรับ radio ทั้งคู่ โดยมี label ที่สัมพันธ์กับแต่ละ input; ไม่ต้องเพิ่ม UI dependency

ค่าที่ใช้จริง:

- `MINIMUM`
- `MAXIMUM`

ข้อความ UI ต้องสื่ออย่างน้อย:

- `MINIMUM`: “ให้ถึงจำนวนขั้นต่ำ (Min)” — สร้างเฉพาะจำนวนที่ขาดเพื่อให้ถึง Min
- `MAXIMUM`: “จัดให้มากที่สุดภายใต้จำนวนสูงสุด (Max)” — จัด selected/available Staff ให้มากที่สุด โดยช่วงที่มี Max จะไม่เกิน Max

สำหรับ `MAXIMUM` ต้องมี helper text ว่า ถ้าช่วงใดไม่มี finite Max ระบบไม่มีเพดานจาก Min/Max ในช่วงนั้น และจะถูกจำกัดด้วย selected staff/availability

UI requirements:

- default `MINIMUM`
- disabled ระหว่าง `isPending` เช่น field อื่น
- มี label/legend ที่ screen reader ระบุความหมายได้
- validation error ของ `errors.target_mode` ถ้ามีแสดงด้วย `<p role="alert">` ตาม pattern เดิมของ form
- เพิ่ม `targetMode: values.target_mode` ใน object ที่ส่งให้ `mutate(...)` ภายใน `onSubmit`; คง fields และ callbacks เดิม
- ห้ามเปลี่ยน `resolveAutoCreateWallTime(...)` หรือ timezone/DST validation
- ห้ามเปลี่ยน behavior ของ template/staff selection

เกณฑ์ผ่าน:

- เปิด form ใหม่เห็น MINIMUM ถูกเลือก
- เปลี่ยนเป็น MAXIMUM ได้
- submit ส่ง mode ที่เลือก
- field เวลา/template/staff ยังทำงานเหมือนเดิม

### ขั้นที่ 4 — ส่ง mode ผ่าน hook/mutation layer

ไฟล์ `ecosystem-frontend-next-js/src/features/work-schedule/slot/hooks/use-auto-create.ts`

เพิ่ม required `targetMode` ใน destructuring และ type ของ mutation variables ให้ใช้ type `AutoCreateDtoBody["target_mode"]` โดย import type จาก `../api/mutations/auto-create.api` (ชนิดเดียวกับ shared parsed schema) แล้วสร้าง body:

```ts
{
  target_mode: targetMode,
  start_time: startTime,
  end_time: endTime,
  slot_template_ids: slotTemplateIds,
  staff_ids: staffIds,
}
```

`auto-create.api.ts` ต้องยัง parse ด้วย shared backend schema และ POST `parsedBody.data` ไป endpoint เดิม

เกณฑ์ผ่าน:

- network payload มี mode ที่ user เลือก
- token handling เดิมไม่เปลี่ยน
- `skipErrorCodes` เดิมไม่เปลี่ยน
- success invalidation ยังจำกัดที่ slot-list key ของ user/position เดิม
- backend endpoint เดิมถูกใช้

### ขั้นที่ 5 — รักษา final Max validation และ atomic write

ไฟล์ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.ts`

หลัง planner ได้ `planned`:

```ts
if (planned.length === 0) return { createdCount: 0 };
```

จากนั้นต้องมี final maximum validation ก่อน `createMany`

สำหรับ MAXIMUM capacity calculation ที่ถูกต้องควรทำให้ final validation ผ่านในกรณีปกติ ถ้า final validation fail ต้อง abort transaction และห้าม insert partial data

เกณฑ์ผ่าน:

- `createMany` ไม่ถูกเรียกเมื่อ final validation fail
- successful transaction attempt เรียก `createMany` ครั้งเดียว
- result ยังใช้ `result.count`
- retry attempt ใหม่ไม่ reuse planned array จาก attempt ก่อน

## 7. Test ที่ต้องเพิ่มหรือแก้

### 7.1 Backend DTO tests

แก้ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.command.spec.ts`

ต้องมีอย่างน้อย:

- omitted `target_mode` => parse สำเร็จและ parsed value เป็น `MINIMUM`
- explicit `MINIMUM` => สำเร็จ
- explicit `MAXIMUM` => สำเร็จ
- invalid string => fail
- empty string => fail
- validation เดิมของ offset datetime, end > start, UUID v7, empty selection และ duplicate case-insensitive IDs ยังผ่าน

### 7.2 Backend handler regression tests ของ `MINIMUM`

แก้ `ecosystem-backend-nest-js/src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts`

ต้องยืนยัน:

- parsed omitted-mode payload ให้ผลเหมือน explicit MINIMUM
- minimum already covered => 0
- `min = 0` => 0
- `min = null` => 0
- no Min/Max rule => 0
- existing target-position Slot ของ unselected staff ยังนับ coverage
- another-position Slot/Holiday ยัง block availability แต่ไม่ใช่ target coverage
- selected staff ไม่พอ => สร้างเท่าที่ selected/available
- touching boundaries ยังไม่ overlap
- existing maximum safety tests เดิมยังผ่าน

การเตรียม fixture:

- เพิ่ม `target_mode: "MINIMUM"` ใน helper `command(...)` ก่อน `...body` เพื่อให้ regression tests เดิมใช้ MINIMUM อย่าง explicit และ MAXIMUM tests override ได้
- วิธีทดสอบ omitted mode: parse fixture ที่ไม่มี `target_mode` ด้วย `AutoCreateDtoBodySchema.parse(...)` แล้วสร้าง `AutoCreateCommand` จาก parsed body โดยตรง ห้ามส่งผ่าน helper ที่เติม mode เองก่อน parse
- เทียบ omitted กับ explicit MINIMUM โดยใช้ rule `min = 1, max = 2` และ selected staff ว่าง 2 คน ต้องสร้าง 1 รายการทั้งสอง request พร้อม insert data ที่เท่ากัน ให้ล้าง call history ของ mock ระหว่างการรันสอง request
- คง test เดิม `rejects planned plus existing coverage above maximum in a touched segment` เป็น MINIMUM regression ตามตัวอย่างหัวข้อ 4.2 ห้ามแก้ expected จาก reject เป็น capped success สำหรับ MINIMUM

### 7.3 Backend handler tests ของ `MAXIMUM`

ต้องเพิ่มอย่างน้อย:

1. existing 0 / max 2 / available selected 3 => สร้าง 2
2. existing 1 / max 2 / available selected 3 => สร้าง 1
3. existing = max => 0
4. existing > max => 0 ใน occurrence ที่ทับ finite-Max segment และไม่ insert เพิ่ม violation
5. max 0 => 0
6. max null => สร้าง selected staff ที่ว่างทั้งหมด
7. no Min/Max rule => สร้าง selected staff ที่ว่างทั้งหมด
8. min ต่ำกว่า available capacity เช่น min 1 / max 3 / available 3 => สร้าง 3
9. occurrence ครอบคลุมหลายช่วง โดย finite residual capacity ที่แคบที่สุดเป็นตัวจำกัดทั้ง occurrence
10. existing target-position Slot ที่ครอบคลุมเพียงบาง segment ถูกนับเฉพาะ segment ที่ overlap
11. Staff ที่ติด Holiday ไม่ถูกเลือกแม้ยังมี capacity
12. Staff ที่มี Slot ใน position อื่นไม่ถูกเลือกแม้ยังมี capacity
13. selected staff ไม่พอ capacity => สร้างเท่าที่ว่าง
14. touching boundaries ไม่ block availability/capacity เกินจริง
15. fixture เดียวกับ MINIMUM final-Max rejection ในหัวข้อ 4.2 => MAXIMUM สร้าง 1 และสำเร็จ ห้ามคาดให้ MAXIMUM reject เพราะ planner ต้องลดจำนวนก่อนจัด
16. zero plan ไม่ fail เพียงเพราะ pre-existing Max violation
17. `P2034` retry reread inputs และคำนวณ MAXIMUM plan ใหม่

เพิ่มเติมกรณีรวมที่ต้องยืนยันผ่าน handler:

- request/occurrence 08:00–12:00, finite Max 1 เฉพาะ 09:00–10:00, ช่วงอื่นไม่มี rule, selected staff ว่าง 3 คน => สร้าง 1 เต็ม occurrence; ช่วงไม่มี rule ไม่ยกเลิก finite cap ของช่วงย่อย
- occurrence เดียวครอบคลุม rule ที่ `max = null` และ rule ที่ finite Max => ใช้ finite cap ของช่วงที่มีเพดาน
- templates สองแบบที่แตะ boundary กัน: 08:00–10:00 และ 10:00–12:00; ช่วงแรก Max 0, ช่วงหลัง Max 1, selected staff ว่าง => สร้างเฉพาะช่วงหลัง 1 รายการ ไม่ throw และไม่หยุดก่อนจัดช่วงหลัง
- templates ที่แตะ boundary เดียวกันทั้งสองช่วง, Max 2 และ selected staff ว่าง 2 คน => สร้าง 4 รายการ ใช้ staff คนเดิมซ้ำในช่วงที่ไม่ overlap ได้ และเรียง staff IDs เหมือนเดิมในแต่ละ occurrence
- lowest-ID staff ติด Holiday, แต่มี selected staff ที่ว่างอีก 2 คนและ residual capacity 2 => สร้าง 2 โดยใช้สองคนที่ว่าง ห้ามเสีย capacity ไปกับคนที่ถูกข้าม

กติกา fixture: `command(...)` และ `workScheduleStaffPosition.findMany` mock ต้องมี selected staff ชุดเดียวกัน; เคส available 3 คนต้องเพิ่ม ID คนที่สามและ active position mock จริง ห้ามถือว่าเพิ่ม `staff_ids` อย่างเดียวพอ และให้แยกจาก `unselectedStaffId` ที่ใช้ existing coverage เดิม สำหรับ Max 0 ให้ใช้ `min = null` หรือ 0 เพื่อให้ rule สอดคล้องกับ validation เดิม

การทดสอบ final maximum guard ให้คง existing MINIMUM tests ที่สร้าง plan เกิน Max แล้ว assert `BadRequestException` และ `createMany` ไม่ถูกเรียก เนื่องจากทั้งสอง mode ใช้ guard เดียวกัน MAXIMUM จาก inputs ที่ถูกต้องต้องได้ capped success/zero ไม่ใช่ failure; ห้ามทำให้ planner จัดเกินเพดาน, เปลี่ยน production visibility หรือ bypass occurrence validation เพียงเพื่อสร้าง MAXIMUM failure case

### 7.4 Frontend API/hook tests

แก้ `ecosystem-frontend-next-js/tests/work-schedule/auto-create-api.test.tsx`

ต้องยืนยัน:

- body fixture/type ที่ใช้กับ API สอดคล้องกับ parsed schema ใหม่
- MINIMUM ถูก POST ไป endpoint เดิม
- MAXIMUM ถูก POST ไป endpoint เดิม
- invalid target mode ถูก reject ก่อน HTTP และ error store ยังแสดง status 400; สำหรับ negative API test ที่ต้องส่ง literal ผิด type ให้ใช้ `@ts-expect-error` เฉพาะบรรทัดเรียก API พร้อมเหตุผลว่าเป็น invalid external payload ห้ามเปลี่ยน production signature เป็น arbitrary string หรือใช้ `any`/unsafe cast
- hook ส่ง `target_mode` จาก `targetMode` variable จริง
- Authorization header เดิมไม่เปลี่ยน
- `skipErrorCodes` เดิมไม่เปลี่ยน
- missing auth ยังไม่ request/invalidate
- backend failure ยังไม่ invalidate
- success ยัง invalidate เฉพาะ list keys ของ user/position เดิม

ให้เพิ่ม `target_mode: "MINIMUM"` ใน valid `body: AutoCreateDtoBody` fixture และให้ `setupHook(...)` รับ `targetMode: AutoCreateDtoBody["target_mode"]` (test helper default MINIMUM ได้) แล้วส่งเข้า `mutateAsync(...)` จริง ทดสอบทั้งสอง mode โดย assert body ที่ `mockedPost` ได้รับด้วย ไม่ใช่ตรวจเฉพาะค่าจาก test fixture

### 7.5 Frontend form tests

แก้ `ecosystem-frontend-next-js/tests/work-schedule/auto-create-form.test.tsx`

ต้องยืนยัน:

- default control เลือก MINIMUM
- user เปลี่ยนเป็น MAXIMUM ได้
- submit default ส่ง `targetMode: "MINIMUM"`
- submit หลังเปลี่ยนส่ง `targetMode: "MAXIMUM"`
- pending state disable mode control ด้วย
- ISO time ที่ส่งยัง resolve ด้วย Place timezone เดิม
- nonexistent/ambiguous DST validation เดิมไม่ regress
- template/staff required validation เดิมไม่ regress
- success/error feedback/navigation เดิมไม่ regress

ปรับ exact payload expectations เดิมของทั้ง single/multiple selection ให้มี `targetMode: "MINIMUM"` ด้วย ส่วน mock ของ `useAutoCreate` ที่ hard-code `isPending: false` ให้เปลี่ยนเป็นตัวแปร `mockIsPending` และ reset เป็น false ใน `beforeEach` เพื่อให้ pending test ตั้งเป็น true ได้โดยไม่รั่วข้าม test ตรวจ `disabled` ของ fieldset และ assert ว่าไม่เรียก mutation ระหว่าง pending โดยใช้ Testing Library/DOM assertions ที่มีอยู่ ไม่ต้องเพิ่ม test dependency

## 8. คำสั่งตรวจสอบ

ใช้ Node.js 22 ตาม `.github/workflows/ci.yml` และ pnpm ตาม `packageManager` ใน root `package.json`

สำหรับ fresh checkout ให้เตรียม dependencies และ generated Prisma Client ก่อน เนื่องจาก backend handler/tests import `@prisma/client` และคำสั่ง Jest โดยตรงไม่ได้เรียก Prisma generation ให้อัตโนมัติ:

```bash
pnpm install --frozen-lockfile
pnpm run prisma:generate
```

จากนั้นรันจาก repository root โดยเริ่มจาก test ที่แคบที่สุด:

```bash
pnpm --dir ecosystem-backend-nest-js exec jest src/modules/work-schedule/slot/commands/auto-create.command.spec.ts src/modules/work-schedule/slot/commands/auto-create.handler.spec.ts --runInBand
pnpm --dir ecosystem-frontend-next-js exec jest tests/work-schedule/auto-create-api.test.tsx tests/work-schedule/auto-create-form.test.tsx tests/work-schedule/auto-create-client-page.test.tsx --runInBand
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run verify
```

ถ้า environment มี database/deployment ที่เหมาะสมและต้องการตรวจ e2e เพิ่ม สามารถรัน:

```bash
pnpm run test:e2e
```

แต่ `AGENTS.md` ระบุว่า `pnpm run verify` ไม่รวม e2e เพราะ e2e อาจต้องใช้ deployment/database-specific environment และ unit test ต้อง mock Prisma ไม่เชื่อม database จริง E2E ที่ต้องใช้ environment เพิ่มจึงไม่ใช่เกณฑ์บังคับของงานนี้

หากทำงานผ่าน GitHub ให้ตรวจ Actions workflow `CI` / job `Verify monorepo` ซึ่งรัน `pnpm install --frozen-lockfile` และ `pnpm run verify` ตามไฟล์ workflow จริง พร้อมอ่านผล job/steps/logs ที่ทำได้ ห้ามรายงานว่าได้รัน narrow command แยกเองถ้าเพียงตรวจผลจาก Actions; หาก environment ไม่รองรับการตรวจเพิ่มเติม ให้แจ้งข้อจำกัดและคำสั่งที่ต้องให้ผู้ใช้รันพร้อมส่งผลกลับทางแชต ห้ามใช้สถานะตรวจที่ยังไม่ได้ผลเป็นผ่าน

## 9. Acceptance Criteria รวม

งานถือว่าผ่านเมื่อครบทุกข้อ:

- Auto Create UI มี target mode 2 ค่า `MINIMUM` และ `MAXIMUM`
- UI default เป็น MINIMUM
- backend schema รับเฉพาะ 2 ค่านี้และ default omitted mode เป็น MINIMUM
- frontend ส่ง mode ที่ผู้ใช้เลือกอย่าง explicit
- endpoint/response/authorization เดิมไม่เปลี่ยน
- MINIMUM ให้ผลเท่าพฤติกรรม Auto Create เดิม
- MAXIMUM จัด selected/available Staff ให้มากที่สุดโดยไม่เกิน finite Max ในทุก segment ที่ Slot ใหม่ครอบคลุม
- MAXIMUM ไม่ใช้ Min เป็นจุดหยุด
- `max = null` หรือไม่มี rule หมายถึงไม่มี upper bound จาก Min/Max ใน MAXIMUM
- existing target-position Slots ถูกนับก่อนคำนวณ capacity
- existing Slot ของ candidate ใน position อื่นและ Holiday ยัง block availability
- Staff ที่ไม่ได้เลือกไม่ถูกสร้าง Slot
- pre-existing Max violation ไม่ถูกแก้อัตโนมัติและไม่ถูกทำให้แย่ลง
- timezone/DST/overnight/template-overlap/touching-boundary behavior เดิมไม่เปลี่ยน
- deterministic ordering เดิมไม่เปลี่ยน
- Serializable transaction, position lock, reread on retry, P2034 retry และ atomic batch insert เดิมยังอยู่
- ไม่มี Prisma/schema/migration change
- narrow tests, typecheck, lint และ `pnpm run verify` ผ่านใน environment ที่ Implementor ใช้

## 10. สิ่งที่ Implementor ต้องระวัง

- อย่าตีความ MAXIMUM ว่า “สร้างเท่ากับค่า max” เพราะต้องหัก existing target-position coverage ก่อน
- อย่าคำนวณ capacity จาก selected staff อย่างเดียว; Max จำกัดจำนวน Slot ทั้งหมดใน target position ณ segment นั้น
- อย่า split occurrence เพื่อหลบ Max; Slot ที่สร้างต้องยังมาจาก occurrence เดิมเต็มช่วง
- อย่านับ Slot ของ Staff ใน position อื่นเป็น target coverage แต่ต้องใช้ block availability
- อย่าถือ `max = null` หรือ no rule เป็น 0
- อย่าให้ MINIMUM เติมเกิน Min เพียงเพราะเพิ่มโหมด MAXIMUM
- อย่าแก้ existing Slot เพื่อให้เข้ากับ Max
- อย่าข้าม final Max validation
- อย่าย้าย planning reads ออกนอก Serializable transaction
- อย่า reuse plan จาก transaction attempt ที่เกิด `P2034`
- อย่าเปลี่ยน position row lock หรือ transaction isolation ในงานนี้
- อย่าเปลี่ยน deterministic Staff/occurrence ordering
- อย่าเปลี่ยน half-open overlap semantics
- อย่าเปลี่ยน wall-time/timezone/DST logic
- อย่าเพิ่ม migration หรือ persist `target_mode`
- อย่าเพิ่ม handler fallback/unsafe cast เพียงเพื่อทำให้ unit test ที่ bypass schema ผ่าน; ให้ test/use site ใช้ parsed contract อย่างถูกต้อง
