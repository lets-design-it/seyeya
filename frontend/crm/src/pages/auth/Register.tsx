import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { User, Mail, Lock, ChevronRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Mock Registration Successful! Please proceed to login.');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-12 radial-bg">
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[80px] animate-pulse-glow" />
      
      <div className="w-full max-w-[440px] z-10 font-sans">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Register Account</h1>
          <p className="mt-2 text-sm text-zinc-450">Join the Seyeya Lodge team workspace</p>
        </div>

        <div className="glass-panel glass-card-glow rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <Input 
              label="Full Name"
              placeholder="e.g. John Doe"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input 
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input 
              label="Choose Password"
              type="password"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Button 
              type="submit"
              className="w-full py-3 mt-2"
            >
              Request Credentials
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Register;


