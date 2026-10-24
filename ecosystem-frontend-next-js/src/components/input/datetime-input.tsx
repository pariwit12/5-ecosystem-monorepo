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

        "bg-card",
        "border",
        "border-border",
        "rounded-xl",

        "shadow-sm",
      )}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-foreground">
            เวลาเริ่มต้น
          </label>
          <input
            type="datetime-local"
            value={startDateTime}
            disabled={isSubmitting}
            onChange={(e) => onStartChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 border-border focus:ring-primary focus:border-ring`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-foreground">เวลาสิ้นสุด</label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => onEndChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 border-border focus:ring-primary focus:border-ring`}
          />
        </div>
      </div>
    </div>
  );
}
