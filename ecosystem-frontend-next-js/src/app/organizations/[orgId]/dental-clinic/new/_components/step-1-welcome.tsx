import { ShieldCheck, Clock, Users } from "lucide-react";

export default function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-extrabold text-gray-800 mb-2">
        ยินดีต้อนรับสู่ระบบบริหารคลินิก
      </h3>
      <p className="text-gray-500 text-center max-w-md mb-8">
        จัดการตารางนัดหมาย ประวัติคนไข้ และสต๊อกวัสดุทันตกรรมได้อย่างมืออาชีพ
        พร้อมสิทธิ์ทดลองใช้ฟรีเต็มรูปแบบ 30 วัน
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
        <div className="p-4 border rounded-xl bg-gray-50 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-800 text-sm">
              ทดลองใช้ฟรี 30 วัน
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              ไม่ต้องกรอกบัตรเครดิต เริ่มต้นใช้งานได้ทันที
            </p>
          </div>
        </div>
        <div className="p-4 border rounded-xl bg-gray-50 flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-800 text-sm">
              ไม่จำกัดจำนวนคนไข้
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              ทดสอบฟีเจอร์เวชระเบียนและตารางนัดหมายได้เต็มที่
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md w-full max-w-sm"
      >
        เริ่มต้นตั้งค่าคลินิก
      </button>
    </div>
  );
}
