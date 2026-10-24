import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
// import { useCreateOrganizationDentalClinic } from "@/features/..."; // เตรียมไว้สำหรับอนาคต

const setupClinicSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อคลินิก"),
  licenseNumber: z.string().optional(),
});

type SetupClinicFormValues = z.infer<typeof setupClinicSchema>;

export default function StepSetup({
  defaultName,
  onNext,
  onBack,
}: {
  defaultName: string;
  onNext: () => void;
  onBack: () => void;
}) {
  // 🌟 รอใส่ useMutation ของจริง
  // const createClinicMutation = useCreateOrganizationDentalClinic(orgId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupClinicFormValues>({
    resolver: zodResolver(setupClinicSchema),
    values: {
      name: defaultName, // ดึงชื่อองค์กรมาเป็น Default
      licenseNumber: "",
    },
  });

  const onSubmit = async () => {
    // 🌟 Dummy Mutation (จำลองการยิง API 1.5 วินาที)
    const dummyPromise = new Promise((resolve) => setTimeout(resolve, 1500));

    toast.promise(dummyPromise, {
      loading: "กำลังสร้างระบบคลินิกของคุณ...",
      success: () => {
        onNext(); // เตะไปหน้า Success
        return "สร้างคลินิกสำเร็จ! เริ่มทดลองใช้งานได้เลย";
      },
      error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <h3 className="text-2xl font-bold text-foreground mb-2">
        ตั้งค่าข้อมูลคลินิก
      </h3>
      <p className="text-muted-foreground mb-8 text-sm">
        ข้อมูลนี้จะใช้แสดงในใบเสร็จและใบนัดหมาย (สามารถแก้ไขได้ภายหลัง)
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-foreground">
            ชื่อคลินิก <span className="text-destructive">*</span>
          </label>
          <input
            {...register("name")}
            type="text"
            className={`p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.name
                ? "border-destructive focus:ring-destructive"
                : "border-border focus:border-ring focus:ring-primary"
            }`}
            placeholder="ตัวอย่าง: คลินิกทันตกรรมฟันดี"
          />
          {errors.name && (
            <span className="text-sm text-destructive">{errors.name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-foreground">
            เลขที่ใบอนุญาตสถานพยาบาล (ถ้ามี)
          </label>
          <input
            {...register("licenseNumber")}
            type="text"
            className="p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:border-ring focus:ring-primary transition-all"
            placeholder="ตัวอย่าง: 10101010101"
          />
        </div>

        <div className="mt-2 flex flex-col-reverse justify-between gap-3 border-t pt-6 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="min-h-11 w-full rounded-lg px-6 py-2 font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50 sm:w-auto"
          >
            ย้อนกลับ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 sm:w-auto sm:px-6"
          >
            {isSubmitting ? "กำลังสร้างระบบ..." : "ยืนยันและเริ่มใช้งานฟรี"}
          </button>
        </div>
      </form>
    </div>
  );
}
