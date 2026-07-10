import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Button as ShadcnButton } from "@/components/ui/button";
import { Input as ShadcnInput } from "@/components/ui/input";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Lock, 
  UserPlus, 
  Shield, 
  Check, 
  Search, 
  Trash2, 
  AlertCircle,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BackendUser {
  user_id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  is_staff: boolean;
  is_active: boolean;
  roles: string[];
}

interface BackendRole {
  role_id: number;
  role_name: string;
  description: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  // States
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [roles, setRoles] = useState<BackendRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Show 5 users per page

  // Provision modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formRoleId, setFormRoleId] = useState<number | ''>('');
  const [formIsStaff, setFormIsStaff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Details drawer & update states
  const [selectedUser, setSelectedUser] = useState<BackendUser | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleId, setEditRoleId] = useState<number | ''>('');
  const [editIsStaff, setEditIsStaff] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Parallel fetch users and roles
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'Failed to load user directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered users for search
  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.phone_number && u.phone_number.includes(query))
    );
  });

  const handleOpenModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormRoleId('');
    setFormIsStaff(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName || !formEmail || !formPassword || !formConfirmPassword || !formRoleId) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formPassword !== formConfirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formPassword.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        full_name: formName,
        email: formEmail,
        phone_number: formPhone || null,
        password: formPassword,
        confirm_password: formConfirmPassword,
        role_ids: [Number(formRoleId)],
        is_staff: formIsStaff
      };

      await api.post('/auth/register', payload);
      
      setSuccessMsg(`Successfully provisioned user "${formName}"`);
      setIsModalOpen(false);
      
      // Auto-clear success message
      setTimeout(() => setSuccessMsg(''), 5000);
      
      // Refresh list
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.message || 'Failed to provision user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete user ${name}?`)) {
      return;
    }

    try {
      await api.delete(`/auth/users/${userId}`);
      setSuccessMsg(`Successfully deleted user "${name}"`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete user');
    }
  };

  const handleRowClick = (u: BackendUser) => {
    setSelectedUser(u);
    setEditName(u.full_name);
    setEditEmail(u.email);
    setEditPhone(u.phone_number || '');
    setEditIsStaff(u.is_staff);
    const userRoleName = u.roles && u.roles.length > 0 ? u.roles[0] : '';
    const matchingRole = roles.find(r => r.role_name === userRoleName);
    setEditRoleId(matchingRole ? matchingRole.role_id : '');
    setEditPassword('');
    setUpdateError('');
    setIsDrawerOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUpdateError('');
    setIsUpdating(true);

    try {
      const payload: any = {
        full_name: editName,
        email: editEmail,
        phone_number: editPhone || null,
        is_staff: editIsStaff,
        role_ids: editRoleId ? [Number(editRoleId)] : []
      };

      if (editPassword) {
        if (editPassword.length < 8) {
          setUpdateError('Password must be at least 8 characters');
          setIsUpdating(false);
          return;
        }
        payload.password = editPassword;
      }

      await api.put(`/auth/users/${selectedUser.user_id}`, payload);
      setSuccessMsg(`Successfully updated user "${editName}"`);
      setIsDrawerOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setUpdateError(err.response?.data?.detail || err.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleStyle = (rolesList: string[]) => {
    if (!rolesList || rolesList.length === 0) {
      return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
    const roleName = rolesList[0];
    if (roleName.includes('Super Admin')) {
      return 'bg-violet-550/15 text-violet-400 border border-violet-500/30';
    }
    if (roleName.includes('Manager')) {
      return 'bg-indigo-550/15 text-indigo-400 border border-indigo-500/30';
    }
    if (roleName.includes('Receptionist') || roleName.includes('Cashier') || roleName.includes('Waiter')) {
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    }
    return 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30';
  };

  const [columnVisibility, setColumnVisibility] = React.useState({});

  const columns = React.useMemo<ColumnDef<BackendUser>[]>(() => [
    {
      accessorKey: "full_name",
      header: "Name / Identity",
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3 pl-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-650 dark:bg-zinc-900 dark:text-zinc-450 font-bold uppercase transition-transform shrink-0">
              {u.full_name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-foreground text-xs leading-none">{u.full_name}</p>
              <p className="text-[10px] text-zinc-450 font-semibold leading-none mt-1">User ID: #{u.user_id}</p>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-zinc-650 font-medium">
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              {u.email}
            </span>
            {u.phone_number && (
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                <Phone className="h-3 w-3 text-zinc-400" />
                {u.phone_number}
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "roles",
      header: "System Roles",
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {u.roles && u.roles.length > 0 ? (
              u.roles.map(r => (
                <span 
                  key={r} 
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide leading-none capitalize ${getRoleStyle(u.roles)}`}
                >
                  {r}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide leading-none bg-zinc-150 text-zinc-550">
                No Role Assigned
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "is_active",
      header: "Account Status",
      cell: ({ row }) => {
        const u = row.original;
        return u.is_active ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-zinc-450">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-450" />
            Inactive
          </span>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-2">Actions</div>,
      cell: ({ row }) => {
        const u = row.original;
        if (u.user_id === Number(currentUser?.id)) return null;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleRowClick(u)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-550 hover:bg-violet-550/5 transition-all cursor-pointer"
              title="Edit User"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteUser(u.user_id, u.full_name)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
              title="Deactivate account"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      }
    }
  ], [currentUser]);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      }
    }
  });

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      {/* Top Banner/Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-dark dark:text-white tracking-tight">Identity & Provisioning</h3>
          <p className="text-xs text-zinc-500">Manage workspace identities, credentials, and system role access controls.</p>
        </div>
        <ShadcnButton 
          onClick={handleOpenModal}
          className="bg-black! text-white! hover:bg-black/90! font-bold px-4 py-5 rounded-xl border-none shadow-xs cursor-pointer flex items-center gap-1.5 h-11"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Provision Team Member
        </ShadcnButton>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <Card className="p-6">
        {/* Table Filters & Columns Toggle */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                <Search className="h-4 w-4" />
              </span>
              <ShadcnInput
                type="text"
                placeholder="Search users by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white h-10 pl-10 pr-4 text-xs placeholder-zinc-450 focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:border-zinc-950 outline-hidden transition-all dark:border-zinc-800"
              />
            </div>
            <ShadcnButton
              onClick={() => setSearchTerm('')}
              className="bg-black! text-white! hover:bg-black/90! font-bold px-4 rounded-xl cursor-pointer h-10 border-none flex items-center justify-center text-xs"
            >
              Reset
            </ShadcnButton>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ShadcnButton variant="outline" className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer text-xs font-semibold">
                Columns
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </ShadcnButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px] bg-white border border-zinc-100 rounded-xl shadow-md p-1 mt-1 z-50">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-xs rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 outline-hidden flex items-center gap-2"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id === "full_name"
                        ? "Name"
                        : column.id === "is_active"
                        ? "Status"
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Directory List / Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <p className="text-xs text-zinc-500">Querying identity directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <AlertCircle className="h-8 w-8 text-zinc-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No identities match criteria</p>
            <p className="text-xs text-zinc-500 mt-1">Try adjusting search parameters or create a new profile.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-150 bg-white overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-zinc-50/50 border-b border-zinc-150">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-zinc-100">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-zinc-500 text-xs font-medium py-3.5 px-4 text-left">
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
                    className="cursor-pointer hover:bg-zinc-50/60 transition-colors border-zinc-100"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 text-xs">
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
            {table.getPageCount() > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-100 p-4 bg-zinc-50/20" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-zinc-500 font-medium">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredUsers.length)} of {filteredUsers.length} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <ShadcnButton
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-9 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer disabled:opacity-50 flex items-center text-xs font-semibold gap-1"
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    Previous
                  </ShadcnButton>
                  <ShadcnButton
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-9 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer disabled:opacity-50 flex items-center text-xs font-semibold gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </ShadcnButton>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Provision Member Drawer */}
      <Drawer open={isModalOpen} onOpenChange={setIsModalOpen} direction="right">
        <DrawerContent className="h-full overflow-y-auto w-full sm:max-w-lg">
          <DrawerHeader className="border-b border-zinc-150 pb-4">
            <DrawerTitle className="text-base font-bold">Provision Team Member</DrawerTitle>
            <DrawerDescription className="text-xs text-zinc-500">
              Create a new user identity and set credentials and workspace roles.
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleProvisionUser} className="space-y-4 p-5">
            {formError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <Input
              label="Full Name *"
              placeholder="John Doe"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              leftIcon={<UserIcon className="h-4 w-4" />}
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="john@seyeya.com"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Phone Number"
              placeholder="+256 700 000 000"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              leftIcon={<Phone className="h-4 w-4" />}
            />

            {/* Role dropdown dynamically populated from API */}
            <div className="w-full space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-555">
                System Role *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
                  <Shield className="h-4 w-4" />
                </span>
                <select
                  value={formRoleId}
                  onChange={(e) => setFormRoleId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-8 text-xs text-zinc-800 placeholder-zinc-650 outline-none transition-all focus:border-violet-500 focus:bg-card/60 focus:ring-2 focus:ring-violet-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-foreground appearance-none"
                >
                  <option value="">Select Role</option>
                  {roles.map(r => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-500">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <Input
              label="Choose Password *"
              type="password"
              placeholder="••••••••"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              required
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Input
              label="Confirm Password *"
              type="password"
              placeholder="••••••••"
              value={formConfirmPassword}
              onChange={(e) => setFormConfirmPassword(e.target.value)}
              required
              leftIcon={<Lock className="h-4 w-4" />}
            />

            {/* Staff Access Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Staff Status
                </span>
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500">
                  Grant staff credentials to access administrative areas
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsStaff}
                  onChange={(e) => setFormIsStaff(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-violet-500/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500" />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-border/40 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-black/90 font-bold px-4 rounded-xl cursor-pointer h-10 border-none flex items-center justify-center text-xs"
              >
                {isSubmitting ? "Confirming..." : "Confirm Provision"}
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Details & Update Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
        <DrawerContent className="h-full overflow-y-auto w-full sm:max-w-lg">
          {selectedUser && (
            <>
              <DrawerHeader className="border-b border-zinc-150 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DrawerTitle className="text-base font-bold">Identity Details</DrawerTitle>
                    <DrawerDescription className="text-xs text-zinc-500">Update credentials and access levels</DrawerDescription>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </DrawerHeader>
              <form onSubmit={handleUpdateUser} className="space-y-4 p-5">
                {updateError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                <Input
                  label="Full Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  leftIcon={<UserIcon className="h-4 w-4" />}
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  leftIcon={<Mail className="h-4 w-4" />}
                />

                <Input
                  label="Phone Number"
                  placeholder="+256 700 000 000"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  leftIcon={<Phone className="h-4 w-4" />}
                />

                {/* Role dropdown dynamically populated */}
                <div className="w-full space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550">
                    System Role
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
                      <Shield className="h-4 w-4" />
                    </span>
                    <select
                      value={editRoleId}
                      onChange={(e) => setEditRoleId(e.target.value ? Number(e.target.value) : '')}
                      required
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-8 text-xs text-zinc-800 outline-none transition-all focus:border-violet-500 focus:bg-card/60 appearance-none"
                    >
                      <option value="">Select Role</option>
                      {roles.map(r => (
                        <option key={r.role_id} value={r.role_id}>
                          {r.role_name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-500">
                      <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <Input
                  label="New Password (optional)"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                />

                {/* Staff Access Toggle */}
                {selectedUser.user_id !== Number(currentUser?.id) && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-550">
                        Staff Status
                      </span>
                      <span className="text-[10px] text-zinc-450">
                        Grant staff credentials to access administrative areas
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsStaff}
                        onChange={(e) => setEditIsStaff(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:bg-violet-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-6 border-t border-border/40 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 cursor-pointer"
                    onClick={() => setIsDrawerOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 cursor-pointer"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Update Details'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default UserManagement;
