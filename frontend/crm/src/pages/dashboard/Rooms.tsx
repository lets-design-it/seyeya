import React, { useMemo } from 'react';
import { useAccommodation, BookingRecord } from '../../hooks/useAccommodation';
import { Card } from '../../components/Card';
import { Bed, Calendar, UserCheck, ShieldAlert, Check } from 'lucide-react';

interface RoomLayout {
  number: string;
  typeId: string;
  typeName: string;
}

const ROOM_LIST: RoomLayout[] = [
  { number: '101', typeId: 'r-1', typeName: 'Seyeya Deluxe Safari Cottage' },
  { number: '102', typeId: 'r-1', typeName: 'Seyeya Deluxe Safari Cottage' },
  { number: '103', typeId: 'r-1', typeName: 'Seyeya Deluxe Safari Cottage' },
  { number: '201', typeId: 'r-2', typeName: 'Executive Twin Room' },
  { number: '202', typeId: 'r-2', typeName: 'Executive Twin Room' },
  { number: '203', typeId: 'r-2', typeName: 'Executive Twin Room' },
  { number: '301', typeId: 'r-3', typeName: 'Seyeya Royal Honeymoon Suite' },
  { number: '302', typeId: 'r-3', typeName: 'Seyeya Royal Honeymoon Suite' }
];

export const Rooms: React.FC = () => {
  const { bookings, updateBookingStatus } = useAccommodation();

  // Find active booking for a given room number
  const roomStatusMap = useMemo(() => {
    const map: Record<string, { booking: BookingRecord; status: 'Reserved' | 'Checked In' } | null> = {};
    
    ROOM_LIST.forEach(room => {
      // Find a booking for this room type that is active (Reserved or Checked In)
      // Since it's a mock, we match booking records.
      // If a guest checks in, we assign them to a room number for presentation purposes.
      const match = bookings.find(b => {
        // Simple mock assignment: check if booking matches room type
        // Let's bind b-1 to room 102, b-2 to room 301, b-3 is checked out.
        if (b.id === 'b-1' && room.number === '102') return true;
        if (b.id === 'b-2' && room.number === '301') return true;
        
        // For new client bookings, match them to the first vacant room of that type!
        if (b.roomId === room.typeId && (b.status === 'Reserved' || b.status === 'Checked In')) {
          // Prevent double assignment in mock view
          const alreadyAssigned = Object.values(map).some(assigned => assigned?.booking.id === b.id);
          if (!alreadyAssigned && b.id !== 'b-1' && b.id !== 'b-2') return true;
        }
        return false;
      });

      if (match) {
        map[room.number] = {
          booking: match,
          status: match.status as 'Reserved' | 'Checked In'
        };
      } else {
        map[room.number] = null;
      }
    });

    return map;
  }, [bookings]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Cottage & Rooms Calendar</h3>
          <p className="text-xs text-zinc-400">Front desk room occupancy console. Coordinate check-ins and vacancy status.</p>
        </div>
        <div className="flex items-center gap-3.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-zinc-400">Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
            <span className="text-zinc-400">Checked In</span>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROOM_LIST.map((room) => {
          const occupancy = roomStatusMap[room.number];
          
          return (
            <Card 
              key={room.number}
              variant="glass"
              className={`p-4 border transition-all duration-300 relative flex flex-col justify-between min-h-[190px] ${
                occupancy?.status === 'Checked In' 
                  ? 'border-violet-500/25 bg-violet-950/5' 
                  : occupancy?.status === 'Reserved'
                  ? 'border-amber-500/25 bg-amber-950/5'
                  : 'border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-500/30'
              }`}
            >
              {/* Room Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white leading-none">Room {room.number}</h4>
                  <span className="text-[9px] text-zinc-500 uppercase mt-1 block tracking-wider leading-none">
                    {room.typeName.replace('Seyeya ', '')}
                  </span>
                </div>
                <Bed className={`h-4.5 w-4.5 ${
                  occupancy?.status === 'Checked In'
                    ? 'text-violet-400'
                    : occupancy?.status === 'Reserved'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`} />
              </div>

              {/* Occupancy details */}
              <div className="my-4 flex-1">
                {occupancy ? (
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Guest:</span>
                      <span className="font-semibold text-zinc-200 truncate max-w-[120px]">{occupancy.booking.guestName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Stay Dates:</span>
                      <span className="text-zinc-400">{occupancy.booking.checkIn} to {occupancy.booking.checkOut}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-start text-[10px] text-emerald-450 font-bold uppercase tracking-wider">
                    ✦ Vacant & Prepared
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="border-t border-zinc-900/60 pt-3 flex justify-end shrink-0">
                {occupancy?.status === 'Reserved' && (
                  <button
                    onClick={() => updateBookingStatus(occupancy.booking.id, 'Checked In')}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600 hover:text-white py-1.5 text-[9px] font-bold text-amber-400 transition-colors focus:outline-none"
                  >
                    <UserCheck className="h-3 w-3" />
                    Check In Guest
                  </button>
                )}
                {occupancy?.status === 'Checked In' && (
                  <button
                    onClick={() => updateBookingStatus(occupancy.booking.id, 'Checked Out')}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 hover:bg-red-650 hover:text-white py-1.5 text-[9px] font-bold text-violet-400 transition-colors focus:outline-none"
                  >
                    <ShieldAlert className="h-3 w-3" />
                    Check Out / Clear
                  </button>
                )}
                {!occupancy && (
                  <div className="w-full text-center py-1 text-[8px] text-zinc-600 font-semibold uppercase tracking-wider">
                    Available for reservation
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
export default Rooms;
