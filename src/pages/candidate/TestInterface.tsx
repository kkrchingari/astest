import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stars, Send, Clock, AlertCircle, Loader2, 
  ChevronLeft, ChevronRight, Bookmark, CheckCircle2,
  Globe, Menu, X, HelpCircle
} from 'lucide-react';
import api from '@/src/lib/api';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { translateMcqQuestion } from '@/src/lib/translation';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { label: 'English', value: 'english' },
  { label: 'Hindi (हिंदी)', value: 'hindi' },
  { label: 'Telugu (తెలుగు)', value: 'telugu' },
  { label: 'Tamil (தமிழ்)', value: 'tamil' },
  { label: 'Other', value: 'other' }
];

const UI_STRINGS: Record<string, Record<string, string>> = {
  hindi: {
    question_palette: 'प्रश्न पैलेट',
    legend: 'संकेत',
    answered: 'उत्तर दिया',
    marked_review: 'समीक्षा के लिए चिह्नित',
    not_visited: 'देखा नहीं गया',
    submit_test: 'टेस्ट जमा करें',
    previous: 'पिछला',
    mark_for_review: 'समीक्षा के लिए चिह्नित करें',
    save_next: 'सहेजें और अगला',
    question: 'प्रश्न',
    loading_questions: 'खगोलीय प्रश्न सिंक हो रहे हैं...',
    consultation: 'परामर्श'
  },
  telugu: {
    question_palette: 'ప్రశ్నల పట్టిక',
    legend: 'సూచిక',
    answered: 'సమాధానం ఇచ్చారు',
    marked_review: 'సమీక్ష కోసం మార్క్ చేసారు',
    not_visited: 'చూడలేదు',
    submit_test: 'టెస్ట్ సమర్పించు',
    previous: 'మునుపటి',
    mark_for_review: 'సమీక్ష కోసం మార్క్ చేయండి',
    save_next: 'సేవ్ చేసి తదుపరి',
    question: 'ప్రశ్న',
    loading_questions: 'ప్రశ్నలు లోడ్ అవుతున్నాయి...',
    consultation: 'సంప్రదింపులు'
  },
  tamil: {
    question_palette: 'வினா மெனு',
    legend: 'விளக்கம்',
    answered: 'பதிலளிக்கப்பட்டது',
    marked_review: 'மதிப்பாய்விற்கு குறிக்கப்பட்டது',
    not_visited: 'பார்க்கப்படவில்லை',
    submit_test: 'சமர்ப்பிக்கவும்',
    previous: 'முந்தைய',
    mark_for_review: 'மதிப்பாய்விற்கு குறிக்கவும்',
    save_next: 'சேமித்து அடுத்து',
    question: 'கேள்வி',
    loading_questions: 'கேள்விகள் ஏற்றப்படுகின்றன...',
    consultation: 'ஆலோசனை'
  }
};

export default function TestInterface({ user }: { user: any }) {
  const [test, setTest] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState<'mock' | 'mcq' | 'complete' | 'loading'>('loading');
  
  // MCQ State
  const [mcqSessionId, setMcqSessionId] = useState<string | null>(null);
  const [mcqQuestions, setMcqQuestions] = useState<any[]>([]);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqResponses, setMcqResponses] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqTimer, setMcqTimer] = useState(3600); 
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [translatedQuestion, setTranslatedQuestion] = useState<any>(null);
  const [translating, setTranslating] = useState(false);

  const t = (key: string) => {
    return UI_STRINGS[currentLanguage]?.[key] || {
      question_palette: 'Question Palette',
      legend: 'Legend',
      answered: 'Answered',
      marked_review: 'Marked for Review',
      not_visited: 'Not Visited',
      submit_test: 'Submit Test',
      previous: 'Previous',
      mark_for_review: 'Mark for Review',
      save_next: 'Save & Next',
      question: 'Question',
      loading_questions: 'Syncing Celestial Questions...',
      consultation: 'Consultation'
    }[key] || key;
  };

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
  const [timeLeft, setTimeLeft] = useState(300); 
  const [chart, setChart] = useState<any>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [testError, setTestError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testRes, candidateRes] = await Promise.all([
          api.get('/tests/active'),
          api.get('/candidate/me').catch(() => ({ data: null }))
        ]);

        if (testRes.data) {
          const data = testRes.data;
          setTest(data);
          if (data.testType === 'mcq') {
            setCurrentStage('mcq');
          } else if (data.testType === 'both' && data.order === 'mcq_first') {
            setCurrentStage('mcq');
          } else {
            setCurrentStage('mock');
          }
          await api.post(`/tests/${data._id}/start`, { fingerprint: navigator.userAgent });
        } else {
          setTestError("No pending audition found.");
        }

        if (candidateRes.data) {
          setCandidate(candidateRes.data);
        }
      } catch (err: any) {
        setTestError("Error loading audition data.");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (currentStage === 'mcq' && test?._id && mcqQuestions.length === 0) {
       const initMcq = async () => {
         setMcqLoading(true);
         try {
           const { data } = await api.post('/mcq/generate', { testId: test._id });
           setMcqSessionId(data.sessionId);
           setMcqQuestions(data.questions);
           setMcqTimer(data.questions.length * 60);
         } catch (err) {
           console.error(err);
         } finally {
           setMcqLoading(false);
         }
       };
       initMcq();

       const handleBlur = () => setCheatingSignals(prev => ({ ...prev, tabBlurs: prev.tabBlurs + 1 }));
       const handlePaste = (e: any) => { e.preventDefault(); setCheatingSignals(prev => ({ ...prev, pasteEvents: prev.pasteEvents + 1 })); };
       window.addEventListener('blur', handleBlur);
       window.addEventListener('paste', handlePaste);
       return () => { window.removeEventListener('blur', handleBlur); window.removeEventListener('paste', handlePaste); };
    }
  }, [currentStage, test?._id, mcqQuestions.length]);

  useEffect(() => {
    if (currentStage === 'mcq' && mcqQuestions.length > 0 && mcqTimer > 0) {
      const timer = setInterval(() => setMcqTimer(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (mcqTimer === 0 && currentStage === 'mcq') {
      handleSubmitTest();
    }
  }, [currentStage, mcqQuestions.length, mcqTimer]);

  useEffect(() => {
    if (currentStage === 'mcq' && mcqQuestions[mcqIndex]) {
      if (currentLanguage === 'english') {
        setTranslatedQuestion(null);
        return;
      }

      const performTranslation = async () => {
        setTranslating(true);
        const translated = await translateMcqQuestion(mcqQuestions[mcqIndex], currentLanguage);
        setTranslatedQuestion(translated);
        setTranslating(false);
      };
      performTranslation();
    }
  }, [mcqIndex, currentLanguage, currentStage, mcqQuestions]);

  const currentQuestion = translatedQuestion || mcqQuestions[mcqIndex];

  const handleSelectOption = (option: string) => {
    setMcqResponses(prev => ({
      ...prev,
      [mcqQuestions[mcqIndex].id]: option
    }));
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(mcqIndex)) next.delete(mcqIndex);
      else next.add(mcqIndex);
      return next;
    });
  };

  const handleNext = () => {
    if (mcqIndex < mcqQuestions.length - 1) {
      setMcqIndex(mcqIndex + 1);
    }
  };

  const handlePrev = () => {
    if (mcqIndex > 0) {
      setMcqIndex(mcqIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    setMcqLoading(true);
    try {
      const formattedResponses = mcqQuestions.map(q => ({
        qId: q.id,
        answer: mcqResponses[q.id] || '',
        timeTakenSec: 0 
      }));

      await api.post('/mcq/judge', {
        sessionId: mcqSessionId,
        responses: formattedResponses,
        cheatingSignals
      });
      
      if (test.testType === 'both' && test.order === 'mcq_first') {
        setCurrentStage('mock');
      } else {
        finishTest();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMcqLoading(false);
    }
  };

  const finishTest = async () => {
    await api.post(`/tests/${test._id}/complete`);
    navigate('/test-complete');
  };

  // Mock stage timer logic
  useEffect(() => {
    if (currentStage === 'mock' && sessionActive && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && sessionActive) {
      handleEndSession();
    }
  }, [currentStage, sessionActive, timeLeft]);

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
         personaData: { ...persona, type: persona.personaType },
         chartJson: chartData
      });

      setPersonaSession(sessionData);
      setMessages(sessionData.transcript);
      setSessionActive(true);
    } catch (err) { console.error(err); } finally { setChartLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const newMessages = [...messages, { role: 'astrologer', message: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    try {
      await api.post('/persona/message', { sessionId: personaSession._id, message: input });
    } catch (err) { console.error(err); setIsTyping(false); }
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    if (personaIndex < (test.config.personas.length - 1)) {
      setPersonaIndex(personaIndex + 1);
      setPersonaSession(null);
      setMessages([]);
      setChart(null);
      setTimeLeft(300);
    } else {
      if (test.testType === 'both' && test.order === 'mock_first') {
        setCurrentStage('mcq');
      } else { finishTest(); }
    }
  };

  useEffect(() => {
    let interval: any;
    if (currentStage === 'mock' && sessionActive && personaSession) {
      interval = setInterval(async () => {
        try {
          const { data } = await api.get(`/persona/messages?sessionId=${personaSession._id}`);
          if (data.length > messages.length) {
            setMessages(data);
            if (data[data.length - 1].role === 'persona') setIsTyping(false);
          }
        } catch (err) { console.error(err); }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [currentStage, sessionActive, personaSession, messages.length]);

  const testName = useMemo(() => {
    if (!test) return "Assessment";
    const skillName = candidate?.skills?.[0] || user.primarySkill || "Astrology";
    return `${skillName.toUpperCase()} ENTRANCE EVALUATION`;
  }, [test, candidate, user.primarySkill]);

  if (testError) return <div className="h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-bold p-4 text-center">{testError}</div>;
  if (!test || (currentStage === 'loading')) return <div className="h-screen bg-[#1a1a3e] flex items-center justify-center text-white italic">Manifesting Test Environment...</div>;

  const isTimeCritical = mcqTimer < 300; 

  if (currentStage === 'mcq') {
    return (
      <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              <Stars className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">{testName}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-slate-400" />
              <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                <SelectTrigger className="w-[150px] h-9 text-xs font-semibold border-slate-200 bg-slate-50">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={cn(
              "flex items-center gap-3 px-4 py-1.5 rounded-full border transition-all duration-300",
              isTimeCritical ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-slate-100 text-slate-700 border-slate-200"
            )}>
              <Clock className={cn("w-4 h-4", isTimeCritical ? "text-red-500" : "text-slate-500")} />
              <span className="font-mono font-bold text-sm">
                {Math.floor(mcqTimer / 3600).toString().padStart(2, '0')}:
                {Math.floor((mcqTimer % 3600) / 60).toString().padStart(2, '0')}:
                {(mcqTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* SIDEBAR NAVIGATION */}
          <aside className={cn(
            "w-[280px] h-full bg-white border-r border-slate-200 flex flex-col shadow-sm transition-all duration-300",
            !isSidebarOpen && "md:-ml-[280px]"
          )}>
            <div className="p-5 border-b border-slate-100">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">{t('question_palette')}</h4>
              <div className="grid grid-cols-5 gap-2.5">
                {mcqQuestions.map((_, i) => {
                  const isSelected = mcqIndex === i;
                  const isAnswered = !!mcqResponses[mcqQuestions[i].id];
                  const isMarked = markedForReview.has(i);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setMcqIndex(i)}
                      className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold transition-all border",
                        isSelected ? "ring-2 ring-indigo-500 ring-offset-2" : "",
                        isMarked 
                          ? "bg-purple-500 text-white border-purple-600" 
                          : isAnswered 
                            ? "bg-emerald-500 text-white border-emerald-600" 
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">{t('legend')}</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                    <div className="w-3.5 h-3.5 rounded bg-emerald-500" /> {t('answered')}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                    <div className="w-3.5 h-3.5 rounded bg-purple-500" /> {t('marked_review')}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                    <div className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200" /> {t('not_visited')}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50">
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 shadow-lg shadow-indigo-100"
                onClick={handleSubmitTest}
              >
                {t('submit_test')}
              </Button>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
              {mcqLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-indigo-600">
                  <Loader2 className="w-12 h-12 animate-spin" />
                  <p className="font-medium animate-pulse">{t('loading_questions')}</p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto w-full space-y-8 pb-32">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{t('question')} {mcqIndex + 1}</h2>
                      <span className="text-xs text-slate-500">MCQ Single Correct Option</span>
                    </div>
                    <Badge variant="outline" className="bg-white px-3 py-1 text-[10px] font-bold border-slate-200">
                      Phase II: Logic
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[140px] flex items-center relative overflow-hidden">
                      {translating && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>}
                      <p className="text-xl md:text-2xl font-serif text-slate-800 italic leading-relaxed">
                        {currentQuestion?.question}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {currentQuestion?.options.map((opt: string, i: number) => {
                        const isSelected = mcqResponses[mcqQuestions[mcqIndex].id] === mcqQuestions[mcqIndex].options[i];
                        return (
                          <button
                            key={i}
                            onClick={() => handleSelectOption(mcqQuestions[mcqIndex].options[i])}
                            className={cn(
                              "flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all group",
                              isSelected 
                                ? "bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100" 
                                : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                            )}
                          >
                            <div className={cn(
                              "w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors",
                              isSelected ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-200 group-hover:border-indigo-300 text-slate-400 group-hover:text-indigo-600"
                            )}>
                              {String.fromCharCode(65 + i)}
                            </div>
                            <span className={cn("font-medium text-base", isSelected ? "text-indigo-900" : "text-slate-600")}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <footer className="h-20 bg-white border-t border-slate-200 px-6 flex items-center justify-between z-30 shrink-0">
               <div className="flex items-center gap-3">
                 <Button variant="outline" className="h-11 px-4 font-bold border-slate-200" onClick={handlePrev} disabled={mcqIndex === 0}><ChevronLeft className="w-4 h-4 mr-2" /> {t('previous')}</Button>
                 <Button variant="ghost" className={cn("h-11 px-4 font-bold transition-all", markedForReview.has(mcqIndex) ? "text-purple-600 bg-purple-50" : "text-slate-500")} onClick={toggleMarkForReview}><Bookmark className={cn("w-4 h-4 mr-2", markedForReview.has(mcqIndex) && "fill-current")} /> {t('mark_for_review')}</Button>
               </div>
               <div className="flex items-center gap-3">
                 <Button 
                    className="h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100" 
                    onClick={handleNext}
                    disabled={mcqIndex === mcqQuestions.length - 1}
                  >
                    {t('save_next')} <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
               </div>
            </footer>
          </main>
        </div>
      </div>
    );
  }

  // MOCK CONSULTATION FALLBACK (Restoring existing core logic for stage transition)
  return (
    <div className="h-[100dvh] bg-slate-50 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-80 shrink-0 bg-[#0f172a] border-r border-white/10 p-6 flex flex-col gap-6 text-white overflow-y-auto">
          <div className="flex items-center gap-3 text-indigo-400">
            <Stars className="w-6 h-6" />
            <h2 className="font-serif text-lg font-bold">Audition Metadata</h2>
          </div>
          {chartLoading ? <div className="flex-1 flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /><p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Mapping Stars...</p></div> : chart ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-4">Cosmic Profile</h4>
                <div className="space-y-3 font-serif text-xs">
                   <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/40">Ascendant</span><span className="text-white">{chart.ascendant || 'Lagna'}</span></div>
                   <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/40">Moon Sign</span><span className="text-white">{chart.moon}</span></div>
                </div>
              </div>
            </div>
          ) : <div className="flex-1 flex items-center justify-center p-8 text-center text-sm italic text-white/20">Client data will manifest here upon session start.</div>}
        </aside>

        <main className="flex-1 flex flex-col bg-white">
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-indigo-50">{test.config.personas[personaIndex].name?.[0] || 'C'}</div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{test.config.personas[personaIndex].name || 'Client'}</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-500">Stage {personaIndex + 1} of {test.config.personas.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-slate-900 font-bold"><Clock className="w-5 h-5 text-indigo-500" />{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
               {sessionActive && <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50" onClick={handleEndSession}>END SESSION</Button>}
            </div>
          </header>

          <div className="flex-1 flex flex-col min-h-0">
             {!sessionActive && !messages.length ? (
               <div className="flex-1 flex items-center justify-center p-8">
                 <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95">
                   <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600"><Stars className="w-10 h-10" /></div>
                   <div className="space-y-2">
                     <h2 className="text-3xl font-bold text-slate-900 font-serif">A Soul Seeks Guidance</h2>
                     <p className="text-slate-500">Consultation #{personaIndex + 1}. The AI Proctor is monitoring your resonance, accuracy, and ethics.</p>
                   </div>
                   <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xl shadow-indigo-100" onClick={startSession}>Initialize Session</Button>
                 </div>
               </div>
             ) : (
               <>
                 <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-10 space-y-6">
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex max-w-[80%]", m.role === 'astrologer' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                        <div className={cn("p-5 rounded-2xl text-sm leading-relaxed", m.role === 'astrologer' ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100" : "bg-slate-100 text-slate-800 rounded-tl-none")}>{m.message}</div>
                      </div>
                    ))}
                    {isTyping && <div className="flex mr-auto"><div className="bg-slate-100 p-4 rounded-xl rounded-tl-none animate-pulse"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div></div>}
                 </div>
                 <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                    <div className="bg-white border border-slate-200 p-2 flex gap-2 rounded-2xl shadow-sm focus-within:ring-2 ring-indigo-100 transition-all">
                       <Input placeholder="Respond to the client..." className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-slate-900 h-14" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={isTyping || !sessionActive} />
                       <Button className="h-14 w-14 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100" onClick={handleSend} disabled={isTyping || !sessionActive || !input.trim()}><Send className="w-6 h-6" /></Button>
                    </div>
                 </div>
               </>
             )}
          </div>
        </main>
    </div>
  );
}
