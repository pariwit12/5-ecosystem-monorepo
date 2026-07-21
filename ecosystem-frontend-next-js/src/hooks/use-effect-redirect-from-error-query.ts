import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export const useEffectRedirectFromErrorQuery = {
  //

  // 1 (ดักจับ Error จาก verifyWorkSchedulePositionByWorkScheduleAdmin)
  ErrorCodeVerifyWorkSchedulePositionByWorkScheduleAdmin: ({
    errorQuery,
    dataQuery,
    placeId,
  }: {
    errorQuery: unknown;
    dataQuery: unknown;
    placeId: string;
  }) => {
    const router = useRouter();

    useEffect(() => {
      if (errorQuery && isAxiosError(errorQuery)) {
        const errorCode = errorQuery.response?.data?.errorCode;

        if ([ErrorCode.PERSON_NOT_FOUND].includes(errorCode)) {
          router.push(`/person/new?error=${errorCode}`);
          return;
        }

        if (
          [
            ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
            ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
          ].includes(errorCode)
        ) {
          router.push(`/work-schedule?error=${errorCode}`);
          return;
        }

        if (
          [
            ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
            ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
          ].includes(errorCode)
        ) {
          router.push(
            `/work-schedule/admin/${placeId}/position?error=${errorCode}`,
          );
          return;
        }
      }

      // =================================================
      // Error จากการ fetching ที่ผ่านตรวจสอบ redirect แล้ว
      // =================================================

      // Handle Background Fetching Error Toast
      if (errorQuery && dataQuery !== undefined) {
        toast.error(
          "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
        );
      }
      // (จบ) Handle Background Fetching Error Toast

      //
    }, [errorQuery, dataQuery, router, placeId]);
  },

  // 2 (ดักจับ Error จาก ...)

  //
};
