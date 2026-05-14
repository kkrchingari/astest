import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, BrainCircuit, Stars, Plus, Loader2, Search } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import api from '@/src/lib/api';
import { cn } from '@/lib/utils';

export default function PersonasList() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    type: 'career_seeker',
    context: ''
  });

  const fetchPersonas = async () => {
    try {
      const { data } = await api.get('/personas');
      setPersonas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.post('/admin/personas/generate', aiConfig);
      setIsAiModalOpen(false);
      setAiConfig({ type: 'career_seeker', context: '' });
      fetchPersonas();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const filteredPersonas = personas.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.personaType.toLowerCase().includes(search.toLowerCase())
  );

  const getPersonaColor = (type: string) => {
    switch (type) {
      case 'LOVE': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'CAREER': return 'text-astro-navy bg-astro-navy/10 border-astro-navy/20';
      case 'FAMILY': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'HEALTH': return 'text-sky-600 bg-sky-50 border-sky-100';
      case 'BUSINESS': return 'text-astro-gold bg-astro-gold/10 border-astro-gold/20';
      default: return 'text-astro-navy bg-astro-cream border-astro-gold/10';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-astro-gold/20 shadow-sm overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-astro-gold opacity-[0.03] rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative flex-1 max-w-xl">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-astro-gold/60" />
           <Input 
            placeholder="Search personas, archetypes or backstories..." 
            className="pl-12 h-12 bg-astro-cream/50 border-astro-gold/10 rounded-xl focus:ring-astro-gold/20 focus:border-astro-gold/40 text-sm italic font-serif"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
            <DialogTrigger render={
              <Button className="bg-astro-navy text-astro-gold hover:bg-astro-navy/90 rounded-xl px-6 h-12 font-bold uppercase tracking-[0.14em] gap-2 shadow-xl border border-astro-gold/50">
                <BrainCircuit className="w-5 h-5 text-astro-gold" /> AI Manifest
              </Button>
            } />
            <DialogContent className="sm:max-w-md bg-white rounded-[2rem] border-astro-gold/20 p-8">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Stars className="w-4 h-4 text-astro-gold animate-pulse" />
                  <span className="text-[10px] font-bold text-astro-gold uppercase tracking-[0.4em]">Algorithmic Creation</span>
                </div>
                <DialogTitle className="font-serif text-3xl text-astro-navy font-bold">Summon New Persona</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAiGenerate} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-[0.2em] text-astro-navy/40 ml-1">Archetype Template</Label>
                  <Select value={aiConfig.type} onValueChange={(v) => setAiConfig({...aiConfig, type: v})}>
                    <SelectTrigger className="h-12 bg-astro-cream/30 border-astro-gold/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="career_seeker">Career Seeker</SelectItem>
                      <SelectItem value="relationship_crisis">Relationship Crisis</SelectItem>
                      <SelectItem value="skeptic">The Skeptic</SelectItem>
                      <SelectItem value="spiritual_seeker">Spiritual Seeker</SelectItem>
                      <SelectItem value="business_magnate">Business Magnate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-[0.2em] text-astro-navy/40 ml-1">Typing Context (Themes, Mood)</Label>
                  <Textarea 
                    placeholder="Enter specific life situations or constraints for the AI..."
                    value={aiConfig.context}
                    onChange={(e) => setAiConfig({...aiConfig, context: e.target.value})}
                    className="bg-astro-cream/30 border-astro-gold/10 rounded-xl min-h-[100px] text-sm italic py-4"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={generating}
                  className="w-full h-14 bg-astro-navy text-astro-gold rounded-xl font-bold uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {generating ? 'BREWING BACKSTORY...' : 'GENERATE ARCHETYPE'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-3 px-6 h-12 bg-astro-navy text-astro-gold rounded-xl border border-astro-gold/20 shadow-lg relative shrink-0">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{personas.length} Archetypes Active</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-astro-navy/20 gap-4">
           <div className="w-10 h-10 border-2 border-astro-gold border-t-transparent rounded-full animate-spin" />
           <p className="italic font-serif text-xl">Summoning personas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPersonas.map((p: any) => (
            <Card key={p._id} className="border border-astro-gold/10 shadow-sm rounded-3xl hover:shadow-2xl hover:-translate-y-1 hover:border-astro-gold/40 transition-all group bg-white overflow-hidden flex flex-col">
               <div className="h-1 bg-astro-cream group-hover:bg-astro-gold transition-colors" />
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className={cn("px-3 py-0.5 text-[8px] tracking-[0.2em] font-black uppercase rounded-full border shadow-none", getPersonaColor(p.personaType))}>
                    {p.personaType}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {p.source === 'ai' && (
                      <Badge className="bg-astro-gold/20 text-astro-gold border-astro-gold/30 gap-1 px-2 py-0 text-[7px] font-black uppercase tracking-widest">
                        <Stars className="w-2.5 h-2.5" /> AI
                      </Badge>
                    )}
                    <span className="text-[9px] font-bold text-astro-navy/30 uppercase tracking-[0.2em]">v.{p.variantIndex}</span>
                  </div>
                </div>
                <CardTitle className="font-serif text-3xl text-astro-navy italic font-semibold tracking-tight">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                <div className="bg-astro-cream/40 p-5 rounded-2xl border border-astro-gold/5 flex-1 relative">
                    <span className="absolute -top-3 left-4 text-4xl font-serif text-astro-gold/20 italic font-bold">"</span>
                    <p className="text-sm text-astro-navy/80 leading-relaxed italic font-serif">
                       {p.backstory}
                    </p>
                </div>
                <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50 shadow-[inset_0_2px_4px_rgba(255,100,100,0.02)]">
                  <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <BrainCircuit className="w-3.5 h-3.5" /> The Deviation
                  </h5>
                  <p className="text-xs text-rose-900/70 font-medium leading-relaxed font-serif italic">{p.curveball}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-astro-gold/10 mt-auto">
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-astro-navy/30 uppercase tracking-widest">
                        <BookOpen className="w-3 h-3 text-astro-gold/50" /> {p.language}
                      </div>
                      <div className="text-[10px] font-bold text-astro-navy/20 uppercase tracking-widest pl-5">{p.communicationStyle}</div>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-astro-cream flex items-center justify-center border border-astro-gold/20 group-hover:bg-astro-gold group-hover:scale-110 transition-all">
                      <Stars className="w-5 h-5 text-astro-gold group-hover:text-astro-navy transition-colors" />
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
