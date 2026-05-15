import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Award, TrendingUp, Download, Sparkles, Send, BrainCircuit, Activity, BarChart3 } from 'lucide-react';
import api from '@/src/lib/api';
import EarningCardModal from './EarningCardModal';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Analytics() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isEarningModalOpen, setIsEarningModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([
    { role: 'assistant', content: 'I am your Astrolive AI Analyst. I have deep knowledge of all practitioner metrics and performance data. Ask me anything about score distributions, top performers, or ways to increase revenue.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchRankings = async () => {
    try {
      const { data } = await api.get('/candidates?status=completed');
      setRankings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const newHistory = [...chatHistory, { role: 'user', content: chatInput }];
    setChatHistory(newHistory);
    setChatInput('');
    setChatLoading(true);
    try {
      const { data } = await api.post('/admin/ai-insights', { prompt: chatInput });
      setChatHistory([...newHistory, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChatHistory([...newHistory, { role: 'assistant', content: 'Error fetching AI analysis. Please check system context.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const chartData = rankings.slice(0, 10).map((r: any) => ({
    name: r.name,
    mockScore: r.mockScore,
    mcqScore: r.mcqScore,
  }));

  const handleExport = () => {
    if (rankings.length === 0) return;

    // Build CSV Headers
    const headers = [
      'Name', 
      'Phone', 
      'Email', 
      'Primary System', 
      'Exp (Years)', 
      'Status', 
      'Mock Score (%)', 
      'MCQ Score (%)', 
      'Global Score (/100)',
      'Final Tier',
      'Min Rate (Fixed)',
      'Variable (Per Minute)',
      'System Share (%)'
    ];

    // Build Rows
    const rows = rankings.map((r: any) => [
      r.name,
      r.phone,
      r.email || 'N/A',
      r.primarySkill,
      r.yearsExperience,
      r.status,
      r.mockScore || 0,
      r.mcqScore || 0,
      Math.floor(((r.mockScore || 0) + (r.mcqScore || 0)) / 2),
      r.finalTier || 'Senior',
      r.earningCard?.fixedRate || 0,
      r.earningCard?.variableRate || 0,
      r.earningCard?.systemShare || 0
    ]);

    // Combine
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `astrolive_practitioner_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCandidates = (candidates: any[]) => candidates.filter((c: any) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search) ||
    c.primarySkill?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-astro-gold/20 shadow-sm bg-gradient-to-br from-[#9f7aea] to-[#805ad5] text-white rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Trophy className="w-32 h-32" />
          </div>
          <Activity className="w-8 h-8 text-white mb-4 relative z-10" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 relative z-10">Total Assessed</h3>
          <p className="text-5xl font-sans mt-2 relative z-10 font-bold">{rankings.length}</p>
          <p className="text-[9px] uppercase tracking-widest text-white/60 mt-1 relative z-10">Practitioners in System</p>
        </div>
        <div className="p-6 border border-astro-gold/20 shadow-sm bg-white rounded-2xl flex flex-col justify-between">
          <div>
             <Award className="w-8 h-8 text-[#9f7aea] mb-4" />
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-astro-navy/40">Mean Precision (Mock)</h3>
          </div>
          <div>
            <p className="text-5xl font-sans mt-2 text-astro-navy font-bold">
              {rankings.length > 0 ? (rankings.reduce((sum: number, r: any) => sum + (r.mockScore || 0), 0) / rankings.length).toFixed(1) : 0}%
            </p>
            <p className="text-[9px] uppercase tracking-widest text-astro-navy/40 mt-1">Global average across simulations</p>
          </div>
        </div>
        <div className="border border-astro-gold/20 shadow-sm bg-white rounded-2xl flex flex-col pt-6 px-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-astro-navy/40 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#9f7aea]" /> Top Scorers Trend
          </h3>
          <div className="flex-1 min-h-[100px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="mockScore" stroke="#9f7aea" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] border border-astro-gold/20 shadow-sm overflow-hidden p-8">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-[14px] font-bold uppercase tracking-[0.1em] text-astro-navy flex items-center gap-2">
                 <BarChart3 className="w-5 h-5 text-[#9f7aea]" /> Performance Analytics
               </h3>
             </div>
             <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                   <Tooltip cursor={{ fill: '#f8f5ff' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="mockScore" name="Mock Session %" fill="#9f7aea" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   <Bar dataKey="mcqScore" name="Knowledge MCQ %" fill="#d4a574" radius={[4, 4, 0, 0]} maxBarSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-astro-gold/20 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-astro-gold/10 flex justify-between items-center bg-astro-cream/20">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-astro-navy">Performance Rank</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-[9px] font-bold tracking-widest border-astro-gold/20"
                onClick={handleExport}
              >
                <Download className="w-3 h-3 mr-2" /> EXPORT
              </Button>
            </div>
            <Table>
              <TableHeader className="bg-astro-cream/80 border-b border-astro-gold/10">
                <TableRow>
                  <TableHead className="py-4 px-6 w-20 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Rank</TableHead>
                  <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Practitioner</TableHead>
                  <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">System</TableHead>
                  <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Rating</TableHead>
                  <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em] text-right">Insight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                     <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-6 h-6 border-2 border-[#9f7aea] border-t-transparent rounded-full animate-spin" />
                          <p className="text-astro-navy/40 italic font-serif text-lg">Ranking nodes...</p>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : rankings.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="h-64 text-center opacity-40">
                       <div className="italic font-serif text-lg">Circuit empty. No rankings available.</div>
                     </TableCell>
                  </TableRow>
                ) : (
                  rankings.map((r: any, idx) => (
                    <TableRow key={r._id} className="hover:bg-astro-cream/30 transition-colors group">
                      <TableCell className="py-5 px-6 font-sans text-xl font-black text-astro-navy/20">
                        {String(idx + 1).padStart(2, '0')}
                      </TableCell>
                      <TableCell className="py-5 px-6 font-sans text-lg font-bold text-astro-navy">{r.name}</TableCell>
                      <TableCell className="py-5 px-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9f7aea] bg-[#9f7aea]/10 px-2 py-0.5 rounded mr-2">
                           {r.primarySkill}
                        </span>
                      </TableCell>
                      <TableCell className="py-5 px-6">
                        <span className="font-mono text-sm font-bold text-astro-navy bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-emerald-700">{Math.floor(((r.mockScore || 0) + (r.mcqScore || 0))/2)}/100</span>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setSelectedCandidate(r);
                            setIsEarningModalOpen(true);
                          }}
                          className="h-8 px-4 bg-[#9f7aea] text-white hover:bg-[#805ad5] text-[10px] font-bold tracking-widest rounded-lg transition-all"
                        >
                          MONETIZATION
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* AI Insight Assistant Sidebar */}
        <div className="bg-white rounded-[2rem] border border-astro-gold/20 shadow-sm flex flex-col h-[700px] sticky top-4">
           <div className="p-6 border-b border-astro-gold/10 bg-gradient-to-r from-[#9f7aea]/10 to-transparent">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-[#9f7aea] flex items-center justify-center text-white">
                 <BrainCircuit className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-sans font-bold text-astro-navy text-lg leading-tight">Insight Engine</h3>
                  <p className="text-[10px] uppercase tracking-widest text-[#9f7aea] font-bold">Astrolive AI Analyst</p>
               </div>
             </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
             {chatHistory.map((msg, i) => (
               <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                 <div className={cn(
                   "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                   msg.role === 'user' 
                     ? "bg-[#9f7aea] text-white rounded-tr-sm" 
                     : "bg-astro-cream/80 border border-astro-gold/10 text-astro-navy/80 rounded-tl-sm shadow-sm"
                 )}>
                   {msg.role === 'assistant' && <Sparkles className="w-3 h-3 text-[#9f7aea] mb-2" />}
                   {msg.content}
                 </div>
               </div>
             ))}
             {chatLoading && (
               <div className="flex justify-start">
                 <div className="bg-astro-cream/80 border border-astro-gold/10 p-4 rounded-2xl rounded-tl-sm flex gap-2 w-16 items-center">
                   <div className="w-2 h-2 bg-[#9f7aea] rounded-full animate-bounce delay-75" />
                   <div className="w-2 h-2 bg-[#9f7aea] rounded-full animate-bounce delay-150" />
                   <div className="w-2 h-2 bg-[#9f7aea] rounded-full animate-bounce delay-300" />
                 </div>
               </div>
             )}
           </div>

           <div className="p-4 border-t border-astro-gold/10 bg-white rounded-b-[2rem]">
             <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="relative flex items-center">
               <Input 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 placeholder="Ask for analysis or insights..."
                 className="pr-12 h-14 rounded-xl bg-astro-cream/50 border-astro-gold/20 focus:ring-[#9f7aea]/20"
               />
               <Button 
                type="submit" 
                size="icon" 
                disabled={chatLoading || !chatInput.trim()}
                className="absolute right-2 h-10 w-10 bg-[#9f7aea] text-white rounded-lg hover:bg-[#805ad5]"
               >
                 <Send className="w-4 h-4" />
               </Button>
             </form>
           </div>
        </div>
      </div>

      {selectedCandidate && (
        <EarningCardModal 
          isOpen={isEarningModalOpen}
          onClose={() => setIsEarningModalOpen(false)}
          candidate={selectedCandidate}
          onSuccess={fetchRankings}
        />
      )}
    </div>
  );
}
