# Migration batch 001: identity and patient foundation

สถานะ: Implemented — target schema และ application workflow พร้อมแล้ว แต่ยังไม่เริ่ม legacy data import

## Scope

กำหนด mapping ชุดแรกจากระบบเก่าไปยังโครงสร้างใหม่ โดยแยกข้อมูลบุคลากรออกจากข้อมูลคนไข้ และเก็บ legacy id เพื่อให้ตรวจสอบย้อนกลับได้

| Source                            | Target                                                | Status                                                     |
| --------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `doctors`                         | `Person` + `PersonDentist` + clinic affiliation       | Target schema พร้อม; ยังไม่ import                         |
| `staff`                           | `Person` + `PersonStaff` + clinic affiliation         | Target schema และ invitation workflow พร้อม; ยังไม่ import |
| `patients`                        | `Person` + `PersonDentalPatient` + clinic affiliation | Target schema และ HN allocation พร้อม; ยังไม่ import       |
| `organizations` (ไม่มีในระบบเก่า) | `Organization` + `OrganizationDentalClinic`           | สร้างผ่าน application ก่อนเลือกเป้าหมาย import             |

## Confirmed decisions

- `Person` เป็นข้อมูลบุคคลกลางหนึ่งคน เอกสารระบุตัวเก็บแยกใน `PersonIdentityDocument` และ unique ตามชนิด/ประเทศ/เลขเอกสาร
- คนไข้เชื่อมได้หลายคลินิกผ่าน `PersonDentalPatientAffiliation`
- `patientNumber` เป็น running number แยกตามคลินิก โดยเริ่มจากเลขธรรมดา
- การสร้าง patient number ต้องทำใน transaction ที่ป้องกันเลขซ้ำเมื่อมีการสร้างพร้อมกัน
- ยังไม่ทำ full legacy-data import ในระยะนี้ ใช้ข้อมูลใหม่และ fixture ขนาดเล็กสำหรับพัฒนา
- legacy snapshot จะถูกใช้ภายหลังเพื่อวัดจำนวนข้อมูล, ตรวจ duplicate และ rehearsal mapping เท่านั้น
- เมื่อเอกสารระบุตัวตรงกับ `Person` เดิม ให้ใช้ข้อมูลเดิมและห้าม overwrite profile จาก request ใหม่
- คนต่างชาติและผู้ไม่มี Thai CID เป็นคนไข้ได้ โดยใช้ Passport/Foreign ID หรือไม่มีเอกสารชั่วคราว
- แยกบัญชี Clerk เป็น `UserAccount`; `Person` มีหรือไม่มีบัญชีก็ได้
- เลื่อนการเชื่อมบัญชีคนไข้ไปทำพร้อม patient portal และต้องไม่ยืนยันตัวตนด้วย CID เพียงอย่างเดียว

## Source fields and decisions

| Source field                 | Proposed target                         | Transformation / rule                                         | Decision                                                       |
| ---------------------------- | --------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| `doctors.id` / `staff.id`    | legacy reference ของ Person/role record | เก็บเป็น integer เดิม ห้ามใช้แทน UUID                         | พร้อมเป็นหลักการ                                               |
| `username`                   | migration reference only                | ห้ามนำ username/password เดิมไปใช้เป็น Clerk credential       | บุคลากรใช้ staff invitation; คนไข้เลื่อนไปพร้อม patient portal |
| `first_name`, `last_name`    | `Person.firstName`, `Person.lastName`   | trim; คงค่า null; ห้ามใช้เป็น identity                        | พร้อม                                                          |
| `cid` / `id_number`          | identity document field                 | trim, normalize และตรวจค่าซ้ำก่อน import                      | ต้องกำหนดสิทธิ์และการเก็บข้อมูลอ่อนไหว                         |
| `telephone`                  | phone field                             | normalize รูปแบบเบอร์ แต่ห้าม dedupe ด้วยเบอร์เพียงอย่างเดียว | ต้องกำหนดกฎ duplicate                                          |
| `patients.id`                | patient legacy id                       | เก็บเพื่อ traceability และ idempotent re-run                  | ต้องมี target field/index                                      |
| `patients.birth_day`         | date of birth                           | เก็บเป็น date ไม่แปลงเป็น timezone                            | พร้อมเป็นหลักการ                                               |
| `patients.insurance_balance` | patient insurance/account balance       | ห้าม migrate เป็นยอดเงินโดยไม่ยืนยันความหมายทางธุรกิจ         | ต้องตรวจสอบกับเจ้าของระบบ                                      |

## Identity and deduplication

1. ห้าม match ด้วยชื่ออย่างเดียว
2. สำหรับบุคลากร ให้พิจารณา `cid` หรือ `license_number` ก่อน แล้วใช้ legacy id เป็นตัวอ้างอิงถาวร
3. สำหรับคนไข้ ให้พิจารณา `id_number` ก่อน หากไม่มีให้ใช้กฎหลายฟิลด์ร่วมกัน (`ชื่อ`, `นามสกุล`, `วันเกิด`, `โทรศัพท์`) และส่งรายการกำกวมให้ตรวจด้วยมือ
4. การสร้าง Clerk identity ต้องเป็นขั้นตอนแยกจาก data import และต้องไม่ copy password hash เดิม

## Remaining work before rehearsal

- [x] เพิ่ม target model สำหรับ patient profile และ legacy identifiers
- [x] เพิ่ม target model สำหรับ dentist/staff role และ clinic affiliations
- [x] แยก `UserAccount` ออกจาก `Person`
- [x] สร้าง staff invitation และ patient-number allocation ที่ปลอดภัยต่อ concurrency
- [ ] กำหนด organization/clinic แรกและ timezone
- [x] กำหนดวิธีเชื่อมบัญชีบุคลากรผ่าน invitation โดยไม่ย้าย password เดิม
- [x] เขียน read-only aggregate audit สำหรับ row count/duplicate ภายในแต่ละ source table
- [ ] รัน aggregate audit กับ legacy snapshot และทบทวนรายงาน
- [x] สร้างและทดสอบ identity mapping ด้วย sanitized fixture โดยไม่เชื่อมฐานข้อมูล
- [ ] สร้าง mapping report จาก legacy snapshot โดยเก็บข้อมูลส่วนบุคคลไว้นอก Git
- [ ] ทดสอบ import บน database สำเนาแบบ idempotent

## Acceptance checks

- source row counts แยกตาม `doctors`, `staff`, `patients`
- รายการ duplicate, unmatched และ rejected rows ถูก export พร้อมเหตุผล
- re-run ไม่สร้าง Person/Patient ซ้ำ
- legacy id ทุกค่าที่ import ได้ถูกค้นย้อนกลับถึง source record
- ไม่มี password หรือ secret ถูกเขียนลงไฟล์ mapping/log
