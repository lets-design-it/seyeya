import React from 'react';
import { useRestaurant, RestaurantOrder } from '../../hooks/useRestaurant';
import { Card } from '../../components/Card';
import { ShoppingBag, ChevronRight, Clock, ChefHat, CheckSquare } from 'lucide-react';

const COLUMNS: RestaurantOrder['status'][] = ['Pending', 'Preparing', 'Ready', 'Completed'];

export const Orders: React.FC = () => {
  const { orders, updateOrderStatus } = useRestaurant();

  const getStatusColor = (status: RestaurantOrder['status']) => {
    switch (status) {
      case 'Pending': return 'border-amber-500/20 text-amber-400 bg-amber-500/5';
      case 'Preparing': return 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5';
      case 'Ready': return 'border-emerald-500/20 text-emerald-450 bg-emerald-500/5';
      case 'Completed': return 'border-zinc-800 text-zinc-550 bg-zinc-950/20';
    }
  };

  const getNextStatus = (current: RestaurantOrder['status']): RestaurantOrder['status'] | null => {
    if (current === 'Pending') return 'Preparing';
    if (current === 'Preparing') return 'Ready';
    if (current === 'Ready') return 'Completed';
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-full min-h-[82vh]">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Kitchen & Restaurant Queue</h3>
          <p className="text-xs text-zinc-400">Monitor and progress culinary ticket orders submitted by guests.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-900 rounded-2xl px-4 py-2 text-xs font-semibold text-zinc-350">
          <ChefHat className="h-4 w-4 text-violet-400" />
          <span>Active Tickets: {orders.filter(o => o.status !== 'Completed').length}</span>
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
                className="flex-1 min-w-[220px] bg-zinc-950/25 border border-zinc-900/60 rounded-2xl p-3 flex flex-col max-h-[70vh]"
              >
                {/* Column Title */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-900 shrink-0">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">{col}</span>
                  <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${getStatusColor(col)}`}>
                    {columnOrders.length}
                  </span>
                </div>

                {/* Tickets list */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
                  {columnOrders.length === 0 ? (
                    <div className="h-16 flex items-center justify-center rounded-xl border border-dashed border-zinc-900 text-[10px] text-zinc-650 text-center font-medium">
                      No tickets
                    </div>
                  ) : (
                    columnOrders.map((order) => {
                      const next = getNextStatus(order.status);
                      return (
                        <Card 
                          key={order.id} 
                          variant="glass" 
                          className="p-3.5 shadow-md flex flex-col gap-2.5 hover:border-zinc-800 transition-colors group"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-bold text-violet-400 leading-none">{order.table}</span>
                            <span className="text-[10px] text-zinc-300 font-semibold">
                              UGX {order.value.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-normal font-medium">
                            {order.items}
                          </p>

                          {/* Footer with actions */}
                          <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2.5 mt-0.5 shrink-0">
                            <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-semibold">
                              <Clock className="h-3 w-3 text-zinc-650" />
                              <span>{order.timestamp}</span>
                            </div>

                            {/* Ticket Shift Button */}
                            {next && (
                              <button
                                onClick={() => updateOrderStatus(order.id, next)}
                                className="flex items-center gap-1 rounded-lg bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600 hover:text-white px-2 py-1 text-[9px] font-bold text-violet-400 transition-colors focus:outline-none"
                              >
                                <span>{next}</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}

                            {order.status === 'Completed' && (
                              <CheckSquare className="h-3.5 w-3.5 text-zinc-600" />
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
    </div>
  );
};
export default Orders;
