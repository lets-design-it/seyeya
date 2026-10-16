import React, { useState, useRef, useEffect } from 'react';
import { useNotification, NotificationItem } from '../context/NotificationContext';
import { 
  Bell, 
  CheckCheck, 
  ShoppingBag, 
  Bed, 
  CalendarRange, 
  Receipt, 
  ShieldAlert, 
  Check, 
  Trash2, 
  RotateCw,
  ExternalLink
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications 
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const getItemVisuals = (item: NotificationItem) => {
    switch (item.type) {
      case 'order':
        return {
          icon: <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/20',
          badgeText: 'Restaurant'
        };
      case 'booking':
        return {
          icon: <Bed className="h-4 w-4 text-violet-600 dark:text-violet-400" />,
          bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-500/20',
          badgeText: 'Accommodation'
        };
      case 'event':
        return {
          icon: <CalendarRange className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
          bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/20',
          badgeText: 'Conference'
        };
      case 'payment':
        return {
          icon: <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/20',
          badgeText: 'Payment'
        };
      case 'security':
        return {
          icon: <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/20',
          badgeText: 'Security'
        };
      default:
        return {
          icon: <Bell className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
          bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-500/20',
          badgeText: 'System'
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="View notifications"
        className={`relative p-2 rounded-lg border transition-all duration-200 cursor-pointer shadow-xs ${
          isOpen
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850'
        }`}
      >
        <Bell className="h-4 w-4 transition-transform hover:scale-105" />

        {/* Live Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Floating Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => refreshNotifications()}
                title="Refresh notifications"
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  title="Mark all as read"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors font-medium text-[11px]"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3.5 pt-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                activeTab === 'unread'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Scrollable List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">All caught up!</p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  {activeTab === 'unread' 
                    ? 'No unread notifications at the moment.' 
                    : 'No system notifications recorded yet.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const visuals = getItemVisuals(item);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.read) markAsRead(item.id);
                      if (item.actionUrl) {
                        window.location.href = item.actionUrl;
                      }
                    }}
                    className={`group relative p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      item.read
                        ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 bg-transparent'
                        : 'bg-emerald-50/30 dark:bg-emerald-950/15 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/25'
                    }`}
                  >
                    {/* Category Icon */}
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${visuals.bg}`}>
                      {visuals.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          {visuals.badgeText}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {item.timestamp}
                        </span>
                      </div>

                      <h4 className={`mt-0.5 text-xs truncate leading-snug ${
                        item.read 
                          ? 'font-medium text-zinc-700 dark:text-zinc-300' 
                          : 'font-bold text-zinc-900 dark:text-zinc-50'
                      }`}>
                        {item.title}
                      </h4>

                      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {item.actionUrl && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>View details</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Right action dots / buttons */}
                    <div className="absolute right-3 top-3.5 flex items-center gap-1">
                      {!item.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.id);
                          }}
                          title="Mark as read"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 transition-all"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        title="Dismiss notification"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/50 text-zinc-400 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 group-hover:hidden" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
            Real-time live console · Connected to SEYEYA API
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
