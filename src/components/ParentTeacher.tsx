import React, { useState } from 'react';
import { StudentProfile, StudyTask, ParentTeacherReport } from '../types';
import { 
  Users, 
  Plus, 
  FileSpreadsheet, 
  CheckSquare, 
  Clock, 
  Send, 
  Award, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParentTeacherProps {
  studentProfile: StudentProfile; // Current active student profile
  onAssignTask: (task: StudyTask) => void;
  onSubmitReport: (report: ParentTeacherReport) => void;
}

// Simulated multiple children profiles for a linked parent
const SIMULATED_CHILDREN = [
  { id: 'stud_1', name: 'Alex Mercer', grade: 'High School', readiness: 72, streak: 3, xp: 480 },
  { id: 'stud_2', name: 'Sarah Mercer', grade: 'Middle School', readiness: 85, streak: 5, xp: 620 }
];

export default function ParentTeacher({ studentProfile, onAssignTask, onSubmitReport }: ParentTeacherProps) {
  const [selectedChildId, setSelectedChildId] = useState('stud_1');
  const [taskSubject, setTaskSubject] = useState('Mathematics');
  const [taskTopic, setTaskTopic] = useState('');
  const [taskDuration, setTaskDuration] = useState(45);
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [feedbackText, setFeedbackText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const currentChild = SIMULATED_CHILDREN.find(c => c.id === selectedChildId) || SIMULATED_CHILDREN[0];

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTopic.trim()) return;

    const newTask: StudyTask = {
      id: `task_assigned_${Date.now()}`,
      studentId: studentProfile.uid, // assign to the real active student in session
      date: taskDate,
      subject: taskSubject,
      topic: taskTopic,
      durationMinutes: taskDuration,
      status: 'pending',
      xpReward: Math.round(taskDuration * 1.5),
      aiReason: `👑 Assigned by Parent/Teacher: Focus on this topic to support your weekly class performance.`
    };

    onAssignTask(newTask);
    
    // Clear form
    setTaskTopic('');
    setSuccessMsg(`Successfully assigned task "${taskSubject}: ${taskTopic}" to your student!`);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4000);
  };

  const handleCreateReport = () => {
    if (!feedbackText.trim()) return;

    const report: ParentTeacherReport = {
      id: `report_${Date.now()}`,
      studentId: studentProfile.uid,
      studentName: studentProfile.name,
      reporterId: 'parent_user_1',
      feedback: feedbackText,
      assignedTasks: [],
      createdAt: new Date().toISOString()
    };

    onSubmitReport(report);
    
    setFeedbackText('');
    setSuccessMsg("Weekly evaluation report submitted and synchronized with student's mobile app!");
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" id="parent_teacher_container">
      
      {/* Header banner */}
      <div id="parent_teacher_header">
        <h2 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
          <Users className="w-6.5 h-6.5 text-indigo-600" />
          Parent & Teacher Companion Dashboard
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Monitor your children's learning pathways, schedule custom study blocks, review cognitive mistake causes, and draft feedback reports.
        </p>
      </div>

      {isSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center gap-2" id="parent_success_banner">
          <CheckSquare className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Linked students selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="parent_workspace_grid">
        
        {/* Child sidebar */}
        <div className="md:col-span-1 space-y-4" id="child_selector_sidebar">
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              Linked Students
            </h3>

            <div className="space-y-2" id="linked_students_list">
              {SIMULATED_CHILDREN.map((child) => (
                <button
                  id={`select_student_${child.id}`}
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                    selectedChildId === child.id
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs">{child.id === 'stud_1' ? studentProfile.name : child.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{child.grade} • Streak: {child.id === 'stud_1' ? studentProfile.streak : child.streak}d</p>
                  </div>
                  <span className="text-xs font-black bg-white px-2 py-0.5 border rounded shadow-sm text-indigo-600">
                    {child.id === 'stud_1' ? child.readiness : child.readiness}%
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs" id="parent_invite_link">
              <span className="text-[10px] font-bold text-slate-400 block">LINK ANOTHER CHILD</span>
              <p className="text-[10px] text-slate-400 mt-1">Share your custom parent code: <strong>EPG-793-MC</strong></p>
            </div>
          </div>
        </div>

        {/* Task assigner & Report submissions */}
        <div className="md:col-span-3 space-y-6" id="parent_teacher_actions">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form: Assign Practice Work */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Assign Practice Study Work
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Assigned tasks synchronize instantly into student revision planners</p>
              </div>

              <form onSubmit={handleAssignTask} className="space-y-3.5" id="assign_task_form">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
                  <select
                    id="assign_subject_select"
                    value={taskSubject}
                    onChange={(e) => setTaskSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Topic</label>
                  <input
                    id="assign_topic_input"
                    type="text"
                    required
                    placeholder="e.g. Differentiation Limits"
                    value={taskTopic}
                    onChange={(e) => setTaskTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Date</label>
                    <input
                      id="assign_date_input"
                      type="date"
                      value={taskDate}
                      onChange={(e) => setTaskDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Study length (Min)</label>
                    <input
                      id="assign_duration_input"
                      type="number"
                      min="15"
                      max="180"
                      step="15"
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(parseInt(e.target.value) || 45)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-xs text-center"
                    />
                  </div>
                </div>

                <button
                  id="submit_assign_task_btn"
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Assign Study Block</span>
                </button>
              </form>
            </div>

            {/* Form: Submitting evaluation reports */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  Submit Evaluation Reports
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Write weekly coaching feedback to motivate and direct student consistency</p>
              </div>

              <div className="space-y-3" id="reports_form">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Coaching Report Feedback</label>
                  <textarea
                    id="parent_feedback_textarea"
                    rows={6}
                    placeholder={`Write notes here... e.g. "Excellent progress on Math! I noticed Carey had careless calculation mistakes on roots. Let's practice formulas more with the AI Tutor."`}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 resize-none"
                  />
                </div>

                <button
                  id="submit_parent_report_btn"
                  onClick={handleCreateReport}
                  disabled={!feedbackText.trim()}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Publish Weekly Report</span>
                </button>
              </div>
            </div>

          </div>

          {/* Guidelines / Parenting tips panel */}
          <div className="bg-slate-50 rounded-[24px] border border-slate-100 p-4.5 flex gap-4 items-start" id="coaching_corner">
            <Sparkles className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs space-y-1 text-slate-700">
              <strong className="text-indigo-950 block">AI Coaching Tip of the Week:</strong>
              <p className="leading-relaxed">
                If the student logs a high amount of <strong>Careless Mistakes</strong>, avoid assigning heavy revision notes. Instead, use the <strong>AI Practice Quiz</strong> with easy difficulty. This trains active root checking and builds rapid cognitive accuracy under timed test environments.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
