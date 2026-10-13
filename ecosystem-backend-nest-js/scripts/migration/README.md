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
