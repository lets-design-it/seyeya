import React, { useState, useMemo } from 'react';
import { useConference, EventHall, ConferenceQuote } from '../../hooks/useConference';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Calculator, CheckCircle, Volume2, Video, Coffee, Users, Calendar } from 'lucide-react';

export const Conference: React.FC = () => {
  const { halls, requestQuote, calculateQuoteCost } = useConference();

  // Contact details
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [eventDate, setEventDate] = useState('2026-07-10');

  // Specs
  const [selectedHallId, setSelectedHallId] = useState('h-1');
  const [guests, setGuests] = useState<number>(100);
  const [days, setDays] = useState<number>(1);
  const [catering, setCatering] = useState<ConferenceQuote['cateringOption']>('Standard Breakfast');
  const [soundSystem, setSoundSystem] = useState(true);
  const [projector, setProjector] = useState(true);

  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Selected Hall helper
  const selectedHall = useMemo(() => {
    return halls.find(h => h.id === selectedHallId) || halls[0];
  }, [halls, selectedHallId]);

  // Handle guests slider bounds when hall shifts
  const handleHallShift = (hallId: string) => {
    setSelectedHallId(hallId);
    const hall = halls.find(h => h.id === hallId);
    if (hall && guests > hall.capacity) {
      setGuests(hall.capacity);
    }
  };

  // Real-time calculation
  const totalCostUGX = useMemo(() => {
    return calculateQuoteCost(selectedHall, guests, days, catering, soundSystem, projector);
  }, [selectedHall, guests, days, catering, soundSystem, projector, calculateQuoteCost]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !companyName || !email) {
      setError('Please fill in client details');
      return;
    }
    if (guests <= 0 || days <= 0) {
      setError('Days and headcount must be positive integers');
      return;
    }
    setError('');

    // Request quote
    requestQuote(
      selectedHall,
      clientName,
      companyName,
      email,
      guests,
      days,
      catering,
      soundSystem,
      projector,
      eventDate
    );

    // Reset fields & show success
    setClientName('');
    setCompanyName('');
    setEmail('');
    setIsSuccess(true);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16 font-sans">
      
      {/* Client Specs Card */}
      <Card variant="glass" className="p-4  shadow-md">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3.5">Organizer Profile & Specs</h4>
        
        {error && (
          <div className="mb-3.5 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Company Name"
              placeholder="e.g. Apex Corp"
              value={companyName}
              required
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input 
              label="Contact Person"
              placeholder="e.g. Sarah Jenkins"
              value={clientName}
              required
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Email Address"
              type="email"
              placeholder="sarah@apex.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input 
              label="Event Date"
              type="date"
              value={eventDate}
              required
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        </form>
      </Card>

      {/* Hall Picker */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Select Venue Hall / Lawn</h4>
        <div className="grid grid-cols-3 gap-2.5">
          {halls.map((hall) => {
            const isSelected = selectedHallId === hall.id;
            return (
              <button
                key={hall.id}
                onClick={() => handleHallShift(hall.id)}
                className={`rounded-xl border p-2.5 bg-zinc-50 text-left transition-all duration-200 flex flex-col justify-between h-28 relative ${
                  isSelected 
                    ? 'border-violet-500 bg-card/80 shadow-[0_0_12px_rgba(139,92,246,0.1)]' 
                    : 'border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div>
                  <h5 className="text-xs font-bold text-zinc-100 line-clamp-1">{hall.name.replace('Seyeya ', '')}</h5>
                  <span className="text-xs text-zinc-500 uppercase mt-0.5 block">Max: {hall.capacity} guests</span>
                </div>
                <div className="text-xs font-semibold text-violet-400">
                  UGX {(hall.basePriceUGX / 1000).toFixed(0)}k/d
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Headcount, Catering, Overlays Calculator */}
      <Card variant="glass" className="p-4 space-y-4  shadow-md">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider  pb-2">Seating & Catering Overlay Options</h4>
        
        {/* Headcount Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-500">Expected Attendance:</span>
            <span className="text-zinc-250 font-bold">{guests} Guests (Capacity Limit: {selectedHall.capacity})</span>
          </div>
          <input 
            type="range"
            min={10}
            max={selectedHall.capacity}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer bg-zinc-100 h-1 rounded-lg"
          />
        </div>

        {/* Days count */}
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Duration (Days)"
            type="number"
            min={1}
            value={days}
            required
            onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
          />

          {/* Catering Options */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550">Catering Overlay</label>
            <select
              value={catering}
              onChange={(e) => setCatering(e.target.value as ConferenceQuote['cateringOption'])}
              className="w-full rounded-xl  bg-zinc-100 py-2 px-3 text-xs text-foreground outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="None">No Catering (Space only)</option>
              <option value="Standard Breakfast">Breakfast Buffet (UGX 25k/head)</option>
              <option value="Executive Full Day">Full Day Executive Catering (UGX 55k/head)</option>
            </select>
          </div>
        </div>

        {/* Overlays / Equipment */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550">Technical & A/V Equipment</label>
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setSoundSystem(!soundSystem)}
              className={`rounded-xl border p-2.5 text-left flex items-center justify-between transition-colors ${
                soundSystem 
                  ? 'border-violet-500/30 bg-violet-650/5 text-violet-400' 
                  : 'border-zinc-900 bg-zinc-50 text-zinc-500'
              }`}
            >
              <span className="text-xs font-bold">Sound PA System</span>
              <Volume2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setProjector(!projector)}
              className={`rounded-xl border p-2.5 text-left flex items-center justify-between transition-colors ${
                projector 
                  ? 'border-indigo-500/30 bg-indigo-650/5 text-indigo-400' 
                  : 'border-zinc-900 bg-zinc-50 text-zinc-500'
              }`}
            >
              <span className="text-xs font-bold">HD Projector Display</span>
              <Video className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Real-time Pricing Summary Indicator Banner */}
      <Card variant="glow" className="p-4  flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider leading-none">
            <Calculator className="h-3.5 w-3.5" />
            <span>Estimated quote</span>
          </div>
          <span className="text-sm font-bold text-white mt-1.5 block leading-none">
            UGX {totalCostUGX.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-500 mt-1 block">~ ${(totalCostUGX / 3700).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
        </div>

        <Button 
          onClick={handleSubmit}
          className="px-5 py-3"
        >
          Request Quote
        </Button>
      </Card>

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card/75 backdrop-blur-md animate-fade-in">
          <div className="glass-panel glass-card-glow rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl ">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-450 animate-bounce">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Proposal Submitted</h3>
            <p className="mt-2 text-xs text-zinc-550">
              Your customized conference quote has been submitted to the Seyeya events planner team. We will contact you soon.
            </p>
            <Button 
              onClick={() => setIsSuccess(false)}
              className="w-full mt-6"
            >
              Great, thank you!
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
export default Conference;


