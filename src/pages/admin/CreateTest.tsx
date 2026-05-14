import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Search, ArrowRight, Stars, BrainCircuit, MessageSquareText } from 'lucide-react';
import api from '@/src/lib/api';
import { cn } from '@/lib/utils';

export default function CreateTest() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [testType, setTestType] = useState<'mock_consult' | 'mcq' | 'both'>('both');
  const [testOrder, setTestOrder] = useState<'mock_first' | 'mcq_first'>('mock_first');
  
  const [personaConfigs, setPersonaConfigs] = useState([
    { personaType: '', name: '', useRandomDob: true },
    { personaType: '', name: '', useRandomDob: true },
    { personaType: '', name: '', useRandomDob: true }
  ]);
  const [mcqConfig, setMcqConfig] = useState({
    count: 20,
    difficultyMix: { easy: 30, medium: 50, hard: 20 }
  });
  const [candidateSearch, setCandidateSearch] = useState('');
  const [recentTests, setRecentTests] = useState<any[]>([]);

  const fetchRecentTests = async () => {
    try {
      const { data } = await api.get('/tests');
      setRecentTests(data.slice(0, 10)); // Top 10 latest
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const { data } = await api.get('/candidates');
        setCandidates(data.filter((c: any) => c.status === 'invited' || c.status === 'in_progress'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
    fetchRecentTests();
  }, []);

  const handleCreateTest = async () => {
    if (!selectedCandidate) return alert('Please select a candidate');
    
    try {
      const { data } = await api.post('/tests', {
        candidateId: selectedCandidate,
        testType,
        order: testType === 'both' ? testOrder : undefined,
        config: {
          personas: personaConfigs,
          mcqConfig
        }
      });
      fetchRecentTests();
      setSelectedCandidate('');
      setCandidateSearch('');
      const testUrl = `${window.location.origin}/login`;
      alert(`Test created successfully!\n\nPractitioner can login at: ${testUrl}\n(Remind them to use their Phone Number and Password set during invitation)`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create test');
    }
  };

  const filteredCandidates = candidates.filter((c: any) => 
    c.name.toLowerCase().includes(candidateSearch.toLowerCase()) || 
    c.phone.includes(candidateSearch)
  );

  const selectedCandidateData = candidates.find((c: any) => c._id === selectedCandidate);

  return (
    <div className="max-w-4xl mx-auto space-y-12 mb-20 px-4 md:px-0">
      <Card className="border border-astro-gold/20 shadow-xl rounded-[2.5rem] bg-white overflow-hidden transition-all">
        <CardHeader className="bg-astro-cream border-b border-astro-gold/10 py-6 px-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-astro-navy text-astro-gold flex items-center justify-center font-black text-sm shadow-xl shadow-astro-navy/20">01</div>
             <div>
                <CardTitle className="text-[10px] uppercase tracking-[0.4em] text-astro-navy font-black opacity-60">Authentication Protocol</CardTitle>
                <h3 className="font-serif text-2xl font-bold text-astro-navy italic">Practitioner Identification</h3>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 space-y-6">
          <div className="space-y-4">
            <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-astro-navy/40 ml-1">Search & Select Practitioner</Label>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-astro-gold/40 group-focus-within:text-astro-gold transition-colors" />
              <Input 
                placeholder="Type name or phone number..."
                value={candidateSearch}
                onChange={(e) => {
                  setCandidateSearch(e.target.value);
                  if (selectedCandidate) setSelectedCandidate(''); // Clear selection if typing
                }}
                className="pl-16 h-20 bg-astro-cream/20 border-astro-gold/20 rounded-3xl text-astro-navy focus:ring-4 focus:ring-astro-gold/10 text-xl font-serif italic transition-all"
              />
            </div>

            {candidateSearch && !selectedCandidate && (
              <div className="bg-white border border-astro-gold/20 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 z-10 relative">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-astro-gold/5">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((c: any) => (
                      <button
                        key={c._id}
                        onClick={() => {
                          setSelectedCandidate(c._id);
                          setCandidateSearch(c.name);
                        }}
                        className="w-full p-6 hover:bg-astro-cream flex items-center justify-between transition-colors group"
                      >
                        <div className="text-left">
                          <p className="font-serif text-xl font-bold italic text-astro-navy group-hover:text-astro-gold transition-colors">{c.name}</p>
                          <p className="text-[10px] uppercase text-astro-navy/40 tracking-[0.1em] font-bold mt-1">
                            {c.phone} • {c.skills?.join(', ') || c.primarySkill}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-astro-gold opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))
                  ) : (
                    <div className="p-10 text-center text-astro-navy/40 italic font-serif">No practitioners match this identification query.</div>
                  )}
                </div>
              </div>
            )}

            {selectedCandidateData && (
              <div className="flex items-center gap-4 p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl animate-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Identity Verified</p>
                   <p className="font-serif text-lg font-bold text-astro-navy italic">{selectedCandidateData.name} ({selectedCandidateData.phone})</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border border-astro-gold/20 shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="bg-astro-cream/80 border-b border-astro-gold/10 py-5">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-astro-navy text-astro-gold flex items-center justify-center font-black text-xs">02</div>
                <CardTitle className="text-[10px] uppercase tracking-[0.3em] text-astro-navy font-black">Round Configuration</CardTitle>
             </div>
          </CardHeader>
          <CardContent className="p-8">
             <div className="flex flex-col gap-4">
                {[
                  { id: 'mock_consult', name: 'Mock Consultation', icon: MessageSquareText },
                  { id: 'mcq', name: 'MCQ Assessment', icon: BrainCircuit },
                  { id: 'both', name: 'Comprehensive Flow', icon: ClipboardCheck },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTestType(type.id as any)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border transition-all text-left relative overflow-hidden group",
                      testType === type.id 
                        ? "border-astro-gold bg-astro-navy text-astro-gold shadow-lg shadow-astro-navy/20" 
                        : "border-astro-gold/10 hover:border-astro-gold/30 text-astro-navy/40 bg-white"
                    )}
                  >
                    <type.icon className={cn("w-6 h-6 shrink-0", testType === type.id ? "text-astro-gold" : "text-astro-gold/30")} />
                    <span className={cn("font-serif text-xl font-bold italic", testType === type.id ? "text-astro-gold" : "text-astro-navy/40")}>{type.name}</span>
                    {testType === type.id && <div className="absolute right-0 top-0 h-full w-1 bg-astro-gold" />}
                  </button>
                ))}
             </div>
          </CardContent>
        </Card>

        {testType === 'both' ? (
          <Card className="border border-astro-gold/20 shadow-sm rounded-[2rem] bg-white overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
            <CardHeader className="bg-astro-cream/80 border-b border-astro-gold/10 py-5">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-astro-navy text-astro-gold flex items-center justify-center font-black text-xs">03</div>
                  <CardTitle className="text-[10px] uppercase tracking-[0.3em] text-astro-navy font-black">Phase Sequencing</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col gap-4 h-full">
                 <button 
                  onClick={() => setTestOrder('mock_first')}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border transition-all text-center group",
                    testOrder === 'mock_first' ? "border-astro-gold bg-astro-cream shadow-sm" : "border-astro-gold/10"
                  )}
                 >
                    <span className="text-[9px] font-black text-astro-gold/50 mb-2 uppercase tracking-[0.3em]">Protocol Alpha</span>
                    <span className="font-serif text-2xl font-bold italic text-astro-navy">Consultation → Recall</span>
                 </button>
                 <button 
                  onClick={() => setTestOrder('mcq_first')}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border transition-all text-center group",
                    testOrder === 'mcq_first' ? "border-astro-gold bg-astro-cream shadow-sm" : "border-astro-gold/10"
                  )}
                 >
                    <span className="text-[9px] font-black text-astro-gold/50 mb-2 uppercase tracking-[0.3em]">Protocol Beta</span>
                    <span className="font-serif text-2xl font-bold italic text-astro-navy">Recall → Consultation</span>
                 </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-astro-navy/5 rounded-[2rem] border border-dashed border-astro-gold/20 flex flex-col items-center justify-center p-12 text-center">
             <Stars className="w-12 h-12 text-astro-gold/20 mb-4" />
             <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-astro-navy/20">Awaiting Sequential Logic</p>
          </div>
        )}
      </div>

      {(testType === 'mcq' || testType === 'both') && (
        <Card className="border border-astro-gold/20 shadow-sm rounded-[2rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
          <CardHeader className="bg-astro-cream/80 border-b border-astro-gold/10 py-5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-astro-navy text-astro-gold flex items-center justify-center font-black text-xs">04</div>
                <CardTitle className="text-[10px] uppercase tracking-[0.3em] text-astro-navy font-black">MCQ Intelligence Mix</CardTitle>
            </div>
            <Badge className="bg-astro-gold/20 text-astro-gold border-astro-gold/30 gap-1.5 py-1 px-3">
              <Stars className="w-3 h-3" /> AI Powered
            </Badge>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                <Label className="text-[9px] uppercase tracking-widest font-black text-astro-navy/40">Total Questions</Label>
                <Input 
                  type="number" 
                  value={String(mcqConfig.count || '')} 
                  onChange={(e) => setMcqConfig({...mcqConfig, count: parseInt(e.target.value) || 0})}
                  className="h-14 bg-astro-cream/20 border-astro-gold/20 rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[9px] uppercase tracking-widest font-black text-astro-navy/40">Easy %</Label>
                <Input 
                  type="number" 
                  value={String(mcqConfig.difficultyMix.easy || '')} 
                  onChange={(e) => setMcqConfig({
                    ...mcqConfig, 
                    difficultyMix: {...mcqConfig.difficultyMix, easy: parseInt(e.target.value) || 0}
                  })}
                  className="h-14 bg-astro-cream/20 border-astro-gold/20 rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[9px] uppercase tracking-widest font-black text-astro-navy/40">Medium %</Label>
                <Input 
                  type="number" 
                  value={String(mcqConfig.difficultyMix.medium || '')} 
                  onChange={(e) => setMcqConfig({
                    ...mcqConfig, 
                    difficultyMix: {...mcqConfig.difficultyMix, medium: parseInt(e.target.value) || 0}
                  })}
                  className="h-14 bg-astro-cream/20 border-astro-gold/20 rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[9px] uppercase tracking-widest font-black text-astro-navy/40">Hard %</Label>
                <Input 
                  type="number" 
                  value={String(mcqConfig.difficultyMix.hard || '')} 
                  onChange={(e) => setMcqConfig({
                    ...mcqConfig, 
                    difficultyMix: {...mcqConfig.difficultyMix, hard: parseInt(e.target.value) || 0}
                  })}
                  className="h-14 bg-astro-cream/20 border-astro-gold/20 rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(testType === 'mock_consult' || testType === 'both') && (
        <Card className="border border-astro-gold/20 shadow-sm rounded-[2rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
          <CardHeader className="bg-astro-cream/80 border-b border-astro-gold/10 py-5">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-astro-navy text-astro-gold flex items-center justify-center font-black text-xs">{testType === 'both' ? '05' : '04'}</div>
                <CardTitle className="text-[10px] uppercase tracking-[0.3em] text-astro-navy font-black">Simulation Nodes (Triple Matrix)</CardTitle>
             </div>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            {personaConfigs.map((config, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-astro-cream/20 rounded-3xl border border-astro-gold/10 relative">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-astro-gold/20 rounded-full flex items-center justify-center text-[10px] font-black">{index + 1}</div>
                <div className="space-y-3">
                  <Label className="text-[9px] uppercase tracking-[0.4em] font-black text-astro-navy/30 ml-1">Archetype Focus</Label>
                  <Select onValueChange={(val) => {
                    const newConfigs = [...personaConfigs];
                    newConfigs[index].personaType = val;
                    setPersonaConfigs(newConfigs);
                  }}>
                    <SelectTrigger className="bg-white border-astro-gold/10 h-14 rounded-xl focus:ring-astro-gold/20 font-serif italic text-lg">
                      <SelectValue placeholder="Manifestation Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-astro-gold/10">
                      <SelectItem value="LOVE" className="font-serif italic py-3 text-rose-600">Love & Union</SelectItem>
                      <SelectItem value="CAREER" className="font-serif italic py-3 text-astro-navy">Path & Purpose</SelectItem>
                      <SelectItem value="FAMILY" className="font-serif italic py-3 text-emerald-600">Ancestral Bond</SelectItem>
                      <SelectItem value="HEALTH" className="font-serif italic py-3 text-sky-600">Vitality & Flow</SelectItem>
                      <SelectItem value="BUSINESS" className="font-serif italic py-3 text-astro-gold">Expansion & Risk</SelectItem>
                      <SelectItem value="LEGAL" className="font-serif italic py-3">Justice & Balance</SelectItem>
                      <SelectItem value="BREAKUP" className="font-serif italic py-3 text-rose-400">Severance & Healing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                   <Label className="text-[9px] uppercase tracking-[0.4em] font-black text-astro-navy/30 ml-1">Temporal Randomization</Label>
                   <div className="h-14 bg-astro-navy/5 border border-astro-gold/10 rounded-xl flex items-center px-6 gap-3">
                      <div className="w-2 h-2 rounded-full bg-astro-gold animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest text-astro-navy/40 italic font-serif">Algorithmic Birth Chart Assigned</span>
                   </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center py-12">
        <Button 
          size="lg" 
          onClick={handleCreateTest}
          className="bg-astro-navy text-astro-gold hover:bg-black hover:text-astro-gold h-20 px-24 rounded-[2rem] text-sm font-black uppercase tracking-[0.4em] shadow-2xl shadow-astro-navy/40 transition-all hover:scale-[1.02] active:scale-[0.98] border border-astro-gold"
        >
          GENERATE AUDITION PROTOCOL <ArrowRight className="ml-4 w-6 h-6 transition-transform group-hover:translate-x-2" />
        </Button>
      </div>

      {recentTests.length > 0 && (
        <Card className="border border-astro-gold/20 shadow-sm rounded-[2rem] bg-white overflow-hidden mb-20 animate-in fade-in slide-in-from-top-8 duration-700">
          <CardHeader className="bg-astro-cream/80 border-b border-astro-gold/10 py-5">
            <CardTitle className="text-[10px] uppercase tracking-[0.3em] text-astro-navy font-black">Recently Generated Protocols</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-astro-gold/10">
                {recentTests.map((t: any) => (
                  <div key={t._id} className="p-6 flex items-center justify-between hover:bg-astro-cream/10 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-astro-navy text-astro-gold flex items-center justify-center font-serif italic font-bold">
                           {recentTests.find((tOther: any) => tOther.candidateId === t.candidateId)?.candidateName?.[0] || 'P'}
                        </div>
                        <div>
                           <p className="font-serif text-lg font-bold text-astro-navy italic">
                              {t.candidateName || 'Unknown Practitioner'}
                           </p>
                           <p className="text-[10px] uppercase font-bold tracking-widest text-astro-navy/40">
                              {new Date(t.createdAt).toLocaleString()}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-astro-gold/30">
                           {t.testType}
                        </Badge>
                        <Button 
                           variant="ghost" 
                           size="sm" 
                           className="text-astro-gold hover:text-astro-navy h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2"
                           onClick={() => {
                             const url = `${window.location.origin}/login`;
                             navigator.clipboard.writeText(url);
                             alert('Test Portal Link copied to clipboard!');
                           }}
                        >
                           Copy Portal Link
                        </Button>
                     </div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
