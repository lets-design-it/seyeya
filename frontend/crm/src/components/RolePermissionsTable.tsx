import React, { useState, useEffect } from 'react';
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
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface PermissionItem {
  permission_id: number;
  permission_key: string;
  display_name: string;
  description?: string;
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

// Fallback Default Groups if DB table has no seeded groups
const DEFAULT_GROUPS: PermissionGroup[] = [
  {
    group_id: 1,
    group_name: 'Orders / Restaurant Page',
    permissions: [
      { permission_id: 1, permission_key: 'restaurant.view', display_name: 'View Active Tickets & History' },
      { permission_id: 2, permission_key: 'restaurant.create', display_name: 'Create New Ticket' },
      { permission_id: 3, permission_key: 'restaurant.edit', display_name: 'Update Order Status & Payment' },
      { permission_id: 4, permission_key: 'restaurant.delete', display_name: 'Cancel / Delete Ticket' },
      { permission_id: 5, permission_key: 'restaurant.kitchen', display_name: 'Access Kitchen Display System' },
    ]
  },
  {
    group_id: 2,
    group_name: 'Rooms & Reservations Page',
    permissions: [
      { permission_id: 6, permission_key: 'accommodation.view', display_name: 'View Reservations & Room Grid' },
      { permission_id: 7, permission_key: 'accommodation.create', display_name: 'Create Booking / Reservation' },
      { permission_id: 8, permission_key: 'accommodation.edit', display_name: 'Modify Room Rates & Dates' },
      { permission_id: 9, permission_key: 'accommodation.checkin', display_name: 'Manage Guest Check-In / Check-Out' },
    ]
  },
  {
    group_id: 3,
    group_name: 'Conferences & Halls Page',
    permissions: [
      { permission_id: 10, permission_key: 'conference.view', display_name: 'View Event Calendar & Quotes' },
      { permission_id: 11, permission_key: 'conference.create', display_name: 'Create Conference Reservation' },
      { permission_id: 12, permission_key: 'conference.edit', display_name: 'Update Hall Pricing & Status' },
    ]
  },
  {
    group_id: 4,
    group_name: 'Guests / CRM Page',
    permissions: [
      { permission_id: 22, permission_key: 'crm.view', display_name: 'View Guest Profiles & Contact' },
      { permission_id: 23, permission_key: 'crm.manage', display_name: 'Create & Edit Guest Profiles' },
    ]
  },
  {
    group_id: 5,
    group_name: 'Payments & Billing Page',
    permissions: [
      { permission_id: 13, permission_key: 'payments.view', display_name: 'View Financial Transactions' },
      { permission_id: 14, permission_key: 'payments.approve', display_name: 'Approve & Settle Bills' },
      { permission_id: 15, permission_key: 'payments.refund', display_name: 'Issue Refunds & Discounts' },
    ]
  },
  {
    group_id: 6,
    group_name: 'Reports & Analytics Page',
    permissions: [
      { permission_id: 16, permission_key: 'reports.view', display_name: 'View Executive Dashboard Analytics' },
      { permission_id: 17, permission_key: 'reports.export', display_name: 'Export CSV / PDF Reports' },
    ]
  },
  {
    group_id: 7,
    group_name: 'Staff & User Management Page',
    permissions: [
      { permission_id: 18, permission_key: 'users.view', display_name: 'View Staff Directory' },
      { permission_id: 19, permission_key: 'users.manage', display_name: 'Provision & Deactivate Staff Credentials' },
    ]
  },
  {
    group_id: 8,
    group_name: 'Settings & Security Page',
    permissions: [
      { permission_id: 20, permission_key: 'roles.view', display_name: 'View Role Access Policies' },
      { permission_id: 21, permission_key: 'roles.manage', display_name: 'Edit Role Permissions Matrix' },
    ]
  }
];

const DEFAULT_ROLES: RoleData[] = [
  { role_id: 1, role_name: 'Super Admin', description: 'Unrestricted workspace administrative access control', is_system_role: true },
  { role_id: 2, role_name: 'Hotel Manager', description: 'Full operational oversight of rooms, orders, and reports', is_system_role: true },
  { role_id: 3, role_name: 'Receptionist', description: 'Front desk guest check-in, bookings, and customer service', is_system_role: false },
  { role_id: 4, role_name: 'Cashier', description: 'Point of sale, culinary tickets, and payment collection', is_system_role: false },
  { role_id: 5, role_name: 'Waiter', description: 'Order taking and active ticket status updates', is_system_role: false },
];

export const RolePermissionsTable: React.FC = () => {
  const { refreshCurrentUser } = useAuth();
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
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

  // Load backend roles & permission groups (GET /roles and GET /roles/permissions/groups)
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, groupsRes] = await Promise.all([
        api.get('/roles').catch(() => ({ data: [] })),
        api.get('/roles/permissions/groups').catch(() => ({ data: [] }))
      ]);

      let loadedRoles: RoleData[] = rolesRes.data && Array.isArray(rolesRes.data) && rolesRes.data.length > 0
        ? rolesRes.data
        : DEFAULT_ROLES;

      let loadedGroups: PermissionGroup[] = groupsRes.data && Array.isArray(groupsRes.data) && groupsRes.data.length > 0
        ? groupsRes.data
        : DEFAULT_GROUPS;

      // If groups are flat or missing, fetch GET /roles/permissions
      if (loadedGroups.length === 0 || loadedGroups.every(g => !g.permissions || g.permissions.length === 0)) {
        try {
          const permsRes = await api.get('/roles/permissions');
          if (permsRes.data && Array.isArray(permsRes.data) && permsRes.data.length > 0) {
            // Group flat permissions by group_name or default group
            const groupMap: Record<string, PermissionItem[]> = {};
            permsRes.data.forEach((p: any) => {
              const groupName = p.group?.group_name || 'General Operations';
              if (!groupMap[groupName]) groupMap[groupName] = [];
              groupMap[groupName].push({
                permission_id: p.permission_id,
                permission_key: p.permission_key,
                display_name: p.display_name || p.permission_key,
                description: p.description
              });
            });
            loadedGroups = Object.keys(groupMap).map((gName, idx) => ({
              group_id: idx + 1,
              group_name: gName,
              permissions: groupMap[gName]
            }));
          }
        } catch (e) {
          // ignore
        }
      }

      setRoles(loadedRoles);
      setGroups(loadedGroups);

      // Map role_id -> Set of permission_id
      const permMap: Record<number, Set<number>> = {};
      loadedRoles.forEach(r => {
        const set = new Set<number>();
        if (r.role_name === 'Super Admin') {
          loadedGroups.forEach(g => g.permissions?.forEach(p => set.add(p.permission_id)));
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

  // Check dirty status
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

  // Bulk action: Select all permissions in a group for a role
  const toggleGroupForRole = (group: PermissionGroup, roleId: number) => {
    const role = roles.find(r => r.role_id === roleId);
    if (role?.role_name === 'Super Admin') return;

    const groupPermIds = group.permissions.map(p => Number(p.permission_id));
    const rKey = Number(roleId);
    const currentSet = rolePermissions[rKey] || new Set();
    const allSelected = groupPermIds.every(id => currentSet.has(id));

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

  // Toggle role active/inactive status
  const toggleRoleActive = async (role: RoleData) => {
    if (role.role_name === 'Super Admin') {
      toast.info("Super Admin role must remain active.");
      return;
    }
    const newActive = role.is_active === false;
    try {
      await api.put(`/roles/${role.role_id}`, { is_active: newActive });
      toast.success(`Role "${role.role_name}" is now ${newActive ? 'Active' : 'Inactive'}.`);
      fetchData();
      await refreshCurrentUser();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update role status");
    }
  };

  // Reset matrix
  const handleReset = () => {
    const cloneInit: Record<number, Set<number>> = {};
    Object.keys(initialState).forEach(key => {
      cloneInit[Number(key)] = new Set(initialState[Number(key)]);
    });
    setRolePermissions(cloneInit);
    toast.info("Permission matrix reset to last saved state.");
  };

  // POST /roles/{role_id}/permissions (Assign Permissions to Role)
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

      toast.success("Role permissions matrix updated successfully!");
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

  // Filter groups & permissions based on search query
  const filteredGroups = groups.map(g => {
    const groupMatches = g.group_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchedPerms = g.permissions.filter(p => 
      groupMatches || 
      p.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.permission_key.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      ...g,
      permissions: matchedPerms
    };
  }).filter(g => g.permissions.length > 0);

  // Visible roles based on filter dropdown
  const visibleRoles = filterRole === 'all' 
    ? roles 
    : roles.filter(r => String(r.role_id) === filterRole || r.role_name.toLowerCase() === filterRole.toLowerCase());

  if (isLoading) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="text-xs font-bold text-zinc-500">Querying live roles & permissions endpoints...</p>
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
            <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Role Permissions Matrix</h4>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              Super Admin Control
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage granular page actions and system permissions for every user role.
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
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs shadow-sm cursor-pointer border-none disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isDirty() ? 'Save Permissions' : 'Permissions Up To Date'}</span>
          </ShadcnButton>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-card border border-border rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
            <Search className="h-4 w-4" />
          </span>
          <ShadcnInput
            type="text"
            placeholder="Search pages or permission actions (e.g. Orders, Create, Refunds)..."
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
            <option value="all">All System Roles ({roles.length})</option>
            {roles.map(r => (
              <option key={r.role_id} value={String(r.role_id)}>
                {r.role_name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Notice Banner */}
      <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3.5 text-xs text-violet-600 dark:text-violet-300 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-violet-500" />
          <span>
            <strong>Super Admin</strong> retains root authority over all modules and cannot have privileges revoked. Changes apply immediately upon saving.
          </span>
        </div>
      </div>

      {/* Main Permissions Matrix Table */}
      <Card className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                <th className="py-4 px-5 min-w-[280px]">
                  Page / Action Permission
                </th>
                {visibleRoles.map(role => (
                  <th key={role.role_id} className="py-4 px-4 text-center min-w-[150px]">
                    <div className="flex flex-col items-center gap-1 group relative">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-foreground">{role.role_name}</span>
                        {role.role_name !== 'Super Admin' && (
                          <div className="flex items-center gap-1">
                            <button
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
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={visibleRoles.length + 1} className="py-12 text-center text-xs text-zinc-450 font-medium">
                    No page actions found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredGroups.map(group => (
                  <React.Fragment key={group.group_id}>
                    {/* Module / Page Section Header */}
                    <tr className="bg-zinc-100/60 dark:bg-zinc-850/40 border-t border-b border-zinc-200 dark:border-zinc-800">
                      <td className="py-2.5 px-5 font-black text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                        {group.group_name}
                      </td>
                      {visibleRoles.map(role => {
                        const groupPermIds = group.permissions.map(p => p.permission_id);
                        const currentSet = rolePermissions[role.role_id] || new Set();
                        const allSelected = groupPermIds.length > 0 && groupPermIds.every(id => currentSet.has(id));
                        const isSuperAdmin = role.role_name === 'Super Admin';

                        return (
                          <td key={role.role_id} className="py-2.5 px-4 text-center">
                            {!isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => toggleGroupForRole(group, role.role_id)}
                                className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer focus:outline-none"
                              >
                                {allSelected ? 'Clear All' : 'Select All'}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Permission Actions under Page */}
                    {group.permissions.map(perm => (
                      <tr 
                        key={perm.permission_id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors text-xs"
                      >
                        <td className="py-3 px-5">
                          <div className="flex flex-col gap-0.5 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
                            <span className="font-bold text-foreground">{perm.display_name}</span>
                            <span className="text-[10px] text-zinc-450 font-mono">{perm.permission_key}</span>
                          </div>
                        </td>

                        {visibleRoles.map(role => {
                          const rKey = Number(role.role_id);
                          const pKey = Number(perm.permission_id);
                          const isGranted = (rolePermissions[rKey] && rolePermissions[rKey].has(pKey)) || role.role_name === 'Super Admin';
                          const isSuperAdmin = role.role_name === 'Super Admin';

                          return (
                            <td key={role.role_id} className="py-3 px-4 text-center align-middle">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  disabled={isSuperAdmin}
                                  onClick={() => togglePermission(role.role_id, perm.permission_id)}
                                  className={`h-6 w-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                                    isGranted
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-350 dark:text-zinc-600 hover:border-zinc-400'
                                  } ${isSuperAdmin ? 'cursor-not-allowed opacity-90' : ''}`}
                                  title={isSuperAdmin ? 'Super Admin always granted' : (isGranted ? 'Click to Revoke' : 'Click to Grant')}
                                >
                                  {isGranted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3 w-3" />}
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
                  placeholder="e.g. Accountant, Event Coordinator..."
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
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  disabled={isCreatingRole}
                  className="bg-primary text-primary-foreground font-bold rounded-xl text-xs px-4"
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
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </ShadcnButton>
                <ShadcnButton
                  type="submit"
                  disabled={isUpdatingRole}
                  className="bg-primary text-primary-foreground font-bold rounded-xl text-xs px-4"
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
