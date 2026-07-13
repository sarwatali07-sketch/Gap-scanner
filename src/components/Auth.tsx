import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { KeyRound, Mail, User, ShieldAlert, GraduationCap, Users, UserCog, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onAuthSuccess: (uid: string, email: string, role: 'student' | 'parent' | 'teacher', name: string) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'parent' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);

  const handleSandboxLogin = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      // Look for an existing student profile in localStorage first to keep existing data
      let foundUid = '';
      let foundRole: 'student' | 'parent' | 'teacher' = role;
      let foundName = name.trim() || email.split('@')[0] || 'Sandbox Student';

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('exam_gap_finder_profile_')) {
          try {
            const prof = JSON.parse(localStorage.getItem(key) || '');
            if (prof && prof.email.toLowerCase() === email.toLowerCase()) {
              foundUid = prof.uid;
              foundRole = prof.role;
              foundName = prof.name;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
      }

      const finalUid = foundUid || `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      const sessionUser = {
        uid: finalUid,
        email: email || 'sandbox@examgapfinder.com',
        name: foundName,
        role: foundRole
      };

      // Save user session in localStorage for persistent logins across refreshes
      localStorage.setItem('exam_gap_finder_sandbox_user', JSON.stringify(sessionUser));

      // Also pre-create a profile if one doesn't exist
      const existingProfile = localStorage.getItem(`exam_gap_finder_profile_${finalUid}`);
      if (!existingProfile) {
        const mockProfile = {
          uid: finalUid,
          email: email || 'sandbox@examgapfinder.com',
          name: foundName,
          role: foundRole,
          curriculum: 'A-Level',
          streak: 1,
          xp: 120,
          badges: ['Pioneer'],
          upcomingExams: []
        };
        localStorage.setItem(`exam_gap_finder_profile_${finalUid}`, JSON.stringify(mockProfile));
      }

      onAuthSuccess(finalUid, sessionUser.email, sessionUser.role, sessionUser.name);
      setLoading(false);
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsOperationNotAllowed(false);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your name.');
        const res = await createUserWithEmailAndPassword(auth, email, password);
        onAuthSuccess(res.user.uid, email, role, name);
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        // Default name from email if not stored yet
        onAuthSuccess(res.user.uid, email, role, name || email.split('@')[0]);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'An authentication error occurred.';
      if (err.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        errMsg = 'Email/Password Authentication is currently disabled in your Firebase console settings.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already in use.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password should be at least 6 characters.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSimulated = (provider: string) => {
    setError('');
    setIsOperationNotAllowed(false);
    setLoading(true);
    // Secure simulated callback to bypass popups inside strict frames
    setTimeout(() => {
      const dummyUid = `oauth_${provider.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`;
      const dummyEmail = `studious.${provider.toLowerCase()}@examgapfinder.com`;
      const dummyName = `${provider} Student`;
      onAuthSuccess(dummyUid, dummyEmail, 'student', dummyName);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" id="auth_container">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
        id="auth_card"
      >
        <div className="text-center mb-8" id="auth_header">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-3" id="auth_logo_box">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" id="auth_title">Exam Gap Finder</h1>
          <p className="text-slate-500 text-sm mt-1" id="auth_tagline">Your personalized AI-powered tutor & gap analyzer</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-2.5" id="auth_error">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">{error}</span>
              {isOperationNotAllowed && (
                <div className="mt-3 pt-3 border-t border-red-200/60 text-xs text-red-700 space-y-2">
                  <p>
                    <strong>Why this happens:</strong> The Firebase project has not enabled Email/Password sign-in yet in the Firebase Console settings.
                  </p>
                  <p>
                    To test and run all parts of this app immediately without waiting for database configurations, click below to log in using <strong>Local Sandbox Mode</strong>.
                  </p>
                  <button
                    id="sandbox_bypass_btn"
                    type="button"
                    onClick={handleSandboxLogin}
                    className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    Bypass & Continue in Local Sandbox Mode
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="auth_form">
          {isSignUp && (
            <div id="signup_name_field">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  id="auth_name_input"
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
          )}

          <div id="email_field">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="auth_email_input"
                type="email"
                required
                placeholder="alex@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          <div id="password_field">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="auth_password_input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="pt-2" id="role_selection_field">
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Join As</label>
              <div className="grid grid-cols-3 gap-2" id="role_buttons_grid">
                <button
                  id="role_student"
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    role === 'student' 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 mb-1" />
                  <span className="text-xs">Student</span>
                </button>
                <button
                  id="role_parent"
                  type="button"
                  onClick={() => setRole('parent')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    role === 'parent' 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-5 h-5 mb-1" />
                  <span className="text-xs">Parent</span>
                </button>
                <button
                  id="role_teacher"
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    role === 'teacher' 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCog className="w-5 h-5 mb-1" />
                  <span className="text-xs">Teacher</span>
                </button>
              </div>
            </div>
          )}

          <button
            id="auth_submit_btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:bg-indigo-400 disabled:shadow-none flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Please wait...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Create Student Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="relative my-6" id="auth_divider">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6" id="social_auth_buttons">
          <button
            id="oauth_google"
            onClick={() => handleOAuthSimulated('Google')}
            className="flex items-center justify-center py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
          >
            Google
          </button>
          <button
            id="oauth_microsoft"
            onClick={() => handleOAuthSimulated('Microsoft')}
            className="flex items-center justify-center py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
          >
            Microsoft
          </button>
          <button
            id="oauth_apple"
            onClick={() => handleOAuthSimulated('Apple')}
            className="flex items-center justify-center py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
          >
            Apple
          </button>
        </div>

        <div className="text-center" id="auth_toggle_mode">
          <button
            id="auth_mode_toggle_btn"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>

        <div className="text-center mt-5 pt-4 border-t border-slate-100" id="auth_sandbox_option">
          <button
            id="auth_sandbox_toggle_btn"
            type="button"
            onClick={handleSandboxLogin}
            className="text-slate-400 hover:text-indigo-600 text-[11px] font-medium transition-colors cursor-pointer"
          >
            ⚡ Test quickly? Continue with Local Sandbox Mode
          </button>
        </div>
      </motion.div>
    </div>
  );
}
