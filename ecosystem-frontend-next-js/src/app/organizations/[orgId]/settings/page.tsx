import { redirect } from "next/navigation";
import OrganizationSettingsClient from "./client-page";

// 🌟 สร้าง Regex ตรวจสอบ UUID (วางไว้นอก Component เพื่อไม่ให้ถูกสร้างใหม่ทุกรอบ)
// ฟอร์แมตนี้ครอบคลุมทั้ง UUIDv4 และ UUIDv7 ครับ
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const resolvedParams = await params;
  // ฝั่ง Server จะใช้ await params;
  // ฝั่ง Client จะใช้ use(params);
  const orgId = resolvedParams.orgId;

  // 🌟 ด่านที่ 1 (Server): เช็ค URL ตั้งแต่ก่อนเรนเดอร์หน้าเว็บ
  if (!uuidRegex.test(orgId)) {
    // 🌟 แนบ Parameter ?error=invalid_id กลับไปด้วย
    redirect("/organizations?error=invalid_id"); // เตะกลับทันทีที่ฝั่งเซิร์ฟเวอร์ (ไร้รอยต่อ)
    // ฝั่ง Server ใช้ redirect() (จาก next/navigation)
    // พื้นที่ทำงาน: ทำงานบน Server เท่านั้น (ใช้ใน Server Components, Server Actions หรือ Route Handlers)
    // จังหวะการทำงาน: ทำงาน "ก่อน" ที่หน้าเว็บจะถูกสร้างเสร็จและส่งไปหาผู้ใช้
    // กลไกเบื้องหลัง: ทันทีที่เซิร์ฟเวอร์อ่านเจอคำสั่งนี้ มันจะหยุดการสร้างหน้าเว็บทันที แล้วขว้าง HTTP Status Code (เช่น 307 Temporary Redirect) กลับไปบอกเบราว์เซอร์ว่า "ห้ามเข้าหน้านี้นะ ให้เปลี่ยนทางไป URL อื่นเดี๋ยวนี้"
    // ประสบการณ์ผู้ใช้ (UX): เนียนกริบ 100% ผู้ใช้จะไม่เห็นหน้าเว็บเดิมกระพริบขึ้นมาเลยแม้แต่นิดเดียว

    // ฝั่ง Client ใช้ router.push() (จาก useRouter())
    // พื้นที่ทำงาน: ทำงานบน Client (Browser) เท่านั้น (ต้องอยู่ในไฟล์ที่มี "use client" เสมอ)
    // จังหวะการทำงาน: ทำงาน "หลังจาก" ที่หน้าเว็บถูกส่งมาโหลดที่หน้าจอของผู้ใช้เรียบร้อยแล้ว
    // กลไกเบื้องหลัง: เป็นการสั่งให้ฝั่งหน้าบ้านใช้ History API ของเบราว์เซอร์ในการเปลี่ยน URL (คล้ายการกดลิงก์) โดยไม่ต้องโหลดหน้าเว็บใหม่ทั้งหน้า (ตามสไตล์ Single-Page Application)
    // ประสบการณ์ผู้ใช้ (UX): หากเอามาใช้ทำหน้าที่ดักจับผู้ใช้ผิดๆ (เช่น เอาไปใส่ใน useEffect แบบตอนแรก) ผู้ใช้จะต้องรอให้หน้าจอวาดโครงสร้างเสร็จก่อนแวบนึง พอ React ทำงานถึงจะโดนเตะออก ทำให้เกิดอาการ "หน้าจอกระพริบ (UI Flash)" ให้เห็นครับ
  }

  // ถ้าผ่านมาได้ แปลว่า orgId เป็น UUID แน่นอน 100% ค่อยส่งไปให้หน้า UI
  return <OrganizationSettingsClient orgId={orgId} />;
}
