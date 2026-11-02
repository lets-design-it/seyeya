import React, { useState, useEffect } from 'react';
import { useRestaurant, RestaurantOrder, MenuItem, MenuChoice, MenuAccompaniment, MenuExtra } from '../../hooks/useRestaurant';
import { useVatRate } from '../../context/VatContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import {
  ShoppingBag,
  ChevronRight,
  Clock,
  ChefHat,
  CheckSquare,
  Plus,
  X,
  DollarSign,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Search,
  Filter,
  Check,
  Utensils,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Calendar,
  Sparkles,
  Trash2,
  Edit3,
  Layers,
  Coffee,
  BedDouble,
  LayoutGrid,
  LayoutList,
  PauseCircle,
  Play,
  Timer,
  RotateCcw,
  Settings2,
  RefreshCw
} from 'lucide-react';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = 'http://139.59.134.181';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export interface CartExtraSelection {
  extra_id: number;
  extra_name: string;
  price: number;
  quantity: number;
}

export interface CartChoiceSelection {
  choice_id: number;
  choice_name: string;
  price: number;
}

export interface CartAccompanimentSelection {
  accompaniment_id: number;
  accompaniment_name: string;
  price: number;
}

export interface DetailedCartItem {
  cart_id: string;
  menu_item_id: number;
  name: string;
  category: string;
  image?: string;
  base_price: number;
  quantity: number;
  special_notes?: string;
  choice?: CartChoiceSelection | null;
  accompaniment?: CartAccompanimentSelection | null;
  extras: CartExtraSelection[];
}

export interface HeldOrderSession {
  id: string;
  heldAt: number;
  label: string;
  orderType: 'Premises' | 'Room Service' | 'Takeaway' | 'Delivery';
  seatingArea: string;
  table: string;
  customTable: string;
  cottageRoom: string;
  customRoom: string;
  deliveryAddress: string;
  deliveryCharge: number | string;
  customerSource: 'walkin' | 'crm';
  selectedCustomerId: number | null;
  guestName: string;
  guestPhone: string;
  assignedWaiterId: string;
  customWaiterName: string;
  orderTiming: 'asap' | 'scheduled';
  scheduledTime: string;
  allergyTags: string[];
  customAllergy: string;
  specialInstr: string;
  paymentStatus: 'Pending' | 'Paid' | 'Partially Paid';
  paymentMethod: 'Cash' | 'Card' | 'Mobile Money' | 'Room Bill';
  amountPaid: number | string;
  cartItems: DetailedCartItem[];
  customizingItem?: any | null;
  totalAmount: number;
}

export interface RestaurantTable {
  table_id: number;
  table_number: string;
  location: string;
  capacity: number;
  status: string;
  is_active: boolean;
}

export interface CheckedInRoom {
  room_id: number;
  room_number: string;
  room_name?: string;
  building?: string;
  category_name?: string;
  reservation_id?: number | null;
  customer_id?: number | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  display_label?: string;
}

const DEFAULT_TABLES: RestaurantTable[] = [
  { table_id: 1, table_number: 'Table 1', location: 'Main Restaurant', capacity: 4, status: 'Available', is_active: true },
  { table_id: 2, table_number: 'Table 2', location: 'Main Restaurant', capacity: 4, status: 'Available', is_active: true },
  { table_id: 3, table_number: 'Table 3', location: 'Main Restaurant', capacity: 2, status: 'Available', is_active: true },
  { table_id: 4, table_number: 'Table 4', location: 'Main Restaurant', capacity: 6, status: 'Available', is_active: true },
  { table_id: 5, table_number: 'Table 5', location: 'Main Restaurant', capacity: 4, status: 'Available', is_active: true },
  { table_id: 6, table_number: 'Table 6', location: 'Main Restaurant', capacity: 8, status: 'Available', is_active: true },
  { table_id: 7, table_number: 'Table 7', location: 'Verandah & Terrace', capacity: 4, status: 'Available', is_active: true },
  { table_id: 8, table_number: 'Table 8', location: 'Verandah & Terrace', capacity: 4, status: 'Available', is_active: true },
  { table_id: 9, table_number: 'Table 9', location: 'Verandah & Terrace', capacity: 2, status: 'Available', is_active: true },
  { table_id: 10, table_number: 'Cabana 1', location: 'Poolside Deck', capacity: 6, status: 'Available', is_active: true },
  { table_id: 11, table_number: 'Cabana 2', location: 'Poolside Deck', capacity: 6, status: 'Available', is_active: true },
  { table_id: 12, table_number: 'Gazebo A', location: 'Garden Gazebos', capacity: 8, status: 'Available', is_active: true },
  { table_id: 13, table_number: 'Gazebo B', location: 'Garden Gazebos', capacity: 8, status: 'Available', is_active: true },
  { table_id: 14, table_number: 'VIP Table 1', location: 'VIP Lounge', capacity: 4, status: 'Available', is_active: true },
  { table_id: 15, table_number: 'VIP Table 2', location: 'VIP Lounge', capacity: 6, status: 'Available', is_active: true },
];

const COLUMNS: RestaurantOrder['status'][] = ['Pending', 'Preparing', 'Ready'];

interface OrdersProps {
  activeTab?: 'active' | 'history';
  setActiveTab?: (tab: 'active' | 'history') => void;
}

export const Orders: React.FC<OrdersProps> = ({
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}) => {
  const { vatRate } = useVatRate();
  const { formatPrice } = useCurrency();
  const {
    orders,
    updateOrderStatus,
    menu,
    createRestaurantOrder,
    updateRestaurantOrder,
    cancelRestaurantOrder
  } = useRestaurant();

  // Dynamic age evaluation states
  const [now, setNow] = useState(new Date());
  const [archiveSearch, setArchiveSearch] = useState('');

  // History view mode: 'list' (table) or 'grid' (cards)
  const [historyViewMode, setHistoryViewMode] = useState<'list' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem('seyeya_order_history_view_mode');
      return saved === 'grid' || saved === 'list' ? saved : 'list';
    } catch {
      return 'list';
    }
  });

  const handleSetHistoryViewMode = (mode: 'list' | 'grid') => {
    setHistoryViewMode(mode);
    try {
      localStorage.setItem('seyeya_order_history_view_mode', mode);
    } catch {
      // ignore
    }
  };

  const formatOrderCompletedTime = (order: RestaurantOrder): string => {
    let completedTimeStr = order.timestamp;
    if (order.updatedAt) {
      const rawStr = String(order.updatedAt).trim();
      const isoStr = (rawStr.endsWith('Z') || rawStr.includes('+'))
        ? rawStr
        : `${rawStr.replace(' ', 'T')}Z`;
      const d = new Date(isoStr);
      if (!isNaN(d.getTime())) {
        completedTimeStr = d.toLocaleString('en-US', {
          timeZone: 'Africa/Nairobi',
          dateStyle: 'short',
          timeStyle: 'short'
        });
      }
    }
    return completedTimeStr;
  };

  const getPaymentBadgeClass = (paymentStatus?: string) => {
    const s = (paymentStatus || '').toLowerCase();
    if (s === 'paid') {
      return 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5 dark:text-emerald-400 dark:bg-emerald-500/10';
    }
    if (s === 'partially paid' || s === 'partial') {
      return 'border-amber-500/20 text-amber-600 bg-amber-500/5 dark:text-amber-400 dark:bg-amber-500/10';
    }
    return 'border-amber-500/20 text-amber-600 bg-amber-500/5 dark:text-amber-400 dark:bg-amber-500/10';
  };

  // Active orders search & sort states (defaults to Most Recent First)
  const [activeSearch, setActiveSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const getOrderTimestamp = (o: RestaurantOrder): number => {
    if (o.createdAt) {
      const time = new Date(o.createdAt).getTime();
      if (!isNaN(time)) return time;
    }
    if (o.orderId) return o.orderId;
    return 0;
  };

  const [localActiveTab, localSetActiveTab] = useState<'active' | 'history'>('active');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || localSetActiveTab;

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000); // 30 seconds
    return () => clearInterval(timer);
  }, []);

  const isCompletedOlderThan30Mins = (order: RestaurantOrder) => {
    if (order.status !== 'Completed' || !order.updatedAt) return false;
    const completedTime = new Date(order.updatedAt).getTime();
    const thirtyMinutesAgo = now.getTime() - 30 * 60 * 1000;
    return completedTime < thirtyMinutesAgo;
  };

  const archivedOrders = orders
    .filter(o => o.status === 'Completed' && isCompletedOlderThan30Mins(o))
    .filter(o => {
      if (!archiveSearch) return true;
      const term = archiveSearch.toLowerCase();
      return o.orderNumber.toLowerCase().includes(term) ||
        o.table.toLowerCase().includes(term) ||
        o.items.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime; // descending
    });

  // Modal & Drawer states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);

  // Lists for dropdown lookups
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [waitersList, setWaitersList] = useState<any[]>([]);

  // Create Order Detailed Form states
  const [orderType, setOrderType] = useState<'Premises' | 'Room Service' | 'Takeaway' | 'Delivery'>('Premises');
  const [seatingArea, setSeatingArea] = useState('Main Restaurant');
  const [table, setTable] = useState('Table 1');
  const [customTable, setCustomTable] = useState('');
  const [cottageRoom, setCottageRoom] = useState('Cottage 1');
  const [customRoom, setCustomRoom] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState<number | string>('');

  // Guest details
  const [customerSource, setCustomerSource] = useState<'walkin' | 'crm'>('walkin');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Staff & Timing
  const [assignedWaiterId, setAssignedWaiterId] = useState<string>('');
  const [customWaiterName, setCustomWaiterName] = useState('');
  const [orderTiming, setOrderTiming] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledTime, setScheduledTime] = useState('');

  // Allergies & Special Notes
  const [allergyTags, setAllergyTags] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [specialInstr, setSpecialInstr] = useState('');

  // Payment Options
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid' | 'Partially Paid'>('Pending');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile Money' | 'Room Bill'>('Cash');
  const [amountPaid, setAmountPaid] = useState<number | string>('');

  // Menu Search & Category Filter inside modal
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('ALL');

  // Detailed Cart & Active Customizer
  const [cartItems, setCartItems] = useState<DetailedCartItem[]>([]);
  const [customizingItem, setCustomizingItem] = useState<{
    item: MenuItem;
    choice: CartChoiceSelection | null;
    accompaniment: CartAccompanimentSelection | null;
    extras: CartExtraSelection[];
    quantity: number;
    notes: string;
    existingCartId?: string;
  } | null>(null);

  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Held Order Sessions State
  const [heldSessions, setHeldSessions] = useState<HeldOrderSession[]>(() => {
    try {
      const stored = localStorage.getItem('seyeya_held_order_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isHeldSessionsOpen, setIsHeldSessionsOpen] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [holdSuccessMessage, setHoldSuccessMessage] = useState<string | null>(null);

  // Configured Order Hold Duration (synced with Hotel Details settings)
  const [orderHoldDurationMinutes, setOrderHoldDurationMinutes] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('seyeya_order_hold_duration_minutes');
      return stored ? Math.max(20, Math.min(1440, Number(stored))) : 60;
    } catch {
      return 60;
    }
  });

  // Listen to hold duration updates and fetch hotel details limit
  useEffect(() => {
    const handleHoldDurationChanged = (e: any) => {
      const val = e?.detail ?? localStorage.getItem('seyeya_order_hold_duration_minutes');
      if (val) {
        setOrderHoldDurationMinutes(Math.max(20, Math.min(1440, Number(val))));
      }
    };
    window.addEventListener('seyeya_hold_duration_changed', handleHoldDurationChanged);

    api.get('/hotel-details')
      .then(res => {
        if (res.data?.success && res.data?.data?.order_hold_duration_minutes) {
          const val = Math.max(20, Math.min(1440, Number(res.data.data.order_hold_duration_minutes)));
          setOrderHoldDurationMinutes(val);
          localStorage.setItem('seyeya_order_hold_duration_minutes', String(val));
        }
      })
      .catch(() => { });

    return () => {
      window.removeEventListener('seyeya_hold_duration_changed', handleHoldDurationChanged);
    };
  }, []);

  // 1-second active ticker for live countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const saveHeldSessions = (sessions: HeldOrderSession[]) => {
    setHeldSessions(sessions);
    try {
      localStorage.setItem('seyeya_held_order_sessions', JSON.stringify(sessions));
    } catch {
      // ignore
    }
  };

  // Dynamic Restaurant Tables state
  const [tablesList, setTablesList] = useState<RestaurantTable[]>(() => {
    try {
      const stored = localStorage.getItem('seyeya_restaurant_tables');
      return stored ? JSON.parse(stored) : DEFAULT_TABLES;
    } catch {
      return DEFAULT_TABLES;
    }
  });
  const [tableLocationFilter, setTableLocationFilter] = useState<string>('ALL');
  const [isManageTablesMode, setIsManageTablesMode] = useState<boolean>(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState<boolean>(false);
  const [newTableNumber, setNewTableNumber] = useState<string>('');
  const [newTableLocation, setNewTableLocation] = useState<string>('Main Restaurant');
  const [customNewLocation, setCustomNewLocation] = useState<string>('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);
  const [isSavingTable, setIsSavingTable] = useState<boolean>(false);

  // Dynamic Checked-In Rooms state
  const [checkedInRooms, setCheckedInRooms] = useState<CheckedInRoom[]>([]);
  const [allRoomsList, setAllRoomsList] = useState<any[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [showAllRoomsMode, setShowAllRoomsMode] = useState<boolean>(false);

  // Fetch tables from API
  const fetchTables = async () => {
    try {
      const res = await api.get('/restaurant/tables');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setTablesList(res.data);
        localStorage.setItem('seyeya_restaurant_tables', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Could not fetch tables from API, using cached/default tables', err);
    }
  };

  // Create new table
  const handleCreateNewTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = (newTableLocation === 'NEW' ? customNewLocation.trim() : newTableLocation.trim()) || 'Main Restaurant';
    const finalNumber = newTableNumber.trim();
    if (!finalNumber) return;

    setIsSavingTable(true);
    try {
      let createdTable: RestaurantTable;
      try {
        const res = await api.post('/restaurant/tables', {
          table_number: finalNumber,
          location: finalLocation,
          capacity: Number(newTableCapacity) || 4,
          status: 'Available',
          is_active: true
        });
        createdTable = res.data;
      } catch (err) {
        createdTable = {
          table_id: Date.now(),
          table_number: finalNumber,
          location: finalLocation,
          capacity: Number(newTableCapacity) || 4,
          status: 'Available',
          is_active: true
        };
      }
      const updated = [...tablesList.filter(t => t.table_id !== createdTable.table_id), createdTable];
      setTablesList(updated);
      localStorage.setItem('seyeya_restaurant_tables', JSON.stringify(updated));
      setTable(createdTable.table_number);
      setSeatingArea(createdTable.location);
      setNewTableNumber('');
      setCustomNewLocation('');
      setIsAddTableOpen(false);
    } finally {
      setIsSavingTable(false);
    }
  };

  // Delete table
  const handleDeleteTable = async (tableId: number, tableNum: string) => {
    if (!window.confirm(`Are you sure you want to remove "${tableNum}" from the premises?`)) return;
    try {
      await api.delete(`/restaurant/tables/${tableId}`).catch(() => { });
    } catch {
      // ignore
    }
    const updated = tablesList.filter(t => t.table_id !== tableId);
    setTablesList(updated);
    localStorage.setItem('seyeya_restaurant_tables', JSON.stringify(updated));
    if (table === tableNum) {
      setTable(updated[0]?.table_number || 'Table 1');
    }
  };

  // Fetch checked-in rooms from API with resilient fallback
  const fetchCheckedInRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await api.get('/accommodation/rooms/checked-in');
      if (Array.isArray(res.data)) {
        setCheckedInRooms(res.data);
        setIsLoadingRooms(false);
        return;
      }
    } catch (err) {
      console.warn('Dedicated /rooms/checked-in endpoint fallback check', err);
    }

    try {
      const [roomsRes, resRes, custRes] = await Promise.allSettled([
        api.get('/accommodation/rooms/all'),
        api.get('/accommodation/reservations'),
        api.get('/crm/customers')
      ]);

      const rooms = roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value.data) ? roomsRes.value.data : [];
      const reservations = resRes.status === 'fulfilled' && Array.isArray(resRes.value.data) ? resRes.value.data : [];
      const customers = custRes.status === 'fulfilled' && Array.isArray(custRes.value.data) ? custRes.value.data : [];

      setAllRoomsList(rooms);

      const computedCheckedIn: CheckedInRoom[] = [];
      rooms.forEach((r: any) => {
        const activeRes = reservations.find((res: any) =>
          Number(res.room_id) === Number(r.room_id) &&
          (res.reservation_status === 'CheckedIn' || res.reservation_status === 'Checked In')
        );
        if (activeRes || r.room_status === 'Occupied') {
          const cust = activeRes ? customers.find((c: any) => Number(c.customer_id) === Number(activeRes.customer_id)) : null;
          const guestName = cust?.full_name || activeRes?.guest_name || (r.room_status === 'Occupied' ? 'Occupied Guest' : null);
          const guestPhone = cust?.phone_number || activeRes?.phone_number || null;
          const categoryName = r.category?.category_name || r.category_name || '';

          computedCheckedIn.push({
            room_id: r.room_id,
            room_number: String(r.room_number),
            room_name: r.room_name,
            building: r.building,
            category_name: categoryName,
            reservation_id: activeRes?.reservation_id || null,
            customer_id: cust?.customer_id || activeRes?.customer_id || null,
            guest_name: guestName,
            guest_phone: guestPhone,
            display_label: `Room ${r.room_number}${guestName ? ` - ${guestName}` : ''}`
          });
        }
      });

      setCheckedInRooms(computedCheckedIn);
    } catch (err2) {
      console.error('Error fetching fallback checked in rooms', err2);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleSelectCheckedInRoom = (room: CheckedInRoom) => {
    setCottageRoom(`Room ${room.room_number}`);
    if (room.guest_name) {
      setGuestName(room.guest_name);
    }
    if (room.guest_phone) {
      setGuestPhone(room.guest_phone);
    }
    if (room.customer_id) {
      setSelectedCustomerId(room.customer_id);
      setCustomerSource('crm');
    }
  };

  // Fetch customers, waiters, tables & checked-in rooms on mount
  useEffect(() => {
    api.get('/crm/customers').then(res => setCustomersList(res.data || [])).catch(() => { });
    api.get('/auth/users').then(res => setWaitersList(res.data || [])).catch(() => { });
    fetchTables();
    fetchCheckedInRooms();
  }, []);

  // Refresh tables and checked-in rooms whenever the create modal opens
  useEffect(() => {
    if (isCreateOpen) {
      fetchTables();
      fetchCheckedInRooms();
    }
  }, [isCreateOpen]);

  // Edit Order states
  const [editStatus, setEditStatus] = useState<RestaurantOrder['status']>('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState('Pending');
  const [editAmountPaid, setEditAmountPaid] = useState<number>(0);
  const [addBalanceAmount, setAddBalanceAmount] = useState<number | string>('');
  const [editError, setEditError] = useState<string | null>(null);

  const handleAddBalanceChange = (valStr: string) => {
    setAddBalanceAmount(valStr);
    if (!selectedOrder) return;
    const total = selectedOrder.totalAmount ?? selectedOrder.value ?? 0;
    const currentPaid = Number(selectedOrder.amountPaid || 0);
    const added = Number(valStr) || 0;
    const updatedPaid = currentPaid + added;

    setEditAmountPaid(updatedPaid);

    const balanceRemaining = total - updatedPaid;
    if (balanceRemaining <= 0.01 && updatedPaid > 0) {
      setEditPaymentStatus('Paid');
    } else if (updatedPaid > 0 && balanceRemaining > 0.01) {
      setEditPaymentStatus('Partially Paid');
    } else {
      setEditPaymentStatus('Pending');
    }
  };

  const handleSettleFullBalance = () => {
    if (!selectedOrder) return;
    const total = selectedOrder.totalAmount ?? selectedOrder.value ?? 0;
    const currentPaid = Number(selectedOrder.amountPaid || 0);
    const remaining = Math.max(0, total - currentPaid);

    setAddBalanceAmount(remaining.toFixed(2));
    setEditAmountPaid(total);
    setEditPaymentStatus('Paid');
  };

  const getStatusColor = (status: RestaurantOrder['status']) => {
    switch (status) {
      case 'Pending': return 'border-amber-500/20 dark:border-amber-500/30 text-amber-500 dark:text-amber-400 bg-amber-500/5';
      case 'Preparing': return 'border-indigo-500/20 dark:border-indigo-500/30 text-indigo-500 dark:text-indigo-400 bg-indigo-500/5';
      case 'Ready': return 'border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5';
      case 'Completed': return 'border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-850';
    }
  };

  const getNextStatus = (current: RestaurantOrder['status']): RestaurantOrder['status'] | null => {
    if (current === 'Pending') return 'Preparing';
    if (current === 'Preparing') return 'Ready';
    if (current === 'Ready') return 'Completed';
    return null;
  };

  // Cart & Customization Operations
  const removeExtraFromCartItem = (cartId: string, extraId: number) => {
    setCartItems(prev => prev.map(c => {
      if (c.cart_id === cartId) {
        return { ...c, extras: c.extras.filter(e => e.extra_id !== extraId) };
      }
      return c;
    }));
  };

  const removeAccompanimentFromCartItem = (cartId: string) => {
    setCartItems(prev => prev.map(c => {
      if (c.cart_id === cartId) {
        return { ...c, accompaniment: null };
      }
      return c;
    }));
  };

  const startCustomizing = (item: MenuItem, existingCartItem?: DetailedCartItem) => {
    if (existingCartItem) {
      setCustomizingItem({
        item,
        choice: existingCartItem.choice || null,
        accompaniment: existingCartItem.accompaniment || null,
        extras: [...existingCartItem.extras],
        quantity: existingCartItem.quantity,
        notes: existingCartItem.special_notes || '',
        existingCartId: existingCartItem.cart_id
      });
    } else {
      const defaultChoice = item.choices && item.choices.length > 0 ? {
        choice_id: item.choices[0].choice_id!,
        choice_name: item.choices[0].choice_name,
        price: Number(item.choices[0].price || 0)
      } : null;

      // Accompaniments are optional by default so the user can deliberately click a side
      const defaultAccompaniment = null;

      setCustomizingItem({
        item,
        choice: defaultChoice,
        accompaniment: defaultAccompaniment,
        extras: [],
        quantity: 1,
        notes: ''
      });
    }
  };

  const saveCustomizedItem = () => {
    if (!customizingItem) return;
    const { item, choice, accompaniment, extras, quantity, notes, existingCartId } = customizingItem;

    if (existingCartId) {
      setCartItems(prev => prev.map(c => c.cart_id === existingCartId ? {
        ...c,
        quantity,
        choice,
        accompaniment,
        extras,
        special_notes: notes.trim() || undefined
      } : c));
    } else {
      const newCartItem: DetailedCartItem = {
        cart_id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        menu_item_id: parseInt(item.id),
        name: item.name,
        category: item.category,
        image: item.image,
        base_price: item.priceUGX,
        quantity,
        special_notes: notes.trim() || undefined,
        choice,
        accompaniment,
        extras
      };
      setCartItems(prev => [...prev, newCartItem]);
    }
    setCustomizingItem(null);
  };

  const handleQuickAdd = (item: MenuItem) => {
    const hasCustomizations = (item.choices && item.choices.length > 0) ||
      (item.accompaniments && item.accompaniments.length > 0) ||
      (item.extras && item.extras.length > 0);

    if (hasCustomizations) {
      startCustomizing(item);
    } else {
      const existing = cartItems.find(c => c.menu_item_id === parseInt(item.id) && !c.choice && !c.accompaniment && c.extras.length === 0 && !c.special_notes);
      if (existing) {
        setCartItems(cartItems.map(c => c.cart_id === existing.cart_id ? { ...c, quantity: c.quantity + 1 } : c));
      } else {
        const newCartItem: DetailedCartItem = {
          cart_id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          menu_item_id: parseInt(item.id),
          name: item.name,
          category: item.category,
          image: item.image,
          base_price: item.priceUGX,
          quantity: 1,
          choice: null,
          accompaniment: null,
          extras: []
        };
        setCartItems(prev => [...prev, newCartItem]);
      }
    }
  };

  const updateCartQuantity = (cartId: string, delta: number) => {
    setCartItems(prev => prev.map(c => {
      if (c.cart_id === cartId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : null;
      }
      return c;
    }).filter(Boolean) as DetailedCartItem[]);
  };

  const removeFromCart = (cartId: string) => {
    setCartItems(prev => prev.filter(c => c.cart_id !== cartId));
  };

  const clearCart = () => {
    setCartItems([]);
    setCustomizingItem(null);
  };

  const resetCreateOrderForm = () => {
    setOrderType('Premises');
    setSeatingArea(tablesList[0]?.location || 'Main Restaurant');
    setTable(tablesList[0]?.table_number || 'Table 1');
    setCustomTable('');
    setCottageRoom(checkedInRooms[0] ? `Room ${checkedInRooms[0].room_number}` : 'Room 101');
    setCustomRoom('');
    setIsManageTablesMode(false);
    setIsAddTableOpen(false);
    setShowAllRoomsMode(false);
    setDeliveryAddress('');
    setDeliveryCharge('');
    setCustomerSource('walkin');
    setSelectedCustomerId(null);
    setGuestName('');
    setGuestPhone('');
    setAssignedWaiterId('');
    setCustomWaiterName('');
    setOrderTiming('asap');
    setScheduledTime('');
    setAllergyTags([]);
    setCustomAllergy('');
    setSpecialInstr('');
    setPaymentStatus('Pending');
    setPaymentMethod('Cash');
    setAmountPaid('');
    setMenuSearchTerm('');
    setSelectedMenuCategory('ALL');
    setCartItems([]);
    setCustomizingItem(null);
    setCreateError(null);
  };

  const handleHoldCurrentSession = () => {
    const hasItems = cartItems.length > 0;
    const hasDetails = guestName.trim() !== '' || customTable.trim() !== '' || specialInstr.trim() !== '';

    if (!hasItems && !hasDetails) {
      setCreateError("Please select items or enter details before placing the order on hold.");
      return;
    }

    let target = '';
    if (orderType === 'Premises') {
      target = `${seatingArea} - ${table === 'Other' ? (customTable || 'Custom Table') : table}`;
    } else if (orderType === 'Room Service') {
      target = `Room Service: ${cottageRoom === 'Other' ? (customRoom || 'Room') : cottageRoom}`;
    } else if (orderType === 'Takeaway') {
      target = 'Takeaway / Pickup';
    } else {
      target = `Delivery: ${deliveryAddress || 'Address'}`;
    }

    const baseTotal = cartItems.reduce((acc, curr) => acc + (curr.base_price * curr.quantity), 0);
    const custTotal = cartItems.reduce((acc, curr) => {
      const cPrice = curr.choice?.price || 0;
      const aPrice = curr.accompaniment?.price || 0;
      const ePrice = curr.extras.reduce((sum, ex) => sum + (ex.price * ex.quantity), 0);
      return acc + ((cPrice + aPrice + ePrice) * curr.quantity);
    }, 0);

    const newSession: HeldOrderSession = {
      id: `held_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      heldAt: Date.now(),
      label: `${target}${guestName ? ` (${guestName})` : ''}`,
      orderType,
      seatingArea,
      table,
      customTable,
      cottageRoom,
      customRoom,
      deliveryAddress,
      deliveryCharge,
      customerSource,
      selectedCustomerId,
      guestName,
      guestPhone,
      assignedWaiterId,
      customWaiterName,
      orderTiming,
      scheduledTime,
      allergyTags,
      customAllergy,
      specialInstr,
      paymentStatus,
      paymentMethod,
      amountPaid,
      cartItems,
      customizingItem,
      totalAmount: baseTotal + custTotal
    };

    saveHeldSessions([newSession, ...heldSessions]);
    resetCreateOrderForm();
    setHoldSuccessMessage(`Order session for "${newSession.label}" placed on hold. Ready for your next order.`);
    setTimeout(() => setHoldSuccessMessage(null), 4000);
  };

  const handleResumeSession = (session: HeldOrderSession) => {
    // If current form has unsaved work, automatically park it as another held session
    const hasCurrentWork = cartItems.length > 0 || guestName.trim() !== '';
    let updatedList = heldSessions.filter(s => s.id !== session.id);

    if (hasCurrentWork) {
      let curTarget = orderType === 'Premises' ? `${table}` : orderType;
      const currentDraft: HeldOrderSession = {
        id: `held_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        heldAt: Date.now(),
        label: `${curTarget}${guestName ? ` (${guestName})` : ''}`,
        orderType,
        seatingArea,
        table,
        customTable,
        cottageRoom,
        customRoom,
        deliveryAddress,
        deliveryCharge,
        customerSource,
        selectedCustomerId,
        guestName,
        guestPhone,
        assignedWaiterId,
        customWaiterName,
        orderTiming,
        scheduledTime,
        allergyTags,
        customAllergy,
        specialInstr,
        paymentStatus,
        paymentMethod,
        amountPaid,
        cartItems,
        customizingItem,
        totalAmount: cartItems.reduce((acc, curr) => acc + (curr.base_price * curr.quantity), 0)
      };
      updatedList = [currentDraft, ...updatedList];
    }

    setOrderType(session.orderType);
    setSeatingArea(session.seatingArea);
    setTable(session.table);
    setCustomTable(session.customTable);
    setCottageRoom(session.cottageRoom);
    setCustomRoom(session.customRoom);
    setDeliveryAddress(session.deliveryAddress);
    setDeliveryCharge(session.deliveryCharge);
    setCustomerSource(session.customerSource);
    setSelectedCustomerId(session.selectedCustomerId);
    setGuestName(session.guestName);
    setGuestPhone(session.guestPhone);
    setAssignedWaiterId(session.assignedWaiterId);
    setCustomWaiterName(session.customWaiterName);
    setOrderTiming(session.orderTiming);
    setScheduledTime(session.scheduledTime);
    setAllergyTags(session.allergyTags);
    setCustomAllergy(session.customAllergy);
    setSpecialInstr(session.specialInstr);
    setPaymentStatus(session.paymentStatus);
    setPaymentMethod(session.paymentMethod);
    setAmountPaid(session.amountPaid);
    setCartItems(session.cartItems);
    setCustomizingItem(session.customizingItem || null);

    saveHeldSessions(updatedList);
    setIsHeldSessionsOpen(false);
    setCreateError(null);
    setHoldSuccessMessage(`Resumed order for "${session.label}".`);
    setTimeout(() => setHoldSuccessMessage(null), 3500);
  };

  const handleDeleteHeldSession = (sessionId: string) => {
    const updated = heldSessions.filter(s => s.id !== sessionId);
    saveHeldSessions(updated);
  };

  const handleStartNewOrder = () => {
    const hasItems = cartItems.length > 0;
    const hasDetails = guestName.trim() !== '';

    if (hasItems || hasDetails) {
      handleHoldCurrentSession();
    } else {
      resetCreateOrderForm();
      setHoldSuccessMessage("Fresh order ticket started.");
      setTimeout(() => setHoldSuccessMessage(null), 3000);
    }
  };

  const formatCountdown = (heldAt: number, currentNow: number) => {
    const holdMins = orderHoldDurationMinutes && orderHoldDurationMinutes >= 20 ? orderHoldDurationMinutes : 60;
    const HOLD_DURATION_MS = holdMins * 60 * 1000;
    const elapsed = Math.max(0, currentNow - heldAt);
    const remaining = Math.max(0, HOLD_DURATION_MS - elapsed);

    const remTotalSec = Math.floor(remaining / 1000);
    const remHours = Math.floor(remTotalSec / 3600);
    const remMinutes = Math.floor((remTotalSec % 3600) / 60);
    const remSeconds = remTotalSec % 60;

    const elapTotalSec = Math.floor(elapsed / 1000);
    const elapHours = Math.floor(elapTotalSec / 3600);
    const elapMinutes = Math.floor((elapTotalSec % 3600) / 60);
    const elapSeconds = elapTotalSec % 60;

    const isExpired = remaining <= 0;
    const warningThreshold = Math.min(15 * 60 * 1000, Math.max(5 * 60 * 1000, HOLD_DURATION_MS * 0.15));

    const countdownStr = isExpired
      ? '00:00 (Expired)'
      : (remHours > 0
          ? `${remHours}h ${String(remMinutes).padStart(2, '0')}m ${String(remSeconds).padStart(2, '0')}s`
          : `${String(remMinutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`);

    const elapsedStr = elapHours > 0
      ? `${elapHours}h ${String(elapMinutes).padStart(2, '0')}m`
      : `${String(elapMinutes).padStart(2, '0')}:${String(elapSeconds).padStart(2, '0')}`;

    return {
      countdownStr,
      elapsedStr,
      isExpiring: isExpired || remaining <= warningThreshold,
      isExpired
    };
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (cartItems.length === 0) {
      setCreateError("Please select and add at least one menu item to the order ticket.");
      return;
    }

    // Determine final seating location
    let finalLocation = '';
    if (orderType === 'Premises') {
      const tableVal = table === 'Other' ? customTable.trim() : table;
      if (!tableVal) {
        setCreateError("Please specify a seating table location for Dine-in.");
        return;
      }
      finalLocation = `${seatingArea} - ${tableVal}`;
    } else if (orderType === 'Room Service') {
      const roomVal = cottageRoom === 'Other' ? customRoom.trim() : cottageRoom;
      if (!roomVal) {
        setCreateError("Please specify a cottage or room number for Room Service.");
        return;
      }
      finalLocation = `Room Service: ${roomVal}`;
    } else if (orderType === 'Takeaway') {
      finalLocation = `Takeaway / Pickup`;
    } else {
      finalLocation = `Delivery: ${deliveryAddress.trim() || 'Address not specified'}`;
      if (!deliveryAddress.trim()) {
        setCreateError("Please enter the delivery address or destination.");
        return;
      }
    }

    // Build items payload
    const itemsPayload = cartItems.map(c => ({
      menu_item_id: c.menu_item_id,
      quantity: c.quantity,
      special_notes: c.special_notes || null,
      choice_id: c.choice?.choice_id || null,
      accompaniment_id: c.accompaniment?.accompaniment_id || null,
      extras: c.extras.map(e => ({
        extra_id: e.extra_id,
        quantity: e.quantity
      }))
    }));

    // Build combined special notes
    const specialParts: string[] = [];
    if (guestName.trim()) specialParts.push(`Guest: ${guestName.trim()}${guestPhone.trim() ? ` (${guestPhone.trim()})` : ''}`);
    const waiterLabel = waitersList.find(w => String(w.user_id) === assignedWaiterId)?.full_name || customWaiterName.trim();
    if (waiterLabel) specialParts.push(`Server: ${waiterLabel}`);
    if (orderTiming === 'scheduled' && scheduledTime) specialParts.push(`Serve Time: ${scheduledTime}`);
    if (paymentMethod && paymentStatus !== 'Pending') specialParts.push(`Payment: ${paymentStatus} (${paymentMethod})`);
    if (specialInstr.trim()) specialParts.push(specialInstr.trim());

    // Allergy string
    const combinedAllergies = [
      ...allergyTags,
      customAllergy.trim()
    ].filter(Boolean).join(', ');

    // Calculate totals for payment
    const baseItemsTotal = cartItems.reduce((acc, curr) => acc + (curr.base_price * curr.quantity), 0);
    const customizationsTotal = cartItems.reduce((acc, curr) => {
      const cPrice = curr.choice?.price || 0;
      const aPrice = curr.accompaniment?.price || 0;
      const ePrice = curr.extras.reduce((sum, ex) => sum + (ex.price * ex.quantity), 0);
      return acc + ((cPrice + aPrice + ePrice) * curr.quantity);
    }, 0);
    const itemsSubtotal = baseItemsTotal + customizationsTotal;
    const deliveryFee = (orderType === 'Delivery' || orderType === 'Room Service') ? Number(deliveryCharge || 0) : 0;
    const grandTotal = itemsSubtotal + deliveryFee;

    const payload = {
      customer_id: selectedCustomerId || null,
      seating_location: finalLocation,
      delivery_option: orderType === 'Delivery' ? 'Delivery' : (orderType === 'Room Service' ? 'Room Service' : (orderType === 'Takeaway' ? 'Takeaway' : 'Premises')),
      delivery_address: orderType === 'Delivery' ? deliveryAddress.trim() : (orderType === 'Room Service' ? (cottageRoom === 'Other' ? customRoom.trim() : cottageRoom) : null),
      delivery_charge: (orderType === 'Delivery' || orderType === 'Room Service') && Number(deliveryCharge) > 0 ? Number(deliveryCharge) : null,
      preferred_time: orderTiming === 'scheduled' && scheduledTime ? new Date(scheduledTime).toISOString() : null,
      special_instr: specialParts.length > 0 ? specialParts.join(' | ') : null,
      allergy_info: combinedAllergies || null,
      assigned_waiter: assignedWaiterId ? Number(assignedWaiterId) : null,
      payment_status: paymentStatus,
      amount_paid: paymentStatus === 'Paid' ? grandTotal : (paymentStatus === 'Partially Paid' ? Number(amountPaid || 0) : 0),
      items: itemsPayload
    };

    setIsSubmittingOrder(true);
    try {
      await createRestaurantOrder(payload);
      setIsCreateOpen(false);
      resetCreateOrderForm();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create order');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setEditError(null);

    try {
      const total = selectedOrder.totalAmount ?? selectedOrder.value ?? 0;
      const finalPaid = Number(editAmountPaid);
      const remaining = Math.max(0, total - finalPaid);

      let finalStatus = editPaymentStatus;
      if (remaining <= 0.01 && finalPaid > 0) {
        finalStatus = 'Paid';
      } else if (finalPaid > 0 && remaining > 0.01) {
        finalStatus = 'Partially Paid';
      }

      await updateRestaurantOrder(selectedOrder.id, {
        order_status: editStatus,
        payment_status: finalStatus,
        amount_paid: finalPaid
      });
      setSelectedOrder(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update order');
    }
  };

  const openDetails = (order: RestaurantOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditPaymentStatus(order.paymentStatus);
    setEditAmountPaid(order.amountPaid);
    setAddBalanceAmount('');
    setEditError(null);
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-full min-h-[82vh]">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">
            {activeTab === 'active' ? 'Active Orders' : 'Order History'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {activeTab === 'active'
              ? 'Monitor and progress culinary ticket orders submitted by guests.'
              : 'View past completed restaurant orders that have been archived.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {heldSessions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(true);
                setIsHeldSessionsOpen(true);
              }}
              className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-full px-4 py-2 text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs animate-in fade-in"
              title="Open held order sessions with active countdowns"
            >
              <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
              <span>Held Orders: {heldSessions.length}</span>
            </button>
          )}
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#0A2540]! text-[#D4AF37]! hover:bg-[#07192C]! border border-[#D4AF37]/30 dark:bg-[#D4AF37]! dark:text-[#0A192F]! dark:hover:bg-[#B89320]! rounded-full px-5 py-2.5 text-xs font-bold shadow-sm cursor-pointer animate-in fade-in"
          >
            <Plus className="h-4 w-4" />
            Create New Order
          </Button>
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-955/40 border border-zinc-150/40 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-foreground dark:text-zinc-300">
            <ChefHat className="h-4 w-4 text-violet-450 dark:text-violet-400" />
            <span>Active Tickets: {orders.filter(o => o.status !== 'Completed' && o.rawItems && o.rawItems.length > 0).length}</span>
          </div>
        </div>
      </div>

      {/* Active Orders Toolbar (Filter & Sort Controls) */}
      {activeTab === 'active' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-150/40 dark:border-zinc-800">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter active tickets by table, order #, or item..."
              value={activeSearch}
              onChange={(e) => setActiveSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-foreground placeholder:text-zinc-400"
            />
            {activeSearch && (
              <button
                type="button"
                onClick={() => setActiveSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#D4AF37]" />
              Sort Active Orders:
            </span>
            <div className="flex items-center bg-white dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSortOrder('newest')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${sortOrder === 'newest'
                  ? 'bg-[#0A2540] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground'
                  }`}
              >
                <ArrowDown className="h-3 w-3" />
                Most Recent First
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('oldest')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${sortOrder === 'oldest'
                  ? 'bg-[#0A2540] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground'
                  }`}
              >
                <ArrowUp className="h-3 w-3" />
                Oldest First
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board columns */}
      {activeTab === 'active' && (
        <div className="flex-1 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full items-start">
            {COLUMNS.map((col) => {
              const columnOrders = orders
                .filter(o => {
                  if (o.status !== col || !o.rawItems || o.rawItems.length === 0) return false;
                  if (activeSearch) {
                    const term = activeSearch.toLowerCase();
                    return (
                      o.orderNumber.toLowerCase().includes(term) ||
                      o.table.toLowerCase().includes(term) ||
                      o.items.toLowerCase().includes(term)
                    );
                  }
                  return true;
                })
                .sort((a, b) => {
                  const timeA = getOrderTimestamp(a);
                  const timeB = getOrderTimestamp(b);
                  return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
                });
              return (
                <div
                  key={col}
                  className="flex flex-col w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150/40 dark:border-zinc-800 rounded-2xl p-3 max-h-[70vh]"
                >
                  {/* Column Title */}
                  <div className="flex items-center justify-between pb-2 mb-3 shrink-0">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-355 uppercase tracking-wide">{col}</span>
                    <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getStatusColor(col)}`}>
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* Tickets list */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
                    {columnOrders.length === 0 ? (
                      <div className="h-16 flex items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 text-xs text-zinc-400 dark:text-zinc-500 text-center font-medium">
                        No tickets
                      </div>
                    ) : (
                      columnOrders.map((order) => {
                        const next = getNextStatus(order.status);
                        return (
                          <Card
                            key={order.id}
                            variant="glass"
                            className="p-3.5 shadow-md flex flex-col gap-2.5 border-zinc-150/40 dark:border-zinc-800 hover:border-zinc-800 dark:hover:border-zinc-650 transition-colors group cursor-pointer"
                            onClick={() => openDetails(order)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col gap-1 min-w-0 pr-2">
                                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 leading-none truncate">{order.table}</span>
                                <span className="text-[9px] text-zinc-405 dark:text-zinc-500 font-bold font-mono tracking-tight">{order.orderNumber}</span>
                              </div>
                              <span className="text-xs text-zinc-900 dark:text-zinc-100 font-bold shrink-0">
                                {formatPrice(order.value)}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal font-semibold line-clamp-2">
                              {order.items}
                            </p>

                            {/* Footer with actions */}
                            <div className="flex items-center justify-between pt-2.5 mt-0.5 shrink-0 border-t border-zinc-100/50 dark:border-zinc-800/40">
                              <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                                <Clock className="h-3 w-3 text-zinc-450" />
                                <span>{order.timestamp}</span>
                              </div>

                              {/* Ticket Shift Button */}
                              {next && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateOrderStatus(order.id, next);
                                  }}
                                  className="flex items-center gap-1 rounded-lg bg-violet-600/10 dark:bg-violet-500/10 border border-violet-500/20 dark:border-violet-900/50 hover:bg-violet-650 dark:hover:bg-violet-600 hover:text-white dark:hover:text-white! px-2 py-1 text-[10px] font-bold text-violet-555 dark:text-violet-400 transition-colors focus:outline-none cursor-pointer"
                                >
                                  <span>
                                    {next === 'Preparing' ? 'Start Preparing' : next === 'Ready' ? 'Mark Ready' : next === 'Completed' ? 'Complete' : next}
                                  </span>
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              )}

                              {order.status === 'Completed' && (
                                <CheckSquare className="h-3.5 w-3.5 text-zinc-450 dark:text-zinc-400" />
                              )}
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Orders History Section */}
      {activeTab === 'history' && (
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Completed Orders History
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  {archivedOrders.length}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Archived list of culinary tickets completed more than 30 minutes ago.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search history by order, table..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-zinc-955 border border-zinc-150/40 dark:border-zinc-850 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-650 font-semibold shadow-2xs"
                />
                {archiveSearch && (
                  <button
                    type="button"
                    onClick={() => setArchiveSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher Toggle: List vs Grid */}
              <div className="flex items-center bg-white dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetHistoryViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${historyViewMode === 'list'
                    ? 'bg-[#0A2540] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground'
                    }`}
                  title="List View"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">List</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetHistoryViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${historyViewMode === 'grid'
                    ? 'bg-[#0A2540] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground'
                    }`}
                  title="Grid View (Cards)"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* List (Table) View */}
          {historyViewMode === 'list' && (
            <div className="border border-zinc-150/40 dark:border-zinc-800 rounded-2xl overflow-hidden bg-card text-card-foreground shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-150/40 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-[10px] uppercase font-bold tracking-wider text-zinc-450 dark:text-zinc-550">
                      <th className="py-3.5 px-4">Order #</th>
                      <th className="py-3.5 px-4">Seating / Table</th>
                      <th className="py-3.5 px-4">Items</th>
                      <th className="py-3.5 px-4">Completed At</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150/30 dark:divide-zinc-800/40">
                    {archivedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-zinc-405 dark:text-zinc-500 font-medium">
                          {archiveSearch ? 'No archived orders matching your search.' : 'No completed orders in archive history.'}
                        </td>
                      </tr>
                    ) : (
                      archivedOrders.map((order) => {
                        const completedTimeStr = formatOrderCompletedTime(order);

                        return (
                          <tr
                            key={order.id}
                            className="text-xs hover:bg-zinc-50/40 dark:hover:bg-zinc-805/20 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-zinc-500 dark:text-zinc-400">
                              {order.orderNumber}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-violet-600 dark:text-violet-400">
                              {order.table}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-zinc-700 dark:text-zinc-300 max-w-[280px] truncate" title={order.items}>
                              {order.items}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-zinc-500 dark:text-zinc-400">
                              {completedTimeStr}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getPaymentBadgeClass(order.paymentStatus)}`}>
                                {order.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-zinc-900 dark:text-zinc-100">
                              {formatPrice(order.value)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => openDetails(order)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-800 dark:hover:border-zinc-650 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-[11px] font-bold text-zinc-650 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grid (Cards) View */}
          {historyViewMode === 'grid' && (
            <div>
              {archivedOrders.length === 0 ? (
                <div className="border border-zinc-150/40 dark:border-zinc-800 rounded-2xl p-12 text-center bg-card text-card-foreground shadow-sm flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3 border border-zinc-200 dark:border-zinc-700">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    No completed orders found
                  </h5>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                    {archiveSearch ? 'No archived orders match your search criteria.' : 'Completed orders will appear here once archived.'}
                  </p>
                  {archiveSearch && (
                    <button
                      type="button"
                      onClick={() => setArchiveSearch('')}
                      className="mt-3.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {archivedOrders.map((order) => {
                    const completedTimeStr = formatOrderCompletedTime(order);

                    return (
                      <Card
                        key={order.id}
                        variant="glass"
                        onClick={() => openDetails(order)}
                        className="p-4 shadow-sm hover:shadow-md flex flex-col justify-between border-zinc-150/40 dark:border-zinc-800 hover:border-[#D4AF37]/50 dark:hover:border-[#D4AF37]/50 transition-all duration-200 group cursor-pointer rounded-2xl bg-card"
                      >
                        <div className="space-y-3">
                          {/* Top Header: Order # & Status Badges */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 tracking-tight block truncate">
                                {order.orderNumber}
                              </span>
                              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 block truncate mt-0.5">
                                {order.table}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getPaymentBadgeClass(order.paymentStatus)}`}>
                                {order.paymentStatus}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                <CheckSquare className="h-2.5 w-2.5" /> Completed
                              </span>
                            </div>
                          </div>

                          {/* Ordered Items Box */}
                          <div className="bg-zinc-50/70 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-150/40 dark:border-zinc-800/60">
                            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                              <Utensils className="h-3 w-3" />
                              <span>Ordered Items</span>
                            </div>
                            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-relaxed" title={order.items}>
                              {order.items}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Metadata & Action Button */}
                        <div className="pt-3 mt-3 border-t border-zinc-100/60 dark:border-zinc-800/60 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-medium text-[11px]">
                              <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                              <span>{completedTimeStr}</span>
                            </div>
                            <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                              {formatPrice(order.value)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(order);
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-[#D4AF37]/60 dark:hover:border-[#D4AF37]/60 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                          >
                            <span>Details</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Order Modal */}

      {/* Modern, Detailed Create Order Modal with Customizations & Live Reflection */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-5 bg-black/60 dark:bg-black/75 animate-fade-in backdrop-blur-md">
          <div className="glass-panel w-full max-w-[97vw] 2xl:max-w-[1880px] h-[95vh] max-h-[96vh] bg-card dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-[28px] shadow-2xl relative flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/80 shrink-0 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#0A2540] dark:bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-sm">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                      New Restaurant Order
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active POS Ticket
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Configure service destination, guest details, culinary customizations, and add-ons.
                  </p>
                </div>
              </div>

              {/* Dining Mode Quick Switcher Pills */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {(['Premises', 'Room Service', 'Takeaway', 'Delivery'] as const).map(mode => {
                  const isActive = orderType === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setOrderType(mode)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                        ? 'bg-[#0A2540] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground'
                        }`}
                    >
                      {mode === 'Premises' && <Utensils className="h-3.5 w-3.5" />}
                      {mode === 'Room Service' && <BedDouble className="h-3.5 w-3.5" />}
                      {mode === 'Takeaway' && <Coffee className="h-3.5 w-3.5" />}
                      {mode === 'Delivery' && <MapPin className="h-3.5 w-3.5" />}
                      <span>{mode === 'Premises' ? 'Dine-in' : mode}</span>
                    </button>
                  );
                })}
              </div>

              {/* Top Controls: Hold Session, New Order, Held Sessions Flyout, and Close */}
              <div className="flex items-center gap-2">
                {/* Hold Session Button */}
                <button
                  type="button"
                  onClick={handleHoldCurrentSession}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Hold session where it currently is to start another order"
                >
                  <PauseCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Hold Session</span>
                  <span className="sm:hidden">Hold</span>
                </button>

                {/* New Order Button */}
                <button
                  type="button"
                  onClick={handleStartNewOrder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Start another fresh order ticket"
                >
                  <Plus className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">New Order</span>
                  <span className="sm:hidden">New</span>
                </button>

                {/* Held Sessions Button & Active Flyout */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsHeldSessionsOpen(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${heldSessions.length > 0
                      ? (isHeldSessionsOpen
                        ? 'bg-[#0A2540] text-[#D4AF37] border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A192F]'
                        : 'bg-zinc-100 dark:bg-zinc-950 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10')
                      : 'bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-foreground'
                      }`}
                    title="View held order sessions with active countdowns"
                  >
                    <Clock className={`h-3.5 w-3.5 ${heldSessions.length > 0 ? 'text-amber-500 animate-pulse' : 'text-zinc-400'}`} />
                    <span className="hidden sm:inline">Held Sessions</span>
                    {heldSessions.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-black shadow-xs">
                        {heldSessions.length}
                      </span>
                    )}
                  </button>

                  {/* Held Sessions Flyout / Popover */}
                  {isHeldSessionsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 md:w-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <h5 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                            Held Sessions ({heldSessions.length})
                          </h5>
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                            Limit: {orderHoldDurationMinutes >= 60 ? `${(orderHoldDurationMinutes / 60).toFixed(orderHoldDurationMinutes % 60 === 0 ? 0 : 1)}h` : `${orderHoldDurationMinutes}m`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsHeldSessionsOpen(false)}
                          className="text-zinc-400 hover:text-foreground p-1 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {heldSessions.length === 0 ? (
                        <div className="py-8 text-center text-xs text-zinc-400">
                          <PauseCircle className="h-8 w-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
                          <p className="font-semibold text-zinc-600 dark:text-zinc-400">No held sessions.</p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            Click &ldquo;Hold Session&rdquo; while taking an order to park it and resume later.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 overflow-y-auto max-h-[50vh] pr-1">
                          {heldSessions.map(session => {
                            const { countdownStr, elapsedStr, isExpiring, isExpired } = formatCountdown(session.heldAt, nowMs);
                            const itemCount = session.cartItems.reduce((acc, c) => acc + c.quantity, 0);

                            return (
                              <div
                                key={session.id}
                                className={`p-3 rounded-xl border transition-all flex flex-col gap-2 shadow-2xs group ${
                                  isExpired
                                    ? 'border-red-500/40 bg-red-50/20 dark:bg-red-955/10'
                                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 hover:border-amber-500/50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <h6 className="text-xs font-bold text-foreground truncate">
                                      {session.label}
                                    </h6>
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold block truncate">
                                      {itemCount} {itemCount === 1 ? 'item' : 'items'} • UGX {session.totalAmount.toLocaleString()}
                                    </span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0A2540] text-[#D4AF37] dark:bg-[#D4AF37]/20 dark:text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
                                    {session.orderType === 'Premises' ? 'Dine-In' : session.orderType}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <Timer className={`h-3.5 w-3.5 ${isExpiring ? 'text-red-500 animate-bounce' : 'text-amber-500'}`} />
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                                        Hold Countdown
                                      </span>
                                      <span className={`text-xs font-mono font-extrabold ${isExpiring ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {countdownStr} {!countdownStr.includes('Expired') && 'left'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                                      Held Time
                                    </span>
                                    <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300">
                                      +{elapsedStr}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-150/50 dark:border-zinc-800">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteHeldSession(session.id)}
                                    className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-955/30 transition-colors cursor-pointer"
                                    title="Discard held session"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleResumeSession(session)}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0A2540] text-[#D4AF37] hover:bg-[#07192C] dark:bg-[#D4AF37] dark:text-[#0A192F] dark:hover:bg-[#B89320] text-xs font-bold transition-all cursor-pointer shadow-xs ml-auto"
                                  >
                                    <Play className="h-3 w-3 fill-current" />
                                    <span>Resume Order</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsHeldSessionsOpen(false);
                    resetCreateOrderForm();
                  }}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Hold Success / Notice Banner */}
            {holdSuccessMessage && (
              <div className="mx-6 mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-955/30 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between shrink-0 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                  <span>{holdSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHoldSuccessMessage(null)}
                  className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Error Notification Banner */}
            {createError && (
              <div className="mx-6 mt-3 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-955/30 p-3 rounded-2xl border border-red-200 dark:border-red-900/50 flex items-center gap-2 shrink-0 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{createError}</span>
              </div>
            )}

            {/* 3-Column Main Body */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 min-h-0 bg-zinc-50/40 dark:bg-zinc-950/20">

              {/* ======================================================== */}
              {/* COLUMN 1: Order Settings & Guest Info (4 cols)           */}
              {/* ======================================================== */}
              <div className="lg:col-span-4 flex flex-col min-h-0 bg-white dark:bg-zinc-900 rounded-[22px] border border-zinc-200 dark:border-zinc-800 p-4 overflow-y-auto space-y-4 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                  <MapPin className="h-4 w-4 text-[#D4AF37]" />
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                    1. Destination & Service Details
                  </h4>
                </div>

                {/* Destination Details Based on Order Type */}
                {orderType === 'Premises' && (() => {
                  const distinctLocations = Array.from(new Set(tablesList.map(t => t.location).filter(Boolean)));
                  const filteredTables = tableLocationFilter === 'ALL'
                    ? tablesList
                    : tablesList.filter(t => t.location === tableLocationFilter);

                  return (
                    <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-800/80">
                      {/* Dining Area / Location Filter */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Dining Area / Location
                          </label>
                          <span className="text-[10px] text-zinc-400 font-semibold">
                            {tablesList.length} total premises tables
                          </span>
                        </div>
                        <select
                          value={tableLocationFilter}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTableLocationFilter(val);
                            if (val !== 'ALL') {
                              setSeatingArea(val);
                            }
                          }}
                          className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37] cursor-pointer"
                        >
                          <option value="ALL">All Dining Areas ({tablesList.length} tables)</option>
                          {distinctLocations.map(loc => (
                            <option key={loc} value={loc}>
                              {loc} ({tablesList.filter(t => t.location === loc).length} tables)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Table Header with Add Table & Manage Action Buttons */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Table Selection {tableLocationFilter !== 'ALL' && `(${filteredTables.length})`}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddTableOpen(prev => !prev);
                                if (isManageTablesMode) setIsManageTablesMode(false);
                              }}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 transition-all flex items-center gap-1 cursor-pointer"
                              title="Create and register a new table to the premises in the DB"
                            >
                              <Plus className="h-3 w-3" />
                              <span>+ Add Table</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsManageTablesMode(prev => !prev);
                                if (isAddTableOpen) setIsAddTableOpen(false);
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${isManageTablesMode
                                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40'
                                : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-foreground'
                                }`}
                              title="Toggle table delete mode"
                            >
                              <Settings2 className="h-3 w-3" />
                              <span>{isManageTablesMode ? 'Done' : 'Manage'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Form: Add Table to Premises */}
                        {isAddTableOpen && (
                          <form onSubmit={handleCreateNewTable} className="p-3 mb-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
                              <span className="text-[11px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Plus className="h-3.5 w-3.5 text-amber-500" /> Add Table to Premises
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsAddTableOpen(false)}
                                className="text-zinc-400 hover:text-foreground text-xs font-bold"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                  Table # / Identifier *
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Table 10 or Deck 3"
                                  value={newTableNumber}
                                  onChange={(e) => setNewTableNumber(e.target.value)}
                                  className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37]"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                  Seating Capacity
                                </label>
                                <select
                                  value={newTableCapacity}
                                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                                  className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1.5 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37] cursor-pointer"
                                >
                                  <option value={2}>2 Guests (Intimate)</option>
                                  <option value={4}>4 Guests (Standard)</option>
                                  <option value={6}>6 Guests (Family)</option>
                                  <option value={8}>8 Guests (Large Group)</option>
                                  <option value={10}>10+ Guests (Banquet)</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                Location (Dining Area) *
                              </label>
                              <div className="space-y-1.5">
                                <select
                                  value={newTableLocation}
                                  onChange={(e) => setNewTableLocation(e.target.value)}
                                  className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37] cursor-pointer"
                                >
                                  {distinctLocations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                  ))}
                                  <option value="NEW">+ Create New Dining Area...</option>
                                </select>

                                {newTableLocation === 'NEW' && (
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. Sunset Rooftop or Poolside Cabana"
                                    value={customNewLocation}
                                    onChange={(e) => setCustomNewLocation(e.target.value)}
                                    className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37]"
                                  />
                                )}
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setIsAddTableOpen(false)}
                                className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 hover:text-foreground cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isSavingTable || !newTableNumber.trim()}
                                className="px-3.5 py-1 rounded-lg bg-[#0A2540] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A192F] text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {isSavingTable ? 'Saving...' : 'Save & Select Table'}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Tables Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {filteredTables.map(t => {
                            const isSelected = table === t.table_number;
                            return (
                              <div key={t.table_id} className="relative group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isManageTablesMode) {
                                      setTable(t.table_number);
                                      setSeatingArea(t.location);
                                    }
                                  }}
                                  className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center flex flex-col items-center justify-center ${isSelected
                                    ? 'bg-[#0A2540] text-[#D4AF37] border-[#D4AF37]/50 dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-xs'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                                    }`}
                                >
                                  <span className="truncate w-full">{t.table_number}</span>
                                  <span className={`text-[9px] font-normal truncate max-w-full ${isSelected ? 'text-[#D4AF37]/80 dark:text-[#0A192F]/80' : 'text-zinc-400'}`}>
                                    {t.capacity}p • {t.location.split(' ')[0]}
                                  </span>
                                </button>

                                {isManageTablesMode && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTable(t.table_id, t.table_number);
                                    }}
                                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-md hover:bg-red-700 cursor-pointer z-10 transition-transform hover:scale-110"
                                    title={`Delete ${t.table_number} from premises`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => setTable('Other')}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center col-span-2 sm:col-span-1 ${table === 'Other'
                              ? 'bg-[#0A2540] text-[#D4AF37] border-[#D4AF37]/50 dark:bg-[#D4AF37] dark:text-[#0A192F]'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                              }`}
                          >
                            Custom...
                          </button>
                        </div>

                        {table === 'Other' && (
                          <input
                            type="text"
                            required
                            placeholder="e.g. Garden Pavilion Table 5"
                            value={customTable}
                            onChange={(e) => setCustomTable(e.target.value)}
                            className="mt-2 w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37]"
                          />
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Destination Details: Room Service with DB Checked-In Room Selector */}
                {orderType === 'Room Service' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-955/60 border border-zinc-150 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Delivery Room Unit
                        </label>
                        {checkedInRooms.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {checkedInRooms.length} Checked In
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowAllRoomsMode(prev => !prev)}
                          className="text-[10px] font-bold text-zinc-500 hover:text-foreground underline cursor-pointer"
                        >
                          {showAllRoomsMode ? 'Checked-In Only' : 'All Rooms'}
                        </button>
                        <button
                          type="button"
                          onClick={fetchCheckedInRooms}
                          className="p-1 rounded-lg text-zinc-400 hover:text-foreground cursor-pointer"
                          title="Refresh checked in rooms"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoadingRooms ? 'animate-spin text-[#D4AF37]' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {isLoadingRooms ? (
                      <div className="py-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#D4AF37]" />
                        <span>Loading checked-in rooms...</span>
                      </div>
                    ) : !showAllRoomsMode ? (
                      // Checked-In Rooms Mode
                      checkedInRooms.length === 0 ? (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1.5">
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                            No rooms currently marked as Checked In
                          </p>
                          <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80">
                            Switch to view all rooms or enter a custom room number below.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAllRoomsMode(true)}
                            className="mt-1 px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold cursor-pointer"
                          >
                            Browse All Hotel Rooms
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {checkedInRooms.map(r => {
                            const isSelected = cottageRoom === `Room ${r.room_number}` || cottageRoom === r.room_number;
                            return (
                              <button
                                type="button"
                                key={r.room_id}
                                onClick={() => handleSelectCheckedInRoom(r)}
                                className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between group ${isSelected
                                  ? 'bg-[#0A2540] text-[#D4AF37] border-[#D4AF37] dark:bg-[#D4AF37]/20 dark:border-[#D4AF37] dark:text-[#D4AF37] shadow-xs'
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-foreground hover:border-[#D4AF37]/40'
                                  }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-extrabold tracking-tight">
                                      Room {r.room_number}
                                    </span>
                                    {r.category_name && (
                                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold truncate ${isSelected ? 'bg-white/10 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                        {r.category_name}
                                      </span>
                                    )}
                                  </div>
                                  {r.guest_name ? (
                                    <p className={`text-[11px] font-semibold truncate mt-0.5 flex items-center gap-1 ${isSelected ? 'text-[#D4AF37]' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                      <User className="h-3 w-3 shrink-0" />
                                      <span>{r.guest_name}</span>
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-zinc-400 mt-0.5">Occupied Guest</p>
                                  )}
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${isSelected ? 'bg-[#D4AF37] text-[#0A2540]' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
                                    Checked In
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      // All Rooms Mode
                      <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {(allRoomsList.length > 0 ? allRoomsList : [
                          { room_number: '101' }, { room_number: '102' }, { room_number: '201' }, { room_number: '202' },
                          { room_number: '301' }, { room_number: '401' }, { room_number: '501' }, { room_number: 'Cottage 1' },
                          { room_number: 'Cottage 2' }, { room_number: 'Cottage 3' }, { room_number: 'Royal Suite' }
                        ]).map((r: any) => {
                          const numStr = String(r.room_number).startsWith('Room') || String(r.room_number).startsWith('Cottage') || String(r.room_number).includes(' ')
                            ? String(r.room_number)
                            : `Room ${r.room_number}`;
                          const isSelected = cottageRoom === numStr;
                          return (
                            <button
                              type="button"
                              key={r.room_id || r.room_number}
                              onClick={() => setCottageRoom(numStr)}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center truncate ${isSelected
                                ? 'bg-[#0A2540] text-[#D4AF37] border-[#D4AF37]/50 dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                                }`}
                            >
                              {numStr}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Custom Room Option */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setCottageRoom('Other')}
                        className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${cottageRoom === 'Other'
                          ? 'bg-[#0A2540] text-[#D4AF37] border-[#D4AF37]/50 dark:bg-[#D4AF37] dark:text-[#0A192F]'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                          }`}
                      >
                        + Custom Room or Cottage...
                      </button>

                      {cottageRoom === 'Other' && (
                        <input
                          type="text"
                          required
                          placeholder="e.g. Room 204 or Honeymoon Cottage"
                          value={customRoom}
                          onChange={(e) => setCustomRoom(e.target.value)}
                          className="mt-1.5 w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37]"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Room Service Tray Charge (Optional UGX)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 5000"
                        value={deliveryCharge}
                        onChange={(e) => setDeliveryCharge(e.target.value)}
                        className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                )}

                {orderType === 'Delivery' && (
                  <div className="space-y-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-800/80">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                        Delivery Address / Destination *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Plot 14 Makindye Hill Road or Gate 2"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                        Delivery Fee (UGX)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 10000"
                        value={deliveryCharge}
                        onChange={(e) => setDeliveryCharge(e.target.value)}
                        className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                )}

                {orderType === 'Takeaway' && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold">Takeaway / Pickup Order</p>
                    <p className="text-[11px] opacity-80 mt-0.5">Order will be packaged in biodegradable takeaway containers for pickup at restaurant dispatch.</p>
                  </div>
                )}

                {/* Guest / Customer Details */}
                <div className="space-y-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#D4AF37]" />
                      Guest & Customer
                    </label>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSource('walkin');
                          setSelectedCustomerId(null);
                        }}
                        className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${customerSource === 'walkin'
                          ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                          : 'text-zinc-500 hover:text-foreground'
                          }`}
                      >
                        Walk-in
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerSource('crm')}
                        className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${customerSource === 'crm'
                          ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                          : 'text-zinc-500 hover:text-foreground'
                          }`}
                      >
                        CRM Client
                      </button>
                    </div>
                  </div>

                  {customerSource === 'crm' && (
                    <select
                      value={selectedCustomerId ? String(selectedCustomerId) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setSelectedCustomerId(null);
                        } else {
                          const found = customersList.find(c => String(c.customer_id) === val);
                          if (found) {
                            setSelectedCustomerId(found.customer_id);
                            setGuestName(found.full_name || '');
                            setGuestPhone(found.phone_number || '');
                          }
                        }
                      }}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground font-semibold outline-none focus:border-[#D4AF37] cursor-pointer mb-2"
                    >
                      <option value="">-- Choose Registered Customer --</option>
                      {customersList.map(cust => (
                        <option key={cust.customer_id} value={cust.customer_id}>
                          {cust.full_name} {cust.phone_number ? `(${cust.phone_number})` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Guest Name (e.g. John)"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                {/* Staff & Timing */}
                <div className="space-y-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Assigned Waiter / Server
                      </label>
                      <select
                        value={assignedWaiterId}
                        onChange={(e) => setAssignedWaiterId(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37] cursor-pointer"
                      >
                        <option value="">-- Unassigned Server --</option>
                        {waitersList.map(w => (
                          <option key={w.user_id} value={w.user_id}>
                            {w.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Order Timing
                      </label>
                      <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-950 p-0.5 border border-zinc-200 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setOrderTiming('asap')}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${orderTiming === 'asap'
                            ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                            : 'text-zinc-500'
                            }`}
                        >
                          ASAP
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderTiming('scheduled')}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${orderTiming === 'scheduled'
                            ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                            : 'text-zinc-500'
                            }`}
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  </div>

                  {orderTiming === 'scheduled' && (
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37]"
                    />
                  )}
                </div>

                {/* Dietary & Allergy Alerts */}
                <div className="space-y-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                  <label className="text-[11px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    Allergies & Dietary Restrictions
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['No Peanuts', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Vegetarian', 'Vegan', 'No Seafood'].map(tag => {
                      const isChecked = allergyTags.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => {
                            setAllergyTags(prev => isChecked ? prev.filter(t => t !== tag) : [...prev, tag]);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${isChecked
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                            }`}
                        >
                          {isChecked ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Other specific allergies or dietary notes..."
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* General Special Instructions */}
                <div className="space-y-1 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Kitchen / Chef Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Serve drinks immediately, prepare main course after 20 mins..."
                    value={specialInstr}
                    onChange={(e) => setSpecialInstr(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37] resize-none"
                  />
                </div>

                {/* Payment Option Setup */}
                <div className="space-y-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                  <label className="text-[11px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    Payment Preference
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Pending', 'Paid', 'Partially Paid'] as const).map(p => {
                      const isSel = paymentStatus === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPaymentStatus(p)}
                          className={`py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer text-center ${isSel
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                        >
                          {p === 'Pending' ? 'Pay Later' : p}
                        </button>
                      );
                    })}
                  </div>

                  {paymentStatus !== 'Pending' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <select
                          value={paymentMethod}
                          onChange={(e: any) => setPaymentMethod(e.target.value)}
                          className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37] cursor-pointer"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Card">Card (POS)</option>
                          <option value="Mobile Money">Mobile Money (MTN/Airtel)</option>
                          <option value="Room Bill">Bill to Room</option>
                        </select>
                      </div>
                      {paymentStatus === 'Partially Paid' && (
                        <div>
                          <input
                            type="number"
                            min="0"
                            placeholder="Amount Paid (UGX)"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>


              {/* ======================================================== */}
              {/* COLUMN 2: Menu Dishes Browser & Interactive Customizer   */}
              {/* ======================================================== */}
              <div className="lg:col-span-4 flex flex-col min-h-0 bg-white dark:bg-zinc-900 rounded-[22px] border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs relative overflow-hidden">
                {customizingItem ? (
                  /* ======================================= */
                  /* ACTIVE DISH CUSTOMIZER VIEW             */
                  /* ======================================= */
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCustomizingItem(null)}
                        className="text-xs font-bold text-zinc-500 hover:text-foreground flex items-center gap-1.5 cursor-pointer py-1"
                      >
                        ← Back to Menu
                      </button>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                        Customize Dish
                      </span>
                    </div>

                    {/* Dish Hero Card */}
                    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800">
                      <img
                        src={getImageUrl(customizingItem.item.image)}
                        alt={customizingItem.item.name}
                        className="h-16 w-16 rounded-xl object-cover bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                          {customizingItem.item.category}
                        </span>
                        <h4 className="text-sm font-extrabold text-foreground leading-tight truncate">
                          {customizingItem.item.name}
                        </h4>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          Base: UGX {customizingItem.item.priceUGX.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* 1. Choices / Preparation Selection */}
                    {customizingItem.item.choices && customizingItem.item.choices.length > 0 && (
                      <div className="space-y-2 p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1">
                            Choices / Preparation
                          </label>
                          <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">Required</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {customizingItem.item.choices.map(c => {
                            const isSelected = customizingItem.choice?.choice_id === c.choice_id;
                            const cPrice = Number(c.price || 0);
                            return (
                              <button
                                type="button"
                                key={c.choice_id}
                                onClick={() => setCustomizingItem(prev => prev ? {
                                  ...prev,
                                  choice: {
                                    choice_id: c.choice_id!,
                                    choice_name: c.choice_name,
                                    price: cPrice
                                  }
                                } : null)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                                  ? 'bg-[#0A2540] text-[#D4AF37] border-[#D4AF37]/50 dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-xs'
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                                  }`}
                              >
                                <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-[#D4AF37] dark:bg-[#0A192F]' : 'border border-zinc-400'}`} />
                                <span>{c.choice_name}</span>
                                {cPrice > 0 ? (
                                  <span className="text-[10px] font-bold opacity-90">+UGX {cPrice.toLocaleString()}</span>
                                ) : (
                                  <span className="text-[10px] opacity-60">(Included)</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. Accompaniments / Sides Selection */}
                    {customizingItem.item.accompaniments && customizingItem.item.accompaniments.length > 0 && (
                      <div className="space-y-2 p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1">
                            Accompaniments (Sides)
                          </label>
                          <span className="text-[9px] uppercase font-bold text-zinc-400">Optional • Click to toggle</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomizingItem(prev => prev ? { ...prev, accompaniment: null } : null)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${!customizingItem.accompaniment
                              ? 'bg-[#0A2540] text-[#D4AF37] border-[#D4AF37]/50 dark:bg-[#D4AF37] dark:text-[#0A192F]'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                              }`}
                          >
                            No Side
                          </button>
                          {customizingItem.item.accompaniments.map(a => {
                            const isSelected = customizingItem.accompaniment?.accompaniment_id === a.accompaniment_id;
                            const aPrice = Number(a.price || 0);
                            return (
                              <button
                                type="button"
                                key={a.accompaniment_id}
                                onClick={() => {
                                  if (isSelected) {
                                    setCustomizingItem(prev => prev ? { ...prev, accompaniment: null } : null);
                                  } else {
                                    setCustomizingItem(prev => prev ? {
                                      ...prev,
                                      accompaniment: {
                                        accompaniment_id: a.accompaniment_id!,
                                        accompaniment_name: a.accompaniment_name,
                                        price: aPrice
                                      }
                                    } : null);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                                  ? 'bg-[#0A2540] text-[#D4AF37] border-[#D4AF37]/50 dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-xs'
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                                  }`}
                              >
                                <span>{a.accompaniment_name}</span>
                                {aPrice > 0 ? (
                                  <span className="text-[10px] font-bold opacity-90">+UGX {aPrice.toLocaleString()}</span>
                                ) : (
                                  <span className="text-[10px] opacity-60">(Included)</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. Extras & Add-ons Selection */}
                    {customizingItem.item.extras && customizingItem.item.extras.length > 0 && (
                      <div className="space-y-2 p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1">
                            Extras & Add-ons
                          </label>
                          <span className="text-[9px] uppercase font-bold text-zinc-400">Multiple allowed • Click to select</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {customizingItem.item.extras.map(ex => {
                            const found = customizingItem.extras.find(e => e.extra_id === ex.extra_id);
                            const isChecked = !!found;
                            const ePrice = Number(ex.price || 0);
                            const extraQty = found?.quantity || 1;
                            return (
                              <div
                                key={ex.extra_id}
                                onClick={() => {
                                  setCustomizingItem(prev => {
                                    if (!prev) return null;
                                    if (isChecked) {
                                      return { ...prev, extras: prev.extras.filter(e => e.extra_id !== ex.extra_id) };
                                    } else {
                                      return {
                                        ...prev,
                                        extras: [...prev.extras, {
                                          extra_id: ex.extra_id!,
                                          extra_name: ex.extra_name,
                                          price: ePrice,
                                          quantity: 1
                                        }]
                                      };
                                    }
                                  });
                                }}
                                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between ${isChecked
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-2xs'
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`h-4 w-4 rounded-md flex items-center justify-center border text-[9px] shrink-0 font-bold ${isChecked
                                    ? 'bg-[#D4AF37] border-[#D4AF37] text-zinc-900'
                                    : 'border-zinc-300 dark:border-zinc-700'
                                    }`}>
                                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                  </span>
                                  <span className="truncate">{ex.extra_name}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                                    +UGX {(ePrice * extraQty).toLocaleString()}
                                  </span>
                                  {isChecked && (
                                    <div
                                      className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 ml-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCustomizingItem(prev => {
                                            if (!prev) return null;
                                            if (extraQty <= 1) {
                                              return { ...prev, extras: prev.extras.filter(e => e.extra_id !== ex.extra_id) };
                                            }
                                            return {
                                              ...prev,
                                              extras: prev.extras.map(e => e.extra_id === ex.extra_id ? { ...e, quantity: e.quantity - 1 } : e)
                                            };
                                          });
                                        }}
                                        className="h-5 w-5 rounded bg-white dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold hover:bg-zinc-200 cursor-pointer shadow-2xs"
                                      >
                                        -
                                      </button>
                                      <span className="w-4 text-center text-[10px] font-extrabold">{extraQty}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCustomizingItem(prev => {
                                            if (!prev) return null;
                                            return {
                                              ...prev,
                                              extras: prev.extras.map(e => e.extra_id === ex.extra_id ? { ...e, quantity: e.quantity + 1 } : e)
                                            };
                                          });
                                        }}
                                        className="h-5 w-5 rounded bg-white dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold hover:bg-zinc-200 cursor-pointer shadow-2xs"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Item Notes */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Client Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mild spice, gravy on side, extra lemon..."
                        value={customizingItem.notes}
                        onChange={(e) => setCustomizingItem(prev => prev ? { ...prev, notes: e.target.value } : null)}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    {/* Bottom Action Bar for Customizer */}
                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 mt-auto shrink-0 bg-white dark:bg-zinc-900">
                      <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setCustomizingItem(prev => prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null)}
                          className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-xs font-bold hover:bg-zinc-200 cursor-pointer shadow-2xs"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-extrabold text-foreground">{customizingItem.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setCustomizingItem(prev => prev ? { ...prev, quantity: prev.quantity + 1 } : null)}
                          className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-xs font-bold hover:bg-zinc-200 cursor-pointer shadow-2xs"
                        >
                          +
                        </button>
                      </div>

                      {(() => {
                        const basePrice = customizingItem.item.priceUGX;
                        const cPrice = customizingItem.choice?.price || 0;
                        const aPrice = customizingItem.accompaniment?.price || 0;
                        const ePrice = customizingItem.extras.reduce((sum, ex) => sum + (ex.price * ex.quantity), 0);
                        const unitTotal = basePrice + cPrice + aPrice + ePrice;
                        const lineTotal = unitTotal * customizingItem.quantity;
                        return (
                          <button
                            type="button"
                            onClick={saveCustomizedItem}
                            className="px-4 py-2.5 rounded-xl bg-[#0A2540] text-[#D4AF37] hover:bg-[#07192C] border border-[#D4AF37]/30 dark:bg-[#D4AF37] dark:text-[#0A192F] text-xs font-bold shadow-sm cursor-pointer flex items-center gap-2"
                          >
                            <span>{customizingItem.existingCartId ? 'Update Item Ticket' : '✓ Add to Order Ticket'}</span>
                            <span>•</span>
                            <span className="font-extrabold">UGX {lineTotal.toLocaleString()}</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  /* ======================================= */
                  /* MENU DISHES BROWSER VIEW                */
                  /* ======================================= */
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="space-y-2 pb-3 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
                      <div className="relative">
                        <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search menu dishes, drinks, desserts..."
                          value={menuSearchTerm}
                          onChange={(e) => setMenuSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-foreground font-medium outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {/* Horizontal Category Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                        {['ALL', ...Array.from(new Set(menu.map(m => m.category).filter(Boolean)))].map(cat => {
                          const isSel = selectedMenuCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedMenuCategory(cat)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${isSel
                                ? 'bg-[#0A2540] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#0A192F] shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-foreground'
                                }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dish Cards Grid */}
                    <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
                      {menu
                        .filter(item => {
                          const matchSearch = item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                            item.category.toLowerCase().includes(menuSearchTerm.toLowerCase());
                          const matchCategory = selectedMenuCategory === 'ALL' || item.category === selectedMenuCategory;
                          return matchSearch && matchCategory && item.is_available !== false;
                        })
                        .map(item => {
                          const choicesCount = item.choices?.length || 0;
                          const accompanimentsCount = item.accompaniments?.length || 0;
                          const extrasCount = item.extras?.length || 0;
                          const hasAnyCustomization = choicesCount > 0 || accompanimentsCount > 0 || extrasCount > 0;

                          return (
                            <div
                              key={item.id}
                              className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-[#D4AF37]/50 transition-all flex items-center justify-between gap-3 bg-zinc-50/30 dark:bg-zinc-950/20 group hover:shadow-xs"
                            >
                              <div
                                onClick={() => startCustomizing(item)}
                                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                              >
                                <img
                                  src={getImageUrl(item.image)}
                                  alt={item.name}
                                  className="h-12 w-12 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-800"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#D4AF37] transition-colors">
                                      {item.name}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">
                                      UGX {item.priceUGX.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">•</span>
                                    <span className="text-[10px] font-semibold text-zinc-400 truncate">
                                      {item.category}
                                    </span>
                                  </div>

                                  {/* Customization Feature Badges */}
                                  {hasAnyCustomization && (
                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                      {choicesCount > 0 && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                          Choices ({choicesCount})
                                        </span>
                                      )}
                                      {accompanimentsCount > 0 && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                          Sides ({accompanimentsCount})
                                        </span>
                                      )}
                                      {extrasCount > 0 && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                          Add-ons ({extrasCount})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuickAdd(item)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${hasAnyCustomization
                                  ? 'bg-[#0A2540] text-[#D4AF37] hover:bg-[#07192C] border border-[#D4AF37]/30 dark:bg-[#D4AF37] dark:text-[#0A192F]'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200'
                                  }`}
                              >
                                {hasAnyCustomization ? '+ Customize' : '+ Add'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>


              {/* ======================================================== */}
              {/* COLUMN 3: Live Order Ticket & Financial Summary (4 cols) */}
              {/* ======================================================== */}
              <div className="lg:col-span-4 flex flex-col min-h-0 bg-white dark:bg-zinc-900 rounded-[22px] border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs">
                {/* Cart Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#D4AF37]" />
                    <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                      Order Ticket ({cartItems.reduce((acc, c) => acc + c.quantity, 0)})
                    </h4>
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Cart Items List with Live Preview Card */}
                <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1 min-h-0">
                  {/* Live Active Customizing Dish Preview Card */}
                  {customizingItem && (
                    <div className="p-3 rounded-2xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-ping" />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4AF37]">
                            {customizingItem.existingCartId ? 'Editing In Ticket' : 'Configuring Selection'}
                          </span>
                        </div>
                        {(() => {
                          const cPrice = customizingItem.choice?.price || 0;
                          const aPrice = customizingItem.accompaniment?.price || 0;
                          const ePrice = customizingItem.extras.reduce((sum, ex) => sum + (ex.price * ex.quantity), 0);
                          const itemLineTotal = (customizingItem.item.priceUGX + cPrice + aPrice + ePrice) * customizingItem.quantity;
                          return (
                            <span className="text-xs font-extrabold text-[#D4AF37]">
                              UGX {itemLineTotal.toLocaleString()}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {customizingItem.item.name} <span className="text-[11px] font-normal text-zinc-500">×{customizingItem.quantity}</span>
                          </h5>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
                            Base: UGX {customizingItem.item.priceUGX.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Live customized additions breakdown */}
                      <div className="space-y-1 text-[11px] bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl border border-[#D4AF37]/20">
                        {customizingItem.choice && (
                          <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-200">
                            <span>• Choice: {customizingItem.choice.choice_name}</span>
                            <span className="font-semibold text-[#D4AF37]">
                              {customizingItem.choice.price > 0 ? `+UGX ${customizingItem.choice.price.toLocaleString()}` : '(Included)'}
                            </span>
                          </div>
                        )}
                        {customizingItem.accompaniment && (
                          <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-200">
                            <span>• Side: {customizingItem.accompaniment.accompaniment_name}</span>
                            <span className="font-semibold text-[#D4AF37]">
                              {customizingItem.accompaniment.price > 0 ? `+UGX ${customizingItem.accompaniment.price.toLocaleString()}` : '(Included)'}
                            </span>
                          </div>
                        )}
                        {customizingItem.extras.map(ex => (
                          <div key={ex.extra_id} className="flex justify-between items-center text-zinc-700 dark:text-zinc-200">
                            <span>• Extra: {ex.extra_name} x{ex.quantity}</span>
                            <span className="font-semibold text-[#D4AF37]">+UGX {(ex.price * ex.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        {customizingItem.notes && (
                          <div className="text-amber-600 dark:text-amber-400 font-medium italic pt-0.5">
                            Note: {customizingItem.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {cartItems.length === 0 && !customizingItem ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                      <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                        <ShoppingBag className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
                      </div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Order Cart is Empty</p>
                      <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px]">
                        Select dishes from the menu and customize your choices, sides & extras.
                      </p>
                    </div>
                  ) : (
                    cartItems.map((item) => {
                      const choicePrice = item.choice?.price || 0;
                      const accomPrice = item.accompaniment?.price || 0;
                      const extrasPrice = item.extras.reduce((sum, ex) => sum + (ex.price * ex.quantity), 0);
                      const unitPrice = item.base_price + choicePrice + accomPrice + extrasPrice;
                      const lineTotal = unitPrice * item.quantity;

                      const menuItemOriginal = menu.find(m => m.id === String(item.menu_item_id));

                      return (
                        <div
                          key={item.cart_id}
                          className="p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                {item.name}
                              </h5>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                                UGX {unitPrice.toLocaleString()} each
                              </p>
                            </div>
                            <span className="text-xs font-extrabold text-foreground shrink-0">
                              UGX {lineTotal.toLocaleString()}
                            </span>
                          </div>

                          {/* Customizations tags with interactive remove options */}
                          <div className="space-y-1 text-[11px] bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-150/70 dark:border-zinc-800/80">
                            {item.choice && (
                              <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                                <span>• Choice: {item.choice.choice_name}</span>
                                {item.choice.price > 0 && <span className="font-semibold text-zinc-900 dark:text-zinc-100">+UGX {item.choice.price.toLocaleString()}</span>}
                              </div>
                            )}

                            {item.accompaniment && (
                              <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => removeAccompanimentFromCartItem(item.cart_id)}
                                    className="text-zinc-400 hover:text-red-500 cursor-pointer"
                                    title="Remove side"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  <span>• Side: {item.accompaniment.accompaniment_name}</span>
                                </div>
                                {item.accompaniment.price > 0 && <span className="font-semibold text-zinc-900 dark:text-zinc-100">+UGX {item.accompaniment.price.toLocaleString()}</span>}
                              </div>
                            )}

                            {item.extras.map(ex => (
                              <div key={ex.extra_id} className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => removeExtraFromCartItem(item.cart_id, ex.extra_id)}
                                    className="text-zinc-400 hover:text-red-500 cursor-pointer"
                                    title="Remove extra"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  <span>• Extra: {ex.extra_name} x{ex.quantity}</span>
                                </div>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">+UGX {(ex.price * ex.quantity).toLocaleString()}</span>
                              </div>
                            ))}

                            {item.special_notes && (
                              <div className="text-amber-600 dark:text-amber-400 font-medium italic pt-0.5">
                                Note: {item.special_notes}
                              </div>
                            )}
                          </div>

                          {/* Item Quantity and Actions */}
                          <div className="flex items-center justify-between pt-1">
                            {menuItemOriginal && (
                              <button
                                type="button"
                                onClick={() => startCustomizing(menuItemOriginal, item)}
                                className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="h-3 w-3" />
                                Edit Options
                              </button>
                            )}

                            <div className="flex items-center gap-2 ml-auto">
                              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.cart_id, -1)}
                                  className="h-6 w-6 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 cursor-pointer shadow-2xs"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-foreground">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.cart_id, 1)}
                                  className="h-6 w-6 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 cursor-pointer shadow-2xs"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item.cart_id)}
                                className="h-7 w-7 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/30 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Live Order Summary & Totals reflecting choices, accompaniments, and extras live */}
                <div className="pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800 space-y-2 shrink-0 bg-white dark:bg-zinc-900">
                  {(() => {
                    const baseItemsTotal = cartItems.reduce((acc, curr) => acc + (curr.base_price * curr.quantity), 0);
                    const choicesTotal = cartItems.reduce((acc, curr) => acc + ((curr.choice?.price || 0) * curr.quantity), 0);
                    const accompanimentsTotal = cartItems.reduce((acc, curr) => acc + ((curr.accompaniment?.price || 0) * curr.quantity), 0);
                    const extrasTotal = cartItems.reduce((acc, curr) => acc + (curr.extras.reduce((sum, ex) => sum + (ex.price * ex.quantity), 0) * curr.quantity), 0);

                    // If currently customizing a new dish (not editing existing in cart), reflect its totals live too!
                    const isNewDish = customizingItem && !customizingItem.existingCartId;
                    const pendingBase = isNewDish ? (customizingItem.item.priceUGX * customizingItem.quantity) : 0;
                    const pendingChoice = isNewDish ? ((customizingItem.choice?.price || 0) * customizingItem.quantity) : 0;
                    const pendingAccompaniment = isNewDish ? ((customizingItem.accompaniment?.price || 0) * customizingItem.quantity) : 0;
                    const pendingExtras = isNewDish ? (customizingItem.extras.reduce((sum, ex) => sum + (ex.price * ex.quantity), 0) * customizingItem.quantity) : 0;

                    const effectiveBaseTotal = baseItemsTotal + pendingBase;
                    const effectiveChoicesTotal = choicesTotal + pendingChoice;
                    const effectiveAccompanimentsTotal = accompanimentsTotal + pendingAccompaniment;
                    const effectiveExtrasTotal = extrasTotal + pendingExtras;
                    const effectiveCustomizationsTotal = effectiveChoicesTotal + effectiveAccompanimentsTotal + effectiveExtrasTotal;

                    const foodBeverageSubtotal = effectiveBaseTotal + effectiveCustomizationsTotal;
                    const deliveryFee = (orderType === 'Delivery' || orderType === 'Room Service') ? Number(deliveryCharge || 0) : 0;

                    const taxAmount = vatRate > 0 ? Math.round(foodBeverageSubtotal * (vatRate / (100 + vatRate))) : 0;
                    const netSubtotal = Math.max(0, foodBeverageSubtotal - taxAmount);
                    const grandTotal = foodBeverageSubtotal + deliveryFee;

                    return (
                      <>
                        {isNewDish && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Live preview includes active selection (+UGX {(pendingBase + pendingChoice + pendingAccompaniment + pendingExtras).toLocaleString()})</span>
                          </div>
                        )}

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 font-medium">
                            <span>Base Items Subtotal:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">UGX {effectiveBaseTotal.toLocaleString()}</span>
                          </div>

                          {/* Specific Customization Breakdowns */}
                          {effectiveChoicesTotal > 0 && (
                            <div className="flex justify-between items-center text-violet-600 dark:text-violet-400 text-[11px] font-medium pl-2">
                              <span>• Choice Adjustments:</span>
                              <span className="font-semibold">+UGX {effectiveChoicesTotal.toLocaleString()}</span>
                            </div>
                          )}

                          {effectiveAccompanimentsTotal > 0 && (
                            <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 text-[11px] font-medium pl-2">
                              <span>• Accompaniments (Sides):</span>
                              <span className="font-semibold">+UGX {effectiveAccompanimentsTotal.toLocaleString()}</span>
                            </div>
                          )}

                          {effectiveExtrasTotal > 0 && (
                            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 text-[11px] font-medium pl-2">
                              <span>• Extras & Add-ons:</span>
                              <span className="font-semibold">+UGX {effectiveExtrasTotal.toLocaleString()}</span>
                            </div>
                          )}

                          {effectiveCustomizationsTotal > 0 && (
                            <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10">
                              <span>Total Customizations:</span>
                              <span>+UGX {effectiveCustomizationsTotal.toLocaleString()}</span>
                            </div>
                          )}

                          {deliveryFee > 0 && (
                            <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 font-medium">
                              <span>{orderType === 'Room Service' ? 'Room Service Fee:' : 'Delivery Fee:'}</span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">+UGX {deliveryFee.toLocaleString()}</span>
                            </div>
                          )}

                          {taxAmount > 0 && (
                            <div className="flex justify-between items-center text-zinc-400 dark:text-zinc-500 text-[11px]">
                              <span>VAT ({vatRate}% inclusive):</span>
                              <span>UGX {taxAmount.toLocaleString()}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-zinc-400 dark:text-zinc-500 text-[11px]">
                            <span>Net Subtotal:</span>
                            <span>UGX {netSubtotal.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Grand Total Bar */}
                        <div className="p-3 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Total Payable</span>
                            <span className="text-base font-extrabold text-[#D4AF37]">
                              UGX {grandTotal.toLocaleString()}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                            {cartItems.reduce((acc, c) => acc + c.quantity, 0) + (isNewDish ? customizingItem.quantity : 0)} Items
                          </span>
                        </div>

                        {/* Place Order Primary Action Button */}
                        <Button
                          type="button"
                          disabled={cartItems.length === 0 || isSubmittingOrder}
                          onClick={handleCreateOrder}
                          className="w-full bg-[#0A2540]! text-[#D4AF37]! hover:bg-[#07192C]! border border-[#D4AF37]/30 dark:bg-[#D4AF37]! dark:text-[#0A192F]! dark:hover:bg-[#B89320]! rounded-2xl py-3 text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSubmittingOrder ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4AF37] dark:border-[#0A192F] border-t-transparent" />
                              <span>Submitting Ticket...</span>
                            </>
                          ) : (
                            <>
                              <Utensils className="h-4 w-4" />
                              <span>Place Order • UGX {grandTotal.toLocaleString()}</span>
                            </>
                          )}
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Ticket Details & Update Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 dark:bg-zinc-955/60 animate-fade-in backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl lg:max-w-3xl h-full bg-card dark:bg-zinc-900 border-l border-zinc-150/40 dark:border-zinc-800 shadow-2xl p-6 relative flex flex-col justify-between animate-slide-in overflow-hidden">
            {/* Header */}
            <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100/60 dark:border-zinc-800 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
                      Order Details & Ticket
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                      ID #{selectedOrder.orderId || selectedOrder.id}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Order Number: <span className="text-zinc-900 dark:text-zinc-200 font-mono">{selectedOrder.orderNumber}</span>
                    {selectedOrder.customerId && (
                      <span className="ml-3 text-zinc-500 dark:text-zinc-400 font-sans">
                        • Customer ID: <span className="text-zinc-800 dark:text-zinc-300 font-semibold">#{selectedOrder.customerId}</span>
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border ${getStatusColor(selectedOrder.status as any)}`}>
                    {selectedOrder.status}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setEditError(null);
                    }}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-100 rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {editError && (
                <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-955/20 p-3.5 rounded-xl border border-red-150/50 dark:border-red-900/50 flex items-center gap-2 shrink-0">
                  ⚠️ {editError}
                </div>
              )}

              {/* Order Info Details - Scrollable content */}
              <div className="space-y-5 overflow-y-auto flex-1 pr-2">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/40 border border-zinc-150/50 dark:border-zinc-800/60 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Seating Location</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedOrder.seatingLocation || selectedOrder.table}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Delivery Option</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedOrder.deliveryOption}</span>
                  </div>

                  {(selectedOrder.deliveryOption !== 'Premises' || selectedOrder.table === 'For Delivery' || selectedOrder.deliveryLocation || selectedOrder.deliveryAddress) && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Delivery Location</span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                        {selectedOrder.deliveryLocation || selectedOrder.deliveryAddress || 'Not specified'}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Delivery Distance</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedOrder.deliveryDistanceKm ? `${selectedOrder.deliveryDistanceKm} km` : '0.00 km'}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Price per KM</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">UGX {Number(selectedOrder.pricePerKmUsed || 0).toLocaleString()}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Payment Status</span>
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-lg ${selectedOrder.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : selectedOrder.paymentStatus === 'Partially Paid'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Created At</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Updated At</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  {selectedOrder.cancelledAt && (
                    <div className="col-span-2 sm:col-span-3 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40">
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 mb-0.5">Cancelled Information</span>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        Cancelled on: {new Date(selectedOrder.cancelledAt).toLocaleString()}
                        {selectedOrder.cancelReason && ` — Reason: ${selectedOrder.cancelReason}`}
                      </p>
                    </div>
                  )}
                </div>

                {selectedOrder.specialInstr && (
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Special Instructions</span>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-650 dark:text-zinc-350 italic">
                      "{selectedOrder.specialInstr}"
                    </div>
                  </div>
                )}

                {/* Order Items Table */}
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Order Items ({selectedOrder.rawItems?.length || 0})</span>
                  <div className="border border-zinc-150/70 dark:border-zinc-800 rounded-2xl p-3.5 bg-zinc-50/20 dark:bg-zinc-955/10">
                    {(() => {
                      const deliveryFee = selectedOrder.deliveryCharge ?? 0;
                      const rawItemsTotal = selectedOrder.rawItems ? selectedOrder.rawItems.reduce((acc: number, it: any) => acc + Number(it.total_price || 0), 0) : 0;
                      const calculatedTotal = rawItemsTotal + deliveryFee;
                      const itemsTotal = rawItemsTotal;
                      const calculatedTax = vatRate > 0 ? Math.round(itemsTotal * (vatRate / (100 + vatRate))) : 0;
                      const calculatedSubTotal = Math.max(0, itemsTotal - calculatedTax);
                      const amountPaidVal = selectedOrder.amountPaid ?? 0;
                      const balanceDueVal = Math.max(0, calculatedTotal - amountPaidVal);

                      return (
                        <>
                          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {selectedOrder.rawItems.map((it: any, idx: number) => {
                              const itemName = it.menu_item?.name || `Item #${it.menu_item_id}`;
                              const unitPrice = Number(it.unit_price || it.menu_item?.price || 0);
                              const itemLineTotal = Number(it.total_price || (unitPrice * (it.quantity || 1)));
                              const choiceName = it.choice?.choice_name || it.choice?.name;
                              const choicePrice = it.choice?.price ? Number(it.choice.price) : 0;
                              const accomName = it.accompaniment?.accompaniment_name || it.accompaniment?.name;
                              const accomPrice = it.accompaniment?.price ? Number(it.accompaniment.price) : 0;
                              const itemExtras = it.extras || [];
                              const specialNotes = it.special_notes ? String(it.special_notes).trim() : null;

                              return (
                                <div key={it.order_item_id || `${it.menu_item_id}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                                  {/* Main item line */}
                                  <div className="flex justify-between items-start text-xs">
                                    <div>
                                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                        {it.quantity}x {itemName}
                                      </span>
                                      {unitPrice > 0 && (
                                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-2">
                                          @ UGX {unitPrice.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-zinc-900 dark:text-zinc-150 font-bold shrink-0">
                                      UGX {itemLineTotal.toLocaleString()}
                                    </span>
                                  </div>

                                  {/* Option details */}
                                  {(choiceName || accomName || itemExtras.length > 0 || specialNotes) && (
                                    <div className="pl-4 space-y-1 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                                      {choiceName && (
                                        <div className="flex justify-between items-center">
                                          <span>• Choice: {choiceName}</span>
                                          {choicePrice > 0 && <span>+UGX {choicePrice.toLocaleString()}</span>}
                                        </div>
                                      )}
                                      {accomName && (
                                        <div className="flex justify-between items-center">
                                          <span>• Side: {accomName}</span>
                                          {accomPrice > 0 && <span>+UGX {accomPrice.toLocaleString()}</span>}
                                        </div>
                                      )}
                                      {itemExtras.map((ex: any) => {
                                        const exName = ex.extra?.extra_name || ex.extra_name || `Extra #${ex.extra_id}`;
                                        return (
                                          <div key={ex.order_item_extra_id || ex.extra_id} className="flex justify-between items-center">
                                            <span>• Add-on: {exName} x{ex.quantity || 1}</span>
                                            <span>+UGX {Number(ex.total_price || ex.price || 0).toLocaleString()}</span>
                                          </div>
                                        );
                                      })}
                                      {specialNotes && (
                                        <div className="text-amber-600 dark:text-amber-400 font-medium italic">
                                          Note: {specialNotes.replace(/^Note:\s*/i, '')}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Financial Summary */}
                          <div className="pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-3 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 font-semibold">
                              <span>Subtotal</span>
                              <span>UGX {calculatedSubTotal.toLocaleString()}</span>
                            </div>

                            {deliveryFee > 0 && (
                              <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 font-semibold">
                                <span>Delivery / Service Charge</span>
                                <span>UGX {deliveryFee.toLocaleString()}</span>
                              </div>
                            )}

                            {calculatedTax > 0 && (
                              <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 font-semibold">
                                <span>Tax / VAT ({vatRate}%)</span>
                                <span>UGX {calculatedTax.toLocaleString()}</span>
                              </div>
                            )}

                            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center font-bold text-sm">
                              <span className="text-zinc-900 dark:text-zinc-150 uppercase tracking-wider text-[10px]">Total Amount</span>
                              <span className="text-violet-600 dark:text-violet-400 font-extrabold text-base">UGX {calculatedTotal.toLocaleString()}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800/60 text-xs">
                              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800">
                                <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Amount Paid</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">UGX {amountPaidVal.toLocaleString()}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800">
                                <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Balance Due</span>
                                <span className={`font-bold text-sm ${balanceDueVal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                  UGX {balanceDueVal.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Status & Payment Adjustments */}
                <div className="border-t border-zinc-100/60 dark:border-zinc-800 pt-4 space-y-3">
                  <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Status & Payment Adjustments</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Ticket Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-500 cursor-pointer font-bold"
                      >
                        <option value="Pending" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Pending</option>
                        <option value="Preparing" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Preparing</option>
                        <option value="Ready" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Ready</option>
                        <option value="Completed" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Completed</option>
                        <option value="Cancelled" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Payment Status</label>
                      <select
                        value={editPaymentStatus}
                        onChange={(e) => setEditPaymentStatus(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-500 cursor-pointer font-bold"
                      >
                        <option value="Pending" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Pending</option>
                        <option value="Partially Paid" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Partially Paid</option>
                        <option value="Paid" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Paid</option>
                      </select>
                    </div>
                  </div>

                  {/* Add Balance Payment / New Payment Extra Field */}
                  {selectedOrder && (
                    <div className="p-3 bg-zinc-50/90 dark:bg-zinc-950/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 font-sans">
                          Add Balance Payment / New Payment (UGX)
                        </label>
                        {Math.max(0, (selectedOrder.totalAmount || selectedOrder.value) - selectedOrder.amountPaid) > 0 && (
                          <button
                            type="button"
                            onClick={handleSettleFullBalance}
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20"
                          >
                            Pay Full Balance (UGX {Math.max(0, (selectedOrder.totalAmount || selectedOrder.value) - selectedOrder.amountPaid).toLocaleString()})
                          </button>
                        )}
                      </div>

                      <input
                        type="number"
                        step="0.01"
                        placeholder={`Enter newly added balance payment (e.g. ${(Math.max(0, (selectedOrder.totalAmount || selectedOrder.value) - selectedOrder.amountPaid)).toFixed(2)})`}
                        value={addBalanceAmount}
                        onChange={(e) => handleAddBalanceChange(e.target.value)}
                        className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-amber-500 dark:focus:border-amber-500 font-bold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Total Amount Paid (UGX)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 110157.43"
                      value={editAmountPaid}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditAmountPaid(val);
                        if (selectedOrder) {
                          const total = selectedOrder.totalAmount ?? selectedOrder.value ?? 0;
                          const remaining = Math.max(0, total - val);
                          if (remaining <= 0.01 && val > 0) {
                            setEditPaymentStatus('Paid');
                          } else if (val > 0 && remaining > 0.01) {
                            setEditPaymentStatus('Partially Paid');
                          } else {
                            setEditPaymentStatus('Pending');
                          }
                        }
                      }}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-500 font-bold"
                    />
                    {selectedOrder && (
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-bold">
                        Recalculated Balance Due: <span className={Math.max(0, (selectedOrder.totalAmount || selectedOrder.value) - editAmountPaid) <= 0.01 ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-amber-600 dark:text-amber-400"}>
                          UGX {Math.max(0, (selectedOrder.totalAmount || selectedOrder.value) - editAmountPaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="border-t border-zinc-100/60 dark:border-zinc-800 pt-4 mt-3 flex flex-col gap-2.5 shrink-0">
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedOrder(null);
                    setEditError(null);
                  }}
                  className="flex-1 bg-[#D4AF37]! text-[#0A192F]! hover:bg-[#B89320]! dark:bg-[#D4AF37]! dark:text-[#0A192F]! dark:hover:bg-[#B89320]! text-xs font-bold py-2.5 rounded-xl border border-[#D4AF37]/30 cursor-pointer h-10 shadow-sm"
                >
                  Close
                </Button>
                <Button
                  onClick={handleUpdateOrder}
                  className="flex-1 bg-[#0A2540]! text-[#D4AF37]! hover:bg-[#07192C]! border border-[#D4AF37]/30 dark:bg-[#D4AF37]! dark:text-[#0A192F]! dark:hover:bg-[#B89320]! rounded-xl text-xs font-bold py-2.5 shadow-sm cursor-pointer h-10"
                >
                  Save Ticket Changes
                </Button>
              </div>

              {selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to cancel Order ${selectedOrder.orderNumber}?`)) {
                      try {
                        await cancelRestaurantOrder(selectedOrder.id);
                        setSelectedOrder(null);
                      } catch (err: any) {
                        setEditError(err.message || 'Failed to cancel order');
                      }
                    }
                  }}
                  className="w-full text-center text-xs font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-50/50 dark:bg-red-955/20 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/40 dark:border-red-900/50 rounded-xl py-2.5 transition-colors cursor-pointer"
                >
                  Cancel Order Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Orders;
