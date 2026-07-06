import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

export interface EventHall {
  id: string;
  name: string;
  basePriceUGX: number; // Daily rental cost
  basePriceUSD: number;
  capacity: number;
  description: string;
  image: string;
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
}

const EVENT_HALLS: EventHall[] = [
  {
    id: 'h-1',
    name: 'Nile View Grand Hall',
    basePriceUGX: 1800000,
    basePriceUSD: 480,
    capacity: 250,
    description: 'A massive state-of-the-art indoor hall with floor-to-ceiling glass overlooking the river rapids. Ideal for corporate AGMs and large dinners.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300',
  },
  {
    id: 'h-2',
    name: 'Sunset River Lawn (Outdoor)',
    basePriceUGX: 1200000,
    basePriceUSD: 320,
    capacity: 500,
    description: 'Perfect manicured lawns beside the Nile bend. Excellent for outdoor workshops, brand launches, and cocktails.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300',
  },
  {
    id: 'h-3',
    name: 'Executive River Boardroom',
    basePriceUGX: 500000,
    basePriceUSD: 135,
    capacity: 25,
    description: 'A quiet, sound-insulated air-conditioned private room with conference projection displays and premium chairs.',
    image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=300',
  }
];

const DEFAULT_QUOTES: ConferenceQuote[] = [
  {
    id: 'q-1',
    clientName: 'Sarah Jenkins',
    companyName: 'Stellar Tech Ventures',
    email: 'sarah@stellartech.io',
    hallName: 'Nile View Grand Hall',
    guestsCount: 120,
    daysCount: 2,
    cateringOption: 'Executive Full Day',
    soundSystem: true,
    projector: true,
    totalCostUGX: 11200000, // calculated
    status: 'Approved',
    date: '2026-07-10',
  },
  {
    id: 'q-2',
    clientName: 'David Kojo',
    companyName: 'Apex Health Systems',
    email: 'd.kojo@apexhealth.org',
    hallName: 'Executive River Boardroom',
    guestsCount: 15,
    daysCount: 1,
    cateringOption: 'Standard Breakfast',
    soundSystem: false,
    projector: true,
    totalCostUGX: 1050000,
    status: 'Pending',
    date: '2026-06-28',
  }
];

export const useConference = () => {
  const { addNotification } = useNotification();
  const [quotes, setQuotes] = useState<ConferenceQuote[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('seyeya_crm_conferences');
    if (saved) {
      try {
        setQuotes(JSON.parse(saved));
      } catch (e) {
        setQuotes(DEFAULT_QUOTES);
      }
    } else {
      localStorage.setItem('seyeya_crm_conferences', JSON.stringify(DEFAULT_QUOTES));
      setQuotes(DEFAULT_QUOTES);
    }
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

  const requestQuote = (
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
    const totalCost = calculateQuoteCost(hall, guests, days, catering, sound, proj);
    
    const newQuote: ConferenceQuote = {
      id: `quote-${Date.now()}`,
      clientName,
      companyName,
      email,
      hallName: hall.name,
      guestsCount: guests,
      daysCount: days,
      cateringOption: catering,
      soundSystem: sound,
      projector: proj,
      totalCostUGX: totalCost,
      status: 'Pending',
      date: eventDate,
    };

    const updated = [newQuote, ...quotes];
    setQuotes(updated);
    localStorage.setItem('seyeya_crm_conferences', JSON.stringify(updated));

    // Send real-time notification
    addNotification(
      'Conference Quote Requested',
      `${companyName} requested pricing for ${guests} guests in ${hall.name}`,
      'event'
    );
  };

  const updateQuoteStatus = (quoteId: string, newStatus: ConferenceQuote['status']) => {
    const updated = quotes.map(q => {
      if (q.id === quoteId) {
        return { ...q, status: newStatus };
      }
      return q;
    });
    setQuotes(updated);
    localStorage.setItem('seyeya_crm_conferences', JSON.stringify(updated));
  };

  return {
    halls: EVENT_HALLS,
    quotes,
    calculateQuoteCost,
    requestQuote,
    updateQuoteStatus,
  };
};
