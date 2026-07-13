import React, { useState } from 'react';
import { StudentProfile, StudyTask, TopicMastery, ExamUpload } from '../types';
import { 
  CheckCircle, 
  Circle, 
  Calendar, 
  Flame, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Play, 
  Award, 
  Loader2,
  RefreshCw,
  Plus,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  studentProfile: StudentProfile;
  tasks: StudyTask[];
  masteries: TopicMastery[];
  uploads: ExamUpload[];
  onToggleTask: (taskId: string, status: 'pending' | 'completed') => void;
  onGeneratePlan: () => void;
  generatingPlan: boolean;
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ 
  studentProfile, 
  tasks, 
  masteries, 
  uploads, 
  onToggleTask, 
  onGeneratePlan,
  generatingPlan,
  onNavigateToTab
}: DashboardProps) {

  // Current time representation for a visual anchor
  const now = new Date();
  const formatTimeStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  // 1. Calculate overall readiness percentage
  // Base readiness of 65%. Increase based on average test score. Decrease based on weak topics.
  const averageTestScore = uploads.length > 0
    ? uploads.reduce((acc, u) => acc + (u.score / u.maxScore) * 100, 0) / uploads.length
    : 72;

  const weakTopicsCount = masteries.filter(m => m.masteryScore < 50).length;
  
  let readiness = 65;
  if (uploads.length > 0) {
    readiness = Math.round(averageTestScore * 0.8 + studentProfile.streak * 2 - weakTopicsCount * 3);
  } else {
    readiness = Math.round(70 + studentProfile.streak * 1.5 - weakTopicsCount * 2);
  }
  readiness = Math.max(10, Math.min(98, readiness)); // clip between 10% and 98%

  // 2. Predict grade based on readiness
  const predictGrade = (score: number): string => {
    if (score >= 90) return 'A* / 9';
    if (score >= 80) return 'A / 8';
    if (score >= 70) return 'B / 7';
    if (score >= 60) return 'C / 6';
    if (score >= 50) return 'D / 5';
    return 'E / 4';
  };

  const predictedGrade = predictGrade(readiness);

  // 3. Filter today's tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(t => t.date === todayStr || t.status === 'pending');

  // 4. Strongest & Weakest Subjects / Topics
  const strongest = masteries.length > 0
    ? [...masteries].sort((a, b) => b.masteryScore - a.masteryScore)[0]
    : { topic: 'Photosynthesis', masteryScore: 85, subject: 'Biology' };

  const weakest = masteries.length > 0
    ? [...masteries].sort((a, b) => a.masteryScore - b.masteryScore)[0]
    : { topic: 'Newtonian Mechanics', masteryScore: 42, subject: 'Physics' };

  // 5. Generate AI Recommendations
  const getAIRecommendations = (): string[] => {
    const recs: string[] = [];
    if (weakTopicsCount > 0) {
      recs.push(`⚠️ Critical Revision Gap: Your mastery of **${weakest.topic}** is currently at ${weakest.masteryScore}%. We recommend running a 25-minute AI Tutor study notes block today.`);
    } else {
      recs.push(`🌟 All quiet: Your current masteries are looking strong! Keep active by challenging yourself to a high-difficulty Practice Quiz.`);
    }

    if (studentProfile.upcomingExams.length > 0) {
      const nextExam = studentProfile.upcomingExams[0];
      const daysLeft = Math.round((new Date(nextExam.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysLeft <= 30) {
        recs.push(`🚨 Exam Alert: Your **${nextExam.subject}** exam is approaching in ${daysLeft} days. We've structured active revision cards inside your spaced repetition lists.`);
      }
    }
    
    recs.push(`⏱️ Study multiplier active: Complete today's focus block to protect your **${studentProfile.streak}-day study streak** and receive +50 XP.`);
    return recs;
  };

  const recommendations = getAIRecommendations();

  return (
    <div className="space-y-8" id="dashboard_panel">
      
      {/* Home Dashboard Welcome Header */}
      <header className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-[28px] p-6 sm:p-8 shadow-md relative overflow-hidden" id="welcome_banner_card">
        {/* Playful background decorative bubble */}
        <div className="absolute right-0 bottom-0 w-44 h-44 bg-white/10 rounded-full blur-2xl translate-x-12 translate-y-12 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full text-white inline-block mb-3">
              🌸 Level {Math.floor(studentProfile.xp / 400) + 1} Academic Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome back, {studentProfile.name}! 👋</h1>
            
            {/* Newly added Student Profiling details badges */}
            <div className="flex flex-wrap gap-2 mt-3" id="profile_meta_badges">
              {studentProfile.age && (
                <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-lg text-white font-medium flex items-center gap-1">
                  🎂 {studentProfile.age} yrs old
                </span>
              )}
              {studentProfile.place && (
                <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-lg text-white font-medium flex items-center gap-1">
                  📍 {studentProfile.place}
                </span>
              )}
              {studentProfile.lifestyle && (
                <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-lg text-white font-medium flex items-center gap-1">
                  🏠 {studentProfile.lifestyle}
                </span>
              )}
              {studentProfile.studyPlanType && (
                <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-lg text-white font-semibold flex items-center gap-1 border border-white/20 bg-purple-600/30">
                  📋 Plan: {studentProfile.studyPlanType}
                </span>
              )}
            </div>

            <p className="text-purple-100 text-xs sm:text-sm mt-3 leading-relaxed max-w-xl">
              You are currently holding a fantastic <span className="font-extrabold text-white underline">{studentProfile.streak}-day study streak</span>! 
              Your personalized AI companions are waiting in the Tutor Room to help you break down mock exams, answer quick doubts, and trigger flashcards!
            </p>
          </div>
          <button 
            onClick={() => onNavigateToTab('upload')}
            className="bg-white hover:bg-purple-50 text-purple-700 font-bold px-6 py-3 rounded-2xl shadow-sm hover:shadow transition-all flex items-center gap-2 shrink-0 cursor-pointer text-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Upload Practice Test</span>
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="readiness_and_plan_grid">
        
        {/* Calculated Exam Readiness */}
        <div className="bg-white p-6 rounded-[24px] border border-purple-100/50 shadow-sm flex flex-col justify-between" id="readiness_dial_card">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Readiness Index</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-4xl font-extrabold text-purple-600 tracking-tighter">{readiness}<span className="text-xl font-medium">%</span></span>
              <span className="text-xs text-emerald-600 font-bold mb-1">+{uploads.length > 0 ? '2.4%' : '1.5%'} this week</span>
            </div>
            <div className="w-full bg-slate-100 h-2 mt-4 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full transition-all duration-1000" style={{ width: `${readiness}%` }}></div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
            Your readiness score estimates your performance under standard curriculum exam stress based on quiz results, mock scores, and active study streak multipliers!
          </p>
        </div>

        {/* Predicted Grade */}
        <div className="bg-white p-6 rounded-[24px] border border-purple-100/50 shadow-sm flex flex-col justify-between" id="predicted_grade_card">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Grade</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-4xl font-black text-slate-800 tracking-tighter">
                {predictedGrade.split(' ')[0]}
                <span className="text-xl font-medium">{predictedGrade.includes('*') ? '*' : ''}</span>
              </span>
              <span className="text-xs text-slate-500 mb-1">Based on {uploads.length} tests</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 italic">Confidence Interval: {Math.round(75 + readiness * 0.2)}%</p>
          </div>
          <p className="text-[10px] text-purple-600 mt-1 font-semibold">Target curriculum: {studentProfile.curriculum}</p>
        </div>

        {/* Weakest Subject / Domain */}
        <div className="bg-white p-6 rounded-[24px] border border-purple-100/50 shadow-sm flex flex-col justify-between" id="pillar_comparison_card">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Growth Area</span>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-xl text-purple-600 font-bold text-lg shrink-0">🔬</div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-slate-800 block truncate">{weakest.topic}</span>
                <p className="text-xs text-slate-500">Mastery: {weakest.masteryScore}%</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-[10px] text-purple-700 font-semibold leading-tight">Recommended: AI Mascot Drill</span>
            <button 
              onClick={() => onNavigateToTab('tutor')}
              className="text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-full cursor-pointer transition-colors shrink-0"
            >
              Start Drill
            </button>
          </div>
        </div>

      </div>

      {/* Knowledge Gap Analysis & Today's Plan Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full min-h-0" id="dashboard_tasks_calendar_grid">
        
        {/* Knowledge Gaps (3/5 column) */}
        <div className="lg:col-span-3 bg-white border border-purple-100/50 rounded-[24px] p-6 shadow-sm flex flex-col justify-between" id="ai_recommendations_card">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">AI Knowledge Gap Analysis</h3>
                <p className="text-xs text-slate-400 mt-0.5">Custom syllabus-tracking generated by active study companions</p>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-1 rounded-lg">Realtime Sync</span>
            </div>
            
            <div className="space-y-4">
              {/* Gap 1 (Physics/Calculation style) */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                <span className="text-xl shrink-0">🐱</span>
                <div>
                  <p className="text-sm font-bold text-purple-950">Mascot Suggestion</p>
                  <p className="text-xs text-purple-800 mt-1">
                    {recommendations[0]?.replace(/\*\*/g, '') || `Your mastery of ${weakest.topic} is currently at ${weakest.masteryScore}%. We recommend running an AI Tutor active notes block.`}
                  </p>
                </div>
              </div>

              {/* Gap 2 (Conceptual/Spaced repetition style) */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-fuchsia-50/50 border border-fuchsia-100">
                <span className="text-xl shrink-0">🦉</span>
                <div>
                  <p className="text-sm font-bold text-fuchsia-950">Active Focus Target</p>
                  <p className="text-xs text-fuchsia-800 mt-1">
                    {recommendations[1]?.replace(/\*\*/g, '') || `Spaced repetition multiplier active! Complete your study targets today to protect your streak.`}
                  </p>
                </div>
              </div>

              {/* Top subject & Recent boost cards layout */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-3 border border-purple-100/40 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Top Subject</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700 truncate">{strongest.subject}</span>
                    <span className="text-xs font-bold text-emerald-600 shrink-0">{strongest.masteryScore}% Mastery</span>
                  </div>
                </div>
                <div className="p-3 border border-purple-100/40 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Recent Boost</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700 truncate">{weakest.subject}</span>
                    <span className="text-xs font-bold text-purple-600 shrink-0">+{studentProfile.streak * 2}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            id="go_to_analytics_btn"
            onClick={() => onNavigateToTab('analytics')}
            className="w-full mt-6 py-2.5 border border-purple-100 hover:bg-purple-50 rounded-xl text-xs font-semibold text-purple-650 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>View Full Mastery Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Today's Revision Planner (2/5 column) */}
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-[24px] p-6 shadow-xl flex flex-col justify-between" id="daily_study_tasks_card">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">Today's Study Plan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Gamified learning milestone track</p>
              </div>
              <button
                id="generate_plan_btn"
                onClick={onGeneratePlan}
                disabled={generatingPlan}
                className="text-[10px] bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {generatingPlan ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>Regenerate</span>
              </button>
            </div>

            <div className="space-y-5 flex-1 max-h-[300px] overflow-y-auto pr-1">
              {todaysTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p>All targets completed!</p>
                  <button 
                    id="empty_tasks_generate_btn"
                    onClick={onGeneratePlan}
                    className="text-purple-300 hover:underline font-bold mt-2 text-xs cursor-pointer"
                  >
                    Generate Study Plan Now
                  </button>
                </div>
              ) : (
                todaysTasks.slice(0, 3).map((t) => {
                  const isCompleted = t.status === 'completed';
                  return (
                    <div 
                      key={t.id} 
                      className={`relative pl-8 border-l border-slate-700 pb-1 cursor-pointer group`}
                      onClick={() => onToggleTask(t.id, isCompleted ? 'pending' : 'completed')}
                    >
                      <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full transition-colors ${
                        isCompleted ? 'bg-emerald-500' : 'bg-purple-500 group-hover:bg-purple-400'
                      }`}></div>
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>{t.durationMinutes} mins • +{t.xpReward} XP</span>
                        {isCompleted && <span className="text-[10px] text-emerald-400 font-bold tracking-wider">✓ COMPLETED</span>}
                      </div>
                      <div className={`text-sm font-semibold mt-0.5 ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                        {t.subject} Practice
                      </div>
                      <div className="text-[11px] text-slate-400">{t.topic}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button 
            onClick={() => onNavigateToTab('timer')}
            className="mt-6 w-full bg-purple-600 py-3 rounded-xl font-bold text-sm hover:bg-purple-500 transition-colors cursor-pointer text-center block text-white shadow-md hover:shadow-lg"
          >
            Start Focus Timer
          </button>
        </div>

      </div>

      {/* Additional Stats Row: Dynamic Calendar & Peers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="upcoming_exams_list_card">
        
        {/* Upcoming Exams card with styled calendar visual blocks */}
        <div className="bg-white border border-purple-100/50 rounded-[24px] p-6 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Upcoming Exams Countdown</h4>
          
          <div className="space-y-4" id="exams_list">
            {studentProfile.upcomingExams.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-4">No scheduled exams. Set exam dates in onboarding or options!</p>
            ) : (
              studentProfile.upcomingExams.slice(0, 2).map((ex) => {
                const daysLeft = Math.round((new Date(ex.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const dObj = new Date(ex.date);
                const monthName = dObj.toLocaleDateString('en-US', { month: 'short' });
                const dayNum = dObj.getDate();
                return (
                  <div key={ex.id} className="flex gap-4 items-center">
                     <div className="flex flex-col items-center justify-center w-12 h-14 bg-purple-50 text-purple-700 rounded-xl shrink-0 border border-purple-100">
                      <span className="text-[10px] font-bold uppercase">{monthName}</span>
                      <span className="text-lg font-black leading-none mt-0.5">{dayNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{ex.subject} Revision Goal</p>
                      <p className="text-[10px] text-slate-400">Target curriculum: {studentProfile.curriculum}</p>
                      <p className="text-[10px] font-bold text-purple-600 mt-0.5">
                        {daysLeft <= 0 ? 'Completed 🎉' : `${daysLeft} days left`} • Target Grade: {ex.targetGrade}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Study Leaderboard card */}
        <div className="bg-white border border-purple-100/50 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Mascot Study Leaderboard</h4>
            
            <div className="space-y-3">
              {/* Leader #1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">1</span>
                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[9px] text-slate-600 font-bold">SJ</div>
                  <span className="text-xs font-medium text-slate-700">Sarah J.</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">1,450 XP</span>
              </div>

              {/* Leader #2 (The User) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-600">2</span>
                  <div className="w-6 h-6 bg-purple-100 border border-purple-200 rounded-full flex items-center justify-center text-[9px] text-purple-600 font-bold">
                    {studentProfile.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-purple-700">You</span>
                </div>
                <span className="text-[10px] font-bold text-purple-600">{studentProfile.xp} XP</span>
              </div>

              {/* Leader #3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">3</span>
                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[9px] text-slate-600 font-bold">KW</div>
                  <span className="text-xs font-medium text-slate-700">Kevin W.</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">820 XP</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl mt-3 text-[10px] text-purple-700 leading-relaxed border border-purple-100">
            💡 <strong>Study Tip:</strong> Complete study notes or practice quizzes with your chosen mascot to overtake Sarah J. and secure rank 1!
          </div>
        </div>

      </div>

    </div>
  );
}
