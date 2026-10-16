import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { loadLeads, saveLeads, addActivity } from '../utils/mockData';

export interface BackendNotification {
  id: string;
  event_id?: string | null;
  recipient_id: number;
  title: string;
  message: string;
  notification_type?: string | null;
  category: string;
  priority: string;
  channel: string;
  status: string;
  is_read: boolean;
  read_at?: string | null;
  action_url?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  email_sent?: boolean;
  email_sent_at?: string | null;
  created_at: string;
  expires_at?: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'booking' | 'event' | 'payment' | 'security' | 'system';
  category?: string;
  priority?: string;
  timestamp: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string | null;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  latestNotification: NotificationItem | null;
  addNotification: (title: string, message: string, type: NotificationItem['type']) => void;
  clearLatest: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';

    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSeconds < 45) return 'Just now';
    if (diffSeconds < 90) return '1m ago';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 7200) return '1h ago';
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 172800) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function mapCategoryToType(category?: string, notificationType?: string): NotificationItem['type'] {
  const cat = (category || '').toLowerCase();
  const nType = (notificationType || '').toLowerCase();

  if (cat.includes('order') || nType.includes('order')) return 'order';
  if (cat.includes('reservation') || nType.includes('reservation') || nType.includes('room')) return 'booking';
  if (cat.includes('conference') || nType.includes('conference') || nType.includes('event')) return 'event';
  if (cat.includes('payment') || nType.includes('payment')) return 'payment';
  if (cat.includes('security') || cat.includes('account') || nType.includes('password') || nType.includes('login')) return 'security';
  return 'system';
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);

  const fetchNotifications = useCallback(async (isPolling = false) => {
    if (!isPolling) setIsLoading(true);
    try {
      // 1. Fetch live unread count
      try {
        const countRes = await api.get('/notifications/unread-count?all_recipients=true');
        if (countRes.data && typeof countRes.data.unread_count === 'number') {
          setUnreadCount(countRes.data.unread_count);
        }
      } catch (cntErr) {
        // Fallback calculation will occur from items list
      }

      // 2. Fetch notifications list (limit 50, all_recipients=true for staff)
      const res = await api.get('/notifications?limit=50&all_recipients=true');
      if (Array.isArray(res.data)) {
        const mapped: NotificationItem[] = res.data.map((item: BackendNotification) => ({
          id: String(item.id),
          title: item.title,
          message: item.message,
          type: mapCategoryToType(item.category, item.notification_type || undefined),
          category: item.category,
          priority: item.priority,
          timestamp: formatRelativeTime(item.created_at),
          createdAt: item.created_at,
          read: item.is_read || item.status === 'READ',
          actionUrl: item.action_url || null
        }));

        // Detect new unread notification for toast alert
        if (mapped.length > 0) {
          setNotifications(prev => {
            if (prev.length > 0) {
              const prevIds = new Set(prev.map(p => p.id));
              const freshUnread = mapped.find(m => !prevIds.has(m.id) && !m.read);
              if (freshUnread) {
                setLatestNotification(freshUnread);
              }
            }
            return mapped;
          });
        } else {
          setNotifications([]);
        }

        const unreadComputed = mapped.filter(m => !m.read).length;
        setUnreadCount(unreadComputed);
      }
    } catch (err) {
      console.warn("Notification sync notice: backend notifications endpoint not available or unauthorized yet.", err);
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  }, []);

  // Initial fetch and periodic polling (every 20s)
  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications(true);
    }, 20000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchNotifications]);

  const addNotification = (title: string, message: string, type: NotificationItem['type']) => {
    const newItem: NotificationItem = {
      id: `local-${Date.now()}`,
      title,
      message,
      type,
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newItem, ...prev]);
    setUnreadCount(prev => prev + 1);
    setLatestNotification(newItem);

    // Apply database updates based on notification type for mock leads / local orders
    if (type === 'booking') {
      try {
        const currentLeads = loadLeads();
        const updated = [...currentLeads];
        if (updated.length > 0) {
          const randomIndex = Math.floor(Math.random() * updated.length);
          updated[randomIndex] = {
            ...updated[randomIndex],
            stage: 'Won',
            lastActive: 'Just now',
            notes: [`Simulated Booking Check-in logged.`, ...updated[randomIndex].notes]
          };
          saveLeads(updated);
        }
      } catch (e) {
        // ignore
      }
    } else if (type === 'order') {
      try {
        const currentOrders = JSON.parse(localStorage.getItem('seyeya_crm_orders') || '[]');
        const newOrder = {
          id: `order-${Date.now()}`,
          table: `Room ${Math.floor(Math.random() * 200) + 101}`,
          items: message.replace('ordered ', ''),
          status: 'Pending',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.floor(Math.random() * 80000) + 20000
        };
        localStorage.setItem('seyeya_crm_orders', JSON.stringify([newOrder, ...currentOrders]));
        addActivity('Guest Order', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', `placed order: ${newOrder.items}`, 'call');
      } catch (e) {
        // ignore
      }
    }
  };

  const clearLatest = () => {
    setLatestNotification(null);
  };

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (!id.startsWith('local-')) {
      try {
        await api.patch(`/notifications/${id}/read`);
      } catch (e) {
        console.error("Failed to mark notification as read on backend:", e);
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await api.patch('/notifications/read-all');
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (!id.startsWith('local-')) {
      try {
        await api.delete(`/notifications/${id}`);
      } catch (e) {
        console.error("Failed to delete notification on backend:", e);
      }
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications(false);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount,
      isLoading,
      latestNotification, 
      addNotification, 
      clearLatest, 
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
