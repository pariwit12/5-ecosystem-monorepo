// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { cn } from "@/lib/utils";

import { ChildrenHeader } from "@/components/children-header";
import { CreateForm } from "@/features/work-schedule/slot-type/components/create-form";

export default function Client({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  return (
    <>
      <div
        className={cn(
          "@container",

          "w-full",

          "max-w-7xl",

          "mx-auto",

          "flex",
          "flex-col",
          "gap-2 sm:gap-3",

          "relative",

          "px-4 sm:px-6",

          "py-4 sm:py-6",
        )}
      >
        <ChildrenHeader
          title={`สร้างประเภทเวรใหม่`}
          description={`กรอกรายละเอียดและบันทึกเพื่อดำเนินการต่อ`}
          backHref={`/work-schedule/admin/${placeId}/position/${positionId}/slot-type`}
        />

        <CreateForm
          positionId={positionId}
          urlOnSuccess={`/work-schedule/admin/${placeId}/position/${positionId}/slot-type`}
          urlOnCancel={`/work-schedule/admin/${placeId}/position/${positionId}/slot-type`}
          skipErrorCodes={[]}
        />
      </div>
    </>
  );
}
