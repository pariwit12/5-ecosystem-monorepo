import { ShieldCheck, Clock, Users } from "lucide-react";

export default function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h3 className="break-words text-center text-xl font-extrabold text-foreground mb-2 sm:text-2xl">
        ยินดีต้อนรับสู่ระบบบริหารคลินิก
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        จัดการตารางนัดหมาย ประวัติคนไข้ และสต๊อกวัสดุทันตกรรมได้อย่างมืออาชีพ
        พร้อมสิทธิ์ทดลองใช้ฟรีเต็มรูปแบบ 30 วัน
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
        <div className="p-4 border rounded-xl bg-background flex items-start gap-3">
          <Clock className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-bold text-foreground text-sm">
              ทดลองใช้ฟรี 30 วัน
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              ไม่ต้องกรอกบัตรเครดิต เริ่มต้นใช้งานได้ทันที
            </p>
          </div>
        </div>
        <div className="p-4 border rounded-xl bg-background flex items-start gap-3">
          <Users className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-bold text-foreground text-sm">
              ไม่จำกัดจำนวนคนไข้
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              ทดสอบฟีเจอร์เวชระเบียนและตารางนัดหมายได้เต็มที่
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="min-h-11 w-full max-w-sm rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:px-6"
      >
        เริ่มต้นตั้งค่าคลินิก
      </button>
    </div>
  );
}
