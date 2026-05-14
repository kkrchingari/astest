import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Moon, Stars } from 'lucide-react';
import api from '@/src/lib/api';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { phone, password });
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-astro-cream flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-astro-gold blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-astro-navy blur-[120px]" />
      </div>

      <Card className="w-full max-w-md bg-white border-astro-gold/20 shadow-2xl relative z-10 rounded-3xl overflow-hidden">
        <div className="h-2 bg-astro-navy w-full" />
        <CardHeader className="text-center space-y-2 pt-10 pb-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-astro-navy rounded-full flex items-center justify-center border border-astro-gold/30 shadow-xl">
              <Stars className="w-8 h-8 text-astro-gold" />
            </div>
          </div>
          <CardTitle className="text-4xl font-sans font-black tracking-tight text-astro-navy uppercase">ASTROLIVE</CardTitle>
          <CardDescription className="text-astro-gold font-serif italic text-lg opacity-80">
            Celestial Verification Portal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-8 pt-6">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/40 ml-1">Phone Identification</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-14 bg-astro-cream/30 border-astro-gold/20 text-astro-navy placeholder:text-astro-navy/20 focus:ring-astro-gold focus:border-astro-gold rounded-xl px-4 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/40 ml-1">Secret Mantra</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 bg-astro-cream/30 border-astro-gold/20 text-astro-navy placeholder:text-astro-navy/20 focus:ring-astro-gold focus:border-astro-gold rounded-xl px-4 text-lg"
              />
            </div>
          </CardContent>
          <CardFooter className="px-8 pb-10 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-astro-navy text-astro-gold hover:bg-astro-navy/90 font-bold h-14 rounded-xl transition-all shadow-xl shadow-astro-navy/10 active:scale-95 text-sm uppercase tracking-[0.2em]"
            >
              {loading ? 'OPENING GATES...' : 'ENTER GATEWAY'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="absolute bottom-8 text-astro-navy/20 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-3">
        <div className="h-px w-8 bg-astro-navy/10" />
        ASTROLIVE v1.0 • Secure Session
        <div className="h-px w-8 bg-astro-navy/10" />
      </div>
    </div>
  );
}
