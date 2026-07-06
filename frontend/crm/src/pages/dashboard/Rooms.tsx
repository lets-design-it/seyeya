import React, { useState, useMemo } from 'react';
import { useAccommodation, BookingRecord } from '../../hooks/useAccommodation';
import { Card } from '../../components/Card';
import { Bed, UserCheck, ShieldAlert, X, ChevronRight, Award, Landmark } from 'lucide-react';

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
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);

  // Find active booking for a given room number
  const roomStatusMap = useMemo(() => {
    const map: Record<string, { booking: BookingRecord; status: 'Reserved' | 'Checked In' } | null> = {};

    ROOM_LIST.forEach(room => {
      const match = bookings.find(b => {
        if (b.id === 'b-1' && room.number === '102') return true;
        if (b.id === 'b-2' && room.number === '301') return true;

        if (b.roomId === room.typeId && (b.status === 'Reserved' || b.status === 'Checked In')) {
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

  const selectedRoom = useMemo(() => {
    return ROOM_LIST.find(r => r.number === selectedRoomNumber) || null;
  }, [selectedRoomNumber]);

  const selectedOccupancy = useMemo(() => {
    if (!selectedRoomNumber) return null;
    return roomStatusMap[selectedRoomNumber];
  }, [selectedRoomNumber, roomStatusMap]);

  // Compute analytics metrics
  const vacantCount = useMemo(() => ROOM_LIST.filter(room => !roomStatusMap[room.number]).length, [roomStatusMap]);
  const reservedCount = useMemo(() => ROOM_LIST.filter(room => roomStatusMap[room.number]?.status === 'Reserved').length, [roomStatusMap]);
  const checkedInCount = useMemo(() => ROOM_LIST.filter(room => roomStatusMap[room.number]?.status === 'Checked In').length, [roomStatusMap]);
  const occupancyRate = useMemo(() => Math.round(((ROOM_LIST.length - vacantCount) / ROOM_LIST.length) * 100), [vacantCount]);

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-dark tracking-tight">Cottage & Rooms Calendar</h3>
          <p className="text-xs text-zinc-550">Front desk room occupancy console. Coordinate check-ins and vacancy status.</p>
        </div>
        <div className="flex items-center gap-3.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-550">Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-zinc-550">Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
            <span className="text-zinc-550">Checked In</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms Table List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel glass-card-glow rounded-3xl overflow-hidden shadow-md bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-xs uppercase font-bold tracking-wider text-zinc-500">
                    <th className="py-3.5 px-5">Room / Cottage</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Occupant</th>
                    <th className="py-3.5 px-5">Dates</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-foreground">
                  {ROOM_LIST.map((room) => {
                    const occupancy = roomStatusMap[room.number];
                    const status = occupancy ? occupancy.status : 'Vacant';
                    return (
                      <tr
                        key={room.number}
                        onClick={() => setSelectedRoomNumber(room.number)}
                        className="hover:bg-zinc-100/30 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5">
                          <div>
                            <p className="font-semibold text-foreground group-hover:text-violet-500 transition-colors leading-tight">
                              Room {room.number}
                            </p>
                            <span className="text-xs text-zinc-500 block mt-0.5">
                              {room.typeName.replace('Seyeya ', '')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            status === 'Checked In'
                              ? 'bg-violet-500/10 text-violet-500 border border-violet-500/20'
                              : status === 'Reserved'
                                ? 'bg-amber-500/10 text-amber-550 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-foreground">
                          {occupancy ? occupancy.booking.guestName : '—'}
                        </td>
                        <td className="py-3.5 px-5 text-zinc-550">
                          {occupancy ? `${occupancy.booking.checkIn} to ${occupancy.booking.checkOut}` : 'Vacant & Prepared'}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-violet-500 transition-transform group-hover:translate-x-0.5 inline-block" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Room Statistics & Types Column */}
        <div className="space-y-4">
          <Card variant="glass" className="p-5 space-y-4 shadow-lg bg-card">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100/60">
              <Award className="h-4.5 w-4.5 text-violet-500" />
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Occupancy Analytics</h4>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Total Rooms:</span>
                <span className="font-semibold text-foreground">{ROOM_LIST.length} Units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Checked In:</span>
                <span className="font-semibold text-violet-500">{checkedInCount} Rooms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Reserved:</span>
                <span className="font-semibold text-amber-500">{reservedCount} Rooms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Vacant & Prepared:</span>
                <span className="font-semibold text-emerald-500">{vacantCount} Rooms</span>
              </div>
              <div className="flex items-center justify-between pt-3.5 border-t border-zinc-100/60">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Occupancy Rate:</span>
                <span className="font-bold text-foreground text-sm">{occupancyRate}%</span>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-5 space-y-4 shadow-lg bg-card">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100/60">
              <Landmark className="h-4.5 w-4.5 text-violet-500" />
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Cottage Configurations</h4>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-550">
                  <Bed className="h-4.5 w-4.5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-foreground truncate leading-tight">
                    Deluxe Safari Cottage
                  </h5>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 font-semibold">
                    <span>r-1</span>
                    <span>•</span>
                    <span>2 Adults, 1 Child</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-bold">UGX 380K</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-zinc-100/50">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-550">
                  <Bed className="h-4.5 w-4.5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-foreground truncate leading-tight">
                    Executive Twin Room
                  </h5>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 font-semibold">
                    <span>r-2</span>
                    <span>•</span>
                    <span>2 Adults</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-bold">UGX 280K</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-zinc-100/50">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-550">
                  <Bed className="h-4.5 w-4.5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-foreground truncate leading-tight">
                    Royal Honeymoon Suite
                  </h5>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 font-semibold">
                    <span>r-3</span>
                    <span>•</span>
                    <span>2 Adults</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-bold">UGX 570K</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sliding Details Drawer Backdrop Overlay */}
      {selectedRoom && (
        <div 
          className="fixed inset-0 z-30 bg-zinc-950/15 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          onClick={() => setSelectedRoomNumber(null)}
        />
      )}

      {/* Sliding Details Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-md bg-card shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          selectedRoom ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedRoom && (
          <div className="flex flex-col h-full font-sans bg-white">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-6 bg-zinc-50 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cottage Occupancy details</span>
              <button
                onClick={() => setSelectedRoomNumber(null)}
                className="text-zinc-500 hover:text-foreground rounded-lg p-1.5 transition-colors focus:outline-none cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-650 shadow-inner">
                  <Bed className="h-8 w-8 text-violet-500" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">Room {selectedRoom.number}</h4>
                  <span className="inline-block px-2.5 py-1 mt-1 rounded-full bg-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {selectedRoom.typeName}
                  </span>
                </div>
              </div>

              {selectedOccupancy ? (
                <div className="space-y-5 border-t border-zinc-100/60 pt-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">Guest Occupant</span>
                    <h5 className="text-sm font-bold text-foreground">{selectedOccupancy.booking.guestName}</h5>
                    <span className="text-xs text-zinc-550 block">{selectedOccupancy.booking.email}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-[18px] text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Check In</span>
                      <span className="font-semibold text-foreground block">{selectedOccupancy.booking.checkIn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Check Out</span>
                      <span className="font-semibold text-foreground block">{selectedOccupancy.booking.checkOut}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50/50 p-4 rounded-[18px] text-xs flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total Rental Value</span>
                    <span className="font-bold text-foreground text-xs">
                      UGX {selectedOccupancy.booking.totalPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Current Status</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedOccupancy.status === 'Checked In'
                        ? 'bg-violet-500/10 text-violet-500 border border-violet-500/20'
                        : 'bg-amber-500/10 text-amber-550 border border-amber-500/20'
                    }`}>
                      {selectedOccupancy.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-t border-zinc-100/60 pt-6 text-center">
                  <div className="bg-emerald-50 text-emerald-600 rounded-[18px] p-4 text-xs font-semibold uppercase tracking-wider inline-block">
                    ✦ Vacant & Prepared
                  </div>
                  <p className="text-xs text-zinc-550 mt-3 max-w-xs mx-auto">
                    This cottage unit is currently unoccupied, fully cleaned, and available for client check-ins.
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            {selectedOccupancy && (
              <div className="p-6 bg-zinc-50/50 border-t border-zinc-100/60 flex items-center shrink-0">
                {selectedOccupancy.status === 'Reserved' && (
                  <button
                    onClick={() => {
                      updateBookingStatus(selectedOccupancy.booking.id, 'Checked In');
                      setSelectedRoomNumber(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#212121] hover:bg-zinc-800 text-white py-3 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <UserCheck className="h-4 w-4" />
                    Check In Guest
                  </button>
                )}
                {selectedOccupancy.status === 'Checked In' && (
                  <button
                    onClick={() => {
                      updateBookingStatus(selectedOccupancy.booking.id, 'Checked Out');
                      setSelectedRoomNumber(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-full bg-red-500 hover:bg-red-650 text-white py-3 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Check Out / Clear Room
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
