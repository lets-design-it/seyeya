import React, { useState } from 'react';
import { useRestaurant, RestaurantOrder, MenuItem } from '../../hooks/useRestaurant';
import { useVatRate } from '../../context/VatContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
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
  Filter
} from 'lucide-react';

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

  // Create Order form states
  const [table, setTable] = useState('Table 1');
  const [customTable, setCustomTable] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('Premises');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstr, setSpecialInstr] = useState('');
  const [cartItems, setCartItems] = useState<{ menu_item_id: number; quantity: number; name: string; price: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

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

  // Cart operations
  const addToCart = (item: MenuItem) => {
    const itemId = parseInt(item.id);
    const existing = cartItems.find(c => c.menu_item_id === itemId);
    if (existing) {
      setCartItems(cartItems.map(c => c.menu_item_id === itemId ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCartItems([...cartItems, {
        menu_item_id: itemId,
        quantity: 1,
        name: item.name,
        price: item.priceUGX
      }]);
    }
  };

  const removeFromCart = (itemId: number) => {
    const existing = cartItems.find(c => c.menu_item_id === itemId);
    if (existing && existing.quantity > 1) {
      setCartItems(cartItems.map(c => c.menu_item_id === itemId ? { ...c, quantity: c.quantity - 1 } : c));
    } else {
      setCartItems(cartItems.filter(c => c.menu_item_id !== itemId));
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (cartItems.length === 0) {
      setCreateError("Please select at least one menu item.");
      return;
    }

    const finalTable = deliveryOption === 'Delivery'
      ? 'Delivery'
      : (table === 'Other' ? customTable.trim() : table);

    if (deliveryOption === 'Premises' && !finalTable) {
      setCreateError("Please specify a seating table location.");
      return;
    }

    const payload = {
      seating_location: finalTable || null,
      delivery_option: deliveryOption,
      delivery_address: deliveryOption === 'Delivery' ? deliveryAddress.trim() : null,
      special_instr: specialInstr.trim() || null,
      items: cartItems.map(c => ({
        menu_item_id: c.menu_item_id,
        quantity: c.quantity
      }))
    };

    try {
      await createRestaurantOrder(payload);
      setIsCreateOpen(false);
      // Reset form
      setTable('Table 1');
      setCustomTable('');
      setDeliveryOption('Premises');
      setDeliveryAddress('');
      setSpecialInstr('');
      setCartItems([]);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create order');
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
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  sortOrder === 'newest'
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
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  sortOrder === 'oldest'
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
              <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Completed Orders History</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Archived list of culinary tickets completed more than 30 minutes ago.</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search history by order, table..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-zinc-955 border border-zinc-150/40 dark:border-zinc-850 px-3.5 py-2 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-650 font-semibold shadow-2xs"
              />
            </div>
          </div>

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
                        No completed orders in archive history.
                      </td>
                    </tr>
                  ) : (
                    archivedOrders.map((order) => {
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
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                              order.paymentStatus === 'Paid' 
                                ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' 
                                : 'border-amber-500/20 text-amber-600 bg-amber-500/5'
                            }`}>
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
        </div>
      )}

      {/* Create Order Modal */}

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-zinc-955/60 animate-fade-in backdrop-blur-md">
          <div className="glass-panel w-full max-w-4xl bg-card dark:bg-zinc-900 border border-zinc-150/40 dark:border-zinc-800 rounded-[24px] p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-zinc-100/60 dark:border-zinc-800 shrink-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
                Create New Restaurant Order
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setCreateError(null);
                  setCartItems([]);
                }}
                className="text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-100 rounded-lg p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-955/20 p-3.5 rounded-xl border border-red-150/50 dark:border-red-900/50 flex items-center gap-2 shrink-0">
                ⚠️ {createError}
              </div>
            )}

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
              {/* Left Column: Order Settings */}
              <form onSubmit={handleCreateOrder} className="md:col-span-5 space-y-4 overflow-y-auto pr-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 mb-1.5">Delivery Option</label>
                  <select
                    value={deliveryOption}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 px-3 py-2.5 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-650 cursor-pointer font-semibold"
                  >
                    <option value="Premises" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Eat-in (Premises)</option>
                    <option value="Delivery" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Room Service / Delivery</option>
                  </select>
                </div>

                {deliveryOption === 'Premises' ? (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 mb-1.5">Seating Table</label>
                      <select
                        value={table}
                        onChange={(e) => setTable(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 px-3 py-2.5 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-650 cursor-pointer font-semibold"
                      >
                        {Array.from({ length: 12 }, (_, i) => `Table ${i + 1}`).map(t => (
                          <option key={t} value={t} className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">{t}</option>
                        ))}
                        <option value="Other" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Other / Custom</option>
                      </select>
                    </div>

                    {table === 'Other' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 mb-1.5">Custom Table Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lounge Area 4"
                          value={customTable}
                          onChange={(e) => setCustomTable(e.target.value)}
                          className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-850 px-3 py-2.5 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-650 font-semibold"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 mb-1.5">Delivery Address / Room Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Room 204 or Conference Hall A"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-850 px-3 py-2.5 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-650 font-semibold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 mb-1.5">Special Instructions</label>
                  <textarea
                    placeholder="e.g. Extra spicy, allergens: peanuts, no salt on fries..."
                    value={specialInstr}
                    onChange={(e) => setSpecialInstr(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-850 px-3 py-2.5 text-xs text-foreground dark:text-zinc-150 outline-none focus:border-violet-500 dark:focus:border-violet-650 h-20 resize-none font-medium"
                  />
                </div>

                 <div className="pt-4 border-t border-zinc-100/60 dark:border-zinc-800 flex items-center justify-between">
                  <div className="space-y-1">
                    {(() => {
                      const cartEstTotal = cartItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                      const cartTax = vatRate > 0 ? Math.round(cartEstTotal * (vatRate / (100 + vatRate))) : 0;
                      const cartSubTotal = cartEstTotal - cartTax;
                      return (
                        <>
                          <div className="flex gap-4 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                            <div>Subtotal (Net): <span className="text-zinc-600 dark:text-zinc-300">UGX {cartSubTotal.toLocaleString()}</span></div>
                            {vatRate > 0 && (
                              <div>VAT ({vatRate}% incl.): <span className="text-zinc-600 dark:text-zinc-300">UGX {cartTax.toLocaleString()}</span></div>
                            )}
                          </div>
                          <p className="text-xs font-bold text-violet-550 dark:text-violet-400">
                            Estimated Total: UGX {cartEstTotal.toLocaleString()}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                  <Button
                    type="submit"
                    className="bg-[#0A2540]! text-[#D4AF37]! hover:bg-[#07192C]! border border-[#D4AF37]/30 dark:bg-[#D4AF37]! dark:text-[#0A192F]! dark:hover:bg-[#B89320]! rounded-full px-6 py-2.5 text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Place Order
                  </Button>
                </div>
              </form>

              {/* Right Column: Menu Selector & Order Summary */}
              <div className="md:col-span-7 flex flex-col min-h-0 border-l border-zinc-100/60 dark:border-zinc-800 pl-6">
                <div className="mb-4 shrink-0">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-405 mb-1.5">Search Menu Items</label>
                  <input
                    type="text"
                    placeholder="Search by food name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-850 px-3 py-2.5 text-xs text-foreground dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-650 font-semibold"
                  />
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left inner pane: Menu search results */}
                  <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3 flex flex-col min-h-0 bg-white dark:bg-zinc-900">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Select Dish</h4>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {menu
                        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) && item.is_available !== false)
                        .map(item => (
                          <div
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-violet-450 dark:hover:border-violet-500 cursor-pointer transition-colors flex items-center justify-between gap-2 bg-zinc-50/10 dark:bg-zinc-950/20"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug">{item.name}</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">UGX {item.priceUGX.toLocaleString()}</p>
                            </div>
                            <span className="text-xs font-bold text-violet-550 dark:text-violet-400 bg-violet-50 dark:bg-violet-955/20 border border-violet-100/40 dark:border-violet-900/50 px-2 py-0.5 rounded-lg shrink-0">
                              + Add
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right inner pane: Order items in cart */}
                  <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3 flex flex-col min-h-0 bg-zinc-50/20 dark:bg-zinc-955/10">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Order Items</h4>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <ShoppingBag className="h-6 w-6 text-zinc-300 dark:text-zinc-650 mb-2" />
                          <p className="text-[10px] text-zinc-405 font-bold uppercase tracking-wider">Empty Order Cart</p>
                        </div>
                      ) : (
                        cartItems.map(item => (
                          <div
                            key={item.menu_item_id}
                            className="p-2 rounded-xl border border-zinc-100/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug">{item.name}</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold mt-0.5">UGX {(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.menu_item_id)}
                                className="w-5 h-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 min-w-[12px] text-center font-sans">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart({ id: String(item.menu_item_id), name: item.name, priceUGX: item.price } as MenuItem)}
                                className="w-5 h-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
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
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-lg ${
                      selectedOrder.paymentStatus === 'Paid'
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
