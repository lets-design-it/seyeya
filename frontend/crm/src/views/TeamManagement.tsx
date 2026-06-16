import React, { useState } from 'react';
import { useAuth, User, UserRole, MOCK_USERS } from '../context/AuthContext';
import { Shield, Users, Briefcase, Check, X, ShieldAlert, Key, Globe, Eye } from 'lucide-react';

interface TeamMember extends User {
  status: 'active' | 'suspended';
}

export const TeamManagement: React.FC = () => {
  const { user, updateUserRole } = useAuth();
  
  // Convert context MOCK_USERS to a stateful list for interactive role management
  const [members, setMembers] = useState<TeamMember[]>([
    { ...MOCK_USERS.admin, status: 'active' },
    { ...MOCK_USERS.manager, status: 'active' },
    { ...MOCK_USERS.agent, status: 'active' },
  ]);

  // Handle role modification
  const handleRoleChange = (memberId: string, newRole: UserRole) => {
    // 1. Update local state
    const updated = members.map(m => {
      if (m.id === memberId) {
        return { 
          ...m, 
          role: newRole,
          name: MOCK_USERS[newRole].name,
          email: MOCK_USERS[newRole].email,
          avatar: MOCK_USERS[newRole].avatar
        };
      }
      return m;
    });
    setMembers(updated);

    // 2. If the user edited their own role, trigger context update
    if (memberId === 'u-admin' && user?.role === 'admin') {
      // In this demo, u-admin is the active admin user. If the role of u-admin is modified, 
      // we propagate the change to the Auth Context.
      updateUserRole(newRole);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-violet-400" />;
      case 'manager': return <Users className="h-4 w-4 text-indigo-400" />;
      case 'agent': return <Briefcase className="h-4 w-4 text-rose-400" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'manager': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'agent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  // Block rendering if user somehow accesses this view without being admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex h-full w-full min-h-[60vh] flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="glass-panel glass-card-glow max-w-md rounded-2xl p-8 shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">Access Restricted</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Only workspaces with <span className="font-semibold text-indigo-400 uppercase">Admin</span> privileges can modify User Account Controls.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">User Account Control (UAC) Panel</h3>
        <p className="text-xs text-zinc-400">Admin-level panel to assign user clearances and view organizational access matrices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members List */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 lg:col-span-2 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Active Workspace Associates</h4>
            <span className="text-[10px] text-zinc-550 font-semibold">{members.length} Members total</span>
          </div>

          <div className="divide-y divide-zinc-900/30 space-y-3.5 pt-1">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3.5 first:pt-0">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <img src={member.avatar} alt={member.name} className="h-9 w-9 rounded-xl object-cover border border-zinc-900" />
                  <div>
                    <h5 className="text-xs font-bold text-zinc-100">{member.name}</h5>
                    <p className="text-[10px] text-zinc-500">{member.email}</p>
                  </div>
                </div>

                {/* Info Badges & Actions */}
                <div className="flex items-center gap-3.5">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-[9px] text-zinc-500 font-semibold uppercase">Joined Date</span>
                    <span className="text-[10px] text-zinc-350 mt-0.5">{member.joinedDate}</span>
                  </div>

                  {/* Status */}
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-bold uppercase tracking-wide">
                    Active
                  </span>

                  {/* Role Selector dropdown */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-1.5 px-3 text-xs text-zinc-300 outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="agent">Sales Agent</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access control details */}
        <div className="glass-panel glass-card-glow rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Key className="h-4 w-4 text-violet-400" />
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Access Clearances</h4>
          </div>
          <p className="text-[11px] text-zinc-500 leading-normal">
            Workspace accounts are partitioned into three privilege levels. Modifying a user's role shifts their view access controls immediately.
          </p>

          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Administrator</span>
              <p className="text-[11px] text-zinc-400">Full control over operations, team credentials, analytical dashboards, and customer pipelines.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Manager</span>
              <p className="text-[11px] text-zinc-400">Unrestricted directory visibility and analytical charts. Excluded from modifying member credentials.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Sales Agent</span>
              <p className="text-[11px] text-zinc-400">Locked view access. Can only monitor and progress deals assigned explicitly to their profile.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Matrix Grid */}
      <div className="glass-panel glass-card-glow rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Globe className="h-4 w-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Permission Authorization Matrix</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-900/60 pb-2 text-[10px] font-bold uppercase text-zinc-500">
                <th className="py-2.5">CRM System Operations</th>
                <th className="py-2.5 text-center">Admin</th>
                <th className="py-2.5 text-center">Manager</th>
                <th className="py-2.5 text-center">Sales Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/40 text-zinc-350">
              {[
                { op: 'View UAC Control Panel & Change Roles', adm: true, mgr: false, agt: false },
                { op: 'View Executive Analytics & Financial Projections', adm: true, mgr: true, agt: false },
                { op: 'Create & Register New Leads/Deals', adm: true, mgr: true, agt: false },
                { op: 'Re-assign Lead Ownership to Team Members', adm: true, mgr: true, agt: false },
                { op: 'View Workspace Contacts Assigned to Others', adm: true, mgr: true, agt: false },
                { op: 'Shift Deal Pipeline Stages (Kanban Board)', adm: true, mgr: true, agt: true },
                { op: 'Append Meeting Notes / Comments to Profiles', adm: true, mgr: true, agt: true },
              ].map((row, index) => (
                <tr key={index} className="hover:bg-zinc-900/10">
                  <td className="py-3 font-medium text-zinc-300">{row.op}</td>
                  <td className="py-3 text-center">
                    {row.adm ? <Check className="h-4.5 w-4.5 mx-auto text-emerald-450" /> : <X className="h-4.5 w-4.5 mx-auto text-rose-500" />}
                  </td>
                  <td className="py-3 text-center">
                    {row.mgr ? <Check className="h-4.5 w-4.5 mx-auto text-emerald-450" /> : <X className="h-4.5 w-4.5 mx-auto text-rose-500" />}
                  </td>
                  <td className="py-3 text-center">
                    {row.agt ? <Check className="h-4.5 w-4.5 mx-auto text-emerald-450" /> : <X className="h-4.5 w-4.5 mx-auto text-rose-500" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
