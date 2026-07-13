import React, { useState } from 'react';
import { StudentProfile, Exam } from '../types';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Clock, 
  Target, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  MapPin,
  User,
  Heart,
  Home,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingProps {
  userEmail: string;
  userUid: string;
  userName: string;
  userRole: 'student' | 'parent' | 'teacher';
  onOnboardingComplete: (profile: StudentProfile) => void;
}

const GRADE_LEVELS = [
  { id: 'middle_school', label: 'Middle School', desc: 'Grades 6-8 / Years 7-9' },
  { id: 'high_school', label: 'High School', desc: 'Grades 9-12 / GCSEs / A-Levels' },
  { id: 'college', label: 'College', desc: 'Associate Degree / High Diploma' },
  { id: 'university', label: 'University', desc: 'Undergraduate / Postgraduate' }
];

const CURRICULUMS = [
  'A-Level / International A-Level',
  'GCSE / IGCSE',
  'Advanced Placement (AP)',
  'International Baccalaureate (IB)',
  'SAT / ACT Prep',
  'National Curriculum (US/UK/EU)',
  'CBSE / ICSE (India)',
  'VCE / HSC / QCE (Australia)',
  'Other / Custom Curriculum'
];

const AVAILABLE_SUBJECTS = [
  { id: 'Mathematics', color: 'indigo', emoji: '📐' },
  { id: 'Physics', color: 'violet', emoji: '⚛️' },
  { id: 'Chemistry', color: 'amber', emoji: '🧪' },
  { id: 'Biology', color: 'lime', emoji: '🧬' },
  { id: 'Economics', color: 'orange', emoji: '📊' },
  { id: 'Computer Science', color: 'cyan', emoji: '💻' },
  { id: 'English', color: 'emerald', emoji: '✍️' },
  { id: 'History', color: 'rose', emoji: '🏛️' },
  { id: 'Geography', color: 'sky', emoji: '🌍' }
];

const LIFESTYLES = [
  { id: 'home_quiet', label: '🏠 Quiet Room at Home', desc: 'Have a personal, distraction-free room/desk.' },
  { id: 'home_busy', label: '🏢 Busy & Active Household', desc: 'Loud family/roommates. Need focus-booster tips.' },
  { id: 'boarding', label: '🎓 Boarding or Student Hostel', desc: 'Living with peers. Study in library or shared rooms.' },
  { id: 'commuter', label: '🎒 Commuter Lifestyle', desc: 'Study on-the-go on buses, trains, or between schedules.' },
  { id: 'library', label: '🌿 Café & Library Nomad', desc: 'Prefer studying in cozy external environments.' }
];

const STUDY_PLANS = [
  { id: 'plan_cram', label: '🔥 30-Day Intensive Crammer', desc: 'High pressure, quick past paper grinds, max mark rules.' },
  { id: 'plan_mastery', label: '🧠 Spaced Concept Mastery', desc: 'Focus on eliminating careless mistakes and buffer levels.' },
  { id: 'plan_steady', label: '⏰ Weekly Consistent Routine', desc: 'Gentle, balanced routine to keep learning streaks intact.' }
];

export default function Onboarding({ userEmail, userUid, userName, userRole, onOnboardingComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  
  // Custom user details requested by prompt
  const [name, setName] = useState(userName || '');
  const [age, setAge] = useState<number>(17);
  const [place, setPlace] = useState('');
  const [lifestyle, setLifestyle] = useState('home_quiet');
  
  // Educational settings
  const [gradeLevel, setGradeLevel] = useState<'middle_school' | 'high_school' | 'college' | 'university'>('high_school');
  const [specificGrade, setSpecificGrade] = useState('Year 12 / A-Level');
  const [curriculum, setCurriculum] = useState('A-Level / International A-Level');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics', 'Physics']);
  
  // Study schedule & rhythm settings
  const [studyPlanType, setStudyPlanType] = useState('plan_mastery');
  const [preferredStudyHours, setPreferredStudyHours] = useState(2);
  const [dailyStudyGoalMinutes, setDailyStudyGoalMinutes] = useState(60);

  // Upcoming Exams
  const [exams, setExams] = useState<Exam[]>([
    { id: 'exam_1', subject: 'Mathematics', date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0], targetGrade: 'A' }
  ]);
  const [newExamSubject, setNewExamSubject] = useState('Mathematics');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamTarget, setNewExamTarget] = useState('A');

  const handleAddExam = () => {
    if (!newExamSubject || !newExamDate) return;
    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      subject: newExamSubject,
      date: newExamDate,
      targetGrade: newExamTarget
    };
    setExams([...exams, newExam]);
    setNewExamDate('');
  };

  const handleRemoveExam = (id: string) => {
    setExams(exams.filter(e => e.id !== id));
  };

  const handleToggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Find selected lifestyle and plan labels
      const lifestyleLabel = LIFESTYLES.find(l => l.id === lifestyle)?.label || lifestyle;
      const planLabel = STUDY_PLANS.find(p => p.id === studyPlanType)?.label || studyPlanType;

      // Completed Onboarding!
      const profile: StudentProfile = {
        uid: userUid,
        email: userEmail,
        name: name || userName,
        role: userRole,
        gradeLevel,
        curriculum,
        upcomingExams: exams,
        preferredStudyHours,
        dailyStudyGoalMinutes,
        streak: 1, // initialize with 1-day streak
        xp: 200, // enhanced onboarding XP bonus for filling out rich details!
        badges: ['Pioneer', 'Detail Planner 📋'],
        lastActiveDate: new Date().toISOString().split('T')[0],
        linkedParentsTeachers: [],
        linkedStudents: [],
        age,
        place: place || 'Not Specified',
        lifestyle: lifestyleLabel,
        studyPlanType: planLabel,
        targetSubjects: selectedSubjects
      };
      
      // Save selected subjects also to localStorage as general student metadata
      localStorage.setItem(`exam_gap_finder_subjects_${userUid}`, JSON.stringify(selectedSubjects));
      onOnboardingComplete(profile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" id="onboarding_container">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-3xl shadow-xl border border-purple-100 p-8 md:p-12 relative overflow-hidden" id="onboarding_card">
        
        {/* Decorative background visual blurs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/20 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-200/20 rounded-full filter blur-3xl pointer-events-none" />

        {/* Header Indicator */}
        <div className="mb-8" id="onboarding_progress">
          <div className="flex justify-between text-xs text-purple-400 uppercase tracking-wider font-extrabold mb-2">
            <span>Setup Personalized Companion</span>
            <span>Step {step} of 5</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full" 
              initial={{ width: '20%' }}
              animate={{ width: `${step * 20}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
              id="onboarding_step_1"
            >
              <div>
                <h2 className="text-2xl font-black text-purple-950 flex items-center gap-2">
                  <User className="w-7 h-7 text-purple-600" />
                  Tell Us About Yourself 🌟
                </h2>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Welcome to Gap Scanner! Let's get to know you so your AI study mascots can refer to you properly, design accurate targets, and optimize your schedule.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">What is your Name?</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      id="onboarding_name_input"
                      type="text"
                      placeholder="e.g. Alex"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">How old are you?</label>
                    <input
                      id="onboarding_age_input"
                      type="number"
                      min="10"
                      max="99"
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 17)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Where do you study? (Place / Location)</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        id="onboarding_place_input"
                        type="text"
                        placeholder="e.g. London, UK"
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
              id="onboarding_step_2"
            >
              <div>
                <h2 className="text-2xl font-black text-purple-950 flex items-center gap-2">
                  <Home className="w-7 h-7 text-purple-600" />
                  Your Lifestyle & Environment 🏠
                </h2>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  "The way you live" dictates how you handle study stress! Select the setting that matches your environment so we can provide specialized advice.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">The Way You Live / Study Space</label>
                <div className="grid grid-cols-1 gap-2.5" id="lifestyles_selection_grid">
                  {LIFESTYLES.map((l) => (
                    <button
                      id={`lifestyle_select_${l.id}`}
                      key={l.id}
                      type="button"
                      onClick={() => setLifestyle(l.id)}
                      className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        lifestyle === l.id 
                          ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/10' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${lifestyle === l.id ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'}`}>
                          {lifestyle === l.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">{l.label}</span>
                        <span className="text-xs text-slate-400 mt-1 block leading-relaxed">{l.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
              id="onboarding_step_3"
            >
              <div>
                <h2 className="text-2xl font-black text-purple-950 flex items-center gap-2">
                  <GraduationCap className="w-7 h-7 text-purple-600" />
                  Academics & Subject Targets 🎓
                </h2>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Which grade are you in and what subjects do you want to study? We customize note generations and flashcard levels based on this.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Educational Level</label>
                    <select
                      id="grade_level_select"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all text-xs"
                    >
                      {GRADE_LEVELS.map((g) => (
                        <option key={g.id} value={g.id}>{g.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Specific Class / Year of Study</label>
                    <input
                      id="specific_grade_input"
                      type="text"
                      placeholder="e.g. Year 12, Grade 11, Freshman"
                      value={specificGrade}
                      onChange={(e) => setSpecificGrade(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Curriculum / Exam Board</label>
                  <select
                    id="curriculum_select"
                    value={curriculum}
                    onChange={(e) => setCurriculum(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all text-xs"
                  >
                    {CURRICULUMS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">What Subjects Do You Want to Study?</label>
                  <div className="grid grid-cols-3 gap-2" id="subjects_selection_grid">
                    {AVAILABLE_SUBJECTS.map((sub) => {
                      const isSelected = selectedSubjects.includes(sub.id);
                      return (
                        <button
                          id={`subject_select_${sub.id}`}
                          key={sub.id}
                          type="button"
                          onClick={() => handleToggleSubject(sub.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xl mb-1">{sub.emoji}</span>
                          <span className="text-[10px] font-bold text-center leading-tight">{sub.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
              id="onboarding_step_4"
            >
              <div>
                <h2 className="text-2xl font-black text-purple-950 flex items-center gap-2">
                  <Sparkles className="w-7 h-7 text-purple-600" />
                  What is Your Study Plan? 📋
                </h2>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Choose a personalized revision layout template. This pre-seeds custom tasks in your planner dashboard immediately.
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3" id="study_plans_grid">
                  {STUDY_PLANS.map((plan) => (
                    <button
                      id={`plan_select_${plan.id}`}
                      key={plan.id}
                      type="button"
                      onClick={() => setStudyPlanType(plan.id)}
                      className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        studyPlanType === plan.id 
                          ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/10' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${studyPlanType === plan.id ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'}`}>
                          {studyPlanType === plan.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">{plan.label}</span>
                        <span className="text-xs text-slate-400 mt-1 block leading-relaxed">{plan.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
              id="onboarding_step_5"
            >
              <div>
                <h2 className="text-2xl font-black text-purple-950 flex items-center gap-2">
                  <Clock className="w-7 h-7 text-purple-600" />
                  Exam Target & Daily Rhythm ⏰
                </h2>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Let's specify your daily target hours and list any immediate exams you have to track.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Study Hours (Daily)</span>
                      <span className="text-purple-600">{preferredStudyHours} Hrs</span>
                    </div>
                    <input
                      id="study_hours_range"
                      type="range"
                      min="1"
                      max="6"
                      step="0.5"
                      value={preferredStudyHours}
                      onChange={(e) => setPreferredStudyHours(parseFloat(e.target.value))}
                      className="w-full accent-purple-600 bg-slate-100 rounded-lg cursor-pointer h-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Study Goal (Mins)</span>
                      <span className="text-purple-600">{dailyStudyGoalMinutes} Mins</span>
                    </div>
                    <input
                      id="daily_goal_range"
                      type="range"
                      min="15"
                      max="180"
                      step="15"
                      value={dailyStudyGoalMinutes}
                      onChange={(e) => setDailyStudyGoalMinutes(parseInt(e.target.value))}
                      className="w-full accent-purple-600 bg-slate-100 rounded-lg cursor-pointer h-2"
                    />
                  </div>
                </div>

                {/* Optional Exam Form inside step 5 */}
                <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-3" id="mini_exam_form">
                  <span className="text-[10px] uppercase font-black tracking-wider text-purple-800">Add Upcoming Exam Countdown (Optional)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      id="new_exam_subject"
                      value={newExamSubject}
                      onChange={(e) => setNewExamSubject(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                    >
                      {selectedSubjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <input
                      id="new_exam_date"
                      type="date"
                      value={newExamDate}
                      onChange={(e) => setNewExamDate(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                    />

                    <div className="flex gap-1.5">
                      <input
                        id="new_exam_target"
                        type="text"
                        placeholder="Target A*"
                        value={newExamTarget}
                        onChange={(e) => setNewExamTarget(e.target.value)}
                        className="flex-1 px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs text-center focus:outline-none"
                      />
                      <button
                        id="add_exam_btn"
                        type="button"
                        onClick={handleAddExam}
                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {exams.length > 0 && (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pt-1 border-t border-purple-100/50">
                      {exams.map(ex => (
                        <div key={ex.id} className="flex justify-between items-center text-xs text-slate-700 bg-white/80 p-1.5 rounded-lg border border-purple-100/20">
                          <span>📅 {ex.subject} - {ex.date} (Goal: {ex.targetGrade})</span>
                          <button onClick={() => handleRemoveExam(ex.id)} className="text-slate-400 hover:text-red-500">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex justify-between mt-10 pt-6 border-t border-slate-100" id="onboarding_footer">
          <button
            id="onboarding_back_btn"
            type="button"
            onClick={handleBack}
            className={`flex items-center gap-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium transition-colors cursor-pointer text-sm ${
              step === 1 ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            id="onboarding_next_btn"
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
          >
            <span>{step === 5 ? 'Launch Companion! 🚀' : 'Continue'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
