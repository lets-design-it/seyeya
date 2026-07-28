import React, { useState } from 'react';
import { useRestaurant, RestaurantOrder, MenuItem } from '../../hooks/useRestaurant';
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
  DollarSign
} from 'lucide-react';

const COLUMNS: RestaurantOrder['status'][] = ['Pending', 'Preparing', 'Ready', 'Completed'];

export const Orders: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    menu,
    createRestaurantOrder,
    updateRestaurantOrder,
    cancelRestaurantOrder
  } = useRestaurant();

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
  const [editError, setEditError] = useState<string | null>(null);

  const getStatusColor = (status: RestaurantOrder['status']) => {
    switch (status) {
      case 'Pending': return 'border-amber-500/20 text-amber-400 bg-amber-500/5';
      case 'Preparing': return 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5';
      case 'Ready': return 'border-emerald-500/20 text-emerald-450 bg-emerald-500/5';
      case 'Completed': return 'border-zinc-800 text-zinc-550 bg-zinc-50';
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
      await updateRestaurantOrder(selectedOrder.id, {
        order_status: editStatus,
        payment_status: editPaymentStatus,
        amount_paid: Number(editAmountPaid)
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
    setEditError(null);
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-full min-h-[82vh]">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-dark tracking-tight">Orders</h3>
          <p className="text-xs text-zinc-550">Monitor and progress culinary ticket orders submitted by guests.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-zinc-800 text-white rounded-full px-5 py-2.5 text-xs font-bold shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create New Order
          </Button>
          <div className="flex items-center gap-2 bg-zinc-100 rounded-2xl px-4 py-2.5 text-xs font-semibold text-foreground">
            <ChefHat className="h-4 w-4 text-violet-450" />
            <span>Active Tickets: {orders.filter(o => o.status !== 'Completed').length}</span>
          </div>
        </div>
      </div>

      {/* Kanban Board columns */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[950px] h-full items-start">
          {COLUMNS.map((col) => {
            const columnOrders = orders.filter(o => o.status === col);
            return (
              <div
                key={col}
                className="flex-1 min-w-[220px] bg-zinc-50 rounded-2xl p-3 flex flex-col max-h-[70vh]"
              >
                {/* Column Title */}
                <div className="flex items-center justify-between pb-2 mb-3 shrink-0">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">{col}</span>
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getStatusColor(col)}`}>
                    {columnOrders.length}
                  </span>
                </div>

                {/* Tickets list */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
                  {columnOrders.length === 0 ? (
                    <div className="h-16 flex items-center justify-center rounded-xl border border-dashed border-zinc-200 text-xs text-zinc-400 text-center font-medium">
                      No tickets
                    </div>
                  ) : (
                    columnOrders.map((order) => {
                      const next = getNextStatus(order.status);
                      return (
                        <Card
                          key={order.id}
                          variant="glass"
                          className="p-3.5 shadow-md flex flex-col gap-2.5 hover:border-zinc-800 transition-colors group cursor-pointer"
                          onClick={() => openDetails(order)}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-bold text-violet-500 leading-none">{order.table}</span>
                            <span className="text-xs text-foreground font-semibold">
                              UGX {order.value.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-foreground leading-normal font-medium line-clamp-2">
                            {order.items}
                          </p>

                          {/* Footer with actions */}
                          <div className="flex items-center justify-between pt-2.5 mt-0.5 shrink-0 border-t border-zinc-100/50">
                            <div className="flex items-center gap-1 text-xs text-zinc-450 font-medium">
                              <Clock className="h-3 w-3 text-zinc-400" />
                              <span>{order.timestamp}</span>
                            </div>

                            {/* Ticket Shift Button */}
                            {next && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderStatus(order.id, next);
                                }}
                                className="flex items-center gap-1 rounded-lg bg-violet-600/10 border border-violet-500/20 hover:bg-violet-650 hover:text-white px-2 py-1 text-[10px] font-bold text-violet-550 transition-colors focus:outline-none cursor-pointer"
                              >
                                <span>{next}</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}

                            {order.status === 'Completed' && (
                              <CheckSquare className="h-3.5 w-3.5 text-zinc-455" />
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

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 animate-fade-in backdrop-blur-sm">
          <div className="glass-panel w-full max-w-4xl bg-card rounded-[24px] p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-zinc-100/60 shrink-0">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                Create New Restaurant Order
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setCreateError(null);
                  setCartItems([]);
                }}
                className="text-zinc-500 hover:text-foreground rounded-lg p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-150/50 flex items-center gap-2 shrink-0">
                ⚠️ {createError}
              </div>
            )}

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
              {/* Left Column: Order Settings */}
              <form onSubmit={handleCreateOrder} className="md:col-span-5 space-y-4 overflow-y-auto pr-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Delivery Option</label>
                  <select
                    value={deliveryOption}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="Premises">Eat-in (Premises)</option>
                    <option value="Delivery">Room Service / Delivery</option>
                  </select>
                </div>

                {deliveryOption === 'Premises' ? (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Seating Table</label>
                      <select
                        value={table}
                        onChange={(e) => setTable(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) => `Table ${i + 1}`).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="Other">Other / Custom</option>
                      </select>
                    </div>

                    {table === 'Other' && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Custom Table Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lounge Area 4"
                          value={customTable}
                          onChange={(e) => setCustomTable(e.target.value)}
                          className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Delivery Address / Room Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Room 204 or Conference Hall A"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Special Instructions</label>
                  <textarea
                    placeholder="e.g. Extra spicy, allergens: peanuts, no salt on fries..."
                    value={specialInstr}
                    onChange={(e) => setSpecialInstr(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500 h-20 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-100/60 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Running Total</p>
                    <p className="text-sm font-bold text-violet-500">
                      UGX {cartItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-zinc-800 text-white rounded-full px-6 py-2.5 text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Place Order
                  </Button>
                </div>
              </form>

              {/* Right Column: Menu Selector & Order Summary */}
              <div className="md:col-span-7 flex flex-col min-h-0 border-l border-zinc-100/60 pl-6">
                <div className="mb-4 shrink-0">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Search Menu Items</label>
                  <input
                    type="text"
                    placeholder="Search by food name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-xs text-foreground outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left inner pane: Menu search results */}
                  <div className="border border-zinc-100 rounded-2xl p-3 flex flex-col min-h-0">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Select Dish</h4>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {menu
                        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) && item.is_available !== false)
                        .map(item => (
                          <div
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="p-2 rounded-xl border border-zinc-100 hover:border-violet-400 cursor-pointer transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-foreground truncate leading-snug">{item.name}</p>
                              <p className="text-[10px] text-zinc-450 font-bold">UGX {item.priceUGX.toLocaleString()}</p>
                            </div>
                            <span className="text-xs font-bold text-violet-550 bg-violet-50 px-2 py-0.5 rounded-lg shrink-0">
                              + Add
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right inner pane: Order items in cart */}
                  <div className="border border-zinc-100 rounded-2xl p-3 flex flex-col min-h-0 bg-zinc-50/20">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Order Items</h4>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <ShoppingBag className="h-6 w-6 text-zinc-300 mb-2" />
                          <p className="text-[10px] text-zinc-405 font-bold uppercase tracking-wider">Empty Order Cart</p>
                        </div>
                      ) : (
                        cartItems.map(item => (
                          <div
                            key={item.menu_item_id}
                            className="p-2 rounded-xl border border-zinc-100/60 bg-white flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-foreground truncate leading-snug">{item.name}</p>
                              <p className="text-[10px] text-zinc-450 font-bold mt-0.5">UGX {(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.menu_item_id)}
                                className="w-5 h-5 rounded-lg border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500 hover:bg-zinc-50 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-foreground min-w-[12px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart({ id: String(item.menu_item_id), name: item.name, priceUGX: item.price } as MenuItem)}
                                className="w-5 h-5 rounded-lg border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500 hover:bg-zinc-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-zinc-950/40 animate-fade-in backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md h-full bg-card shadow-2xl p-6 relative flex flex-col justify-between animate-slide-in">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-zinc-100/60">
                <div>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                    Ticket Details
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mt-0.5">
                    Order Number: {selectedOrder.orderNumber}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setEditError(null);
                  }}
                  className="text-zinc-500 hover:text-foreground rounded-lg p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {editError && (
                <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-150/50 flex items-center gap-2 shrink-0">
                  ⚠️ {editError}
                </div>
              )}

              {/* Order Info Details */}
              <div className="space-y-4.5 overflow-y-auto max-h-[60vh] pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Seating Table</span>
                    <span className="text-xs font-bold text-foreground">{selectedOrder.table}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Delivery Option</span>
                    <span className="text-xs font-bold text-foreground">{selectedOrder.deliveryOption}</span>
                  </div>
                </div>

                {selectedOrder.deliveryOption === 'Delivery' && selectedOrder.deliveryAddress && (
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Room / Address</span>
                    <p className="text-xs font-medium text-foreground">{selectedOrder.deliveryAddress}</p>
                  </div>
                )}

                {selectedOrder.specialInstr && (
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Special Instructions</span>
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-600 italic">
                      "{selectedOrder.specialInstr}"
                    </div>
                  </div>
                )}

                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-2">Order Items</span>
                  <div className="space-y-2 border border-zinc-100 rounded-2xl p-3 bg-zinc-50/20">
                    {selectedOrder.rawItems.map((it: any) => {
                      const itemName = it.menu_item?.item_name || `Item #${it.menu_item_id}`;
                      const price = Number(it.menu_item?.price || 0);
                      return (
                        <div key={it.order_item_id || it.menu_item_id} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-foreground">
                            {it.quantity}x {itemName}
                          </span>
                          <span className="text-zinc-500 font-bold">
                            UGX {(price * it.quantity).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-dashed border-zinc-200 mt-2 flex justify-between items-center text-xs font-bold">
                      <span className="text-foreground uppercase tracking-wider text-[10px]">Total Order Amount</span>
                      <span className="text-violet-550 font-bold">UGX {selectedOrder.value.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100/60 pt-4 space-y-4">
                  <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Status & Payment Adjustments</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1.5">Ticket Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer font-bold"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1.5">Payment Status</label>
                      <select
                        value={editPaymentStatus}
                        onChange={(e) => setEditPaymentStatus(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer font-bold"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1.5">Amount Paid (UGX)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={editAmountPaid}
                      onChange={(e) => setEditAmountPaid(Number(e.target.value))}
                      className="w-full rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2 text-xs text-foreground outline-none focus:border-violet-500 font-bold"
                    />
                    {selectedOrder && (
                      <p className="text-[10px] text-zinc-450 mt-1 font-bold">
                        Balance Due: UGX {Math.max(0, selectedOrder.value - editAmountPaid).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="border-t border-zinc-100/60 pt-4 flex flex-col gap-2.5 shrink-0">
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedOrder(null);
                    setEditError(null);
                  }}
                  className="flex-1 bg-transparent hover:bg-zinc-100 text-zinc-500 text-xs font-semibold py-2.5"
                >
                  Close
                </Button>
                <Button
                  onClick={handleUpdateOrder}
                  className="flex-1 bg-primary hover:bg-zinc-800 text-white rounded-full text-xs font-bold py-2.5 shadow-sm cursor-pointer"
                >
                  Save Ticket Changes
                </Button>
              </div>

              {selectedOrder.status !== 'Completed' && (
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
                  className="w-full text-center text-xs font-bold text-red-500 hover:text-red-700 bg-red-50/50 hover:bg-red-50 border border-red-200/40 rounded-xl py-2.5 transition-colors cursor-pointer"
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
