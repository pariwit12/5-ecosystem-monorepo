# Migration batch 001: identity and patient foundation

สถานะ: Approved for implementation — ยังไม่ใช่ data import และยังไม่ควรรันกับ production

## Scope

กำหนด mapping ชุดแรกจากระบบเก่าไปยังโครงสร้างใหม่ โดยแยกข้อมูลบุคลากรออกจากข้อมูลคนไข้ และเก็บ legacy id เพื่อให้ตรวจสอบย้อนกลับได้

| Source | Target | Status |
|---|---|---|
| `doctors` | `Person` + ตารางบทบาททันตแพทย์ที่ต้องสร้าง | Target schema ยังไม่พร้อม |
| `staff` | `Person` + affiliation/บทบาทเจ้าหน้าที่ | Target schema ยังไม่พร้อม |
| `patients` | ตารางคนไข้ที่ต้องสร้าง โดยอาจเชื่อมกับ `Person` ภายหลัง | Target schema ยังไม่พร้อม |
| `organizations` (ไม่มีในระบบเก่า) | `Organization` + `OrganizationDentalClinic` | ต้องกำหนด organization แรกจาก deployment |

## Confirmed decisions

- `Person` เป็นข้อมูลบุคคลกลางหนึ่งคน และ `cid` unique ระดับระบบ
- คนไข้เชื่อมได้หลายคลินิกผ่าน `PersonDentalPatientAffiliation`
- `patientNumber` เป็น running number แยกตามคลินิก โดยเริ่มจากเลขธรรมดา
- การสร้าง patient number ต้องทำใน transaction ที่ป้องกันเลขซ้ำเมื่อมีการสร้างพร้อมกัน
- ยังไม่ทำ full legacy-data import ในระยะนี้ ใช้ข้อมูลใหม่และ fixture ขนาดเล็กสำหรับพัฒนา
- legacy snapshot จะถูกใช้ภายหลังเพื่อวัดจำนวนข้อมูล, ตรวจ duplicate และ rehearsal mapping เท่านั้น
- เมื่อ `cid` ตรงกับ `Person` เดิม ให้ใช้ข้อมูลเดิมและห้าม overwrite profile จาก request ใหม่

## Source fields and decisions

| Source field | Proposed target | Transformation / rule | Decision |
|---|---|---|---|
| `doctors.id` / `staff.id` | legacy reference ของ Person/role record | เก็บเป็น integer เดิม ห้ามใช้แทน UUID | พร้อมเป็นหลักการ |
| `username` | external identity mapping | ห้ามนำ password เดิมไปใช้กับ Clerk โดยตรง | ต้องกำหนดวิธีเชิญ/ผูกบัญชี |
| `first_name`, `last_name` | Person profile fields | target `Person` ยังไม่มี field เหล่านี้ | ต้องเพิ่ม schema ก่อน import |
| `cid` / `id_number` | identity document field | trim, normalize และตรวจค่าซ้ำก่อน import | ต้องกำหนดสิทธิ์และการเก็บข้อมูลอ่อนไหว |
| `telephone` | phone field | normalize รูปแบบเบอร์ แต่ห้าม dedupe ด้วยเบอร์เพียงอย่างเดียว | ต้องกำหนดกฎ duplicate |
| `patients.id` | patient legacy id | เก็บเพื่อ traceability และ idempotent re-run | ต้องมี target field/index |
| `patients.birth_day` | date of birth | เก็บเป็น date ไม่แปลงเป็น timezone | พร้อมเป็นหลักการ |
| `patients.insurance_balance` | patient insurance/account balance | ห้าม migrate เป็นยอดเงินโดยไม่ยืนยันความหมายทางธุรกิจ | ต้องตรวจสอบกับเจ้าของระบบ |

## Identity and deduplication

1. ห้าม match ด้วยชื่ออย่างเดียว
2. สำหรับบุคลากร ให้พิจารณา `cid` หรือ `license_number` ก่อน แล้วใช้ legacy id เป็นตัวอ้างอิงถาวร
3. สำหรับคนไข้ ให้พิจารณา `id_number` ก่อน หากไม่มีให้ใช้กฎหลายฟิลด์ร่วมกัน (`ชื่อ`, `นามสกุล`, `วันเกิด`, `โทรศัพท์`) และส่งรายการกำกวมให้ตรวจด้วยมือ
4. การสร้าง Clerk identity ต้องเป็นขั้นตอนแยกจาก data import และต้องไม่ copy password hash เดิม

## Required target work before rehearsal

- [ ] เพิ่ม target model สำหรับ patient profile และ legacy identifiers
- [ ] เพิ่ม target model สำหรับ dentist/staff role หรือกำหนดรูปแบบ affiliation ให้ชัดเจน
- [ ] กำหนด organization/clinic แรกและ timezone
- [ ] กำหนดวิธี map ผู้ใช้เก่ากับ Clerk
- [ ] เขียน read-only source extractor และรายงาน row count/duplicate
- [ ] สร้าง mapping table จริงจาก sample data โดยไม่ใส่ข้อมูลส่วนบุคคลลง Git
- [ ] ทดสอบ import บน database สำเนาแบบ idempotent

## Acceptance checks

- source row counts แยกตาม `doctors`, `staff`, `patients`
- รายการ duplicate, unmatched และ rejected rows ถูก export พร้อมเหตุผล
- re-run ไม่สร้าง Person/Patient ซ้ำ
- legacy id ทุกค่าที่ import ได้ถูกค้นย้อนกลับถึง source record
- ไม่มี password หรือ secret ถูกเขียนลงไฟล์ mapping/log
