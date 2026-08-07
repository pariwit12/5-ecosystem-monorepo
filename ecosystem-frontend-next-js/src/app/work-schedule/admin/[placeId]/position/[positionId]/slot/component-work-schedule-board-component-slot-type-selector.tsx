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
    <div className={`flex items-center gap-2 ${className}`}>
      <label
        htmlFor="slot-type-filter"
        className="text-sm font-medium text-gray-700 whitespace-nowrap"
      >
        กะการทำงาน:
      </label>
      <select
        id="slot-type-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none bg-white cursor-pointer min-w-[180px]"
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
