import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import loginBg from '../../assets/Login.jpg';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card';

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
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-12 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Dark overlay for contrast and readability */}
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[1px] z-0" />

      <div className="w-full max-w-[440px] z-10 font-sans">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 shadow-[0_4px_20px_rgba(255,255,255,0.15)] text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-zinc-900">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516 11.21 11.21 0 0 1-7.877-3.08Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">SEYEYA COURTS CRM</h1>
          <p className="mt-2 text-sm text-zinc-200">Next-gen operational console</p>
        </div>

        <Card variant="glass" className="w-full border-none shadow-2xl overflow-hidden bg-white/95">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold tracking-tight text-zinc-900">Login</CardTitle>
            <CardDescription className="text-zinc-500">Enter your credentials for access</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/90 p-3.5 text-xs text-red-800 shadow-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed font-medium">
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-zinc-500 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-450">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-150 py-2.5 pl-10 pr-4 text-xs text-foreground placeholder-zinc-400 outline-none transition-all focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-zinc-500 mb-2">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-455">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-150 py-2.5 pl-10 pr-4 text-xs text-foreground placeholder-zinc-400 outline-none transition-all focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="relative flex w-full items-center justify-center rounded-xl bg-[#0A2540] hover:bg-[#07192C] text-[#D4AF37] border border-[#D4AF37]/30 py-3 text-sm font-semibold shadow-md transition-all disabled:opacity-50 mt-6 cursor-pointer"
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
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-zinc-500 font-medium">
          Seyeya CRM v1.0.0 &copy; 2026. Secure transmission guaranteed.
        </p>
      </div>
    </div>
  );
};
export default Login;


