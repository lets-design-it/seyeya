import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface VatContextType {
  vatRate: number;
  setVatRate: (rate: number) => void;
  fetchVatRate: () => Promise<number>;
}

const VatContext = createContext<VatContextType>({
  vatRate: 18,
  setVatRate: () => {},
  fetchVatRate: async () => 18
});

export const VatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vatRate, setVatRateState] = useState<number>(18);

  const fetchVatRate = async (): Promise<number> => {
    try {
      const res = await api.get('/hotel-details');
      const data = res.data?.data || res.data;
      if (data && data.vat_rate !== null && data.vat_rate !== undefined) {
        const rate = parseFloat(data.vat_rate);
        if (!isNaN(rate)) {
          setVatRateState(rate);
          return rate;
        }
      }
    } catch (e) {
      console.warn("Could not fetch hotel details VAT rate, using fallback 18%:", e);
    }
    return 18;
  };

  const setVatRate = (rate: number) => {
    setVatRateState(rate);
    window.dispatchEvent(new CustomEvent('seyeya_vat_updated', { detail: rate }));
  };

  useEffect(() => {
    fetchVatRate();

    const handleVatUpdated = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (typeof customEvt.detail === 'number' && !isNaN(customEvt.detail)) {
        setVatRateState(customEvt.detail);
      }
    };

    window.addEventListener('seyeya_vat_updated', handleVatUpdated);
    return () => {
      window.removeEventListener('seyeya_vat_updated', handleVatUpdated);
    };
  }, []);

  return (
    <VatContext.Provider value={{ vatRate, setVatRate, fetchVatRate }}>
      {children}
    </VatContext.Provider>
  );
};

export const useVatRate = () => useContext(VatContext);
