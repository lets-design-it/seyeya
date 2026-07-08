import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  priceUGX: number;
  priceUSD: number;
  description: string;
  image: string;
  quantity?: number;
  allergen_info?: string;
  preparation_time?: number;
  is_available?: boolean;
  is_active?: boolean;
  category_id?: number;
}

export interface RestaurantOrder {
  id: string;
  table: string;
  items: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed';
  timestamp: string;
  value: number; // Value in UGX
  paymentStatus: string;
  amountPaid: number;
  balanceDue: number;
  specialInstr?: string;
  deliveryOption: string;
  deliveryAddress?: string;
  rawItems: any[];
}

export const useRestaurant = () => {
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMenuAndOrders = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch categories
      const catRes = await api.get('/restaurant/menu/categories');
      const dbCats = catRes.data;
      setCategories(dbCats);

      // Create mapping of category_id -> category_name
      const catMap: Record<number, string> = {};
      dbCats.forEach((c: any) => {
        catMap[c.category_id] = c.category_name;
      });

      // 2. Fetch menu items
      const menuRes = await api.get('/restaurant/menu/items');
      const mappedMenu = menuRes.data.map((item: any) => ({
        id: String(item.menu_item_id),
        name: item.item_name,
        category: catMap[item.category_id] || 'Local Food',
        priceUGX: Number(item.price),
        priceUSD: Math.round((Number(item.price) / 3500) * 10) / 10,
        description: item.description || '',
        image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
        quantity: item.quantity || 0,
        allergen_info: item.allergen_info || '',
        preparation_time: item.preparation_time || 0,
        is_available: item.is_available,
        is_active: item.is_active,
        category_id: item.category_id
      }));
      setMenu(mappedMenu);

      // 3. Fetch orders
      const ordersRes = await api.get('/restaurant/orders');
      const mappedOrders = ordersRes.data.map((o: any) => {
        const itemsStr = o.items
          ? o.items
              .map((it: any) => {
                const itemName = it.menu_item?.item_name || `Item #${it.menu_item_id}`;
                return `${it.quantity}x ${itemName}`;
              })
              .join(', ')
          : '';
        
        let timeStr = '00:00';
        if (o.created_at) {
          const d = new Date(o.created_at);
          timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return {
          id: String(o.order_id),
          table: o.seating_location || 'Table',
          items: itemsStr,
          status: o.order_status || 'Pending',
          timestamp: timeStr,
          value: Number(o.total_amount || 0),
          paymentStatus: o.payment_status || 'Pending',
          amountPaid: Number(o.amount_paid || 0),
          balanceDue: Number(o.balance_due || 0),
          specialInstr: o.special_instr || '',
          deliveryOption: o.delivery_option || 'Premises',
          deliveryAddress: o.delivery_address || '',
          rawItems: o.items || []
        };
      });
      setOrders(mappedOrders);
    } catch (e) {
      console.error("Error fetching restaurant data from API:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuAndOrders();
  }, []);

  const placeOrder = async (cart: Record<string, number>, tableLabel: string) => {
    try {
      const items = Object.entries(cart).map(([itemId, qty]) => ({
        menu_item_id: parseInt(itemId),
        quantity: qty
      }));

      const payload = {
        seating_location: tableLabel,
        delivery_option: "Premises",
        items
      };

      await api.post('/restaurant/orders', payload);
      await fetchMenuAndOrders();
      addNotification('New Restaurant Order', `${tableLabel} placed a new order.`, 'order');
    } catch (e) {
      console.error("Error placing order:", e);
      addNotification('Error', 'Failed to place order', 'order');
      throw e;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: RestaurantOrder['status']) => {
    try {
      await api.patch(`/restaurant/orders/${orderId}`, {
        order_status: newStatus
      });
      await fetchMenuAndOrders();
      addNotification('Order Status Updated', `Order #${orderId} is now ${newStatus}`, 'order');
    } catch (e) {
      console.error("Error updating order status:", e);
      addNotification('Error', 'Failed to update order status', 'order');
      throw e;
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const catObj = categories.find(c => c.category_name.toLowerCase() === item.category.toLowerCase());
      const category_id = catObj ? catObj.category_id : 1;

      const payload = {
        category_id,
        item_name: item.name,
        price: item.priceUGX,
        description: item.description,
        image_url: item.image,
        quantity: item.quantity || 0,
        allergen_info: item.allergen_info || '',
        preparation_time: item.preparation_time || 0,
        is_available: item.is_available ?? true,
        is_active: item.is_active ?? true
      };

      await api.post('/restaurant/menu/items', payload);
      await fetchMenuAndOrders();
      addNotification('Restaurant Menu Updated', `Added new menu item: ${item.name}`, 'order');
    } catch (e) {
      console.error("Error adding menu item:", e);
      addNotification('Error', `Failed to add menu item: ${item.name}`, 'order');
      throw e;
    }
  };

  const updateMenuItem = async (item: MenuItem) => {
    try {
      const catObj = categories.find(c => c.category_name.toLowerCase() === item.category.toLowerCase());
      const category_id = catObj ? catObj.category_id : 1;

      const payload = {
        category_id,
        item_name: item.name,
        price: item.priceUGX,
        description: item.description,
        image_url: item.image,
        quantity: item.quantity || 0,
        allergen_info: item.allergen_info || '',
        preparation_time: item.preparation_time || 0,
        is_available: item.is_available ?? true,
        is_active: item.is_active ?? true
      };

      await api.put(`/restaurant/menu/items/${item.id}`, payload);
      await fetchMenuAndOrders();
      addNotification('Restaurant Menu Updated', `Updated menu item: ${item.name}`, 'order');
    } catch (e) {
      console.error("Error updating menu item:", e);
      addNotification('Error', `Failed to update menu item: ${item.name}`, 'order');
      throw e;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const target = menu.find(m => m.id === id);
      await api.delete(`/restaurant/menu/items/${id}`);
      await fetchMenuAndOrders();
      if (target) {
        addNotification('Restaurant Menu Updated', `Removed menu item: ${target.name}`, 'order');
      }
    } catch (e) {
      console.error("Error deleting menu item:", e);
      addNotification('Error', 'Failed to delete menu item', 'order');
      throw e;
    }
  };

  const addCategory = async (name: string, description?: string) => {
    try {
      const payload = { category_name: name, description: description || '' };
      await api.post('/restaurant/menu/categories', payload);
      await fetchMenuAndOrders();
      addNotification('Menu Category Added', `Created new category: ${name}`, 'order');
    } catch (e) {
      console.error("Error adding category:", e);
      addNotification('Error', `Failed to create category: ${name}`, 'order');
      throw e;
    }
  };

  const updateCategory = async (id: number, name: string, description?: string) => {
    try {
      const payload = { category_name: name, description: description || '' };
      await api.put(`/restaurant/menu/categories/${id}`, payload);
      await fetchMenuAndOrders();
      addNotification('Menu Category Updated', `Updated category: ${name}`, 'order');
    } catch (e) {
      console.error("Error updating category:", e);
      addNotification('Error', `Failed to update category: ${name}`, 'order');
      throw e;
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      const target = categories.find(c => c.category_id === id);
      const name = target ? target.category_name : `ID #${id}`;
      
      const hasItems = menu.some(item => Number(item.category_id) === id || item.category === name);
      if (hasItems) {
        throw new Error("Cannot delete category with active menu items. Please delete the items first.");
      }

      await api.delete(`/restaurant/menu/categories/${id}`);
      await fetchMenuAndOrders();
      addNotification('Menu Category Deleted', `Removed category: ${name}`, 'order');
    } catch (e: any) {
      console.error("Error deleting category:", e);
      const errorMsg = e.response?.data?.detail || e.message || 'Failed to delete category';
      addNotification('Error', errorMsg, 'order');
      throw new Error(errorMsg);
    }
  };

  const createRestaurantOrder = async (orderData: {
    customer_id?: number | null;
    seating_location?: string | null;
    delivery_option: string;
    delivery_address?: string | null;
    special_instr?: string | null;
    items: { menu_item_id: number; quantity: number; special_notes?: string }[];
  }) => {
    try {
      await api.post('/restaurant/orders', orderData);
      await fetchMenuAndOrders();
      addNotification('Order Created', `Order for ${orderData.seating_location || 'Delivery'} created successfully`, 'order');
    } catch (e: any) {
      console.error("Error creating order:", e);
      const errorMsg = e.response?.data?.detail || 'Failed to create order';
      addNotification('Error', errorMsg, 'order');
      throw new Error(errorMsg);
    }
  };

  const updateRestaurantOrder = async (
    orderId: string | number,
    updateData: {
      order_status?: string | null;
      payment_status?: string | null;
      amount_paid?: number | null;
    }
  ) => {
    try {
      await api.patch(`/restaurant/orders/${orderId}`, updateData);
      await fetchMenuAndOrders();
      addNotification('Order Updated', `Order #${orderId} was updated successfully`, 'order');
    } catch (e: any) {
      console.error("Error updating order:", e);
      const errorMsg = e.response?.data?.detail || 'Failed to update order';
      addNotification('Error', errorMsg, 'order');
      throw new Error(errorMsg);
    }
  };

  const cancelRestaurantOrder = async (orderId: string | number, reason?: string) => {
    try {
      const url = reason ? `/restaurant/orders/${orderId}?reason=${encodeURIComponent(reason)}` : `/restaurant/orders/${orderId}`;
      await api.delete(url);
      await fetchMenuAndOrders();
      addNotification('Order Cancelled', `Order #${orderId} was cancelled`, 'order');
    } catch (e: any) {
      console.error("Error cancelling order:", e);
      const errorMsg = e.response?.data?.detail || 'Failed to cancel order';
      addNotification('Error', errorMsg, 'order');
      throw new Error(errorMsg);
    }
  };

  return {
    menu,
    orders,
    categories,
    isLoading,
    placeOrder,
    updateOrderStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    updateCategory,
    deleteCategory,
    createRestaurantOrder,
    updateRestaurantOrder,
    cancelRestaurantOrder,
  };
};
