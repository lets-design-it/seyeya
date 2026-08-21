import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatEATTime, formatEATDate } from '../utils/formatters';

export const EATClock: React.FC = () => {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    // Update every second
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-xs font-mono text-muted-foreground animate-pulse shadow-xs">
        <Clock className="h-3.5 w-3.5 text-amber-500 opacity-60" />
        <span>--:--:-- --</span>
        <span className="text-[10px] px-1 py-0.5 rounded font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          EAT
        </span>
      </div>
    );
  }

  const formattedTime = formatEATTime(now);
  const formattedDate = formatEATDate(now);

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs text-xs shadow-xs transition-all hover:border-amber-500/30"
      title={`East Africa Time (EAT - UTC+3) | ${formattedDate}`}
    >
      <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
      <div className="flex items-baseline gap-1.5 font-mono">
        <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {formattedTime}
        </span>
        <span className="hidden sm:inline-block text-[10px] text-zinc-400 dark:text-zinc-500 font-sans">
          {formattedDate}
        </span>
      </div>
      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
        EAT
      </span>
    </div>
  );
};

export default EATClock;

