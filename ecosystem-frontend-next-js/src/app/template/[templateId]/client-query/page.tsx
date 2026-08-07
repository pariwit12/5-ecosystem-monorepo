// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

// CSR - Client Side Rendering                เหมาะกับ query ข้อมูลขนาดใหญ่
// SSR - Server Side Rendering (Hydration)    เหมาะกับ query ข้อมูลขนาดเล็ก
// SSR - Server Side Rendering (initialData)  เหมาะกับ มี DB สำหรับ GET แยกออกมาอีกตัว (สามารถใช้โควต้าได้อย่างสิ้นเปลือง แต่ UX จะเร็วและดีกว่า)

import { redirect } from "next/navigation";
import { PageErrorList } from "@/constants/page-error-list.enum";

import Client from "./client-page";

// ==>>==>> ฟังก์ชัน: ตรวจสอบ URL ==<<==<<==

// 🌟 สร้าง Regex ตรวจสอบ UUID (วางไว้นอก Component เพื่อไม่ให้ถูกสร้างใหม่ทุกรอบ)

const uuidV7Regex = // ฟอร์แมตสำหรับ UUIDv7
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ==>>==>> (จบ) ฟังก์ชัน: ตรวจสอบ URL ==<<==<<==

export default async function Page({
  //
  // ปรับตามใช้งานจริง
  params,
  searchParams,
  // เปลี่ยนชื่อไม่ได้ Next.js กำหนดมาว่าต้องเป็น params และ searchParams เท่านั้น
}: {
  // ปรับตามใช้งานจริง
  params: Promise<{
    //
    // ปรับตามใช้งานจริง
    templateId: string;
    anotherId: string;
  }>;
  searchParams: Promise<{
    // type ของค่าที่รับมาผ่าน query ที่จะเกิดขึ้นได้
    [key: string]: string | string[] | undefined;
  }>;
}) {
  //
  // ==>>==>>== params ที่แนบมา ==<<==<<==

  const resolvedParams = await params;

  // ฝั่ง Server จะใช้ await params;
  // ฝั่ง Client จะใช้ use(params);

  // ปรับตามใช้งานจริง
  const templateId = resolvedParams.templateId;

  // ตรวจสอบ Format แล้วโดย layout.tsx

  // ปรับตามใช้งานจริง
  // eslint-disable-next-line
  const anotherId = resolvedParams.anotherId;

  // ตรวจสอบ Format แล้วโดย layout.tsx ของ folder [anotherId]

  // ==>>==>>== (จบ) params ที่แนบมา ==<<==<<==

  // ==>>==>>== searchParams (Query) ที่แนบมา ==<<==<<==

  const resolvedSearchParams = await searchParams;

  // var: 1 (From Query)

  // ปรับตามใช้งานจริง
  const templateQueryId =
    typeof (
      // ปรับตามใช้งานจริง
      resolvedSearchParams.templateQueryId
    ) === "string"
      ? //
        // ปรับตามใช้งานจริง
        resolvedSearchParams.templateQueryId
      : undefined;

  // หากเป็น string[] เช่น ?templateQueryId=abc&templateQueryId=def ให้ถือซะว่าเหมือน undefined

  if (
    // ปรับตามใช้งานจริง
    templateQueryId !== undefined &&
    //
    // ปรับตามใช้งานจริง
    !uuidV7Regex.test(
      //
      // ปรับตามใช้งานจริง
      templateQueryId,
    )
  ) {
    redirect(
      // ปรับตามใช้งานจริง
      `/template/${templateId}/templateQuery?error=${PageErrorList.INVALID_ID}`,
    );
  }

  // ==>>==>>== (จบ) searchParams (Query) ที่แนบมา ==<<==<<==

  return (
    <Client
      // ปรับตามใช้งานจริง
      templateId={templateId}
      templateQueryId={templateQueryId}
    />
  );
}

// อย่าลืมไปลงทะเบียน protected route ใน src/proxy.ts
