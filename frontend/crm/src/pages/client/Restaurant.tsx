import React, { useState, useMemo } from 'react';
import { useRestaurant, MenuItem } from '../../hooks/useRestaurant';
import { useVatRate } from '../../context/VatContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Search, ShoppingBag, Plus, Minus, X, CheckCircle } from 'lucide-react';

export const Restaurant: React.FC = () => {
  const { vatRate } = useVatRate();
  const { menu, placeOrder, categories } = useRestaurant();
  
  // Search & Category states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Cart states
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [tableNumber, setTableNumber] = useState('Table 1');
  const [isSuccess, setIsSuccess] = useState(false);

  const categoryList = useMemo(() => {
    return ['All', ...categories.map((c: any) => c.category_name)];
  }, [categories]);

  // Filter menu items
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [menu, search, selectedCategory]);

  // Cart operations
  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[itemId] > 1) {
        updated[itemId] -= 1;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const cartTotal = useMemo(() => {
    let totalUGX = 0;
    let totalUSD = 0;
    
    Object.entries(cart).forEach(([itemId, qty]) => {
      const item = menu.find(m => m.id === itemId);
      if (item) {
        totalUGX += item.priceUGX * qty;
        totalUSD += item.priceUSD * qty;
      }
    });

    return { ugx: totalUGX, usd: totalUSD };
  }, [cart, menu]);

  const cartItemsCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItemsCount === 0) return;

    try {
      // Place order
      await placeOrder(cart, tableNumber);

      // Show success overlay
      setCart({});
      setShowCart(false);
      setIsSuccess(true);
    } catch (err) {
      console.error("Failed to checkout:", err);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in relative pb-16 font-sans">
      
      {/* Category Horizontal list */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-4 px-4 scrollbar-none shrink-0">
        {categoryList.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20'
                : 'bg-zinc-100  text-zinc-450 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredMenu.map((item) => (
          <Card key={item.id} variant="glass" className="p-3.5 flex gap-3.5 hover:border-zinc-800 transition-colors">
            {/* Food Image */}
            <img 
              src={item.image} 
              alt={item.name} 
              className="h-16 w-16 rounded-xl object-cover  shrink-0" 
            />
            
            {/* Food Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-100 truncate leading-tight">{item.name}</h4>
                <p className="text-xs text-zinc-500 mt-1 leading-normal line-clamp-2">{item.description}</p>
              </div>

              <div className="flex items-center justify-between mt-2.5">
                <span className="text-xs font-semibold text-violet-400">
                  UGX {item.priceUGX.toLocaleString()} / ${item.priceUSD}
                </span>

                <Button 
                  onClick={() => addToCart(item.id)}
                  size="sm"
                  className="rounded-lg h-7 w-7 p-0 flex items-center justify-center"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card/75 backdrop-blur-md animate-fade-in">
          <div className="glass-panel glass-card-glow rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl ">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-450 animate-bounce">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Order Dispatched</h3>
            <p className="mt-2 text-xs text-zinc-550">
              Your ticket has been sent to the kitchen. Chef has received the order and is preparing.
            </p>
            <Button 
              onClick={() => setIsSuccess(false)}
              className="w-full mt-6"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-30">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-600 to-indigo-650 px-4.5 py-3 text-xs font-bold text-white shadow-xl hover:from-violet-500 hover:to-indigo-550 transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4.5 w-4.5" />
              <span>{cartItemsCount} Items Selected</span>
            </div>
            <span>View Cart (UGX {cartTotal.ugx.toLocaleString()})</span>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {showCart && (
        <div className="fixed inset-0 z-40 bg-card/70 backdrop-blur-sm animate-fade-in flex items-end justify-center">
          <div className="glass-panel w-full sm:max-w-md bg-card  rounded-t-3xl max-h-[75vh] flex flex-col justify-between p-5 shadow-2xl">
            {/* Cart Header */}
            <div className="flex items-center justify-between  pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-violet-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Your Basket</h3>
              </div>
              <button 
                onClick={() => setShowCart(false)}
                className="text-zinc-500 hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
              {Object.entries(cart).map(([itemId, qty]) => {
                const item = menu.find(m => m.id === itemId);
                if (!item) return null;
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
                      <span className="text-xs text-zinc-500 mt-0.5 block">
                        UGX {item.priceUGX.toLocaleString()} each
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="h-6 w-6 rounded-lg bg-zinc-100  flex items-center justify-center text-zinc-550 hover:text-foreground"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-semibold text-foreground w-4 text-center">{qty}</span>
                      <button 
                        onClick={() => addToCart(item.id)}
                        className="h-6 w-6 rounded-lg bg-zinc-100  flex items-center justify-center text-zinc-550 hover:text-foreground"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className=" pt-4 mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Delivery Point</label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full rounded-xl  bg-zinc-100 py-2 px-3 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="Table 1">Table 1 (Garden)</option>
                    <option value="Table 2">Table 2 (Garden)</option>
                    <option value="Table 3">Table 3 (Riverfront)</option>
                    <option value="Table 4">Table 4 (Riverfront)</option>
                    <option value="Room 101">Room 101 (Cottage)</option>
                    <option value="Room 102">Room 102 (Cottage)</option>
                    <option value="Room 204">Room 204 (Twin)</option>
                    <option value="Room 301">Room 301 (Suite)</option>
                  </select>
                </div>

                <div className="text-right flex flex-col justify-end space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Subtotal: UGX {cartTotal.ugx.toLocaleString()}</span>
                  {vatRate > 0 && (
                    <span className="text-[10px] uppercase font-bold text-zinc-500">VAT ({vatRate}%): UGX {Math.round(cartTotal.ugx * (vatRate / 100)).toLocaleString()}</span>
                  )}
                  <span className="text-xs font-bold text-violet-400 mt-1 block">Total: UGX {Math.round(cartTotal.ugx * (1 + vatRate / 100)).toLocaleString()}</span>
                  <span className="text-[10px] text-zinc-500 block">~ ${Math.round(cartTotal.usd * (1 + vatRate / 100) * 10) / 10} USD</span>
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full py-3 mt-2"
              >
                Place Culinary Order
              </Button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
export default Restaurant;


