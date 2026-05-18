import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  BookOpen, 
  GraduationCap, 
  AlertCircle,
  Loader2,
  Trash2,
  CheckCircle2,
  BrainCircuit,
  Stars
} from 'lucide-react';
import api from '@/src/lib/api';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function McqManagement() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    skill: 'vedic',
    difficulty: 'medium',
    count: 5
  });
  const [generating, setGenerating] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    skill: 'vedic',
    difficulty: 'medium',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/mcq-bank');
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.post('/admin/mcq-bank/generate-ai', aiConfig);
      setIsAiModalOpen(false);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/mcq-bank', newQuestion);
      setIsAddModalOpen(false);
      setNewQuestion({
        skill: 'vedic',
        difficulty: 'medium',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: ''
      });
      fetchQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to remove this question from the bank?')) return;
    try {
      await api.delete(`/admin/mcq-bank/${id}`);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-astro-gold/20 shadow-sm overflow-hidden relative">
        <div className="absolute left-0 top-0 w-32 h-32 bg-astro-gold opacity-[0.03] rounded-full blur-3xl -ml-16 -mt-16" />
        <div className="flex-1">
           <h3 className="text-[10px] font-bold tracking-[0.3em] text-astro-gold uppercase mb-1">Knowledge Repository</h3>
           <p className="text-astro-navy/60 text-xs italic font-serif">Manage the sacred assessment criteria for all practitioners.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="border-astro-gold/30 text-astro-navy hover:bg-astro-cream rounded-xl px-6 h-12 font-bold uppercase tracking-[0.14em] gap-2">
                <BrainCircuit className="w-5 h-5 text-astro-gold" /> AI Conjure
              </Button>
            } />
            <DialogContent className="sm:max-w-md bg-white rounded-3xl border-astro-gold/20 p-8">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Stars className="w-4 h-4 text-astro-gold animate-pulse" />
                  <span className="text-[10px] font-bold text-astro-gold uppercase tracking-[0.4em]">Algorithmic Generation</span>
                </div>
                <DialogTitle className="font-serif text-3xl text-astro-navy font-bold">Summon Knowledge AI</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAiGenerate} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-[0.2em] text-astro-navy/40 ml-1">Domain</Label>
                  <Select value={aiConfig.skill} onValueChange={(v) => setAiConfig({...aiConfig, skill: v})}>
                    <SelectTrigger className="h-12 bg-astro-cream/30 border-astro-gold/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vedic">Vedic Astrology</SelectItem>
                      <SelectItem value="tarot">Tarot Reading</SelectItem>
                      <SelectItem value="numerology">Numerology</SelectItem>
                      <SelectItem value="kp">KP Astrology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-[0.2em] text-astro-navy/40 ml-1">Complexity</Label>
                  <Select value={aiConfig.difficulty} onValueChange={(v) => setAiConfig({...aiConfig, difficulty: v})}>
                    <SelectTrigger className="h-12 bg-astro-cream/30 border-astro-gold/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Elementary</SelectItem>
                      <SelectItem value="medium">Intermediate</SelectItem>
                      <SelectItem value="hard">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-[0.2em] text-astro-navy/40 ml-1">Quantity</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={20}
                    value={aiConfig.count}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setAiConfig({...aiConfig, count: isNaN(val) ? 0 : val});
                    }}
                    className="h-12 bg-astro-cream/30 border-astro-gold/10 rounded-xl"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={generating}
                  className="w-full h-14 bg-astro-navy text-astro-gold rounded-xl font-bold uppercase tracking-widest shadow-xl"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Stars className="w-5 h-5 mr-3" />}
                  Generate Nodes
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger render={
              <Button className="bg-astro-navy text-astro-gold hover:bg-astro-navy/90 rounded-xl px-6 h-12 font-bold uppercase tracking-[0.14em] gap-2 shadow-xl border border-astro-gold/50 shadow-astro-navy/20">
                <Plus className="w-5 h-5" /> Insert Knowledge Node
              </Button>
            } />
        <DialogContent className="sm:max-w-2xl bg-white rounded-3xl border-astro-gold/20 p-8">
             <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-8 h-1 bg-astro-gold rounded-full" />
                   <span className="text-[10px] font-bold text-astro-gold uppercase tracking-[0.4em]">Node Creation</span>
                </div>
                <DialogTitle className="font-serif text-4xl text-astro-navy font-bold tracking-tight">Manual Evaluation Entry</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleAdd} className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label className="uppercase text-[9px] font-black tracking-[0.2em] text-astro-navy/40 ml-1">System Domain</Label>
                      <Select value={newQuestion.skill} onValueChange={(v) => setNewQuestion({...newQuestion, skill: v})}>
                         <SelectTrigger className="h-12 bg-astro-cream/30 border-astro-gold/10 rounded-xl focus:ring-astro-gold/20 font-serif italic">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl border-astro-gold/10">
                            <SelectItem value="vedic">Vedic Astrology</SelectItem>
                            <SelectItem value="kp">KP Astrology</SelectItem>
                            <SelectItem value="western">Western Astrology</SelectItem>
                            <SelectItem value="lal-kitab">Lal Kitab</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label className="uppercase text-[9px] font-black tracking-[0.2em] text-astro-navy/40 ml-1">Difficulty Weight</Label>
                      <Select value={newQuestion.difficulty} onValueChange={(v) => setNewQuestion({...newQuestion, difficulty: v})}>
                         <SelectTrigger className="h-12 bg-astro-cream/30 border-astro-gold/10 rounded-xl focus:ring-astro-gold/20 font-serif italic">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl border-astro-gold/10">
                            <SelectItem value="easy">Elementary</SelectItem>
                            <SelectItem value="medium">Intermediate</SelectItem>
                            <SelectItem value="hard">Advanced</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="space-y-2">
                   <Label className="uppercase text-[9px] font-black tracking-[0.2em] text-astro-navy/40 ml-1">Inquiry Content</Label>
                   <Textarea 
                    required
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                    placeholder="Identify the planetary aspects..."
                    className="min-h-[120px] bg-astro-cream/30 border-astro-gold/10 rounded-xl focus:ring-astro-gold/20 font-serif italic text-lg p-5"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   {newQuestion.options.map((opt, i) => (
                      <div key={i} className="space-y-2">
                         <Label className="uppercase text-[8px] font-black tracking-widest text-astro-navy/30 ml-1">Variant {String.fromCharCode(65 + i)}</Label>
                         <Input 
                           required
                           value={opt}
                           onChange={(e) => {
                              const news = [...newQuestion.options];
                              news[i] = e.target.value;
                              setNewQuestion({...newQuestion, options: news});
                           }}
                           className="h-11 bg-astro-cream/30 border-astro-gold/10 rounded-xl focus:ring-astro-gold/20 font-serif italic text-base"
                         />
                      </div>
                   ))}
                </div>

                <div className="space-y-2">
                   <Label className="uppercase text-[9px] font-black tracking-[0.2em] text-astro-navy/40 ml-1">Validated Conclusion</Label>
                   <Select value={newQuestion.correctAnswer} onValueChange={(v) => setNewQuestion({...newQuestion, correctAnswer: v})}>
                      <SelectTrigger className="h-14 bg-astro-navy text-astro-gold rounded-xl border border-astro-gold/30 shadow-lg shadow-astro-navy/10 font-bold uppercase tracking-widest">
                         <SelectValue placeholder="Select correct variant" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-astro-gold/10">
                         {newQuestion.options.map((opt, i) => (
                            <SelectItem key={i} value={opt} disabled={!opt} className="font-serif italic">{opt || `Variant ${String.fromCharCode(65 + i)}`}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>

                <Button 
                  type="submit" 
                  disabled={saving || !newQuestion.correctAnswer}
                  className="w-full h-14 bg-astro-gold text-astro-navy hover:bg-astro-gold/90 font-black uppercase tracking-[0.2em] shadow-xl rounded-xl transition-all active:scale-[0.98]"
                >
                   {saving ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <CheckCircle2 className="w-5 h-5 mr-3" />}
                   Sync into Repository
                </Button>
             </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="bg-white border border-astro-gold/10 rounded-[2rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-astro-cream/80 border-b border-astro-gold/10">
            <TableRow>
              <TableHead className="py-5 px-8 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Inquiry Analysis</TableHead>
              <TableHead className="py-5 px-8 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">System</TableHead>
              <TableHead className="py-5 px-8 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Weight</TableHead>
              <TableHead className="py-5 px-8 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Provenance</TableHead>
              <TableHead className="py-5 px-8 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em] text-right">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-2 border-astro-gold border-t-transparent rounded-full animate-spin" />
                      <p className="font-serif italic text-xl text-astro-navy/40">Synchronizing knowledge nodes...</p>
                    </div>
                  </TableCell>
               </TableRow>
            ) : !Array.isArray(questions) || questions.length === 0 ? (
               <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center opacity-30 italic font-serif text-2xl">Repository is void.</TableCell>
               </TableRow>
            ) : (
               questions.map((q: any) => (
                 <TableRow key={q._id} className="hover:bg-astro-cream/30 transition-colors group border-b border-astro-gold/5">
                    <TableCell className="py-6 px-8 max-w-xl">
                       <p className="font-serif italic text-astro-navy leading-relaxed text-lg">"{q.question}"</p>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                       <span className="uppercase text-[9px] font-black tracking-widest text-astro-gold bg-astro-gold/10 px-2.5 py-1 rounded border border-astro-gold/20">{q.skill}</span>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                       <Badge className={cn(
                          "uppercase text-[8px] font-black tracking-[0.2em] px-2.5 py-0.5 rounded-full border shadow-none",
                          q.difficulty === 'hard' ? "bg-rose-50 text-rose-600 border-rose-200" : q.difficulty === 'medium' ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                       )}>{q.difficulty}</Badge>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-astro-navy/30">{q.source}</span>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                       <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteQuestion(q._id)}
                        className="text-astro-navy/20 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl h-10 w-10"
                       >
                          <Trash2 className="w-5 h-5" />
                       </Button>
                    </TableCell>
                 </TableRow>
               ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
