import { useMemo } from 'react';
import { loadLeads } from '../utils/mockData';
import { useRestaurant } from './useRestaurant';
import { useAccommodation } from './useAccommodation';
import { useConference } from './useConference';

export const useAnalytics = () => {
  const leads = useMemo(() => loadLeads(), []);
  const { orders } = useRestaurant();
  const { bookings } = useAccommodation();
  const { quotes } = useConference();

  return useMemo(() => {
    // 1. Compute Revenues per department (in UGX)
    // Convert USD leads to UGX for consistency (Exchange rate: 1 USD = 3700 UGX)
    const EX_RATE = 3700;

    const crmRevenue = leads
      .filter(l => l.stage === 'Won')
      .reduce((sum, l) => sum + (l.value * EX_RATE), 0);

    const lodgeRevenue = bookings
      .filter(b => b.status === 'Checked In' || b.status === 'Checked Out')
      .reduce((sum, b) => sum + b.totalPaid, 0);

    const foodRevenue = orders
      .filter(o => o.status === 'Completed' || o.status === 'Ready' || o.status === 'Preparing')
      .reduce((sum, o) => sum + o.value, 0);

    const eventRevenue = quotes
      .filter(q => q.status === 'Approved')
      .reduce((sum, q) => sum + q.totalCostUGX, 0);

    const totalRevenueUGX = crmRevenue + lodgeRevenue + foodRevenue + eventRevenue;

    // 2. Compute Active Counts
    const activeCheckins = bookings.filter(b => b.status === 'Checked In').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const pendingQuotes = quotes.filter(q => q.status === 'Pending').length;

    // 3. Channel breakdown data for Pie/Bar charts
    const distributionData = [
      { name: 'Cottage Lodges', value: lodgeRevenue, pct: totalRevenueUGX > 0 ? Math.round((lodgeRevenue / totalRevenueUGX) * 100) : 0 },
      { name: 'Events & Halls', value: eventRevenue, pct: totalRevenueUGX > 0 ? Math.round((eventRevenue / totalRevenueUGX) * 100) : 0 },
      { name: 'Nile Restaurant', value: foodRevenue, pct: totalRevenueUGX > 0 ? Math.round((foodRevenue / totalRevenueUGX) * 100) : 0 },
      { name: 'CRM Contracts', value: crmRevenue, pct: totalRevenueUGX > 0 ? Math.round((crmRevenue / totalRevenueUGX) * 100) : 0 },
    ];

    // 4. Monthly aggregates (projections)
    const monthlyTrendData = [
      { name: 'Jan', Lodge: 8000000, Restaurant: 3200000, Events: 12000000 },
      { name: 'Feb', Lodge: 9500000, Restaurant: 4000000, Events: 8000000 },
      { name: 'Mar', Lodge: 12000000, Restaurant: 4500000, Events: 15000000 },
      { name: 'Apr', Lodge: 11000000, Restaurant: 5100000, Events: 18000000 },
      { name: 'May', Lodge: 14000000, Restaurant: 5800000, Events: 22000000 },
      { name: 'Jun', Lodge: lodgeRevenue > 0 ? lodgeRevenue : 15000000, Restaurant: foodRevenue > 0 ? foodRevenue : 6000000, Events: eventRevenue > 0 ? eventRevenue : 25000000 },
    ];

    return {
      revenueUGX: totalRevenueUGX,
      revenueUSD: totalRevenueUGX / EX_RATE,
      lodgeRevenue,
      foodRevenue,
      eventRevenue,
      crmRevenue,
      activeCheckins,
      pendingOrders,
      pendingQuotes,
      distributionData,
      monthlyTrendData,
    };
  }, [leads, orders, bookings, quotes]);
};
export default useAnalytics;
