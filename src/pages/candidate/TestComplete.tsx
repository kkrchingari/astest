import { CheckCircle2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function TestComplete() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-astro-cream flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-astro-gold blur-[150px]" />
      </div>

      <Card className="w-full max-w-md border-astro-gold/20 shadow-2xl flex flex-col items-center text-center p-10 rounded-3xl bg-white relative z-10">
        <div className="w-24 h-24 bg-astro-navy rounded-full flex items-center justify-center mb-8 border border-astro-gold shadow-xl">
          <CheckCircle2 className="w-12 h-12 text-astro-gold" />
        </div>
        <CardHeader className="p-0 mb-8">
          <CardTitle className="text-4xl font-serif text-astro-navy font-bold leading-tight">Audition Cycles<br/>Complete</CardTitle>
          <CardDescription className="text-astro-gold font-serif italic text-lg mt-3">
            Your readings have been cast to the AI Oracle.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 w-full space-y-8">
          <div className="bg-astro-cream p-8 rounded-2xl border border-astro-gold/10 text-sm text-astro-navy/70 space-y-4 font-serif italic text-base leading-relaxed">
            <p>Our elders and the AI Judge are now analyzing your method accuracy and empathetic resonance. This typically takes 24-48 hours.</p>
            <p className="font-bold text-astro-navy not-italic uppercase tracking-widest text-[10px]">Expect a verification update soon.</p>
          </div>
          <Button 
            className="w-full h-14 bg-astro-navy text-astro-gold hover:bg-astro-navy/90 rounded-xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-astro-navy/10"
            onClick={() => navigate('/login')}
          >
            <Home className="w-4 h-4 mr-3" /> Return to Gateway
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
