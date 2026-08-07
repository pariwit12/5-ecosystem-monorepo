import { cn } from "@/lib/utils";

export function DateTimeRangePicker({
  startDateTime,
  endDateTime,
  onStartChange,
  onEndChange,
  isSubmitting,
}: {
  startDateTime: string;
  endDateTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  isSubmitting: boolean;
}) {
  return (
    <div
      className={cn(
        "flex",
        "flex-wrap",
        "items-end ", // ชิดล่าง (แกนรอง)

        "gap-4",
        "p-4",

        "bg-white",
        "border",
        "border-gray-200",
        "rounded-xl",

        "shadow-sm",
      )}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-gray-700">
            เวลาเริ่มต้น
          </label>
          <input
            type="datetime-local"
            value={startDateTime}
            disabled={isSubmitting}
            onChange={(e) => onStartChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 border-gray-300 focus:ring-purple-100 focus:border-purple-500`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-gray-700">เวลาสิ้นสุด</label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => onEndChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 border-gray-300 focus:ring-purple-100 focus:border-purple-500`}
          />
        </div>
      </div>
    </div>
  );
}
