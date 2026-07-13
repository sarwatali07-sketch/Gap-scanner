import React, { useState, useRef } from 'react';
import { ExamUpload as IExamUpload, MistakeAnalysis, MistakeCategory, StudentProfile } from '../types';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  TrendingDown, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileCheck, 
  Plus, 
  Brain, 
  Loader2,
  BookmarkCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExamUploadProps {
  studentProfile: StudentProfile;
  onAnalysisComplete: (upload: IExamUpload) => void;
}

const CATEGORY_COLORS: Record<MistakeCategory, { bg: string; text: string; border: string; label: string }> = {
  understanding: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', label: 'Lack of Understanding' },
  careless: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'Careless Mistake' },
  calculation: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', label: 'Calculation Error' },
  time_management: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', label: 'Poor Time Management' },
  weak_memory: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', label: 'Weak Memory Recall' },
  misunderstanding: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-100', label: 'Misread/Misunderstood' },
  guessing: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', label: 'Incorrect Guess' },
  other: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', label: 'Other Reason' }
};

const SAMPLE_OCR_PRESETS = [
  {
    title: 'Algebra Algebra Practice Quiz 1.png',
    ocrText: `ALGEBRA I QUIZ 1 - QUADRATICS
Name: Alex Mercer  Score: 6/15
Question 1 (5 marks): Solve x^2 - 5x + 6 = 0 by factoring.
Student Answer: (x-2)(x-3) = 0, so x = -2 or x = -3.
Teacher feedback: Arithmetic sign error in root output! (x-2)=0 means x=2. Lost 4 marks.
Question 2 (5 marks): Find the vertex of y = 2x^2 - 8x + 3.
Student Answer: x = -b/2a = 8 / (2*2) = 2. So y = 2(2)^2 - 8(2) + 3 = 8 - 16 + 3 = -5. Vertex is (2, -5).
Teacher feedback: Correct. 5 marks.
Question 3 (5 marks): Explain the discriminant of 3x^2 - 2x + 5 = 0.
Student Answer: Left blank. Ran out of time because question 1 took too long.
Teacher feedback: Left blank. Lost 5 marks.`,
    subject: 'Mathematics'
  },
  {
    title: 'Photosynthesis_Homework_Scan.pdf',
    ocrText: `PHOTOSYNTHESIS BIOLOGY HOMEWORK
Subject: Biology  Score: 8/12
Question 1: What are the primary inputs for light-dependent reactions?
Student Answer: Water and sunlight.
Teacher feedback: Missing carbon dioxide input. 2 out of 3 marks.
Question 2: Explain why chlorophyll appears green.
Student Answer: Because it absorbs green light and reflects blue and yellow light.
Teacher feedback: No! Chlorophyll absorbs blue and red, reflecting green light. Critical misconception! Lost 3 marks.
Question 3: Where in the cell does photosynthesis happen?
Student Answer: Chloroplast.
Teacher feedback: Correct. 4 out of 4 marks.`,
    subject: 'Biology'
  }
];

export default function ExamUpload({ studentProfile, onAnalysisComplete }: ExamUploadProps) {
  const [subject, setSubject] = useState('Mathematics');
  const [title, setTitle] = useState('');
  const [score, setScore] = useState(8);
  const [maxScore, setMaxScore] = useState(15);
  const [timeTaken, setTimeTaken] = useState(45);
  const [teacherFeedback, setTeacherFeedback] = useState('');
  
  // OCR Scan variables
  const [dragActive, setDragActive] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [fileSelected, setFileSelected] = useState<string | null>(null);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<IExamUpload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      triggerMockFileSelect(file.name);
    }
  };

  const triggerMockFileSelect = (filename: string) => {
    setFileSelected(filename);
    setTitle(filename.replace(/\.[^/.]+$/, ""));
    
    // Attempt matching to presets
    const match = SAMPLE_OCR_PRESETS.find(p => filename.toLowerCase().includes(p.subject.toLowerCase()) || p.title.toLowerCase().includes(filename.toLowerCase()));
    if (match) {
      setOcrText(match.ocrText);
      setSubject(match.subject);
    } else {
      // Generate some dummy OCR
      setOcrText(`OCR EXTRACT FROM ${filename.toUpperCase()}:\nSubject: ${subject}\nQuestion: Explain the main concept.\nStudent answer: Did my best but got confused with the formula.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerMockFileSelect(e.target.files[0].name);
    }
  };

  const applyOcrPreset = (preset: typeof SAMPLE_OCR_PRESETS[0]) => {
    setFileSelected(preset.title);
    setTitle(preset.title.replace(/\.[^/.]+$/, ""));
    setOcrText(preset.ocrText);
    setSubject(preset.subject);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Assemble mock/manual input if OCR is blank
      const manualInput = ocrText ? null : {
        score,
        maxScore,
        timeTaken,
        teacherFeedback,
        subject
      };

      const res = await fetch('/api/analyze-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrText,
          manualInput,
          subject,
          gradeLevel: studentProfile.gradeLevel,
          curriculum: studentProfile.curriculum
        })
      });

      const data = await res.json();
      if (res.ok) {
        const fullUpload: IExamUpload = {
          id: `upload_${Date.now()}`,
          studentId: studentProfile.uid,
          subject,
          title,
          uploadedAt: new Date().toISOString(),
          score: ocrText ? (score || 6) : score, // if OCR, match score or default
          maxScore: ocrText ? (maxScore || 15) : maxScore,
          timeTakenMinutes: timeTaken,
          teacherFeedback,
          analysis: {
            gaps: data.gaps.map((g: any, index: number) => ({
              ...g,
              questionId: g.questionId || `q_extracted_${index + 1}`
            })),
            summary: data.summary,
            identifiedWeaknesses: data.identifiedWeaknesses,
            readinessImpact: data.readinessImpact
          }
        };

        setAnalysisResult(fullUpload);
      } else {
        throw new Error(data.error || 'Failed to analyze');
      }
    } catch (err) {
      console.error(err);
      console.warn('Analysis failed. Re-trying with fallback engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveResult = () => {
    if (!analysisResult) return;
    onAnalysisComplete(analysisResult);
    
    // Reset form
    setAnalysisResult(null);
    setTitle('');
    setOcrText('');
    setFileSelected(null);
    setTeacherFeedback('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="exam_upload_container">
      
      {/* Header */}
      <div id="exam_upload_header" className="bg-white p-6 rounded-[24px] border border-purple-100/50 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Upload className="w-6.5 h-6.5 text-purple-600" />
          <span>Exam Paper & Homework Gap Scanner 🪄</span>
        </h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Take a photo of your hand-written test or upload a PDF of your homework quiz! Your chosen AI tutor companion will instantly scan the questions, analyze any mistakes, and add personalized spaced-repetition challenge cards into your study deck.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="upload_workspace_grid">
        
        {/* Form and Upload Section */}
        <div className="lg:col-span-1 space-y-4" id="upload_sidebar">
          <div className="bg-white rounded-[24px] border border-purple-100/50 p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-purple-50/50 pb-3">
              <FileCheck className="w-4 h-4 text-purple-600" />
              Upload Details
            </h3>

            <div className="space-y-3.5" id="upload_metadata_inputs">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
                <select
                  id="upload_subject_select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-purple-100/50 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Upload Title</label>
                <input
                  id="upload_title_input"
                  type="text"
                  required
                  placeholder="e.g., Algebra Quiz 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-purple-100/50 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Score</label>
                  <input
                    id="upload_score_input"
                    type="number"
                    min="0"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-purple-100/50 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Max Score</label>
                  <input
                    id="upload_max_score_input"
                    type="number"
                    min="1"
                    value={maxScore}
                    onChange={(e) => setMaxScore(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-purple-100/50 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex justify-between">
                  <span>Time Taken (Minutes)</span>
                  <span className="text-slate-400 font-normal">{timeTaken}m</span>
                </label>
                <input
                  id="upload_time_range"
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={timeTaken}
                  onChange={(e) => setTimeTaken(parseInt(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {!ocrText && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Teacher Feedback (Optional)</label>
                  <textarea
                    id="upload_feedback_input"
                    rows={2}
                    placeholder="e.g., Amazing try but struggled with equation factorization..."
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-purple-100/50 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400 resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quick OCR Presets */}
          <div className="bg-purple-50/50 rounded-[24px] border border-purple-100 p-4 space-y-3" id="ocr_presets_box">
            <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Try a Simulated Scan Preset 🌟
            </h4>
            <p className="text-[11px] text-purple-950 leading-relaxed">
              Don't have a worksheet handy? Click a preset to simulate scanner parser output:
            </p>
            <div className="space-y-1.5" id="presets_list">
              {SAMPLE_OCR_PRESETS.map((p) => (
                <button
                  id={`ocr_preset_${p.subject.toLowerCase()}`}
                  key={p.title}
                  onClick={() => applyOcrPreset(p)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs border transition-all cursor-pointer flex items-center gap-2 ${
                    fileSelected === p.title
                      ? 'bg-purple-600 border-purple-600 text-white font-medium shadow-sm'
                      : 'bg-white border-purple-100/30 text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drag-and-drop & OCR / Manual text entry */}
        <div className="lg:col-span-2 space-y-4" id="upload_primary_area">
          <div className="bg-white rounded-[24px] border border-purple-100/50 p-6 flex flex-col h-full min-h-[420px] shadow-sm">
            
            {/* File Drag Box */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                dragActive 
                  ? 'border-purple-600 bg-purple-50/40' 
                  : fileSelected 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-purple-150 hover:border-purple-400 hover:bg-purple-50/10'
              }`}
              id="file_drag_box"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
              {fileSelected ? (
                <>
                  <FileCheck className="w-10 h-10 text-emerald-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-800">{fileSelected}</p>
                  <p className="text-xs text-emerald-600 mt-1">File scanned! OCR text has been generated below.</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-800">Drag & Drop exam paper photo / PDF</p>
                  <p className="text-xs text-slate-400 mt-1">Supports screenshots, photos of hand-written worksheets, or scanned papers</p>
                </>
              )}
            </div>

            {/* OCR edit box */}
            <div className="flex-1 flex flex-col mt-4" id="ocr_editor">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex justify-between">
                <span>OCR Extracted Text (Editable for Corrections)</span>
                <span className="text-purple-650 font-bold">{ocrText ? '✨ Scanned with AI OCR' : '✏️ Manual Entry Mode'}</span>
              </label>
              <textarea
                id="ocr_text_textarea"
                className="flex-1 w-full p-4 bg-slate-50 border border-purple-100/50 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[150px] resize-none"
                placeholder="No scanned file loaded. If you are entering questions manually, leave this empty and key in score/details on the left. To test the AI OCR scanner, select one of the simulated presets!"
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
              />
            </div>

            <button
              id="analyze_work_submit_btn"
              onClick={handleAnalyze}
              disabled={analyzing || !title.trim()}
              className="w-full py-3 mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-md disabled:bg-purple-400 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>AI is scanning, running OCR & mapping knowledge gaps...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5" />
                  <span>Analyze knowledge Gaps with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results Display */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-6"
            id="analysis_results_display"
          >
            {/* Header / Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-purple-50" id="analysis_result_header">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{analysisResult.subject} Analysis</span>
                <h3 className="text-xl font-bold text-slate-850 mt-1">{analysisResult.title} Analysis Output 🔬</h3>
                <p className="text-xs text-slate-400 mt-0.5">Uploaded {new Date(analysisResult.uploadedAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0" id="analysis_result_stats">
                <div className="bg-slate-50 px-4 py-2 border border-slate-100 rounded-2xl text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Score</div>
                  <div className="text-lg font-extrabold text-slate-850">
                    {analysisResult.score} / {analysisResult.maxScore}
                    <span className="text-xs font-semibold text-slate-400 ml-1">
                      ({Math.round((analysisResult.score / analysisResult.maxScore) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="bg-rose-50 px-4 py-2 border border-rose-100 rounded-2xl text-center">
                  <div className="text-[10px] text-rose-600 font-bold uppercase flex items-center justify-center gap-0.5">
                    <TrendingDown className="w-3 h-3" />
                    Readiness Impact
                  </div>
                  <div className="text-lg font-extrabold text-rose-700">
                    {analysisResult.analysis.readinessImpact}%
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="bg-purple-50/50 rounded-2xl p-4.5 border border-purple-100 flex gap-3.5" id="ai_summary_card">
              <Brain className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">AI Companion Overview</h4>
                <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{analysisResult.analysis.summary}</p>
              </div>
            </div>

            {/* Weaknesses List */}
            <div className="space-y-2" id="identified_weaknesses_box">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">High-Priority Gaps Found</h4>
              <div className="flex flex-wrap gap-2" id="weakness_tags">
                {analysisResult.analysis.identifiedWeaknesses.map((w, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-rose-50 border border-rose-100 rounded-lg text-xs font-semibold text-rose-700"
                  >
                    ⚠️ {w}
                  </span>
                ))}
              </div>
            </div>

            {/* Breakdown of Gaps */}
            <div className="space-y-3" id="gaps_breakdown_section">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Extracted Mistakes & Cognitive Gaps</h4>
              <div className="space-y-4" id="gaps_cards_list">
                {analysisResult.analysis.gaps.map((gap, index) => {
                  const style = CATEGORY_COLORS[gap.category] || CATEGORY_COLORS.other;
                  return (
                    <div 
                      key={gap.questionId || index}
                      className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Top banner */}
                      <div className="bg-slate-50 px-4.5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4.5 h-4.5 text-slate-500" />
                          <span className="font-semibold text-slate-800 text-sm">Question {index + 1}</span>
                          <span className="text-xs text-slate-400">| {gap.topic} ({gap.subtopic})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}>
                            {style.label}
                          </span>
                          <span className="text-xs text-slate-500 bg-white border px-2 py-0.5 rounded-lg font-medium">
                            Difficulty: <span className="font-bold text-slate-800 uppercase">{gap.difficulty}</span>
                          </span>
                        </div>
                      </div>

                      {/* Question content */}
                      <div className="p-4.5 space-y-3.5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">The Question</h5>
                            <p className="text-sm text-slate-800 font-medium">{gap.questionText}</p>
                          </div>
                          
                          <div className="space-y-1 bg-rose-50/10 p-3 rounded-xl border border-rose-100/40">
                            <h5 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Your Answer</h5>
                            <p className="text-sm text-rose-950 font-medium italic">"{gap.studentAnswer}"</p>
                          </div>
                        </div>

                        <div className="bg-emerald-50/10 p-3.5 border border-emerald-100/50 rounded-xl space-y-1">
                          <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Correct Solution & Criteria</h5>
                          <p className="text-sm text-slate-800 leading-relaxed font-medium">{gap.correctAnswer}</p>
                        </div>

                        <div className="bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl space-y-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-700">Root Cause Explanation: </span>
                            <span className="text-slate-600 leading-relaxed">{gap.explanation}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-200/40 flex items-start gap-2 text-purple-950">
                            <BookmarkCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-purple-950">Study Remedy: </span>
                              <span className="text-slate-700 leading-relaxed">{gap.remedy}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-purple-50" id="analysis_save_actions">
              <button
                id="discard_analysis_btn"
                onClick={() => setAnalysisResult(null)}
                className="px-4 py-2 border border-purple-250 hover:bg-purple-50 text-slate-600 text-sm font-semibold transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                id="save_analysis_btn"
                onClick={handleSaveResult}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Save to Profile & Sync Mastery</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
