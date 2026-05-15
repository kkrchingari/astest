import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  MessageSquare, 
  Clock, 
  BrainCircuit, 
  ShieldCheck, 
  AlertTriangle,
  Stars,
  TrendingUp,
  FileText,
  CheckCircle2,
  XCircle,
  Key,
  Loader2
} from 'lucide-react';
import api from '@/src/lib/api';
import { cn } from '@/lib/utils';
import EarningCardModal from './EarningCardModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CandidateDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string | null;
  onUpdate?: () => void;
}

export default function CandidateDetailDrawer({ isOpen, onClose, candidateId, onUpdate }: CandidateDetailDrawerProps) {
  const [candidate, setCandidate] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEarningModalOpen, setIsEarningModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchData = async () => {
    if (!candidateId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/candidates/${candidateId}/report`);
      setCandidate(data.candidate);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && candidateId) fetchData();
  }, [isOpen, candidateId]);

  const handlePublish = async () => {
     setIsPublishing(true);
     try {
        await api.post(`/candidates/${candidateId}/publish`);
        if (onUpdate) onUpdate();
        fetchData();
     } catch (err) {
        console.error(err);
     } finally {
        setIsPublishing(false);
     }
  };

   const handleResetPassword = async () => {
    if (!newPassword) return;
    setIsResetting(true);
    try {
      await api.post(`/candidates/${candidateId}/reset-password`, { password: newPassword });
      setNewPassword('');
      alert('Password update successful.');
    } catch (err) {
      console.error(err);
      alert('Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  if (!candidate) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl bg-astro-cream border-l border-astro-gold/20 p-0 flex flex-col h-full overflow-hidden">
        <header className="shrink-0 p-8 bg-astro-navy text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Stars className="w-32 h-32 text-astro-gold" />
           </div>
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-20 h-20 rounded-3xl bg-astro-gold/10 border border-astro-gold/30 flex items-center justify-center font-serif text-3xl text-astro-gold font-bold italic shadow-2xl">
                    {candidate.name[0]}
                 </div>
                 <div>
                    <h2 className="text-3xl font-serif font-bold italic">{candidate.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge className="bg-astro-gold text-astro-navy uppercase text-[9px] font-bold tracking-widest px-2">{candidate.primarySkill}</Badge>
                       <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{candidate.yearsExperience} Years Exp</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex gap-3">
                 <Button 
                  onClick={() => setIsEarningModalOpen(true)}
                  className="bg-astro-gold text-astro-navy hover:bg-white h-11 px-6 rounded-xl font-bold text-xs tracking-widest shadow-xl flex items-center gap-2"
                 >
                    <TrendingUp className="w-4 h-4" /> EARNING CARD
                 </Button>
                 {candidate.status === 'completed' && (
                    <Button 
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="bg-white/10 text-white hover:bg-white/20 border border-white/20 h-11 px-6 rounded-xl font-bold text-xs tracking-widest flex items-center gap-2"
                    >
                       {isPublishing ? 'PUBLISHING...' : 'PUBLISH RESULT'}
                    </Button>
                 )}
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
           <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0 h-full">
              <div className="px-8 pt-8 shrink-0 overflow-x-auto no-scrollbar">
                <TabsList className="bg-white border border-astro-gold/10 p-1 rounded-2xl mb-2 w-max inline-flex">
                   <TabsTrigger value="overview" className="rounded-xl px-6 data-[state=active]:bg-astro-navy data-[state=active]:text-astro-gold whitespace-nowrap">Overview</TabsTrigger>
                   <TabsTrigger value="protocols" className="rounded-xl px-6 data-[state=active]:bg-astro-navy data-[state=active]:text-astro-gold whitespace-nowrap">Protocols</TabsTrigger>
                   <TabsTrigger value="mock" className="rounded-xl px-6 data-[state=active]:bg-astro-navy data-[state=active]:text-astro-gold whitespace-nowrap">Mock Chat</TabsTrigger>
                   <TabsTrigger value="mcq" className="rounded-xl px-6 data-[state=active]:bg-astro-navy data-[state=active]:text-astro-gold whitespace-nowrap">MCQ Flow</TabsTrigger>
                   <TabsTrigger value="earning" className="rounded-xl px-6 data-[state=active]:bg-astro-navy data-[state=active]:text-astro-gold whitespace-nowrap">Earning</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-8 pr-4">
                <TabsContent value="overview" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-4">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-white rounded-3xl border border-astro-gold/10 shadow-sm space-y-2">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/40">Technical Prowess</p>
                         <p className="text-3xl font-serif font-bold text-astro-navy">
                            {report?.mcqSessions?.[0]?.adjustedScore?.toFixed(0) || '0'}%
                         </p>
                      </div>
                      <div className="p-6 bg-white rounded-3xl border border-astro-gold/10 shadow-sm space-y-2">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/40">Communication</p>
                         <p className="text-3xl font-serif font-bold text-astro-navy">
                            {report?.mockSessions?.[0]?.aiScores ? 
                              ((Object.values(report.mockSessions[0].aiScores).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number) / 0.6).toFixed(0) 
                              : '0'}%
                         </p>
                      </div>
                   </div>

                   <section className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-astro-gold flex items-center gap-2">
                         <ShieldCheck className="w-4 h-4" /> Ethics Check
                      </h4>
                      <div className={cn(
                         "p-6 rounded-3xl border flex items-center justify-between",
                         report?.mockSessions?.[0]?.redFlags?.length > 0 
                            ? "bg-rose-50 border-rose-100" 
                            : "bg-emerald-50 border-emerald-100"
                      )}>
                         <div className="flex items-center gap-3">
                            {report?.mockSessions?.[0]?.redFlags?.length > 0 ? (
                               <>
                                  <XCircle className="w-6 h-6 text-rose-600" />
                                  <p className="text-sm font-medium text-rose-800">{report.mockSessions[0].redFlags.length} Red Flags detected.</p>
                               </>
                            ) : (
                               <>
                                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                  <p className="text-sm font-medium text-emerald-800">No Critical Red Flags detected by AI Judge.</p>
                               </>
                            )}
                         </div>
                      </div>
                   </section>

                   <section className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-astro-gold flex items-center gap-2">
                         <FileText className="w-4 h-4" /> AI Summary
                      </h4>
                      <p className="text-sm text-astro-navy/70 leading-relaxed font-serif italic bg-white p-6 rounded-3xl border border-astro-gold/10">
                        {report?.mockSessions?.[0]?.judgeSummary || candidate.opsNotes || "No summary generated yet."}
                      </p>
                   </section>

                   <section className="p-8 bg-white rounded-3xl border border-astro-gold/10 shadow-sm space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-astro-gold flex items-center gap-2">
                          <Key className="w-4 h-4" /> Security Management
                       </h4>
                       <div className="space-y-4">
                          <div className="space-y-2">
                             <Label className="text-[9px] uppercase tracking-[0.2em] font-bold text-astro-navy/40 ml-1">Force Token (New Password)</Label>
                             <div className="flex gap-2">
                                <Input 
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Enter new password..."
                                  className="h-11 bg-astro-cream/50 border-astro-gold/20 rounded-xl"
                                />
                                <Button 
                                  onClick={handleResetPassword}
                                  disabled={isResetting || !newPassword}
                                  className="bg-astro-navy text-astro-gold h-11 px-6 rounded-xl font-bold text-xs"
                                >
                                   {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'RESET'}
                                </Button>
                             </div>
                          </div>
                          <p className="text-[8px] text-astro-navy/40 italic">Note: Resetting will overwrite existing access credentials immediately.</p>
                       </div>
                    </section>
                </TabsContent>

                <TabsContent value="protocols" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                   {report?.tests && report.tests.length > 0 ? (
                      report.tests.map((test: any) => (
                         <div key={test._id} className="p-6 bg-white rounded-3xl border border-astro-gold/10 shadow-sm flex items-center justify-between">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-astro-gold/30">
                                     {test.testType}
                                  </Badge>
                                  <Badge className={cn(
                                     "text-[8px] uppercase tracking-widest",
                                     test.status === 'completed' ? "bg-emerald-500" : "bg-astro-gold text-astro-navy"
                                  )}>
                                     {test.status}
                                  </Badge>
                               </div>
                               <p className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/40">Created {new Date(test.createdAt).toLocaleDateString()}</p>
                            </div>
                            <Button 
                               variant="ghost" 
                               size="sm" 
                               className="text-astro-gold hover:text-astro-navy h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 bg-astro-cream/50"
                               onClick={() => {
                                 const url = `${window.location.origin}/login`;
                                 navigator.clipboard.writeText(url);
                                 alert('Portal link copied to clipboard!');
                               }}
                            >
                               <Key className="w-3.5 h-3.5" /> Portal Link
                            </Button>
                         </div>
                      ))
                   ) : (
                      <div className="flex flex-col items-center justify-center p-20 text-astro-navy/20 gap-4">
                        <ShieldCheck className="w-12 h-12" />
                        <p className="font-serif italic text-lg">No invitation protocols generated.</p>
                      </div>
                   )}
                </TabsContent>

                 <TabsContent value="mock" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   {report?.mockSessions && report.mockSessions.length > 0 ? (
                     report.mockSessions.map((session: any) => (
                       <div key={session._id} className="bg-white rounded-3xl border border-astro-gold/10 overflow-hidden shadow-sm">
                         <div className="p-4 bg-astro-cream/50 border-b border-astro-gold/10 flex justify-between items-center">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-astro-navy">{session.name} Simulation</h5>
                            <Badge className="bg-astro-navy text-astro-gold text-[8px] uppercase">
                               Avg: {session.aiScores ? ((Object.values(session.aiScores).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number) / 6).toFixed(1) : 'N/A'}
                            </Badge>
                         </div>
                         <div className="p-6 space-y-4">
                            {session.transcript.map((msg: any, mIdx: number) => (
                               <div key={mIdx} className={cn(
                                 "flex flex-col gap-1",
                                 msg.role === 'astrologer' ? "items-end" : "items-start"
                               )}>
                                  <span className="text-[8px] uppercase font-bold text-astro-navy/30">{msg.role}</span>
                                  <div className={cn(
                                     "max-w-[80%] p-4 rounded-2xl text-sm",
                                     msg.role === 'astrologer' ? "bg-astro-gold/10 text-astro-navy rounded-tr-none" : "bg-astro-navy text-white rounded-tl-none"
                                  )}>
                                     {msg.message}
                                  </div>
                               </div>
                            ))}
                         </div>
                       </div>
                     ))
                   ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-astro-navy/20 gap-4">
                       <MessageSquare className="w-12 h-12" />
                       <p className="font-serif italic text-lg">No mock sessions initiated yet.</p>
                    </div>
                   )}
                 </TabsContent>

                 <TabsContent value="mcq" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {report?.mcqSessions && report.mcqSessions.length > 0 ? (
                      report.mcqSessions.map((session: any) => (
                        <div key={session._id} className="p-8 bg-white rounded-3xl border border-astro-gold/10 shadow-sm space-y-6">
                           <div className="flex justify-between items-start">
                              <div>
                                 <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-astro-gold">Assessment Result</h5>
                                 <p className="text-3xl font-serif font-bold text-astro-navy">{session.adjustedScore?.toFixed(1)}%</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/30">Cheating Signals</p>
                                 <div className="flex gap-2 mt-1">
                                    {(session.cheatingSignals?.tabBlurs || 0) > 2 && <Badge variant="outline" className="text-rose-600 border-rose-200 text-[8px]">Tab Switch x{session.cheatingSignals.tabBlurs}</Badge>}
                                    {(session.cheatingSignals?.pasteEvents || 0) > 0 && <Badge variant="outline" className="text-rose-600 border-rose-200 text-[8px]">Paste Detected</Badge>}
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-astro-navy/40">Difficulty Breakdown</p>
                              <div className="grid grid-cols-3 gap-2">
                                 {['easy', 'medium', 'hard'].map(diff => (
                                    <div key={diff} className="p-3 bg-astro-cream/30 rounded-xl border border-astro-gold/5 flex justify-between items-center">
                                       <span className="text-[8px] font-bold uppercase tracking-widest">{diff}</span>
                                       <span className="text-xs font-bold text-astro-navy">
                                          {session.questions.filter((q: any) => q.difficulty === diff).length} Nodes
                                       </span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center p-20 text-astro-navy/20 gap-4">
                        <FileText className="w-12 h-12" />
                        <p className="font-serif italic text-lg">No MCQ sessions processed yet.</p>
                      </div>
                    )}
                 </TabsContent>

                <TabsContent value="earning" className="mt-0 animate-in fade-in slide-in-from-bottom-4">
                   {candidate.earningCard ? (
                      <div className="space-y-6">
                         <div className="p-8 bg-astro-navy text-white rounded-3xl shadow-xl space-y-6">
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="text-astro-gold font-serif italic text-sm">Target Tier</p>
                                  <p className="text-3xl font-serif font-bold italic">{candidate.earningCard.tier}</p>
                               </div>
                               <Badge className="bg-astro-gold text-astro-navy border-none">₹{candidate.earningCard.suggestedRatePerMin}/min</Badge>
                            </div>
                            <div className="space-y-2">
                               <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-astro-gold/40">The Pitch</p>
                               <p className="font-serif italic text-sm text-white/80 leading-relaxed">"{candidate.earningCard.pitch}"</p>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between">
                               <div>
                                  <p className="text-[9px] uppercase font-bold text-white/30 tracking-widest">Mid-Cap Proj.</p>
                                  <p className="text-xl font-bold text-astro-gold">₹{candidate.earningCard?.projectedMonthlyEarnings?.mid?.toLocaleString() ?? '0'}</p>
                               </div>
                               <Button variant="link" className="text-astro-gold text-xs p-0 font-bold uppercase tracking-widest">Details View</Button>
                            </div>
                         </div>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center p-20 text-astro-navy/20 gap-4">
                        <TrendingUp className="w-12 h-12" />
                        <p className="font-serif italic text-lg">No earning proposal manifested yet.</p>
                        <Button 
                          onClick={() => setIsEarningModalOpen(true)}
                          variant="outline" 
                          className="mt-2 border-astro-gold/30 text-astro-navy"
                        >Compute Proposal</Button>
                      </div>
                   )}
                </TabsContent>
              </div>
           </Tabs>
        </main>

        <EarningCardModal 
          isOpen={isEarningModalOpen}
          onClose={() => setIsEarningModalOpen(false)}
          candidate={candidate}
          onSuccess={fetchData}
        />
      </SheetContent>
    </Sheet>
  );
}
