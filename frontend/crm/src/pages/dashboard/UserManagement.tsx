import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
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
  X
} from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      {/* Top Banner/Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-dark dark:text-white tracking-tight">Identity & Provisioning</h3>
          <p className="text-xs text-zinc-500">Manage workspace identities, credentials, and system role access controls.</p>
        </div>
        <Button 
          onClick={handleOpenModal}
          className="flex items-center gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          Provision Team Member
        </Button>
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
        {/* Table Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search users by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-xs text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-foreground dark:placeholder-zinc-600"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setSearchTerm('')} className="py-2.5">
            Reset
          </Button>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3 pl-2">Name / Identity</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">System Roles</th>
                  <th className="pb-3">Account Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((u) => (
                  <tr 
                    key={u.user_id} 
                    onClick={() => handleRowClick(u)}
                    className="hover:bg-zinc-500/5 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer group"
                  >
                    {/* User profile details */}
                    <td className="py-3.5 pl-2 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 font-semibold uppercase group-hover:scale-105 transition-transform">
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{u.full_name}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">User ID: #{u.user_id}</p>
                      </div>
                    </td>
                    
                    {/* Contact Info */}
                    <td className="py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                          <Mail className="h-3.5 w-3.5 text-zinc-500" />
                          {u.email}
                        </span>
                        {u.phone_number && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <Phone className="h-3 w-3 text-zinc-500" />
                            {u.phone_number}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Assigned Roles */}
                    <td className="py-3.5">
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide leading-none bg-zinc-150 text-zinc-500">
                            No Role Assigned
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-400">
                          <span className="h-1 w-1 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-zinc-450">
                          <span className="h-1 w-1 rounded-full bg-zinc-450" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Operations */}
                    <td className="py-3.5 pr-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {u.user_id !== Number(currentUser?.id) && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(u);
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-500 hover:bg-violet-500/5 transition-all cursor-pointer"
                            title="Edit User"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(u.user_id, u.full_name);
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                            title="Deactivate account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {Math.ceil(filteredUsers.length / itemsPerPage) > 1 && (
              <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-zinc-500 font-medium">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: Math.ceil(filteredUsers.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-8 h-8 flex items-center justify-center p-0 text-xs font-semibold cursor-pointer"
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)}
                    className="p-2 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Provision Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Team Member"
        className="max-w-lg animate-scale-up"
      >
        <form onSubmit={handleProvisionUser} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="Sarah Jenkins"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              leftIcon={<UserIcon className="h-4 w-4" />}
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="sarah@seyeyalodge.com"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              leftIcon={<Mail className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="+256 700 000 000"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              leftIcon={<Phone className="h-4 w-4" />}
            />

            {/* Role dropdown dynamically populated from API */}
            <div className="w-full space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550">
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
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-8 text-xs text-zinc-800 placeholder-zinc-600 outline-none transition-all focus:border-violet-500 focus:bg-card/60 focus:ring-2 focus:ring-violet-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-foreground appearance-none"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

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
              isLoading={isSubmitting}
            >
              Confirm Provision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Details & Update Drawer */}
      {isDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-full max-w-md h-full bg-card shadow-2xl flex flex-col border-l border-border/40 animate-slide-in">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/40">
              <div>
                <h4 className="text-base font-bold text-dark dark:text-white">Identity Details</h4>
                <p className="text-[10px] text-zinc-500 font-medium">Update credentials and access levels</p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleUpdateUser} className="flex-1 overflow-y-auto p-5 space-y-4">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
