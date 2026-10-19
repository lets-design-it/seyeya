import api from './api';

export interface ExecutiveSummaryReport {
  total_revenue_ugx: number;
  total_revenue_usd: number;
  lodge_revenue: number;
  restaurant_revenue: number;
  conference_revenue: number;
  active_checkins: number;
  pending_orders: number;
  pending_quotes: number;
  distribution_data: Array<{ name: string; value: number; pct: number }>;
  monthly_trend_data: Array<Record<string, any>>;
}

export interface StaffPerformanceItem {
  user_id: number;
  full_name: string;
  email: string;
  role_name: string;
  orders_count: number;
  payments_count: number;
  total_managed_value: number;
}

export interface StaffPerformanceReport {
  period_start?: string;
  period_end?: string;
  staff_members: StaffPerformanceItem[];
  total_managed_value: number;
}

export interface TopSpendingGuest {
  customer_id: number;
  name: string;
  email?: string;
  phone_number?: string;
  origin: string;
  total_spent: number;
  visit_count: number;
}

export interface GuestAnalyticsReport {
  total_guests: number;
  online_registered_count: number;
  staff_provisioned_count: number;
  contract_clients_count: number;
  child_guests_count: number;
  total_guest_spend: number;
  top_spending_guests: TopSpendingGuest[];
}

export interface GuestTimelineEvent {
  id: string;
  event_type: 'Accommodation' | 'Restaurant' | 'Conference' | 'Payment';
  title: string;
  date: string;
  amount: number;
  status: string;
  details: Record<string, any>;
}

export interface GuestHistory360Report {
  customer_id: number;
  customer_code: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  customer_type: string;
  created_at: string;
  total_spent: number;
  visit_count: number;
  timeline: GuestTimelineEvent[];
}

export interface SalesChannelReport {
  restaurant_eat_in_count: number;
  restaurant_eat_in_value: number;
  restaurant_room_service_count: number;
  restaurant_room_service_value: number;
  restaurant_external_delivery_count: number;
  restaurant_external_delivery_value: number;
  accommodation_online_count: number;
  accommodation_online_value: number;
  accommodation_front_desk_count: number;
  accommodation_front_desk_value: number;
}

export interface FinancialVatReport {
  gross_sales_ugx: number;
  taxable_subtotal: number;
  vat_collected_ugx: number;
  delivery_charge_total: number;
  amount_paid_total: number;
  balance_due_total: number;
  payment_method_breakdown: Array<{ method: string; total: number; count: number }>;
}

export const reportService = {
  async getExecutiveSummary(startDate?: string, endDate?: string): Promise<ExecutiveSummaryReport> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get('/reports/executive-summary', { params });
    return res.data;
  },

  async getStaffPerformance(startDate?: string, endDate?: string): Promise<StaffPerformanceReport> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get('/reports/staff-performance', { params });
    return res.data;
  },

  async getGuestAnalytics(): Promise<GuestAnalyticsReport> {
    const res = await api.get('/reports/guest-analytics');
    return res.data;
  },

  async getGuest360History(customerId: number): Promise<GuestHistory360Report> {
    const res = await api.get(`/reports/guest-360/${customerId}`);
    return res.data;
  },

  async getSalesChannels(startDate?: string, endDate?: string): Promise<SalesChannelReport> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get('/reports/sales-channels', { params });
    return res.data;
  },

  async getFinancialVat(startDate?: string, endDate?: string): Promise<FinancialVatReport> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get('/reports/financial-vat', { params });
    return res.data;
  },

  exportCSV(reportType: 'executive' | 'staff' | 'guests' | 'channels' | 'vat', startDate?: string, endDate?: string) {
    const baseURL = api.defaults.baseURL || 'http://139.59.134.181/api/v1';
    let url = `${baseURL}/reports/export/csv?report_type=${reportType}`;
    if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;

    const savedUser = localStorage.getItem('seyeya_crm_user');
    let token = '';
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        token = parsed.token || '';
      } catch (e) {}
    }

    // Trigger download via window
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => response.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${reportType}_report.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => console.error("Export error:", err));
  }
};
