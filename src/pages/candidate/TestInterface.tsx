import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stars, Send, Clock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '@/src/lib/api';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

import { Input } from '@/components/ui/input';

export default function TestInterface({ user }: { user: any }) {
  const [test, setTest] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState<'mock' | 'mcq' | 'complete'>('mock');
  
  // MCQ State
  const [mcqSessionId, setMcqSessionId] = useState<string | null>(null);
  const [mcqQuestions, setMcqQuestions] = useState<any[]>([]);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqResponses, setMcqResponses] = useState<any[]>([]);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqTimer, setMcqTimer] = useState(60);
  const [cheatingSignals, setCheatingSignals] = useState({
    tabBlurs: 0,
    pasteEvents: 0,
    suspiciousFastAnswers: 0
  });

  const [personaIndex, setPersonaIndex] = useState(0);
  const [personaSession, setPersonaSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [chart, setChart] = useState<any>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [testError, setTestError] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await api.get('/tests/active');
        if (data) {
          setTest(data);
          await api.post(`/tests/${data._id}/start`, { fingerprint: navigator.userAgent });
        } else {
          setTestError("No pending audition found. The audition may have been completed, expired, or was never assigned.");
        }
      } catch (err: any) {
        setTestError("Error loading audition. Please ensure you are logged in.");
      }
    };
    fetchTest();
  }, []);

  // Polling Effect
  useEffect(() => {
    let interval: any;
    if (sessionActive && personaSession) {
      interval = setInterval(async () => {
        try {
          const { data } = await api.get(`/persona/messages?sessionId=${personaSession._id}`);
          
          // Check if there's a new persona message
          if (data.length > messages.length) {
            setMessages(data);
            const lastMsg = data[data.length - 1];
            if (lastMsg.role === 'persona') {
               setIsTyping(false);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [sessionActive, personaSession, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (sessionActive && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && sessionActive) {
      handleEndSession();
    }
  }, [sessionActive, timeLeft]);

  useEffect(() => {
    if (currentStage === 'mcq') {
       const initMcq = async () => {
         setMcqLoading(true);
         try {
           const { data } = await api.post('/mcq/generate', { testId: test._id });
           setMcqSessionId(data.sessionId);
           setMcqQuestions(data.questions);
           setMcqTimer(60);
         } catch (err) {
           console.error(err);
         } finally {
           setMcqLoading(false);
         }
       };
       initMcq();

       // Cheating detection
       const handleBlur = () => {
         setCheatingSignals(prev => ({ ...prev, tabBlurs: prev.tabBlurs + 1 }));
       };
       const handlePaste = (e: any) => {
         e.preventDefault();
         setCheatingSignals(prev => ({ ...prev, pasteEvents: prev.pasteEvents + 1 }));
       };

       window.addEventListener('blur', handleBlur);
       window.addEventListener('paste', handlePaste);

       return () => {
         window.removeEventListener('blur', handleBlur);
         window.removeEventListener('paste', handlePaste);
       };
    }
  }, [currentStage, test?._id]);

  useEffect(() => {
    if (currentStage === 'mcq' && mcqQuestions.length > 0 && mcqTimer > 0) {
      const timer = setInterval(() => setMcqTimer(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [currentStage, mcqQuestions.length, mcqTimer]);

  const handleMcqAnswer = async (answer: string) => {
    const q = mcqQuestions[mcqIndex];
    const timeTaken = 60 - mcqTimer;
    
    const newResponses = [...mcqResponses, { qId: q.id, answer, timeTakenSec: timeTaken }];
    setMcqResponses(newResponses);

    if (timeTaken < 3) {
      setCheatingSignals(prev => ({ ...prev, suspiciousFastAnswers: prev.suspiciousFastAnswers + 1 }));
    }

    if (mcqIndex < mcqQuestions.length - 1) {
      setMcqIndex(mcqIndex + 1);
      setMcqTimer(60);
    } else {
      // Last question completed
      await submitMcq(newResponses);
    }
  };

  const submitMcq = async (finalResponses: any[]) => {
    setMcqLoading(true);
    try {
      await api.post('/mcq/judge', {
        sessionId: mcqSessionId,
        responses: finalResponses,
        cheatingSignals
      });
      finishTest();
    } catch (err) {
      console.error(err);
    } finally {
      setMcqLoading(false);
    }
  };

  const startSession = async () => {
    setChartLoading(true);
    const persona = test.config.personas[personaIndex];
    try {
      const { data: chartData } = await api.post('/chart/compute', { 
        dob: persona.dob || new Date(), 
        tob: persona.tob || '12:00', 
        pob: persona.pob || 'Mumbai',
        system: user.primarySkill 
      });
      setChart(chartData);

      const { data: sessionData } = await api.post('/persona/start', {
         testId: test._id,
         personaData: {
           ...persona,
           type: persona.personaType // Map back to 'type' for the AI endpoint's expectation
         },
         chartJson: chartData
      });

      setPersonaSession(sessionData);
      setMessages(sessionData.transcript);
      setSessionActive(true);
      
    } catch (err) {
      console.error(err);
    } finally {
      setChartLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const newMessages = [...messages, { role: 'astrologer', message: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      await api.post('/persona/message', {
        sessionId: personaSession._id,
        message: input
      });
      // Response will be picked up by polling
    } catch (err) {
      console.error(err);
      setIsTyping(false);
    }
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    // Mark session as complete (optional backend call)
    
    if (personaIndex < (test.config.personas.length - 1)) {
      setPersonaIndex(personaIndex + 1);
      setPersonaSession(null);
      setMessages([]);
      setChart(null);
      setTimeLeft(300);
    } else {
      // Completed all personas
      if (test.testType === 'both' && test.order === 'mock_first') {
        setCurrentStage('mcq');
      } else {
        finishTest();
      }
    }
  };

  const finishTest = async () => {
    await api.post(`/tests/${test._id}/complete`);
    navigate('/test-complete');
  };

  if (testError) return <div className="h-[100dvh] bg-astro-cream flex items-center justify-center text-astro-navy font-serif font-bold text-xl italic px-4 text-center">{testError}</div>;
  if (!test) return <div className="min-h-screen bg-[#1a1a3e] flex items-center justify-center text-white italic">Loading test data...</div>;

  return (
    <div className="h-[100dvh] bg-astro-cream flex flex-col md:flex-row overflow-hidden">
      {/* Chart Sidebar */}
      <aside className="w-full md:w-80 shrink-0 bg-astro-navy border-r md:border-b-0 border-b border-astro-gold/20 p-4 md:p-6 flex flex-col gap-4 text-white box-border max-h-[30vh] md:max-h-none overflow-y-auto md:overflow-y-visible max-w-full">
        <div className="flex items-center gap-3 text-astro-gold">
          <Stars className="w-6 h-6" />
          <h2 className="font-serif text-lg font-bold">Client Insights</h2>
        </div>

        {chartLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-astro-gold/40 gap-3">
             <Loader2 className="w-8 h-8 animate-spin" />
             <p className="text-[10px] uppercase tracking-widest font-bold">Computing Celestial Map...</p>
          </div>
        ) : chart ? (
           <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-left-2 transition-all">
              <div className="p-5 bg-astro-gold/10 rounded-2xl border border-astro-gold/20">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-astro-gold mb-4">Key Placements</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs border-b border-astro-gold/10 pb-2">
                    <span className="text-white/40">Ascendant</span>
                    <span className="text-astro-gold font-serif text-sm italic">{chart.ascendant || chart.sun}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-astro-gold/10 pb-2">
                    <span className="text-white/40">Moon Sign</span>
                    <span className="text-astro-gold font-serif text-sm italic">{chart.moon}</span>
                  </div>
                </div>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-astro-gold mb-2">Transit Context</h4>
                <p className="text-[11px] text-white/60 leading-relaxed italic font-serif">
                  {JSON.stringify(chart)}
                </p>
              </div>
           </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-astro-gold/20 p-8 text-center text-sm italic font-serif">
            Chart profile will appear once consultation begins.
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-astro-gold/10">
          <Badge variant="outline" className="w-full justify-center p-2 text-[10px] tracking-widest text-astro-gold/60 border-astro-gold/20 mb-3 bg-white/5">
            STRICTLY CONFIDENTIAL
          </Badge>
          <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-[10px] text-rose-400 leading-tight uppercase tracking-tight font-bold">
              AI Auditor is active. Accuracy and ethics metrics are being logged.
            </p>
          </div>
        </div>
      </aside>

      {/* Chat Space */}
      <main className="flex-1 flex flex-col bg-astro-cream w-full max-w-full box-border min-w-0 min-h-0">
        {/* Header */}
        <header className="h-auto min-h-20 bg-white/50 backdrop-blur-xl border-b border-astro-gold/10 flex items-center justify-between px-4 md:px-8 py-4 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-astro-navy flex items-center justify-center font-serif text-xl text-astro-gold italic border border-astro-gold/20 shadow-lg">
              {test.config.personas[personaIndex].name?.[0] || 'C'}
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-astro-navy italic">{test.config.personas[personaIndex].name || 'Client'}</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-astro-gold/80">
                Session {personaIndex + 1} of {test.config.personas.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-astro-navy font-serif text-xl md:text-2xl font-bold">
                <Clock className="w-5 h-5 text-astro-gold" />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-astro-gold/60">Audio-Consult Duration</p>
            </div>
            {sessionActive && (
              <Button 
                variant="outline" 
                className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 h-11 px-6 rounded-xl font-bold text-xs tracking-widest"
                onClick={handleEndSession}
              >
                END SESSION
              </Button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-astro-cream w-full max-w-full box-border">
          {currentStage === 'mcq' ? (
            <div className="flex-1 flex items-center justify-center p-8">
              {mcqLoading ? (
                 <div className="flex flex-col items-center gap-4 text-astro-gold">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <p className="font-serif italic text-lg text-astro-navy">Synchronizing logic patterns...</p>
                 </div>
              ) : mcqQuestions.length > 0 ? (
                <Card className="max-w-2xl w-full bg-white border border-astro-gold/20 shadow-2xl rounded-3xl overflow-hidden pb-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="h-2 bg-astro-gold w-full" />
                  <CardHeader className="p-8 pb-4">
                      <div className="flex justify-between items-end mb-6">
                        <div>
                            <p className="text-astro-gold font-serif italic text-sm">Divine Logic Assessment</p>
                            <h3 className="text-3xl font-serif text-astro-navy font-bold">Phase II: Sacred Knowledge</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-astro-navy/40">Knowledge Seed</p>
                            <p className="text-2xl font-serif font-bold text-astro-navy">
                              {(mcqIndex + 1).toString().padStart(2, '0')} / {mcqQuestions.length.toString().padStart(2, '0')}
                            </p>
                        </div>
                      </div>
                      <div className="w-full h-1 bg-astro-cream rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-astro-gold transition-all duration-500" 
                          style={{ width: `${mcqQuestions.length > 0 ? ((mcqIndex + 1) / mcqQuestions.length) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[9px] font-bold uppercase tracking-tighter text-astro-gold/40 italic">One Q at a time • No backtracking</span>
                        <div className={cn(
                          "flex items-center gap-1.5 font-mono text-sm font-bold",
                          mcqTimer < 10 ? "text-rose-500 animate-pulse" : "text-astro-navy/40"
                        )}>
                          <Clock className="w-3.5 h-3.5" />
                          {mcqTimer}s
                        </div>
                      </div>
                  </CardHeader>
                  <CardContent className="px-8 py-4 space-y-8">
                      <div className="p-8 bg-astro-cream/30 border border-astro-gold/10 rounded-2xl min-h-[120px] flex items-center justify-center">
                        <p className="text-xl font-serif text-astro-navy leading-relaxed italic text-center">
                          {mcqQuestions[mcqIndex].question}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {mcqQuestions[mcqIndex].options.map((opt: string, i: number) => (
                          <button 
                            key={i} 
                            onClick={() => handleMcqAnswer(opt)}
                            className="flex items-center gap-4 p-5 rounded-2xl border border-astro-gold/10 hover:border-astro-gold bg-white hover:bg-astro-cream transition-all text-left shadow-sm group active:scale-[0.98]"
                          >
                              <div className="w-8 h-8 rounded-full border-2 border-astro-gold/30 group-hover:border-astro-gold group-hover:bg-astro-gold group-hover:text-astro-navy flex items-center justify-center text-xs font-bold text-astro-gold transition-colors">
                                {String.fromCharCode(65 + i)}
                              </div>
                              <span className="font-serif text-astro-navy/80 group-hover:text-astro-navy font-medium italic text-lg">{opt}</span>
                          </button>
                        ))}
                      </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-astro-navy/40 italic font-serif">Failed to manifest questions. Please contact support.</div>
              )}
            </div>
          ) : !sessionActive && !messages.length ? (
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 w-full box-border max-w-full">
              <Card className="max-w-lg w-full bg-white border-astro-gold/20 shadow-2xl rounded-3xl overflow-hidden box-border">
                <div className="h-2 bg-astro-gold w-full" />
                <CardContent className="p-6 md:p-10 text-center space-y-8 w-full box-border">
                  <div className="w-20 h-20 bg-astro-navy rounded-2xl flex items-center justify-center mx-auto mb-4 border border-astro-gold/30 shadow-xl rotate-3">
                    <Stars className="w-10 h-10 text-astro-gold" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif text-astro-navy font-bold">Case Study #{personaIndex + 1}</h3>
                    <p className="text-astro-gold font-serif italic text-lg">Are you centered for the consultation?</p>
                  </div>
                  <p className="text-astro-navy/60 text-sm leading-relaxed px-4">
                    The AI Judge will evaluate your technical logic, empathy, and consultative flow. Ensure you reference the chart accuratey.
                  </p>
                  <Button 
                    className="w-full h-14 bg-astro-gold text-astro-navy hover:bg-astro-navy hover:text-astro-gold rounded-xl text-sm font-bold shadow-xl transition-all uppercase tracking-widest"
                    onClick={startSession}
                    disabled={chartLoading}
                  >
                    {chartLoading ? 'Synchronizing Celestial Plane...' : 'Begin Consultation'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-8 md:p-12 space-y-6 scroll-smooth w-full box-border"
              >
                {messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex max-w-[85%] md:max-w-[75%] animate-in fade-in slide-in-from-bottom-4 duration-500",
                      m.role === 'astrologer' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "p-5 rounded-2xl text-sm leading-relaxed shadow-sm",
                      m.role === 'astrologer' 
                        ? "bg-astro-navy text-astro-gold rounded-tr-none shadow-astro-navy/10" 
                        : "bg-white text-astro-navy rounded-tl-none border border-astro-gold/10 font-serif italic text-base"
                    )}>
                      {m.message}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex mr-auto">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-astro-gold/10 shadow-sm">
                       <Loader2 className="w-4 h-4 text-astro-gold animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="px-4 md:px-12 pb-6 md:pb-10 w-full box-border shrink-0">
                <div className="h-auto min-h-20 bg-white border border-astro-gold/20 p-2 flex gap-2 rounded-2xl shadow-xl shadow-astro-gold/5 focus-within:border-astro-gold transition-colors w-full box-border">
                   <Input 
                     placeholder="Type your reading..."
                     className="flex-1 h-16 md:h-full bg-transparent border-none rounded-xl px-2 md:px-4 text-astro-navy text-base md:text-lg focus:ring-0 placeholder:text-astro-navy/20 font-serif italic w-full box-border"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                     disabled={isTyping || !sessionActive}
                   />
                   <Button 
                     className="h-full w-20 bg-astro-gold text-astro-navy hover:bg-astro-navy hover:text-astro-gold rounded-xl transition-all"
                     onClick={handleSend}
                     disabled={isTyping || !sessionActive || !input.trim()}
                   >
                     <Send className="w-6 h-6" />
                   </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
