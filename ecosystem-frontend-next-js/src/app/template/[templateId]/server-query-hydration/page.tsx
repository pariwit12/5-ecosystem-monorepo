// ------------------------------------------------------------------------
// Pattern: Server First Query (Hydration) + Client Fetching
// ------------------------------------------------------------------------

// Client Side Rendering                เหมาะกับ query ข้อมูลขนาดใหญ่
// Server Side Rendering (Hydration)    เหมาะกับ query ข้อมูลขนาดเล็ก
// Server Side Rendering (initialData)  เหมาะกับ มี DB สำหรับ GET แยกออกมาอีกตัว (สามารถใช้โควต้าได้อย่างสิ้นเปลือง แต่ UX จะเร็วและดีกว่า)

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server"; // ตัวแทน useAuth ฝั่ง Server
import { isAxiosError } from "axios";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

// ปรับตามใช้งานจริง
import TemplateClient from "./client-page";

// ----------- Import Queries -----------
import {
  // ปรับตามใช้งานจริง
  templateQueries,

  // ปรับตามใช้งานจริง
} from "@/features/[template]/[template].queries";

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
  params,
}: {
  params: Promise<{
    //
    // ปรับตามใช้งานจริง
    templateId: string;
  }>;
}) {
  //
  // ==========================================
  // ตรวจสอบ URL
  // ==========================================

  // ฝั่ง Server จะใช้ await params;
  // ฝั่ง Client จะใช้ use(params);

  const resolvedParams = await params;

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
      "/template?error=invalid_id", // ปรับตามใช้งานจริง
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

  // ==========================================
  // (จบ) ตรวจสอบ URL
  // ==========================================

  // =============================
  // Server Query + Hydration
  // =============================

  const { userId, getToken } = await auth();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0, // 👈 ปิด Retry บน Server
      },
    },
  });

  try {
    await queryClient.fetchQuery(
      //
      templateQueries // ปรับตามใช้งานจริง
        //
        // ปรับตามใช้งานจริง
        .getTemplate(
          //
          // ปรับตามใช้งานจริง
          templateId,
          "valueTwo",
          "valueThree",

          // ปรับตามใช้งานจริง
          userId,
          getToken, // ส่ง getToken ของฝั่ง Server เข้าไปได้เลย เพราะ signature ตรงกัน (Promise<string | null>)

          // ปรับตามใช้งานจริง
          [],
          //
        ),
    );
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      // ปรับตามใช้งานจริง (จาก Backend)
      const errorCode = error.response?.data?.errorCode;

      // สร้างลิสต์ของ Error ที่เราต้องการเตะออก (ใช้ Enum ที่ import มาได้เลย)

      const accessDeniedErrors = [
        //
        // ปรับตามใช้งานจริง
        ErrorCode.ORGANIZATION_NOT_FOUND,
        ErrorCode.ORGANIZATION_DELETED,
        ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
      ];

      if (accessDeniedErrors.includes(errorCode)) {
        //
        // ปรับตามใช้งานจริง
        redirect(
          //
          // ปรับตามใช้งานจริง
          `/template?error=${errorCode}`,
          //
        );
        //
      }
    }

    throw error; // ส่งไปให้ error.tsx จัดการ
  }

  // =============================
  // (จบ) Server Query + Hydration
  // =============================

  // =============================
  // เรียก Client-Page
  // =============================

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/*  */}
      <TemplateClient // ปรับตามใช้งานจริง
        //
        // ปรับตามใช้งานจริง
        templateId={templateId} // ปรับตามใช้งานจริง
        //
      />
    </HydrationBoundary>
  );
}

// อย่าลืมไปลงทะเบียน protected route ใน src/proxy.ts
