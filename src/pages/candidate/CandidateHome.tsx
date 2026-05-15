import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Stars, PlayCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/src/lib/api';

interface CandidateHomeProps {
  user: any;
  onLogout: () => void;
}

export default function CandidateHome({ user, onLogout }: CandidateHomeProps) {
  const navigate = useNavigate();
  const [activeTest, setActiveTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.candidateStatus === 'published') {
      navigate('/result');
    } else if (user && user.candidateStatus === 'completed') {
      navigate('/test-complete');
    }

    const fetchActiveTest = async () => {
      try {
        const { data } = await api.get('/tests/active');
        setActiveTest(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveTest();
  }, [user, navigate]);

  const showMock = activeTest?.testType === 'mock_consult' || activeTest?.testType === 'both';
  const showMcq = activeTest?.testType === 'mcq' || activeTest?.testType === 'both';

  return (
    <div className="min-h-screen bg-astro-cream flex flex-col font-sans">
      <header className="h-20 bg-astro-navy flex items-center justify-between px-8 text-white border-b border-astro-gold/20 shadow-xl relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-astro-gold rounded-full flex items-center justify-center shrink-0">
            <Stars className="w-6 h-6 text-astro-navy" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-astro-gold">Astrolive</span>
        </div>
        <Button variant="ghost" onClick={onLogout} className="text-astro-gold/60 hover:text-astro-gold hover:bg-white/5 uppercase tracking-widest text-[10px] font-bold">
          <LogOut className="w-4 h-4 mr-2" /> Gateway Close
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-astro-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-astro-navy/5 rounded-full blur-3xl animate-pulse" />

        <Card className="w-full max-w-2xl border-astro-gold/20 shadow-2xl rounded-3xl overflow-hidden bg-white relative z-10">
          <div className="h-2 bg-astro-gold w-full" />
          <CardHeader className="text-center pb-10 pt-12">
            <div className="inline-flex p-4 bg-astro-navy rounded-2xl mb-6 shadow-xl border border-astro-gold/20 rotate-3">
              <Stars className="w-10 h-10 text-astro-gold" />
            </div>
            <CardTitle className="text-4xl font-serif text-astro-navy font-bold leading-tight">Welcome to the Audition,<br/>{user.name}</CardTitle>
            <CardDescription className="text-astro-gold font-serif italic text-xl mt-2 opacity-80 uppercase tracking-widest">
              Prepare for the Celestial Alignment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showMock && (
                <div className="p-6 bg-astro-cream rounded-2xl border border-astro-gold/10 hover:border-astro-gold/30 transition-colors group">
                  <h4 className="font-serif text-lg font-bold text-astro-navy mb-2 italic">Phase: Empathic Reach</h4>
                  <p className="text-xs text-astro-navy/60 leading-relaxed group-hover:text-astro-navy transition-colors">
                    Consult with unique spirits. Your resonance and technical logic will be weighed.
                  </p>
                </div>
              )}
              {showMcq && (
                <div className="p-6 bg-astro-navy/5 rounded-2xl border border-astro-gold/10 hover:border-astro-gold/30 transition-colors group">
                  <h4 className="font-serif text-lg font-bold text-astro-navy mb-2 italic">Phase: Sacred Logic</h4>
                  <p className="text-xs text-astro-navy/60 leading-relaxed group-hover:text-astro-navy transition-colors">
                    A technical scroll to verify your understanding of the cosmic laws.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-astro-cream p-8 rounded-2xl border border-astro-gold/10 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-astro-gold">Consultation Protocol</h4>
              <ul className="text-sm text-astro-navy/70 space-y-3 font-serif italic text-base">
                <li className="flex gap-3">
                   <span className="text-astro-gold">◈</span>
                   <span>Duration of ritual: Approximately 40 minutes.</span>
                </li>
                <li className="flex gap-3">
                   <span className="text-astro-gold">◈</span>
                   <span>Remain present. Do not sever the connection (refresh/leave).</span>
                </li>
                <li className="flex gap-3">
                   <span className="text-astro-gold">◈</span>
                   <span>Honesty and empathy are the primary metrics of the AI Oracle.</span>
                </li>
              </ul>
            </div>

            <Button 
              size="lg" 
              className="w-full h-16 text-sm font-bold uppercase tracking-[0.3em] bg-astro-navy text-astro-gold hover:bg-astro-navy/90 rounded-xl shadow-xl shadow-astro-navy/10 active:scale-95 transition-all"
              onClick={() => navigate('/test')}
            >
              <PlayCircle className="w-5 h-5 mr-3" /> Initiate Audition
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
