import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input as ShadcnInput } from '@/components/ui/input';
import {
  Shield,
  ShieldCheck,
  Check,
  X,
  Search,
  Save,
  Loader2,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  Info,
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileEdit,
  LayoutDashboard,
  ShoppingBag,
  Bed,
  CalendarRange,
  Users,
  Utensils,
  BarChart3,
  Settings as SettingsIcon,
  CreditCard,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface PermissionItem {
  permission_id: number;
  permission_key: string;
  display_name: string;
  description?: string;
  group_id?: number;
}

interface PermissionGroup {
  group_id: number;
  group_name: string;
  permissions: PermissionItem[];
}

interface RoleData {
  role_id: number;
  role_name: string;
  description?: string;
  is_system_role?: boolean;
  is_active?: boolean;
  permissions?: { permission_id: number }[] | number[];
}

interface PageViewConfig {
  pageId: string;
  permissionKey: string;
  fallbackId: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

// 9 Primary CRM Page Views with route identifiers and descriptions
const CRM_PAGE_VIEWS: PageViewConfig[] = [
  {
    pageId: 'overview',
    permissionKey: 'overview.view',
    fallbackId: 24,
    title: 'Executive Dashboard',
    subtitle: 'Workspace Overview & KPIs',
    description: 'Access executive KPI metrics, live occupancy rate, revenue summary, and quick operational widgets.',
    icon: LayoutDashboard,
    badge: '/overview',
  },
  {
    pageId: 'orders',
    permissionKey: 'restaurant.view',
    fallbackId: 1,
    title: 'Orders & Tickets',
    subtitle: 'Restaurant & POS Management',
    description: 'Access live dining orders, active tickets, kitchen fulfillment queue, and comprehensive order history.',
    icon: ShoppingBag,
    badge: '/orders',
  },
  {
    pageId: 'rooms',
    permissionKey: 'accommodation.view',
    fallbackId: 6,
    title: 'Rooms & Lodging',
    subtitle: 'Accommodation Grid & Bookings',
    description: 'Access the guest room reservation calendar, live room availability matrix, room categories, and property policies.',
    icon: Bed,
    badge: '/rooms',
  },
  {
    pageId: 'conferences',
    permissionKey: 'conference.view',
    fallbackId: 10,
    title: 'Conferences & Halls',
    subtitle: 'Corporate Events & Reservations',
    description: 'Access conference hall bookings, event inquiry quotes, calendar availability, and venue facility schedules.',
    icon: CalendarRange,
    badge: '/conferences',
  },
  {
    pageId: 'clients',
    permissionKey: 'crm.view',
    fallbackId: 22,
    title: 'Guests & CRM Directory',
    subtitle: 'Client Records & Guest 360',
    description: 'Access individual guest contact profiles, lifetime stay records, VIP notes, and customer communication logs.',
    icon: Users,
    badge: '/clients',
  },
  {
    pageId: 'menu-editor',
    permissionKey: 'menu.view',
    fallbackId: 25,
    title: 'Restaurant Menu',
    subtitle: 'Culinary Catalog & Pricing',
    description: 'Access food & beverage catalog, dishes, pricing structures, dietary badges, and dish availability.',
    icon: Utensils,
    badge: '/menu-editor',
  },
  {
    pageId: 'reports',
    permissionKey: 'reports.view',
    fallbackId: 16,
    title: 'Reports & Analytics',
    subtitle: 'Executive Financial & Staff Reports',
    description: 'Access financial balance summaries, VAT statements, staff performance metrics, and sales channel analytics.',
    icon: BarChart3,
    badge: '/reports',
  },
  {
    pageId: 'users',
    permissionKey: 'users.view',
    fallbackId: 18,
    title: 'Staff Management',
    subtitle: 'Employee Directory & Access',
    description: 'Access employee directory, staff department assignments, login credentials, and account activation status.',
    icon: Shield,
    badge: '/users',
  },
  {
    pageId: 'settings',
    permissionKey: 'roles.view',
    fallbackId: 20,
    title: 'Settings & Security',
    subtitle: 'Configuration & Role Policies',
    description: 'Access hotel profile settings, security policies, role permissions matrix, and global preferences.',
    icon: SettingsIcon,
    badge: '/settings',
  },
];

// Fallback Default Groups if DB table has no seeded groups
const DEFAULT_GROUPS: PermissionGroup[] = [
  {
    group_id: 1,
    group_name: 'Orders & Kitchen Operations',
    permissions: [
      { permission_id: 2, permission_key: 'restaurant.create', display_name: 'Create New Order Ticket', description: 'Create and place new dining or room service orders' },
      { permission_id: 3, permission_key: 'restaurant.edit', display_name: 'Update Order Status & Payment', description: 'Modify ticket status, dishes, and payment confirmation' },
      { permission_id: 4, permission_key: 'restaurant.delete', display_name: 'Cancel / Delete Order Ticket', description: 'Void or cancel active order tickets' },
      { permission_id: 5, permission_key: 'restaurant.kitchen', display_name: 'Kitchen Display System (KDS)', description: 'View and interact with live kitchen preparation queue' },
    ]
  },
  {
    group_id: 2,
    group_name: 'Rooms & Lodging Operations',
    permissions: [
      { permission_id: 7, permission_key: 'accommodation.create', display_name: 'Create Room Reservation', description: 'Book guest rooms and create new accommodation reservations' },
      { permission_id: 8, permission_key: 'accommodation.edit', display_name: 'Modify Room Rates & Dates', description: 'Update reservation dates, room assignments, and rate tiers' },
      { permission_id: 9, permission_key: 'accommodation.checkin', display_name: 'Guest Check-In / Check-Out', description: 'Process guest check-ins, key issuance, and final check-outs' },
    ]
  },
  {
    group_id: 3,
    group_name: 'Conferences & Events Operations',
    permissions: [
      { permission_id: 11, permission_key: 'conference.create', display_name: 'Create Conference Booking', description: 'Reserve event halls and generate corporate event quotes' },
      { permission_id: 12, permission_key: 'conference.edit', display_name: 'Update Hall Pricing & Status', description: 'Modify event booking dates, hall rates, and equipment add-ons' },
    ]
  },
  {
    group_id: 4,
    group_name: 'Guest CRM Operations',
    permissions: [
      { permission_id: 23, permission_key: 'crm.manage', display_name: 'Create & Edit Guest Profiles', description: 'Add new guest profiles, edit contact information, and record VIP notes' },
    ]
  },
  {
    group_id: 5,
    group_name: 'Payments & Financial Operations',
    permissions: [
      { permission_id: 13, permission_key: 'payments.view', display_name: 'View Financial Transactions', description: 'Access billing history, transaction ledger, and payment receipts' },
      { permission_id: 14, permission_key: 'payments.approve', display_name: 'Approve & Settle Invoices', description: 'Confirm settlement and authorize guest checkout payments' },
      { permission_id: 15, permission_key: 'payments.refund', display_name: 'Issue Refunds & Discounts', description: 'Authorize transaction refunds and apply manager discounts' },
    ]
  },
  {
    group_id: 6,
    group_name: 'Reports & Export Operations',
    permissions: [
      { permission_id: 17, permission_key: 'reports.export', display_name: 'Export CSV / PDF Analytics', description: 'Download executive financial reports and performance statements' },
    ]
  },
  {
    group_id: 7,
    group_name: 'Staff Administration Operations',
    permissions: [
      { permission_id: 19, permission_key: 'users.manage', display_name: 'Provision & Deactivate Staff', description: 'Create staff accounts, assign roles, and toggle employment status' },
    ]
  },
  {
    group_id: 8,
    group_name: 'Settings & Security Operations',
    permissions: [
      { permission_id: 21, permission_key: 'roles.manage', display_name: 'Edit Role Permissions Matrix', description: 'Modify access controls, assign permissions, and create custom roles' },
    ]
  }
];

const DEFAULT_ROLES: RoleData[] = [
  { role_id: 2, role_name: 'Super Admin', description: 'Unrestricted workspace administrative access control', is_system_role: true },
  { role_id: 3, role_name: 'Hotel Manager', description: 'Full operational oversight of rooms, orders, and reports', is_system_role: true },
  { role_id: 4, role_name: 'Restaurant Manager', description: 'Culinary oversight, orders, menus, and staff', is_system_role: false },
  { role_id: 5, role_name: 'Receptionist', description: 'Front desk guest check-in, bookings, and customer service', is_system_role: false },
  { role_id: 6, role_name: 'Kitchen Staff', description: 'Order tickets and kitchen display fulfillment', is_system_role: false },
  { role_id: 7, role_name: 'Waiter', description: 'Order taking and active ticket status updates', is_system_role: false },
  { role_id: 8, role_name: 'Cashier', description: 'Point of sale, culinary tickets, and payment collection', is_system_role: false },
];

export const RolePermissionsTable: React.FC = () => {
  const { refreshCurrentUser } = useAuth();
  
  // Navigation tabs within Permissions: 'views' (Tab 1: Page Views) vs 'actions' (Tab 2: Editable Sections)
  const [activeTab, setActiveTab] = useState<'views' | 'actions'>('views');

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [actionGroups, setActionGroups] = useState<PermissionGroup[]>(DEFAULT_GROUPS);
  
  // role_id -> Set of permission_id
  const [rolePermissions, setRolePermissions] = useState<Record<number, Set<number>>>({});
  const [initialState, setInitialState] = useState<Record<number, Set<number>>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Create Role Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Edit Role Modal States
  const [editRole, setEditRole] = useState<RoleData | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Mapping from permission_key -> permission_id (combining server data and defaults)
  const keyToIdMap = useMemo(() => {
    const map: Record<string, number> = {};
    // Seed defaults first
    CRM_PAGE_VIEWS.forEach(v => {
      map[v.permissionKey] = v.fallbackId;
    });
    DEFAULT_GROUPS.forEach(g => {
      g.permissions.forEach(p => {
        map[p.permission_key] = p.permission_id;
      });
    });
    // Override with live server items
    allPermissions.forEach(p => {
      if (p.permission_key) {
        map[p.permission_key] = p.permission_id;
      }
    });
    return map;
  }, [allPermissions]);

  // Load backend roles & permissions
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes, groupsRes] = await Promise.all([
        api.get('/roles').catch(() => ({ data: [] })),
        api.get('/roles/permissions').catch(() => ({ data: [] })),
        api.get('/roles/permissions/groups').catch(() => ({ data: [] })),
      ]);

      let loadedRoles: RoleData[] = Array.isArray(rolesRes.data) && rolesRes.data.length > 0
        ? rolesRes.data
        : DEFAULT_ROLES;

      // Filter out non-staff roles like Customer / Guest from the matrix
      loadedRoles = loadedRoles.filter(r => {
        const lower = r.role_name.toLowerCase().trim();
        return lower !== 'customer' && lower !== 'guest' && lower !== 'verification role';
      });

      let loadedPerms: PermissionItem[] = Array.isArray(permsRes.data) && permsRes.data.length > 0
        ? permsRes.data
        : [];

      setRoles(loadedRoles);
      setAllPermissions(loadedPerms);

      // Organize Action Groups (exclude primary view permissions which belong in Tab 1)
      const viewPermissionKeys = new Set(CRM_PAGE_VIEWS.map(v => v.permissionKey));
      
      let parsedGroups: PermissionGroup[] = [];
      if (Array.isArray(groupsRes.data) && groupsRes.data.length > 0) {
        parsedGroups = groupsRes.data.map((g: any) => ({
          group_id: g.group_id,
          group_name: g.group_name,
          permissions: (g.permissions || []).filter((p: any) => !viewPermissionKeys.has(p.permission_key))
        })).filter(g => g.permissions.length > 0);
      }

      if (parsedGroups.length === 0) {
        // Fallback to DEFAULT_GROUPS synced with loadedPerms IDs
        parsedGroups = DEFAULT_GROUPS.map(g => ({
          ...g,
          permissions: g.permissions.map(p => {
            const found = loadedPerms.find(lp => lp.permission_key === p.permission_key);
            return found ? { ...p, permission_id: found.permission_id } : p;
          })
        }));
      }

      setActionGroups(parsedGroups);

      // Build role_id -> Set of permission_id mapping
      const permMap: Record<number, Set<number>> = {};
      const allPermIds = new Set<number>();
      loadedPerms.forEach(p => allPermIds.add(p.permission_id));
      CRM_PAGE_VIEWS.forEach(v => allPermIds.add(keyToIdMap[v.permissionKey] || v.fallbackId));
      DEFAULT_GROUPS.forEach(g => g.permissions.forEach(p => allPermIds.add(p.permission_id)));

      loadedRoles.forEach(r => {
        const set = new Set<number>();
        if (r.role_name === 'Super Admin') {
          allPermIds.forEach(id => set.add(id));
        } else if (r.permissions && Array.isArray(r.permissions)) {
          r.permissions.forEach((p: any) => {
            if (typeof p === 'number') set.add(p);
            else if (p.permission_id) set.add(p.permission_id);
            else if (p.permission && p.permission.permission_id) set.add(p.permission.permission_id);
          });
        }
        permMap[r.role_id] = set;
      });

      setRolePermissions(permMap);

      const cloneInit: Record<number, Set<number>> = {};
      Object.keys(permMap).forEach(key => {
        cloneInit[Number(key)] = new Set(permMap[Number(key)]);
      });
      setInitialState(cloneInit);

    } catch (err) {
      console.error("Failed to load permissions:", err);
      toast.error("Failed to load permission matrix from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dirty check across both views and actions
  const isDirty = () => {
    return Object.keys(rolePermissions).some(roleIdStr => {
      const roleId = Number(roleIdStr);
      const currentSet = rolePermissions[roleId];
      const origSet = initialState[roleId];
      if (!currentSet || !origSet) return false;
      if (currentSet.size !== origSet.size) return true;
      for (const pId of currentSet) {
        if (!origSet.has(pId)) return true;
      }
      return false;
    });
  };

  // Toggle individual permission checkbox for a role
  const togglePermission = (roleId: number, permissionId: number) => {
    const role = roles.find(r => r.role_id === roleId);
    if (role?.role_name === 'Super Admin') {
      toast.info("Super Admin permissions cannot be revoked to safeguard administrative control.");
      return;
    }

    const rKey = Number(roleId);
    const pKey = Number(permissionId);

    setRolePermissions(prev => {
      const updatedSet = new Set(prev[rKey] || []);
      if (updatedSet.has(pKey)) {
        updatedSet.delete(pKey);
      } else {
        updatedSet.add(pKey);
      }
      return { ...prev, [rKey]: updatedSet };
    });
  };

  // Bulk action: Select all / clear all Page Views for a role (Tab 1)
  const toggleAllViewsForRole = (roleId: number) => {
    const role = roles.find(r => r.role_id === roleId);
    if (role?.role_name === 'Super Admin') return;

    const viewPermIds = CRM_PAGE_VIEWS.map(v => keyToIdMap[v.permissionKey] || v.fallbackId);
    const rKey = Number(roleId);
    const currentSet = rolePermissions[rKey] || new Set();
    const allSelected = viewPermIds.every(id => currentSet.has(id));

    setRolePermissions(prev => {
      const updatedSet = new Set(prev[rKey] || []);
      if (allSelected) {
        viewPermIds.forEach(id => updatedSet.delete(id));
      } else {
        viewPermIds.forEach(id => updatedSet.add(id));
      }
      return { ...prev, [rKey]: updatedSet };
    });
  };

  // Bulk action: Select all / clear all Action permissions in a module for a role (Tab 2)
  const toggleActionGroupForRole = (group: PermissionGroup, roleId: number) => {
    const role = roles.find(r => r.role_id === roleId);
    if (role?.role_name === 'Super Admin') return;

    const groupPermIds = group.permissions.map(p => Number(p.permission_id));
    const rKey = Number(roleId);
    const currentSet = rolePermissions[rKey] || new Set();
    const allSelected = groupPermIds.length > 0 && groupPermIds.every(id => currentSet.has(id));

    setRolePermissions(prev => {
      const updatedSet = new Set(prev[rKey] || []);
      if (allSelected) {
        groupPermIds.forEach(id => updatedSet.delete(id));
      } else {
        groupPermIds.forEach(id => updatedSet.add(id));
      }
      return { ...prev, [rKey]: updatedSet };
    });
  };

  // Reset matrix to last saved state
  const handleReset = () => {
    const cloneInit: Record<number, Set<number>> = {};
    Object.keys(initialState).forEach(key => {
      cloneInit[Number(key)] = new Set(initialState[Number(key)]);
    });
    setRolePermissions(cloneInit);
    toast.info("Permission matrix reset to last saved state.");
  };

  // POST /roles/{role_id}/permissions (Save unified Views & Actions)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const savePromises = roles.map(async (role) => {
        if (role.role_name === 'Super Admin') return;
        const permIds = Array.from(rolePermissions[role.role_id] || []);
        return api.post(`/roles/${role.role_id}/permissions`, {
          permission_ids: permIds
        }).catch((err) => {
          console.warn(`Could not sync role ${role.role_id}:`, err);
        });
      });

      await Promise.all(savePromises);

      const cloneInit: Record<number, Set<number>> = {};
      Object.keys(rolePermissions).forEach(key => {
        cloneInit[Number(key)] = new Set(rolePermissions[Number(key)]);
      });
      setInitialState(cloneInit);

      // Refresh current user session permissions
      await refreshCurrentUser();

      // Dispatch global event so sidebar and router update without hard reload
      window.dispatchEvent(new CustomEvent('seyeya_permissions_updated'));

      toast.success("Role permissions updated successfully across Page Views and Actions!");
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.detail || "Failed to save role permissions");
    } finally {
      setIsSaving(false);
    }
  };

  // POST /roles (Create Role)
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error("Role name is required.");
      return;
    }

    setIsCreatingRole(true);
    try {
      await api.post('/roles', {
        role_name: newRoleName.trim(),
        description: newRoleDesc.trim() || null,
        is_active: true,
        is_system_role: false,
        permission_ids: []
      });

      toast.success(`Role "${newRoleName}" created successfully!`);
      setNewRoleName('');
      setNewRoleDesc('');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Create role error:", err);
      toast.error(err.response?.data?.detail || "Failed to create role");
    } finally {
      setIsCreatingRole(false);
    }
  };

  // PUT /roles/{role_id} (Update Role)
  const handleEditRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRole || !editRoleName.trim()) return;

    setIsUpdatingRole(true);
    try {
      await api.put(`/roles/${editRole.role_id}`, {
        role_name: editRoleName.trim(),
        description: editRoleDesc.trim() || null
      });

      toast.success(`Role "${editRoleName}" updated successfully!`);
      setEditRole(null);
      fetchData();
    } catch (err: any) {
      console.error("Update role error:", err);
      toast.error(err.response?.data?.detail || "Failed to update role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // DELETE /roles/{role_id} (Delete Role)
  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (roleName === 'Super Admin' || roleName === 'Hotel Manager') {
      toast.error("System default roles cannot be deleted.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/roles/${roleId}`);
      toast.success(`Role "${roleName}" deleted successfully!`);
      fetchData();
    } catch (err: any) {
      console.error("Delete role error:", err);
      toast.error(err.response?.data?.detail || "Failed to delete role");
    }
  };

  // Filter Page Views based on search query (Tab 1)
  const filteredPageViews = useMemo(() => {
    if (!searchTerm.trim()) return CRM_PAGE_VIEWS;
    const term = searchTerm.toLowerCase();
    return CRM_PAGE_VIEWS.filter(v =>
      v.title.toLowerCase().includes(term) ||
      v.subtitle.toLowerCase().includes(term) ||
      v.description.toLowerCase().includes(term) ||
      v.pageId.toLowerCase().includes(term) ||
      v.permissionKey.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Filter Action Groups based on search query (Tab 2)
  const filteredActionGroups = useMemo(() => {
    if (!searchTerm.trim()) return actionGroups;
    const term = searchTerm.toLowerCase();
    return actionGroups.map(g => {
      const groupMatches = g.group_name.toLowerCase().includes(term);
      const matchedPerms = g.permissions.filter(p =>
        groupMatches ||
        p.display_name.toLowerCase().includes(term) ||
        p.permission_key.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
      return {
        ...g,
        permissions: matchedPerms
      };
    }).filter(g => g.permissions.length > 0);
  }, [actionGroups, searchTerm]);

  // Visible roles based on filter dropdown
  const visibleRoles = filterRole === 'all' 
    ? roles 
    : roles.filter(r => String(r.role_id) === filterRole || r.role_name.toLowerCase() === filterRole.toLowerCase());

  if (isLoading) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="text-xs font-bold text-zinc-500">Querying live roles & permissions matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-violet-500" />
            <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Role Permissions & Page Access</h4>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              Super Admin Control
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Limit which pages each user role can view first on the CRM, and configure editable section permissions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <ShadcnButton
            onClick={() => setIsCreateModalOpen(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-4 w-4 text-violet-500" />
            <span>Create Role</span>
          </ShadcnButton>

          {isDirty() && (
            <ShadcnButton
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </ShadcnButton>
          )}

          <ShadcnButton
            onClick={handleSave}
            disabled={!isDirty() || isSaving}
            size="sm"
            className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl text-xs shadow-sm cursor-pointer border-none transition-all ${
              isDirty()
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-violet-500/20 shadow-md'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-75'
            }`}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isDirty() ? 'Save Permissions' : 'Permissions Up To Date'}</span>
          </ShadcnButton>
        </div>
      </div>

      {/* Modern Two-Tab Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-1">
        <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-850/80 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('views')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'views'
                ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs'
                : 'text-zinc-500 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Eye className={`h-4 w-4 ${activeTab === 'views' ? 'text-violet-500' : 'text-zinc-400'}`} />
            <span>Tab 1: Page Views & Access</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400">
              {CRM_PAGE_VIEWS.length} Pages
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'actions'
                ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs'
                : 'text-zinc-500 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <FileEdit className={`h-4 w-4 ${activeTab === 'actions' ? 'text-violet-500' : 'text-zinc-400'}`} />
            <span>Tab 2: Editable Sections & Actions</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {actionGroups.reduce((acc, g) => acc + g.permissions.length, 0)} Actions
            </span>
          </button>
        </div>

        {/* Global Tab Context Helper */}
        <div className="text-[11px] text-zinc-500 font-medium">
          {activeTab === 'views' ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCheck className="h-3.5 w-3.5" />
              Configuring primary page visibility & navigation access
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-semibold">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Configuring operational write, edit & workflow permissions
            </span>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3.5 bg-card border border-border rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
            <Search className="h-4 w-4" />
          </span>
          <ShadcnInput
            type="text"
            placeholder={
              activeTab === 'views'
                ? "Search CRM pages (e.g. Dashboard, Orders, Rooms, Menu)..."
                : "Search action permissions (e.g. Create Ticket, Rates, Refunds)..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-9 pl-9 pr-4 text-xs placeholder-zinc-450 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Filter Role:</span>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-foreground outline-hidden cursor-pointer"
          >
            <option value="all">All Staff Roles ({roles.length})</option>
            {roles.map(r => (
              <option key={r.role_id} value={String(r.role_id)}>
                {r.role_name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Notice Banner explaining enforcement */}
      <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-3.5 text-xs text-violet-700 dark:text-violet-300 flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Info className="h-4.5 w-4.5 shrink-0 text-violet-500" />
          <span>
            {activeTab === 'views' ? (
              <>
                <strong>Page Visibility Policy:</strong> Roles without permission for a page view will not see it in their sidebar navigation. If an unauthorized link is opened directly, the system immediately displays <strong>"Permission denied. Contact your administrator."</strong>
              </>
            ) : (
              <>
                <strong>Granular Actions:</strong> Controls buttons and forms inside permitted views. Users require the parent Page View in Tab 1 to access the interface for these operations.
              </>
            )}
          </span>
        </div>
      </div>

      {/* TAB 1: PAGE VIEWS MATRIX */}
      {activeTab === 'views' && (
        <Card className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-violet-500" />
                CRM Page Views & Navigation Visibility Matrix
              </h5>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Toggle which pages each role is allowed to view. Revoking a view hides it from their CRM workspace.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-zinc-500">
              Showing {filteredPageViews.length} of {CRM_PAGE_VIEWS.length} CRM Pages
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  <th className="py-4 px-5 min-w-[320px]">
                    CRM Page & Route View
                  </th>
                  {visibleRoles.map(role => {
                    const viewPermIds = CRM_PAGE_VIEWS.map(v => keyToIdMap[v.permissionKey] || v.fallbackId);
                    const currentSet = rolePermissions[role.role_id] || new Set();
                    const visibleCount = role.role_name === 'Super Admin'
                      ? CRM_PAGE_VIEWS.length
                      : viewPermIds.filter(id => currentSet.has(id)).length;
                    const allSelected = visibleCount === CRM_PAGE_VIEWS.length;

                    return (
                      <th key={role.role_id} className="py-4 px-4 text-center min-w-[170px] border-l border-zinc-200/50 dark:border-zinc-800/50">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-foreground">{role.role_name}</span>
                            {role.role_name !== 'Super Admin' && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditRole(role);
                                    setEditRoleName(role.role_name);
                                    setEditRoleDesc(role.description || '');
                                  }}
                                  className="text-zinc-400 hover:text-violet-500 transition-colors p-0.5 cursor-pointer"
                                  title="Edit Role Name"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                {!role.is_system_role && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRole(role.role_id, role.role_name)}
                                    className="text-zinc-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                                    title="Delete Role"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {role.role_name === 'Super Admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <Lock className="h-2.5 w-2.5" /> Full Root Access
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                visibleCount > 0 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                              }`}>
                                {visibleCount} of {CRM_PAGE_VIEWS.length} visible
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleAllViewsForRole(role.role_id)}
                                className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                              >
                                {allSelected ? 'Revoke All Views' : 'Grant All Views'}
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {filteredPageViews.length === 0 ? (
                  <tr>
                    <td colSpan={visibleRoles.length + 1} className="py-12 text-center text-xs text-zinc-450 font-medium">
                      No CRM page views found matching "{searchTerm}".
                    </td>
                  </tr>
                ) : (
                  filteredPageViews.map((pageView) => {
                    const Icon = pageView.icon;
                    const pKey = keyToIdMap[pageView.permissionKey] || pageView.fallbackId;

                    return (
                      <tr 
                        key={pageView.pageId}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors text-xs"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 mt-0.5">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-foreground text-sm">{pageView.title}</span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                  {pageView.badge}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                  ({pageView.permissionKey})
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                                {pageView.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {visibleRoles.map(role => {
                          const rKey = Number(role.role_id);
                          const isGranted = (rolePermissions[rKey] && rolePermissions[rKey].has(pKey)) || role.role_name === 'Super Admin';
                          const isSuperAdmin = role.role_name === 'Super Admin';

                          return (
                            <td key={role.role_id} className="py-4 px-4 text-center align-middle border-l border-zinc-200/50 dark:border-zinc-800/50">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isSuperAdmin}
                                  onClick={() => togglePermission(role.role_id, pKey)}
                                  className={`h-8 w-20 rounded-xl flex items-center justify-center gap-1.5 border font-bold text-xs transition-all cursor-pointer ${
                                    isGranted
                                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-2xs hover:bg-emerald-500/25'
                                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                  } ${isSuperAdmin ? 'cursor-not-allowed opacity-90' : ''}`}
                                  title={isSuperAdmin ? 'Super Admin always has full access' : (isGranted ? 'Click to Revoke Page View' : 'Click to Grant Page View')}
                                >
                                  {isGranted ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                                      <span>Visible</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-3.5 w-3.5" />
                                      <span>Hidden</span>
                                    </>
                                  )}
                                </button>
                                <span className="text-[9px] text-zinc-450 font-medium">
                                  {isGranted ? 'Access Allowed' : 'Access Denied'}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: EDITABLE SECTIONS & ACTIONS MATRIX */}
      {activeTab === 'actions' && (
        <Card className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-violet-500" />
                Editable Sections, Write Operations & Action Permissions
              </h5>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure granular rights for order creation, rate editing, refunds, reports export, and staff administration.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-zinc-500">
              Showing {filteredActionGroups.length} Operational Modules
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  <th className="py-4 px-5 min-w-[320px]">
                    Operational Action & Description
                  </th>
                  {visibleRoles.map(role => (
                    <th key={role.role_id} className="py-4 px-4 text-center min-w-[150px] border-l border-zinc-200/50 dark:border-zinc-800/50">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-extrabold text-foreground">{role.role_name}</span>
                        {role.role_name === 'Super Admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Lock className="h-2.5 w-2.5" /> Full Access
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-450 font-medium">
                            {(rolePermissions[role.role_id]?.size || 0)} granted
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {filteredActionGroups.length === 0 ? (
                  <tr>
                    <td colSpan={visibleRoles.length + 1} className="py-12 text-center text-xs text-zinc-450 font-medium">
                      No operational actions found matching "{searchTerm}".
                    </td>
                  </tr>
                ) : (
                  filteredActionGroups.map(group => (
                    <React.Fragment key={group.group_id}>
                      {/* Section Module Header */}
                      <tr className="bg-zinc-100/70 dark:bg-zinc-850/50 border-t border-b border-zinc-200 dark:border-zinc-800">
                        <td className="py-3 px-5 font-black text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-violet-500" />
                            <span>{group.group_name}</span>
                            <span className="text-[10px] text-zinc-450 font-normal lowercase tracking-normal">
                              ({group.permissions.length} actions)
                            </span>
                          </div>
                        </td>
                        {visibleRoles.map(role => {
                          const groupPermIds = group.permissions.map(p => p.permission_id);
                          const currentSet = rolePermissions[role.role_id] || new Set();
                          const allSelected = groupPermIds.length > 0 && groupPermIds.every(id => currentSet.has(id));
                          const isSuperAdmin = role.role_name === 'Super Admin';

                          return (
                            <td key={role.role_id} className="py-3 px-4 text-center border-l border-zinc-200/50 dark:border-zinc-800/50">
                              {!isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => toggleActionGroupForRole(group, role.role_id)}
                                  className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer focus:outline-none"
                                >
                                  {allSelected ? 'Clear All' : 'Select All'}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Individual Action Permissions */}
                      {group.permissions.map(perm => (
                        <tr 
                          key={perm.permission_id}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors text-xs"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex flex-col gap-1 pl-2 border-l-2 border-violet-500/40">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-xs">{perm.display_name}</span>
                                <span className="text-[10px] text-zinc-450 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                  {perm.permission_key}
                                </span>
                              </div>
                              {perm.description && (
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                                  {perm.description}
                                </p>
                              )}
                            </div>
                          </td>

                          {visibleRoles.map(role => {
                            const rKey = Number(role.role_id);
                            const pKey = Number(perm.permission_id);
                            const isGranted = (rolePermissions[rKey] && rolePermissions[rKey].has(pKey)) || role.role_name === 'Super Admin';
                            const isSuperAdmin = role.role_name === 'Super Admin';

                            return (
                              <td key={role.role_id} className="py-3.5 px-4 text-center align-middle border-l border-zinc-200/50 dark:border-zinc-800/50">
                                <div className="flex items-center justify-center">
                                  <button
                                    type="button"
                                    disabled={isSuperAdmin}
                                    onClick={() => togglePermission(role.role_id, perm.permission_id)}
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                                      isGranted
                                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-400 shadow-2xs hover:bg-emerald-500/25'
                                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-350 dark:text-zinc-600 hover:border-zinc-400'
                                    } ${isSuperAdmin ? 'cursor-not-allowed opacity-90' : ''}`}
                                    title={isSuperAdmin ? 'Super Admin always granted' : (isGranted ? 'Click to Revoke Action' : 'Click to Grant Action')}
                                  >
                                    {isGranted ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE ROLE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-violet-500" />
                <h3 className="text-base font-bold text-foreground">Create New System Role</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-foreground cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRoleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Role Name *</label>
                <ShadcnInput
                  type="text"
                  placeholder="e.g. Concierge, Event Coordinator..."
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Description</label>
                <ShadcnInput
                  type="text"
                  placeholder="Describe role duties and responsibilities..."
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <ShadcnButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  disabled={isCreatingRole}
                  className="bg-primary text-primary-foreground font-bold rounded-xl text-xs px-4 cursor-pointer"
                >
                  {isCreatingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Role'}
                </ShadcnButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-violet-500" />
                <h3 className="text-base font-bold text-foreground">Edit Role Details</h3>
              </div>
              <button onClick={() => setEditRole(null)} className="text-zinc-400 hover:text-foreground cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditRoleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Role Name *</label>
                <ShadcnInput
                  type="text"
                  value={editRoleName}
                  onChange={e => setEditRoleName(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Description</label>
                <ShadcnInput
                  type="text"
                  value={editRoleDesc}
                  onChange={e => setEditRoleDesc(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <ShadcnButton
                  type="button"
                  variant="outline"
                  onClick={() => setEditRole(null)}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  disabled={isUpdatingRole}
                  className="bg-primary text-primary-foreground font-bold rounded-xl text-xs px-4 cursor-pointer"
                >
                  {isUpdatingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </ShadcnButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
