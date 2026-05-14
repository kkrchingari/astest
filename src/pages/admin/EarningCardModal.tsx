import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, Calendar, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import api from '@/src/lib/api';
import { cn } from '@/lib/utils';

interface EarningCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  onSuccess?: () => void;
}

export default function EarningCardModal({ isOpen, onClose, candidate, onSuccess }: EarningCardModalProps) {
  const [loading, setLoading] = useState(false);

  const generateCard = async () => {
    setLoading(true);
    try {
      await api.post('/earning-card/generate', { candidateId: candidate._id });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const card = candidate?.earningCard;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-white rounded-3xl border border-astro-gold/20 shadow-2xl overflow-hidden p-0">
        <div className="h-2 bg-astro-navy w-full" />
        
        {loading ? (
           <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-astro-gold animate-spin" />
              <p className="font-serif italic text-lg text-astro-navy">AI is calculating market value...</p>
           </div>
        ) : !card ? (
           <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-astro-cream rounded-2xl flex items-center justify-center mx-auto border border-astro-gold/20">
                <Coins className="w-10 h-10 text-astro-gold" />
              </div>
              <div>
                <h3 className="text-2xl font-serif text-astro-navy font-bold">Generate Earning Card</h3>
                <p className="text-astro-navy/60 text-sm italic font-serif mt-2">
                  Compute a fair market proposal based on {candidate?.name || 'the candidate'}'s audition performance.
                </p>
              </div>
              <Button 
                onClick={generateCard}
                className="w-full h-14 bg-astro-navy text-astro-gold hover:bg-astro-navy/90 rounded-2xl font-bold uppercase tracking-widest shadow-xl"
              >
                Launch Computation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
           </div>
        ) : (
          <div className="p-8 space-y-8">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                   <p className="text-astro-gold font-serif italic text-sm">Professional Proposal</p>
                   <DialogTitle className="font-serif text-3xl text-astro-navy font-bold">Earning Manifest</DialogTitle>
                </div>
                <Badge className="bg-astro-navy text-astro-gold px-4 py-1 rounded-full border border-astro-gold/30 uppercase tracking-widest text-[10px] font-bold">
                  {card.tier} Tier
                </Badge>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-astro-cream/30 rounded-2xl border border-astro-gold/10 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/40">Suggested Rate</p>
                  <p className="text-3xl font-serif font-bold text-astro-navy">₹{card.suggestedRatePerMin}<span className="text-sm font-normal opacity-40">/min</span></p>
               </div>
               <div className="p-6 bg-astro-navy text-white rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 opacity-5">
                    <TrendingUp className="w-16 h-16" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-astro-gold/60">Expected Mid-Cap</p>
                  <p className="text-3xl font-serif font-bold text-astro-gold">₹{card.projectedMonthlyEarnings.mid.toLocaleString()}</p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-astro-navy/40">
                  <Sparkles className="w-3 h-3 text-astro-gold" /> AI Value Pitch
               </div>
               <p className="text-sm text-astro-navy/80 italic font-serif leading-relaxed bg-astro-cream/10 p-5 rounded-2xl border border-astro-gold/5">
                 "{card.pitch}"
               </p>
            </div>

            <div className="space-y-3">
               {card.conditions.map((condition: string, i: number) => (
                 <div key={i} className="flex gap-3 text-xs text-astro-navy/60 items-center">
                    <div className="w-1 h-1 rounded-full bg-astro-gold" />
                    {condition}
                 </div>
               ))}
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
               <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
               </div>
               <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Growth Path</p>
                  <p className="text-xs font-medium text-emerald-800">{card.growthPath}</p>
               </div>
            </div>

            <DialogFooter>
               <Button 
                variant="ghost" 
                onClick={onClose}
                className="text-astro-navy/40 uppercase text-[10px] tracking-widest font-bold"
               >
                 Close
               </Button>
               <Button 
                onClick={generateCard}
                variant="outline"
                className="border-astro-gold/20 text-astro-navy rounded-xl h-12 px-6 text-[10px] font-bold uppercase tracking-widest"
               >
                 Re-Compute AI View
               </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
