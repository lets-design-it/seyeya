export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
  value: number;
  assignedTo: 'u-admin' | 'u-manager' | 'u-agent';
  industry: string;
  lastActive: string;
  notes: string[];
}

export interface Activity {
  id: string;
  user: string;
  avatar: string;
  action: string;
  time: string;
  type: 'call' | 'email' | 'meeting' | 'deal' | 'role';
}

const DEFAULT_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Alexandra Vance',
    company: 'Stellar Tech Ventures',
    email: 'alexandra@stellartech.io',
    phone: '+1 (555) 019-2834',
    stage: 'Proposal',
    value: 177600000,
    assignedTo: 'u-agent',
    industry: 'SaaS & AI',
    lastActive: '2 hours ago',
    notes: ['Discussed enterprise licensing tier.', 'Requested customization details for integrations.'],
  },
  {
    id: 'lead-2',
    name: 'David Kojo',
    company: 'Apex Health Systems',
    email: 'd.kojo@apexhealth.org',
    phone: '+1 (555) 014-9821',
    stage: 'Qualified',
    value: 277500000,
    assignedTo: 'u-agent',
    industry: 'Healthcare',
    lastActive: '1 day ago',
    notes: ['Demo went extremely well. Compliance officer approved security docs.'],
  },
  {
    id: 'lead-3',
    name: 'Charlotte Dubois',
    company: 'Veloce Logistics Group',
    email: 'c.dubois@veloce.fr',
    phone: '+33 6 5550 1782',
    stage: 'New',
    value: 107300000,
    assignedTo: 'u-manager',
    industry: 'Supply Chain',
    lastActive: '4 hours ago',
    notes: ['Inbound lead from product comparison page.', 'Needs multi-region capabilities.'],
  },
  {
    id: 'lead-4',
    name: 'Hiroshi Tanaka',
    company: 'Neo Tokyo Cryptography',
    email: 'h.tanaka@neotokyo.jp',
    phone: '+81 90 5555 0109',
    stage: 'Contacted',
    value: 444000000,
    assignedTo: 'u-admin',
    industry: 'Cybersecurity',
    lastActive: '30 mins ago',
    notes: ['First discovery call done.', 'Requested detailed API performance metrics.'],
  },
  {
    id: 'lead-5',
    name: 'Sofia Moreno',
    company: 'Alturas Energy Corp',
    email: 's.moreno@alturas.es',
    phone: '+34 600 555 123',
    stage: 'Won',
    value: 555000000,
    assignedTo: 'u-agent',
    industry: 'Renewable Energy',
    lastActive: '3 days ago',
    notes: ['Contract signed by VP of Operations.', 'Provisioning production tenant.'],
  },
  {
    id: 'lead-6',
    name: 'Jordan Miller',
    company: 'Omni Retail Brands',
    email: 'jordan@omnibrands.com',
    phone: '+1 (555) 018-7744',
    stage: 'Lost',
    value: 129500000,
    assignedTo: 'u-manager',
    industry: 'E-commerce',
    lastActive: '1 week ago',
    notes: ['Decided to defer project until Q4 due to budget cuts.'],
  },
  {
    id: 'lead-7',
    name: 'Grace Hopper',
    company: 'Compiler Fintech Inc',
    email: 'grace@compilerfin.com',
    phone: '+1 (555) 012-3456',
    stage: 'Proposal',
    value: 351500000,
    assignedTo: 'u-agent',
    industry: 'FinTech',
    lastActive: '5 hours ago',
    notes: ['Sent revised contract with payment term updates.'],
  },
  {
    id: 'lead-8',
    name: 'Liam Neeson',
    company: 'Action Media Works',
    email: 'liam@actionmedia.co',
    phone: '+44 20 7946 0958',
    stage: 'New',
    value: 66600000,
    assignedTo: 'u-agent',
    industry: 'Entertainment',
    lastActive: '2 days ago',
    notes: ['Left voicemail following whitepaper download.'],
  }
];

const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    user: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    action: 'qualified Hiroshi Tanaka (Neo Tokyo Cryptography)',
    time: '30 minutes ago',
    type: 'deal',
  },
  {
    id: 'act-2',
    user: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    action: 'updated deal stage for Alexandra Vance to Proposal',
    time: '2 hours ago',
    type: 'deal',
  },
  {
    id: 'act-3',
    user: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    action: 'scheduled an introduction meeting with Grace Hopper',
    time: '5 hours ago',
    type: 'meeting',
  },
  {
    id: 'act-4',
    user: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    action: 'sent a follow-up email to Charlotte Dubois',
    time: '1 day ago',
    type: 'email',
  },
  {
    id: 'act-5',
    user: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    action: 'marked Alturas Energy Corp as Closed Won',
    time: '3 days ago',
    type: 'deal',
  }
];

export const loadLeads = (): Lead[] => {
  const data = localStorage.getItem('seyeya_crm_leads');
  if (data) {
    try { return JSON.parse(data); } catch (e) { /* ignore */ }
  }
  localStorage.setItem('seyeya_crm_leads', JSON.stringify(DEFAULT_LEADS));
  return DEFAULT_LEADS;
};

export const saveLeads = (leads: Lead[]): void => {
  localStorage.setItem('seyeya_crm_leads', JSON.stringify(leads));
};

export const loadActivities = (): Activity[] => {
  const data = localStorage.getItem('seyeya_crm_activities');
  if (data) {
    try { return JSON.parse(data); } catch (e) { /* ignore */ }
  }
  localStorage.setItem('seyeya_crm_activities', JSON.stringify(DEFAULT_ACTIVITIES));
  return DEFAULT_ACTIVITIES;
};

export const saveActivities = (activities: Activity[]): void => {
  localStorage.setItem('seyeya_crm_activities', JSON.stringify(activities));
};

export const addActivity = (user: string, avatar: string, action: string, type: Activity['type']): void => {
  const list = loadActivities();
  const newItem: Activity = {
    id: `act-${Date.now()}`,
    user,
    avatar,
    action,
    time: 'Just now',
    type,
  };
  saveActivities([newItem, ...list.slice(0, 19)]); // Keep last 20
};
