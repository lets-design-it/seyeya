import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';

export interface EventHall {
  id: string;
  hall_id: number;
  name: string;
  basePriceUGX: number; // Daily rental cost
  basePriceUSD: number;
  capacity: number;
  description: string;
  image: string;
  amenities: string;
  hourly_rate: number;
  half_day_rate: number;
  full_day_rate: number;
}

export interface ConferenceQuote {
  id: string;
  clientName: string;
  companyName: string;
  email: string;
  hallName: string;
  guestsCount: number;
  daysCount: number;
  cateringOption: 'None' | 'Standard Breakfast' | 'Executive Full Day';
  soundSystem: boolean;
  projector: boolean;
  totalCostUGX: number;
  status: 'Pending' | 'Approved' | 'Declined';
  date: string;
  paymentStatus?: 'Pending' | 'Paid' | 'PartiallyPaid';
  amountPaid?: number;
  balanceDue?: number;
  startTime?: string;
  endTime?: string;
  specialRequests?: string;
}

export const useConference = () => {
  const { addNotification } = useNotification();
  const [halls, setHalls] = useState<EventHall[]>([]);
  const [quotes, setQuotes] = useState<ConferenceQuote[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [mealPackages, setMealPackages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConferenceData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch halls
      let hallsRes = await api.get('/conference/halls');
      
      // Auto-seed default halls if database is empty
      if (hallsRes.data.length === 0) {
        const defaultHalls = [
          {
            hall_name: 'Nile View Grand Hall',
            capacity: 250,
            hourly_rate: 200000,
            half_day_rate: 1000000,
            full_day_rate: 1800000,
            description: 'A massive state-of-the-art indoor hall with floor-to-ceiling glass overlooking the river rapids.',
            amenities: 'Projector, Sound System, AC, WiFi'
          },
          {
            hall_name: 'Sunset River Lawn (Outdoor)',
            capacity: 500,
            hourly_rate: 150000,
            half_day_rate: 700000,
            full_day_rate: 1200000,
            description: 'Perfect manicured lawns beside the Nile bend. Excellent for outdoor workshops.',
            amenities: 'Sound System, WiFi'
          },
          {
            hall_name: 'Executive River Boardroom',
            capacity: 25,
            hourly_rate: 70000,
            half_day_rate: 300000,
            full_day_rate: 500000,
            description: 'A quiet, sound-insulated air-conditioned private room with conference projection displays.',
            amenities: 'Projector, AC, WiFi'
          }
        ];
        
        for (const dh of defaultHalls) {
          try {
            await api.post('/conference/halls', dh);
          } catch (e) {
            console.error("Failed to seed default hall", dh.hall_name, e);
          }
        }
        hallsRes = await api.get('/conference/halls');
      }

      const mappedHalls = hallsRes.data.map((h: any, idx: number) => {
        const images = [
          'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300',
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300',
          'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=300'
        ];
        return {
          id: String(h.hall_id),
          hall_id: h.hall_id,
          name: h.hall_name,
          basePriceUGX: Number(h.full_day_rate || h.hourly_rate || 500000),
          basePriceUSD: Math.round(Number(h.full_day_rate || h.hourly_rate || 500000) / 3700),
          capacity: h.capacity,
          description: h.description || '',
          amenities: h.amenities || '',
          image: images[idx % images.length],
          hourly_rate: Number(h.hourly_rate || 0),
          half_day_rate: Number(h.half_day_rate || 0),
          full_day_rate: Number(h.full_day_rate || 0)
        };
      });
      setHalls(mappedHalls);

      // 2. Fetch reservations
      const resvRes = await api.get('/conference/reservations');
      const mappedQuotes = resvRes.data.map((r: any) => {
        let catering: any = 'None';
        if (r.special_requests && r.special_requests.includes('Catering: Standard Breakfast')) {
          catering = 'Standard Breakfast';
        } else if (r.special_requests && r.special_requests.includes('Catering: Executive Full Day')) {
          catering = 'Executive Full Day';
        }
        
        return {
          id: String(r.conference_res_id),
          clientName: r.customer?.full_name || `Client #${r.customer_id}`,
          companyName: r.event_name || 'Event',
          email: r.customer?.email || 'client@seyeya.com',
          hallName: r.hall?.hall_name || `Hall #${r.hall_id}`,
          guestsCount: r.num_participants || 10,
          daysCount: 1, 
          cateringOption: catering,
          soundSystem: r.special_requests?.includes('Sound System') || false,
          projector: r.special_requests?.includes('Projector') || false,
          totalCostUGX: Number(r.total_amount),
          status: r.reservation_status || 'Pending',
          date: r.event_date,
          paymentStatus: r.payment_status,
          amountPaid: Number(r.amount_paid || 0),
          balanceDue: Number(r.balance_due || 0),
          startTime: r.start_time,
          endTime: r.end_time,
          specialRequests: r.special_requests
        };
      });
      setQuotes(mappedQuotes);

      // 3. Fetch resources and meal packages
      const resourceRes = await api.get('/conference/resources');
      setResources(resourceRes.data);

      const mealRes = await api.get('/conference/meal-packages');
      setMealPackages(mealRes.data);

      const custRes = await api.get('/crm/customers');
      setCustomers(custRes.data);
    } catch (e) {
      console.error("Failed to load conference data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConferenceData();
  }, []);

  const calculateQuoteCost = (
    hall: EventHall,
    guests: number,
    days: number,
    catering: ConferenceQuote['cateringOption'],
    sound: boolean,
    proj: boolean
  ) => {
    let rentalCost = hall.basePriceUGX * days;
    
    let cateringCostPerHead = 0;
    if (catering === 'Standard Breakfast') cateringCostPerHead = 25000;
    else if (catering === 'Executive Full Day') cateringCostPerHead = 55000;
    
    let cateringCost = cateringCostPerHead * guests * days;
    
    let soundCost = sound ? 300000 * days : 0;
    let projCost = proj ? 150000 * days : 0;
    
    return rentalCost + cateringCost + soundCost + projCost;
  };

  const addConferenceHall = async (hallData: {
    hall_name: string;
    capacity: number;
    hourly_rate: number;
    half_day_rate: number;
    full_day_rate: number;
    description?: string;
    amenities?: string;
  }) => {
    setIsLoading(true);
    try {
      await api.post('/conference/halls', {
        hall_name: hallData.hall_name,
        capacity: Number(hallData.capacity),
        hourly_rate: Number(hallData.hourly_rate || 0),
        half_day_rate: Number(hallData.half_day_rate || 0),
        full_day_rate: Number(hallData.full_day_rate || 0),
        description: hallData.description || '',
        amenities: hallData.amenities || ''
      });
      await fetchConferenceData();
      addNotification('Conference Hall Added', `Hall ${hallData.hall_name} created successfully.`, 'event');
    } catch (e) {
      console.error("Failed to add conference hall", e);
      addNotification('Error', 'Failed to create conference hall', 'event');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const requestQuote = async (
    hall: EventHall,
    clientName: string,
    companyName: string,
    email: string,
    guests: number,
    days: number,
    catering: ConferenceQuote['cateringOption'],
    sound: boolean,
    proj: boolean,
    eventDate: string
  ) => {
    try {
      // 1. Resolve customer
      let customerId: number;
      try {
        const lookup = await api.get(`/crm/customers/lookup/${encodeURIComponent(email)}`);
        customerId = lookup.data.customer_id;
      } catch (err) {
        // Customer not found, create one
        const custRes = await api.post('/crm/customers', {
          full_name: clientName,
          email: email,
          customer_type: 'Registered'
        });
        customerId = custRes.data.customer_id;
      }

      // 2. Resolve resources
      const selectedResources: any[] = [];
      if (sound) {
        const soundRes = resources.find(r => r.resource_name.toLowerCase().includes('sound'));
        if (soundRes) {
          selectedResources.push({ resource_id: soundRes.resource_id, quantity: 1 });
        }
      }
      if (proj) {
        const projRes = resources.find(r => r.resource_name.toLowerCase().includes('projector') || r.resource_name.toLowerCase().includes('screen'));
        if (projRes) {
          selectedResources.push({ resource_id: projRes.resource_id, quantity: 1 });
        }
      }

      // 3. Resolve meals
      const selectedMeals: any[] = [];
      if (catering !== 'None') {
        const mealPkg = mealPackages.find(p => p.package_name.toLowerCase().includes(catering.toLowerCase().split(' ')[0]));
        if (mealPkg) {
          selectedMeals.push({ package_id: mealPkg.package_id, num_participants: guests });
        }
      }

      // 4. Create reservation
      const actualHallId = hall.hall_id || Number(hall.id);
      
      const payload = {
        customer_id: customerId,
        hall_id: actualHallId,
        event_name: companyName,
        event_date: eventDate,
        start_time: "08:00:00",
        end_time: "17:00:00",
        num_participants: guests,
        booking_type: "FullDay",
        special_requests: `Catering: ${catering}. Duration: ${days} days.${sound ? ' Sound System.' : ''}${proj ? ' Projector.' : ''}`,
        resources: selectedResources,
        meals: selectedMeals
      };

      await api.post('/conference/reservations', payload);
      await fetchConferenceData();
      
      addNotification(
        'Conference Quote Requested',
        `${companyName} requested pricing for ${guests} guests in ${hall.name}`,
        'event'
      );
    } catch (e) {
      console.error("Failed to request conference quote", e);
      throw e;
    }
  };

  const createReservation = async (data: {
    customer_id?: number;
    clientName?: string;
    email?: string;
    hall_id: number;
    event_name: string;
    event_date: string;
    start_time: string;
    end_time: string;
    num_participants: number;
    booking_type: string;
    special_requests?: string;
    soundSystem?: boolean;
    projector?: boolean;
    cateringOption?: 'None' | 'Standard Breakfast' | 'Executive Full Day';
  }) => {
    setIsLoading(true);
    try {
      let customerId = data.customer_id;
      if (!customerId) {
        try {
          const lookup = await api.get(`/crm/customers/lookup/${encodeURIComponent(data.email || '')}`);
          customerId = lookup.data.customer_id;
        } catch (err) {
          const custRes = await api.post('/crm/customers', {
            full_name: data.clientName || 'Walk-in Client',
            email: data.email || `walkin-${Date.now()}@seyeya.com`,
            customer_type: 'Registered'
          });
          customerId = custRes.data.customer_id;
        }
      }

      const selectedResources: any[] = [];
      if (data.soundSystem) {
        const soundRes = resources.find(r => r.resource_name.toLowerCase().includes('sound'));
        if (soundRes) {
          selectedResources.push({ resource_id: soundRes.resource_id, quantity: 1 });
        }
      }
      if (data.projector) {
        const projRes = resources.find(r => r.resource_name.toLowerCase().includes('projector') || r.resource_name.toLowerCase().includes('screen'));
        if (projRes) {
          selectedResources.push({ resource_id: projRes.resource_id, quantity: 1 });
        }
      }

      const selectedMeals: any[] = [];
      if (data.cateringOption && data.cateringOption !== 'None') {
        const mealPkg = mealPackages.find(p => p.package_name.toLowerCase().includes(data.cateringOption!.toLowerCase().split(' ')[0]));
        if (mealPkg) {
          selectedMeals.push({ package_id: mealPkg.package_id, num_participants: data.num_participants });
        }
      }

      let specialReqStr = data.special_requests || '';
      const extrasList: string[] = [];
      if (data.cateringOption && data.cateringOption !== 'None') {
        extrasList.push(`Catering: ${data.cateringOption}`);
      }
      if (data.soundSystem) extrasList.push('Sound System');
      if (data.projector) extrasList.push('Projector');
      
      if (extrasList.length > 0) {
        specialReqStr = `${specialReqStr} [${extrasList.join(', ')}]`.trim();
      }

      const payload = {
        customer_id: customerId,
        hall_id: Number(data.hall_id),
        event_name: data.event_name,
        event_date: data.event_date,
        start_time: data.start_time.includes(':') && data.start_time.split(':').length === 2 ? `${data.start_time}:00` : data.start_time,
        end_time: data.end_time.includes(':') && data.end_time.split(':').length === 2 ? `${data.end_time}:00` : data.end_time,
        num_participants: Number(data.num_participants),
        booking_type: data.booking_type,
        special_requests: specialReqStr.trim() || undefined,
        resources: selectedResources,
        meals: selectedMeals
      };

      await api.post('/conference/reservations', payload);
      await fetchConferenceData();
      addNotification('Reservation Created', `Reservation for ${data.event_name} successfully placed.`, 'event');
    } catch (e) {
      console.error("Failed to create reservation", e);
      addNotification('Error', 'Failed to create reservation', 'event');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuoteStatus = async (
    quoteId: string, 
    newStatus?: ConferenceQuote['status'],
    paymentStatus?: 'Pending' | 'Paid' | 'PartiallyPaid',
    amountPaid?: number
  ) => {
    try {
      const payload: any = {};
      if (newStatus) payload.reservation_status = newStatus;
      if (paymentStatus) payload.payment_status = paymentStatus;
      if (amountPaid !== undefined) payload.amount_paid = Number(amountPaid);

      await api.patch(`/conference/reservations/${quoteId}`, payload);
      await fetchConferenceData();
      addNotification('Event Booking Updated', `Reservation #${quoteId} successfully updated.`, 'event');
    } catch (e) {
      console.error("Failed to update reservation status", e);
      addNotification('Error', 'Failed to update reservation status', 'event');
      throw e;
    }
  };

  return {
    halls,
    quotes,
    isLoading,
    calculateQuoteCost,
    requestQuote,
    updateQuoteStatus,
    addConferenceHall,
    fetchConferenceData,
    customers,
    createReservation
  };
};
