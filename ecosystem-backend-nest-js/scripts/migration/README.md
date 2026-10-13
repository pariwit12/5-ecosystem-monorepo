# Legacy migration tooling

เครื่องมือใน directory นี้ต้องแยกจาก application startup และต้องไม่ทำงานอัตโนมัติระหว่าง deploy

## Aggregate legacy audit

คำสั่ง audit อ่าน snapshot ของฐานข้อมูลเก่าด้วย transaction แบบ `READ ONLY` และรายงานเฉพาะจำนวนรวม รวมถึงจำนวน CID ที่ซ้ำภายในตารางและข้าม patient/staff/doctor โดยไม่ส่งออกค่า CID, ชื่อ, เบอร์โทร, username หรือ connection string

```powershell
$env:LEGACY_DATABASE_URL = '<read-only snapshot connection>'
pnpm run migration:audit:legacy
```

ถ้าต้องการบันทึกรายงานไว้ภายนอก Git:

```powershell
$env:MIGRATION_REPORT_PATH = 'D:\migration-private\legacy-audit.json'
pnpm run migration:audit:legacy
```

ข้อกำหนด:

- ใช้ database snapshot และ account ที่มีสิทธิ์ read-only เท่านั้น
- ห้ามตั้ง `LEGACY_DATABASE_URL` ให้เป็นค่าเดียวกับ `DATABASE_URL`
- report ที่มีข้อมูลจริงต้องอยู่นอก repository
- การไม่มี duplicate ในตารางเดียวไม่ได้แปลว่าไม่มีบุคคลซ้ำข้าม `patients`, `staff`, และ `doctors`; การตรวจข้าม role จะทำใน mapping rehearsal โดยไม่บันทึก identity values ลง Git

## In-memory identity rehearsal

```powershell
pnpm run migration:test
pnpm run migration:rehearse:identity
```

สองคำสั่งนี้ใช้ sanitized fixture และไม่มีการเชื่อมฐานข้อมูล กฎปัจจุบันคือ:

- record ที่มีเอกสารชนิด/ประเทศ/เลขเดียวกันจะรวมเป็น Person เดียวพร้อมหลาย role
- legacy CID ที่เป็นตัวเลข 13 หลักถูก map เป็น `THAI_CID/TH`
- ค่าในช่อง CID เดิมที่ไม่ใช่ 13 หลักจะไม่ถูกทิ้งหรือเดาว่าเป็น Passport แต่ติดธง `UNCLASSIFIED_LEGACY_IDENTITY_DOCUMENT`
- record ที่ไม่มีเอกสารจะไม่ถูกจับคู่ด้วยชื่อ แต่แยกเป็นคนละ Person และติดธงให้ตรวจด้วยมือ
- profile ที่ขัดแย้งกันภายใต้เอกสารเดียวกันถูกส่งให้ตรวจด้วยมือ
- ทุก source record ที่ผ่าน validation เก็บ legacy identity เพื่อรองรับ idempotent import

ไฟล์ input จริงอาจมีข้อมูลส่วนบุคคลและต้องอยู่นอก Git ส่วน report จากคำสั่ง rehearsal มีเฉพาะตัวเลขรวม
