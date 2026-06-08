import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";

export default function StepSuccess({ orgId }: { orgId: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-700">
      <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
        <PartyPopper className="w-12 h-12" />
      </div>
      <h3 className="text-3xl font-extrabold text-gray-800 mb-2">
        ยินดีด้วย! ระบบพร้อมใช้งานแล้ว
      </h3>
      <p className="text-gray-500 text-center max-w-md mb-2">
        เราได้จัดเตรียมพื้นที่สำหรับคลินิกทันตกรรมของคุณเรียบร้อยแล้ว
      </p>
      <p className="text-blue-600 font-medium text-center mb-10">
        สิทธิ์ทดลองใช้งานฟรี: 30 วัน
      </p>

      <button
        onClick={() =>
          router.push(`/organizations/${orgId}/dental-clinic/dashboard`)
        }
        className="px-10 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-transform hover:scale-105 shadow-xl flex items-center gap-2"
      >
        เข้าสู่แผงควบคุมคลินิก
      </button>
    </div>
  );
}
