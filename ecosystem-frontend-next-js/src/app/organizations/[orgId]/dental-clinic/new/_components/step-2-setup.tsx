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
      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        ตั้งค่าข้อมูลคลินิก
      </h3>
      <p className="text-gray-500 mb-8 text-sm">
        ข้อมูลนี้จะใช้แสดงในใบเสร็จและใบนัดหมาย (สามารถแก้ไขได้ภายหลัง)
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-700">
            ชื่อคลินิก <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name")}
            type="text"
            className={`p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.name
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
            }`}
            placeholder="ตัวอย่าง: คลินิกทันตกรรมฟันดี"
          />
          {errors.name && (
            <span className="text-sm text-red-500">{errors.name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-700">
            เลขที่ใบอนุญาตสถานพยาบาล (ถ้ามี)
          </label>
          <input
            {...register("licenseNumber")}
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-all"
            placeholder="ตัวอย่าง: 10101010101"
          />
        </div>

        <div className="flex justify-between border-t pt-6 mt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition disabled:opacity-50"
          >
            ย้อนกลับ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "กำลังสร้างระบบ..." : "ยืนยันและเริ่มใช้งานฟรี"}
          </button>
        </div>
      </form>
    </div>
  );
}
