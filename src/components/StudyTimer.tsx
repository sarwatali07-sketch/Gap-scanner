import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Award, 
  Sparkles, 
  Clock, 
  Timer, 
  Trophy, 
  Zap,
  Info,
  Bell,
  Volume2,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudyTimerProps {
  studentProfile: StudentProfile;
  onAwardXp: (xpAmount: number) => void;
  onEarnBadge: (badgeName: string) => void;
}

interface AchievementBadge {
  name: string;
  desc: string;
  xpReward: number;
  icon: string;
  unlocked: boolean;
}

export default function StudyTimer({ studentProfile, onAwardXp, onEarnBadge }: StudyTimerProps) {
  const [mode, setMode] = useState<'study' | 'short_break' | 'long_break'>('study');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalFocusCompleted, setTotalFocusCompleted] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [xpBonusGained, setXpBonusGained] = useState(0);

  // Reminders and sound alarm states
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  // Plays a beautiful, warm, synthesized crystal chime sequence when timer finishes
  const playAestheticChime = () => {
    if (!alarmEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Note 1: G5 (784Hz) - Soft attack
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime);
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.6);

      // Note 2: C6 (1046.5Hz) - Delayed offset
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.85);

      // Note 3: E6 (1318.5Hz) - Highest note delayed
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.3);
      gain3.gain.setValueAtTime(0, ctx.currentTime);
      gain3.gain.setValueAtTime(0.25, ctx.currentTime + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(ctx.currentTime + 0.3);
      osc3.stop(ctx.currentTime + 1.2);

    } catch (err) {
      console.warn('Audio synthesis could not start:', err);
    }
  };

  // Triggers browser push notification
  const triggerNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          tag: 'exam-gap-finder-timer',
          requireInteraction: true
        });
      } catch (err) {
        console.warn('Web notification failed inside restricted frame.', err);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert("Notifications are not supported on this browser.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (e) {
      console.warn("Could not request notification inside frame.", e);
    }
  };

  // Synchronized static achievements state
  const badges: AchievementBadge[] = [
    { name: 'Pioneer', desc: 'Successfully completed initial setup profile onboarding.', xpReward: 100, icon: '🚀', unlocked: studentProfile.badges.includes('Pioneer') },
    { name: 'Focus Master', desc: 'Complete at least one full 25-minute Pomodoro study session.', xpReward: 150, icon: '⏱️', unlocked: studentProfile.badges.includes('Focus Master') || totalFocusCompleted >= 1 },
    { name: 'Quiz Champion', desc: 'Score a perfect grade (100%) on any AI practice quiz.', xpReward: 200, icon: '🏆', unlocked: studentProfile.badges.includes('Quiz Champion') },
    { name: 'Paper Breaker', desc: 'Upload and perform AI OCR gap analysis on an exam paper.', xpReward: 200, icon: '📂', unlocked: studentProfile.badges.includes('Paper Breaker') },
    { name: 'Streak Star', desc: 'Maintain an active study streak for 3 consecutive days.', xpReward: 300, icon: '🔥', unlocked: studentProfile.badges.includes('Streak Star') || studentProfile.streak >= 3 }
  ];

  useEffect(() => {
    let timer: any = null;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    let rewardXp = 0;

    // Play the lovely audio chime & send browser reminders
    playAestheticChime();

    if (mode === 'study') {
      rewardXp = 50; // standard Pomodoro study reward
      setTotalFocusCompleted(prev => prev + 1);
      onAwardXp(rewardXp);
      setXpBonusGained(rewardXp);
      setShowCelebration(true);
      
      triggerNotification(
        "🌸 Focus Block Complete!", 
        "Fantastic work! You earned +50 XP. Take a short 5-minute break now to stretch!"
      );

      // Unlock badge automatically
      if (!studentProfile.badges.includes('Focus Master')) {
        onEarnBadge('Focus Master');
      }
    } else {
      rewardXp = 10; // break bonus
      onAwardXp(rewardXp);
      setXpBonusGained(rewardXp);
      setShowCelebration(true);

      triggerNotification(
        "☕ Break is Over!", 
        "Welcome back! Ready to conquer another focused study session?"
      );
    }

    // Toggle back to appropriate modes
    if (mode === 'study') {
      setMode('short_break');
      setSecondsLeft(5 * 60);
    } else {
      setMode('study');
      setSecondsLeft(25 * 60);
    }
  };

  const handleModeChange = (newMode: typeof mode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'study') {
      setSecondsLeft(25 * 60);
    } else if (newMode === 'short_break') {
      setSecondsLeft(5 * 60);
    } else {
      setSecondsLeft(15 * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    handleModeChange(mode);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = mode === 'study'
    ? ((25 * 60 - secondsLeft) / (25 * 60)) * 100
    : mode === 'short_break'
      ? ((5 * 60 - secondsLeft) / (5 * 60)) * 100
      : ((15 * 60 - secondsLeft) / (15 * 60)) * 100;

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6" id="timer_workspace">
      
      {/* Visual Clock Panel */}
      <div className="md:col-span-3 bg-white rounded-[24px] border border-purple-100/60 shadow-sm p-6 flex flex-col items-center justify-center min-h-[380px]" id="clock_card">
        
        {/* Friendly explanation text added to make the website feel richer */}
        <div className="text-center max-w-md mb-6" id="timer_intro_header">
          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 uppercase tracking-wider">🌸 Dynamic Focus Room</span>
          <h3 className="text-lg font-bold text-slate-800 mt-2">Study & Rest Pomodoro</h3>
          <p className="text-xs text-slate-400 mt-1">
            Keep your mind fresh! Work intently for 25 minutes, then enjoy a cute 5-minute coffee break. Your streak & badges are updated automatically!
          </p>
        </div>

        {/* Tab-styled clock mode switches */}
        <div className="flex gap-1.5 p-1 bg-purple-50 rounded-xl mb-8" id="clock_mode_switches">
          <button
            id="mode_study"
            onClick={() => handleModeChange('study')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              mode === 'study' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-purple-650 hover:text-purple-850 hover:bg-purple-50/50'
            }`}
          >
            Study Focus (25m)
          </button>
          <button
            id="mode_short"
            onClick={() => handleModeChange('short_break')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              mode === 'short_break' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-purple-650 hover:text-purple-850 hover:bg-purple-50/50'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            id="mode_long"
            onClick={() => handleModeChange('long_break')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              mode === 'long_break' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-purple-650 hover:text-purple-850 hover:bg-purple-50/50'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Big Circular Dial Visual */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-8" id="clock_dial">
          {/* Animated background rings */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle 
              cx="96" 
              cy="96" 
              r="84" 
              stroke="#faf5ff" 
              strokeWidth="6" 
              fill="transparent" 
            />
            <motion.circle 
              cx="96" 
              cy="96" 
              r="84" 
              stroke="#a855f7" 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray={2 * Math.PI * 84}
              strokeDashoffset={2 * Math.PI * 84 * (1 - progressPercentage / 100)}
              transition={{ ease: 'linear' }}
            />
          </svg>
          
          <div className="text-center" id="clock_digits_group">
            <span className="text-4xl font-extrabold text-slate-800 tracking-tight font-mono block">
              {formatTime(secondsLeft)}
            </span>
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mt-1 block">
              {mode === 'study' ? '🔥 FOCUS TIME' : '☕ REST BREAK'}
            </span>
          </div>
        </div>

        {/* Controls block */}
        <div className="flex gap-4 items-center" id="clock_buttons">
          <button
            id="timer_reset_btn"
            onClick={resetTimer}
            className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-100 text-purple-600 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            id="timer_play_pause_btn"
            onClick={toggleTimer}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer ${
              isRunning ? 'bg-purple-750 hover:bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
        </div>

        {/* Rewards and level-up congratulations popup modal */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bg-slate-900/95 text-white p-6 rounded-2xl shadow-xl max-w-xs text-center space-y-3 z-30"
              id="congrats_celebration_popup"
            >
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-spin" />
              <h4 className="font-extrabold text-base text-amber-400">Pomodoro Completed!</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                You studied with perfect focus! You gained +{xpBonusGained} XP multiplier towards your study level. Keep going!
              </p>
              <button
                id="close_celebration_btn"
                onClick={() => setShowCelebration(false)}
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Awesome!
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Badges and XP level metrics panel */}
      <div className="md:col-span-2 space-y-4" id="badges_card">
        
        {/* XP counters */}
        <div className="bg-white rounded-[24px] border border-purple-100/60 shadow-sm p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Gamified Level</div>
              <h4 className="text-base font-extrabold text-slate-800">
                Level {Math.floor(studentProfile.xp / 400) + 1}
              </h4>
              <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${(studentProfile.xp % 400) / 4}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total XP</span>
            <span className="text-lg font-black text-purple-600">{studentProfile.xp} XP</span>
          </div>
        </div>

        {/* Cute Alarm & Reminder Center */}
        <div className="bg-purple-50/60 border border-purple-100/80 rounded-[24px] p-5 space-y-3" id="alarm_settings_card">
          <h4 className="font-bold text-purple-950 text-sm flex items-center gap-2">
            <BellRing className="w-4.5 h-4.5 text-purple-600 animate-pulse" />
            Reminders & Sound Center
          </h4>
          <p className="text-[11px] text-purple-900/70 leading-relaxed">
            Need a helpful tap? Enable browser push reminders and cute chimes so you can hear your phone or computer ring the second your study session concludes!
          </p>

          <div className="space-y-2.5 pt-1">
            {/* Permission status button */}
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-purple-150/50 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Bell className="w-4 h-4 text-purple-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">Device Reminders</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {notificationPermission === 'granted' ? '🌸 Active on Device!' : '⚠️ Tap to Request'}
                  </span>
                </div>
              </div>
              {notificationPermission !== 'granted' ? (
                <button
                  id="request_notif_btn"
                  onClick={requestNotificationPermission}
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[9px] font-bold transition-all shrink-0 cursor-pointer"
                >
                  Enable
                </button>
              ) : (
                <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100 shrink-0">Active</span>
              )}
            </div>

            {/* Sound Chimes toggle */}
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-purple-150/50 shadow-xs">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">Chime Alarm</span>
                  <span className="text-[10px] text-slate-400 block">Melodious chime when done</span>
                </div>
              </div>
              <button
                id="toggle_alarm_btn"
                onClick={() => setAlarmEnabled(!alarmEnabled)}
                className={`w-10 h-6 rounded-full p-0.5 transition-all relative ${alarmEnabled ? 'bg-purple-600' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-all ${alarmEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Gamified Achievements Box */}
        <div className="bg-white rounded-[24px] border border-purple-100/60 shadow-sm p-5 space-y-3">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-purple-50 pb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            Your Achievement Badges
          </h4>

          <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1" id="achievements_list">
            {badges.map((b) => (
              <div 
                key={b.name}
                className={`flex gap-3 p-3 rounded-2xl border transition-all ${
                  b.unlocked 
                    ? 'bg-purple-50/30 border-purple-100' 
                    : 'bg-white border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div className="text-2xl shrink-0 mt-0.5">{b.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className={`text-xs font-bold truncate ${b.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                      {b.name}
                    </h5>
                    {b.unlocked ? (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase shrink-0">Unlocked</span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">+{b.xpReward} XP</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
