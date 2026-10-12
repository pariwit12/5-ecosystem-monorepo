# Migration import strategy

## Current approach

ระบบใหม่สามารถเริ่มรับข้อมูลใหม่ได้โดยไม่ต้องรอ full import จากระบบเก่า ข้อมูลเก่าจะไม่ถูกดึงเข้าระบบ production จนกว่า domain และ import workflow จะพร้อม

## Why keep a legacy snapshot later

ไม่จำเป็นต้อง import ข้อมูลเก่าทั้งหมดตั้งแต่วันนี้ แต่ snapshot ที่ read-only ยังมีประโยชน์สำหรับ:

- ตรวจ row count และค่าที่ผิดปกติ
- วัด duplicate ของผู้ป่วย/บุคลากร
- ยืนยัน mapping และ null/default rules
- ทดสอบ idempotent re-run
- ทำ rehearsal ก่อน cutover

Snapshot ควรเก็บอยู่นอก Git และไม่ควรนำข้อมูลส่วนบุคคลมาใส่ใน fixture หรือ log

## Recommended batches

1. New-system foundation: organization, person, roles, patient affiliation และ patient number generation
2. Optional legacy reference import: บุคลากรและคนไข้ที่ต้องใช้ในช่วงเปิดระบบ
3. Appointments and schedules
4. Procedures, visits และ payments
5. Queue, images, examinations, feedback และ continuing treatment

แต่ละ batch ต้องมี source snapshot/version, mapping report, rejected-row report และ reconciliation result แยกกัน

## Patient number rule

`patientNumber` เป็นเลข running ภายใน `OrganizationDentalClinic` เท่านั้น เลขเดียวกันสามารถเกิดในคนละคลินิกได้ แต่ห้ามซ้ำในคลินิกเดียวกัน การจองเลขต้องอยู่ใน transaction และต้องมี database unique constraint เป็นด่านสุดท้าย
