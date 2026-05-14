import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stars, Download, LogOut, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import api from '@/src/lib/api';
import { cn } from '@/lib/utils';

export default function ResultPage({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get('/candidates/me');
        setCandidate(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, []);

  if (loading) return <div className="min-h-screen bg-astro-navy flex items-center justify-center text-astro-gold italic font-serif">Unveiling your path...</div>;

  if (!candidate || candidate.status !== 'published') {
     return (
       <div className="min-h-screen bg-astro-cream flex items-center justify-center p-8">
          <Card className="max-w-md w-full bg-white border border-astro-gold/20 shadow-2xl rounded-3xl p-10 text-center space-y-6">
             <div className="w-20 h-20 bg-astro-navy rounded-2xl flex items-center justify-center mx-auto border border-astro-gold/30 shadow-xl">
                <Stars className="w-10 h-10 text-astro-gold" />
             </div>
             <h3 className="text-2xl font-serif text-astro-navy font-bold italic">Results Pending</h3>
             <p className="text-astro-navy/60 font-serif italic">Your performance is being weighed by the High Council. We will notify you once the alignment is complete.</p>
             <Button onClick={() => window.location.href = '/'} className="w-full bg-astro-navy text-astro-gold">Return to Home</Button>
          </Card>
       </div>
     );
  }

  const card = candidate.earningCard;

  return (
    <div className="min-h-screen bg-astro-cream flex flex-col">
       <header className="h-20 bg-astro-navy px-8 flex items-center justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-astro-gold opacity-50" />
          <div className="flex items-center gap-3">
             <Stars className="text-astro-gold w-6 h-6" />
             <h1 className="font-serif text-xl text-white font-bold tracking-tight">Audit Results</h1>
          </div>
          <Button variant="ghost" className="text-astro-gold hover:bg-white/5 gap-2" onClick={onLogout}>
             <LogOut className="w-4 h-4" /> Sign Out
          </Button>
       </header>

       <main className="flex-1 max-w-4xl mx-auto w-full p-8 space-y-12 py-16">
          <div className="text-center space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-astro-navy text-astro-gold rounded-full border border-astro-gold/20 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-xl">
                <Sparkles className="w-3 h-3" /> Certification Complete
             </div>
             <h2 className="text-5xl font-serif text-astro-navy font-bold italic">Namaste, {candidate.name}</h2>
             <p className="text-astro-gold font-serif italic text-xl">The spirits have spoken. Your path on our platform has been paved.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8">
             <Card className="bg-astro-navy text-white rounded-[3rem] p-12 border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-astro-gold/5 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-8">
                   <div className="space-y-2">
                      <p className="text-astro-gold/60 text-[10px] font-bold uppercase tracking-[0.3em]">Accredited Rank</p>
                      <h3 className="text-6xl font-serif font-bold italic text-astro-gold capitalize">{candidate.finalTier}</h3>
                   </div>
                   
                   <div className="pt-8 border-t border-white/10 space-y-4">
                      <div className="flex justify-between items-end">
                         <p className="text-white/40 text-xs font-serif italic">Operational Visibility</p>
                         <Badge className="bg-emerald-500 text-white border-none">ACTIVE</Badge>
                      </div>
                      <div className="flex justify-between items-end">
                         <p className="text-white/40 text-xs font-serif italic">Platform Commission</p>
                         <p className="text-white font-bold font-mono">40%</p>
                      </div>
                   </div>
                </div>
             </Card>

             <div className="space-y-8 pl-4">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-astro-gold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> AI Feedback Summary
                   </h4>
                   <p className="text-xl font-serif text-astro-navy italic leading-relaxed">
                     "{card?.pitch || "Your diagnostic depth and empathetic resonance align perfectly with our senior practitioner standards."}"
                   </p>
                </div>

                <div className="space-y-4 pt-4">
                   <Button className="h-14 px-8 bg-astro-navy text-astro-gold hover:bg-astro-navy/90 rounded-2xl font-bold uppercase tracking-widest shadow-xl flex items-center gap-3 group">
                      Accept Offer & Go Live <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                   </Button>
                   <p className="text-[10px] text-astro-navy/40 font-bold uppercase tracking-widest ml-1">
                      Platform terms & conditions apply upon activation.
                   </p>
                </div>
             </div>
          </div>
       </main>
    </div>
  );
}
