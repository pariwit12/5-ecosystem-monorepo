// ------------------------------------------------------------------------
// Pattern: SSR (initialData) + Client Fetching
// ------------------------------------------------------------------------

// CSR - Client Side Rendering                เหมาะกับ query ข้อมูลขนาดใหญ่
// SSR - Server Side Rendering (Hydration)    เหมาะกับ query ข้อมูลขนาดเล็ก
// SSR - Server Side Rendering (initialData)  เหมาะกับ มี DB สำหรับ GET แยกออกมาอีกตัว (สามารถใช้โควต้าได้อย่างสิ้นเปลือง แต่ UX จะเร็วและดีกว่า)

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

// ตรวจสอบว่าเป็น Error เป็นรูปแบบ Error จาก Axios หรือไม่
import { isAxiosError } from "axios";

import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

// ข้อความที่เตรียมไว้สำหรับ ErrorCode แต่ละประเภท
import { USER_ERROR_MESSAGES } from "@/constants/error-messages";

// ErrorCode จากแต่ละ AccessControl
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

// Redirect From ErrorQuery
import { useEffectRedirectFromErrorQuery } from "@/hooks/use-effect-redirect-from-error-query";

import { cn } from "@/lib/utils";

// eslint-disable-next-line
import Link from "next/link";

// การเรียกใช้แบบนอก {} ชื่อไม่จำเป็นต้องตรงกับในไฟล์ ./loading.tsx หรือ ./error.tsx ก็ได้ (มันจะไปเอา default มาใช้อยู่แล้ว)
import Loading from "./loading";
import ErrorQuery from "./error";

import { ChildrenHeader } from "@/components/children-header";
// eslint-disable-next-line
import { MenuGrid } from "@/components/menu-grid/menu-gird";
// eslint-disable-next-line
import { MenuCard } from "@/components/menu-grid/menu-card";
import {
  // eslint-disable-next-line
  CalendarIcon,
  // eslint-disable-next-line
  PersonIcon,
  // eslint-disable-next-line
  DetailNoteIcon,
  // eslint-disable-next-line
  DocumentTextIcon,
  // eslint-disable-next-line
  SettingIcon,
  // eslint-disable-next-line
  PlusIcon,
} from "@/components/menu-grid/icon";

import {
  // ปรับตามใช้งานจริง
  templateQueries,

  // ปรับตามใช้งานจริง
} from "@/features/[program]/[feature]/[program]-[feature].queries";

// ==>>==>>== เพิ่ม Import Type ของ Response เพื่อใช้สร้าง type ให้ initialData ==<<==<<==

import {
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesResponse,

  // ปรับตามใช้งานจริง
} from "@backend/modules/[program]/[feature]/queries/get-[available_null]-[other-program_null]-[features_feature].query";

// ==>>==>>== (จบ) เพิ่ม Import Type ของ Response เพื่อใช้สร้าง type ให้ initialData ==<<==<<==

export default function Client({
  templateId,
  // eslint-disable-next-line
  templateQueryId,

  // ==>>==>>== รับข้อมูลที่ Server ใช้ดึงข้อมูล initialData เพื่อมาลง key ให้ถูกต้อง (ป้องกันลงผิดคีย์) ==<<==<<==

  // ปรับตามใช้งานจริง
  serverUserId,

  // ==>>==>>== เพิ่มเติมข้อมูล initialData จาก SSR เพื่อมาใส่เป็นค่าเริ่มต้นใน TanStack ==<<==<<==
  initialData,
}: {
  templateId: string;
  templateQueryId?: string;

  // ปรับตามใช้งานจริง
  serverUserId: string | null;
  initialData: GetAvailableOtherProgramFeaturesResponse;
}) {
  // eslint-disable-next-line
  const router = useRouter();
  const { getToken, userId: clientUserId, isLoaded } = useAuth();

  // ตรวจสอบว่า userId ตอนนี้ เหมือนกับที่ใช้ดึงข้อมูล initialData (ที่ Server) หรือไม่
  const isValidInitialData = clientUserId === serverUserId;

  // =================================
  // 🚀 ดึงข้อมูล Query
  // =================================

  // *** ตอนจะใช้: มาศึกษาวิธีกำหนด key ให้ initialData เพื่อความถูกต้อง (ตอนนี้ตรวจสอบแค่ userId)

  const {
    //
    // ปรับตามใช้งานจริง
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
    //
  } = useQuery({
    //
    // ปรับตามใช้งานจริง
    ...templateQueries

      // ปรับตามใช้งานจริง
      .queryGetTemplate(
        //
        // ปรับตามใช้งานจริง
        "string1",
        "string2",
        "string3",

        // ปรับตามใช้งานจริง
        clientUserId,
        getToken,

        // ปรับตามใช้งานจริง
        AccessControlErrorCode.verifyOrganizationAccess, // ปรับตามใช้งานจริง
      ),

    // ใส่ initialData ที่ได้จาก Server Component
    // ปรับตามใช้งานจริง
    initialData: isValidInitialData ? initialData : undefined,
    //
  });

  // =================================
  // 🚀 (จบ) ดึงข้อมูล Query
  // =================================

  return <></>;
}
