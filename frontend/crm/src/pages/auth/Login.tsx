import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Shield, Users, Briefcase, Lock, Mail, ChevronRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await login(email);
    } catch (err) {
      setError('Invalid login credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setIsSubmitting(true);
    setError('');
    try {
      await login(`${role}@seyeya.com`, role);
    } catch (err) {
      setError('Failed to login as preset role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 radial-bg">
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-200/40 blur-[80px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 translate-y-1/2 rounded-full bg-zinc-300/30 blur-[80px] animate-pulse-glow" style={{ animationDelay: '-4s' }} />

      <div className="w-full max-w-[440px] z-10 font-sans">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#212121] shadow-[0_0_20px_rgba(33,33,33,0.15)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516 11.21 11.21 0 0 1-7.877-3.08Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#212121] dark:text-white">SEYEYA CRM</h1>
          <p className="mt-2 text-sm text-zinc-500">Next-gen operational console & client booking systems</p>
        </div>

        <div className="glass-panel glass-card-glow rounded-3xl p-8 shadow-xl transition-all duration-300">
          <h2 className="text-lg font-semibold text-foreground mb-6">Authenticate Session</h2>
          
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-550">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl  bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-zinc-400 outline-none transition-all focus:border-[#212121] focus:ring-2 focus:ring-[#212121]/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-550">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl  bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-zinc-400 outline-none transition-all focus:border-[#212121] focus:ring-2 focus:ring-[#212121]/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="relative flex w-full items-center justify-center rounded-xl bg-[#212121] py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Access CRM
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Preset Buttons */}
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-450 mb-4 text-center">Quick Demo Accounts</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={isSubmitting}
                className="flex items-center justify-between rounded-xl  bg-card p-3 text-left transition-all hover:border-[#212121]/40 hover:bg-zinc-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-[#212121]">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Administrator</p>
                    <p className="text-xs text-zinc-500">Full workspace access & UAC</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-550 group-hover:text-[#212121] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager')}
                disabled={isSubmitting}
                className="flex items-center justify-between rounded-xl  bg-card p-3 text-left transition-all hover:border-[#212121]/40 hover:bg-zinc-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-[#212121]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Manager</p>
                    <p className="text-xs text-zinc-500">All data visibility, restricted UAC</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-550 group-hover:text-[#212121] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('agent')}
                disabled={isSubmitting}
                className="flex items-center justify-between rounded-xl  bg-card p-3 text-left transition-all hover:border-[#212121]/40 hover:bg-zinc-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-[#212121]">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Sales Agent</p>
                    <p className="text-xs text-zinc-500">Only assigned pipeline data</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-550 group-hover:text-[#212121] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500 font-medium">
          Seyeya CRM v1.0.0 &copy; 2026. Secure transmission guaranteed.
        </p>
      </div>
    </div>
  );
};
export default Login;


