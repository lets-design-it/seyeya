import React, { useState, useMemo } from 'react';
import { useAccommodation, RoomType } from '../../hooks/useAccommodation';
import { useCurrency } from '../../context/CurrencyContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Bed, Calendar, CheckCircle, Flame } from 'lucide-react';

export const Accommodation: React.FC = () => {
  const { formatPrice } = useCurrency();
  const { rooms, reserveRoom } = useAccommodation();
  
  // Date and Guest Form states
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkIn, setCheckIn] = useState('2026-06-18');
  const [checkOut, setCheckOut] = useState('2026-06-21');
  
  const [selectedRoomId, setSelectedRoomId] = useState<string>('r-1');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Calculate stay nights
  const nightsCount = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  // Selected Room helper
  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  // Total reservation cost
  const totalCost = useMemo(() => {
    if (nightsCount <= 0) return { ugx: 0, usd: 0 };
    return {
      ugx: selectedRoom.priceUGX * nightsCount,
      usd: selectedRoom.priceUSD * nightsCount
    };
  }, [selectedRoom, nightsCount]);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail) {
      setError('Please fill in your name and email');
      return;
    }
    if (nightsCount <= 0) {
      setError('Check-out must be after check-in date');
      return;
    }
    setError('');

    // Reserve room
    reserveRoom(selectedRoom, guestName, guestEmail, checkIn, checkOut, totalCost.ugx);

    // Reset guest inputs & show success
    setGuestName('');
    setGuestEmail('');
    setIsSuccess(true);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16 font-sans">
      
      {/* Date & Contact Information Card */}
      <Card variant="glass" className="p-4  shadow-md">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3.5">Stay Specifications</h4>
        
        {error && (
          <div className="mb-3.5 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleBook} className="space-y-3">
          <Input 
            label="Full Name"
            placeholder="e.g. John Doe"
            value={guestName}
            required
            onChange={(e) => setGuestName(e.target.value)}
          />

          <Input 
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            value={guestEmail}
            required
            onChange={(e) => setGuestEmail(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3.5">
            <Input 
              label="Check In"
              type="date"
              value={checkIn}
              required
              onChange={(e) => setCheckIn(e.target.value)}
            />
            <Input 
              label="Check Out"
              type="date"
              value={checkOut}
              required
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </form>
      </Card>

      {/* Cottages Selector Cards */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Cottage Lodges & Suites</h4>
        
        {rooms.map((room) => {
          const isSelected = selectedRoomId === room.id;
          return (
            <div 
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={`rounded-2xl border bg-zinc-50 p-4 transition-all duration-300 shadow-sm cursor-pointer relative ${
                isSelected 
                  ? 'border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.15)] bg-card/80' 
                  : 'border-zinc-900 hover:border-zinc-850'
              }`}
            >
              {/* Image & Title */}
              <div className="flex gap-3.5">
                <img src={room.image} alt={room.name} className="h-16 w-20 rounded-xl object-cover  shrink-0" />
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-zinc-100 truncate leading-snug">{room.name}</h5>
                  <p className="text-xs text-zinc-500 mt-1 leading-normal line-clamp-2">{room.description}</p>
                </div>
              </div>

              {/* Price & Amenities */}
              <div className="mt-3.5 pt-3  flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5 max-w-[170px]">
                  {room.amenities.slice(0, 2).map((amenity) => (
                    <span key={amenity} className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-550 text-xs font-semibold">
                      {amenity}
                    </span>
                  ))}
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-zinc-500 block leading-none">Price per Night</span>
                  <span className="text-xs font-bold text-violet-400 mt-1 block leading-none">
                    {formatPrice(room.priceUGX)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing Summary & Checkout Button */}
      {nightsCount > 0 && (
        <Card variant="glow" className="p-4  flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider leading-none">
              <Calendar className="h-3.5 w-3.5" />
              <span>{nightsCount} Nights Selection</span>
            </div>
            <span className="text-sm font-bold text-white mt-1.5 block leading-none">
              {formatPrice(totalCost.ugx)}
            </span>
          </div>

          <Button 
            onClick={handleBook}
            className="px-5 py-3"
          >
            Reserve Cottage
          </Button>
        </Card>
      )}

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card/75 backdrop-blur-md animate-fade-in">
          <div className="glass-panel glass-card-glow rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl ">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-450 animate-bounce">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reservation Confirmed</h3>
            <p className="mt-2 text-xs text-zinc-550">
              Your room reservation request has been submitted successfully. A front desk representative will check you in shortly.
            </p>
            <Button 
              onClick={() => setIsSuccess(false)}
              className="w-full mt-6"
            >
              Great, thank you!
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
export default Accommodation;


