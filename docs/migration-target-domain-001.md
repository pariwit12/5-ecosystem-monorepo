# Target domain design 001: identity and patient foundation

สถานะ: Implemented — schema และ migration ชุดพื้นฐานถูกสร้างแล้ว

เอกสารนี้กำหนดโครงสร้างเป้าหมายขั้นต่ำสำหรับ migration batch แรก โดยแยกบัญชี authentication (`UserAccount.clerkId`) ออกจากบุคคลจริง (`Person`) และไม่ใช้ schema เก่าเป็นข้อจำกัดของ schema ใหม่

## Proposed aggregate

```text
Organization
└── OrganizationDentalClinic
    ├── PersonStaffAffiliation
    └── DentalPatientAffiliation

UserAccount (Clerk authentication)
└── Person (optional 1:1)
    ├── PersonOrganizationAffiliation
    ├── PersonDentist (optional)
    ├── PersonStaff (optional)
    └── DentalPatient (optional)
```

`UserAccount` แทนบัญชีที่ยืนยันตัวตนด้วย Clerk ส่วน `Person` แทนบุคคลจริง บัญชีหนึ่งเชื่อมกับบุคคลได้ไม่เกินหนึ่งคนและบุคคลหนึ่งเชื่อมกับบัญชีได้ไม่เกินหนึ่งบัญชี ทั้งสองฝั่งอาจยังไม่เชื่อมกันได้ เช่น webhook สร้างบัญชีก่อน หรือคลินิกสร้างข้อมูลคนไข้ที่ยังไม่มีบัญชี

## Proposed models

| Model                         | Purpose                               | Key fields                                                 |
| ----------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `UserAccount`                 | บัญชี authentication                  | UUID, unique Clerk identity                                |
| `Person`                      | บุคคลจริงและข้อมูลทั่วไป              | UUID, optional profile fields, optional user account       |
| `PersonIdentityDocument`      | เอกสารระบุตัวบุคคลหลายชนิด            | person id, type, issuing country, normalized value, expiry |
| `PersonLegacyIdentity`        | trace source identity                 | source system, entity type, legacy integer id, target id   |
| `PersonDentist`               | บทบาททันตแพทย์                        | person id, license number                                  |
| `PersonStaff`                 | ระบุว่าบุคคลเป็นเจ้าหน้าที่           | person id                                                  |
| `PersonStaffAffiliation`      | บทบาทและสิทธิ์ของเจ้าหน้าที่ต่อคลินิก | person id, clinic id, role, legacy role                    |
| `DentalPatient`               | บทบาทคนไข้ระดับระบบ                   | person id                                                  |
| `DentalPatientAffiliation`    | ความเป็นคนไข้และเลข HN ต่อคลินิก      | patient id, clinic id, running patient number              |
| `DentalPatientLegacyIdentity` | trace คนไข้จากระบบเก่า                | source system, legacy patient id, patient id               |

## Rules

- `legacy_id` ต้องมี unique constraint ร่วมกับ source system และ entity type
- ห้ามใช้ชื่อหรือเบอร์โทรเป็น primary identity
- ห้าม migrate password hash ไปเป็น Clerk credential
- CID, Passport และเลขเอกสารต่างประเทศเก็บใน `PersonIdentityDocument` และต้องไม่อยู่ใน log
- Thai CID ต้องเป็นตัวเลข 13 หลักและใช้ประเทศ `TH`; Passport/Foreign ID ไม่ถูกบังคับเป็นรูปแบบ CID
- บุคคลที่ยังไม่มีเอกสารสามารถเป็นคนไข้ได้ แต่ห้ามจับคู่ด้วยชื่ออัตโนมัติ
- `DentalPatient` ต้องเชื่อมกับ `Person` แต่ `Person` ไม่จำเป็นต้องมี `UserAccount`; คนไข้จึงไม่จำเป็นต้องสมัครบัญชี
- webhook ต้องสร้างหรืออัปเดตเฉพาะ `UserAccount` และห้ามสร้าง `Person` เปล่าโดยอัตโนมัติ
- ห้ามใช้ข้อมูลโปรไฟล์จาก Clerk เขียนทับข้อมูล `Person` โดยอัตโนมัติ
- การเชื่อมบุคลากรกับ `OrganizationDentalClinic` ต้องรองรับหลายคลินิกในอนาคต
- พนักงานทั่วไปไม่จำเป็นต้องเป็นสมาชิกของ `Organization`; role อยู่ที่ affiliation ของแต่ละคลินิก
- การ import ต้องสร้าง target UUID ใหม่ และใช้ legacy identity เป็น idempotency key

## Decisions made

1. ข้อมูลทั่วไปอยู่ที่ `Person`; role-specific data อยู่ในตารางของแต่ละ role
2. บุคคลหนึ่งเป็นคนไข้ได้หลายคลินิกผ่าน `DentalPatientAffiliation`
3. เอกสารชนิดเดียวกันจากประเทศเดียวกันและเลขเดียวกัน unique ทั้งระบบ; ห้ามใช้ชื่อ deduplicate และห้าม overwrite บุคคลที่ match ด้วยเอกสาร
4. HN เป็น running number แยกต่อคลินิกและจัดสรรใน transaction เดียวกับการสร้าง affiliation
5. Staff role อยู่ที่ `PersonStaffAffiliation`; พนักงานไม่จำเป็นต้องเป็นสมาชิก Organization
6. ผู้สร้าง Organization เป็น Organization admin เริ่มต้น
7. Staff invitation รองรับรหัสใช้ครั้งเดียว ทั้งแบบไม่ระบุบุคคลและแบบผูกกับ CID ล่วงหน้า
