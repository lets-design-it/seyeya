import React, { useState, useMemo, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAccommodation, RoomType, RoomUnit, BookingRecord } from '../../hooks/useAccommodation';
import { useCurrency } from '../../context/CurrencyContext';
import { useRoomAssets, autoDetectAmenityIcon, autoDetectPolicyIcon, renderAssetIcon } from '@/hooks/useRoomAssets.tsx';
import { AmenitiesView } from './AmenitiesView';
import { PoliciesView } from './PoliciesView';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from '../../components/Button';
import { Button as ShadcnButton } from "@/components/ui/button";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  VisibilityState,
  SortingState
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  Bed,
  Calendar,
  Hash,
  MapPin,
  ClipboardList,
  Grid,
  CheckCircle,
  User,
  AlertCircle,
  UserCheck,
  ShieldAlert,
  Upload,
  RotateCw,
  Crop,
  Check,
  Sparkles,
  FileText,
  Tag,
  ShieldCheck
} from 'lucide-react';

export interface CategoryRateOption {
  id: string;
  name: string;
  priceUGX: number | string;
  priceUSD: number | string;
  description?: string;
  inclusions?: string[];
  isActive: boolean;
}

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const backendBase = isLocal ? 'http://localhost:8000' : 'https://api.seyeyalodge.com';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface RoomsProps {
  activeTab?: 'reservations' | 'rooms' | 'categories' | 'amenities' | 'policies';
  setActiveTab?: (tab: 'reservations' | 'rooms' | 'categories' | 'amenities' | 'policies') => void;
}

export const Rooms: React.FC<RoomsProps> = ({ 
  activeTab: propActiveTab, 
  setActiveTab: propSetActiveTab 
}) => {
  const { formatPrice, convert, currency } = useCurrency();
  const { amenities: managedAmenities, policies: managedPolicies } = useRoomAssets();
  const {
    categories,
    roomUnits,
    bookings,
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
    isLoading
  } = useAccommodation();

  // Active Tab state
  const [localActiveTab, localSetActiveTab] = useState<'reservations' | 'rooms' | 'categories' | 'amenities' | 'policies'>('reservations');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || localSetActiveTab;

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Drawer / Details states
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isRoomDrawerOpen, setIsRoomDrawerOpen] = useState(false);
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Selected items for editing
  const [editCategoryItem, setEditCategoryItem] = useState<RoomType | null>(null);
  const [editRoomItem, setEditRoomItem] = useState<RoomUnit | null>(null);
  const [editBookingItem, setEditBookingItem] = useState<BookingRecord | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

  // Deletion confirms
  const [deleteConfirmType, setDeleteConfirmType] = useState<'category' | 'room' | 'booking' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sorting States
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('ALL');
    setFilterStatus('ALL');
  };

  // Analytics Metrics
  const vacantCount = useMemo(() => roomUnits.filter(r => r.roomStatus === 'Available').length, [roomUnits]);
  const reservedCount = useMemo(() => roomUnits.filter(r => r.roomStatus === 'Reserved').length, [roomUnits]);
  const occupiedCount = useMemo(() => roomUnits.filter(r => r.roomStatus === 'Occupied').length, [roomUnits]);
  const maintenanceCount = useMemo(() => roomUnits.filter(r => r.roomStatus === 'Maintenance').length, [roomUnits]);
  const totalUnits = roomUnits.length;
  const occupancyRate = totalUnits > 0 ? Math.round(((totalUnits - vacantCount) / totalUnits) * 100) : 0;

  // -------------------------------------------------------------
  // Category Form & Upload/Crop State
  // -------------------------------------------------------------
  const [catName, setCatName] = useState('');
  const [catPriceUGX, setCatPriceUGX] = useState<number | string>(300000);
  const [catPriceUSD, setCatPriceUSD] = useState<number | string>(85);
  const [catAdults, setCatAdults] = useState<number>(2);
  const [catChildren, setCatChildren] = useState<number>(1);
  const [catAmenities, setCatAmenities] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catSelectedPolicies, setCatSelectedPolicies] = useState<string[]>([]);
  
  // Category Photos Upload State
  const [catPhotos, setCatPhotos] = useState<string[]>([]);
  
  // Rate Options / Pricing Options State
  const [catRateOptions, setCatRateOptions] = useState<CategoryRateOption[]>([
    {
      id: 'ro-1',
      name: 'Room Only (Standard Rate)',
      priceUGX: 300000,
      priceUSD: 85,
      description: 'Standard room rate without meal plans included.',
      inclusions: ['Free Wi-Fi', 'Free Cancellation'],
      isActive: true
    },
    {
      id: 'ro-2',
      name: 'Bed & Breakfast (BB)',
      priceUGX: 350000,
      priceUSD: 100,
      description: 'Includes full daily breakfast buffet at the main restaurant.',
      inclusions: ['Breakfast Included', 'Free Wi-Fi'],
      isActive: true
    }
  ]);

  const handleCatPriceUGXChange = (valStr: string) => {
    const cleaned = valStr.length > 1 && valStr.startsWith('0') ? valStr.replace(/^0+/, '') : valStr;
    setCatPriceUGX(cleaned);
    const num = Number(cleaned);
    if (cleaned !== '' && !isNaN(num) && num >= 0) {
      const usdVal = Math.round(convert(num, 'UGX', 'USD'));
      setCatPriceUSD(usdVal);
    } else if (cleaned === '') {
      setCatPriceUSD('');
    }
  };

  const handleCatPriceUSDChange = (valStr: string) => {
    const cleaned = valStr.length > 1 && valStr.startsWith('0') ? valStr.replace(/^0+/, '') : valStr;
    setCatPriceUSD(cleaned);
    const num = Number(cleaned);
    if (cleaned !== '' && !isNaN(num) && num >= 0) {
      const ugxVal = Math.round(convert(num, 'USD', 'UGX'));
      setCatPriceUGX(ugxVal);
    } else if (cleaned === '') {
      setCatPriceUGX('');
    }
  };

  const handleRateOptionUGXChange = (id: string, valStr: string) => {
    const cleaned = valStr.length > 1 && valStr.startsWith('0') ? valStr.replace(/^0+/, '') : valStr;
    const num = Number(cleaned);
    const usdVal = (cleaned !== '' && !isNaN(num) && num >= 0) ? Math.round(convert(num, 'UGX', 'USD')) : '';
    updateRateOption(id, { priceUGX: cleaned, priceUSD: usdVal });
  };

  const handleRateOptionUSDChange = (id: string, valStr: string) => {
    const cleaned = valStr.length > 1 && valStr.startsWith('0') ? valStr.replace(/^0+/, '') : valStr;
    const num = Number(cleaned);
    const ugxVal = (cleaned !== '' && !isNaN(num) && num >= 0) ? Math.round(convert(num, 'USD', 'UGX')) : '';
    updateRateOption(id, { priceUGX: ugxVal, priceUSD: cleaned });
  };

  const handleAddPresetRate = (name: string, priceUGXOffset: number, _priceUSDOffset: number, inclusions: string[]) => {
    const baseUGX = Number(catPriceUGX) || 300000;
    const newUGX = Math.max(0, baseUGX + priceUGXOffset);
    const newUSD = Math.round(convert(newUGX, 'UGX', 'USD'));
    const newRate: CategoryRateOption = {
      id: `ro-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name,
      priceUGX: newUGX,
      priceUSD: newUSD,
      inclusions,
      isActive: true
    };
    setCatRateOptions(prev => [...prev, newRate]);
  };

  const addNewRateOption = () => {
    const baseUGX = Number(catPriceUGX) || 300000;
    const baseUSD = Math.round(convert(baseUGX, 'UGX', 'USD'));
    const newRate: CategoryRateOption = {
      id: `ro-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: `Option ${catRateOptions.length + 1}`,
      priceUGX: baseUGX,
      priceUSD: baseUSD,
      isActive: true
    };
    setCatRateOptions(prev => [...prev, newRate]);
  };

  const updateRateOption = (id: string, data: Partial<CategoryRateOption>) => {
    setCatRateOptions(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const removeRateOption = (id: string) => {
    setCatRateOptions(prev => prev.filter(r => r.id !== id));
  };
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/accommodation/categories/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedUrl = res.data.photo_url;
      
      setCatPhotos(prev => [...prev, uploadedUrl]);
      // Default primary catImage if it is empty or default
      setCatImage(prev => {
        if (!prev || prev.includes('unsplash.com/photo-1618773928121-c32242e63f39')) {
          return uploadedUrl;
        }
        return prev;
      });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
    e.target.value = ''; // allow reselecting same file
  };

  const openAddCategory = () => {
    setEditCategoryItem(null);
    setCatName('');
    setCatPriceUGX(300000);
    setCatPriceUSD(85);
    setCatAdults(2);
    setCatChildren(1);
    setCatAmenities('AC, Free Wi-Fi, King Bed');
    setCatDescription('');
    setCatImage('https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=300');
    setCatPhotos([]);
    setCatSelectedPolicies([]);
    setCatRateOptions([
      {
        id: 'ro-1',
        name: 'Room Only (Standard Rate)',
        priceUGX: 300000,
        priceUSD: 85,
        description: 'Standard room rate without meal plans.',
        inclusions: ['Free Wi-Fi', 'Free Cancellation'],
        isActive: true
      },
      {
        id: 'ro-2',
        name: 'Bed & Breakfast (BB)',
        priceUGX: 350000,
        priceUSD: 100,
        description: 'Includes full daily breakfast buffet.',
        inclusions: ['Breakfast Included', 'Free Wi-Fi'],
        isActive: true
      }
    ]);
    setIsCategoryDrawerOpen(true);
  };

  const openEditCategory = (item: RoomType) => {
    setEditCategoryItem(item);
    setCatName(item.name);
    setCatPriceUGX(item.priceUGX);
    setCatPriceUSD(item.priceUSD);
    
    // Parse existing capacity string
    const capStr = (item.capacity || "").toLowerCase();
    let adults = 2;
    let children = 1;
    const adultMatch = capStr.match(/(\d+)\s*adult/);
    if (adultMatch) {
      adults = parseInt(adultMatch[1]);
    } else if (capStr.includes("adult")) {
      adults = 1;
    }
    const childMatch = capStr.match(/(\d+)\s*child/);
    if (childMatch) {
      children = parseInt(childMatch[1]);
    } else if (capStr.includes("child")) {
      children = 1;
    } else if (capStr.includes("no child")) {
      children = 0;
    }
    setCatAdults(adults);
    setCatChildren(children);

    setCatAmenities(item.amenities.join(', '));
    setCatDescription(item.description);
    setCatImage(item.image);
    setCatPhotos(item.photos || []);
    setCatSelectedPolicies((item.selectedPolicyIds || []).map(id => String(id)));

    if ((item as any).rateOptions && Array.isArray((item as any).rateOptions) && (item as any).rateOptions.length > 0) {
      setCatRateOptions((item as any).rateOptions);
    } else {
      setCatRateOptions([
        {
          id: 'ro-1',
          name: 'Room Only (Standard Rate)',
          priceUGX: item.priceUGX,
          priceUSD: item.priceUSD,
          description: 'Standard room rate.',
          inclusions: ['Free Wi-Fi', 'Free Cancellation'],
          isActive: true
        },
        {
          id: 'ro-2',
          name: 'Bed & Breakfast (BB)',
          priceUGX: item.priceUGX + 50000,
          priceUSD: item.priceUSD + 15,
          description: 'Includes full daily breakfast buffet.',
          inclusions: ['Breakfast Included', 'Free Wi-Fi'],
          isActive: true
        }
      ]);
    }

    setIsCategoryDrawerOpen(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const adultsText = catAdults === 1 ? "1 Adult" : `${catAdults} Adults`;
    const childrenText = catChildren === 0
      ? ""
      : (catChildren === 1 ? "1 Child" : `${catChildren} Children`);
    const capacityString = childrenText ? `${adultsText}, ${childrenText}` : adultsText;

    // Map amenity IDs from managedAmenities
    const selectedAmenityList = catAmenities.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const amenityIds = managedAmenities
      .filter(am => selectedAmenityList.some(s => s === am.name.toLowerCase()))
      .map(am => am.id);

    const data = {
      name: catName.trim(),
      priceUGX: Number(catPriceUGX),
      priceUSD: Number(catPriceUSD),
      capacity: capacityString,
      amenities: catAmenities.split(',').map(s => s.trim()).filter(Boolean),
      description: catDescription.trim(),
      image: catImage.trim() || (catPhotos.length > 0 ? catPhotos[0] : 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=300'),
      photos: catPhotos,
      rateOptions: catRateOptions,
      selectedAmenityIds: amenityIds,
      selectedPolicyIds: catSelectedPolicies
    };

    if (editCategoryItem) {
      updateCategory({ ...data, id: editCategoryItem.id });
    } else {
      addCategory(data);
    }
    setIsCategoryDrawerOpen(false);
  };

  // -------------------------------------------------------------
  // Room Form State
  // -------------------------------------------------------------
  const [roomNumber, setRoomNumber] = useState('');
  const [roomCatId, setRoomCatId] = useState('');
  const [roomFloor, setRoomFloor] = useState('1st Floor');
  const [roomMaxOcc, setRoomMaxOcc] = useState<number>(2);
  const [roomDesc, setRoomDesc] = useState('');
  const [roomAmens, setRoomAmens] = useState('');
  const [roomUnitStatus, setRoomUnitStatus] = useState<RoomUnit['roomStatus']>('Available');

  const openAddRoom = () => {
    setEditRoomItem(null);
    setRoomNumber('');
    setRoomCatId(categories[0]?.id || '');
    setRoomFloor('1st Floor');
    setRoomMaxOcc(2);
    setRoomDesc('');
    setRoomAmens('AC, King Bed');
    setRoomUnitStatus('Available');
    setIsRoomDrawerOpen(true);
  };

  const openEditRoom = (item: RoomUnit) => {
    setEditRoomItem(item);
    setRoomNumber(item.roomNumber);
    setRoomCatId(item.roomCategoryId);
    setRoomFloor(item.floor);
    setRoomMaxOcc(item.maxOccupancy);
    setRoomDesc(item.description || '');
    setRoomAmens(item.amenities ? item.amenities.join(', ') : '');
    setRoomUnitStatus(item.roomStatus);
    setIsRoomDrawerOpen(true);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim() || !roomCatId) return;

    const data = {
      roomNumber: roomNumber.trim(),
      roomCategoryId: roomCatId,
      floor: roomFloor,
      maxOccupancy: Number(roomMaxOcc),
      roomStatus: roomUnitStatus,
      description: roomDesc.trim(),
      amenities: roomAmens.split(',').map(s => s.trim()).filter(Boolean)
    };

    if (editRoomItem) {
      updateRoomUnit({ ...data, id: editRoomItem.id });
    } else {
      addRoomUnit(data);
    }
    setIsRoomDrawerOpen(false);
  };

  // -------------------------------------------------------------
  // Booking Form State
  // -------------------------------------------------------------
  const [bookGuestName, setBookGuestName] = useState('');
  const [bookGuestEmail, setBookGuestEmail] = useState('');
  const [bookCatId, setBookCatId] = useState('');
  const [bookRoomUnitId, setBookRoomUnitId] = useState('');
  const [bookCheckIn, setBookCheckIn] = useState('');
  const [bookCheckOut, setBookCheckOut] = useState('');
  const [bookTotalPaid, setBookTotalPaid] = useState<number>(0);
  const [bookStatus, setBookStatus] = useState<BookingRecord['status']>('Reserved');

  const [allClients, setAllClients] = useState<any[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<{ id: number; name: string; isChild: boolean }[]>([]);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get('/crm/customers');
        setAllClients(res.data || []);
      } catch (err) {
        console.error('Failed to fetch clients for reservation dropdown:', err);
      }
    };
    if (isBookingDrawerOpen || isDetailsOpen) {
      fetchClients();
    }
  }, [isBookingDrawerOpen, isDetailsOpen]);

  const getCategoryCapacity = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return { maxAdults: 2, maxChildren: 1 };

    const capStr = (cat.capacity || "").toLowerCase();
    let maxAdults = 2;
    let maxChildren = 1;

    const adultMatch = capStr.match(/(\d+)\s*adult/);
    if (adultMatch) {
      maxAdults = parseInt(adultMatch[1]);
    } else if (capStr.includes("adult")) {
      maxAdults = 1;
    }

    const childMatch = capStr.match(/(\d+)\s*child/);
    if (childMatch) {
      maxChildren = parseInt(childMatch[1]);
    } else if (capStr.includes("child")) {
      maxChildren = 1;
    } else if (capStr.includes("no child")) {
      maxChildren = 0;
    }

    return { maxAdults, maxChildren };
  };

  const openAddBooking = () => {
    setEditBookingItem(null);
    setBookGuestName('');
    setBookGuestEmail('');
    setSelectedGuests([]);
    setGuestSearchTerm('');
    const defaultCat = categories[0]?.id || '';
    setBookCatId(defaultCat);
    setBookRoomUnitId('');
    setBookCheckIn(new Date().toISOString().split('T')[0]);

    const nextThreeDays = new Date();
    nextThreeDays.setDate(nextThreeDays.getDate() + 3);
    setBookCheckOut(nextThreeDays.toISOString().split('T')[0]);

    setBookTotalPaid(categories[0] ? categories[0].priceUGX * 3 : 900000);
    setBookStatus('Reserved');
    setIsBookingDrawerOpen(true);
  };

  const openEditBooking = (item: BookingRecord) => {
    setEditBookingItem(item);
    setBookGuestName(item.guestName);
    setBookGuestEmail(item.email);
    setBookCatId(item.roomId);
    setBookRoomUnitId(item.roomUnitId || '');
    setBookCheckIn(item.checkIn);
    setBookCheckOut(item.checkOut);
    setBookTotalPaid(item.totalPaid);
    setBookStatus(item.status);

    const primaryClient = allClients.find(c => c.full_name.toLowerCase() === item.guestName.toLowerCase());
    const primaryId = primaryClient ? primaryClient.customer_id : (item.customerId || 1);

    if (item.guests && item.guests.length > 0) {
      const parsedGuests = item.guests.map((g: any) => ({
        id: g.customer_id,
        name: g.name || `Guest #${g.customer_id}`,
        isChild: g.is_child
      }));
      const primaryIdx = parsedGuests.findIndex(g => String(g.id) === String(primaryId));
      if (primaryIdx > 0) {
        const [primary] = parsedGuests.splice(primaryIdx, 1);
        parsedGuests.unshift(primary);
      } else if (primaryIdx === -1) {
        parsedGuests.unshift({
          id: primaryId,
          name: item.guestName,
          isChild: false
        });
      }
      setSelectedGuests(parsedGuests);
    } else {
      setSelectedGuests([{
        id: primaryId,
        name: item.guestName,
        isChild: false
      }]);
    }
    setGuestSearchTerm('');
    setIsBookingDrawerOpen(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookCatId) return;

    if (selectedGuests.length === 0) {
      alert("Please select at least one guest for the reservation.");
      return;
    }

    const catObj = categories.find(c => c.id === bookCatId);
    const roomUnitObj = roomUnits.find(ru => ru.id === bookRoomUnitId);
    
    const { maxAdults, maxChildren } = getCategoryCapacity(bookCatId);
    const maxOccupancy = roomUnitObj?.maxOccupancy || maxAdults;

    const adultsCount = selectedGuests.filter(g => !g.isChild).length;
    const childrenCount = selectedGuests.filter(g => g.isChild).length;

    if (adultsCount > maxOccupancy) {
      alert(`The selected room unit has a maximum capacity of ${maxOccupancy} adults. You have selected ${adultsCount} adults. Please remove some adults or mark them as children.`);
      return;
    }

    if (adultsCount > maxAdults) {
      alert(`This category has a maximum capacity of ${maxAdults} adults. You have selected ${adultsCount} adults.`);
      return;
    }

    if (childrenCount > maxChildren) {
      alert(`This category has a maximum capacity of ${maxChildren} children. You have selected ${childrenCount} children.`);
      return;
    }

    const primaryGuest = selectedGuests[0];
    const primaryClient = allClients.find(c => c.customer_id === primaryGuest.id);
    const guestEmail = primaryClient?.email || 'guest@seyeyalodge.com';

    const data = {
      roomId: bookCatId,
      roomName: catObj ? catObj.name : 'Unknown Category',
      guestName: primaryGuest.name,
      email: guestEmail,
      checkIn: bookCheckIn,
      checkOut: bookCheckOut,
      status: bookStatus,
      totalPaid: Number(bookTotalPaid),
      roomUnitId: bookRoomUnitId || undefined,
      roomUnitNumber: roomUnitObj ? roomUnitObj.roomNumber : undefined,
      customerId: primaryGuest.id,
      guests: selectedGuests.map(g => ({ customer_id: g.id, is_child: g.isChild }))
    };

    if (editBookingItem) {
      updateBooking({ ...data, id: editBookingItem.id } as any);
    } else {
      addBooking(data as any);
    }
    setIsBookingDrawerOpen(false);
  };

  // Helper: auto calculate total booking price when dates or category changes in booking form
  const handleBookingDateOrCatChange = (catId: string, checkInVal: string, checkOutVal: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const start = new Date(checkInVal);
    const end = new Date(checkOutVal);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    const diff = end.getTime() - start.getTime();
    if (diff <= 0) return;
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    setBookTotalPaid(cat.priceUGX * nights);
  };

  // Available room units filterable by category for assignment in drawer
  const availableRoomUnitsForCategory = useMemo(() => {
    const activeCatId = bookCatId;
    return roomUnits.filter(ru => {
      // Allow assigning to the currently assigned unit or any unit that is available
      if (editBookingItem && editBookingItem.roomUnitId === ru.id) return true;
      return ru.roomCategoryId === activeCatId && ru.roomStatus === 'Available';
    });
  }, [roomUnits, bookCatId, editBookingItem]);

  // -------------------------------------------------------------
  // Data Filtering
  // -------------------------------------------------------------
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === 'ALL' || b.roomId === filterCategory;
      const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [bookings, searchTerm, filterCategory, filterStatus]);

  const filteredRoomUnits = useMemo(() => {
    return roomUnits.filter(ru => {
      const matchSearch = ru.roomNumber.includes(searchTerm) ||
        (ru.floor && ru.floor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ru.description && ru.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = filterCategory === 'ALL' || ru.roomCategoryId === filterCategory;
      const matchStatus = filterStatus === 'ALL' || ru.roomStatus === filterStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [roomUnits, searchTerm, filterCategory, filterStatus]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [categories, searchTerm]);

  // -------------------------------------------------------------
  // Table Columns Definitions
  // -------------------------------------------------------------

  // 1. Reservations Table Columns
  const bookingColumns = useMemo<ColumnDef<BookingRecord>[]>(() => [
    {
      accessorKey: 'id',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase">
          {row.original.id.substring(0, 12)}
        </span>
      )
    },
    {
      accessorKey: 'guestName',
      header: 'Guest Details',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{row.original.guestName}</div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-450 mt-0.5">{row.original.email}</div>
        </div>
      )
    },
    {
      accessorKey: 'roomName',
      header: 'Cottage / Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase py-0.5 px-2 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300">
          {row.original.roomName.replace('Seyeya ', '')}
        </Badge>
      )
    },
    {
      accessorKey: 'roomUnitNumber',
      header: 'Assigned Unit',
      cell: ({ row }) => (
        row.original.roomUnitNumber ? (
          <span className="font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md text-[10px]">
            Room {row.original.roomUnitNumber}
          </span>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500 italic text-[11px]">Unassigned</span>
        )
      )
    },
    {
      accessorKey: 'checkIn',
      header: 'Stay Dates',
      cell: ({ row }) => (
        <span className="text-zinc-655 dark:text-zinc-300 text-[11px] font-medium">
          {row.original.checkIn} to {row.original.checkOut}
        </span>
      )
    },
    {
      accessorKey: 'totalPaid',
      header: 'Paid Value',
      cell: ({ row }) => (
        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
          {Number(row.original.totalPaid || 0).toLocaleString()}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const colorClass = s === 'Checked In'
          ? 'bg-violet-50 dark:bg-violet-955/20 text-violet-750 dark:text-violet-300 border-violet-200 dark:border-violet-900/50'
          : s === 'Reserved'
            ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
            : s === 'Checked Out'
              ? 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-650 dark:text-zinc-350 border-zinc-200 dark:border-zinc-700'
              : 'bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-350 border-red-200 dark:border-red-900/50';
        return (
          <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
            {s}
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <ShadcnButton
            variant="ghost"
            size="icon"
            onClick={() => openEditBooking(row.original)}
            className="h-7 w-7 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </ShadcnButton>
          <ShadcnButton
            variant="ghost"
            size="icon"
            onClick={() => {
              setDeleteConfirmType('booking');
              setDeleteConfirmId(row.original.id);
            }}
            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-955/30 rounded-lg cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </ShadcnButton>
        </div>
      )
    }
  ], [categories]);

  // 2. Rooms Table Columns
  const roomColumns = useMemo<ColumnDef<RoomUnit>[]>(() => [
    {
      accessorKey: 'roomNumber',
      header: 'Room Number',
      cell: ({ row }) => (
        <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs leading-none">
          Room {row.original.roomNumber}
        </div>
      )
    },
    {
      accessorKey: 'roomCategoryId',
      header: 'Category',
      cell: ({ row }) => {
        const cat = categories.find(c => c.id === row.original.roomCategoryId);
        return (
          <Badge variant="outline" className="text-[10px] font-bold uppercase py-0.5 px-2 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300">
            {cat ? cat.name.replace('Seyeya ', '') : 'Unknown'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'floor',
      header: 'Floor / Level',
      cell: ({ row }) => (
        <span className="text-zinc-500 dark:text-zinc-400 font-medium text-xs">{row.original.floor}</span>
      )
    },
    {
      accessorKey: 'maxOccupancy',
      header: 'Capacity',
      cell: ({ row }) => (
        <span className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs">{row.original.maxOccupancy} Guests</span>
      )
    },
    {
      accessorKey: 'amenities',
      header: 'Amenities',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.amenities?.slice(0, 3).map(a => (
            <Badge key={a} variant="outline" className="text-[9px] bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-300 px-1 py-0 shadow-none">
              {a}
            </Badge>
          ))}
          {(row.original.amenities?.length || 0) > 3 && (
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold ml-1">
              +{(row.original.amenities?.length || 0) - 3}
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'roomStatus',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.roomStatus;
        const colorClass = s === 'Available'
          ? 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
          : s === 'Reserved'
            ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
            : s === 'Occupied'
              ? 'bg-violet-50 dark:bg-violet-955/20 text-violet-750 dark:text-violet-300 border border-violet-200 dark:border-violet-900/50'
              : 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-655 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-700';
        return (
          <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
            {s}
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <ShadcnButton
            variant="ghost"
            size="icon"
            onClick={() => openEditRoom(row.original)}
            className="h-7 w-7 text-zinc-555 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </ShadcnButton>
          <ShadcnButton
            variant="ghost"
            size="icon"
            onClick={() => {
              setDeleteConfirmType('room');
              setDeleteConfirmId(row.original.id);
            }}
            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-955/30 rounded-lg cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </ShadcnButton>
        </div>
      )
    }
  ], [categories]);

  // 3. Categories Table Columns
  const categoryColumns = useMemo<ColumnDef<RoomType>[]>(() => [
    {
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }) => (
        <img
          src={getImageUrl(row.original.image)}
          alt={row.original.name}
          className="h-10 w-10 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800"
        />
      )
    },
    {
      accessorKey: 'name',
      header: 'Category Name',
      cell: ({ row }) => (
        <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
          {row.original.name}
        </div>
      )
    },
    {
      accessorKey: 'priceUGX',
      header: 'Base Rate',
      cell: ({ row }) => (
        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
          {Number(row.original.priceUGX || 0).toLocaleString()}
        </span>
      )
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => (
        <span className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs">{row.original.capacity}</span>
      )
    },
    {
      accessorKey: 'amenities',
      header: 'Standard Amenities',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.amenities.slice(0, 3).map(a => (
            <Badge key={a} variant="outline" className="text-[9px] bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 shadow-none inline-flex items-center gap-1 font-semibold">
              {renderAssetIcon(autoDetectAmenityIcon(a), "h-2.5 w-2.5 text-amber-500")}
              <span>{a}</span>
            </Badge>
          ))}
          {row.original.amenities.length > 3 && (
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold ml-1">
              +{row.original.amenities.length - 3}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <ShadcnButton
            variant="ghost"
            size="icon"
            onClick={() => openEditCategory(row.original)}
            className="h-7 w-7 text-zinc-555 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </ShadcnButton>
          <ShadcnButton
            variant="ghost"
            size="icon"
            onClick={() => {
              setDeleteConfirmType('category');
              setDeleteConfirmId(row.original.id);
            }}
            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-955/30 rounded-lg cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </ShadcnButton>
        </div>
      )
    }
  ], []);

  // -------------------------------------------------------------
  // Table Hooks
  // -------------------------------------------------------------
  const activeTableData = useMemo(() => {
    if (activeTab === 'reservations') return filteredBookings;
    if (activeTab === 'rooms') return filteredRoomUnits;
    return filteredCategories;
  }, [activeTab, filteredBookings, filteredRoomUnits, filteredCategories]);

  const activeColumns = useMemo(() => {
    if (activeTab === 'reservations') return bookingColumns;
    if (activeTab === 'rooms') return roomColumns;
    return categoryColumns;
  }, [activeTab, bookingColumns, roomColumns, categoryColumns]);

  const table = useReactTable({
    data: activeTableData as any,
    columns: activeColumns as any,
    state: {
      columnVisibility,
      sorting,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      }
    }
  });

  const handleRowClick = (item: any) => {
    if (activeTab === 'reservations') {
      setSelectedBooking(item);
      setIsDetailsOpen(true);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    updateBookingStatus(bookingId, 'Cancelled');
    setIsDetailsOpen(false);
    setSelectedBooking(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId || !deleteConfirmType) return;
    try {
      if (deleteConfirmType === 'booking') {
        deleteBooking(deleteConfirmId);
      } else if (deleteConfirmType === 'room') {
        deleteRoomUnit(deleteConfirmId);
      } else if (deleteConfirmType === 'category') {
        deleteCategory(deleteConfirmId);
      }
    } catch (e) { }
    setDeleteConfirmId(null);
    setDeleteConfirmType(null);
  };

  if (activeTab === 'amenities') {
    return <AmenitiesView />;
  }

  if (activeTab === 'policies') {
    return <PoliciesView />;
  }

  return (
    <div className="space-y-6 animate-fade-in relative h-full">

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {activeTab === 'reservations'
              ? 'Room Reservations'
              : activeTab === 'rooms'
                ? 'Rooms List'
                : activeTab === 'categories'
                  ? 'Room Categories'
                  : 'Rooms'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {activeTab === 'reservations'
              ? 'Coordinate room reservations, vacancies, check-ins, and guest stay details.'
              : activeTab === 'rooms'
                ? 'Manage individual room units, room numbers, status, and floor assignments.'
                : 'Configure room types, capacities, base pricing, and category details.'}
          </p>
        </div>

        {/* Dynamic Add Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'reservations' && (
            <ShadcnButton
              onClick={openAddBooking}
              className="flex items-center gap-2 bg-black! text-white! hover:bg-black/90! rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <Plus className="h-4 w-4" />
              New Reservation
            </ShadcnButton>
          )}
          {activeTab === 'rooms' && (
            <ShadcnButton
              onClick={openAddRoom}
              className="flex items-center gap-2 bg-black! text-white! hover:bg-black/90! rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <Plus className="h-4 w-4" />
              Add Room Unit
            </ShadcnButton>
          )}
          {activeTab === 'categories' && (
            <ShadcnButton
              onClick={openAddCategory}
              className="flex items-center gap-2 bg-black! text-white! hover:bg-black/90! rounded-xl px-4 py-2 text-xs font-bold cursor-pointer h-10 shadow-sm border-none dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </ShadcnButton>
          )}
        </div>
      </div>
<<<<<<< HEAD
=======

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'reservations'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Reservations
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Rooms List
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('amenities')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            (activeTab as string) === 'amenities'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Amenities
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            (activeTab as string) === 'policies'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Policies
        </button>
      </div>
>>>>>>> 788f88c46a72f7bbed770c14d8102f4c63d692cf
        <>
          {/* Analytics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs">
          <CardDescription className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-400 tracking-wider">Total Rooms</CardDescription>
          <CardTitle className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mt-1">{totalUnits} Units</CardTitle>
        </Card>
        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs">
          <CardDescription className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-400 tracking-wider font-sans">Checked In</CardDescription>
          <CardTitle className="text-xl font-bold text-violet-600 dark:text-violet-400 mt-1">{occupiedCount} Rooms</CardTitle>
        </Card>
        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs">
          <CardDescription className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-400 tracking-wider font-sans">Reserved</CardDescription>
          <CardTitle className="text-xl font-bold text-amber-500 dark:text-amber-400 mt-1">{reservedCount} Rooms</CardTitle>
        </Card>
        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs">
          <CardDescription className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-400 tracking-wider font-sans">Vacant & Prepared</CardDescription>
          <CardTitle className="text-xl font-bold text-emerald-500 dark:text-emerald-400 mt-1">{vacantCount} Rooms</CardTitle>
        </Card>
        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs col-span-2 lg:col-span-1">
          <CardDescription className="text-[10px] uppercase font-bold text-zinc-455 dark:text-zinc-400 tracking-wider font-sans">Occupancy Rate</CardDescription>
          <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{occupancyRate}%</CardTitle>
        </Card>
      </div>

      {/* Advanced Filter Section */}
      <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">

            {/* Search filter */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                <Search className="h-4 w-4" />
              </span>
              <ShadcnInput
                type="text"
                placeholder={
                  activeTab === 'reservations'
                    ? "Search reservations by guest name or email..."
                    : activeTab === 'rooms'
                      ? "Search rooms by room number or floor..."
                      : "Search categories by name..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-10 pl-10 pr-4 text-xs text-foreground placeholder-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 focus-visible:border-zinc-955 outline-hidden transition-all"
              />
            </div>

            {/* Category Select Filter (Not applicable to categories tab itself) */}
            {activeTab !== 'categories' && (
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 h-10 px-3.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer transition-all">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50 shadow-md">
                  <SelectItem value="ALL" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">
                    All Categories
                  </SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">
                      {cat.name.replace('Seyeya ', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Status Select Filter (Not applicable to categories tab itself) */}
            {activeTab !== 'categories' && (
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 h-10 px-3.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer transition-all">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 z-50 shadow-md">
                  <SelectItem value="ALL" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">
                    All Status
                  </SelectItem>
                  {activeTab === 'reservations' ? (
                    <>
                      <SelectItem value="Reserved" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">Reserved</SelectItem>
                      <SelectItem value="Checked In" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">Checked In</SelectItem>
                      <SelectItem value="Checked Out" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">Checked Out</SelectItem>
                      <SelectItem value="Cancelled" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">Cancelled</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Available" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">Available</SelectItem>
                      <SelectItem value="Reserved" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">Reserved</SelectItem>
                      <SelectItem value="Occupied" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">Occupied</SelectItem>
                      <SelectItem value="Maintenance" className="text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden">Maintenance</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}

            {/* Reset Button */}
            {(searchTerm || filterCategory !== 'ALL' || filterStatus !== 'ALL') && (
              <ShadcnButton
                onClick={resetFilters}
                variant="ghost"
                className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl h-10 px-3 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </ShadcnButton>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* Columns selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ShadcnButton variant="outline" className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer text-xs font-bold shadow-xs transition-all">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Columns
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                </ShadcnButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[170px] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-md p-1.5 mt-1 z-50">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline-hidden flex items-center gap-2"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id === 'roomUnitNumber'
                          ? 'Assigned Room'
                          : column.id === 'roomName'
                            ? 'Category Type'
                            : column.id === 'totalPaid'
                              ? 'Total Value'
                              : column.id === 'roomStatus'
                                ? 'Room Status'
                                : column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* DataTable Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-[20px] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-955 dark:border-zinc-300 border-t-transparent" />
            <p className="text-xs text-zinc-500 dark:text-zinc-450 font-semibold tracking-wider uppercase">Loading Console...</p>
          </div>
        ) : activeTableData.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="h-9 w-9 mx-auto text-zinc-400 mb-3 animate-pulse" />
            <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-350 uppercase tracking-wider">No matching items found</h5>
            <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
              We couldn't find any entries matching the active search or filter parameters.
            </p>
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider py-3.5 px-4 text-left">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => handleRowClick(row.original)}
                    className={`border-zinc-100 dark:border-zinc-800 transition-colors ${activeTab === 'reservations'
                      ? 'cursor-pointer hover:bg-zinc-50/40 dark:hover:bg-zinc-850/40'
                      : 'hover:bg-transparent'
                      }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 text-xs font-medium text-zinc-750 dark:text-zinc-300">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex-1 text-zinc-450 dark:text-zinc-400 font-bold">
                Showing {table.getRowModel().rows.length} of {activeTableData.length} entries
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Page</span>
                  <strong className="text-zinc-900 dark:text-zinc-200 font-extrabold">
                    {table.getState().pagination.pageIndex + 1} of{' '}
                    {table.getPageCount()}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShadcnButton
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </ShadcnButton>
                  <ShadcnButton
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </ShadcnButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>

      {/* -------------------------------------------------------------
          DRAWER: Add / Edit Room Category
          ------------------------------------------------------------- */}
      <Drawer open={isCategoryDrawerOpen} onOpenChange={setIsCategoryDrawerOpen} direction="right" modal={false}>
        <DrawerContent className="h-full overflow-y-auto w-full sm:max-w-lg bg-card text-card-foreground dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800">
          <DrawerHeader className="border-b border-zinc-150 dark:border-zinc-800 pb-4 bg-zinc-50/50 dark:bg-zinc-950/40">
            <DrawerTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {editCategoryItem ? 'Edit Room Category' : 'New Room Category'}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure room type titles, rates, capacity levels, and amenities.
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4 p-5 bg-white dark:bg-zinc-900">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Deluxe Riverside Cottage"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Base Rate *</label>
              <input
                type="number"
                required
                min={0}
                placeholder="300000"
                value={catPriceUGX}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCatPriceUGX(val);
                  setCatPriceUSD(val);
                }}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Max Adults *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={catAdults}
                  onChange={(e) => setCatAdults(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Max Children</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={catChildren}
                  onChange={(e) => setCatChildren(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>
            </div>

            {/* -------------------------------------------------------------
                Rate Options / Pricing Options Section
                ------------------------------------------------------------- */}
            <div className="space-y-3 pt-3 pb-3 border-t border-b border-zinc-150 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-sans flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Rate Options / Pricing Options</span>
                  </label>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Define multiple meal plans, board options, or flexible pricing tiers for this category.
                  </p>
                </div>

                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50">
                  {catRateOptions.filter(r => r.isActive).length} Active Options
                </Badge>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleAddPresetRate('Bed & Breakfast (BB)', 50000, 15, ['Breakfast Included'])}
                  className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                >
                  + Bed & Breakfast
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetRate('Half Board (HB)', 110000, 30, ['Breakfast & Dinner'])}
                  className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                >
                  + Half Board
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetRate('Full Board (FB)', 180000, 50, ['All Meals Included'])}
                  className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                >
                  + Full Board
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetRate('Non-Refundable Saver', -30000, -10, ['Non-Refundable'])}
                  className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-[10px] font-semibold transition-all cursor-pointer"
                >
                  + Non-Refundable
                </button>
              </div>

              {/* Rate Options Dynamic Items List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {catRateOptions.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-400">No rate options added yet. Click "+ Add Rate Option" below.</p>
                  </div>
                ) : (
                  catRateOptions.map((rate) => (
                    <div 
                      key={rate.id}
                      className={`p-3 rounded-xl border transition-all ${
                        rate.isActive 
                          ? 'bg-zinc-50/70 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800' 
                          : 'bg-zinc-100/40 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-zinc-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Rate Option Name (e.g. Bed & Breakfast)"
                          value={rate.name}
                          onChange={(e) => updateRateOption(rate.id, { name: e.target.value })}
                          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-50 outline-hidden"
                        />

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rate.isActive}
                              onChange={(e) => updateRateOption(rate.id, { isActive: e.target.checked })}
                              className="rounded border-zinc-300 accent-emerald-500 cursor-pointer"
                            />
                            <span>Active</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeRateOption(rate.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Remove Rate Option"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-0.5 font-sans">
                          Rate Amount
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={rate.priceUGX}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateRateOption(rate.id, { priceUGX: val, priceUSD: val });
                          }}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-50 outline-hidden font-mono"
                        />
                      </div>

                      {/* Display live formatted calculation badge */}
                      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-150 dark:border-zinc-800/60">
                        <span>Display Preview:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {Number(rate.priceUGX || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <ShadcnButton
                type="button"
                variant="outline"
                onClick={addNewRateOption}
                className="w-full h-9 text-xs font-bold rounded-xl border-dashed border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-center gap-1.5 text-zinc-700 dark:text-zinc-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Custom Rate Option
              </ShadcnButton>
            </div>

            {/* Managed Amenities Multi-Select Tag Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-sans">
                  Category Amenities
                </label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Auto-Icon Match
                </span>
              </div>
              
              {/* Quick Select Badges */}
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 max-h-36 overflow-y-auto">
                {managedAmenities.map(am => {
                  const selectedList = catAmenities.split(',').map(s => s.trim()).filter(Boolean);
                  const isSelected = selectedList.some(s => s.toLowerCase() === am.name.toLowerCase());
                  
                  const toggleAmenity = () => {
                    if (isSelected) {
                      const newList = selectedList.filter(s => s.toLowerCase() !== am.name.toLowerCase());
                      setCatAmenities(newList.join(', '));
                    } else {
                      const newList = [...selectedList, am.name];
                      setCatAmenities(newList.join(', '));
                    }
                  };

                  return (
                    <button
                      key={am.id}
                      type="button"
                      onClick={toggleAmenity}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/40 shadow-xs font-bold'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {renderAssetIcon(am.iconName, "h-3.5 w-3.5 text-amber-500")}
                      <span>{am.name}</span>
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                placeholder="Selected amenities (comma separated)..."
                value={catAmenities}
                onChange={(e) => setCatAmenities(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-foreground dark:text-zinc-50 outline-hidden font-semibold"
              />
            </div>

            {/* Category Stay Policies Multi-Select Tag Picker */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-150 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-sans flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Category Stay Policies</span>
                </label>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Auto-Icon Match
                </span>
              </div>
              
              {/* Quick Select Badges */}
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 max-h-36 overflow-y-auto">
                {managedPolicies.map(pol => {
                  const isSelected = catSelectedPolicies.includes(pol.id) || catSelectedPolicies.includes(pol.title);
                  
                  const togglePolicy = () => {
                    if (isSelected) {
                      setCatSelectedPolicies(prev => prev.filter(p => p !== pol.id && p !== pol.title));
                    } else {
                      setCatSelectedPolicies(prev => [...prev, pol.id]);
                    }
                  };

                  return (
                    <button
                      key={pol.id}
                      type="button"
                      onClick={togglePolicy}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs' 
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {renderAssetIcon(pol.iconName || autoDetectPolicyIcon(pol.title), 'h-3.5 w-3.5 text-indigo-500')}
                      <span>{pol.title}</span>
                      {isSelected && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Category Photos (Unlimited)</label>
              
              {/* Thumbnail grid */}
              {catPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {catPhotos.map((photoUrl, idx) => {
                    const isPrimary = photoUrl === catImage;
                    return (
                      <div key={idx} className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${isPrimary ? 'border-indigo-500 shadow-md' : 'border-zinc-200 dark:border-zinc-800'}`}>
                        <img src={getImageUrl(photoUrl)} alt={`Thumbnail ${idx}`} className="h-full w-full object-cover" />
                        
                        {/* Overlay with options */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 text-center">
                          <button
                            type="button"
                            onClick={() => setCatImage(photoUrl)}
                            className="bg-indigo-600 text-white rounded-lg px-1.5 py-1 text-[9px] font-bold cursor-pointer hover:bg-indigo-700 transition-colors w-full"
                          >
                            Set Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCatPhotos(prev => {
                                const next = prev.filter(url => url !== photoUrl);
                                // If primary image was deleted, assign the next available one
                                if (isPrimary && next.length > 0) {
                                  setCatImage(next[0]);
                                } else if (isPrimary) {
                                  setCatImage('');
                                }
                                return next;
                              });
                            }}
                            className="bg-red-600 text-white rounded-lg px-1.5 py-1 text-[9px] font-bold cursor-pointer hover:bg-red-700 transition-colors w-full"
                          >
                            Delete
                          </button>
                        </div>
                        
                        {/* Primary Badge */}
                        {isPrimary && (
                          <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Check className="h-2 w-2" />
                            Primary
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload trigger zone */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="category-photo-file-input"
                />
                <label
                  htmlFor="category-photo-file-input"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-950/20 hover:bg-indigo-50/5 dark:hover:bg-indigo-500/5 cursor-pointer transition-all text-center h-28"
                >
                  {isUploadingPhoto ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider animate-pulse">Uploading Image...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-zinc-450 dark:text-zinc-500 mb-1.5" />
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Upload Photo</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Select image files</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Description</label>
              <textarea
                placeholder="Brief description about the room styling, views, and unique highlights..."
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-100 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 leading-normal font-medium resize-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800 mt-6 bg-white dark:bg-zinc-900">
              <ShadcnButton
                type="button"
                variant="outline"
                onClick={() => setIsCategoryDrawerOpen(false)}
                className="rounded-xl px-4 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 cursor-pointer h-10"
              >
                Cancel
              </ShadcnButton>
              <ShadcnButton
                type="submit"
                className="bg-black! text-white! hover:bg-black/90! rounded-xl px-5 text-xs font-bold cursor-pointer h-10 border-none dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
              >
                Save Category
              </ShadcnButton>
            </div>
          </form>
        </DrawerContent>
      </Drawer>

      {/* -------------------------------------------------------------
          DRAWER: Add / Edit Room Unit
          ------------------------------------------------------------- */}
      <Drawer open={isRoomDrawerOpen} onOpenChange={setIsRoomDrawerOpen} direction="right" modal={false}>
        <DrawerContent className="h-full overflow-y-auto w-full sm:max-w-lg bg-card text-card-foreground dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800">
          <DrawerHeader className="border-b border-zinc-150 dark:border-zinc-800 pb-4 bg-zinc-50/50 dark:bg-zinc-950/40">
            <DrawerTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {editRoomItem ? 'Edit Room Unit' : 'New Room Unit'}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Create individual rooms or cottages and assign them to a category.
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleRoomSubmit} className="space-y-4 p-5 bg-white dark:bg-zinc-900">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Room / Cottage Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 104"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Room Category *</label>
              <select
                value={roomCatId}
                onChange={(e) => setRoomCatId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 cursor-pointer font-semibold"
              >
                <option value="" disabled className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Select a room type...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Floor / level</label>
                <input
                  type="text"
                  placeholder="e.g. 1st Floor"
                  value={roomFloor}
                  onChange={(e) => setRoomFloor(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Max Occupancy (Guests)</label>
                <input
                  type="number"
                  min={1}
                  value={roomMaxOcc}
                  onChange={(e) => setRoomMaxOcc(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Status *</label>
              <select
                value={roomUnitStatus}
                onChange={(e) => setRoomUnitStatus(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 cursor-pointer font-semibold"
              >
                <option value="Available" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Available</option>
                <option value="Reserved" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Reserved</option>
                <option value="Occupied" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Occupied</option>
                <option value="Maintenance" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Room Amenities (comma-separated)</label>
              <input
                type="text"
                placeholder="AC, Nile View, King Bed"
                value={roomAmens}
                onChange={(e) => setRoomAmens(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Unit Description</label>
              <textarea
                placeholder="Details specific to this unit unit's quietness, garden vistas, or specific configurations..."
                value={roomDesc}
                onChange={(e) => setRoomDesc(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-100 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 leading-normal font-medium resize-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800 mt-6 bg-white dark:bg-zinc-900">
              <ShadcnButton
                type="button"
                variant="outline"
                onClick={() => setIsRoomDrawerOpen(false)}
                className="rounded-xl px-4 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 cursor-pointer h-10"
              >
                Cancel
              </ShadcnButton>
              <ShadcnButton
                type="submit"
                className="bg-black! text-white! hover:bg-black/90! rounded-xl px-5 text-xs font-bold cursor-pointer h-10 border-none dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
              >
                Save Room
              </ShadcnButton>
            </div>
          </form>
        </DrawerContent>
      </Drawer>

      {/* -------------------------------------------------------------
          DRAWER: Add / Edit Reservation
          ------------------------------------------------------------- */}
      <Drawer open={isBookingDrawerOpen} onOpenChange={setIsBookingDrawerOpen} direction="right" modal={false}>
        <DrawerContent className="h-full overflow-y-auto w-full sm:max-w-lg bg-card text-card-foreground dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800">
          <DrawerHeader className="border-b border-zinc-200/50 dark:border-zinc-800 pb-4 bg-zinc-50/50 dark:bg-zinc-950/40">
            <DrawerTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {editBookingItem ? 'Edit Room Reservation' : 'New Room Reservation'}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Manually book a cottage or executive room for checking-in guests.
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleBookingSubmit} className="space-y-4 p-5 bg-white dark:bg-zinc-900">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Cottage Category *</label>
              <select
                value={bookCatId}
                onChange={(e) => {
                  setBookCatId(e.target.value);
                  setBookRoomUnitId(''); // reset unit assignment
                  handleBookingDateOrCatChange(e.target.value, bookCheckIn, bookCheckOut);
                }}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 cursor-pointer font-semibold"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Assign Room Unit (Optional)</label>
              <select
                value={bookRoomUnitId}
                onChange={(e) => setBookRoomUnitId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 cursor-pointer font-semibold"
              >
                <option value="" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Keep Unassigned (Auto Assign at Check-In)</option>
                {availableRoomUnitsForCategory.map(ru => (
                  <option key={ru.id} value={ru.id} className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Room {ru.roomNumber} ({ru.floor})</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">Search and Select Guests *</label>
              <div className="relative z-50">
                <input
                  type="text"
                  placeholder="Type guest name to search..."
                  value={guestSearchTerm}
                  onChange={(e) => {
                    setGuestSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
                {guestSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setGuestSearchTerm('')}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {(() => {
                      const { maxAdults, maxChildren } = getCategoryCapacity(bookCatId);
                      const currentAdults = selectedGuests.filter(g => !g.isChild).length;
                      const currentChildren = selectedGuests.filter(g => g.isChild).length;
                      const onlyChildrenAllowed = currentAdults >= maxAdults;

                      const eligible = allClients.filter(c => {
                        const matchesSearch = c.full_name.toLowerCase().includes(guestSearchTerm.toLowerCase());
                        const notSelectedYet = !selectedGuests.some(sg => 
                          String(sg.id) === String(c.customer_id) || 
                          sg.name.toLowerCase() === c.full_name.toLowerCase()
                        );
                        if (!matchesSearch || !notSelectedYet) return false;

                        if (onlyChildrenAllowed) {
                          return !!c.is_child;
                        }
                        if (currentChildren >= maxChildren) {
                          return !c.is_child;
                        }
                        return true;
                      });

                      if (eligible.length === 0) {
                        return (
                          <div className="p-3 text-xs text-zinc-450 dark:text-zinc-400 text-center font-medium">
                            No unregistered matching guests found
                          </div>
                        );
                      }

                      return eligible.map(c => (
                        <div
                          key={c.customer_id}
                          onClick={() => {
                            if (selectedGuests.some(sg => 
                              String(sg.id) === String(c.customer_id) || 
                              sg.name.toLowerCase() === c.full_name.toLowerCase()
                            )) {
                              alert("This guest is already selected.");
                              return;
                            }
                            const roomUnitObj = roomUnits.find(ru => ru.id === bookRoomUnitId);
                            const maxOccupancy = roomUnitObj?.maxOccupancy || maxAdults;
                            const adultsCount = selectedGuests.filter(g => !g.isChild).length;
                            const isGuestChild = !!c.is_child;

                            if (!isGuestChild && adultsCount >= maxOccupancy) {
                              const confirmChild = window.confirm(`This room's maximum capacity is ${maxOccupancy} adults, and this guest is registered as an Adult. Do you want to add them as a Child for this reservation?`);
                              if (confirmChild) {
                                setSelectedGuests([...selectedGuests, { id: c.customer_id, name: c.full_name, isChild: true }]);
                              } else {
                                alert(`Cannot add another adult. The room capacity is capped at ${maxOccupancy} adults.`);
                              }
                            } else {
                              setSelectedGuests([...selectedGuests, { id: c.customer_id, name: c.full_name, isChild: isGuestChild }]);
                            }
                            setGuestSearchTerm('');
                            setIsDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer font-medium flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 text-zinc-800 dark:text-zinc-200"
                        >
                          <span>{c.full_name} {c.is_child && <span className="text-[9px] bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 px-1 rounded-sm ml-1 font-bold">Child</span>}</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{c.phone_number || c.email || ""}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </>
              )}
            </div>

            {selectedGuests.length > 0 && (
              <div className="space-y-2.5 bg-zinc-50/70 dark:bg-zinc-950/20 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">Selected Occupying Guests</span>
                <div className="space-y-2">
                  {selectedGuests.map((guest, idx) => (
                    <div key={`${guest.id}-${idx}`} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800 shadow-3xs">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground dark:text-zinc-150">
                          {guest.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const { maxAdults, maxChildren } = getCategoryCapacity(bookCatId);
                            const roomUnitObj = roomUnits.find(ru => ru.id === bookRoomUnitId);
                            const maxOccupancy = roomUnitObj?.maxOccupancy || maxAdults;

                            if (guest.isChild) {
                              const newAdultsCount = selectedGuests.filter(g => !g.isChild).length + 1;
                              if (newAdultsCount > maxOccupancy) {
                                alert(`Cannot change to Adult. The maximum capacity of this room is ${maxOccupancy} adults.`);
                                return;
                              }
                              if (newAdultsCount > maxAdults) {
                                alert(`Cannot change to Adult. This category only allows a maximum of ${maxAdults} adults.`);
                                return;
                              }
                            } else {
                              const newChildrenCount = selectedGuests.filter(g => g.isChild).length + 1;
                              if (newChildrenCount > maxChildren) {
                                alert(`Cannot change to Child. This category only allows a maximum of ${maxChildren} children.`);
                                return;
                              }
                            }

                            setSelectedGuests(selectedGuests.map(g =>
                              g.id === guest.id ? { ...g, isChild: !g.isChild } : g
                            ));
                          }}
                          className={`text-[9px] font-extrabold px-2 py-1 rounded-lg border uppercase tracking-wider cursor-pointer ${guest.isChild
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                            : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50'
                            }`}
                        >
                          {guest.isChild ? 'Child' : 'Adult'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedGuests(selectedGuests.filter(g => g.id !== guest.id))}
                          className="text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 p-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 mb-1.5 font-sans">Check-In Date *</label>
                <input
                  type="date"
                  required
                  value={bookCheckIn}
                  onChange={(e) => {
                    setBookCheckIn(e.target.value);
                    handleBookingDateOrCatChange(bookCatId, e.target.value, bookCheckOut);
                  }}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 mb-1.5 font-sans">Check-Out Date *</label>
                <input
                  type="date"
                  required
                  value={bookCheckOut}
                  onChange={(e) => {
                    setBookCheckOut(e.target.value);
                    handleBookingDateOrCatChange(bookCatId, bookCheckIn, e.target.value);
                  }}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 mb-1.5 font-sans">Reservation Value (UGX) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={bookTotalPaid}
                  onChange={(e) => setBookTotalPaid(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 mb-1.5 font-sans">Booking Status *</label>
                <select
                  value={bookStatus}
                  onChange={(e) => setBookStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-zinc-955 dark:focus:border-zinc-700 cursor-pointer font-semibold"
                >
                  <option value="Reserved" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Reserved</option>
                  <option value="Checked In" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Checked In</option>
                  <option value="Checked Out" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Checked Out</option>
                  <option value="Cancelled" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800 mt-6 bg-white dark:bg-zinc-900">
              <ShadcnButton
                type="button"
                variant="outline"
                onClick={() => setIsBookingDrawerOpen(false)}
                className="rounded-xl px-4 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 cursor-pointer h-10"
              >
                Cancel
              </ShadcnButton>
              <ShadcnButton
                type="submit"
                className="bg-black! text-white! hover:bg-black/90! rounded-xl px-5 text-xs font-bold cursor-pointer h-10 border-none dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
              >
                Save Reservation
              </ShadcnButton>
            </div>
          </form>
        </DrawerContent>
      </Drawer>

      {/* -------------------------------------------------------------
          DETAILS SLIDE-OVER DRAWER: Booking Details Summary
          ------------------------------------------------------------- */}
      <Drawer open={isDetailsOpen} onOpenChange={setIsDetailsOpen} direction="right" modal={false}>
        <DrawerContent className="h-full overflow-y-auto w-full sm:max-w-md bg-card text-card-foreground dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800">
          {selectedBooking && (
            <div className="flex flex-col h-full font-sans bg-white dark:bg-zinc-900">
              <DrawerHeader className="border-b border-zinc-150 dark:border-zinc-800 pb-4 flex justify-between items-center shrink-0 bg-zinc-50/50 dark:bg-zinc-950/40">
                <div>
                  <DrawerTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">Cottage Occupancy Details</DrawerTitle>
                  <DrawerDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                    Front-desk koordinations for checking in/out.
                  </DrawerDescription>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="text-zinc-500 hover:text-foreground dark:hover:text-zinc-200 rounded-lg p-1.5 transition-colors focus:outline-none cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center text-zinc-655 dark:text-zinc-350 shadow-inner">
                    <Bed className="h-8 w-8 text-violet-500 dark:text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedBooking.roomUnitNumber ? `Room ${selectedBooking.roomUnitNumber}` : 'Unassigned Room'}
                    </h4>
                    <span className="inline-block px-2.5 py-1 mt-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {selectedBooking.roomName}
                    </span>
                  </div>
                </div>

                <div className="space-y-5 border-t border-zinc-100/60 dark:border-zinc-800 pt-5">
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-450 block">Registered Occupants ({selectedBooking.guests?.length || 1})</span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedBooking.guests && selectedBooking.guests.length > 0 ? (
                        selectedBooking.guests.map((g: any, index: number) => {
                          const client = allClients.find(c => String(c.customer_id) === String(g.customer_id)) || 
                                         allClients.find(c => c.full_name === g.name);
                          const name = client?.full_name || g.name || `Guest #${g.customer_id}`;
                          const phone = client?.phone_number || g.phone_number || '';
                          const email = client?.email || g.email || '';
                          const nationality = client?.nationality || g.nationality || '';
                          const idDoc = client ? (client.nin || client.passport_number) : (g.nin || g.passport_number);
                          const isChild = g.is_child;

                          return (
                            <div key={index} className="p-3 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl space-y-1 text-xs text-left">
                              <div className="flex items-center justify-between font-bold text-zinc-800 dark:text-zinc-150">
                                <span>{name}</span>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg border uppercase tracking-wider shrink-0 ${isChild
                                  ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                                  : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50'
                                }`}>
                                  {isChild ? 'Child' : 'Adult'}
                                </span>
                              </div>
                              {email && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Email: {email}</p>}
                              {phone && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Phone: {phone}</p>}
                              {nationality && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Nationality: {nationality}</p>}
                              {idDoc && <p className="text-[10px] text-zinc-500 dark:text-zinc-450 font-semibold">ID/Passport: {idDoc}</p>}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl space-y-1 text-xs text-left">
                          <div className="flex items-center justify-between font-bold text-zinc-800 dark:text-zinc-150">
                            <span>{selectedBooking.guestName}</span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg border uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50">
                              Adult
                            </span>
                          </div>
                          {selectedBooking.email && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Email: {selectedBooking.email}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 border border-zinc-200/50 dark:border-zinc-800 rounded-[18px] text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">Check In</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200 block">{selectedBooking.checkIn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">Check Out</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200 block">{selectedBooking.checkOut}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50/50 dark:bg-zinc-950/30 p-4 border border-zinc-200/50 dark:border-zinc-800 rounded-[18px] text-xs flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">Total Rental Value</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                      UGX {selectedBooking.totalPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">Current Status</span>
                    <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedBooking.status === 'Checked In'
                      ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900/50'
                      : selectedBooking.status === 'Reserved'
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                        : selectedBooking.status === 'Checked Out'
                          ? 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-350 border-zinc-200 dark:border-zinc-700'
                          : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-350 border-red-200 dark:border-red-900/50'
                      }`}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 bg-zinc-50/50 dark:bg-zinc-950/40 border-t border-zinc-100/60 dark:border-zinc-800 flex flex-col gap-2 shrink-0">
                {selectedBooking.status === 'Reserved' && (
                  <>
                    <button
                      onClick={() => {
                        // Quick auto assignment if unassigned
                        let assignedUnitId = selectedBooking.roomUnitId;
                        if (!assignedUnitId) {
                          const openUnit = roomUnits.find(ru => ru.roomCategoryId === selectedBooking.roomId && ru.roomStatus === 'Available');
                          if (openUnit) {
                            assignedUnitId = openUnit.id;
                            updateBooking({
                              ...selectedBooking,
                              roomUnitId: openUnit.id,
                              roomUnitNumber: openUnit.roomNumber,
                              status: 'Checked In'
                            });
                          } else {
                            alert("No available rooms in this category to assign. Please assign a room manually.");
                            return;
                          }
                        } else {
                          updateBookingStatus(selectedBooking.id, 'Checked In');
                        }
                        setIsDetailsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#212121] hover:bg-zinc-800 text-white py-3 text-xs font-bold transition-colors cursor-pointer shadow-sm dark:bg-zinc-800! dark:text-white! dark:hover:bg-zinc-700!"
                    >
                      <UserCheck className="h-4 w-4" />
                      Check In Guest
                    </button>
                    <button
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-full bg-red-50 dark:bg-red-955/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 py-3 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      Cancel Reservation
                    </button>
                  </>
                )}
                {selectedBooking.status === 'Checked In' && (
                  <button
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, 'Checked Out');
                      setIsDetailsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white py-3 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Check Out / Clear Room
                  </button>
                )}
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* -------------------------------------------------------------
          MODAL: Deletion Confirms
          ------------------------------------------------------------- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Confirm Deletion</h5>
            </div>
            <p className="text-xs text-zinc-655 dark:text-zinc-300 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this {deleteConfirmType}? This action is irreversible and will release any associated bookings or rooms.
            </p>
            <div className="flex justify-end gap-2">
              <ShadcnButton
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmType(null);
                }}
                variant="outline"
                className="rounded-xl px-4 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-355 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 cursor-pointer h-10"
              >
                Cancel
              </ShadcnButton>
              <ShadcnButton
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-xl px-4 text-xs font-bold cursor-pointer h-10 border-none"
              >
                Delete Permanently
              </ShadcnButton>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default Rooms;
