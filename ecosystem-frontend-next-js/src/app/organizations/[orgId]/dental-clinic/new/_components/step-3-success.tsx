import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";

export default function StepSuccess({ orgId }: { orgId: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-700">
      <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
        <PartyPopper className="w-12 h-12" />
      </div>
      <h3 className="break-words text-center text-2xl font-extrabold text-foreground mb-2 sm:text-3xl">
        ยินดีด้วย! ระบบพร้อมใช้งานแล้ว
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-2">
        เราได้จัดเตรียมพื้นที่สำหรับคลินิกทันตกรรมของคุณเรียบร้อยแล้ว
      </p>
      <p className="text-primary font-medium text-center mb-10">
        สิทธิ์ทดลองใช้งานฟรี: 30 วัน
      </p>

      <button
        onClick={() =>
          router.push(`/organizations/${orgId}/dental-clinic/dashboard`)
        }
        className="min-h-11 w-full max-w-sm justify-center rounded-xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 flex items-center gap-2 sm:w-auto"
      >
        เข้าสู่แผงควบคุมคลินิก
      </button>
    </div>
  );
}
