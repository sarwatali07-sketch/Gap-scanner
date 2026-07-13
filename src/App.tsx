import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { 
  getProfile, 
  saveProfile, 
  getExamUploads, 
  saveExamUpload, 
  getTopicMasteries, 
  saveTopicMasteries, 
  getStudyTasks, 
  saveStudyTasks, 
  updateStudyTaskStatus, 
  getFlashcards, 
  saveFlashcard,
  getParentTeacherReports,
  submitParentTeacherReport
} from './lib/dbService';
import { StudentProfile, ExamUpload, TopicMastery, StudyTask, Flashcard, ParentTeacherReport } from './types';

// Importing subcomponents
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ExamUploadComponent from './components/ExamUpload';
import AITutor from './components/AITutor';
import Analytics from './components/Analytics';
import StudyTimer from './components/StudyTimer';
import ParentTeacher from './components/ParentTeacher';
import AdminPanel from './components/AdminPanel';
import PastPapers from './components/PastPapers';

import { 
  GraduationCap, 
  LayoutDashboard, 
  UploadCloud, 
  Bot, 
  Activity, 
  Timer, 
  Users, 
  Database, 
  LogOut, 
  Flame, 
  Award, 
  BookOpen, 
  Layers,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  Loader2,
  Sparkles
} from 'lucide-react';

const PRESET_STUDY_PLANS = [
  {
    id: 'plan_cram',
    title: '🔥 The 30-Day A-Level Crammer',
    tag: 'High Intensity',
    description: 'A focused, hyper-active revision schedule designed to quickly reinforce core formulas, revise critical past papers, and earn max marks under pressure.',
    dailyCommitment: '60 mins/day',
    tasksCount: 6,
    badgeAward: 'Exam Champion 🏆',
    color: 'from-purple-500 to-pink-500',
    tasks: [
      { subject: 'Mathematics', topic: 'Quadratic Equations', durationMinutes: 60, aiReason: 'Target critical A-Level discriminant values and inequality rules.' },
      { subject: 'Physics', topic: 'Quantum Effects', durationMinutes: 60, aiReason: 'Analyze photoelectric threshold frequencies and photoelectric wave limitations.' },
      { subject: 'Chemistry', topic: 'Thermodynamics', durationMinutes: 60, aiReason: 'Solve standard enthalpy cycles and chemical formation equations.' },
      { subject: 'Biology', topic: 'Photosynthesis', durationMinutes: 45, aiReason: 'Master the light-dependent chemiosmotic flow and ATP synthesis.' },
      { subject: 'Economics', topic: 'Inflation', durationMinutes: 60, aiReason: 'Critique contractionary monetary policies and exchange rate lags.' },
      { subject: 'Mathematics', topic: 'Trigonometric Identities', durationMinutes: 45, aiReason: 'Formulate double-angle proofs and trigonometric conversions.' }
    ]
  },
  {
    id: 'plan_mastery',
    title: '🧠 Concept Mastery Blueprint',
    tag: 'Spaced Retrieval',
    description: 'An academic deep-dive emphasizing conceptual understanding, mental model breakdowns, and elimination of careless mistakes or misread prompts.',
    dailyCommitment: '40 mins/day',
    tasksCount: 4,
    badgeAward: 'Mind Palace 🏰',
    color: 'from-violet-600 to-fuchsia-600',
    tasks: [
      { subject: 'Physics', topic: 'Newtonian Mechanics', durationMinutes: 45, aiReason: 'Understand core motion formulas and vector components.' },
      { subject: 'Chemistry', topic: 'Buffers', durationMinutes: 40, aiReason: 'Analyze buffer capacity and weak acid dissociation.' },
      { subject: 'Mathematics', topic: 'Vectors', durationMinutes: 40, aiReason: 'Solve vector intersections and direction cosines.' },
      { subject: 'Biology', topic: 'DNA Replication', durationMinutes: 45, aiReason: 'Deep dive into helicase, polymerase, and Okazaki fragments.' }
    ]
  },
  {
    id: 'plan_steady',
    title: '⏰ Weekly Consistent Grind',
    tag: 'Balanced Routine',
    description: 'A gentle, steady pace designed to fit around homework and extracurricular routines. Keeps learning streaks perfectly intact.',
    dailyCommitment: '30 mins/day',
    tasksCount: 3,
    badgeAward: 'Streak Master ⚡',
    color: 'from-fuchsia-500 to-purple-600',
    tasks: [
      { subject: 'Mathematics', topic: 'Trigonometric Identities', durationMinutes: 30, aiReason: 'Weekly interactive revision of fundamental identities.' },
      { subject: 'Biology', topic: 'Protein Synthesis', durationMinutes: 30, aiReason: 'Understand transcription and translation steps.' },
      { subject: 'Economics', topic: 'Aggregate Demand', durationMinutes: 30, aiReason: 'Revise AD/AS curves and fiscal policy triggers.' }
    ]
  }
];

export default function App() {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // App core database state
  const [uploads, setUploads] = useState<ExamUpload[]>([]);
  const [masteries, setMasteries] = useState<TopicMastery[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reports, setReports] = useState<ParentTeacherReport[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Past paper preseeded state
  const [tutorPreseededPrompt, setTutorPreseededPrompt] = useState<string | undefined>(undefined);
  const [tutorPreseededSubject, setTutorPreseededSubject] = useState<string | undefined>(undefined);
  const [tutorPreseededTopic, setTutorPreseededTopic] = useState<string | undefined>(undefined);

  // Spaced Repetition flashcards active review states
  const [reviewMode, setReviewMode] = useState(false);
  const [plannerSubTab, setPlannerSubTab] = useState<'flashcards' | 'blueprints'>('flashcards');
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [studyPlanSuccessMessage, setStudyPlanSuccessMessage] = useState<string | null>(null);

  // Listen to Auth states
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser({ uid: authUser.uid, email: authUser.email || '' });
        await loadUserData(authUser.uid, authUser.email || '');
      } else {
        // Fallback: Check if we have an active Local Sandbox user session
        const sandboxSession = localStorage.getItem('exam_gap_finder_sandbox_user');
        if (sandboxSession) {
          try {
            const sandboxUser = JSON.parse(sandboxSession);
            setUser({ uid: sandboxUser.uid, email: sandboxUser.email || '' });
            await loadUserData(sandboxUser.uid, sandboxUser.email || '');
          } catch (e) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });
    return () => unsub();
  }, []);

  const loadUserData = async (uid: string, email: string) => {
    setLoading(true);
    try {
      const activeProfile = await getProfile(uid);
      if (activeProfile) {
        setProfile(activeProfile);

        // Fetch remaining student collections
        const fetchedUploads = await getExamUploads(uid);
        const fetchedMasteries = await getTopicMasteries(uid);
        const fetchedTasks = await getStudyTasks(uid);
        const fetchedCards = await getFlashcards(uid);
        const fetchedReports = await getParentTeacherReports(uid);

        setUploads(fetchedUploads);
        setTasks(fetchedTasks);
        setFlashcards(fetchedCards);
        setReports(fetchedReports);

        // Algorithmic Intelligent Spaced Repetition Mastery Decay Simulation
        // For each topic, if lastRevisedAt is > 3 days ago, slowly decay mastery by 2% per day!
        const modifiedMasteries = fetchedMasteries.map((m) => {
          const lastRevDate = new Date(m.lastRevisedAt);
          const daysSinceRevision = Math.floor((Date.now() - lastRevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceRevision > 3) {
            const decayAmount = Math.min(30, (daysSinceRevision - 3) * 1.5); // cap decay at 30%
            const decayedScore = Math.max(10, Math.round(m.masteryScore - decayAmount));
            return {
              ...m,
              masteryScore: decayedScore
            };
          }
          return m;
        });

        setMasteries(modifiedMasteries);
        if (modifiedMasteries.length > 0) {
          await saveTopicMasteries(modifiedMasteries);
        }

      }
    } catch (err) {
      console.error('Error loading full student profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (uid: string, email: string, role: 'student' | 'parent' | 'teacher', name: string) => {
    setUser({ uid, email });
    await loadUserData(uid, email);
  };

  const handleOnboardingComplete = async (newProfile: StudentProfile) => {
    setProfile(newProfile);
    await saveProfile(newProfile);
    
    // Auto-seed baseline subjects masteries based on selected subjects
    const subjectsLocal = localStorage.getItem(`exam_gap_finder_subjects_${newProfile.uid}`);
    const selectedSubjects: string[] = subjectsLocal ? JSON.parse(subjectsLocal) : ['Mathematics', 'Physics'];
    
    const initialMasteries: TopicMastery[] = [];
    selectedSubjects.forEach((sub, subIdx) => {
      const sampleTopics = sub === 'Mathematics' 
        ? ['Quadratic Equations', 'Trigonometric Identities'] 
        : ['Newtonian Mechanics', 'Stoichiometry', 'Photosynthesis'];
      
      sampleTopics.forEach((top, topIdx) => {
        initialMasteries.push({
          id: `mastery_${newProfile.uid}_${subIdx}_${topIdx}`,
          studentId: newProfile.uid,
          subject: sub,
          topic: top,
          masteryScore: 60, // base starter mastery
          confidenceLevel: 3,
          lastRevisedAt: new Date().toISOString(),
          reviewCount: 1
        });
      });
    });

    setMasteries(initialMasteries);
    await saveTopicMasteries(initialMasteries);

    // Auto trigger initial revision plan generation
    await generateAIPlan(newProfile, initialMasteries);
  };

  const generateAIPlan = async (activeProfile?: StudentProfile, activeMasteries?: TopicMastery[]) => {
    const prof = activeProfile || profile;
    const mast = activeMasteries || masteries;
    if (!prof) return;

    setGeneratingPlan(true);
    try {
      // Find weak topics to feed the AI revision calendar
      const weakTopics = mast
        .filter(m => m.masteryScore < 60)
        .map(m => ({ topic: m.topic, subject: m.subject, score: m.masteryScore }));

      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfile: prof,
          weakTopics,
          upcomingExams: prof.upcomingExams
        })
      });

      const data = await res.json();
      if (res.ok && data.tasks && data.tasks.length > 0) {
        // Map tasks with correct studentId
        const mappedTasks = data.tasks.map((t: any) => ({
          ...t,
          studentId: prof.uid
        }));
        setTasks(mappedTasks);
        await saveStudyTasks(mappedTasks);
      }
    } catch (e) {
      console.warn('Error generating plan, using fallback scheduler', e);
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Upload results completion handler
  const handleAnalysisComplete = async (upload: ExamUpload) => {
    // Add to uploads list
    const updatedUploads = [upload, ...uploads];
    setUploads(updatedUploads);
    await saveExamUpload(upload);

    // Award XP
    await handleAwardXp(120); // 120 XP for uploading and analyzing exams
    await handleEarnBadge('Paper Breaker');

    // Dynamically update topic masteries based on the analysis output
    const updatedMasteries = [...masteries];
    upload.analysis.gaps.forEach((gap) => {
      const idx = updatedMasteries.findIndex(m => m.topic.toLowerCase() === gap.topic.toLowerCase());
      
      // Calculate mastery impact
      let penalty = gap.category === 'understanding' ? 12 : gap.category === 'careless' ? 4 : 8;
      
      if (idx !== -1) {
        // Update existing
        const currentScore = updatedMasteries[idx].masteryScore;
        updatedMasteries[idx] = {
          ...updatedMasteries[idx],
          masteryScore: Math.max(10, Math.round(currentScore - penalty)),
          confidenceLevel: Math.max(1, updatedMasteries[idx].confidenceLevel - 1),
          lastRevisedAt: new Date().toISOString(),
          reviewCount: updatedMasteries[idx].reviewCount + 1
        };
      } else {
        // Create new dynamic mastery pillar on the fly
        updatedMasteries.push({
          id: `mastery_${profile?.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          studentId: profile?.uid || '',
          subject: upload.subject,
          topic: gap.topic,
          subtopic: gap.subtopic,
          masteryScore: Math.max(10, 60 - penalty),
          confidenceLevel: 2,
          lastRevisedAt: new Date().toISOString(),
          reviewCount: 1
        });
      }
    });

    setMasteries(updatedMasteries);
    await saveTopicMasteries(updatedMasteries);

    // Prompt user to view analytics or tutor room
    setActiveTab('analytics');
  };

  // Toggle tasks check circles
  const handleToggleTask = async (taskId: string, status: 'pending' | 'completed') => {
    if (!profile) return;
    await updateStudyTaskStatus(taskId, profile.uid, status);
    
    // Local state sync
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    if (status === 'completed') {
      const t = tasks.find(x => x.id === taskId);
      const xpReward = t ? t.xpReward : 30;
      await handleAwardXp(xpReward);

      // Check for streak multipliers
      const today = new Date().toISOString().split('T')[0];
      if (profile.lastActiveDate !== today) {
        const updatedProfile = {
          ...profile,
          streak: profile.streak + 1,
          lastActiveDate: today,
          xp: profile.xp + xpReward
        };
        setProfile(updatedProfile);
        await saveProfile(updatedProfile);
      }
    }
  };

  // Tutor session completions
  const handleStudySessionComplete = async (subject: string, topic: string, durationMinutes: number, xpReward: number) => {
    await handleAwardXp(xpReward);
    
    // Update mastery score positively for revising
    const idx = masteries.findIndex(m => m.topic.toLowerCase() === topic.toLowerCase());
    if (idx !== -1) {
      const updated = [...masteries];
      updated[idx] = {
        ...updated[idx],
        masteryScore: Math.min(100, updated[idx].masteryScore + 5), // +5% mastery for active study
        confidenceLevel: Math.min(5, updated[idx].confidenceLevel + 1),
        lastRevisedAt: new Date().toISOString()
      };
      setMasteries(updated);
      await saveTopicMasteries(updated);
    }
  };

  // Gamification helpers
  const handleAwardXp = async (amount: number) => {
    if (!profile) return;
    const updated = {
      ...profile,
      xp: profile.xp + amount
    };
    setProfile(updated);
    await saveProfile(updated);
  };

  const handleEarnBadge = async (badgeName: string) => {
    if (!profile || profile.badges.includes(badgeName)) return;
    const updated = {
      ...profile,
      badges: [...profile.badges, badgeName]
    };
    setProfile(updated);
    await saveProfile(updated);
  };

  // Add a newly generated flashcard from the tutor room
  const handleAddFlashcard = async (card: Flashcard) => {
    const updated = [card, ...flashcards];
    setFlashcards(updated);
    await saveFlashcard(card);
  };

  // Activate preset study plan
  const handleActivatePresetPlan = async (planId: string) => {
    if (!profile) return;
    const plan = PRESET_STUDY_PLANS.find(p => p.id === planId);
    if (!plan) return;

    // Map preset tasks
    const generatedTasks: StudyTask[] = plan.tasks.map((t, index) => {
      const taskDate = new Date();
      taskDate.setDate(taskDate.getDate() + index); // space tasks out
      return {
        id: `study_task_${profile.uid}_${Date.now()}_${index}`,
        studentId: profile.uid,
        date: taskDate.toISOString().split('T')[0],
        subject: t.subject,
        topic: t.topic,
        durationMinutes: t.durationMinutes,
        status: 'pending' as const,
        xpReward: 40,
        aiReason: t.aiReason
      };
    });

    // Save and load
    const updatedTasks = [...generatedTasks, ...tasks];
    setTasks(updatedTasks);
    await saveStudyTasks(generatedTasks);

    // Reward XP and Badge
    await handleAwardXp(100);
    await handleEarnBadge(plan.badgeAward);

    setStudyPlanSuccessMessage(`Activated "${plan.title}"! ${plan.tasksCount} structured study tasks have been created in your dashboard. Enjoy your +100 XP planning bonus!`);
    
    // Auto clear after 6 seconds
    setTimeout(() => {
      setStudyPlanSuccessMessage(null);
    }, 6000);
  };

  // Leitner flashcard review logic
  const handleCardReview = async (remembered: boolean) => {
    if (flashcards.length === 0) return;
    const card = flashcards[currentCardIdx];
    
    // Leitner formula: if remembered, promote box (max 5). If forgotten, demote back to box 1!
    const nextBox = remembered ? Math.min(5, card.box + 1) : 1;
    
    // Calculate review countdown (box 1: 1 day, box 2: 3 days, box 3: 7 days, etc.)
    const daysInterval = nextBox === 1 ? 1 : nextBox === 2 ? 3 : nextBox === 3 ? 7 : nextBox === 4 ? 14 : 30;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysInterval);

    const updatedCard: Flashcard = {
      ...card,
      box: nextBox,
      nextReviewDate: nextDate.toISOString().split('T')[0]
    };

    const updatedCards = flashcards.map(c => c.id === card.id ? updatedCard : c);
    setFlashcards(updatedCards);
    await saveFlashcard(updatedCard);

    // Award micro XP
    await handleAwardXp(5);

    // Next card or exit
    setShowFlashcardAnswer(false);
    if (currentCardIdx < flashcards.length - 1) {
      setCurrentCardIdx(currentCardIdx + 1);
    } else {
      setReviewMode(false);
      setCurrentCardIdx(0);
      alert('Review deck session complete! You earned XP bonus multipliers.');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('exam_gap_finder_sandbox_user');
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
        <h3 className="font-extrabold text-slate-800 text-lg">Exam Gap Finder</h3>
        <p className="text-xs text-slate-400 mt-1">Booting secure personal AI tutor databases...</p>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Signed in but onboarding not finished
  if (user && !profile) {
    return (
      <Onboarding 
        userEmail={user.email} 
        userUid={user.uid} 
        userName={user.email.split('@')[0]} 
        userRole="student" 
        onOnboardingComplete={handleOnboardingComplete} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col lg:flex-row font-sans" id="app_frame">
      
      {/* Visual Navigation Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0 flex flex-col z-20" id="navigation_sidebar">
        
        {/* Brand Header */}
        <div className="p-6 pb-2 flex justify-between items-center" id="brand_header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-fuchsia-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md shadow-purple-600/20">
              <Sparkles className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent leading-none">Gap Scanner</h1>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mt-1">A-Level AI Companion 🌟</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-6 space-y-1 overflow-y-auto" id="sidebar_nav">
          <button
            id="nav_dashboard"
            onClick={() => { setActiveTab('dashboard'); setReviewMode(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'dashboard' && !reviewMode 
                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-500 pl-2' 
                : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 opacity-80" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav_upload"
            onClick={() => { setActiveTab('upload'); setReviewMode(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'upload' && !reviewMode
                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-500 pl-2' 
                : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <UploadCloud className="w-4 h-4 shrink-0 opacity-80" />
            <span>Upload Tests</span>
          </button>

          <button
            id="nav_tutor"
            onClick={() => { setActiveTab('tutor'); setReviewMode(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'tutor' && !reviewMode
                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-500 pl-2' 
                : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <Bot className="w-4 h-4 shrink-0 opacity-80" />
            <span>AI Tutor Room</span>
          </button>

          <button
            id="nav_past_papers"
            onClick={() => { setActiveTab('past_papers'); setReviewMode(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'past_papers' && !reviewMode
                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-500 pl-2' 
                : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0 opacity-80 text-purple-500" />
            <span className="flex-1 text-left">A-Level Past Papers</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-800">2024</span>
          </button>

          <button
            id="nav_flashcards"
            onClick={() => { setReviewMode(true); setActiveTab('flashcards'); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              reviewMode
                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-500 pl-2' 
                : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0 opacity-80" />
            <span className="flex-1 text-left">Study Planner</span>
            {flashcards.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                reviewMode ? 'bg-purple-200 text-purple-800' : 'bg-slate-100 text-slate-600'
              }`}>{flashcards.length}</span>
            )}
          </button>

          <button
            id="nav_analytics"
            onClick={() => { setActiveTab('analytics'); setReviewMode(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'analytics' && !reviewMode
                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-500 pl-2' 
                : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0 opacity-80" />
            <span>Mastery Analytics</span>
          </button>

          <button
            id="nav_timer"
            onClick={() => { setActiveTab('timer'); setReviewMode(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'timer' && !reviewMode
                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-500 pl-2' 
                : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <Timer className="w-4 h-4 shrink-0 opacity-80" />
            <span>Focus Timer</span>
          </button>

          <button
            id="nav_parent"
            onClick={() => { setActiveTab('parent'); setReviewMode(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'parent' && !reviewMode
                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-500 pl-2' 
                : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 opacity-80" />
            <span>Parent Dashboard</span>
          </button>

          <button
            id="nav_admin"
            onClick={() => { setActiveTab('admin'); setReviewMode(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'admin' && !reviewMode
                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-500 pl-2' 
                : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <Database className="w-4 h-4 shrink-0 opacity-80" />
            <span>Curriculum Admin</span>
          </button>
        </nav>

        {/* Sidebar Footer with Student profile badge & logout */}
        <div className="p-4 border-t border-purple-50 shrink-0 space-y-3" id="sidebar_footer">
          <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 flex items-center gap-3" id="user_profile_badge">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm shrink-0 border border-purple-200">
              {profile?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate leading-none">{profile?.name}</span>
              <span className="text-[10px] text-purple-500 truncate mt-1.5">{profile?.curriculum} • Student</span>
            </div>
          </div>

          <button
            id="sidebar_logout_btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-slate-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out Profile</span>
          </button>
        </div>
      </aside>

      {/* Main viewport area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto" id="app_viewport">
        
        {/* Flashcards Deck Review Mode View */}
        {reviewMode ? (
          <div className="max-w-3xl mx-auto space-y-6" id="flashcards_deck_view">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 p-6 rounded-3xl border border-purple-100/50" id="hub_header">
              <div>
                <h2 className="text-2xl font-black text-purple-950 flex items-center gap-2">
                  <Sparkles className="w-6.5 h-6.5 text-purple-600 animate-pulse" />
                  Study Planner & Revision Hub
                </h2>
                <p className="text-xs text-purple-700/80 mt-1 max-w-xl">
                  Automate your exam calendar with interactive templates or review your personalized Leitner flashcard system synced from your active AI Tutor conversations!
                </p>
              </div>

              {/* Sub tabs switches */}
              <div className="flex bg-white/80 p-1.5 rounded-2xl border border-purple-100 shadow-sm shrink-0 gap-1" id="hub_sub_tabs">
                <button
                  id="tab_flashcards"
                  onClick={() => setPlannerSubTab('flashcards')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    plannerSubTab === 'flashcards' 
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/10' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🎴 Flashcards Review
                </button>
                <button
                  id="tab_blueprints"
                  onClick={() => setPlannerSubTab('blueprints')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    plannerSubTab === 'blueprints' 
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/10' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📋 Preset Study Plans
                </button>
              </div>
            </div>

            {plannerSubTab === 'blueprints' ? (
              <div className="space-y-6" id="blueprints_view">
                {studyPlanSuccessMessage && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-start gap-3 shadow-sm" id="success_study_toast">
                    <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold">Plan Successfully Loaded! 🚀</p>
                      <p className="text-xs text-emerald-700 mt-0.5">{studyPlanSuccessMessage}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4" id="preset_plans_cards_grid">
                  {PRESET_STUDY_PLANS.map((plan) => (
                    <div 
                      key={plan.id}
                      className="bg-white border border-slate-200 hover:border-purple-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 justify-between items-start"
                    >
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className={`px-2.5 py-1 bg-gradient-to-r ${plan.color} text-white font-black text-[9px] tracking-wide uppercase rounded-full`}>
                            {plan.tag}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">• Plan Reward: {plan.badgeAward}</span>
                        </div>
                        
                        <div>
                          <h3 className="font-extrabold text-slate-950 text-lg leading-tight">{plan.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.description}</p>
                        </div>

                        {/* List of study items */}
                        <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100/50 space-y-2">
                          <span className="text-[10px] text-purple-600 font-extrabold uppercase tracking-widest block">Revision Structure:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {plan.tasks.map((task, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                                <span className="w-5 h-5 bg-purple-100 text-purple-800 font-bold rounded-lg flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="truncate font-semibold">{task.subject}: <span className="text-slate-500 font-medium">{task.topic}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto self-stretch md:self-auto justify-between">
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-bold text-slate-400 block">Commitment:</span>
                          <span className="font-extrabold text-sm text-slate-800">{plan.dailyCommitment}</span>
                        </div>

                        <button
                          id={`activate_plan_btn_${plan.id}`}
                          onClick={() => handleActivatePresetPlan(plan.id)}
                          className={`w-full md:w-auto py-2.5 px-5 bg-gradient-to-r ${plan.color} hover:opacity-90 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm`}
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                          <span>Activate Plan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6" id="spaced_repetition_view">
                {flashcards.length === 0 ? (
                  <div className="bg-white border rounded-3xl p-12 text-center space-y-3" id="empty_flashcards_deck">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-800">Your flashcard deck is empty</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Ask the <strong>AI Tutor Room</strong> to "Generate Revision Flashcards" for any topic, and they will automatically synchronize into this revision deck!
                    </p>
                    <button
                      id="go_to_tutor_empty_btn"
                      onClick={() => { setActiveTab('tutor'); setReviewMode(false); }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Bot className="w-4 h-4" />
                      <span>Go to Tutor Room</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4" id="active_flashcard_card">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <span>Leitner Deck Review</span>
                      <span>Card {currentCardIdx + 1} of {flashcards.length}</span>
                    </div>

                    {/* Flip Card container */}
                    <div 
                      id="flashcard_panel_flipper"
                      onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                      className={`min-h-[220px] bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer ${
                        showFlashcardAnswer ? 'ring-2 ring-purple-500/15 border-purple-300' : ''
                      }`}
                    >
                      <div className="space-y-1 shrink-0">
                        <span className="text-[9px] bg-purple-50 border border-purple-100 text-purple-700 font-black uppercase px-2 py-0.5 rounded-lg">
                          {flashcards[currentCardIdx].subject} • Box {flashcards[currentCardIdx].box}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">Topic: {flashcards[currentCardIdx].topic}</span>
                      </div>

                      <div className="my-6 text-center text-slate-800 font-semibold text-base leading-relaxed" id="flashcard_prompt_text">
                        {showFlashcardAnswer ? (
                          <p className="text-purple-900 font-bold">{flashcards[currentCardIdx].answer}</p>
                        ) : (
                          <p className="text-slate-900">{flashcards[currentCardIdx].question}</p>
                        )}
                      </div>

                      <div className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold" id="flashcard_prompt_flipper">
                        {showFlashcardAnswer ? 'Click card to view question prompt' : 'Click card to reveal answer solution'}
                      </div>
                    </div>

                    {/* Leitner Actions */}
                    <div className="grid grid-cols-2 gap-3" id="leitner_deck_actions">
                      <button
                        id="leitner_forgot_btn"
                        onClick={() => handleCardReview(false)}
                        className="py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Forgot (Back to Box 1)</span>
                      </button>
                      <button
                        id="leitner_remembered_btn"
                        onClick={() => handleCardReview(true)}
                        className="py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Remembered (Level Up Box)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Tab view routing
          <div id="routing_tab_panels">
            {activeTab === 'dashboard' && (
              <Dashboard 
                studentProfile={profile} 
                tasks={tasks} 
                masteries={masteries} 
                uploads={uploads} 
                onToggleTask={handleToggleTask} 
                onGeneratePlan={() => generateAIPlan()} 
                generatingPlan={generatingPlan}
                onNavigateToTab={(tab) => {
                  if (tab === 'flashcards') setReviewMode(true);
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === 'upload' && (
              <ExamUploadComponent 
                studentProfile={profile} 
                onAnalysisComplete={handleAnalysisComplete} 
              />
            )}

            {activeTab === 'tutor' && (
              <AITutor 
                studentProfile={profile} 
                onAddFlashcard={handleAddFlashcard} 
                onStudySessionComplete={handleStudySessionComplete} 
                preseededPrompt={tutorPreseededPrompt}
                preseededSubject={tutorPreseededSubject}
                preseededTopic={tutorPreseededTopic}
                onClearPreseed={() => {
                  setTutorPreseededPrompt(undefined);
                  setTutorPreseededSubject(undefined);
                  setTutorPreseededTopic(undefined);
                }}
              />
            )}

            {activeTab === 'past_papers' && (
              <PastPapers 
                studentProfile={profile}
                onAwardXp={handleAwardXp}
                onSelectPastPaperForTutor={(subj, top, prompt) => {
                  setTutorPreseededSubject(subj);
                  setTutorPreseededTopic(top);
                  setTutorPreseededPrompt(prompt);
                  setActiveTab('tutor');
                  setReviewMode(false);
                }}
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics 
                studentProfile={profile} 
                uploads={uploads} 
                masteries={masteries} 
              />
            )}

            {activeTab === 'timer' && (
              <StudyTimer 
                studentProfile={profile} 
                onAwardXp={handleAwardXp} 
                onEarnBadge={handleEarnBadge} 
              />
            )}

            {activeTab === 'parent' && (
              <ParentTeacher 
                studentProfile={profile} 
                onAssignTask={async (t) => {
                  const updated = [t, ...tasks];
                  setTasks(updated);
                  await saveStudyTasks([t]);
                }} 
                onSubmitReport={async (rep) => {
                  setReports([rep, ...reports]);
                  await submitParentTeacherReport(rep);
                }} 
              />
            )}

            {activeTab === 'admin' && (
              <AdminPanel />
            )}
          </div>
        )}

      </main>

    </div>
  );
}
