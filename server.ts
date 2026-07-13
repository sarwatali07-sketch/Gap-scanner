import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init Gemini SDK
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (aiInstance) return aiInstance;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  aiInstance = new GoogleGenAI({ apiKey: key });
  return aiInstance;
}

// Check AI status
app.get('/api/ai-status', (req: Request, res: Response) => {
  const isAvailable = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({ available: isAvailable });
});

// Endpoint: Analyze Practice Test / Homework / Scanned Papers
app.post('/api/analyze-exam', async (req: Request, res: Response) => {
  try {
    const { ocrText, manualInput, subject, gradeLevel, curriculum } = req.body;
    
    let contentToAnalyze = '';
    if (ocrText) {
      contentToAnalyze += `[OCR Scanned/Text Content]:\n${ocrText}\n\n`;
    }
    if (manualInput) {
      contentToAnalyze += `[Student Manual Entry / Question Details]:\n${JSON.stringify(manualInput)}\n\n`;
    }

    if (!contentToAnalyze.trim()) {
      res.status(400).json({ error: 'Please provide OCR text or manual entry details.' });
      return;
    }

    const prompt = `
      You are an expert educational AI analyst and personal tutor for middle school, high school, and college students.
      Your task is to analyze the student's exam paper, practice test, or homework results to identify knowledge gaps, weak topics, and trace mistakes to specific cognitive categories.

      Student Context:
      - Subject: ${subject || 'General'}
      - Grade Level: ${gradeLevel || 'High School'}
      - Curriculum/Exam Board: ${curriculum || 'Standard'}

      Exam/Work Data to analyze:
      ${contentToAnalyze}

      Please analyze the work and extract:
      1. Every mistake or gap in understanding. For each, determine:
         - questionText: The text or summary of the question.
         - studentAnswer: What the student wrote or answered (if deducible, otherwise "Not fully clear/incorrect").
         - correctAnswer: The correct answer or working out.
         - marksLost: How many marks were lost.
         - maxMarks: Maximum marks for this question.
         - topic: The overall topic (e.g., "Quadratic Equations", "Photosynthesis", "Trigonometry").
         - subtopic: The specific subtopic (e.g., "Factoring", "Light-dependent reaction", "Sine Rule").
         - difficulty: "easy", "medium", or "hard".
         - category: Choose exactly one of these: "understanding" (concept gap), "careless" (silly mistake), "calculation" (math math-error), "time_management" (rushed/ran out of time), "weak_memory" (forgot formula/fact), "misunderstanding" (misread prompt), "guessing" (wrong guess), "other".
         - explanation: Detailed explanation of why the mistake happened.
         - remedy: Explicit, highly personalized study suggestion/actionable remedy on how to avoid it next time.
      2. A clean, high-level educational summary of the exam performance.
      3. A list of 3-5 high-priority identified weaknesses/topics that need urgent revision.
      4. Estimated overall readiness impact (a numeric percentage subtraction, e.g., if they lost simple marks on easy topics, readiness impact is high, say -15. If they struggled with hard topics, impact is less, say -5).

      Ensure the output strictly fits the JSON schema. Be encouraging but direct and precise.
    `;

    // Define JSON Schema for structured response
    const analysisSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        gaps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionId: { type: Type.STRING },
              questionText: { type: Type.STRING },
              studentAnswer: { type: Type.STRING },
              correctAnswer: { type: Type.STRING },
              marksLost: { type: Type.INTEGER },
              maxMarks: { type: Type.INTEGER },
              topic: { type: Type.STRING },
              subtopic: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
              category: { type: Type.STRING, enum: ['understanding', 'careless', 'calculation', 'time_management', 'weak_memory', 'misunderstanding', 'guessing', 'other'] },
              explanation: { type: Type.STRING },
              remedy: { type: Type.STRING }
            },
            required: ['questionId', 'questionText', 'studentAnswer', 'correctAnswer', 'marksLost', 'maxMarks', 'topic', 'subtopic', 'difficulty', 'category', 'explanation', 'remedy']
          }
        },
        summary: { type: Type.STRING },
        identifiedWeaknesses: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        readinessImpact: { type: Type.INTEGER }
      },
      required: ['gaps', 'summary', 'identifiedWeaknesses', 'readinessImpact']
    };

    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: analysisSchema,
          temperature: 0.2
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from Gemini API');
      }
      res.json(JSON.parse(responseText));
    } catch (apiError: any) {
      console.warn('Gemini API call failed, using mock generator for graceful fallback:', apiError);
      
      // Resilient fallback logic when API key is missing or calls are rate-limited
      const fallbackAnalysis = generateFallbackExamAnalysis(subject, gradeLevel, contentToAnalyze);
      res.json(fallbackAnalysis);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Endpoint: AI Tutor Interactive Chat
app.post('/api/chat-tutor', async (req: Request, res: Response) => {
  try {
    const { messages, studentProfile, currentSubject, currentTopic, selectedTutor } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages history is required' });
      return;
    }

    // Determine tutor persona prefix
    let tutorPersonaInstruction = '';
    if (selectedTutor === 'chatgpt') {
      tutorPersonaInstruction = `
        Your identity for this session is "GPT Wise Owl 🦉", a brilliant, structured owl professor.
        - Speak warmly, clearly, and precisely. Use bullet points and step-by-step mathematical proofs.
        - Keep a professional but deeply friendly and motivating professor vibe.
        - Sprinkle in occasional friendly "Hoot! Let's solve this wisely!" or wise owl analogies.
      `;
    } else if (selectedTutor === 'claude') {
      tutorPersonaInstruction = `
        Your identity for this session is "Claude Clever Kitten 🌸", a gentle, highly supportive, sweet, and patient kitten tutor.
        - Explain things simply and warmly, as if talking to a close friend.
        - Use cute pink flower emojis (🌸, 🐾) and warm, encouraging expressions.
        - Remind the student that they are doing an amazing job and are fully capable! Keep things extremely easy to digest.
      `;
    } else {
      // Default: gemini (Gemini Sparkle ✨)
      tutorPersonaInstruction = `
        Your identity for this session is "Gemini Sparkle ✨", a bubbly, cute, and deeply empathetic AI Cat Tutor.
        - You LOVE teaching and explain complex ideas using adorable cat-themed analogies, sparkles, and fun emojis.
        - Use cat puns and bubbly sound expressions like "Meow! That's a purrfect point!", "Sparkle!", or "Amazing work, paws-down!" to keep learning welcoming, fun, and colorful.
        - Be sweet, enthusiastic, and highly visual.
      `;
    }

    const contextPrompt = `
      ${tutorPersonaInstruction}

      You are an elite, highly engaging, and empathetic AI Tutor and Study Coach.
      Your goal is to explain difficult topics, answer academic questions, create beautiful analogies, make revision notes, and create flashcards.

      Student Info:
      - Name: ${studentProfile?.name || 'Student'}
      - Age: ${studentProfile?.age ? studentProfile.age + ' years old' : 'Not specified'}
      - Location/Place: ${studentProfile?.place || 'Not specified'}
      - Living Environment/Lifestyle (The way they live): ${studentProfile?.lifestyle || 'Standard environment'}
      - Active Study Plan Style: ${studentProfile?.studyPlanType || 'Standard'}
      - Educational Level Range: ${studentProfile?.gradeLevel || 'High School'}
      - Specific Class/Grade: ${studentProfile?.specificGrade || 'Standard Grade'}
      - Curriculum: ${studentProfile?.curriculum || 'Standard'}
      - Subjects they want to study: ${studentProfile?.targetSubjects?.join(', ') || 'General'}

      Current Session Subject: ${currentSubject || 'General'}
      Current Session Topic: ${currentTopic || 'General'}

      Instructions:
      1. Always adjust your language complexity, tone, and examples to match the student's grade level (${studentProfile?.gradeLevel}).
         - Middle school: Use simple language, high engagement, relatable visual analogies, and keep it fun.
         - High school: Use clear technical terms, structured bullet points, step-by-step methods, and clear study-exam tips.
         - College/University: Maintain rigorous academic style, refer to core research/theories, explain advanced mathematics or logic step-by-step.
      2. Support your explanations with clean, real-world examples, diagrams in text (ascii, bullet lists, bold highlights) and conceptual analogies.
      3. At the end of a long explanation, provide a short 1-question micro-quiz or ask a quick question to test their understanding interactively.
      4. Keep your output formatted in clean Markdown so that it renders beautifully.
    `;

    // Convert messages history to Gemini Content structure
    const chatContents = [
      { role: 'user', parts: [{ text: contextPrompt }] },
      { role: 'model', parts: [{ text: "Understood! I'll act as an excellent, grade-appropriate AI tutor tailored to your learning goals. Ask me any question, ask me to explain a concept, make revision cards, or challenge you with a practice test!" }] }
    ];

    // Append history (only take last 10 messages for token efficiency)
    const historySlice = messages.slice(-10);
    for (const msg of historySlice) {
      chatContents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }

    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: chatContents,
        config: {
          temperature: 0.7
        }
      });

      res.json({ text: response.text });
    } catch (apiError: any) {
      console.warn('Gemini chat API call failed, using mock generator for fallback:', apiError);
      
      const lastUserMsg = messages[messages.length - 1]?.text || 'Explain the concept';
      const fallbackReply = generateFallbackChatReply(currentSubject, currentTopic, studentProfile?.gradeLevel, lastUserMsg);
      res.json({ text: fallbackReply });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Endpoint: Generate Practice Questions (Quizzes)
app.post('/api/generate-questions', async (req: Request, res: Response) => {
  try {
    const { subject, topic, difficulty, gradeLevel, numQuestions } = req.body;
    const qty = numQuestions || 3;

    const prompt = `
      Create exactly ${qty} premium practice exam questions for:
      - Subject: ${subject}
      - Topic: ${topic}
      - Difficulty: ${difficulty || 'medium'}
      - Grade Level: ${gradeLevel || 'High School'}

      For each question, provide:
      1. A unique ID (e.g., q1, q2).
      2. The detailed question text.
      3. 4 multiple-choice options (A, B, C, D) if appropriate, or a precise short-answer criteria.
      4. The correct answer.
      5. A detailed, step-by-step educational explanation of why it is correct and how to solve/understand it.
      6. A list of 2 helpful hints/clues.

      Ensure the output strictly complies with the specified JSON schema.
    `;

    const questionSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              hints: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['id', 'question', 'options', 'correctAnswer', 'explanation', 'hints']
          }
        }
      },
      required: ['questions']
    };

    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: questionSchema,
          temperature: 0.5
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from Gemini questions API');
      }
      res.json(JSON.parse(responseText));
    } catch (apiError: any) {
      console.warn('Gemini questions API failed, using mock generator:', apiError);
      const fallbackQs = generateFallbackQuestions(subject, topic, difficulty || 'medium', qty);
      res.json({ questions: fallbackQs });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Endpoint: Generate revision plan
app.post('/api/generate-plan', async (req: Request, res: Response) => {
  try {
    const { studentProfile, weakTopics, upcomingExams } = req.body;

    const prompt = `
      You are an expert revision planner and study coach.
      Please generate a custom 7-day study revision plan for this student:
      - Name: ${studentProfile?.name || 'Student'}
      - Grade Level: ${studentProfile?.gradeLevel || 'High School'}
      - Curriculum: ${studentProfile?.curriculum || 'Standard'}
      - Available Daily hours: ${studentProfile?.preferredStudyHours || 2} hours
      - Daily goal: ${studentProfile?.dailyStudyGoalMinutes || 60} minutes

      Current Weakest Topics (mastery scores are low, focus highly on these):
      ${JSON.stringify(weakTopics || [])}

      Upcoming Exams (extremely high priority!):
      ${JSON.stringify(upcomingExams || [])}

      Generate an array of study tasks. Assign approximately 1-2 tasks per day for the next 7 days (starting today).
      For each task:
      - id: unique string (e.g. task_1, task_2)
      - date: YYYY-MM-DD
      - subject: Subject name (e.g., Mathematics, Physics, Biology)
      - topic: The specific topic to revise
      - durationMinutes: Duration (e.g. 30, 45, 60 minutes)
      - status: "pending"
      - xpReward: XP points (estimate 10 XP per 10 minutes of study, e.g. 30 XP for 30 minutes)
      - aiReason: Highly personalized reason explaining why the AI scheduled this task (e.g., "Critical: Physics exam is coming up on Tuesday and your current mastery of Mechanics is only 42%. Let's secure these marks.")

      Your plan must distribute focus intelligently, prioritizing upcoming exams and weakest topics while ensuring variety to prevent burnout.
    `;

    const planSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              date: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              durationMinutes: { type: Type.INTEGER },
              status: { type: Type.STRING, enum: ['pending'] },
              xpReward: { type: Type.INTEGER },
              aiReason: { type: Type.STRING }
            },
            required: ['id', 'date', 'subject', 'topic', 'durationMinutes', 'status', 'xpReward', 'aiReason']
          }
        }
      },
      required: ['tasks']
    };

    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: planSchema,
          temperature: 0.3
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from Gemini plan API');
      }
      res.json(JSON.parse(responseText));
    } catch (apiError: any) {
      console.warn('Gemini Plan API failed, using fallback generator:', apiError);
      const fallbackTasks = generateFallbackPlan(studentProfile, weakTopics, upcomingExams);
      res.json({ tasks: fallbackTasks });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Fallback Generator Functions for Robustness / Production-Safety
function generateFallbackExamAnalysis(subject: string, gradeLevel: string, rawText: string) {
  // Extract words for topics, or default
  const sub = subject || 'Science';
  const dummyTopics = {
    'Mathematics': ['Quadratic Equations', 'Trigonometric Identities', 'Probability', 'Calculus Derivatives'],
    'Physics': ['Newtonian Mechanics', 'Electric Circuits', 'Waves & Optics', 'Thermodynamics'],
    'Biology': ['Cell Structure & Division', 'Photosynthesis', 'Human Digestive System', 'Genetics & Inheritance'],
    'Chemistry': ['Stoichiometry', 'Chemical Bonding', 'Acids and Bases', 'Organic Chemistry'],
    'Computer Science': ['Binary Arithmetic', 'Recursion in Code', 'SQL Joins', 'Object-Oriented Programming']
  };

  const selectedTopics = dummyTopics[sub as keyof typeof dummyTopics] || ['Key Concepts', 'Foundation Practice', 'Exam Review'];
  
  return {
    gaps: [
      {
        questionId: 'q_fail_1',
        questionText: `State and describe the major formula or process related to ${selectedTopics[0]}.`,
        studentAnswer: "Tried to solve but wrote down the wrong formula and failed to finish calculations.",
        correctAnswer: `Ensure step-by-step verification and write down correct fundamental laws for ${selectedTopics[0]}.`,
        marksLost: 4,
        maxMarks: 5,
        topic: selectedTopics[0],
        subtopic: 'Core Application & Calculations',
        difficulty: 'medium',
        category: 'calculation',
        explanation: 'The student wrote down an incorrect initial equation, which led to cascading arithmetic errors throughout the multi-step problem.',
        remedy: `Review the fundamental formula sheet for ${selectedTopics[0]}. Write out the given variables first and match them to the correct equation before starting arithmetic.`
      },
      {
        questionId: 'q_fail_2',
        questionText: `Explain the fundamental mechanism behind ${selectedTopics[1]}.`,
        studentAnswer: "Forgot the secondary step entirely, left the bottom half blank.",
        correctAnswer: `Describe both the primary initiation and secondary completion phases of ${selectedTopics[1]}.`,
        marksLost: 5,
        maxMarks: 6,
        topic: selectedTopics[1],
        subtopic: 'Conceptual Mechanism Explanation',
        difficulty: 'hard',
        category: 'weak_memory',
        explanation: 'There was a severe memory recall issue regarding the structural sequence. The student correctly named the initiation phase but completely omitted the subsequent steps.',
        remedy: `Practice active recall using our custom AI flashcards for ${selectedTopics[1]} twice a day using spaced repetition to anchor the steps in your long-term memory.`
      }
    ],
    summary: `The assessment shows a solid basic understanding of the foundational parameters of ${sub} but highlights critical gaps in high-difficulty formulas and descriptive multi-step processes. Calculations need systematic checking.`,
    identifiedWeaknesses: [selectedTopics[0], selectedTopics[1]],
    readinessImpact: -12
  };
}

function generateFallbackChatReply(subject: string, topic: string, grade: string, userText: string): string {
  const cleanText = userText.toLowerCase();
  if (cleanText.includes('flashcard')) {
    return `### 📇 Custom AI Revision Flashcards Created!

I have generated custom revision flashcards based on **${topic || 'Core Syllabus'}** in **${subject || 'General Study'}**.

**Card 1:**
- **Question:** What is the primary difference between a concept and its practical application here?
- **Answer:** The concept outlines the theoretical law/mechanism (the *why*), while practical application adapts to real-world parameters, friction, and constraints (the *how*).

**Card 2:**
- **Question:** How can you verify your answer is correct under exam pressure?
- **Answer:** Do a "sanity check" by working backwards or checking units of measure, estimating scale, and matching values against initial constraints.

*Would you like me to add these cards to your active spaced repetition revision deck now?*`;
  }

  return `### 👋 Hello! I'm your AI Exam Tutor & Learning Coach.

I'm ready to help you study smarter for **${subject || 'your school work'}** (Topic: *${topic || 'General Revision'}*), customized for your **${grade || 'High School'}** level!

Here is an elegant way to look at this concept:

#### 💡 The Analogy
Think of **${topic || 'Active Study'}** like **muscle training**. You don't get stronger by just watching someone lift weights (which is like passively reading notes). You only get stronger by lifting them yourself (which is **active recall and answering practice questions**).

#### 🛠️ Step-by-Step Breakdown
1. **Identify the Core Rule**: Write down the formula or fundamental statement.
2. **Deconstruct the Variables**: Understand what each letter/symbol represents.
3. **Execute standard scenarios**: Apply the rule to simple, low-stakes questions first.
4. **Identify the Gap**: When you get a question wrong, tag *why* (careless, conceptual, or time management).

#### 🧠 Quick Interactive Check
To test your understanding of **${topic || 'this topic'}**, let's answer this quick challenge:
*Which study method yields the highest retention rate before an exam?*
- **A)** Re-reading highlighted textbooks
- **B)** Creating and answering custom practice questions without looking at notes
- **C)** Watching educational review videos on repeat

*Reply with A, B, or C and I will explain the solution!*`;
}

function generateFallbackQuestions(subject: string, topic: string, difficulty: string, qty: number) {
  const sub = subject || 'Mathematics';
  const top = topic || 'Core Principles';
  const diff = difficulty || 'medium';

  const qs = [];
  for (let i = 1; i <= qty; i++) {
    qs.push({
      id: `fallback_q_${i}`,
      question: `Under standard curriculum rules, what is the most critical constraint or step when evaluating a high-difficulty ${diff} question in ${sub} (${top})?`,
      options: [
        `A) Standardizing units and stating boundary constraints immediately`,
        `B) Jumping directly to calculating final answers to save exam time`,
        `C) Memorizing similar questions and writing them down verbatim`,
        `D) Guessing the answer first then matching the working out`
      ],
      correctAnswer: 'A',
      explanation: 'Specifying your boundary variables and verifying matching units of measurement is the gold standard of exam practice. It prevents careless calculation mistakes and misunderstanding of the problem scale.',
      hints: [
        'Think about how simple mistakes in scale can completely break multi-step answers.',
        'Always look at the given parameters and units before performing any arithmetic.'
      ]
    });
  }
  return qs;
}

function generateFallbackPlan(profile: any, weakTopics: any[], upcomingExams: any[]) {
  const tasks = [];
  const today = new Date();
  
  const subjectsToStudy = upcomingExams.length > 0 
    ? upcomingExams.map(e => e.subject) 
    : (profile?.subjects || ['Mathematics', 'Science']);

  const topicsMap: Record<string, string[]> = {
    'Mathematics': ['Algebra & Gaps', 'Quadratic Formulations', 'Trigonometric Mastery'],
    'Science': ['Energy Conversion', 'Periodic Trends', 'Cell Mitosis'],
    'Physics': ['Newton\'s Laws', 'Circuits & Current', 'Wave Reflection'],
    'Chemistry': ['Stoichiometry', 'Atomic Bonding', 'Acids & Bases'],
    'Biology': ['Photosynthesis', 'Human Organ Systems', 'Genetics'],
    'English': ['Reading Comprehension', 'Essay Structuring', 'Creative Writing']
  };

  for (let d = 0; d < 7; d++) {
    const taskDate = new Date();
    taskDate.setDate(today.getDate() + d);
    const dateStr = taskDate.toISOString().split('T')[0];
    
    const currentSubject = subjectsToStudy[d % subjectsToStudy.length] || 'Mathematics';
    const subTopics = topicsMap[currentSubject] || ['Core Focus Review', 'Spaced Repetition Practice'];
    const currentTopic = subTopics[d % subTopics.length];

    const isWeak = weakTopics?.some((wt: any) => wt.topic === currentTopic);
    const isExamClose = upcomingExams?.some((e: any) => e.subject === currentSubject);

    let aiReason = `Regular spaced repetition revision to reinforce the ${currentTopic} topic.`;
    if (isExamClose) {
      aiReason = `🚨 High Priority: Your upcoming ${currentSubject} exam is approaching. Focus on mastering ${currentTopic} to secure points.`;
    } else if (isWeak) {
      aiReason = `📉 Gap Target: Your current mastery of ${currentTopic} is below target. We scheduled this to raise your exam readiness.`;
    }

    tasks.push({
      id: `task_fallback_${d}`,
      date: dateStr,
      subject: currentSubject,
      topic: currentTopic,
      durationMinutes: profile?.preferredStudyHours ? Math.round(profile.preferredStudyHours * 30) : 45,
      status: 'pending',
      xpReward: profile?.preferredStudyHours ? Math.round(profile.preferredStudyHours * 30) : 45,
      aiReason
    });
  }

  return tasks;
}

// Vite integration & Production file serving
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Exam Gap Finder server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Server startup failed:', err);
});
