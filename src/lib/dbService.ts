import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  addDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { StudentProfile, ExamUpload, TopicMastery, StudyTask, Flashcard, ParentTeacherReport } from '../types';

// Use a unique namespace for offline local storage
const LS_PREFIX = 'exam_gap_finder_';

// Check if Firebase Firestore is available/connected (or if we need to use localStorage fallback)
async function isFirebaseAvailable(): Promise<boolean> {
  try {
    // Quick test write/read can be slow, so we test connectivity or try-catch on firestore operations.
    // We will attempt firestore first, and if it fails or throws, we fallback automatically.
    return true;
  } catch (e) {
    return false;
  }
}

// ------------------- STUDENT PROFILE SERVICES -------------------

export async function saveProfile(profile: StudentProfile): Promise<void> {
  try {
    const userDoc = doc(db, 'students', profile.uid);
    await setDoc(userDoc, profile, { merge: true });
    localStorage.setItem(`${LS_PREFIX}profile_${profile.uid}`, JSON.stringify(profile));
  } catch (error) {
    console.warn('Firebase error saving profile, saving to localStorage:', error);
    localStorage.setItem(`${LS_PREFIX}profile_${profile.uid}`, JSON.stringify(profile));
  }
}

export async function getProfile(uid: string): Promise<StudentProfile | null> {
  try {
    const userDoc = doc(db, 'students', uid);
    const snap = await getDoc(userDoc);
    if (snap.exists()) {
      const data = snap.data() as StudentProfile;
      localStorage.setItem(`${LS_PREFIX}profile_${uid}`, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.warn('Firebase error reading profile, retrieving from localStorage:', error);
  }
  
  const local = localStorage.getItem(`${LS_PREFIX}profile_${uid}`);
  return local ? JSON.parse(local) : null;
}

// ------------------- EXAM UPLOAD ANALYSIS SERVICES -------------------

export async function saveExamUpload(upload: ExamUpload): Promise<void> {
  try {
    const docRef = doc(db, 'uploads', upload.id);
    await setDoc(docRef, upload);
    
    // Save locally
    const current = getLocalUploads(upload.studentId);
    const updated = [upload, ...current.filter(u => u.id !== upload.id)];
    localStorage.setItem(`${LS_PREFIX}uploads_${upload.studentId}`, JSON.stringify(updated));
  } catch (error) {
    console.warn('Firebase error saving upload, using localStorage:', error);
    const current = getLocalUploads(upload.studentId);
    const updated = [upload, ...current.filter(u => u.id !== upload.id)];
    localStorage.setItem(`${LS_PREFIX}uploads_${upload.studentId}`, JSON.stringify(updated));
  }
}

function getLocalUploads(studentId: string): ExamUpload[] {
  const local = localStorage.getItem(`${LS_PREFIX}uploads_${studentId}`);
  return local ? JSON.parse(local) : [];
}

export async function getExamUploads(studentId: string): Promise<ExamUpload[]> {
  try {
    const q = query(collection(db, 'uploads'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    const uploads: ExamUpload[] = [];
    snap.forEach(d => {
      uploads.push(d.data() as ExamUpload);
    });
    
    // Sort by uploadedAt descending
    uploads.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    localStorage.setItem(`${LS_PREFIX}uploads_${studentId}`, JSON.stringify(uploads));
    return uploads;
  } catch (error) {
    console.warn('Firebase error fetching uploads, retrieving from localStorage:', error);
    return getLocalUploads(studentId);
  }
}

// ------------------- TOPIC MASTERY SERVICES -------------------

export async function saveTopicMasteries(masteries: TopicMastery[]): Promise<void> {
  for (const m of masteries) {
    try {
      const docRef = doc(db, 'mastery', m.id);
      await setDoc(docRef, m);
    } catch (error) {
      console.warn('Firebase error saving topic mastery:', error);
    }
  }
  
  if (masteries.length > 0) {
    const studentId = masteries[0].studentId;
    const current = getLocalMasteries(studentId);
    const mIds = masteries.map(m => m.id);
    const updated = [...masteries, ...current.filter(m => !mIds.includes(m.id))];
    localStorage.setItem(`${LS_PREFIX}mastery_${studentId}`, JSON.stringify(updated));
  }
}

function getLocalMasteries(studentId: string): TopicMastery[] {
  const local = localStorage.getItem(`${LS_PREFIX}mastery_${studentId}`);
  return local ? JSON.parse(local) : [];
}

export async function getTopicMasteries(studentId: string): Promise<TopicMastery[]> {
  try {
    const q = query(collection(db, 'mastery'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    const masteries: TopicMastery[] = [];
    snap.forEach(d => {
      masteries.push(d.data() as TopicMastery);
    });
    localStorage.setItem(`${LS_PREFIX}mastery_${studentId}`, JSON.stringify(masteries));
    return masteries;
  } catch (error) {
    console.warn('Firebase error fetching mastery, retrieving from localStorage:', error);
    return getLocalMasteries(studentId);
  }
}

// ------------------- STUDY TASK REVISION SCHEDULES -------------------

export async function saveStudyTasks(tasks: StudyTask[]): Promise<void> {
  for (const t of tasks) {
    try {
      const docRef = doc(db, 'tasks', t.id);
      await setDoc(docRef, t);
    } catch (error) {
      console.warn('Firebase error saving study task:', error);
    }
  }
  
  if (tasks.length > 0) {
    const studentId = tasks[0].studentId;
    const current = getLocalTasks(studentId);
    const tIds = tasks.map(t => t.id);
    const updated = [...tasks, ...current.filter(t => !tIds.includes(t.id))];
    localStorage.setItem(`${LS_PREFIX}tasks_${studentId}`, JSON.stringify(updated));
  }
}

export async function updateStudyTaskStatus(taskId: string, studentId: string, status: 'pending' | 'completed'): Promise<void> {
  try {
    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.warn('Firebase error updating task status:', error);
  }
  
  // Local update
  const current = getLocalTasks(studentId);
  const updated = current.map(t => t.id === taskId ? { ...t, status } : t);
  localStorage.setItem(`${LS_PREFIX}tasks_${studentId}`, JSON.stringify(updated));
}

function getLocalTasks(studentId: string): StudyTask[] {
  const local = localStorage.getItem(`${LS_PREFIX}tasks_${studentId}`);
  return local ? JSON.parse(local) : [];
}

export async function getStudyTasks(studentId: string): Promise<StudyTask[]> {
  try {
    const q = query(collection(db, 'tasks'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    const tasks: StudyTask[] = [];
    snap.forEach(d => {
      tasks.push(d.data() as StudyTask);
    });
    localStorage.setItem(`${LS_PREFIX}tasks_${studentId}`, JSON.stringify(tasks));
    return tasks;
  } catch (error) {
    console.warn('Firebase error fetching tasks, retrieving from localStorage:', error);
    return getLocalTasks(studentId);
  }
}

// ------------------- FLASHCARD SERVICES -------------------

export async function saveFlashcard(card: Flashcard): Promise<void> {
  try {
    const docRef = doc(db, 'flashcards', card.id);
    await setDoc(docRef, card);
    
    const current = getLocalFlashcards(card.studentId);
    const updated = [card, ...current.filter(c => c.id !== card.id)];
    localStorage.setItem(`${LS_PREFIX}flashcards_${card.studentId}`, JSON.stringify(updated));
  } catch (error) {
    console.warn('Firebase error saving flashcard, using localStorage:', error);
    const current = getLocalFlashcards(card.studentId);
    const updated = [card, ...current.filter(c => c.id !== card.id)];
    localStorage.setItem(`${LS_PREFIX}flashcards_${card.studentId}`, JSON.stringify(updated));
  }
}

function getLocalFlashcards(studentId: string): Flashcard[] {
  const local = localStorage.getItem(`${LS_PREFIX}flashcards_${studentId}`);
  return local ? JSON.parse(local) : [];
}

export async function getFlashcards(studentId: string): Promise<Flashcard[]> {
  try {
    const q = query(collection(db, 'flashcards'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    const cards: Flashcard[] = [];
    snap.forEach(d => {
      cards.push(d.data() as Flashcard);
    });
    localStorage.setItem(`${LS_PREFIX}flashcards_${studentId}`, JSON.stringify(cards));
    return cards;
  } catch (error) {
    console.warn('Firebase error fetching flashcards, retrieving from localStorage:', error);
    return getLocalFlashcards(studentId);
  }
}

// ------------------- PARENT / TEACHER REPORTS -------------------

export async function submitParentTeacherReport(report: ParentTeacherReport): Promise<void> {
  try {
    const docRef = doc(db, 'parent_reports', report.id);
    await setDoc(docRef, report);
    
    const current = getLocalReports(report.studentId);
    const updated = [report, ...current.filter(r => r.id !== report.id)];
    localStorage.setItem(`${LS_PREFIX}reports_${report.studentId}`, JSON.stringify(updated));
  } catch (error) {
    console.warn('Firebase error saving report, using localStorage:', error);
    const current = getLocalReports(report.studentId);
    const updated = [report, ...current.filter(r => r.id !== report.id)];
    localStorage.setItem(`${LS_PREFIX}reports_${report.studentId}`, JSON.stringify(updated));
  }
}

function getLocalReports(studentId: string): ParentTeacherReport[] {
  const local = localStorage.getItem(`${LS_PREFIX}reports_${studentId}`);
  return local ? JSON.parse(local) : [];
}

export async function getParentTeacherReports(studentId: string): Promise<ParentTeacherReport[]> {
  try {
    const q = query(collection(db, 'parent_reports'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    const reports: ParentTeacherReport[] = [];
    snap.forEach(d => {
      reports.push(d.data() as ParentTeacherReport);
    });
    localStorage.setItem(`${LS_PREFIX}reports_${studentId}`, JSON.stringify(reports));
    return reports;
  } catch (error) {
    console.warn('Firebase error fetching reports, retrieving from localStorage:', error);
    return getLocalReports(studentId);
  }
}

// ------------------- ADMIN CURRICULUM CONFIGURATION -------------------
// Simple global curriculum / subjects store in local/firestore to allow admin edits without core code changes
export interface AdminSubjectConfig {
  id: string;
  name: string;
  chapters: Array<{ name: string; topics: string[] }>;
}

const DEFAULT_SUBJECTS_CONFIG: AdminSubjectConfig[] = [
  {
    id: 'math',
    name: 'Mathematics',
    chapters: [
      { name: 'Algebra', topics: ['Quadratic Equations', 'Linear Systems', 'Inequalities'] },
      { name: 'Trigonometry', topics: ['Sine & Cosine Rules', 'Trigonometric Identities', 'Angles of Elevation'] },
      { name: 'Calculus', topics: ['Differentiation Basics', 'Integration Limits', 'Optimization Problems'] }
    ]
  },
  {
    id: 'physics',
    name: 'Physics',
    chapters: [
      { name: 'Mechanics', topics: ['Newtonian Mechanics', 'Work, Energy & Power', 'Momentum & Collisions'] },
      { name: 'Electricity', topics: ['Electric Circuits', 'Ohm\'s Law & Resistivity', 'Electromagnetism'] },
      { name: 'Waves', topics: ['Optics & Wave Reflection', 'Sound and Resonance', 'Electromagnetic Spectrum'] }
    ]
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    chapters: [
      { name: 'Physical Chemistry', topics: ['Stoichiometry', 'Acids and Bases', 'Chemical Equilibrium'] },
      { name: 'Inorganic Chemistry', topics: ['Chemical Bonding', 'Periodic Trends', 'Transition Metals'] },
      { name: 'Organic Chemistry', topics: ['Hydrocarbons', 'Alcohols & Esters', 'Polymerization'] }
    ]
  },
  {
    id: 'biology',
    name: 'Biology',
    chapters: [
      { name: 'Cellular Biology', topics: ['Cell Structure & Division', 'Photosynthesis', 'Cellular Respiration'] },
      { name: 'Human Anatomy', topics: ['Human Digestive System', 'Nervous & Endocrine Coordination', 'Cardiovascular Flow'] },
      { name: 'Genetics', topics: ['Genetics & Inheritance', 'DNA Replication', 'Evolutionary Theory'] }
    ]
  },
  {
    id: 'computer_science',
    name: 'Computer Science',
    chapters: [
      { name: 'Data Structures', topics: ['Binary Trees', 'Arrays & Lists', 'Stack and Queues'] },
      { name: 'Algorithms', topics: ['Recursion in Code', 'Search and Sort Complexities', 'Dynamic Programming'] },
      { name: 'Databases', topics: ['SQL Joins', 'Database Normalization', 'Index Optimizations'] }
    ]
  },
  {
    id: 'english',
    name: 'English',
    chapters: [
      { name: 'Literature Analysis', topics: ['Poetry Deconstruction', 'Socio-historical Context', 'Character Arc Tracing'] },
      { name: 'Language Proficiency', topics: ['Reading Comprehension', 'Rhetorical Devices', 'Essay Structuring'] }
    ]
  },
  {
    id: 'business_economics',
    name: 'Business & Economics',
    chapters: [
      { name: 'Microeconomics', topics: ['Supply and Demand Curves', 'Market Failure', 'Elasticity of Prices'] },
      { name: 'Macroeconomics', topics: ['GDP Calculation', 'Fiscal & Monetary Policy', 'Inflation Speeds'] }
    ]
  }
];

export async function getSubjectsConfig(): Promise<AdminSubjectConfig[]> {
  try {
    const snap = await getDocs(collection(db, 'subjects_config'));
    if (!snap.empty) {
      const config: AdminSubjectConfig[] = [];
      snap.forEach(d => config.push(d.data() as AdminSubjectConfig));
      localStorage.setItem(`${LS_PREFIX}subjects_config`, JSON.stringify(config));
      return config;
    }
  } catch (error) {
    console.warn('Firebase error fetching subjects config, fallback to default:', error);
  }
  
  const local = localStorage.getItem(`${LS_PREFIX}subjects_config`);
  if (local) return JSON.parse(local);
  
  localStorage.setItem(`${LS_PREFIX}subjects_config`, JSON.stringify(DEFAULT_SUBJECTS_CONFIG));
  return DEFAULT_SUBJECTS_CONFIG;
}

export async function saveSubjectConfig(config: AdminSubjectConfig): Promise<void> {
  try {
    const docRef = doc(db, 'subjects_config', config.id);
    await setDoc(docRef, config);
  } catch (error) {
    console.warn('Firebase error saving subject config:', error);
  }
  
  const current = await getSubjectsConfig();
  const updated = [config, ...current.filter(c => c.id !== config.id)];
  localStorage.setItem(`${LS_PREFIX}subjects_config`, JSON.stringify(updated));
}
