import React, { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { X, Bell, ShoppingBag, Bed, CalendarRange } from 'lucide-react';

export const OrderPopup: React.FC = () => {
  const { latestNotification, clearLatest } = useNotification();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (latestNotification) {
      setVisible(true);
      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        // Clear from context shortly after fade out animation
        setTimeout(clearLatest, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification, clearLatest]);

  if (!latestNotification || !visible) return null;

  const getTheme = () => {
    switch (latestNotification.type) {
      case 'order':
        return {
          bg: 'border-emerald-500/20 bg-card/90 shadow-emerald-500/5',
          icon: <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          badge: 'Restaurant Alert'
        };
      case 'booking':
        return {
          bg: 'border-violet-500/20 bg-card/90 shadow-violet-500/5',
          icon: <Bed className="h-4 w-4 text-violet-600 dark:text-violet-400" />,
          badge: 'Accommodation'
        };
      case 'event':
        return {
          bg: 'border-indigo-500/20 bg-card/90 shadow-indigo-500/5',
          icon: <CalendarRange className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
          badge: 'Conference Planner'
        };
    }
  };

  const theme = getTheme();

  return (
    <div className={`fixed top-4 right-4 z-50 w-full max-w-sm rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300 transform translate-y-0 opacity-100 ${theme.bg}`}>
      <div className="flex items-start gap-3">
        {/* Animated Badge Icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 animate-pulse">
          {theme.icon}
        </div>

        {/* Text Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 leading-none">{theme.badge}</span>
            <button 
              onClick={() => { setVisible(false); clearLatest(); }}
              className="text-zinc-500 hover:text-foreground p-0.5 rounded transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <h4 className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate leading-snug">{latestNotification.title}</h4>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">{latestNotification.message}</p>
        </div>
      </div>

      {/* Progress countdown indicator bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-b-2xl overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-shrink-width" />
      </div>

      {/* Embedded animation styling for countdown */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink-width {
          animation: shrinkWidth 5000ms linear forwards;
        }
      `}</style>
    </div>
  );
};
export default OrderPopup;


