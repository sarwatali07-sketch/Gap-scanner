import React from 'react';
import { StudentProfile, ExamUpload, TopicMastery } from '../types';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Award,
  Calendar
} from 'lucide-react';

interface AnalyticsProps {
  studentProfile: StudentProfile;
  uploads: ExamUpload[];
  masteries: TopicMastery[];
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4', '#f43f5e', '#64748b'];

export default function Analytics({ studentProfile, uploads, masteries }: AnalyticsProps) {
  
  // 1. Process Exam Progress over time
  const progressData = uploads.length > 0 
    ? uploads.map((u) => ({
        date: new Date(u.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: Math.round((u.score / u.maxScore) * 100),
        subject: u.subject
      })).reverse()
    : [
        { date: 'Baseline', score: 60, subject: 'Math' },
        { date: 'Quiz 1', score: 65, subject: 'Math' },
        { date: 'Homework', score: 72, subject: 'Physics' },
        { date: 'Midterm', score: 81, subject: 'Math' }
      ];

  // 2. Process Topic Mastery
  const masteryData = masteries.length > 0
    ? masteries.map((m) => ({
        topic: m.topic.length > 18 ? m.topic.slice(0, 15) + '...' : m.topic,
        mastery: m.masteryScore,
        confidence: m.confidenceLevel * 20 // scale to 100
      }))
    : [
        { topic: 'Quadratic Equations', mastery: 75, confidence: 80 },
        { topic: 'Newtonian Mechanics', mastery: 42, confidence: 50 },
        { topic: 'Photosynthesis', mastery: 85, confidence: 90 },
        { topic: 'Stoichiometry', mastery: 55, confidence: 60 },
        { topic: 'Algorithms', mastery: 68, confidence: 70 }
      ];

  // 3. Process Study Hours / Daily Goals
  const studyHoursData = [
    { day: 'Mon', target: studentProfile.dailyStudyGoalMinutes / 60, actual: 1.2 },
    { day: 'Tue', target: studentProfile.dailyStudyGoalMinutes / 60, actual: 1.8 },
    { day: 'Wed', target: studentProfile.dailyStudyGoalMinutes / 60, actual: 0.8 },
    { day: 'Thu', target: studentProfile.dailyStudyGoalMinutes / 60, actual: 2.2 },
    { day: 'Fri', target: studentProfile.dailyStudyGoalMinutes / 60, actual: 1.5 },
    { day: 'Sat', target: studentProfile.dailyStudyGoalMinutes / 60, actual: 2.5 },
    { day: 'Sun', target: studentProfile.dailyStudyGoalMinutes / 60, actual: 0.5 }
  ];

  // 4. Mistake Distribution calculations
  const mistakeCounts: Record<string, number> = {};
  uploads.forEach(u => {
    u.analysis.gaps.forEach(g => {
      mistakeCounts[g.category] = (mistakeCounts[g.category] || 0) + 1;
    });
  });

  const mistakeDistributionData = Object.keys(mistakeCounts).length > 0
    ? Object.keys(mistakeCounts).map(cat => ({
        name: cat.replace('_', ' ').toUpperCase(),
        value: mistakeCounts[cat]
      }))
    : [
        { name: 'LACK OF UNDERSTANDING', value: 4 },
        { name: 'CARELESS MISTAKES', value: 3 },
        { name: 'CALCULATION ERRORS', value: 2 },
        { name: 'POOR TIME MANAGEMENT', value: 1 },
        { name: 'WEAK MEMORY RECALL', value: 2 }
      ];

  // Calculated overall metrics
  const totalCompletedTasks = uploads.length;
  const averageReadyScore = uploads.length > 0 
    ? Math.round(uploads.reduce((acc, u) => acc + (u.score / u.maxScore) * 100, 0) / uploads.length)
    : 72;

  const strongestTopic = masteries.length > 0
    ? [...masteries].sort((a, b) => b.masteryScore - a.masteryScore)[0]
    : { topic: 'Photosynthesis', masteryScore: 85 };

  const weakestTopic = masteries.length > 0
    ? [...masteries].sort((a, b) => a.masteryScore - b.masteryScore)[0]
    : { topic: 'Newtonian Mechanics', masteryScore: 42 };

  return (
    <div className="space-y-6" id="analytics_dashboard">
      
      {/* Analytics header banner */}
      <div id="analytics_header">
        <h2 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
          <Activity className="w-6.5 h-6.5 text-purple-600" />
          Detailed Learning Analytics
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Explore data-driven metrics explaining your test progression, memory retention factors, study hour targets, and mistake distributions.
        </p>
      </div>

      {/* Grid of micro cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="analytics_top_counters">
        
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Exam Readiness</div>
            <div className="text-2xl font-extrabold text-purple-600">{averageReadyScore}%</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Average calculated test grade</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Strongest Pillar</div>
            <div className="text-base font-bold text-slate-800 truncate max-w-[150px]">{strongestTopic.topic}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Mastery level: {strongestTopic.masteryScore}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Weakest Pillar</div>
            <div className="text-base font-bold text-slate-800 truncate max-w-[150px]">{weakestTopic.topic}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Needs revision: {weakestTopic.masteryScore}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Total Streak</div>
            <div className="text-2xl font-extrabold text-purple-700">{studentProfile.streak} {studentProfile.streak === 1 ? 'Day' : 'Days'}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Study streak is active!</p>
          </div>
        </div>

      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics_charts_grid">
        
        {/* Progress Trend Line chart */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Exam Grade Progression Trend
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Tracks overall test percentages and quizzes over time</p>
          </div>
          <div className="h-64" id="progress_line_chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} name="Test Score (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Mastery Bar chart */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Detailed Topic Mastery & Confidence
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Shows syllabus topic masteries mapped against active confidence scales</p>
          </div>
          <div className="h-64" id="topic_mastery_bar_chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={masteryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="topic" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="mastery" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Mastery Score" />
                <Bar dataKey="confidence" fill="#10b981" radius={[4, 4, 0, 0]} name="Confidence Match" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Study Area chart */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Daily Study Hours vs. Weekly Benchmarks
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Logs hours spent revising compared to onboarding target values</p>
          </div>
          <div className="h-64" id="study_hours_area_chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="actual" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2.5} name="Hours Studied" />
                <Line type="monotone" strokeDasharray="4 4" dataKey="target" stroke="#ec4899" strokeWidth={1.5} name="Daily Hour Target" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cognitive Mistake Distribution Pie chart */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Root Causes of Marks Lost (Cognitive Gaps)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Shows distribution of what factors triggered exam mistakes</p>
          </div>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4" id="mistakes_pie_section">
            <div className="w-full sm:w-1/2 h-full" id="mistakes_pie_chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mistakeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {mistakeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="w-full sm:w-1/2 space-y-1.5" id="mistakes_custom_legend">
              {mistakeDistributionData.map((d, index) => (
                <div key={d.name} className="flex items-center gap-2.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-650 font-medium truncate max-w-[150px]">{d.name}</span>
                  <span className="font-bold text-slate-850 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
