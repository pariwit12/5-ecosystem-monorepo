# Migration batch 002: clinic catalog foundation

สถานะ: Target schema implemented; legacy extractor/import ยังไม่เริ่ม

## Scope

สร้าง target foundation สำหรับข้อมูลอ้างอิงที่ visits และ payments ต้องใช้ โดยยังไม่ migrate ประวัติการรักษาหรือยอดเงิน

| Legacy source                              | Target                                     | Rule                                                            |
| ------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------- |
| `procedures`                               | `DentalProcedure`                          | แยกตามคลินิก, ใช้ UUID ใหม่, เก็บ legacy source/id              |
| `payment_methods`                          | `ClinicPaymentMethod`                      | แยกตามคลินิกและ unique ชื่อภายในคลินิก                          |
| `doctor_fee_rates` ที่มี `doctor_id`       | `DentistProcedureFeeRate`                  | ต้อง resolve dentist affiliation และ procedure ในคลินิกเดียวกัน |
| `doctor_fee_rates` ที่ `doctor_id IS NULL` | `DentalProcedure.defaultDentistFeePercent` | เป็น default ของ procedure                                      |

## Target decisions

- Catalog เป็นของ `OrganizationDentalClinic` ไม่ใช่ global เพราะราคา วิธีชำระ และค่ามือแตกต่างกันได้ในแต่ละคลินิก
- ใช้ `active` แทน hard delete เพื่อไม่ทำลาย reference ของประวัติในอนาคต
- ชื่อใช้สำหรับแสดงผล ไม่ใช้เป็น migration identity; ใช้ `(clinic, legacySource, legacyId)` สำหรับ idempotency
- ราคาใช้ `Decimal(10,2)` และต้องไม่ติดลบ
- ถ้ามีทั้ง min/max ต้อง `min <= max`; default price ต้องอยู่ในช่วงที่กำหนด
- fee percent ต้องอยู่ระหว่าง 0–100
- ค่า default fee อยู่บน procedure; override รายทันตแพทย์อยู่ในตารางแยก
- target ไม่ใช้ fallback 50% แบบ hard-coded ของระบบเก่า หาก source ไม่มีค่าให้คง `null` จนคลินิกตั้งค่าอย่างชัดเจน
- `continue_tx_command`, `continue_tx_id`, `continue_tx_tooth` ถูกเลื่อนไป batch treatment-plan เพราะเป็น workflow และอ้างอิง continuing treatment domain
- Payment method classification, สิทธิประกัน และการตัดสินใจว่าออกใบเสร็จหรือไม่ ถูกเลื่อนไป payment domain ห้ามอนุมานจากชื่อภาษาไทยระหว่าง import catalog

## Field mapping

| Source field                    | Target field                   | Transformation / validation                                       |
| ------------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| `procedures.id`                 | `DentalProcedure.legacyId`     | integer เดิม + `legacySource=legacy-dental-clinic`                |
| `procedures.name`               | `DentalProcedure.name`         | trim; null/blank ต้อง rejected                                    |
| `procedures.category`           | `DentalProcedure.category`     | trim; blank เป็น null                                             |
| `default_price`                 | `defaultPrice`                 | decimal 2 ตำแหน่ง; nonnegative; ต้องอยู่ใน min/max ถ้ามี          |
| `min_price` / `max_price`       | `minPrice` / `maxPrice`        | decimal 2 ตำแหน่ง; nonnegative; min ไม่เกิน max                   |
| `payment_methods.id`            | `ClinicPaymentMethod.legacyId` | integer เดิม + legacy source                                      |
| `payment_methods.method`        | `ClinicPaymentMethod.name`     | trim; null/blank ต้อง rejected; duplicate name ส่ง manual review  |
| `doctor_fee_rates.id`           | fee legacy id                  | ใช้สำหรับ traceability และ idempotent rerun                       |
| `doctor_fee_rates.procedure_id` | procedure relation             | ต้อง resolve ได้หนึ่งรายการ                                       |
| `doctor_fee_rates.doctor_id`    | dentist affiliation            | null หมายถึง procedure default; non-null ต้อง resolve affiliation |
| `doctor_fee_rates.fee_percent`  | `feePercent` / default fee     | decimal 2 ตำแหน่งและ 0–100                                        |

## Known source defects handled explicitly

- Legacy controller รับ/เขียนชื่อ `fee_rate` แต่ Prisma schema, validator และ payment calculation ใช้ `fee_percent`; migration ยึด column ในฐานข้อมูลคือ `fee_percent`
- Legacy runtime fallback เป็น 50% เมื่อหา rate ไม่พบ แต่ค่านี้ไม่ได้ถูกเก็บและอาจไม่ใช่นโยบายทุกคลินิก จึงไม่สร้างค่า 50% อัตโนมัติ
- Receipt/insurance logic เดิมเทียบข้อความ `ประกันสังคม` และ `บัตรทอง`; target catalog ไม่ฝัง business rule จากชื่อ

## Reconciliation requirements

- ทุก imported source id resolve กลับไป target ได้หนึ่งรายการ
- procedure/payment method count = imported + rejected
- ไม่มี duplicate legacy identity ภายในคลินิก
- ไม่มี dentist override ที่อ้าง dentist คนละคลินิก
- decimal values ตรงหลัง normalize 2 ตำแหน่ง
- rerun ไม่สร้าง catalog หรือ fee rate ซ้ำ

## Deferred before data apply

- สร้าง read-only aggregate audit สำหรับ null, duplicate, invalid ranges และ orphan foreign keys
- สร้าง sanitized mapping fixtures และ planner
- ทดสอบกับ disposable target ก่อนใช้ legacy snapshot
