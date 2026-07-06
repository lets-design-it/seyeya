import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

export interface RoomType {
  id: string;
  name: string;
  priceUGX: number;
  priceUSD: number;
  capacity: string;
  amenities: string[];
  description: string;
  image: string;
}

export interface BookingRecord {
  id: string;
  roomId: string;
  roomName: string;
  guestName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  status: 'Reserved' | 'Checked In' | 'Checked Out' | 'Cancelled';
  totalPaid: number; // in UGX
}

const ROOM_TYPES: RoomType[] = [
  {
    id: 'r-1',
    name: 'Seyeya Deluxe Safari Cottage',
    priceUGX: 380000,
    priceUSD: 100,
    capacity: '2 Adults, 1 Child',
    amenities: ['Private Balcony', 'Nile View', 'King Bed', 'AC', 'Free Wi-Fi'],
    description: 'A luxurious private cottage overlooking the Nile, complete with local artistic tapestries and high-end wooden finishes.',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=300',
  },
  {
    id: 'r-2',
    name: 'Executive Twin Room',
    priceUGX: 280000,
    priceUSD: 75,
    capacity: '2 Adults',
    amenities: ['Two Double Beds', 'Garden View', 'Work Station', 'Coffee Machine'],
    description: 'Perfect for business travelers or friends traveling together, situated near the main gardens.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300',
  },
  {
    id: 'r-3',
    name: 'Seyeya Royal Honeymoon Suite',
    priceUGX: 570000,
    priceUSD: 150,
    capacity: '2 Adults',
    amenities: ['Private Jacuzzi', 'Champagne Bar', 'Panoramic Deck', 'Plunge Pool'],
    description: 'The peak of luxury. Provides a completely secluded villa feel with panoramic sunset viewing over the river bend.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4db85b?w=300',
  }
];

const DEFAULT_BOOKINGS: BookingRecord[] = [
  {
    id: 'b-1',
    roomId: 'r-1',
    roomName: 'Seyeya Deluxe Safari Cottage',
    guestName: 'Alexandra Vance',
    email: 'alexandra@stellartech.io',
    checkIn: '2026-06-15',
    checkOut: '2026-06-18',
    status: 'Checked In',
    totalPaid: 1140000,
  },
  {
    id: 'b-2',
    roomId: 'r-3',
    roomName: 'Seyeya Royal Honeymoon Suite',
    guestName: 'Marcus Vance',
    email: 'marcus@seyeyalodge.com',
    checkIn: '2026-06-20',
    checkOut: '2026-06-22',
    status: 'Reserved',
    totalPaid: 1140000,
  },
  {
    id: 'b-3',
    roomId: 'r-2',
    roomName: 'Executive Twin Room',
    guestName: 'Elena Rostova',
    email: 'elena@rostova.co.ug',
    checkIn: '2026-06-12',
    checkOut: '2026-06-14',
    status: 'Checked Out',
    totalPaid: 560000,
  }
];

export const useAccommodation = () => {
  const { addNotification } = useNotification();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('seyeya_crm_bookings');
    if (saved) {
      try {
        setBookings(JSON.parse(saved));
      } catch (e) {
        setBookings(DEFAULT_BOOKINGS);
      }
    } else {
      localStorage.setItem('seyeya_crm_bookings', JSON.stringify(DEFAULT_BOOKINGS));
      setBookings(DEFAULT_BOOKINGS);
    }
  }, []);

  const reserveRoom = (
    room: RoomType,
    guestName: string,
    email: string,
    checkIn: string,
    checkOut: string,
    totalPrice: number
  ) => {
    const newBooking: BookingRecord = {
      id: `booking-${Date.now()}`,
      roomId: room.id,
      roomName: room.name,
      guestName,
      email,
      checkIn,
      checkOut,
      status: 'Reserved',
      totalPaid: totalPrice,
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    localStorage.setItem('seyeya_crm_bookings', JSON.stringify(updated));

    // Dispatch real-time toast notification
    addNotification('Room Booking Registered', `${guestName} reserved ${room.name} (${checkIn} to ${checkOut})`, 'booking');
  };

  const updateBookingStatus = (bookingId: string, newStatus: BookingRecord['status']) => {
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: newStatus };
      }
      return b;
    });
    setBookings(updated);
    localStorage.setItem('seyeya_crm_bookings', JSON.stringify(updated));

    // Trigger log if checking in
    if (newStatus === 'Checked In') {
      const target = bookings.find(b => b.id === bookingId);
      if (target) {
        addNotification('Guest Check-in Alert', `${target.guestName} checked into ${target.roomName}`, 'booking');
      }
    }
  };

  return {
    rooms: ROOM_TYPES,
    bookings,
    reserveRoom,
    updateBookingStatus,
  };
};
