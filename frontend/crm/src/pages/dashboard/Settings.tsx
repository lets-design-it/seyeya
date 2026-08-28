import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, Theme } from '@/context/ThemeContext';
import { useVatRate } from '@/context/VatContext';
import { useCurrency } from '@/context/CurrencyContext';
import { api } from '@/services/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Hotel, 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  Save, 
  Loader2, 
  Globe, 
  MapPin, 
  Check, 
  AlertTriangle,
  Upload,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { RolePermissionsTable } from '@/components/RolePermissionsTable';

type ActiveTab = 'profile' | 'hotel' | 'permissions' | 'theme' | 'notifications';

interface ProfileData {
  full_name: string;
  email: string;
  phone_number: string;
  password?: string;
}

interface HotelData {
  id?: number;
  hotel_name: string;
  description: string;
  phone_number: string;
  alternative_phone_number: string;
  email: string;
  website: string;
  physical_address: string;
  city: string;
  country: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  google_maps_pin: string;
  check_in_time: string;
  check_out_time: string;
  currency: string;
  timezone: string;
  vat_rate: string;
  is_active: boolean;
  facebook_url?: string;
  instagram_url?: string;
  x_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
}

interface DeliveryPricingData {
  pricing_id?: number;
  restaurant_lat: string;
  restaurant_lng: string;
  price_per_km: string;
  minimum_delivery_fee: string;
  maximum_delivery_distance_km: string;
  is_active: boolean;
}

interface NotificationPrefs {
  email_enabled: boolean;
  in_app_enabled: boolean;
  reservation_notifications: boolean;
  order_notifications: boolean;
  payment_notifications: boolean;
  security_notifications: boolean;
  marketing_notifications: boolean;
  system_notifications: boolean;
}

interface SettingsProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  activeTab: propActiveTab, 
  setActiveTab: propSetActiveTab 
}) => {
  const { user, updateUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setVatRate } = useVatRate();
  const { usdRate, setUsdRate, currency, setCurrency } = useCurrency();
  const [exchangeRateInput, setExchangeRateInput] = useState<string>(String(usdRate));
  
  const [localActiveTab, localSetActiveTab] = useState<ActiveTab>('profile');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || localSetActiveTab;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Forms state
  const [profileForm, setProfileForm] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone_number: '',
    password: ''
  });

  const [hotelForm, setHotelForm] = useState<HotelData>({
    hotel_name: '',
    description: '',
    phone_number: '',
    alternative_phone_number: '',
    email: '',
    website: '',
    physical_address: '',
    city: '',
    country: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    google_maps_pin: '',
    check_in_time: '14:00',
    check_out_time: '10:00',
    currency: 'UGX',
    timezone: 'UTC',
    vat_rate: '18.00',
    is_active: true,
    facebook_url: '',
    instagram_url: '',
    x_url: '',
    linkedin_url: '',
    youtube_url: ''
  });
  const [hotelLogo, setHotelLogo] = useState<File | null>(null);
  const [hotelCover, setHotelCover] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');

  const [deliveryPricingForm, setDeliveryPricingForm] = useState<DeliveryPricingData>({
    restaurant_lat: '0.0',
    restaurant_lng: '0.0',
    price_per_km: '0.0',
    minimum_delivery_fee: '0.0',
    maximum_delivery_distance_km: '0.0',
    is_active: true
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    email_enabled: true,
    in_app_enabled: true,
    reservation_notifications: true,
    order_notifications: true,
    payment_notifications: true,
    security_notifications: true,
    marketing_notifications: false,
    system_notifications: true
  });

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'admin' || (user as any)?.roles?.includes('Super Admin');

  // Load current tab data
  useEffect(() => {
    if (activeTab === 'permissions' || activeTab === 'theme') {
      setIsLoading(false);
      return;
    }
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'profile') {
          const res = await api.get('/auth/me');
          setProfileForm({
            full_name: res.data.full_name || '',
            email: res.data.email || '',
            phone_number: res.data.phone_number || '',
            password: ''
          });
        } 
        else if (activeTab === 'hotel') {
          // Get Hotel Details
          try {
            const res = await api.get('/hotel-details');
            if (res.data && res.data.success && res.data.data) {
              const d = res.data.data;
              setHotelForm({
                id: d.id,
                hotel_name: d.hotel_name || '',
                description: d.description || '',
                phone_number: d.phone_number || '',
                alternative_phone_number: d.alternative_phone_number || '',
                email: d.email || '',
                website: d.website || '',
                physical_address: d.physical_address || '',
                city: d.city || '',
                country: d.country || '',
                postal_code: d.postal_code || '',
                latitude: d.latitude !== null && d.latitude !== undefined ? String(d.latitude) : '',
                longitude: d.longitude !== null && d.longitude !== undefined ? String(d.longitude) : '',
                google_maps_pin: d.google_maps_pin || '',
                check_in_time: d.check_in_time || '14:00',
                check_out_time: d.check_out_time || '10:00',
                currency: d.currency || 'USD',
                timezone: d.timezone || 'UTC',
                vat_rate: d.vat_rate !== null && d.vat_rate !== undefined ? String(d.vat_rate) : '18.00',
                is_active: d.is_active ?? true,
                facebook_url: d.facebook_url || '',
                instagram_url: d.instagram_url || '',
                x_url: d.x_url || '',
                linkedin_url: d.linkedin_url || '',
                youtube_url: d.youtube_url || ''
              });
              setLogoPreview(d.logo_url || '');
              setCoverPreview(d.cover_image_url || '');
            }
          } catch (err) {
            console.warn("No active hotel profile exists yet.");
          }

          // Get Delivery Pricing
          try {
            const resPrice = await api.get('/restaurant/delivery-pricing/active');
            if (resPrice.data) {
              const p = resPrice.data;
              setDeliveryPricingForm({
                pricing_id: p.pricing_id,
                restaurant_lat: String(p.restaurant_lat),
                restaurant_lng: String(p.restaurant_lng),
                price_per_km: String(p.price_per_km),
                minimum_delivery_fee: String(p.minimum_delivery_fee),
                maximum_delivery_distance_km: String(p.maximum_delivery_distance_km),
                is_active: p.is_active
              });
            }
          } catch (err) {
            console.warn("No active delivery pricing configuration found.");
          }
        } 
        else if (activeTab === 'notifications') {
          const res = await api.get('/notifications/preferences');
          if (res.data) {
            setNotificationPrefs({
              email_enabled: res.data.email_enabled ?? true,
              in_app_enabled: res.data.in_app_enabled ?? true,
              reservation_notifications: res.data.reservation_notifications ?? true,
              order_notifications: res.data.order_notifications ?? true,
              payment_notifications: res.data.payment_notifications ?? true,
              security_notifications: res.data.security_notifications ?? true,
              marketing_notifications: res.data.marketing_notifications ?? false,
              system_notifications: res.data.system_notifications ?? true
            });
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.detail || 'Failed to load details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // Saves handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.full_name || !profileForm.email) {
      toast.error("Name and Email are required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone_number: profileForm.phone_number || null,
      };
      if (profileForm.password) {
        if (profileForm.password.length < 8) {
          toast.error("Password must be at least 8 characters.");
          setIsSaving(false);
          return;
        }
        payload.password = profileForm.password;
      }

      await api.put(`/auth/users/${user?.id}`, payload);
      updateUserProfile(profileForm.full_name, profileForm.email);
      toast.success("Profile details updated successfully.");
      setProfileForm(prev => ({ ...prev, password: '' }));
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHotelDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Only Administrators can modify hotel settings.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Hotel identity & Localization info
      const form = new FormData();
      form.append('hotel_name', hotelForm.hotel_name);
      form.append('description', hotelForm.description);
      form.append('phone_number', hotelForm.phone_number);
      form.append('alternative_phone_number', hotelForm.alternative_phone_number);
      form.append('email', hotelForm.email);
      form.append('website', hotelForm.website);
      form.append('physical_address', hotelForm.physical_address);
      form.append('city', hotelForm.city);
      form.append('country', hotelForm.country);
      form.append('postal_code', hotelForm.postal_code);
      form.append('currency', hotelForm.currency);
      form.append('timezone', hotelForm.timezone);
      if (hotelForm.vat_rate) form.append('vat_rate', hotelForm.vat_rate);
      form.append('is_active', String(hotelForm.is_active));

      if (hotelForm.latitude) form.append('latitude', hotelForm.latitude);
      if (hotelForm.longitude) form.append('longitude', hotelForm.longitude);
      if (hotelForm.google_maps_pin) form.append('google_maps_pin', hotelForm.google_maps_pin);
      if (hotelForm.facebook_url) form.append('facebook_url', hotelForm.facebook_url);
      if (hotelForm.instagram_url) form.append('instagram_url', hotelForm.instagram_url);
      if (hotelForm.x_url) form.append('x_url', hotelForm.x_url);
      if (hotelForm.linkedin_url) form.append('linkedin_url', hotelForm.linkedin_url);
      if (hotelForm.youtube_url) form.append('youtube_url', hotelForm.youtube_url);

      if (hotelLogo) form.append('logo', hotelLogo);
      if (hotelCover) form.append('cover_image', hotelCover);

      let targetId = hotelForm.id;
      if (!targetId) {
        try {
          const activeRes = await api.get('/hotel-details');
          if (activeRes.data && activeRes.data.data && activeRes.data.data.id) {
            targetId = activeRes.data.data.id;
          }
        } catch (e) {
          // Fallback to profile ID 1
          targetId = 1;
        }
      }

      let hotelRes;
      if (targetId) {
        hotelRes = await api.put(`/hotel-details/${targetId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        hotelRes = await api.post('/hotel-details', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (hotelRes.data && hotelRes.data.success && hotelRes.data.data) {
        setHotelForm(prev => ({ ...prev, id: hotelRes.data.data.id }));
      }

      if (hotelForm.vat_rate) {
        const newRate = parseFloat(hotelForm.vat_rate);
        if (!isNaN(newRate)) {
          setVatRate(newRate);
        }
      }

      // 2. Delivery pricing parameters
      const deliveryPayload = {
        restaurant_lat: Number(deliveryPricingForm.restaurant_lat),
        restaurant_lng: Number(deliveryPricingForm.restaurant_lng),
        price_per_km: Number(deliveryPricingForm.price_per_km),
        minimum_delivery_fee: Number(deliveryPricingForm.minimum_delivery_fee),
        maximum_delivery_distance_km: Number(deliveryPricingForm.maximum_delivery_distance_km),
        is_active: deliveryPricingForm.is_active
      };

      if (deliveryPricingForm.pricing_id) {
        await api.put(`/restaurant/admin/delivery-pricing/${deliveryPricingForm.pricing_id}`, deliveryPayload);
      } else {
        const resPrice = await api.post('/restaurant/admin/delivery-pricing', deliveryPayload);
        if (resPrice.data) {
          setDeliveryPricingForm(prev => ({ ...prev, pricing_id: resPrice.data.pricing_id }));
        }
      }

      toast.success("Hotel and delivery properties updated successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update hotel details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/notifications/preferences', notificationPrefs);
      toast.success("Notification preferences updated.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHotelLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHotelCover(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      
      {/* Title & Submit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">Settings</h3>
          <p className="text-xs text-zinc-550">
            Configure your personal user credentials, hotel branding assets, active delivery rules, look & feel appearance, and notification channels.
          </p>
        </div>
        
        {/* Sync submission buttons dynamically */}
        <div className="shrink-0">
          {activeTab === 'profile' && (
            <ShadcnButton
              type="submit"
              form="profile-form"
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none select-none"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile
            </ShadcnButton>
          )}
          {activeTab === 'hotel' && isAdmin && (
            <ShadcnButton
              type="submit"
              form="hotel-form"
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none select-none"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Properties
            </ShadcnButton>
          )}
          {activeTab === 'notifications' && (
            <ShadcnButton
              type="submit"
              form="notifications-form"
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none select-none"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Preferences
            </ShadcnButton>
          )}
        </div>
      </div>



      {/* Main Tab View Area */}
      {isLoading ? (
        <div className="flex h-[40vh] w-full flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-[10px] font-bold text-zinc-450 tracking-wider uppercase">Loading tab parameters...</p>
        </div>
      ) : (
        <div className="w-full">
          
          {/* TAB 1: Profile View */}
          {activeTab === 'profile' && (
            <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
              <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs">
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Profile Information</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Configure your personal staff profile attributes.</p>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Full Name</Label>
                      <Input 
                        id="full_name" 
                        value={profileForm.full_name}
                        onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                        placeholder="Sarah Jenkins"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="admin@seyeya.com"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="phone_number" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Phone Number</Label>
                      <Input 
                        id="phone_number" 
                        value={profileForm.phone_number}
                        onChange={e => setProfileForm(p => ({ ...p, phone_number: e.target.value }))}
                        placeholder="+256 700 000000"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>

                    <div className="grid gap-2 border-t pt-4 mt-2">
                      <Label htmlFor="pass" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        Update Password
                      </Label>
                      <Input 
                        id="pass" 
                        type="password"
                        value={profileForm.password}
                        onChange={e => setProfileForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="•••••••• (Leave blank to keep current)"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </form>
          )}

          {/* TAB 2: Hotel Setup View */}
          {activeTab === 'hotel' && (
            <form id="hotel-form" onSubmit={handleSaveHotelDetails} className="space-y-6">
              
              {!isAdmin && (
                <div className="flex gap-3 items-start p-4 mb-2 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Read-Only Access Mode</p>
                    <p className="text-[11px] opacity-90 mt-0.5">Your staff role does not possess permissions to save Hotel or Delivery configurations. Showing active details in view-only state.</p>
                  </div>
                </div>
              )}

              <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-6">
                
                {/* Identity Section */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Hotel Identity</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Configure property name, email, website, and branding photos.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="hotel_name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Hotel Name</Label>
                      <Input 
                        id="hotel_name" 
                        value={hotelForm.hotel_name}
                        onChange={e => setHotelForm(h => ({ ...h, hotel_name: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="Seyeya Lodge"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hotel_email" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Contact Email</Label>
                      <Input 
                        id="hotel_email" 
                        type="email"
                        value={hotelForm.email}
                        onChange={e => setHotelForm(h => ({ ...h, email: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="info@seyeyalodge.com"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="hotel_desc" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Description</Label>
                    <textarea 
                      id="hotel_desc" 
                      value={hotelForm.description}
                      onChange={e => setHotelForm(h => ({ ...h, description: e.target.value }))}
                      disabled={!isAdmin}
                      placeholder="Describe your lodge amenities and history..."
                      rows={3}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 disabled:opacity-50 dark:text-zinc-100"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="hotel_phone" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Primary Phone</Label>
                      <Input 
                        id="hotel_phone" 
                        value={hotelForm.phone_number}
                        onChange={e => setHotelForm(h => ({ ...h, phone_number: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="+256700123456"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hotel_alt_phone" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Alternative Phone</Label>
                      <Input 
                        id="hotel_alt_phone" 
                        value={hotelForm.alternative_phone_number}
                        onChange={e => setHotelForm(h => ({ ...h, alternative_phone_number: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="+256700654321"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hotel_web" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Website URL</Label>
                      <Input 
                        id="hotel_web" 
                        value={hotelForm.website}
                        onChange={e => setHotelForm(h => ({ ...h, website: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="https://seyeyalodge.com"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Location & Coordinates</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Configure physical addresses and GPS pins.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="phys" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Physical Address</Label>
                      <Input 
                        id="phys" 
                        value={hotelForm.physical_address}
                        onChange={e => setHotelForm(h => ({ ...h, physical_address: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="Plot 12, Nile Crescent"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-3">
                      <div className="grid gap-2 col-span-2">
                        <Label htmlFor="city" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">City</Label>
                        <Input 
                          id="city" 
                          value={hotelForm.city}
                          onChange={e => setHotelForm(h => ({ ...h, city: e.target.value }))}
                          disabled={!isAdmin}
                          placeholder="Jinja"
                          className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="postal" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Postal</Label>
                        <Input 
                          id="postal" 
                          value={hotelForm.postal_code}
                          onChange={e => setHotelForm(h => ({ ...h, postal_code: e.target.value }))}
                          disabled={!isAdmin}
                          placeholder="50201"
                          className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="country" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Country</Label>
                      <Input 
                        id="country" 
                        value={hotelForm.country}
                        onChange={e => setHotelForm(h => ({ ...h, country: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="Uganda"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maps_pin" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Google Maps Pin URL</Label>
                      <Input 
                        id="maps_pin" 
                        value={hotelForm.google_maps_pin}
                        onChange={e => setHotelForm(h => ({ ...h, google_maps_pin: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="https://maps.app.goo.gl/..."
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="lat" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Latitude</Label>
                      <Input 
                        id="lat" 
                        value={hotelForm.latitude}
                        onChange={e => setHotelForm(h => ({ ...h, latitude: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="0.432123"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lng" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Longitude</Label>
                      <Input 
                        id="lng" 
                        value={hotelForm.longitude}
                        onChange={e => setHotelForm(h => ({ ...h, longitude: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="33.210452"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Pricing Section */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Restaurant Delivery Settings</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Specify restaurant locations and pricing variables.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="rlat" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Origin Latitude (Restaurant)</Label>
                      <Input 
                        id="rlat" 
                        value={deliveryPricingForm.restaurant_lat}
                        onChange={e => setDeliveryPricingForm(dp => ({ ...dp, restaurant_lat: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="0.432123"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rlng" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Origin Longitude (Restaurant)</Label>
                      <Input 
                        id="rlng" 
                        value={deliveryPricingForm.restaurant_lng}
                        onChange={e => setDeliveryPricingForm(dp => ({ ...dp, restaurant_lng: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="33.210452"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="d_dist" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Max Distance (KM)</Label>
                      <Input 
                        id="d_dist" 
                        value={deliveryPricingForm.maximum_delivery_distance_km}
                        onChange={e => setDeliveryPricingForm(dp => ({ ...dp, maximum_delivery_distance_km: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="15.0"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="d_rate" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Price Per KM (USD)</Label>
                      <Input 
                        id="d_rate" 
                        value={deliveryPricingForm.price_per_km}
                        onChange={e => setDeliveryPricingForm(dp => ({ ...dp, price_per_km: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="1.50"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="d_min" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Min Charge Fee (USD)</Label>
                      <Input 
                        id="d_min" 
                        value={deliveryPricingForm.minimum_delivery_fee}
                        onChange={e => setDeliveryPricingForm(dp => ({ ...dp, minimum_delivery_fee: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="5.00"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Operations rules section */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Localization & Rules</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Configure hours, default currency, and active status.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="grid gap-2">
                      <Label htmlFor="checkin" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Check-in Time</Label>
                      <Input 
                        id="checkin" 
                        value={hotelForm.check_in_time}
                        onChange={e => setHotelForm(h => ({ ...h, check_in_time: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="14:00"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="checkout" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Check-out Time</Label>
                      <Input 
                        id="checkout" 
                        value={hotelForm.check_out_time}
                        onChange={e => setHotelForm(h => ({ ...h, check_out_time: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="10:00"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="curr" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Base System Currency</Label>
                      <Input 
                        id="curr" 
                        value={hotelForm.currency}
                        onChange={e => setHotelForm(h => ({ ...h, currency: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="UGX"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50 font-bold"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="exchange_rate" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">USD Exchange Rate (1 USD = X UGX)</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="exchange_rate" 
                          type="number"
                          step="1"
                          min="1"
                          value={exchangeRateInput}
                          onChange={e => setExchangeRateInput(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="3700"
                          className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50 font-bold"
                        />
                        {isAdmin && (
                          <ShadcnButton 
                            type="button"
                            onClick={() => {
                              const r = Number(exchangeRateInput);
                              if (r > 0) setUsdRate(r);
                            }}
                            className="h-10 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                          >
                            Update
                          </ShadcnButton>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tzone" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Timezone</Label>
                      <Input 
                        id="tzone" 
                        value={hotelForm.timezone}
                        onChange={e => setHotelForm(h => ({ ...h, timezone: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="Africa/Kampala"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vat_rate" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">VAT Rate (%)</Label>
                      <Input 
                        id="vat_rate" 
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={hotelForm.vat_rate}
                        onChange={e => setHotelForm(h => ({ ...h, vat_rate: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="18.00"
                        className="rounded-xl h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Upload assets Section */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Branding Assets</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Upload brand logo and dashboard banners.</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Hotel Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl bg-zinc-50 dark:bg-zinc-800 border flex items-center justify-center overflow-hidden shrink-0">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                          ) : (
                            <Hotel className="h-6 w-6 text-zinc-400" />
                          )}
                        </div>
                        {isAdmin && (
                          <div className="grid gap-1">
                            <input 
                              type="file" 
                              id="logo_file" 
                              accept="image/*" 
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <ShadcnButton 
                              type="button"
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('logo_file')?.click()}
                              className="rounded-lg text-xs"
                            >
                              Choose File
                            </ShadcnButton>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Cover Banner</Label>
                      <div className="flex flex-col gap-2">
                        <div className="h-16 w-full rounded-xl bg-zinc-50 dark:bg-zinc-800 border flex items-center justify-center overflow-hidden">
                          {coverPreview ? (
                            <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                          ) : (
                            <Globe className="h-6 w-6 text-zinc-400" />
                          )}
                        </div>
                        {isAdmin && (
                          <div>
                            <input 
                              type="file" 
                              id="cover_file" 
                              accept="image/*" 
                              onChange={handleCoverUpload}
                              className="hidden"
                            />
                            <ShadcnButton 
                              type="button"
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('cover_file')?.click()}
                              className="rounded-lg text-xs"
                            >
                              Choose File
                            </ShadcnButton>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </Card>
            </form>
          )}

          {/* TAB 3: Theme Preferences View */}
          {activeTab === 'theme' && (
            <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs">
              <div className="max-w-2xl space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Appearance Theme</h4>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1">Select your preferred user workspace skin layout.</p>
                </div>

                <div className="grid gap-4">
                  {[
                    { id: 'light', label: 'Light Mode', icon: Sun, desc: 'High contrast display optimal for bright day conditions.' },
                    { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Dark layout comfortable for night settings.' },
                    { id: 'system', label: 'System Default', icon: Monitor, desc: 'Adapts color schema to your browser/operating system.' }
                  ].map(t => {
                    const Icon = t.icon;
                    const isSelected = theme === t.id;
                    return (
                      <div 
                        key={t.id}
                        onClick={() => setTheme(t.id as Theme)}
                        className={`flex items-center justify-between gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                          isSelected ? 'border-zinc-950 dark:border-zinc-50 bg-zinc-50/50 dark:bg-zinc-800/40' : 'border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center border shrink-0 ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                          }`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{t.label}</p>
                            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{t.desc}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: Notifications Preferences View */}
          {activeTab === 'notifications' && (
            <form id="notifications-form" onSubmit={handleSaveNotifications} className="space-y-6">
              <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs">
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Alert Configurations</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Configure active channels and alert categories.</p>
                  </div>

                  <div className="divide-y divide-zinc-100 space-y-4">
                    {[
                      { key: 'email_enabled', label: 'Email Channels', desc: 'Dispatch critical alerts to your registry email.' },
                      { key: 'in_app_enabled', label: 'In-App Alerts', desc: 'Display popups and badge count indicators on the live console.' },
                      { key: 'reservation_notifications', label: 'Room Reservations', desc: 'Get updates on room assignments, guest arrivals, and modifications.' },
                      { key: 'order_notifications', label: 'Restaurant Orders', desc: 'Alert when food orders are placed, processed, or paid.' },
                      { key: 'payment_notifications', label: 'Transaction Receipts', desc: 'Notify on checkout transactions and mobile money alerts.' },
                      { key: 'security_notifications', label: 'Security & Access Audits', desc: 'Log alert notifications for logins and password resets.' },
                      { key: 'system_notifications', label: 'System Upgrades & Logs', desc: 'Notify on server status updates, maintenance hours, and backups.' }
                    ].map((t, idx) => (
                      <div key={t.key} className={`flex items-start justify-between gap-4 ${idx === 0 ? '' : 'pt-4'}`}>
                        <div className="space-y-0.5 max-w-[80%]">
                          <Label htmlFor={t.key} className="text-xs font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer">{t.label}</Label>
                          <p className="text-[10px] text-zinc-450 font-medium leading-normal">{t.desc}</p>
                        </div>
                        <Switch 
                          id={t.key}
                          checked={notificationPrefs[t.key as keyof NotificationPrefs]}
                          onCheckedChange={val => setNotificationPrefs(prev => ({ ...prev, [t.key]: val }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </form>
          )}

          {/* TAB 5: Role Permissions Matrix View (Super Admin Only) */}
          {activeTab === 'permissions' && (
            isSuperAdmin ? (
              <RolePermissionsTable />
            ) : (
              <Card className="p-8 bg-card border border-border rounded-2xl text-center">
                <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-3 py-6">
                  <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-red-500">Access Restricted</h4>
                  <p className="text-xs text-zinc-500 leading-normal font-medium">
                    Role permissions management is strictly reserved for Super Administrators. Contact your system admin if you require elevated access privileges.
                  </p>
                </div>
              </Card>
            )
          )}

        </div>
      )}

    </div>
  );
};
export default Settings;
