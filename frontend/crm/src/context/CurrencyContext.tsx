import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_ugx: number;
  is_default: boolean;
}

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  exchangeRates: Record<string, number>;
  currencies: CurrencyInfo[];
  usdRate: number; // 1 USD = X UGX
  setUsdRate: (rate: number) => Promise<void>;
  formatPrice: (amountInUGX: number, options?: { showCode?: boolean; compact?: boolean; precision?: number }) => string;
  convertFromUGX: (amountInUGX: number, targetCurrency?: string) => number;
  convertToUGX: (amountInTarget: number, sourceCurrency?: string) => number;
}

const DEFAULT_RATES: Record<string, number> = {
  UGX: 1.0,
  USD: 3700.0,
  EUR: 4050.0,
  GBP: 4700.0,
  KES: 28.5
};

const DEFAULT_CURRENCIES: CurrencyInfo[] = [
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX ', exchange_rate_to_ugx: 1.0, is_default: true },
  { code: 'USD', name: 'United States Dollar', symbol: '$', exchange_rate_to_ugx: 3700.0, is_default: false },
  { code: 'EUR', name: 'Euro', symbol: '€', exchange_rate_to_ugx: 4050.0, is_default: false },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchange_rate_to_ugx: 4700.0, is_default: false },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('seyeya_currency') || 'UGX';
  });

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('seyeya_exchange_rates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_RATES;
  });

  const [currencies, setCurrencies] = useState<CurrencyInfo[]>(DEFAULT_CURRENCIES);

  const fetchRates = useCallback(async () => {
    try {
      const res = await api.get('/currencies');
      if (res.data && Array.isArray(res.data)) {
        setCurrencies(res.data);
        const map: Record<string, number> = {};
        res.data.forEach((c: CurrencyInfo) => {
          map[c.code] = c.exchange_rate_to_ugx;
        });
        setExchangeRates(map);
        localStorage.setItem('seyeya_exchange_rates', JSON.stringify(map));
      }
    } catch (err) {
      console.warn('Using offline/default currency exchange rates', err);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    localStorage.setItem('seyeya_currency', code);
  };

  const setUsdRate = async (newRate: number) => {
    if (newRate <= 0) return;
    try {
      await api.put('/currencies/rates', { code: 'USD', exchange_rate_to_ugx: newRate });
      setExchangeRates(prev => {
        const next = { ...prev, USD: newRate };
        localStorage.setItem('seyeya_exchange_rates', JSON.stringify(next));
        return next;
      });
      fetchRates();
    } catch (err) {
      // Local fallback
      setExchangeRates(prev => {
        const next = { ...prev, USD: newRate };
        localStorage.setItem('seyeya_exchange_rates', JSON.stringify(next));
        return next;
      });
    }
  };

  const convertFromUGX = useCallback((amountInUGX: number, targetCurrency?: string): number => {
    const target = targetCurrency || currency;
    if (target === 'UGX' || !amountInUGX) return amountInUGX || 0;
    const rate = exchangeRates[target] || DEFAULT_RATES[target] || 3700.0;
    return amountInUGX / rate;
  }, [currency, exchangeRates]);

  const convertToUGX = useCallback((amountInTarget: number, sourceCurrency?: string): number => {
    const source = sourceCurrency || currency;
    if (source === 'UGX' || !amountInTarget) return amountInTarget || 0;
    const rate = exchangeRates[source] || DEFAULT_RATES[source] || 3700.0;
    return amountInTarget * rate;
  }, [currency, exchangeRates]);

  const formatPrice = useCallback((
    amountInUGX: number,
    options?: { showCode?: boolean; compact?: boolean; precision?: number }
  ): string => {
    const val = amountInUGX || 0;
    const showCode = options?.showCode ?? true;
    const compact = options?.compact ?? false;

    if (currency === 'UGX') {
      if (compact) {
        if (Math.abs(val) >= 1_000_000) {
          return `${showCode ? 'UGX ' : ''}${(val / 1_000_000).toFixed(1)}M`;
        }
        if (Math.abs(val) >= 1_000) {
          return `${showCode ? 'UGX ' : ''}${(val / 1_000).toFixed(0)}k`;
        }
      }
      return `${showCode ? 'UGX ' : ''}${Math.round(val).toLocaleString()}`;
    }

    // Dynamic conversion to selected target currency (e.g. USD)
    const converted = convertFromUGX(val, currency);
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
    
    if (compact) {
      if (Math.abs(converted) >= 1_000_000) {
        return `${symbol}${(converted / 1_000_000).toFixed(1)}M`;
      }
      if (Math.abs(converted) >= 1_000) {
        return `${symbol}${(converted / 1_000).toFixed(1)}k`;
      }
    }

    const precision = options?.precision ?? (converted % 1 === 0 ? 0 : 2);
    return `${symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    })}`;
  }, [currency, convertFromUGX]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      exchangeRates,
      currencies,
      usdRate: exchangeRates['USD'] || 3700.0,
      setUsdRate,
      formatPrice,
      convertFromUGX,
      convertToUGX
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
