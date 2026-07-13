import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile, Message, Flashcard } from '../types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  GraduationCap, 
  FileText, 
  Layers, 
  Brain, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb, 
  ChevronRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AITutorProps {
  studentProfile: StudentProfile;
  onAddFlashcard: (card: Flashcard) => void;
  onStudySessionComplete: (subject: string, topic: string, durationMinutes: number, xpReward: number) => void;
  preseededPrompt?: string;
  preseededSubject?: string;
  preseededTopic?: string;
  onClearPreseed?: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hints: string[];
}

const TUTORS = [
  { id: 'gemini', name: 'Gemini Sparkle ✨', avatar: '🐱', color: 'text-purple-600 bg-purple-50 border-purple-200 shadow-purple-100/50', desc: 'Friendly, warm, loves cute emojis, and visualizes ideas with easy-to-understand analogies!' },
  { id: 'chatgpt', name: 'GPT Wise Owl 🦉', avatar: '🦉', color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200 shadow-fuchsia-100/50', desc: 'Detail-oriented, highly structured, and excels at step-by-step calculations and rules.' },
  { id: 'claude', name: 'Claude Clever Kitten 🌸', avatar: '🌸', color: 'text-pink-600 bg-pink-50 border-pink-200 shadow-pink-100/50', desc: 'Gentle, highly supportive, clear-headed, and explains concepts as if talking to a friend.' }
];

export default function AITutor({ 
  studentProfile, 
  onAddFlashcard, 
  onStudySessionComplete,
  preseededPrompt,
  preseededSubject,
  preseededTopic,
  onClearPreseed 
}: AITutorProps) {
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('Quadratic Equations');
  const [selectedTutor, setSelectedTutor] = useState<'gemini' | 'chatgpt' | 'claude'>('gemini');
  const [messageText, setMessageText] = useState('');
  
  const currentTutorInfo = TUTORS.find(t => t.id === selectedTutor) || TUTORS[0];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "### Welcome to your AI Tutor Room! 👋🌸\n\nI can help you break down complex concepts, make study cards, or test your readiness. Select a subject, topic, and choose your favorite AI companion in the settings. Tell me what you'd like to work on! Try these quick controls below:",
      createdAt: new Date().toISOString()
    }
  ]);

  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quiz states
  const [quizMode, setQuizMode] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle past papers link bridge
  useEffect(() => {
    if (preseededPrompt) {
      if (preseededSubject) {
        setSubject(preseededSubject);
      }
      if (preseededTopic) {
        setTopic(preseededTopic);
      }
      // Send the preseeded message
      sendMessage(preseededPrompt);

      // Reset standard clear callback
      if (onClearPreseed) {
        onClearPreseed();
      }
    }
  }, [preseededPrompt, preseededSubject, preseededTopic]);

  // Quick Action triggers
  const handleQuickAction = async (actionType: 'simplify' | 'analogy' | 'notes' | 'flashcards') => {
    let prompt = '';
    if (actionType === 'simplify') {
      prompt = `Simplify the topic of "${topic}" in ${subject} so it is incredibly easy to understand. Explain like I am 10 years old with fun analogies.`;
    } else if (actionType === 'analogy') {
      prompt = `Give me 3 memorable real-world analogies and examples for understanding "${topic}" in ${subject}.`;
    } else if (actionType === 'notes') {
      prompt = `Generate a high-quality, comprehensive set of study/revision notes for "${topic}" in ${subject}, including core equations, definitions, and typical exam pitfalls.`;
    } else if (actionType === 'flashcards') {
      prompt = `Create 2 powerful revision flashcards (Question & Answer) for "${topic}" in ${subject}. Format each clearly.`;
    }

    setMessageText('');
    await sendMessage(prompt);
  };

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || messageText;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setMessageText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          studentProfile,
          currentSubject: subject,
          currentTopic: topic,
          selectedTutor
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: `msg_${Date.now() + 1}`,
          sender: 'ai',
          text: data.text,
          createdAt: new Date().toISOString()
        }]);

        // If user requested flashcards, parse and trigger saving them automatically
        if (textToSend.toLowerCase().includes('flashcard') || textToSend.toLowerCase().includes('study card')) {
          detectAndSaveFlashcards(data.text);
        }

        // Trigger session progress reward
        onStudySessionComplete(subject, topic, 10, 20); // 10 minutes, 20 XP
      } else {
        throw new Error(data.error || 'Failed to fetch tutor response');
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `msg_err_${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Connection issue with the AI Tutor engine.** Here is a quick study guide for **${topic}**:\n\n1. **Focus on Core Definitions**: Always memorize what the primary terminology stands for.\n2. **Break it into parts**: Tackle equations piece by piece instead of whole blocks.\n3. **Test yourself**: Try active recall immediately.\n\n*Please try sending your prompt again once connection stabilizes!*`,
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper: auto-detect and save flashcards from tutor output
  const detectAndSaveFlashcards = (text: string) => {
    try {
      // Look for custom formatting or basic partitions
      if (text.includes('Question:') && text.includes('Answer:')) {
        const parts = text.split('Question:');
        parts.shift(); // remove header
        parts.forEach((p, idx) => {
          const qa = p.split('Answer:');
          if (qa.length >= 2) {
            const q = qa[0].replace(/[\n\r*#-]/g, '').trim();
            const a = qa[1].split('Question:')[0].replace(/[\n\r*#-]/g, '').trim();
            if (q && a) {
              const newCard: Flashcard = {
                id: `card_${Date.now()}_${idx}`,
                studentId: studentProfile.uid,
                subject,
                topic,
                question: q,
                answer: a,
                box: 1,
                nextReviewDate: new Date().toISOString().split('T')[0]
              };
              onAddFlashcard(newCard);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Could not auto-parse flashcards:', e);
    }
  };

  // Quiz execution
  const startInteractiveQuiz = async () => {
    setQuizMode(true);
    setLoadingQuiz(true);
    setQuizQuestions([]);
    setCurrentQuizIdx(0);
    setSelectedOption(null);
    setShowAnswerFeedback(false);
    setQuizScore(0);
    setQuizCompleted(false);
    setShowHint(false);

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          difficulty: quizDifficulty,
          gradeLevel: studentProfile.gradeLevel,
          numQuestions: 3
        })
      });

      const data = await res.json();
      if (res.ok && data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
      } else {
        throw new Error('No questions returned');
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setQuizQuestions([
        {
          id: 'fb_q1',
          question: `What is the most critical first step when attempting a medium-difficulty problem in ${topic}?`,
          options: [
            'A) Write down known parameters and identify the formula',
            'B) Do calculations in your head to save time',
            'C) Copy and write down matching examples from memory',
            'D) Guess the answer based on multiple-choice letter sequences'
          ],
          correctAnswer: 'A',
          explanation: 'Standard practices dictate that establishing initial boundary constraints and listing variables is the single best way to avoid careless errors.',
          hints: ['Think of structural organization.', 'The formula holds the structure.']
        }
      ]);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (opt: string) => {
    if (showAnswerFeedback) return;
    setSelectedOption(opt);
  };

  const handleSubmitQuizAnswer = () => {
    if (!selectedOption) return;
    setShowAnswerFeedback(true);
    const q = quizQuestions[currentQuizIdx];
    
    // Check if correct (e.g. option starts with correct answer letter like A, B, C, D)
    const optionLetter = selectedOption.trim().charAt(0);
    const correctLetter = q.correctAnswer.trim().charAt(0);
    
    if (optionLetter === correctLetter) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    setSelectedOption(null);
    setShowAnswerFeedback(false);
    setShowHint(false);

    if (currentQuizIdx < quizQuestions.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
    } else {
      setQuizCompleted(true);
      // Study reward
      const accuracy = (quizScore / quizQuestions.length) * 100;
      const xpEarned = Math.round(accuracy * 0.5) + 20; // XP relative to score
      onStudySessionComplete(subject, topic, 15, xpEarned);
    }
  };

  // Clean Markdown Parser simulation
  const formatTutorText = (text: string) => {
    if (!text) return '';
    return text.split('\n').map((line, index) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h4 key={index} className="text-base font-extrabold text-indigo-950 mt-4 mb-2">{trimmed.replace('###', '')}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={index} className="text-lg font-bold text-slate-900 mt-5 mb-2.5">{trimmed.replace('##', '')}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={index} className="text-xl font-bold text-slate-950 mt-6 mb-3">{trimmed.replace('#', '')}</h2>;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return <li key={index} className="ml-4 list-disc text-sm text-slate-700 leading-relaxed my-1">{trimmed.replace(/^[-\*]\s*/, '')}</li>;
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <p key={index} className="text-sm font-bold text-slate-900 my-1.5">{trimmed.replace(/\*\*/g, '')}</p>;
      }
      
      // Inline formatting highlights
      let parts: React.ReactNode[] = [line];
      if (line.includes('**')) {
        const bits = line.split('**');
        parts = bits.map((b, bIdx) => bIdx % 2 === 1 ? <strong key={bIdx} className="font-extrabold text-slate-900">{b}</strong> : b);
      }

      return <p key={index} className="text-sm text-slate-700 leading-relaxed my-2">{parts}</p>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6" id="ai_tutor_workspace">
      
      {/* Session setup sidebar */}
      <div className="lg:col-span-1 space-y-4" id="tutor_sidebar">
        <div className="bg-white rounded-[24px] shadow-sm border border-purple-100/60 p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-purple-50 pb-3">
            <GraduationCap className="w-4.5 h-4.5 text-purple-600" />
            Tutor Settings
          </h3>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
              <select
                id="tutor_subject_select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/30 border border-purple-100 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Physics">Physics</option>
                <option value="Computer Science">Computer Science</option>
                <option value="English">English</option>
                <option value="Business & Economics">Business & Economics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Active Topic</label>
              <input
                id="tutor_topic_input"
                type="text"
                placeholder="e.g. Quadratic Equations"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/30 border border-purple-100 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Cute AI Companions Picker */}
            <div className="pt-3 border-t border-purple-100">
              <label className="block text-xs font-bold text-purple-600 uppercase mb-2">🌸 AI Study Companion</label>
              <div className="space-y-2" id="tutors_list_selectors">
                {TUTORS.map((t) => {
                  const isActive = selectedTutor === t.id;
                  return (
                    <button
                      id={`tutor_select_${t.id}`}
                      key={t.id}
                      onClick={() => {
                        setSelectedTutor(t.id as any);
                        // Append a friendly transition notification
                        setMessages(prev => [
                          ...prev,
                          {
                            id: `system_switch_${Date.now()}`,
                            sender: 'ai',
                            text: `*System Alert: You have switched study companions to **${t.name}**!* \n\n${t.avatar} "Hi! Let's learn together and master **${topic}** today! Let me know what you need help with."`,
                            createdAt: new Date().toISOString()
                          }
                        ]);
                      }}
                      className={`w-full text-left p-2.5 rounded-2xl border text-xs transition-all flex items-start gap-2 cursor-pointer ${
                        isActive 
                          ? 'bg-purple-100/60 border-purple-300 ring-2 ring-purple-200 font-medium' 
                          : 'bg-slate-50/60 border-slate-150 hover:bg-slate-100/60'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{t.avatar}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block">{t.name}</span>
                        <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Explanatory Prompts */}
        <div className="bg-white rounded-[24px] shadow-sm border border-purple-100/60 p-5 space-y-3.5" id="quick_tutor_actions">
          <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            Quick Study Tools
          </h4>
          <div className="grid grid-cols-1 gap-2" id="quick_actions_grid">
            <button
              id="action_simplify"
              onClick={() => handleQuickAction('simplify')}
              disabled={loading || quizMode}
              className="flex items-center gap-2.5 text-left p-2.5 rounded-xl border border-purple-50 text-xs font-medium text-slate-700 hover:bg-purple-50/50 disabled:opacity-50 text-purple-950 transition-colors cursor-pointer"
            >
              <Brain className="w-4 h-4 text-purple-600" />
              <span>Explain to a 10 year old</span>
            </button>
            <button
              id="action_analogy"
              onClick={() => handleQuickAction('analogy')}
              disabled={loading || quizMode}
              className="flex items-center gap-2.5 text-left p-2.5 rounded-xl border border-purple-50 text-xs font-medium text-slate-700 hover:bg-purple-50/50 disabled:opacity-50 text-purple-950 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Memory Analogies</span>
            </button>
            <button
              id="action_notes"
              onClick={() => handleQuickAction('notes')}
              disabled={loading || quizMode}
              className="flex items-center gap-2.5 text-left p-2.5 rounded-xl border border-purple-50 text-xs font-medium text-slate-700 hover:bg-purple-50/50 disabled:opacity-50 text-purple-950 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Full Revision Notes</span>
            </button>
            <button
              id="action_flashcards"
              onClick={() => handleQuickAction('flashcards')}
              disabled={loading || quizMode}
              className="flex items-center gap-2.5 text-left p-2.5 rounded-xl border border-purple-50 text-xs font-medium text-slate-700 hover:bg-purple-50/50 disabled:opacity-50 text-purple-950 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Generate 2 Flashcards</span>
            </button>
          </div>

          <div className="relative py-2" id="sidebar_divider">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-purple-100/60" /></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-purple-400 font-bold">Interactive Practice</span></div>
          </div>

          <div className="space-y-2">
            <div className="flex gap-1 justify-between items-center text-xs">
              <span className="font-semibold text-slate-600">Level:</span>
              <div className="flex gap-1">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button 
                    key={d} 
                    onClick={() => setQuizDifficulty(d)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${quizDifficulty === d ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <button
              id="action_quiz"
              onClick={startInteractiveQuiz}
              disabled={loading || loadingQuiz}
              className="w-full flex items-center justify-center gap-2 py-2 bg-purple-650 hover:bg-purple-750 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Quiz Me on this Topic</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main chat or active quiz room */}
      <div className="lg:col-span-3 flex flex-col h-[560px] bg-white rounded-[24px] border border-purple-100/60 shadow-sm overflow-hidden" id="tutor_room_main">
        
        {/* Toggle header banner if quiz mode active */}
        <div className="bg-purple-600 px-5 py-3 text-white flex justify-between items-center shadow-sm shrink-0" id="tutor_room_header">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <h3 className="font-bold text-sm tracking-tight">
              {quizMode ? `Interactive Practice Quiz: ${topic}` : `AI Personal Tutor Session`}
            </h3>
          </div>
          {quizMode && (
            <button
              id="exit_quiz_btn"
              onClick={() => setQuizMode(false)}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Exit to Chat
            </button>
          )}
        </div>

        {/* Dynamic Screen panel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" id="tutor_viewport">
          <AnimatePresence mode="wait">
            {!quizMode ? (
              // AI Chat Conversation Log
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 h-full"
                id="chat_history_log"
              >
                {messages.map((m) => {
                  const isAi = m.sender === 'ai';
                  return (
                    <div 
                      key={m.id}
                      className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                    >
                      {isAi && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-purple-150 ${currentTutorInfo.color}`}>
                          <span className="text-sm">{currentTutorInfo.avatar}</span>
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        isAi 
                          ? 'bg-slate-50 border border-purple-50 text-slate-800 rounded-tl-none' 
                          : 'bg-purple-600 text-white rounded-tr-none'
                      }`}>
                        {isAi ? formatTutorText(m.text) : <p className="text-sm">{m.text}</p>}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-3 max-w-[80%] mr-auto items-center" id="tutor_typing_indicator">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${currentTutorInfo.color}`}>
                      <span className="text-sm animate-bounce">{currentTutorInfo.avatar}</span>
                    </div>
                    <div className="bg-slate-50 border border-purple-100 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                      <span>{currentTutorInfo.name} is drafting answers step-by-step...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </motion.div>
            ) : (
              // Interactive Quiz Mode Log
              <motion.div
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5 h-full max-w-2xl mx-auto py-4"
                id="quiz_active_session"
              >
                {loadingQuiz ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16" id="loading_quiz_box">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                    <h4 className="font-bold text-slate-800">Generating Exam-Board Questions</h4>
                    <p className="text-xs text-slate-400 mt-1">AI is tailoring custom, non-repetitive challenges based on "{topic}"...</p>
                  </div>
                ) : quizCompleted ? (
                  <div className="text-center py-10 space-y-4" id="quiz_completed_box">
                    <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
                    <h3 className="text-xl font-bold text-slate-900">Practice Session Complete!</h3>
                    <p className="text-sm text-slate-500">You scored <span className="font-extrabold text-purple-600">{quizScore} / {quizQuestions.length}</span> on the {quizDifficulty} level quiz.</p>
                    
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 max-w-sm mx-auto rounded-xl text-xs text-emerald-800">
                      🌟 <strong>Study Synced!</strong> You earned an average of <strong>+{Math.round((quizScore / quizQuestions.length) * 30) + 10} XP</strong> and updated your Spaced Repetition mastery metric.
                    </div>

                    <button
                      id="restart_quiz_btn"
                      onClick={startInteractiveQuiz}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="w-4.5 h-4.5" />
                      <span>Retake Another Quiz</span>
                    </button>
                  </div>
                ) : quizQuestions.length > 0 ? (
                  // Active quiz card
                  <div className="space-y-4" id="active_quiz_card">
                    <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      <span>Interactive Challenge</span>
                      <span>Question {currentQuizIdx + 1} of {quizQuestions.length}</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5" id="quiz_question_box">
                      <p className="text-base font-semibold text-slate-900 leading-relaxed">
                        {quizQuestions[currentQuizIdx].question}
                      </p>
                    </div>

                    {/* Options list */}
                    <div className="space-y-2" id="quiz_options_list">
                      {quizQuestions[currentQuizIdx].options.map((opt) => {
                        const isSelected = selectedOption === opt;
                        const isCorrectOption = opt.trim().charAt(0) === quizQuestions[currentQuizIdx].correctAnswer.trim().charAt(0);
                        
                        let optStyle = 'border-purple-100 hover:bg-purple-50/20 text-slate-800 bg-white';
                        if (isSelected) {
                          optStyle = 'border-purple-600 bg-purple-50/50 text-purple-950 font-medium';
                        }
                        if (showAnswerFeedback) {
                          if (isCorrectOption) {
                            optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                          } else if (isSelected) {
                            optStyle = 'border-rose-500 bg-rose-50 text-rose-800 font-bold';
                          }
                        }

                        return (
                          <button
                            id={`quiz_opt_${opt.charAt(0)}`}
                            key={opt}
                            onClick={() => handleSelectOption(opt)}
                            className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center gap-3 cursor-pointer ${optStyle}`}
                          >
                            <span className="w-6 h-6 shrink-0 rounded-full border border-slate-200 flex items-center justify-center text-xs font-bold">
                              {opt.trim().charAt(0)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Hint details */}
                    {showHint && (
                      <div className="p-3.5 bg-amber-50/50 border border-amber-200 text-amber-800 rounded-xl text-xs flex gap-2" id="quiz_hint_details">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span><strong>Tutor Hint:</strong> {quizQuestions[currentQuizIdx].hints[0]}</span>
                      </div>
                    )}

                    {/* Submit / Next Actions */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100" id="quiz_actions">
                      <button
                        id="quiz_hint_btn"
                        onClick={() => setShowHint(!showHint)}
                        disabled={showAnswerFeedback}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Lightbulb className="w-4 h-4" />
                        <span>Need a Hint?</span>
                      </button>

                      {!showAnswerFeedback ? (
                        <button
                          id="submit_quiz_answer_btn"
                          onClick={handleSubmitQuizAnswer}
                          disabled={!selectedOption}
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Check Answer</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          id="next_quiz_q_btn"
                          onClick={handleNextQuizQuestion}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>{currentQuizIdx === quizQuestions.length - 1 ? 'Finish Challenge' : 'Next Question'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Solution explanation */}
                    {showAnswerFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5"
                        id="solution_explanation"
                      >
                        <span className="font-extrabold text-slate-800 uppercase tracking-wider block">Solution Breakdown</span>
                        <p className="text-slate-600 leading-relaxed">
                          {quizQuestions[currentQuizIdx].explanation}
                        </p>
                      </motion.div>
                    )}

                  </div>
                ) : (
                  <p className="text-center text-slate-400 text-sm py-16">Failed to load quiz challenges.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input area if chat active */}
        {!quizMode && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 shrink-0" id="chat_input_panel">
            <div className="flex gap-2.5">
              <input
                id="chat_message_input"
                type="text"
                placeholder={`Ask anything about ${topic}...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading}
                className="flex-1 px-4.5 py-2.5 bg-white border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400 text-slate-800 shadow-inner"
              />
              <button
                id="chat_send_btn"
                onClick={() => sendMessage()}
                disabled={loading || !messageText.trim()}
                className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
