"use client";

export interface SlotTypeOption {
  id: string;
  name: string;
}

interface SlotTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SlotTypeOption[];
  className?: string;
}

export function SlotTypeSelect({
  value,
  onChange,
  options,
  className = "",
}: SlotTypeSelectProps) {
  return (
    <div className={`flex w-full min-w-0 items-center gap-2 sm:w-auto ${className}`}>
      <label
        htmlFor="slot-type-filter"
        className="text-sm font-medium text-foreground whitespace-nowrap"
      >
        กะการทำงาน:
      </label>
      <select
        id="slot-type-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 min-w-0 flex-1 cursor-pointer rounded-lg border border-input bg-card p-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 sm:min-w-45 sm:flex-none"
      >
        <option value="all">ทั้งหมด (All Types)</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
