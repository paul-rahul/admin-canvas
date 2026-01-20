import { useEffect, useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type YearScrollCalendarProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  yearCount?: number;
  className?: string;
};

export function YearScrollCalendar({
  value,
  onChange,
  yearCount = 24,
  className,
}: YearScrollCalendarProps) {
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: yearCount }, (_, index) => currentYear - index);
  }, [yearCount]);
  const [month, setMonth] = useState<Date | undefined>(value ?? undefined);

  useEffect(() => {
    if (value) {
      setMonth(value);
    }
  }, [value]);

  return (
    <div className={cn("flex gap-3", className)}>
      <div className="h-full max-h-[300px] w-20 overflow-y-auto rounded-md border border-border/60 bg-muted/30 p-1 text-[11px]">
        {yearOptions.map((year) => {
          const isActive = (month ?? value)?.getFullYear() === year;
          return (
            <button
              key={year}
              type="button"
              className={cn(
                "w-full rounded px-2 py-1 text-left transition",
                isActive
                  ? "bg-primary/20 text-foreground"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
              onClick={() => {
                const base = month ?? value ?? new Date();
                const next = new Date(base);
                next.setFullYear(year);
                setMonth(next);
                onChange(next);
              }}
            >
              {year}
            </button>
          );
        })}
      </div>
      <Calendar
        mode="single"
        selected={value ?? undefined}
        onSelect={(date) => {
          onChange(date ?? null);
          if (date) {
            setMonth(date);
          }
        }}
        month={month}
        onMonthChange={setMonth}
      />
    </div>
  );
}
