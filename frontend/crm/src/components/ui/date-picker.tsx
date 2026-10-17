import React, { useState, useMemo } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from './popover';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  min,
  max,
  disabled = false,
  required = false,
  className,
  id,
  name,
}) => {
  const [open, setOpen] = useState(false);

  // Parse current value or default to today for calendar view
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-11

  // Update view when value changes and popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m] = value.split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      } else if (min && /^\d{4}-\d{2}-\d{2}$/.test(min)) {
        const [y, m] = min.split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
    setOpen(isOpen);
  };

  // Format value for display (e.g., "16 Oct 2026")
  const formattedDisplay = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const [y, m, d] = value.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return value;
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [value]);

  // Calendar calculations for viewMonth and viewYear
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  }, [viewYear, viewMonth]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    onChange(dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Generate years list for quick year navigation (from 1940 to 10 years ahead)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear + 10; y >= 1940; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Today check
  const todayDate = new Date();
  const isToday = (day: number) => {
    return (
      todayDate.getFullYear() === viewYear &&
      todayDate.getMonth() === viewMonth &&
      todayDate.getDate() === day
    );
  };

  // Selected check
  const isSelected = (day: number) => {
    if (!value) return false;
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    return value === dateStr;
  };

  // Disabled check against min and max
  const isDayDisabled = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;

    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold flex items-center justify-between transition-colors shadow-3xs hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
        >
          <span className={cn("truncate", !formattedDisplay && "text-zinc-400 font-normal")}>
            {formattedDisplay || placeholder}
          </span>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {value && !required && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                title="Clear date"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <CalendarIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
        </button>
      </PopoverTrigger>

      {/* Hidden native input for form compatibility */}
      <input
        type="hidden"
        name={name}
        value={value || ''}
      />

      <PopoverContent
        align="start"
        className="w-72 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[150]"
      >
        {/* Calendar Header with Navigation & Dropdowns */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="text-xs font-bold text-zinc-900 dark:text-zinc-50 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 rounded-lg px-2 py-1 outline-hidden cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
                  {name}
                </option>
              ))}
            </select>

            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="text-xs font-bold text-zinc-900 dark:text-zinc-50 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 rounded-lg px-2 py-1 outline-hidden cursor-pointer"
            >
              {yearOptions.map(y => (
                <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
          {DAY_NAMES.map(d => (
            <span key={d} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {/* Leading blank days for first day of week */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`blank-${idx}`} className="h-8 w-8" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const selected = isSelected(day);
            const today = isToday(day);
            const disabledDay = isDayDisabled(day);

            return (
              <button
                key={day}
                type="button"
                disabled={disabledDay}
                onClick={() => handleSelectDay(day)}
                className={cn(
                  "h-8 w-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative",
                  selected
                    ? "bg-violet-600 text-white font-bold shadow-xs hover:bg-violet-700"
                    : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80",
                  today && !selected && "border border-violet-500/60 font-bold text-violet-600 dark:text-violet-400",
                  disabledDay && "opacity-25 cursor-not-allowed hover:bg-transparent"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Calendar Footer: Quick Actions */}
        <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSelectToday}
            className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
