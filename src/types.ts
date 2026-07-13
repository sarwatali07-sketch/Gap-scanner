export interface Exam {
  id: string;
  subject: string;
  date: string;
  targetGrade: string;
}

export interface StudentProfile {
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'parent' | 'teacher';
  gradeLevel: 'middle_school' | 'high_school' | 'college' | 'university';
  curriculum: string; // e.g., GCSE, AP, IB, SAT
  upcomingExams: Exam[];
  preferredStudyHours: number;
  dailyStudyGoalMinutes: number;
  streak: number;
  xp: number;
  badges: string[];
  lastActiveDate: string | null;
  linkedStudents?: string[]; // For parents / teachers
  linkedParentsTeachers?: string[]; // For students
  age?: number;
  place?: string;
  lifestyle?: string; // The way they live
  studyPlanType?: string; // What's your study plan?
  targetSubjects?: string[]; // What subjects do you want to study?
}

export type MistakeCategory =
  | 'understanding'
  | 'careless'
  | 'calculation'
  | 'time_management'
  | 'weak_memory'
  | 'misunderstanding'
  | 'guessing'
  | 'other';

export interface MistakeAnalysis {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  marksLost: number;
  maxMarks: number;
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: MistakeCategory;
  explanation: string;
  remedy: string;
}

export interface ExamUpload {
  id: string;
  studentId: string;
  subject: string;
  title: string;
  uploadedAt: string;
  score: number;
  maxScore: number;
  timeTakenMinutes: number;
  teacherFeedback?: string;
  analysis: {
    gaps: MistakeAnalysis[];
    summary: string;
    identifiedWeaknesses: string[];
    readinessImpact: number; // e.g. -15%
  };
}

export interface TopicMastery {
  id: string;
  studentId: string;
  subject: string;
  topic: string;
  subtopic?: string;
  masteryScore: number; // 0 to 100
  confidenceLevel: number; // 1 to 5
  lastRevisedAt: string;
  reviewCount: number;
}

export interface StudyTask {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  subject: string;
  topic: string;
  durationMinutes: number;
  status: 'pending' | 'completed';
  xpReward: number;
  aiReason?: string;
}

export interface Flashcard {
  id: string;
  studentId: string;
  subject: string;
  topic: string;
  question: string;
  answer: string;
  box: number; // For Leitner spaced repetition
  nextReviewDate: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  createdAt: string;
}

export interface ParentTeacherReport {
  id: string;
  studentId: string;
  studentName: string;
  reporterId: string; // parent/teacher uid
  feedback: string;
  assignedTasks: string[]; // study task ids
  createdAt: string;
}
