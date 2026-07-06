import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadLeads, saveLeads, addActivity, Lead } from '../utils/mockData';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'booking' | 'event';
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  latestNotification: NotificationItem | null;
  addNotification: (title: string, message: string, type: NotificationItem['type']) => void;
  clearLatest: () => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Sample simulated events
const SIMULATED_EVENTS = [
  {
    title: 'New Restaurant Order',
    message: 'Table 4 ordered 2x Rolex Rolls, 1x African Ginger Tea',
    type: 'order' as const,
  },
  {
    title: 'Room Booking Registered',
    message: 'Room 204 reserved by Marcus Vance for 3 nights',
    type: 'booking' as const,
  },
  {
    title: 'Conference Quote Requested',
    message: 'Compiler Fintech Inc requested pricing for 45 people',
    type: 'event' as const,
  },
  {
    title: 'New Restaurant Order',
    message: 'Room 102 ordered 1x Grilled Tilapia, 1x Passion Juice',
    type: 'order' as const,
  },
  {
    title: 'Room Check-in Alert',
    message: 'Alexandra Vance checked into Standard Cottage Room 102',
    type: 'booking' as const,
  }
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);

  const addNotification = (title: string, message: string, type: NotificationItem['type']) => {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: 'Just now',
      read: false,
    };

    setNotifications(prev => [newItem, ...prev]);
    setLatestNotification(newItem);

    // Apply database updates based on notification type
    if (type === 'booking') {
      // Simulate booking update: random check-in/out updates on mock leads
      try {
        const currentLeads = loadLeads();
        // Shift a random lead stage to Won or Proposal, or register a mock lead
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
      // Simulate restaurant order database logs
      try {
        const currentOrders = JSON.parse(localStorage.getItem('seyeya_crm_orders') || '[]');
        const newOrder = {
          id: `order-${Date.now()}`,
          table: `Room ${Math.floor(Math.random() * 200) + 101}`,
          items: message.replace('ordered ', ''),
          status: 'Pending',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.floor(Math.random() * 80000) + 20000 // UGX values
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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Launch simulated background event generator
  useEffect(() => {
    const timer = setInterval(() => {
      // Pick a random event template
      const eventIndex = Math.floor(Math.random() * SIMULATED_EVENTS.length);
      const template = SIMULATED_EVENTS[eventIndex];
      addNotification(template.title, template.message, template.type);
    }, 28000); // Trigger every 28 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      latestNotification, 
      addNotification, 
      clearLatest, 
      markAllAsRead 
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


