import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Button as ShadcnButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  X,
  RefreshCw,
  UserPlus,
  User,
  Phone,
  Mail,
  Shield,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker";

export interface RegisterGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestCreated?: (newGuest: any) => Promise<void> | void;
  initialName?: string;
  existingGuests?: any[];
}

export const RegisterGuestModal: React.FC<RegisterGuestModalProps> = ({
  isOpen,
  onClose,
  onGuestCreated,
  initialName = '',
  existingGuests = [],
}) => {
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');
  const [nin, setNin] = useState('');
  const [passport, setPassport] = useState('');
  const [customerType, setCustomerType] = useState('Registered');
  const [isContract, setIsContract] = useState(false);
  const [isChild, setIsChild] = useState(false);
  const [parentId, setParentId] = useState<string>('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [adultGuests, setAdultGuests] = useState<any[]>([]);

  // When opening or existingGuests update, set up adult guests list for parent dropdown
  useEffect(() => {
    if (isOpen) {
      setFullName(initialName);
      setError('');
      setIsCreating(false);

      if (existingGuests && existingGuests.length > 0) {
        setAdultGuests(existingGuests.filter(g => !g.is_child));
      } else {
        api.get('/crm/customers?limit=500')
          .then(res => {
            const list = res.data || [];
            setAdultGuests(list.filter((g: any) => !g.is_child));
          })
          .catch(err => {
            console.error('Failed to load parent candidates:', err);
          });
      }
    }
  }, [isOpen, initialName, existingGuests]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!isChild) {
      if (!nin.trim() && !passport.trim()) {
        setError("For adult guests, either a NIN (National ID) or a Passport Number is mandatory.");
        return;
      }
    } else {
      if (!parentId) {
        setError("For children, selecting a Parent / Guardian (Adult) is mandatory.");
        return;
      }
    }

    setIsCreating(true);
    setError('');

    try {
      const payload = {
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
        email: email.trim() || null,
        gender: gender || null,
        date_of_birth: dob || null,
        nationality: nationality.trim() || null,
        address: address.trim() || null,
        nin: nin.trim() || null,
        passport_number: passport.trim() || null,
        customer_type: customerType,
        is_contract_client: isContract,
        is_active: true,
        is_child: isChild,
        parent_id: isChild && parentId ? parseInt(parentId) : null
      };

      const res = await api.post('/crm/customers', payload);
      const createdGuest = res.data;

      toast.success(`Guest profile "${createdGuest.full_name}" registered successfully.`);

      // Reset form fields
      setFullName('');
      setPhone('');
      setEmail('');
      setGender('');
      setDob('');
      setNationality('');
      setAddress('');
      setNin('');
      setPassport('');
      setCustomerType('Registered');
      setIsContract(false);
      setIsChild(false);
      setParentId('');

      // Close modal immediately so staff can proceed with the reservation
      onClose();

      if (onGuestCreated) {
        onGuestCreated(createdGuest);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'Failed to register guest profile.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card text-card-foreground dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl gap-0 pointer-events-auto z-[100]"
      >
        {/* Header */}
        <div className="border-b border-zinc-200/60 dark:border-zinc-800 p-5 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
                Register New Guest Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Create and save a new guest record in the CRM database.
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-zinc-50/80 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 space-y-3.5">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Personal Information
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  Guest Type *
                </label>
                <select
                  value={isChild ? 'Child' : 'Adult'}
                  onChange={(e) => setIsChild(e.target.value === 'Child')}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold cursor-pointer font-sans"
                >
                  <option value="Adult" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Adult (NIN or Passport mandatory)</option>
                  <option value="Child" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Child (NIN and Passport optional)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold cursor-pointer font-sans"
                >
                  <option value="" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Select Gender...</option>
                  <option value="Male" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Male</option>
                  <option value="Female" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Female</option>
                  <option value="Other" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Other</option>
                </select>
              </div>
            </div>

            {isChild && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  Parent / Guardian (Adult) *
                </label>
                <select
                  required
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold cursor-pointer font-sans"
                >
                  <option value="" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Select Parent/Guardian...</option>
                  {adultGuests.map(g => (
                    <option key={g.customer_id} value={g.customer_id} className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">
                      {g.full_name} ({g.phone_number || g.email || 'No contact'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  Date of Birth
                </label>
                <DatePicker
                  value={dob}
                  onChange={setDob}
                  placeholder="Select date of birth..."
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  Nationality
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ugandan"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold font-sans"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-zinc-50/80 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 space-y-3.5">
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Contact Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+256700000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                Address / City / Region
              </label>
              <input
                type="text"
                placeholder="e.g. Kampala, Uganda"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold font-sans"
              />
            </div>
          </div>

          {/* Identity & Category */}
          <div className="bg-zinc-50/80 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 space-y-3.5">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Identity & Category
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  NIN / National ID {!isChild && '*'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. CM000000000000"
                  value={nin}
                  onChange={(e) => setNin(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  Passport Number {!isChild && '*'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. B0000000"
                  value={passport}
                  onChange={(e) => setPassport(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-sans">
                  Category *
                </label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-foreground dark:text-zinc-50 outline-hidden focus:border-violet-600 dark:focus:border-violet-500 font-semibold cursor-pointer"
                >
                  <option value="Registered" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Registered</option>
                  <option value="WalkIn" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Walk-in</option>
                  <option value="Corporate" className="bg-white dark:bg-zinc-900 text-foreground dark:text-zinc-50">Corporate</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="reg_modal_contract_client"
                  checked={isContract}
                  onChange={(e) => setIsContract(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="reg_modal_contract_client" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  Corporate Contract Client
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-end gap-3 sticky bottom-0 bg-card dark:bg-zinc-900 py-2">
            <ShadcnButton
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-xl px-5 text-xs font-bold border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer h-10"
            >
              Cancel
            </ShadcnButton>
            <ShadcnButton
              type="submit"
              disabled={isCreating}
              className="rounded-xl px-6 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white cursor-pointer h-10 shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create & Select Guest</span>
                </>
              )}
            </ShadcnButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default RegisterGuestModal;
