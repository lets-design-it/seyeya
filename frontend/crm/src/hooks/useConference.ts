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
  photos?: string[];
  main_photo_index?: number;
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

export interface ConferenceEventItem {
  id: string;
  event_id: number;
  event_name: string;
  description: string;
  photo_url: string;
  price: number;
  discount: number;
  event_date?: string;
  location?: string;
  capacity?: number;
  is_active: boolean;
  created_at?: string;
}

export interface ConferenceFacilityCategoryItem {
  id: number;
  name: string;
  description?: string;
  icon_name?: string;
  is_active?: boolean;
  created_at?: string;
  facilities?: ConferenceFacilityItem[];
}

export interface ConferenceFacilityItem {
  id: string;
  facility_id: number;
  name: string;
  category_id?: number;
  category: string;
  description: string;
  icon_name: string;
  is_active: boolean;
  price?: number;
  pricing_type?: string;
}

export const useConference = () => {
  const { addNotification } = useNotification();
  const [halls, setHalls] = useState<EventHall[]>([]);
  const [quotes, setQuotes] = useState<ConferenceQuote[]>([]);
  const [events, setEvents] = useState<ConferenceEventItem[]>([]);
  const [facilities, setFacilities] = useState<ConferenceFacilityItem[]>([]);
  const [facilityCategories, setFacilityCategories] = useState<ConferenceFacilityCategoryItem[]>([]);
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
        const defaultImages = [
          'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
          'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200'
        ];
        let photosList: string[] = [];
        if (Array.isArray(h.photos)) {
          photosList = h.photos;
        } else if (typeof h.photos === 'string' && h.photos.trim()) {
          try { photosList = JSON.parse(h.photos); } catch (e) { photosList = [h.photos]; }
        } else if (h.image) {
          photosList = [h.image];
        } else {
          photosList = [defaultImages[idx % defaultImages.length]];
        }

        const mainIndex = typeof h.main_photo_index === 'number' ? h.main_photo_index : 0;
        const mainImage = photosList[mainIndex] || photosList[0] || defaultImages[idx % defaultImages.length];

        return {
          id: String(h.hall_id),
          hall_id: h.hall_id,
          name: h.hall_name,
          basePriceUGX: Number(h.full_day_rate || h.hourly_rate || 500000),
          basePriceUSD: Math.round(Number(h.full_day_rate || h.hourly_rate || 500000) / 3700),
          capacity: h.capacity,
          description: h.description || '',
          amenities: h.amenities || '',
          image: mainImage,
          photos: photosList,
          main_photo_index: mainIndex,
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
        
        let statusMapped: 'Pending' | 'Approved' | 'Declined' = 'Pending';
        if (r.reservation_status === 'Approved' || r.reservation_status === 'Confirmed') {
          statusMapped = 'Approved';
        } else if (r.reservation_status === 'Declined' || r.reservation_status === 'Cancelled' || r.reservation_status === 'Rejected') {
          statusMapped = 'Declined';
        }
        
        let totalCost = Number(r.total_amount || 0);
        if (totalCost === 0 && r.special_requests) {
          const matches = r.special_requests.match(/UGX\s*([\d,]+|\d+k(?:\/head)?)/gi);
          if (matches) {
            let parsedSum = 0;
            for (const m of matches) {
              const valStr = m.replace(/UGX\s*/i, '').trim();
              if (valStr.includes('k')) {
                const num = parseFloat(valStr.replace(/k.*$/i, '')) * 1000;
                if (valStr.includes('/head')) {
                  parsedSum += num * (r.num_participants || 1);
                } else {
                  parsedSum += num;
                }
              } else {
                parsedSum += parseFloat(valStr.replace(/,/g, '')) || 0;
              }
            }
            if (parsedSum > 0) totalCost = parsedSum;
          }
        }
        if (totalCost === 0 && r.hall?.standard_price) {
          totalCost = Number(r.hall.standard_price);
        }

        const amtPaid = Number(r.amount_paid || 0);
        const balDue = r.balance_due !== undefined && Number(r.balance_due) > 0 ? Number(r.balance_due) : Math.max(0, totalCost - amtPaid);

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
          totalCostUGX: totalCost,
          status: statusMapped,
          date: r.event_start_date || r.event_date || 'N/A',
          paymentStatus: r.payment_status || (amtPaid >= totalCost && totalCost > 0 ? 'Paid' : (amtPaid > 0 ? 'PartiallyPaid' : 'Pending')),
          amountPaid: amtPaid,
          balanceDue: balDue,
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

      // 4. Fetch events
      let eventsRes = await api.get('/conference/events');
      if (eventsRes.data.length === 0) {
        const defaultEvents = [
          {
            event_name: 'Seyeya Riverfront Gala & Wine Tasting',
            description: 'An exquisite evening of wine tasting, gourmet dining, and live acoustic music by the Nile.',
            photo_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600',
            price: 350000,
            discount: 50000,
            location: 'Nile River Deck',
            capacity: 150,
            is_active: true
          },
          {
            event_name: 'Annual Corporate Leadership Summit',
            description: 'Full-day executive retreat featuring keynotes, breakout strategy rooms, and buffet catering.',
            photo_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
            price: 1200000,
            discount: 150000,
            location: 'Grand Nile Ballroom',
            capacity: 250,
            is_active: true
          },
          {
            event_name: 'Sunset Acoustic Concert & BBQ Party',
            description: 'Unwind with grilled Nile tilapia, craft cocktails, and sunset acoustic sessions.',
            photo_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
            price: 180000,
            discount: 20000,
            location: 'Seyeya Sunset Lawn',
            capacity: 300,
            is_active: true
          }
        ];

        for (const dev of defaultEvents) {
          try {
            await api.post('/conference/events', dev);
          } catch (err) {
            console.error("Failed to seed default event", err);
          }
        }
        eventsRes = await api.get('/conference/events');
      }

      const mappedEvents = eventsRes.data.map((ev: any) => ({
        id: String(ev.event_id),
        event_id: ev.event_id,
        event_name: ev.event_name,
        description: ev.description || '',
        photo_url: ev.photo_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400',
        price: Number(ev.price || 0),
        discount: Number(ev.discount || 0),
        event_date: ev.event_date ? ev.event_date.split('T')[0] : '',
        location: ev.location || 'Seyeya Main Gardens',
        capacity: ev.capacity || 100,
        is_active: ev.is_active !== false,
        created_at: ev.created_at
      }));
      setEvents(mappedEvents);

      // 5. Fetch facility categories & facilities
      try {
        let catRes = await api.get('/conference/facility-categories');
        if (!catRes.data || catRes.data.length === 0) {
          const defaultCategories = [
            { name: 'Audio & Visual', description: 'Sound systems, wireless mics, HD projectors, and digital displays', icon_name: 'Volume2' },
            { name: 'Catering & Refreshments', description: 'Break tea, executive lunch buffets, coffee stations, and dining options', icon_name: 'Coffee' },
            { name: 'Seating & Setup', description: 'Banquet tables, executive speaker podiums, stage platforms, and seating', icon_name: 'Users' },
            { name: 'Connectivity & Utilities', description: 'High-speed fiber WiFi, AC cooling, and standby generator power', icon_name: 'Zap' },
            { name: 'General Services', description: 'Event coordination, stationery, decor accents, and security', icon_name: 'Sparkles' }
          ];
          for (const dc of defaultCategories) {
            try {
              await api.post('/conference/facility-categories', dc);
            } catch (err) {
              console.error("Failed to seed facility category", dc.name, err);
            }
          }
          catRes = await api.get('/conference/facility-categories');
        }
        setFacilityCategories(catRes.data || []);
      } catch (catErr) {
        console.error("Failed to fetch facility categories", catErr);
      }

      let facilitiesRes = await api.get('/conference/facilities');
      if (!facilitiesRes.data || facilitiesRes.data.length === 0) {
        // Auto-seed default facilities
        const defaultFacs = [
          { name: 'PA Sound System & Wireless Mics', category: 'Audio & Visual', description: 'High-definition 4-channel sound system with wireless lapel and handheld mics', icon_name: 'Volume2', price: 300000, pricing_type: 'FIXED' },
          { name: 'HD Laser Projector & 4K Screen', category: 'Audio & Visual', description: 'Ultra-bright 5000 lumen laser projector with motor-driven retractable screen', icon_name: 'Video', price: 150000, pricing_type: 'FIXED' },
          { name: 'Executive Break Tea & Pastries', category: 'Catering & Refreshments', description: 'Freshly brewed Ugandan coffee, herbal teas, gourmet pastries & fruit platters', icon_name: 'Coffee', price: 25000, pricing_type: 'PER_PERSON' },
          { name: 'Nile View Grand Buffet Lunch', category: 'Catering & Refreshments', description: '3-course buffet lunch with soft drink / mineral water for conference delegates', icon_name: 'Utensils', price: 55000, pricing_type: 'PER_PERSON' },
          { name: 'High-Speed Fiber WiFi Network', category: 'Connectivity & Utilities', description: 'Dedicated high-speed 100Mbps dedicated fiber connectivity for all attendees', icon_name: 'Wifi', price: 0, pricing_type: 'INCLUDED' },
          { name: 'Executive Speaker Podium & Stage', category: 'Seating & Setup', description: 'Elevated presentation stage platform with wooden podium and gooseneck mic', icon_name: 'Mic', price: 50000, pricing_type: 'FIXED' }
        ];
        for (const df of defaultFacs) {
          try {
            await api.post('/conference/facilities', df);
          } catch (err) {
            console.error("Failed to seed facility", df.name, err);
          }
        }
        facilitiesRes = await api.get('/conference/facilities');
      }

      const mappedFacilities = facilitiesRes.data.map((fac: any) => ({
        id: String(fac.facility_id),
        facility_id: fac.facility_id,
        name: fac.name,
        category_id: fac.category_id,
        category: fac.category_relation?.name || fac.category || 'General Services',
        description: fac.description || '',
        icon_name: fac.icon_name || 'Sparkles',
        is_active: fac.is_active !== false,
        price: Number(fac.price || 0),
        pricing_type: fac.pricing_type || 'FIXED'
      }));
      setFacilities(mappedFacilities);
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
    is_vat_inclusive?: boolean;
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
        amenities: hallData.amenities || '',
        is_vat_inclusive: hallData.is_vat_inclusive ?? true
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

  const updateConferenceHall = async (id: string | number, hallData: {
    hall_name?: string;
    capacity?: number;
    standard_price?: number;
    hourly_rate?: number;
    half_day_rate?: number;
    full_day_rate?: number;
    description?: string;
    amenities?: string;
    image?: string;
    photos?: string[];
    main_photo_index?: number;
    is_vat_inclusive?: boolean;
  }) => {
    setIsLoading(true);
    const numericId = typeof id === 'number' ? id : (parseInt(String(id).replace(/\D/g, ''), 10) || id);
    const mainImg = hallData.image || (hallData.photos && hallData.photos.length > 0 ? hallData.photos[hallData.main_photo_index || 0] : undefined);
    try {
      await api.put(`/conference/halls/${numericId}`, {
        hall_name: hallData.hall_name,
        capacity: hallData.capacity ? Number(hallData.capacity) : undefined,
        standard_price: hallData.standard_price !== undefined ? Number(hallData.standard_price) : undefined,
        full_day_rate: hallData.standard_price !== undefined ? Number(hallData.standard_price) : undefined,
        description: hallData.description,
        amenities: hallData.amenities,
        image: mainImg,
        photos: hallData.photos,
        main_photo_index: hallData.main_photo_index,
        is_vat_inclusive: hallData.is_vat_inclusive
      });
      await fetchConferenceData();
      addNotification('Conference Hall Updated', 'Updated hall details successfully.', 'event');
    } catch (e) {
      console.error("Failed to update hall", e);
      setHalls(prev => prev.map(h => (h.id === String(id) || h.hall_id === numericId) ? {
        ...h,
        name: hallData.hall_name ?? h.name,
        capacity: hallData.capacity ?? h.capacity,
        basePriceUGX: hallData.standard_price ?? h.basePriceUGX,
        description: hallData.description ?? h.description,
        amenities: hallData.amenities ?? h.amenities,
        photos: hallData.photos ?? h.photos,
        main_photo_index: hallData.main_photo_index ?? h.main_photo_index,
        image: mainImg ?? h.image
      } : h));
      addNotification('Conference Hall Updated', 'Updated hall details locally.', 'event');
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
    hall_standard_price?: number;
    subtotal?: number;
    total_amount?: number;
    amount_paid?: number;
    balance_due?: number;
    payment_responsibility?: string;
    facilities?: Array<{ facility_id: number; quantity?: number; unit_price?: number; total_price?: number }>;
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

      const eventDateVal = data.event_date || (data as any).event_start_date || new Date().toISOString().split('T')[0];

      const payload = {
        customer_id: customerId,
        hall_id: Number(data.hall_id),
        event_name: data.event_name,
        event_start_date: eventDateVal,
        event_end_date: (data as any).event_end_date || eventDateVal,
        start_time: data.start_time.includes(':') && data.start_time.split(':').length === 2 ? `${data.start_time}:00` : data.start_time,
        end_time: data.end_time.includes(':') && data.end_time.split(':').length === 2 ? `${data.end_time}:00` : data.end_time,
        num_participants: Number(data.num_participants),
        booking_type: data.booking_type || "Standard",
        special_requests: specialReqStr.trim() || undefined,
        resources: selectedResources,
        meals: selectedMeals,
        hall_standard_price: data.hall_standard_price,
        subtotal: data.subtotal,
        total_amount: data.total_amount,
        amount_paid: data.amount_paid || 0,
        balance_due: data.balance_due,
        payment_responsibility: data.payment_responsibility || "Individual",
        facilities: data.facilities
      };

      await api.post('/conference/reservations', payload);
      await fetchConferenceData();
      addNotification('Reservation Created', `Reservation for ${data.event_name} successfully placed.`, 'event');
    } catch (e: any) {
      console.error("Failed to create reservation", e);
      const serverMsg = e.response?.data?.detail || 'Failed to create reservation';
      addNotification('Booking Conflict / Error', serverMsg, 'event');
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

  const safeIsoDate = (d?: string) => {
    if (!d || typeof d !== 'string' || !d.trim()) return undefined;
    const parsed = Date.parse(d);
    return isNaN(parsed) ? undefined : new Date(parsed).toISOString();
  };

  const addEvent = async (eventData: {
    event_name: string;
    description?: string;
    photo_url?: string;
    price: number;
    discount?: number;
    event_date?: string;
    location?: string;
    capacity?: number;
    is_active?: boolean;
  }) => {
    setIsLoading(true);
    try {
      await api.post('/conference/events', {
        event_name: eventData.event_name,
        description: eventData.description || '',
        photo_url: eventData.photo_url || '',
        price: Number(eventData.price),
        discount: Number(eventData.discount || 0),
        event_date: safeIsoDate(eventData.event_date),
        location: eventData.location || '',
        capacity: eventData.capacity ? Number(eventData.capacity) : undefined,
        is_active: eventData.is_active !== false
      });
      await fetchConferenceData();
      addNotification('Event Created', `Created new event: ${eventData.event_name}`, 'event');
    } catch (e: any) {
      console.error("Failed to add event", e);
      addNotification('Error', 'Failed to create event', 'event');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvent = async (id: string | number, eventData: {
    event_name?: string;
    description?: string;
    photo_url?: string;
    price?: number;
    discount?: number;
    event_date?: string;
    location?: string;
    capacity?: number;
    is_active?: boolean;
  }) => {
    setIsLoading(true);
    const numericId = typeof id === 'number' ? id : (parseInt(String(id).replace(/\D/g, ''), 10) || id);
    try {
      await api.put(`/conference/events/${numericId}`, {
        event_name: eventData.event_name,
        description: eventData.description,
        photo_url: eventData.photo_url,
        price: eventData.price !== undefined ? Number(eventData.price) : undefined,
        discount: eventData.discount !== undefined ? Number(eventData.discount) : undefined,
        event_date: safeIsoDate(eventData.event_date),
        location: eventData.location,
        capacity: eventData.capacity !== undefined ? Number(eventData.capacity) : undefined,
        is_active: eventData.is_active
      });
      await fetchConferenceData();
      addNotification('Event Updated', 'Successfully updated event details', 'event');
    } catch (e: any) {
      console.error("Failed to update event", e);
      // Fallback local update for UI responsiveness
      setEvents(prev => prev.map(item => (item.id === String(id) || item.event_id === numericId) ? {
        ...item,
        event_name: eventData.event_name ?? item.event_name,
        description: eventData.description ?? item.description,
        photo_url: eventData.photo_url ?? item.photo_url,
        price: eventData.price !== undefined ? Number(eventData.price) : item.price,
        discount: eventData.discount !== undefined ? Number(eventData.discount) : item.discount,
        event_date: eventData.event_date ?? item.event_date,
        location: eventData.location ?? item.location,
        capacity: eventData.capacity !== undefined ? Number(eventData.capacity) : item.capacity,
        is_active: eventData.is_active !== undefined ? eventData.is_active : item.is_active
      } : item));
      addNotification('Event Updated', 'Updated event details locally', 'event');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (id: string | number) => {
    setIsLoading(true);
    const numericId = typeof id === 'number' ? id : (parseInt(String(id).replace(/\D/g, ''), 10) || id);
    try {
      await api.delete(`/conference/events/${numericId}`);
      await fetchConferenceData();
      addNotification('Event Deleted', 'Event package has been removed', 'event');
    } catch (e: any) {
      console.error("Failed to delete event", e);
      setEvents(prev => prev.filter(item => item.id !== String(id) && item.event_id !== numericId));
      addNotification('Event Deleted', 'Removed event package locally', 'event');
    } finally {
      setIsLoading(false);
    }
  };

  const addFacility = async (facilityData: {
    name: string;
    category_id?: number;
    category?: string;
    description?: string;
    icon_name?: string;
    is_active?: boolean;
    price?: number;
    pricing_type?: string;
  }) => {
    setIsLoading(true);
    try {
      await api.post('/conference/facilities', {
        name: facilityData.name,
        category_id: facilityData.category_id,
        category: facilityData.category || 'General Services',
        description: facilityData.description || '',
        icon_name: facilityData.icon_name || 'Sparkles',
        is_active: facilityData.is_active !== false,
        price: Number(facilityData.price || 0),
        pricing_type: facilityData.pricing_type || 'FIXED'
      });
      await fetchConferenceData();
      addNotification('Facility Created', `Added new facility: ${facilityData.name}`, 'event');
    } catch (e: any) {
      console.error("Failed to add facility", e);
      addNotification('Error', 'Failed to create facility option', 'event');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFacility = async (id: string | number, facilityData: {
    name?: string;
    category_id?: number;
    category?: string;
    description?: string;
    icon_name?: string;
    is_active?: boolean;
    price?: number;
    pricing_type?: string;
  }) => {
    setIsLoading(true);
    const numericId = typeof id === 'number' ? id : (parseInt(String(id).replace(/\D/g, ''), 10) || id);
    try {
      await api.put(`/conference/facilities/${numericId}`, facilityData);
      await fetchConferenceData();
      addNotification('Facility Updated', 'Successfully updated facility details', 'event');
    } catch (e: any) {
      console.error("Failed to update facility", e);
      setFacilities(prev => prev.map(item => (item.id === String(id) || item.facility_id === numericId) ? {
        ...item,
        name: facilityData.name ?? item.name,
        category_id: facilityData.category_id !== undefined ? facilityData.category_id : item.category_id,
        category: facilityData.category ?? item.category,
        description: facilityData.description ?? item.description,
        icon_name: facilityData.icon_name ?? item.icon_name,
        is_active: facilityData.is_active !== undefined ? facilityData.is_active : item.is_active,
        price: facilityData.price !== undefined ? Number(facilityData.price) : item.price,
        pricing_type: facilityData.pricing_type ?? item.pricing_type
      } : item));
      addNotification('Facility Updated', 'Updated facility details locally', 'event');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFacility = async (id: string | number) => {
    setIsLoading(true);
    const numericId = typeof id === 'number' ? id : (parseInt(String(id).replace(/\D/g, ''), 10) || id);
    try {
      await api.delete(`/conference/facilities/${numericId}`);
      await fetchConferenceData();
      addNotification('Facility Removed', 'Facility option has been deleted', 'event');
    } catch (e: any) {
      console.error("Failed to delete facility", e);
      setFacilities(prev => prev.filter(item => item.id !== String(id) && item.facility_id !== numericId));
      addNotification('Facility Removed', 'Removed facility option locally', 'event');
    } finally {
      setIsLoading(false);
    }
  };

  // Facility Categories API functions
  const addFacilityCategory = async (categoryData: {
    name: string;
    description?: string;
    icon_name?: string;
    is_active?: boolean;
    facility_ids?: number[];
  }) => {
    setIsLoading(true);
    try {
      const createdRes = await api.post('/conference/facility-categories', {
        name: categoryData.name,
        description: categoryData.description || '',
        icon_name: categoryData.icon_name || 'Folder',
        is_active: categoryData.is_active !== false
      });

      const newCategoryId = createdRes.data?.id;
      if (newCategoryId && categoryData.facility_ids && categoryData.facility_ids.length > 0) {
        await api.post(`/conference/facility-categories/${newCategoryId}/facilities`, {
          facility_ids: categoryData.facility_ids
        });
      }

      await fetchConferenceData();
      addNotification('Category Created', `Created facility category: ${categoryData.name}`, 'event');
    } catch (e: any) {
      console.error("Failed to add facility category", e);
      const errMsg = e.response?.data?.detail || 'Failed to create facility category';
      addNotification('Error', errMsg, 'event');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFacilityCategory = async (id: number, categoryData: {
    name?: string;
    description?: string;
    icon_name?: string;
    is_active?: boolean;
    facility_ids?: number[];
  }) => {
    setIsLoading(true);
    try {
      await api.put(`/conference/facility-categories/${id}`, {
        name: categoryData.name,
        description: categoryData.description,
        icon_name: categoryData.icon_name,
        is_active: categoryData.is_active
      });

      if (categoryData.facility_ids !== undefined) {
        await api.post(`/conference/facility-categories/${id}/facilities`, {
          facility_ids: categoryData.facility_ids
        });
      }

      await fetchConferenceData();
      addNotification('Category Updated', 'Successfully updated category details', 'event');
    } catch (e: any) {
      console.error("Failed to update facility category", e);
      const errMsg = e.response?.data?.detail || 'Failed to update category';
      addNotification('Error', errMsg, 'event');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFacilityCategory = async (id: number) => {
    setIsLoading(true);
    try {
      await api.delete(`/conference/facility-categories/${id}`);
      await fetchConferenceData();
      addNotification('Category Deleted', 'Facility category removed successfully', 'event');
    } catch (e: any) {
      console.error("Failed to delete facility category", e);
      addNotification('Error', 'Failed to delete category', 'event');
    } finally {
      setIsLoading(false);
    }
  };

  const assignSingleFacilityToCategory = async (categoryId: number, facilityId: number) => {
    setIsLoading(true);
    try {
      await api.post(`/conference/facility-categories/${categoryId}/facilities/${facilityId}`);
      await fetchConferenceData();
      addNotification('Facility Assigned', 'Assigned facility to category', 'event');
    } catch (e: any) {
      console.error("Failed to assign facility to category", e);
      addNotification('Error', 'Failed to assign facility to category', 'event');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFacilityFromCategory = async (categoryId: number, facilityId: number) => {
    setIsLoading(true);
    try {
      await api.delete(`/conference/facility-categories/${categoryId}/facilities/${facilityId}`);
      await fetchConferenceData();
      addNotification('Facility Unassigned', 'Removed facility from category', 'event');
    } catch (e: any) {
      console.error("Failed to remove facility from category", e);
      addNotification('Error', 'Failed to remove facility from category', 'event');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    halls,
    quotes,
    events,
    facilities,
    facilityCategories,
    isLoading,
    calculateQuoteCost,
    requestQuote,
    updateQuoteStatus,
    addConferenceHall,
    updateConferenceHall,
    addEvent,
    updateEvent,
    deleteEvent,
    addFacility,
    updateFacility,
    deleteFacility,
    addFacilityCategory,
    updateFacilityCategory,
    deleteFacilityCategory,
    assignSingleFacilityToCategory,
    removeFacilityFromCategory,
    fetchConferenceData,
    customers,
    createReservation
  };
};
