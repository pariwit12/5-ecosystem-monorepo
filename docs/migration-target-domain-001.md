# Target domain design 001: identity and patient foundation

สถานะ: Proposal — ยังไม่สร้าง Prisma migration

เอกสารนี้กำหนดโครงสร้างเป้าหมายขั้นต่ำสำหรับ migration batch แรก โดยแยก authentication (`Person.clerkId`) ออกจากข้อมูลทางธุรกิจ และไม่ใช้ schema เก่าเป็นข้อจำกัดของ schema ใหม่

## Proposed aggregate

```text
Organization
└── OrganizationDentalClinic
    ├── PersonOrganizationAffiliation
    ├── Dentist (Person 1:1, optional)
    ├── Staff (Person 1:1, optional)
    └── Patient (Person 1:1, optional)
```

`Person` ควรเป็นบุคคลที่มีบัญชีระบบเท่านั้น ส่วน `Patient` อาจยังไม่มี Clerk account จึงไม่ควรบังคับให้คนไข้มี `Person.clerkId` ตั้งแต่แรก

## Proposed models

| Model | Purpose | Key fields |
|---|---|---|
| `Person` | ผู้ใช้/บุคคลที่ยืนยันตัวตนในระบบ | UUID, optional profile fields, optional Clerk identity |
| `PersonLegacyIdentity` | trace source identity | source system, entity type, legacy integer id, target id |
| `PersonDentist` | บทบาททันตแพทย์ | person id, license number |
| `PersonStaff` | ระบุว่าบุคคลเป็นเจ้าหน้าที่ | person id |
| `PersonStaffAffiliation` | บทบาทและสิทธิ์ของเจ้าหน้าที่ต่อคลินิก | person id, clinic id, role, legacy role |
| `DentalPatient` | ข้อมูลคนไข้ | patient number/legacy reference, profile, DOB, contact |
| `DentalPatientLegacyIdentity` | trace คนไข้จากระบบเก่า | source system, legacy patient id, patient id |

## Rules

- `legacy_id` ต้องมี unique constraint ร่วมกับ source system และ entity type
- ห้ามใช้ชื่อหรือเบอร์โทรเป็น primary identity
- ห้าม migrate password hash ไปเป็น Clerk credential
- ข้อมูล `cid`/เลขบัตรประชาชนต้องไม่อยู่ใน log และควรกำหนดสิทธิ์การเข้าถึงแยกต่างหาก
- การเชื่อม `Patient` กับ `Person` ต้อง optional เพราะคนไข้ไม่จำเป็นต้องมีบัญชีผู้ใช้
- การเชื่อมบุคลากรกับ `OrganizationDentalClinic` ต้องรองรับหลายคลินิกในอนาคต
- พนักงานทั่วไปไม่จำเป็นต้องเป็นสมาชิกของ `Organization`; role อยู่ที่ affiliation ของแต่ละคลินิก
- การ import ต้องสร้าง target UUID ใหม่ และใช้ legacy identity เป็น idempotency key

## Decisions required before implementation

1. ต้องการเก็บชื่อ/เบอร์โทรไว้ที่ `Person` และ `DentalPatient` หรือใช้ profile table กลาง
2. คนไข้หนึ่งคนสามารถอยู่หลายคลินิกใน organization เดียวกันได้หรือไม่
3. `cid` ของคนไข้และบุคลากรควรเป็น unique ระดับทั้งระบบ หรือเฉพาะคลินิก
4. ต้องการเลขคนไข้ใหม่หรือใช้ legacy patient id เป็นเลขที่แสดงใน UI
5. บทบาท staff เดิม (`role`) จะ map เป็น enum ใหม่ชุดใด

จนกว่าจะตอบคำถามเหล่านี้ จะยังไม่สร้าง migration เพราะการเปลี่ยน key/ownership ภายหลังจะมีต้นทุนสูงกว่าการแก้เอกสารตอนนี้
