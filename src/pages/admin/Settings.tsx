import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Percent, Target, Save, Loader2, AlertCircle } from 'lucide-react';
import api from '@/src/lib/api';

export default function Settings({ user }: { user: any }) {
  const [settings, setSettings] = useState({ commissionRate: 40, passScoreMcq: 70 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role !== 'super_admin') {
      setError('Only Super Admins can modify platform constants.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/settings', settings);
      setSuccess('Platform constants synchronized successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-serif italic text-astro-navy/40">Reading platform scrolls...</div>;

  const isSuperAdmin = user.role === 'super_admin';

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-astro-gold font-serif italic text-lg">System Configuration</p>
        <h1 className="text-4xl font-serif font-semibold text-astro-navy">Platform Constants</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-astro-gold/20 shadow-sm rounded-3xl overflow-hidden bg-white">
          <div className="h-2 bg-astro-navy w-full" />
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-astro-navy">Global Variables</CardTitle>
            <CardDescription className="font-serif italic">
              These values govern the financial and qualifying logic across all auditions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center gap-3 text-sm font-medium">
                <ShieldCheck className="w-5 h-5 shrink-0" /> {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <Percent className="w-4 h-4 text-astro-gold" />
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/40">Commission Rate (%)</Label>
                </div>
                <Input 
                  type="number" 
                  value={settings.commissionRate}
                  disabled={!isSuperAdmin}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSettings({ ...settings, commissionRate: isNaN(val) ? 0 : val });
                  }}
                  className="h-12 bg-astro-cream/30 border-astro-gold/10 rounded-xl focus:ring-astro-gold"
                />
                <p className="text-[10px] text-astro-navy/30 italic">Platform's share of practitioner's revenue.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <Target className="w-4 h-4 text-astro-gold" />
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/40">MCQ Pass Threshold</Label>
                </div>
                <Input 
                  type="number" 
                  value={settings.passScoreMcq}
                  disabled={!isSuperAdmin}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSettings({ ...settings, passScoreMcq: isNaN(val) ? 0 : val });
                  }}
                  className="h-12 bg-astro-cream/30 border-astro-gold/10 rounded-xl focus:ring-astro-gold"
                />
                <p className="text-[10px] text-astro-navy/30 italic">Minimum adjusted score to qualify for Tier selection.</p>
              </div>
            </div>
          </CardContent>
          {isSuperAdmin && (
            <CardFooter className="bg-astro-cream/20 border-t border-astro-gold/5 p-6">
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-astro-navy text-astro-gold hover:bg-astro-navy/90 rounded-xl px-8 h-12 font-bold uppercase tracking-widest gap-2 shadow-xl shadow-astro-navy/10"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Synchronize Constants
              </Button>
            </CardFooter>
          )}
        </Card>

        {!isSuperAdmin && (
           <div className="p-6 bg-astro-navy/5 rounded-3xl border border-astro-gold/10 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-astro-gold mt-1" />
              <div>
                 <p className="font-serif font-bold text-astro-navy italic">Access Restricted</p>
                 <p className="text-sm text-astro-navy/60 font-serif italic leading-relaxed">
                   Only the Supreme Administrator can modify these cosmic constants. Your current permissions allow for observation only.
                 </p>
              </div>
           </div>
        )}
      </form>
    </div>
  );
}
