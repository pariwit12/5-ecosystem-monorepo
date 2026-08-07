// ------------------------------------------------------------------------
// Pattern: SSR (Hydration) + Client Fetching
// ------------------------------------------------------------------------

// CSR - Client Side Rendering                เหมาะกับ query ข้อมูลขนาดใหญ่
// SSR - Server Side Rendering (Hydration)    เหมาะกับ query ข้อมูลขนาดเล็ก
// SSR - Server Side Rendering (initialData)  เหมาะกับ มี DB สำหรับ GET แยกออกมาอีกตัว (สามารถใช้โควต้าได้อย่างสิ้นเปลือง แต่ UX จะเร็วและดีกว่า)

// ===================================================
// ==>>==>>== ใช้โค้ด client จาก client-query ==<<==<<==
// ===================================================

"use client";

export default function Client({
  // eslint-disable-next-line
  templateId,
  // eslint-disable-next-line
  templateQueryId,
}: {
  templateId: string;
  templateQueryId?: string;
}) {
  return <></>;
}
