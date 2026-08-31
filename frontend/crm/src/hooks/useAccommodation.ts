import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';

export interface RoomType {
  id: string;
  name: string;
  priceUGX: number;
  priceUSD: number;
  capacity: string;
  amenities: string[];
  description: string;
  image: string;
  photos?: string[];
}

export interface RoomUnit {
  id: string;
  roomNumber: string;
  roomCategoryId: string;
  floor: string;
  roomStatus: 'Available' | 'Reserved' | 'Occupied' | 'Maintenance';
  maxOccupancy: number;
  description?: string;
  amenities?: string[];
}

export interface BookingRecord {
  id: string;
  roomId: string; // Points to Category ID for compatibility
  roomName: string; // Category Name
  roomUnitId?: string; // Specific assigned Room Unit ID
  roomUnitNumber?: string; // Specific assigned Room Unit Number
  guestName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  status: 'Reserved' | 'Checked In' | 'Checked Out' | 'Cancelled';
  totalPaid: number; // in UGX
  customerId?: number;
  guests?: { customer_id: number; is_child: boolean }[];
}

const getErrorMessage = (err: any, fallback = 'An error occurred'): string => {
  if (!err) return fallback;
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => `${d.loc.slice(1).join('.') || 'error'}: ${d.msg}`).join(', ');
  }
  if (typeof detail === 'object' && detail !== null) {
    return JSON.stringify(detail);
  }
  return err.message || fallback;
};

export const useAccommodation = () => {
  const { addNotification } = useNotification();
  const [categories, setCategories] = useState<RoomType[]>([]);
  const [roomUnits, setRoomUnits] = useState<RoomUnit[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccommodationData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch categories
      const catRes = await api.get('/accommodation/categories');
      const parsedCats = catRes.data.map((c: any) => {
        const parts = c.description ? c.description.split(" | ") : [];
        const dbPhotos = c.photos ? c.photos.map((p: any) => p.photo_url) : [];
        const defaultImg = dbPhotos.length > 0 ? dbPhotos[0] : (parts[3] || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=300');
        return {
          id: String(c.room_category_id),
          name: c.category_name,
          priceUGX: Number(c.base_rate || 0),
          priceUSD: Number(c.base_rate || 0),
          capacity: parts[1] || "2 Adults, 1 Child",
          amenities: parts[2] ? parts[2].split(",") : ['AC', 'Free Wi-Fi', 'King Bed'],
          description: parts[0] || c.description || "",
          image: defaultImg,
          photos: dbPhotos,
        };
      });
      setCategories(parsedCats);

      // 2. Fetch rooms
      const roomRes = await api.get('/accommodation/rooms/all');
      const parsedRooms = roomRes.data.map((r: any) => ({
        id: String(r.room_id),
        roomNumber: r.room_number,
        roomCategoryId: String(r.room_category_id),
        floor: r.floor || "1st Floor",
        roomStatus: r.room_status as any,
        maxOccupancy: r.max_occupancy,
        description: r.description || "",
        amenities: r.amenities ? r.amenities.split(",").map((s: string) => s.trim()) : []
      }));
      setRoomUnits(parsedRooms);

      // 3. Fetch reservations
      const resRes = await api.get('/accommodation/reservations');
      const parsedBookings = resRes.data.map((b: any) => {
        const associatedRoom = parsedRooms.find((r: any) => r.id === String(b.room_id));
        const associatedCat = parsedCats.find((c: any) => c.id === (associatedRoom ? associatedRoom.roomCategoryId : ""));
        
        let displayStatus: BookingRecord['status'] = 'Reserved';
        if (b.reservation_status === 'CheckedIn') displayStatus = 'Checked In';
        else if (b.reservation_status === 'CheckedOut') displayStatus = 'Checked Out';
        else if (b.reservation_status === 'Cancelled') displayStatus = 'Cancelled';

        return {
          id: String(b.reservation_id),
          roomId: associatedRoom ? associatedRoom.roomCategoryId : "",
          roomName: associatedCat ? associatedCat.name : "Unknown Category",
          roomUnitId: String(b.room_id),
          roomUnitNumber: associatedRoom ? associatedRoom.roomNumber : undefined,
          guestName: b.guest_name || `Customer #${b.customer_id}`,
          email: b.guest_email || "guest@seyeyalodge.com",
          checkIn: b.check_in_date,
          checkOut: b.check_out_date,
          status: displayStatus,
          totalPaid: Number(b.total_amount),
          customerId: b.customer_id,
          guests: b.guest_details ? b.guest_details.map((gd: any) => ({
            customer_id: gd.customer_id,
            is_child: gd.is_child,
            name: gd.guest_name
          })) : []
        };
      });
      setBookings(parsedBookings);

    } catch (e) {
      console.error("Error fetching accommodation data from API:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodationData();
  }, []);

  // Customer helper
  const getOrCreateCustomer = async (guestName: string, email: string) => {
    try {
      const customersRes = await api.get('/crm/customers');
      const existing = customersRes.data.find((c: any) => c.email && email && c.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return existing.customer_id;
      }
      
      const createRes = await api.post('/crm/customers', {
        full_name: guestName,
        email: email || undefined,
        is_active: true
      });
      return createRes.data.customer_id;
    } catch (err) {
      console.error("Error lookup/create customer:", err);
      return 1; // Fallback customer ID
    }
  };

  // Room Categories CRUD
  const addCategory = async (category: Omit<RoomType, 'id'>) => {
    try {
      const descPayload = `${category.description} | ${category.capacity} | ${category.amenities.join(',')} | ${category.image}`;
      await api.post('/accommodation/categories', {
        category_name: category.name,
        description: descPayload,
        base_rate: category.priceUGX || category.priceUSD || 0,
        is_active: true,
        photos: category.photos || []
      });
      await fetchAccommodationData();
      addNotification('Category Added', `Created new room category: ${category.name}`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to add room category'), 'booking');
    }
  };

  const updateCategory = async (updatedCat: RoomType) => {
    try {
      const descPayload = `${updatedCat.description} | ${updatedCat.capacity} | ${updatedCat.amenities.join(',')} | ${updatedCat.image}`;
      await api.put(`/accommodation/categories/${updatedCat.id}`, {
        category_name: updatedCat.name,
        description: descPayload,
        base_rate: updatedCat.priceUGX || updatedCat.priceUSD || 0,
        is_active: true,
        photos: updatedCat.photos || []
      });
      await fetchAccommodationData();
      addNotification('Category Updated', `Updated room category: ${updatedCat.name}`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to update category'), 'booking');
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/accommodation/categories/${id}`);
      await fetchAccommodationData();
      addNotification('Category Removed', `Successfully deleted category`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to delete category'), 'booking');
    }
  };

  // Room Units CRUD
  const addRoomUnit = async (room: Omit<RoomUnit, 'id'>) => {
    try {
      await api.post('/accommodation/rooms', {
        room_category_id: parseInt(room.roomCategoryId),
        room_number: room.roomNumber,
        floor: room.floor,
        room_status: room.roomStatus,
        max_occupancy: room.maxOccupancy,
        description: room.description || '',
        amenities: room.amenities ? room.amenities.join(',') : '',
        is_active: true
      });
      await fetchAccommodationData();
      addNotification('Room Unit Added', `Created room number: ${room.roomNumber}`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to add room unit'), 'booking');
    }
  };

  const updateRoomUnit = async (updatedRoom: RoomUnit) => {
    try {
      await api.put(`/accommodation/rooms/${updatedRoom.id}`, {
        room_category_id: parseInt(updatedRoom.roomCategoryId),
        room_number: updatedRoom.roomNumber,
        floor: updatedRoom.floor,
        room_status: updatedRoom.roomStatus,
        max_occupancy: updatedRoom.maxOccupancy,
        description: updatedRoom.description || '',
        amenities: updatedRoom.amenities ? updatedRoom.amenities.join(',') : '',
        is_active: true
      });
      await fetchAccommodationData();
      addNotification('Room Unit Updated', `Updated room: ${updatedRoom.roomNumber}`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to update room unit'), 'booking');
    }
  };

  const deleteRoomUnit = async (id: string) => {
    try {
      await api.delete(`/accommodation/rooms/${id}`);
      await fetchAccommodationData();
      addNotification('Room Unit Removed', `Deleted room successfully`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to delete room unit'), 'booking');
    }
  };

  const updateRoomUnitStatus = async (id: string, newStatus: RoomUnit['roomStatus']) => {
    try {
      await api.put(`/accommodation/rooms/${id}`, {
        room_status: newStatus
      });
      await fetchAccommodationData();
    } catch (err) {
      console.error(err);
    }
  };

  // Bookings CRUD
  const reserveRoom = async (
    room: RoomType,
    guestName: string,
    email: string,
    checkIn: string,
    checkOut: string,
    totalPrice: number,
    roomUnitId?: string
  ) => {
    try {
      const customerId = await getOrCreateCustomer(guestName, email);
      
      // If no roomUnitId assigned, search for available room unit in category
      let targetRoomId = roomUnitId ? parseInt(roomUnitId) : null;
      if (!targetRoomId) {
        const matchingUnit = roomUnits.find(ru => ru.roomCategoryId === room.id && ru.roomStatus === 'Available');
        if (matchingUnit) {
          targetRoomId = parseInt(matchingUnit.id);
        } else {
          // Fallback to first room in category if none available
          const firstInCat = roomUnits.find(ru => ru.roomCategoryId === room.id);
          if (firstInCat) targetRoomId = parseInt(firstInCat.id);
        }
      }

      if (!targetRoomId) {
        throw new Error("No room units configured for this category.");
      }

      await api.post('/accommodation/reservations', {
        customer_id: customerId,
        room_id: targetRoomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        num_adults: 2,
        num_children: 0
      });

      await fetchAccommodationData();
      addNotification('Room Booking Registered', `${guestName} reserved ${room.name}`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to register reservation'), 'booking');
    }
  };

  const addBooking = async (booking: Omit<BookingRecord, 'id'>) => {
    try {
      let customerId = booking.customerId;
      if (!customerId) {
        customerId = await getOrCreateCustomer(booking.guestName, booking.email);
      }
      
      let targetRoomId = booking.roomUnitId ? parseInt(booking.roomUnitId) : null;
      if (!targetRoomId) {
        // Auto-assign available room unit
        const matchingUnit = roomUnits.find(ru => ru.roomCategoryId === booking.roomId && ru.roomStatus === 'Available');
        if (matchingUnit) {
          targetRoomId = parseInt(matchingUnit.id);
        } else {
          // Fallback to first room in category
          const firstInCat = roomUnits.find(ru => ru.roomCategoryId === booking.roomId);
          if (firstInCat) {
            targetRoomId = parseInt(firstInCat.id);
          }
        }
      }

      if (!targetRoomId) {
        throw new Error("No rooms are configured in this category. Please create a room unit first.");
      }

      const guestsList = booking.guests || [];
      const numAdults = guestsList.length > 0 ? guestsList.filter(g => !g.is_child).length : 1;
      const numChildren = guestsList.length > 0 ? guestsList.filter(g => g.is_child).length : 0;

      await api.post('/accommodation/reservations', {
        customer_id: customerId,
        room_id: targetRoomId,
        check_in_date: booking.checkIn,
        check_out_date: booking.checkOut,
        num_adults: numAdults,
        num_children: numChildren,
        guests: guestsList
      });

      await fetchAccommodationData();
      addNotification('Booking Created', `Added booking successfully`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to create booking'), 'booking');
    }
  };

  const updateBooking = async (updatedBooking: BookingRecord) => {
    try {
      let customerId = updatedBooking.customerId;
      if (!customerId) {
        customerId = await getOrCreateCustomer(updatedBooking.guestName, updatedBooking.email);
      }
      
      // Update by deleting old and creating new if room or date changes,
      // or simply delete and recreate as a clean update mechanism for full forms.
      await api.delete(`/accommodation/reservations/${updatedBooking.id}`);
      
      let targetRoomId = updatedBooking.roomUnitId ? parseInt(updatedBooking.roomUnitId) : null;
      if (!targetRoomId) {
        // Auto-assign available room unit
        const matchingUnit = roomUnits.find(ru => ru.roomCategoryId === updatedBooking.roomId && ru.roomStatus === 'Available');
        if (matchingUnit) {
          targetRoomId = parseInt(matchingUnit.id);
        } else {
          // Fallback to first room in category
          const firstInCat = roomUnits.find(ru => ru.roomCategoryId === updatedBooking.roomId);
          if (firstInCat) {
            targetRoomId = parseInt(firstInCat.id);
          }
        }
      }

      if (!targetRoomId) {
        throw new Error("No rooms are configured in this category. Please create a room unit first.");
      }

      const guestsList = updatedBooking.guests || [];
      const numAdults = guestsList.length > 0 ? guestsList.filter(g => !g.is_child).length : 1;
      const numChildren = guestsList.length > 0 ? guestsList.filter(g => g.is_child).length : 0;

      await api.post('/accommodation/reservations', {
        customer_id: customerId,
        room_id: targetRoomId,
        check_in_date: updatedBooking.checkIn,
        check_out_date: updatedBooking.checkOut,
        num_adults: numAdults,
        num_children: numChildren,
        guests: guestsList
      });

      await fetchAccommodationData();
      addNotification('Booking Updated', `Modified booking details successfully`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to update booking'), 'booking');
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: BookingRecord['status']) => {
    try {
      if (newStatus === 'Checked In') {
        await api.post(`/accommodation/reservations/${bookingId}/checkin`);
        addNotification('Guest Check-in Alert', 'Checked in guest successfully', 'booking');
      } else if (newStatus === 'Checked Out') {
        await api.post(`/accommodation/reservations/${bookingId}/checkout`);
        addNotification('Guest Check-out Alert', 'Checked out guest successfully', 'booking');
      } else if (newStatus === 'Cancelled') {
        await api.patch(`/accommodation/reservations/${bookingId}`, {
          reservation_status: 'Cancelled'
        });
        addNotification('Booking Cancelled', 'Cancelled booking successfully', 'booking');
      }
      await fetchAccommodationData();
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to update booking status'), 'booking');
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      await api.delete(`/accommodation/reservations/${id}`);
      await fetchAccommodationData();
      addNotification('Booking Removed', `Deleted booking successfully`, 'booking');
    } catch (err: any) {
      console.error(err);
      addNotification('Error', getErrorMessage(err, 'Failed to delete booking'), 'booking');
    }
  };

  return {
    rooms: categories, // client Accommodation compatibility
    categories,
    roomUnits,
    bookings,
    reserveRoom,
    addBooking,
    updateBooking,
    deleteBooking,
    updateBookingStatus,
    addCategory,
    updateCategory,
    deleteCategory,
    addRoomUnit,
    updateRoomUnit,
    deleteRoomUnit,
    updateRoomUnitStatus,
    isLoading
  };
};
