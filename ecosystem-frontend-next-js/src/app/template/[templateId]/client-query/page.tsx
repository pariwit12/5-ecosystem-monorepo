// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

// CSR - Client Side Rendering                เหมาะกับ query ข้อมูลขนาดใหญ่
// SSR - Server Side Rendering (Hydration)    เหมาะกับ query ข้อมูลขนาดเล็ก
// SSR - Server Side Rendering (initialData)  เหมาะกับ มี DB สำหรับ GET แยกออกมาอีกตัว (สามารถใช้โควต้าได้อย่างสิ้นเปลือง แต่ UX จะเร็วและดีกว่า)

import { redirect } from "next/navigation";

// ปรับตามใช้งานจริง
import TemplateClient from "./client-page";

// ==========================================
// สร้างฟังก์ชัน สำหรับตรวจสอบ URL
// ==========================================

// 🌟 สร้าง Regex ตรวจสอบ UUID (วางไว้นอก Component เพื่อไม่ให้ถูกสร้างใหม่ทุกรอบ)

const uuidV7Regex = // ฟอร์แมตสำหรับ UUIDv7
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ==========================================
// (จบ) สร้างฟังก์ชัน สำหรับตรวจสอบ URL
// ==========================================

// ==========================================
// 🖥️ Component หลัก
// ==========================================

// ปรับตามใช้งานจริง
export default async function TemplatePage({
  //
  // ปรับตามใช้งานจริง
  params,
  searchParams,
  // เปลี่ยนชื่อไม่ได้ Next.js กำหนดมาว่าต้องเป็น params และ searchParams เท่านั้น
}: {
  //
  // ปรับตามใช้งานจริง
  params: Promise<{
    //
    // ปรับตามใช้งานจริง
    templateId: string;
    anotherId: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined; // type ของค่าที่รับมาผ่าน query ที่จะเกิดขึ้นได้
  }>;
}) {
  //
  // ==========================================
  // ตรวจสอบ URL (param)
  // ==========================================

  // ฝั่ง Server จะใช้ await params;
  // ฝั่ง Client จะใช้ use(params);

  const resolvedParams = await params;

  // var: 1 (From Params)

  // ปรับตามใช้งานจริง
  const templateId = resolvedParams.templateId; // ปรับตามใช้งานจริง

  // ปรับตามใช้งานจริง
  if (
    !uuidV7Regex // ปรับตามใช้งานจริง
      .test(
        templateId, // ปรับตามใช้งานจริง
      )
  ) {
    //
    // 🌟 เตะกลับทันทีที่ฝั่งเซิร์ฟเวอร์ (ไร้รอยต่อ) + แนบ Parameter ?error=invalid_id กลับไปด้วย

    redirect(
      //
      // ปรับตามใช้งานจริง
      `/${templateId}/template?error=invalid_id`, // ปรับตามใช้งานจริง
    );

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

  // var: 2 (From Params)

  // ปรับตามใช้งานจริง
  const anotherId = resolvedParams.anotherId; // ปรับตามใช้งานจริง

  // ปรับตามใช้งานจริง
  if (
    !uuidV7Regex // ปรับตามใช้งานจริง
      .test(
        anotherId, // ปรับตามใช้งานจริง
      )
  ) {
    redirect(
      //
      // ปรับตามใช้งานจริง
      `/${anotherId}/template?error=invalid_id`, // ปรับตามใช้งานจริง
    );
  }

  // ==========================================
  // (จบ) ตรวจสอบ URL (param)
  // ==========================================

  // ==========================================
  // ตรวจสอบ URL (query)
  // ==========================================

  const resolvedSearchParams = await searchParams;

  // var: 1 (From Query)

  // ปรับตามใช้งานจริง
  const templateQueryId =
    typeof (
      resolvedSearchParams.templateQueryId // ปรับตามใช้งานจริง
    ) === "string"
      ? resolvedSearchParams.templateQueryId // ปรับตามใช้งานจริง
      : undefined;
  // หากเป็น string[] เช่น ?templateQueryId=abc&templateQueryId=def ให้ถือซะว่าเหมือน undefined

  // ปรับตามใช้งานจริง
  if (
    //
    // ปรับตามใช้งานจริง
    templateQueryId !== undefined &&
    //
    !uuidV7Regex // ปรับตามใช้งานจริง
      .test(
        templateQueryId, // ปรับตามใช้งานจริง
      )
  ) {
    redirect(
      `/template/${templateId}/templateQuery?error=invalid_template_query_id`, // ปรับตามใช้งานจริง
    );
  }

  // ==========================================
  // (จบ) ตรวจสอบ URL (query)
  // ==========================================

  return (
    //
    // ปรับตามใช้งานจริง
    <TemplateClient
      //
      // ปรับตามใช้งานจริง
      templateId={templateId} // ปรับตามใช้งานจริง
      templateQueryId={templateQueryId} // ปรับตามใช้งานจริง
    />
  );
}

// อย่าลืมไปลงทะเบียน protected route ใน src/proxy.ts
