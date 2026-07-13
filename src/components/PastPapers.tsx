import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink, 
  PlayCircle,
  Award,
  ChevronRight,
  BookmarkCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile } from '../types';

interface PastPapersProps {
  studentProfile: StudentProfile;
  onSelectPastPaperForTutor: (subject: string, topic: string, starterPrompt: string) => void;
  onAwardXp: (amount: number) => void;
}

interface PastPaper {
  id: string;
  board: 'AQA' | 'Edexcel' | 'OCR';
  subject: string;
  year: string;
  paperName: string;
  difficulty: 'Medium' | 'Hard' | 'Extreme';
  topicsCovered: string[];
  questions: {
    number: number;
    marks: number;
    questionText: string;
    modelAnswer: string;
    markSchemeCriteria: string[];
  }[];
}

const PAST_PAPERS_DB: PastPaper[] = [
  {
    id: 'math-2024-p1',
    board: 'AQA',
    subject: 'Mathematics',
    year: '2024',
    paperName: 'Paper 1: Pure Mathematics',
    difficulty: 'Hard',
    topicsCovered: ['Quadratic Equations', 'Trigonometric Identities', 'Integration by Parts', 'Vectors'],
    questions: [
      {
        number: 1,
        marks: 5,
        questionText: 'Find the set of values of k for which the quadratic equation kx^2 + 4x + (k - 3) = 0 has real roots.',
        modelAnswer: 'For real roots, the discriminant Δ = b^2 - 4ac >= 0.\nHere, a = k, b = 4, and c = (k - 3).\nΔ = 4^2 - 4(k)(k - 3) >= 0\n16 - 4k^2 + 12k >= 0\nDividing by -4 (remembering to reverse the inequality sign):\nk^2 - 3k - 4 <= 0\nFactorizing the quadratic expression:\n(k - 4)(k + 1) <= 0\nTherefore, the critical values are k = 4 and k = -1.\nThus, the solution set is -1 <= k <= 4, where k cannot be 0 (otherwise the equation is not quadratic).',
        markSchemeCriteria: [
          'Applies b^2 - 4ac >= 0 (1 mark)',
          'Substitutes a = k, b = 4, c = k - 3 correctly (1 mark)',
          'Simplifies to k^2 - 3k - 4 <= 0 (1 mark)',
          'Solves to find critical values k = 4 and k = -1 (1 mark)',
          'States correct interval -1 <= k <= 4 with restriction k != 0 (1 mark)'
        ]
      },
      {
        number: 2,
        marks: 6,
        questionText: 'Prove the trigonometric identity: cosec(2θ) + cot(2θ) ≡ cot(θ).',
        modelAnswer: 'LHS = cosec(2θ) + cot(2θ)\nUsing double angle identities:\n= 1 / sin(2θ) + cos(2θ) / sin(2θ)\n= (1 + cos(2θ)) / sin(2θ)\nRecall cos(2θ) = 2cos^2(θ) - 1, and sin(2θ) = 2sin(θ)cos(θ):\n= (1 + 2cos^2(θ) - 1) / (2sin(θ)cos(θ))\n= (2cos^2(θ)) / (2sin(θ)cos(θ))\nCanceling 2 and cos(θ) from numerator and denominator:\n= cos(θ) / sin(θ)\n= cot(θ) = RHS (Q.E.D.)',
        markSchemeCriteria: [
          'Rewrites in terms of sin(2θ) and cos(2θ) (1 mark)',
          'Combines into single fraction (1 + cos(2θ)) / sin(2θ) (1 mark)',
          'Applies double angle identity cos(2θ) = 2cos^2(θ) - 1 (1 mark)',
          'Applies double angle identity sin(2θ) = 2sin(θ)cos(θ) (1 mark)',
          'Simplifies fraction by canceling terms (1 mark)',
          'Completes rigorous proof to conclude cot(θ) (1 mark)'
        ]
      }
    ]
  },
  {
    id: 'physics-2023-p2',
    board: 'Edexcel',
    subject: 'Physics',
    year: '2023',
    paperName: 'Paper 2: Advanced Physics II',
    difficulty: 'Extreme',
    topicsCovered: ['Newtonian Mechanics', 'Nuclear Decay', 'Quantum Effects', 'Electric Fields'],
    questions: [
      {
        number: 1,
        marks: 6,
        questionText: 'Explain how the photoelectric effect provides support for the particulate nature of electromagnetic radiation, contrasting it with wave theory predictions.',
        modelAnswer: 'According to classical wave theory, continuous wave energy would accumulate over time, meaning emission should occur at any frequency given sufficient intensity, and there should be a time delay for low intensities. However, observations show:\n1. Emission is instantaneous above a threshold frequency (f0), which wave theory cannot explain.\n2. Maximum kinetic energy of photoelectrons depends strictly on frequency, not wave intensity.\n3. Intensity only affects the rate of photoelectron emission, not individual energies.\nEinstein modeled light as packets of energy called photons (E = hf). A single photon transfers all its energy to a single electron; if hf > work function (Φ), emission occurs immediately, supporting the photon model.',
        markSchemeCriteria: [
          'Identifies threshold frequency concept missing in wave theory (1 mark)',
          'Explains instantaneous emission as evidence of one-to-one interaction (1 mark)',
          'States work function relationship (hf = Φ + KE_max) (1 mark)',
          'Explains that intensity increases rate of emission, not electron energy (1 mark)',
          'Contrasts wave energy accumulation with localized packet transfer (1 mark)',
          'Concludes that electromagnetic energy is quantized (1 mark)'
        ]
      }
    ]
  },
  {
    id: 'chem-2024-p1',
    board: 'OCR',
    subject: 'Chemistry',
    year: '2024',
    paperName: 'Paper 1: Periodic Table & Physical Chemistry',
    difficulty: 'Medium',
    topicsCovered: ['Thermodynamics', 'Enthalpy Cycle', 'Rate Equations', 'Buffers'],
    questions: [
      {
        number: 1,
        marks: 4,
        questionText: 'Define the term "standard enthalpy of formation" and write the equation for the formation of liquid ethanol (C2H5OH).',
        modelAnswer: 'The standard enthalpy of formation is the enthalpy change when 1 mole of a compound is formed from its constituent elements in their standard states under standard conditions (298 K, 100 kPa).\nEquation:\n2C(s, graphite) + 3H2(g) + 1/2 O2(g) -> C2H5OH(l)',
        markSchemeCriteria: [
          'States "1 mole of a compound" clearly (1 mark)',
          'States "from its elements in their standard states" (1 mark)',
          'Writes correct balanced chemical formulas (1 mark)',
          'Includes correct state symbols (s, g, l) for standard states (1 mark)'
        ]
      }
    ]
  },
  {
    id: 'bio-2023-p1',
    board: 'AQA',
    subject: 'Biology',
    year: '2023',
    paperName: 'Paper 1: Core Biology & Biochemistry',
    difficulty: 'Medium',
    topicsCovered: ['Photosynthesis', 'DNA Replication', 'Protein Synthesis', 'Mitosis'],
    questions: [
      {
        number: 1,
        marks: 5,
        questionText: 'Describe the light-dependent reaction of photosynthesis and explain how ATP is synthesized.',
        modelAnswer: '1. Light energy excites electrons in chlorophyll within Photosystem II, raising them to a higher energy level (photoionization).\n2. These high-energy electrons pass down an electron transfer chain (ETC) in the thylakoid membrane through redox reactions.\n3. Energy released by the ETC pumps H+ protons from stroma to the thylakoid lumen, establishing a proton concentration gradient.\n4. Protons diffuse back to the stroma through ATP Synthase (chemiosmosis), driving the photophosphorylation of ADP + Pi to produce ATP.\n5. Photolysis of water (H2O -> 2H+ + 2e- + 1/2 O2) replaces the lost electrons in PSII.',
        markSchemeCriteria: [
          'Identifies photoionization of chlorophyll by light (1 mark)',
          'Explains electron transport chain redox series (1 mark)',
          'Explains proton pumping creating electrochemical gradient (1 mark)',
          'Details ATP Synthase chemiosmotic flow (1 mark)',
          'Mentions photolysis of water replacing PSII electrons (1 mark)'
        ]
      }
    ]
  },
  {
    id: 'econ-2024-p2',
    board: 'Edexcel',
    subject: 'Economics',
    year: '2024',
    paperName: 'Paper 2: National and Global Economy',
    difficulty: 'Hard',
    topicsCovered: ['Inflation', 'Monetary Policy', 'Aggregate Demand', 'Exchange Rates'],
    questions: [
      {
        number: 1,
        marks: 8,
        questionText: 'Evaluate the likely macroeconomic effects of a central bank raising interest rates to combat high inflation.',
        modelAnswer: 'An increase in interest rates (contractionary monetary policy) raises the cost of borrowing and increases the return on saving for households and firms. \n1. **Consumption (C)** drops as mortgage costs increase and discretionary spending falls.\n2. **Investment (I)** falls since the cost of capital is higher and business confidence drops.\n3. **Aggregate Demand (AD)** shifts leftwards, which lowers demand-pull inflation and reduces real GDP growth (potentially triggering a slowdown).\n4. **Exchange Rate**: Higher rates attract foreign hot money flows, strengthening the currency. This makes exports pricier and imports cheaper, lowering cost-push inflation but worsening the trade balance.\nEvaluation: The severity depends on consumer confidence, debt leverage, and the lag time of policy transmission (typically 18-24 months).',
        markSchemeCriteria: [
          'Defines monetary transmission mechanism clearly (1 mark)',
          'Explains reduction in Consumption (C) and Investment (I) (2 marks)',
          'Illustrates leftward shift in AD and inflation impact (2 marks)',
          'Analyzes exchange rate appreciation and import/export prices (2 marks)',
          'Evaluates limitations, time lags, or policy conflicts (1 mark)'
        ]
      }
    ]
  }
];

export default function PastPapers({ studentProfile, onSelectPastPaperForTutor, onAwardXp }: PastPapersProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [activePaper, setActivePaper] = useState<PastPaper | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'markScheme' | 'test'>('details');
  const [userAnswers, setUserAnswers] = useState<{ [qNum: number]: string }>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [submittingTest, setSubmittingTest] = useState<boolean>(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  // Filter papers
  const filteredPapers = selectedSubject === 'All' 
    ? PAST_PAPERS_DB 
    : PAST_PAPERS_DB.filter(p => p.subject.toLowerCase() === selectedSubject.toLowerCase());

  const subjectsList = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics'];

  const triggerDownload = (paper: PastPaper) => {
    setDownloadSuccessMsg(`Downloaded simulated PDF: ${paper.board}_A_LEVEL_${paper.subject}_${paper.year}_${paper.id}.pdf!`);
    onAwardXp(15);
    setTimeout(() => {
      setDownloadSuccessMsg(null);
    }, 4000);
  };

  const handleTutorBridge = (paper: PastPaper, qNum?: number) => {
    const qText = qNum 
      ? paper.questions.find(q => q.number === qNum)?.questionText 
      : `all topics including: ${paper.topicsCovered.join(', ')}`;
    
    const prompt = `Hey AI Tutor! I am practicing the **${paper.board} A-Level ${paper.subject} (${paper.year})** past paper. I need detailed interactive guidance to solve this specific question:\n\n"${qText}"\n\nPlease break down the solution step-by-step with your cute mascot style, give me a warm hint, and check my understanding!`;
    
    onSelectPastPaperForTutor(paper.subject, paper.topicsCovered[0] || 'General Revision', prompt);
  };

  const handleTestSubmit = () => {
    setSubmittingTest(true);
    setTimeout(() => {
      // Award XP for trying past paper questions
      onAwardXp(50);
      setQuizScore(Object.keys(userAnswers).length);
      setSubmittingTest(false);
    }, 1200);
  };

  return (
    <div className="space-y-8" id="past_papers_panel">
      
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white rounded-[28px] p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-60 h-60 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] uppercase font-black tracking-widest bg-white/20 px-3.5 py-1 rounded-full text-white inline-block">
            📚 A-Level Exam Resources
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Past Papers & Board Schemes 🎓</h1>
          <p className="text-purple-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Gain full command of real AQA, Edexcel, and OCR curriculum questions. Download worksheets, test your active recall with mark schemes, or instantly launch a question with your friendly Mascot Companion!
          </p>
        </div>
      </header>

      {downloadSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs animate-bounce" id="download_alert">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <strong>Success!</strong> {downloadSuccessMsg} <span className="font-bold text-purple-600">+15 XP earned</span>
          </div>
        </div>
      )}

      {/* Subject Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" id="past_papers_filters">
        {subjectsList.map((sub) => (
          <button
            key={sub}
            onClick={() => { setSelectedSubject(sub); setActivePaper(null); }}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all shrink-0 cursor-pointer border ${
              selectedSubject === sub 
                ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-200' 
                : 'bg-white border-purple-100/30 text-slate-600 hover:bg-purple-50/50'
            }`}
          >
            {sub === 'All' ? '🌟 All Subjects' : sub}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="past_papers_workspace">
        
        {/* Past Papers List Column */}
        <div className="lg:col-span-1 space-y-4" id="papers_list_col">
          <div className="bg-white rounded-[24px] border border-purple-100/50 p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-purple-50/50 pb-3">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Available Past Papers ({filteredPapers.length})</span>
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredPapers.map((paper) => (
                <div 
                  key={paper.id}
                  onClick={() => { setActivePaper(paper); setViewMode('details'); setUserAnswers({}); setQuizScore(null); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activePaper?.id === paper.id
                      ? 'bg-purple-50/60 border-purple-500 shadow-sm'
                      : 'bg-slate-50/50 border-slate-100 hover:bg-purple-50/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      {paper.board} • A-Level
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      paper.difficulty === 'Extreme' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {paper.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-800 mt-2">{paper.paperName}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Year: {paper.year} • {paper.questions.length} Core Questions</p>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {paper.topicsCovered.slice(0, 2).map((t, i) => (
                      <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Paper Details Workspace */}
        <div className="lg:col-span-2" id="paper_active_details_workspace">
          {activePaper ? (
            <div className="bg-white rounded-[24px] border border-purple-100/50 p-6 shadow-sm space-y-6">
              
              {/* Paper Metadata Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-50/60 pb-5" id="active_paper_header">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-600 uppercase tracking-widest">{activePaper.board} Syllabus</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-xs text-slate-400 font-semibold">{activePaper.year} Session</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">{activePaper.paperName}</h2>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => triggerDownload(activePaper)}
                    className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Download Exam Worksheet"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Get PDF</span>
                  </button>
                  <button
                    onClick={() => handleTutorBridge(activePaper)}
                    className="p-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-100"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mascot Study Helper</span>
                  </button>
                </div>
              </div>

              {/* Mode Switch Tab Bar */}
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100/50" id="paper_workspace_modes">
                <button
                  onClick={() => setViewMode('details')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    viewMode === 'details' 
                      ? 'bg-white text-purple-700 shadow-sm font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📄 Interactive Questions
                </button>
                <button
                  onClick={() => setViewMode('markScheme')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    viewMode === 'markScheme' 
                      ? 'bg-white text-purple-700 shadow-sm font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔍 Official Mark Scheme
                </button>
                <button
                  onClick={() => setViewMode('test')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    viewMode === 'test' 
                      ? 'bg-white text-purple-700 shadow-sm font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ✍️ Quick Solve & Submit
                </button>
              </div>

              {/* Display Content depending on mode */}
              <AnimatePresence mode="wait">
                {viewMode === 'details' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                    key="details-view"
                  >
                    {activePaper.questions.map((q) => (
                      <div key={q.number} className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-purple-700">Question {q.number}</span>
                          <span className="text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">{q.marks} Marks</span>
                        </div>
                        <p className="text-sm text-slate-800 font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-purple-50/40 shadow-inner font-mono">
                          {q.questionText}
                        </p>
                        
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            onClick={() => handleTutorBridge(activePaper, q.number)}
                            className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Explain Step-by-Step</span>
                          </button>
                          <button
                            onClick={() => setViewMode('markScheme')}
                            className="px-3.5 py-1.5 border border-purple-100 hover:bg-purple-50/50 text-slate-600 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>See Mark Criteria</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {viewMode === 'markScheme' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                    key="mark-scheme-view"
                  >
                    <div className="p-4 bg-purple-50 text-purple-950 border border-purple-150 rounded-2xl text-xs space-y-1">
                      <p className="font-extrabold flex items-center gap-1.5">
                        <BookmarkCheck className="w-4 h-4 text-purple-600" />
                        <span>Syllabus Examiner Mark Scheme & Guidance</span>
                      </p>
                      <p className="text-[11px] text-purple-900/80 leading-relaxed">
                        Refer to these official board constraints to secure maximum credits in hand-written worksheets.
                      </p>
                    </div>

                    {activePaper.questions.map((q) => (
                      <div key={q.number} className="p-5 border border-purple-100/40 rounded-2xl bg-white space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold border-b border-purple-50 pb-2">
                          <span className="text-purple-600">Question {q.number} Mark Scheme (Total {q.marks}m)</span>
                        </div>
                        
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Model Standard Answer:</span>
                          <p className="text-xs text-slate-800 bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl leading-relaxed font-mono whitespace-pre-wrap">
                            {q.modelAnswer}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Grading Criteria Breakdown:</span>
                          <ul className="space-y-1">
                            {q.markSchemeCriteria.map((crit, idx) => (
                              <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                                <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                                <span>{crit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {viewMode === 'test' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                    key="test-view"
                  >
                    <div className="p-4 bg-fuchsia-50 text-fuchsia-950 border border-fuchsia-150 rounded-2xl text-xs space-y-1">
                      <p className="font-extrabold flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-fuchsia-600" />
                        <span>Practice Zone: Solve questions to earn streak multipliers!</span>
                      </p>
                      <p className="text-[11px] text-fuchsia-900/80 leading-relaxed">
                        Type in your draft solutions. When submitted, you earn <strong>+50 XP</strong> and your AI Mascot will store this in your active revision queue!
                      </p>
                    </div>

                    {quizScore !== null ? (
                      <div className="text-center py-10 space-y-4 border border-purple-100 rounded-3xl bg-purple-50/20 max-w-md mx-auto">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h3 className="text-lg font-extrabold text-slate-900">Practice Logged! 🎉</h3>
                        <p className="text-xs text-slate-500 px-6 leading-relaxed">
                          You submitted solutions for {quizScore} questions. Your active streak is protected and you earned <strong>+50 XP</strong>!
                        </p>
                        <div className="flex gap-2 justify-center pt-2">
                          <button
                            onClick={() => { setQuizScore(null); setUserAnswers({}); }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Solve Again
                          </button>
                          <button
                            onClick={() => handleTutorBridge(activePaper)}
                            className="px-4 py-2 border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Discuss solutions with AI
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {activePaper.questions.map((q) => (
                          <div key={q.number} className="p-5 border border-purple-50 rounded-2xl space-y-3 bg-slate-50/30">
                            <span className="text-xs font-bold text-slate-500">Question {q.number} ({q.marks} Marks)</span>
                            <p className="text-xs text-slate-800 font-mono bg-white p-3 rounded-lg border border-slate-100">
                              {q.questionText}
                            </p>
                            <textarea
                              rows={3}
                              className="w-full p-3 bg-white border border-purple-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400"
                              placeholder="Type your workings or answer draft here..."
                              value={userAnswers[q.number] || ''}
                              onChange={(e) => setUserAnswers({ ...userAnswers, [q.number]: e.target.value })}
                            />
                          </div>
                        ))}

                        <button
                          onClick={handleTestSubmit}
                          disabled={submittingTest || Object.keys(userAnswers).length === 0}
                          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {submittingTest ? (
                            <>
                              <PlayCircle className="w-4 h-4 animate-spin" />
                              <span>Submitting and verifying answers...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Submit Solutions (+50 XP)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-dashed border-purple-200/60 p-12 text-center space-y-4 shadow-inner" id="paper_placeholder">
              <BookOpen className="w-12 h-12 text-purple-300 mx-auto" />
              <h3 className="font-extrabold text-slate-800 text-sm">No Past Paper Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Click on any of the past exam board papers in the sidebar to review the full worksheet, look up examiner mark criteria, or draft quick solutions.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
