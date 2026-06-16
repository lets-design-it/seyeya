import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

export interface MenuItem {
  id: string;
  name: string;
  category: 'Local Food' | 'Continental' | 'Drinks' | 'Desserts';
  priceUGX: number;
  priceUSD: number;
  description: string;
  image: string;
}

export interface RestaurantOrder {
  id: string;
  table: string;
  items: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed';
  timestamp: string;
  value: number; // Value in UGX
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'm-1',
    name: 'Ugandan Rolex Roll (2 Eggs)',
    category: 'Local Food',
    priceUGX: 10000,
    priceUSD: 3,
    description: 'Fresh chapati rolled with double egg omelette, chopped cabbage, tomatoes, and onions.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
  },
  {
    id: 'm-2',
    name: 'Whole Grilled Tilapia Fish',
    category: 'Local Food',
    priceUGX: 45000,
    priceUSD: 12,
    description: 'Succulent lake fish grilled with local herbs, served with chips or steamed matooke.',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200',
  },
  {
    id: 'm-3',
    name: 'Seyeya Premium Beef Burger',
    category: 'Continental',
    priceUGX: 25000,
    priceUSD: 7,
    description: 'Gourmet grass-fed beef patty with melted cheddar, lettuce, caramelized onions on a brioche bun.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
  },
  {
    id: 'm-4',
    name: 'Steamed Matooke & Groundnut Stew',
    category: 'Local Food',
    priceUGX: 18000,
    priceUSD: 5,
    description: 'Traditional plantain mash served with a thick purple groundnut paste stew.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
  },
  {
    id: 'm-5',
    name: 'Fresh Organic Passion Fruit Juice',
    category: 'Drinks',
    priceUGX: 8000,
    priceUSD: 2.5,
    description: 'Freshly squeezed sweet passion fruits, ice chilled.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200',
  },
  {
    id: 'm-6',
    name: 'Cold Nile Special Beer',
    category: 'Drinks',
    priceUGX: 10000,
    priceUSD: 3,
    description: 'Premium Ugandan lager brewed at the source of the Nile.',
    image: 'https://images.unsplash.com/photo-1608270176051-090e5f2cf29e?w=200',
  }
];

const DEFAULT_ORDERS: RestaurantOrder[] = [
  {
    id: 'order-1',
    table: 'Room 102',
    items: '1x Whole Grilled Tilapia Fish, 2x Nile Special Beer',
    status: 'Preparing',
    timestamp: '15:10',
    value: 65000,
  },
  {
    id: 'order-2',
    table: 'Table 4',
    items: '2x Ugandan Rolex Roll, 1x Passion Fruit Juice',
    status: 'Pending',
    timestamp: '15:18',
    value: 28000,
  },
  {
    id: 'order-3',
    table: 'Room 205',
    items: '1x Seyeya Premium Beef Burger, 1x Steamed Matooke',
    status: 'Ready',
    timestamp: '14:45',
    value: 43000,
  }
];

export const useRestaurant = () => {
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('seyeya_crm_orders');
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch (e) {
        setOrders(DEFAULT_ORDERS);
      }
    } else {
      localStorage.setItem('seyeya_crm_orders', JSON.stringify(DEFAULT_ORDERS));
      setOrders(DEFAULT_ORDERS);
    }
  }, []);

  const placeOrder = (itemsSummary: string, tableLabel: string, priceVal: number) => {
    const newOrder: RestaurantOrder = {
      id: `order-${Date.now()}`,
      table: tableLabel,
      items: itemsSummary,
      status: 'Pending',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: priceVal,
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    localStorage.setItem('seyeya_crm_orders', JSON.stringify(updated));

    // Send real-time notification
    addNotification('New Restaurant Order', `${tableLabel} ordered ${itemsSummary}`, 'order');
  };

  const updateOrderStatus = (orderId: string, newStatus: RestaurantOrder['status']) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('seyeya_crm_orders', JSON.stringify(updated));
  };

  return {
    menu: MENU_ITEMS,
    orders,
    placeOrder,
    updateOrderStatus,
  };
};
