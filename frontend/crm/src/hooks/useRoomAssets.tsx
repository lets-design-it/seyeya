import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wifi, 
  Wind, 
  Waves, 
  Tv, 
  Wine, 
  Coffee, 
  Eye, 
  Bath, 
  Sparkles, 
  Utensils, 
  ConciergeBell, 
  ShieldCheck, 
  Dumbbell, 
  Car, 
  Bed, 
  Phone, 
  UtensilsCrossed, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  CigaretteOff, 
  Dog, 
  Baby, 
  VolumeX, 
  ShieldAlert, 
  CreditCard, 
  FileText, 
  Trees, 
  Sun, 
  Mountain, 
  Flame, 
  DoorOpen, 
  Maximize, 
  BedDouble, 
  Shield 
} from 'lucide-react';

export interface RoomAmenity {
  id: string;
  name: string;
  category: 'Connectivity' | 'Comfort' | 'Wellness' | 'Food & Drink' | 'Views' | 'Entertainment' | 'Services' | 'General';
  description?: string;
  iconName: string;
  isActive: boolean;
}

export interface RoomPolicy {
  id: string;
  title: string;
  category: 'Check-in/out' | 'Cancellation' | 'Smoking' | 'Pets' | 'Children & Beds' | 'Noise' | 'Deposit' | 'General';
  description: string;
  iconName: string;
  isActive: boolean;
}

const DEFAULT_AMENITIES: RoomAmenity[] = [
  {
    id: 'am-1',
    name: 'Free High-Speed Wi-Fi',
    category: 'Connectivity',
    description: 'Complimentary high-speed fiber optic wireless internet connection in all cottage units.',
    iconName: 'wifi',
    isActive: true
  },
  {
    id: 'am-2',
    name: 'Air Conditioning',
    category: 'Comfort',
    description: 'Individual climate control air conditioning with remote.',
    iconName: 'wind',
    isActive: true
  },
  {
    id: 'am-3',
    name: 'Private Jacuzzi & Hot Tub',
    category: 'Wellness',
    description: 'En-suite hydrotherapy private massage jacuzzi bath.',
    iconName: 'bath',
    isActive: true
  },
  {
    id: 'am-4',
    name: 'Swimming Pool Access',
    category: 'Wellness',
    description: 'Access to the hotel infinity outdoor pool overlooking the Nile.',
    iconName: 'waves',
    isActive: true
  },
  {
    id: 'am-5',
    name: 'Smart Flat-Screen TV',
    category: 'Entertainment',
    description: '55" Ultra HD Smart TV with satellite channels and streaming apps.',
    iconName: 'tv',
    isActive: true
  },
  {
    id: 'am-6',
    name: 'Mini Bar & Refreshments',
    category: 'Food & Drink',
    description: 'Stocked mini refrigerator with soft drinks, wine, and local snacks.',
    iconName: 'wine',
    isActive: true
  },
  {
    id: 'am-7',
    name: 'Panoramic Nile River View',
    category: 'Views',
    description: 'Unobstructed scenic balcony views of River Nile and lush tropical gardens.',
    iconName: 'eye',
    isActive: true
  },
  {
    id: 'am-8',
    name: 'Espresso & Coffee Maker',
    category: 'Food & Drink',
    description: 'Premium coffee machine with complimentary roast coffee and tea pods.',
    iconName: 'coffee',
    isActive: true
  },
  {
    id: 'am-9',
    name: '24/7 Room Service',
    category: 'Services',
    description: 'Round-the-clock room service dining and bellhop support.',
    iconName: 'conciergebell',
    isActive: true
  },
  {
    id: 'am-10',
    name: 'In-Room Digital Safe',
    category: 'Comfort',
    description: 'Secure laptop-size electronic digital safe vault.',
    iconName: 'shieldcheck',
    isActive: true
  },
  {
    id: 'am-11',
    name: 'King Size Deluxe Bed',
    category: 'Comfort',
    description: 'Plush orthopaedic king mattress with 400 thread count Egyptian cotton linen.',
    iconName: 'bed',
    isActive: true
  },
  {
    id: 'am-12',
    name: 'Free Valet Parking',
    category: 'Services',
    description: 'Dedicated covered parking space with 24-hour security.',
    iconName: 'car',
    isActive: true
  }
];

const DEFAULT_POLICIES: RoomPolicy[] = [
  {
    id: 'pol-1',
    title: 'Check-in & Check-out Hours',
    category: 'Check-in/out',
    description: 'Check-in begins at 14:00 (2:00 PM). Check-out time is until 10:00 AM. Early check-in or late check-out is subject to availability and extra fees.',
    iconName: 'clock',
    isActive: true
  },
  {
    id: 'pol-2',
    title: 'Free Cancellation Policy',
    category: 'Cancellation',
    description: 'Free cancellation up to 48 hours prior to check-in date. Cancellations made within 48 hours incur a 1-night room charge.',
    iconName: 'xcircle',
    isActive: true
  },
  {
    id: 'pol-3',
    title: 'Strict Non-Smoking Policy',
    category: 'Smoking',
    description: 'All indoor rooms and cottages are 100% non-smoking. Designated outdoor smoking areas are available.',
    iconName: 'cigaretteoff',
    isActive: true
  },
  {
    id: 'pol-4',
    title: 'Pet Friendly Policy',
    category: 'Pets',
    description: 'Small trained pets (under 10kg) welcome upon prior notice. Additional pet cleaning fee applies.',
    iconName: 'dog',
    isActive: true
  },
  {
    id: 'pol-5',
    title: 'Children & Extra Beds Policy',
    category: 'Children & Beds',
    description: 'Children under 6 stay free when using existing bedding. Extra single rollaway beds available for UGX 50,000 / night.',
    iconName: 'baby',
    isActive: true
  },
  {
    id: 'pol-6',
    title: 'Quiet Hours & Noise Limits',
    category: 'Noise',
    description: 'Quiet hours enforced between 22:00 (10:00 PM) and 07:00 AM in accommodation cottage zones.',
    iconName: 'volumex',
    isActive: true
  },
  {
    id: 'pol-7',
    title: 'Security Deposit Requirement',
    category: 'Deposit',
    description: 'Refundable security damage deposit of UGX 100,000 required at check-in via mobile money or card.',
    iconName: 'shieldalert',
    isActive: true
  }
];

export const autoDetectAmenityIcon = (name: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('wifi') || n.includes('internet') || n.includes('wireless')) return 'wifi';
  if (n.includes('air') || n.includes('ac') || n.includes('cool') || n.includes('climate') || n.includes('fan')) return 'wind';
  if (n.includes('pool') || n.includes('swim') || n.includes('water')) return 'waves';
  if (n.includes('tv') || n.includes('screen') || n.includes('cable') || n.includes('television')) return 'tv';
  if (n.includes('bar') || n.includes('drink') || n.includes('wine') || n.includes('cocktail')) return 'wine';
  if (n.includes('coffee') || n.includes('tea') || n.includes('espresso')) return 'coffee';
  if (n.includes('view') || n.includes('nile') || n.includes('garden') || n.includes('lake') || n.includes('scenic')) return 'eye';
  if (n.includes('jacuzzi') || n.includes('bath') || n.includes('spa') || n.includes('hot tub') || n.includes('shower')) return 'bath';
  if (n.includes('breakfast') || n.includes('meal') || n.includes('food') || n.includes('dining')) return 'utensils';
  if (n.includes('service') || n.includes('bell') || n.includes('housekeeping')) return 'conciergebell';
  if (n.includes('safe') || n.includes('lock') || n.includes('vault') || n.includes('secu')) return 'shieldcheck';
  if (n.includes('gym') || n.includes('fitness') || n.includes('workout')) return 'dumbbell';
  if (n.includes('parking') || n.includes('car') || n.includes('garage')) return 'car';
  if (n.includes('bed') || n.includes('king') || n.includes('queen') || n.includes('cot')) return 'bed';
  if (n.includes('phone') || n.includes('intercom')) return 'phone';
  if (n.includes('kitchen') || n.includes('fridge') || n.includes('microwave')) return 'utensilscrossed';
  if (n.includes('balcony') || n.includes('terrace') || n.includes('patio')) return 'dooropen';
  return 'sparkles';
};

export const autoDetectPolicyIcon = (title: string): string => {
  const t = (title || '').toLowerCase();
  if (t.includes('check-in') || t.includes('check-out') || t.includes('time') || t.includes('hour') || t.includes('schedule')) return 'clock';
  if (t.includes('cancel') || t.includes('refund') || t.includes('booking')) return 'xcircle';
  if (t.includes('smoke') || t.includes('smoking') || t.includes('vape') || t.includes('tobacco')) return 'cigaretteoff';
  if (t.includes('pet') || t.includes('dog') || t.includes('cat') || t.includes('animal')) return 'dog';
  if (t.includes('child') || t.includes('kid') || t.includes('baby') || t.includes('bed') || t.includes('occupancy')) return 'baby';
  if (t.includes('noise') || t.includes('quiet') || t.includes('party') || t.includes('music') || t.includes('silent')) return 'volumex';
  if (t.includes('damage') || t.includes('deposit') || t.includes('fine') || t.includes('charge') || t.includes('security')) return 'shieldalert';
  if (t.includes('pay') || t.includes('card') || t.includes('cash') || t.includes('money')) return 'creditcard';
  return 'filetext';
};

export const renderAssetIcon = (iconName: string, className = "h-4 w-4"): React.ReactElement => {
  const key = (iconName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  switch (key) {
    case 'wifi': return <Wifi className={className} />;
    case 'wind': return <Wind className={className} />;
    case 'waves': return <Waves className={className} />;
    case 'tv': return <Tv className={className} />;
    case 'wine': return <Wine className={className} />;
    case 'coffee': return <Coffee className={className} />;
    case 'eye': return <Eye className={className} />;
    case 'bath': return <Bath className={className} />;
    case 'sparkles': return <Sparkles className={className} />;
    case 'utensils': return <Utensils className={className} />;
    case 'conciergebell': return <ConciergeBell className={className} />;
    case 'shieldcheck': return <ShieldCheck className={className} />;
    case 'dumbbell': return <Dumbbell className={className} />;
    case 'car': return <Car className={className} />;
    case 'bed': return <Bed className={className} />;
    case 'phone': return <Phone className={className} />;
    case 'utensilscrossed': return <UtensilsCrossed className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'xcircle': return <XCircle className={className} />;
    case 'cigaretteoff': return <CigaretteOff className={className} />;
    case 'dog': return <Dog className={className} />;
    case 'baby': return <Baby className={className} />;
    case 'volumex': return <VolumeX className={className} />;
    case 'shieldalert': return <ShieldAlert className={className} />;
    case 'creditcard': return <CreditCard className={className} />;
    case 'trees': return <Trees className={className} />;
    case 'sun': return <Sun className={className} />;
    case 'mountain': return <Mountain className={className} />;
    case 'dooropen': return <DoorOpen className={className} />;
    default: return <Sparkles className={className} />;
  }
};

import { api } from '../services/api';

const extractCategoryString = (cat: any, defaultVal = 'General'): string => {
  if (typeof cat === 'string' && cat.trim() !== '') return cat;
  if (typeof cat === 'object' && cat !== null && cat.name) return String(cat.name);
  return defaultVal;
};

export const useRoomAssets = () => {
  const [amenities, setAmenities] = useState<RoomAmenity[]>(() => {
    const saved = localStorage.getItem('seyeya_room_amenities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            category: extractCategoryString(item.category, 'General')
          }));
        }
      } catch (e) {}
    }
    return DEFAULT_AMENITIES;
  });

  const [policies, setPolicies] = useState<RoomPolicy[]>(() => {
    const saved = localStorage.getItem('seyeya_room_policies');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            category: extractCategoryString(item.category, 'General')
          }));
        }
      } catch (e) {}
    }
    return DEFAULT_POLICIES;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch Amenities from Backend API
  const fetchAmenities = useCallback(async () => {
    try {
      const res = await api.get('/accommodation/amenities');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped: RoomAmenity[] = res.data.map((item: any) => ({
          id: String(item.amenity_id),
          name: item.name,
          category: extractCategoryString(item.category, 'General') as any,
          description: item.description || '',
          iconName: item.icon || autoDetectAmenityIcon(item.name),
          isActive: item.is_active !== false
        }));
        setAmenities(mapped);
      }
    } catch (err) {
      console.warn("Backend amenities fetch warning, using local state:", err);
    }
  }, []);

  // Fetch Policies from Backend API
  const fetchPolicies = useCallback(async () => {
    try {
      const res = await api.get('/accommodation/policies');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped: RoomPolicy[] = res.data.map((item: any) => ({
          id: String(item.policy_id),
          title: item.title,
          category: extractCategoryString(item.policy_type || item.category, 'General') as any,
          description: item.description || '',
          iconName: autoDetectPolicyIcon(item.title),
          isActive: item.is_active !== false
        }));
        setPolicies(mapped);
      }
    } catch (err) {
      console.warn("Backend policies fetch warning, using local state:", err);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchAmenities(), fetchPolicies()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchAmenities, fetchPolicies]);

  useEffect(() => {
    localStorage.setItem('seyeya_room_amenities', JSON.stringify(amenities));
  }, [amenities]);

  useEffect(() => {
    localStorage.setItem('seyeya_room_policies', JSON.stringify(policies));
  }, [policies]);

  const addAmenity = async (data: Omit<RoomAmenity, 'id' | 'iconName'> & { iconName?: string }) => {
    const detectedIcon = data.iconName || autoDetectAmenityIcon(data.name);
    const tempId = `am-${Date.now()}`;
    const tempAmenity: RoomAmenity = { ...data, id: tempId, iconName: detectedIcon };

    setAmenities(prev => [tempAmenity, ...prev]);

    try {
      const payload = {
        name: data.name,
        category: data.category,
        description: data.description || '',
        icon: detectedIcon,
        is_active: data.isActive
      };
      const res = await api.post('/accommodation/amenities', payload);
      if (res.data && res.data.amenity_id) {
        const created: RoomAmenity = {
          id: String(res.data.amenity_id),
          name: res.data.name,
          category: extractCategoryString(res.data.category, data.category) as any,
          description: res.data.description || '',
          iconName: res.data.icon || detectedIcon,
          isActive: res.data.is_active !== false
        };
        setAmenities(prev => prev.map(a => a.id === tempId ? created : a));
        return created;
      }
    } catch (err) {
      console.warn("Backend amenity creation failed, stored locally:", err);
    }
    return tempAmenity;
  };

  const updateAmenity = async (id: string, data: Partial<RoomAmenity>) => {
    setAmenities(prev => prev.map(a => {
      if (a.id === id) {
        const updatedName = data.name !== undefined ? data.name : a.name;
        const iconName = data.iconName || autoDetectAmenityIcon(updatedName);
        return { ...a, ...data, iconName };
      }
      return a;
    }));

    const numericId = parseInt(id, 10);
    if (!isNaN(numericId) && numericId > 0) {
      try {
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.category !== undefined) payload.category = data.category;
        if (data.description !== undefined) payload.description = data.description;
        if (data.iconName !== undefined) payload.icon = data.iconName;
        if (data.isActive !== undefined) payload.is_active = data.isActive;

        await api.put(`/accommodation/amenities/${numericId}`, payload);
      } catch (err) {
        console.warn("Backend amenity update failed:", err);
      }
    }
  };

  const deleteAmenity = async (id: string) => {
    setAmenities(prev => prev.filter(a => a.id !== id));
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId) && numericId > 0) {
      try {
        await api.delete(`/accommodation/amenities/${numericId}`);
      } catch (err) {
        console.warn("Backend amenity deletion failed:", err);
      }
    }
  };

  const addPolicy = async (data: Omit<RoomPolicy, 'id' | 'iconName'> & { iconName?: string }) => {
    const detectedIcon = data.iconName || autoDetectPolicyIcon(data.title);
    const tempId = `pol-${Date.now()}`;
    const tempPolicy: RoomPolicy = { ...data, id: tempId, iconName: detectedIcon };

    setPolicies(prev => [tempPolicy, ...prev]);

    try {
      const payload = {
        policy_type: data.category,
        title: data.title,
        description: data.description,
        is_active: data.isActive
      };
      const res = await api.post('/accommodation/policies', payload);
      if (res.data && res.data.policy_id) {
        const created: RoomPolicy = {
          id: String(res.data.policy_id),
          title: res.data.title,
          category: res.data.policy_type || data.category,
          description: res.data.description || '',
          iconName: autoDetectPolicyIcon(res.data.title),
          isActive: res.data.is_active !== false
        };
        setPolicies(prev => prev.map(p => p.id === tempId ? created : p));
        return created;
      }
    } catch (err) {
      console.warn("Backend policy creation failed, stored locally:", err);
    }
    return tempPolicy;
  };

  const updatePolicy = async (id: string, data: Partial<RoomPolicy>) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updatedTitle = data.title !== undefined ? data.title : p.title;
        const iconName = data.iconName || autoDetectPolicyIcon(updatedTitle);
        return { ...p, ...data, iconName };
      }
      return p;
    }));

    const numericId = parseInt(id, 10);
    if (!isNaN(numericId) && numericId > 0) {
      try {
        const payload: any = {};
        if (data.category !== undefined) payload.policy_type = data.category;
        if (data.title !== undefined) payload.title = data.title;
        if (data.description !== undefined) payload.description = data.description;
        if (data.isActive !== undefined) payload.is_active = data.isActive;

        await api.put(`/accommodation/policies/${numericId}`, payload);
      } catch (err) {
        console.warn("Backend policy update failed:", err);
      }
    }
  };

  const deletePolicy = async (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId) && numericId > 0) {
      try {
        await api.delete(`/accommodation/policies/${numericId}`);
      } catch (err) {
        console.warn("Backend policy deletion failed:", err);
      }
    }
  };

  return {
    amenities,
    policies,
    isLoading,
    fetchAmenities,
    fetchPolicies,
    addAmenity,
    updateAmenity,
    deleteAmenity,
    addPolicy,
    updatePolicy,
    deletePolicy,
    renderAssetIcon,
    autoDetectAmenityIcon,
    autoDetectPolicyIcon
  };
};
