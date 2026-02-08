
import React, { useState, useEffect, useRef } from 'react';
import { Tabs } from '../ui/Tabs';

// --- Sound Helper ---
const playAlarm = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

// --- Standard Circle Button Component ---
const CircleButton: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  color: 'teal' | 'amber' | 'rose' | 'slate' | 'indigo';
  size?: 'lg' | 'md';
  icon: React.ReactNode;
}> = ({ onClick, disabled, color, size = 'lg', icon }) => {
  
  const colorMap = {
    teal: 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-200',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
    rose: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200',
    slate: 'bg-slate-200 hover:bg-slate-300 text-slate-600 shadow-slate-200',
    indigo: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-200',
  };

  const dim = size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';
  const iconSize = size === 'lg' ? 32 : 24;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${dim} rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-md
        ${colorMap[color]}
      `}
    >
      {React.cloneElement(icon as React.ReactElement, { width: iconSize, height: iconSize })}
    </button>
  );
};

// --- Clock Component ---
const Clock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-3xl p-10 shadow-lg border border-slate-100">
      <div className="text-xl md:text-2xl text-slate-500 font-bold mb-6 bg-slate-50 px-8 py-2 rounded-full border border-slate-200">
        {formatDate(now)}
      </div>
      <div className="text-6xl md:text-9xl font-bold text-slate-800 tracking-wider font-mono tabular-nums">
        {formatTime(now)}
      </div>
    </div>
  );
};

// --- Timer Component ---
const Timer: React.FC = () => {
  const [duration, setDuration] = useState(180); // Default 3 min
  const [timeLeft, setTimeLeft] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  
  const requestRef = useRef<number>();

  useEffect(() => {
    if (isRunning && endTime) {
      const animate = () => {
        const now = Date.now();
        const left = Math.max(0, Math.ceil((endTime - now) / 1000));
        
        setTimeLeft(left);

        if (left <= 0) {
          setIsRunning(false);
          setEndTime(null);
          playAlarm();
        } else {
          requestRef.current = requestAnimationFrame(animate);
        }
      };
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, endTime]);

  const startTimer = () => {
    if (timeLeft <= 0) return;
    setEndTime(Date.now() + timeLeft * 1000);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setEndTime(null);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setEndTime(null);
    setTimeLeft(duration);
  };

  const setPreset = (seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    setEndTime(null);
  };

  const addTime = (seconds: number) => {
    const newTime = timeLeft + seconds;
    setDuration(newTime); 
    setTimeLeft(newTime);
    if (isRunning && endTime) {
        setEndTime(endTime + seconds * 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (timeLeft / duration) * 100 : 0;
  const strokeDashoffset = 283 - (283 * progress) / 100;

  return (
    <div className="flex flex-col items-center bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
       <div className="relative w-72 h-72 md:w-80 md:h-80 mb-8 flex items-center justify-center">
         {/* Ring Background */}
         <div className="absolute inset-0 rounded-full border-[6px] border-slate-100"></div>

         <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle 
                cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" 
                className={`text-teal-400 transition-all duration-1000 ease-linear ${timeLeft === 0 ? 'opacity-0' : 'opacity-100'}`}
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
            />
         </svg>
         
         <div className="z-10 text-center">
            {isRunning ? (
                <div className="text-6xl md:text-7xl font-bold text-slate-800 font-mono tracking-tighter">
                    {formatTime(timeLeft)}
                </div>
            ) : (
                <div className="flex items-center justify-center gap-2">
                   <div className="flex flex-col items-center bg-slate-50 rounded-xl p-2 border border-slate-200">
                       <input 
                         type="number" 
                         className="w-20 text-center text-4xl font-bold bg-transparent border-none focus:ring-0 text-slate-700 outline-none p-1"
                         value={Math.floor(timeLeft / 60)}
                         onChange={(e) => {
                             const min = Math.max(0, parseInt(e.target.value) || 0);
                             const sec = timeLeft % 60;
                             const total = min * 60 + sec;
                             setDuration(total);
                             setTimeLeft(total);
                         }}
                       />
                       <span className="text-[10px] font-bold text-slate-400">MIN</span>
                   </div>
                   <span className="text-3xl font-bold text-slate-300 pb-4">:</span>
                   <div className="flex flex-col items-center bg-slate-50 rounded-xl p-2 border border-slate-200">
                       <input 
                         type="number" 
                         className="w-20 text-center text-4xl font-bold bg-transparent border-none focus:ring-0 text-slate-700 outline-none p-1"
                         value={timeLeft % 60}
                         onChange={(e) => {
                             const sec = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                             const min = Math.floor(timeLeft / 60);
                             const total = min * 60 + sec;
                             setDuration(total);
                             setTimeLeft(total);
                         }}
                       />
                       <span className="text-[10px] font-bold text-slate-400">SEC</span>
                   </div>
                </div>
            )}
         </div>
       </div>

       <div className="flex gap-6 mb-10">
          {!isRunning ? (
            <CircleButton 
                onClick={startTimer}
                disabled={timeLeft <= 0}
                color="teal"
                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
            />
          ) : (
            <CircleButton 
                onClick={pauseTimer}
                color="amber"
                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
            />
          )}
          <CircleButton 
            onClick={resetTimer}
            color="slate"
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>}
          />
       </div>

       <div className="flex flex-col gap-4 w-full max-w-md">
         <div className="grid grid-cols-4 gap-2">
           {[
               { label: '3分', val: 180 }, 
               { label: '5分', val: 300 }, 
               { label: '10分', val: 600 }, 
               { label: '25分', val: 1500 }
           ].map(p => (
              <button 
                  key={p.label}
                  onClick={() => setPreset(p.val)}
                  className="py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all text-sm font-bold shadow-sm"
              >
                  {p.label}
              </button>
           ))}
         </div>
         <div className="grid grid-cols-4 gap-2">
           {[
               { label: '+10秒', val: 10 }, 
               { label: '+1分', val: 60 }, 
               { label: '+5分', val: 300 }, 
               { label: '+10分', val: 600 }
           ].map(p => (
              <button 
                  key={p.label}
                  onClick={() => addTime(p.val)}
                  className="py-2 bg-transparent border border-slate-200 rounded-xl text-teal-600 hover:bg-slate-50 transition-colors text-xs font-bold"
              >
                  {p.label}
              </button>
           ))}
         </div>
       </div>
    </div>
  );
};

// --- Pomodoro Component ---
const Pomodoro: React.FC = () => {
  // Settings State (in minutes)
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [cycles, setCycles] = useState(0);
  
  const requestRef = useRef<number>();

  // Helper to get total seconds based on current settings
  const getDuration = (m: 'work' | 'break') => {
    return m === 'work' ? workMinutes * 60 : breakMinutes * 60;
  };

  // Effect: Update timeLeft if settings change and NOT running
  useEffect(() => {
    if (!isRunning) {
      // If we are currently in 'work' mode, update to new work minutes
      // If in 'break' mode, update to new break minutes
      setTimeLeft(getDuration(mode));
    }
  }, [workMinutes, breakMinutes]);

  useEffect(() => {
    if (isRunning && endTime) {
      const animate = () => {
        const now = Date.now();
        const left = Math.max(0, Math.ceil((endTime - now) / 1000));
        
        setTimeLeft(left);

        if (left <= 0) {
          setIsRunning(false);
          setEndTime(null);
          playAlarm();
          
          // Switch mode
          if (mode === 'work') {
            const nextMode = 'break';
            setMode(nextMode);
            setTimeLeft(getDuration(nextMode));
            setCycles(c => c + 1);
          } else {
            const nextMode = 'work';
            setMode(nextMode);
            setTimeLeft(getDuration(nextMode));
          }
        } else {
          requestRef.current = requestAnimationFrame(animate);
        }
      };
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, endTime, mode, workMinutes, breakMinutes]);

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      setEndTime(null);
    } else {
      setEndTime(Date.now() + timeLeft * 1000);
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setEndTime(null);
    setMode('work');
    setTimeLeft(getDuration('work'));
    setCycles(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentDuration = getDuration(mode);
  const progress = (timeLeft / currentDuration) * 100;
  const strokeDashoffset = 283 - (283 * progress) / 100;

  return (
    <div className="flex flex-col items-center bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
      <div className="mb-8 flex gap-3 bg-slate-100 p-1.5 rounded-full shadow-inner">
        <span className={`px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${mode === 'work' ? 'bg-rose-500 text-white shadow-rose-300' : 'text-slate-400 hover:text-slate-600'}`}>
          集中タイム
        </span>
        <span className={`px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${mode === 'break' ? 'bg-emerald-500 text-white shadow-emerald-300' : 'text-slate-400 hover:text-slate-600'}`}>
          休憩タイム
        </span>
      </div>

      <div className="relative w-72 h-72 md:w-80 md:h-80 mb-8 flex items-center justify-center">
         {/* Background Track */}
         <div className="absolute inset-0 rounded-full border-[6px] border-slate-100"></div>

         <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle 
                cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" 
                className={`transition-all duration-1000 ease-linear ${mode === 'work' ? 'text-rose-400' : 'text-emerald-400'}`}
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
            />
         </svg>
         
         <div className="z-10 text-center">
            <div className="text-6xl md:text-7xl font-bold text-slate-800 font-mono tracking-tighter">
                {formatTime(timeLeft)}
            </div>
            <div className={`text-xs font-bold mt-2 uppercase tracking-widest ${mode === 'work' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {mode === 'work' ? 'FOCUS' : 'RELAX'}
            </div>
         </div>
      </div>

      <div className="flex gap-6 mb-8">
        <CircleButton 
            onClick={toggleTimer}
            color={isRunning ? 'slate' : 'indigo'}
            icon={isRunning ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
        />
        <CircleButton 
          onClick={resetTimer}
          color="slate"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>}
        />
      </div>

      {/* Settings Panel */}
      <div className="w-full max-w-sm bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
         <h4 className="text-xs font-bold text-slate-400 mb-3 text-center uppercase tracking-wider">Settings</h4>
         <div className="flex gap-4">
            <div className="flex-1">
               <label className="block text-xs font-bold text-slate-500 mb-1 pl-1">集中 (分)</label>
               <input 
                 type="number" 
                 min="1"
                 max="60"
                 value={workMinutes}
                 onChange={(e) => setWorkMinutes(Math.max(1, parseInt(e.target.value) || 25))}
                 disabled={isRunning}
                 className="w-full text-center p-3 rounded-xl border border-white bg-white font-bold text-slate-700 shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none disabled:opacity-50"
               />
            </div>
            <div className="flex-1">
               <label className="block text-xs font-bold text-slate-500 mb-1 pl-1">休憩 (分)</label>
               <input 
                 type="number" 
                 min="1"
                 max="60"
                 value={breakMinutes}
                 onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 5))}
                 disabled={isRunning}
                 className="w-full text-center p-3 rounded-xl border border-white bg-white font-bold text-slate-700 shadow-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none disabled:opacity-50"
               />
            </div>
         </div>
      </div>

      <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 text-slate-500 text-sm font-bold flex items-center gap-2 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34"/><path d="M14 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34"/><path d="M18 9V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4Z"/></svg>
        完了したサイクル: <span className="text-indigo-600 text-lg">{cycles}</span>
      </div>
    </div>
  );
};

// --- Stopwatch Component ---
const Stopwatch: React.FC = () => {
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [laps, setLaps] = useState<number[]>([]);

    const requestRef = useRef<number>();

    useEffect(() => {
        if (isRunning && startTime) {
            const animate = () => {
                const now = Date.now();
                setElapsed(now - startTime);
                requestRef.current = requestAnimationFrame(animate);
            };
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isRunning, startTime]);

    const handleStart = () => {
        setStartTime(Date.now() - elapsed);
        setIsRunning(true);
    };

    const handleStop = () => {
        setIsRunning(false);
        setStartTime(null);
    };

    const handleReset = () => {
        setIsRunning(false);
        setStartTime(null);
        setElapsed(0);
        setLaps([]);
    };

    const handleLap = () => {
        setLaps(prev => [elapsed, ...prev]);
    };

    const formatTime = (ms: number) => {
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        const centi = Math.floor((ms % 1000) / 10);
        
        return (
            <div className="font-mono tabular-nums flex items-baseline justify-center text-slate-800">
              <span className="text-6xl md:text-7xl font-bold w-[1.8em] text-right">{String(min).padStart(2, '0')}</span>
              <span className="text-4xl md:text-5xl font-bold text-slate-300 mx-1">:</span>
              <span className="text-6xl md:text-7xl font-bold w-[1.8em] text-right">{String(sec).padStart(2, '0')}</span>
              <span className="text-4xl md:text-5xl font-bold text-slate-300 mx-1">.</span>
              <span className="text-4xl md:text-5xl font-bold text-teal-500 w-[1.5em] text-left">{String(centi).padStart(2, '0')}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center bg-white rounded-3xl p-8 shadow-lg border border-slate-100 min-h-[400px]">
            <div className="flex-1 flex items-center justify-center mb-10 w-full">
                {formatTime(elapsed)}
            </div>

            <div className="flex gap-6 mb-8">
                 {!isRunning ? (
                    <CircleButton 
                        onClick={handleStart}
                        color="teal"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
                    />
                 ) : (
                    <CircleButton 
                        onClick={handleStop}
                        color="amber"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
                    />
                 )}
                 <CircleButton 
                    onClick={handleLap}
                    disabled={!isRunning}
                    color="indigo"
                    size="md"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/></svg>}
                 />
                 <CircleButton 
                    onClick={handleReset}
                    color="slate"
                    size="md"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>}
                 />
            </div>

            {/* Laps */}
            <div className="w-full max-w-sm max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {laps.map((lap, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-slate-600 font-mono font-bold">
                        <span className="text-xs text-slate-400">LAP {laps.length - i}</span>
                        <span>{String(Math.floor(lap / 60000)).padStart(2,'0')}:{String(Math.floor((lap % 60000) / 1000)).padStart(2,'0')}.{String(Math.floor((lap % 1000) / 10)).padStart(2,'0')}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TimeManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('clock');

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          時間管理ツール
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </h2>
        <p className="text-slate-500">
          時計、タイマー、ポモドーロ、ストップウォッチをひとつに。
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <Tabs 
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'clock', label: '時計', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { id: 'timer', label: 'タイマー', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4"/><path d="M12 14v-4"/><path d="M4 13a8 8 0 0 1 8-7 6 6 0 0 1 3.6 1.6"/><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> },
            { id: 'pomodoro', label: 'ポモドーロ', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9 9 0 0 0-9 9v1a9 9 0 0 0 18 0v-1a9 9 0 0 0-9-9Z"/><path d="M12 2v6"/><path d="M12 12h.01"/></svg> },
            { id: 'stopwatch', label: 'ストップウォッチ', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          ]}
          className="bg-slate-100/50 border border-slate-200 shadow-sm"
        />
      </div>

      <div className="max-w-2xl mx-auto">
        {activeTab === 'clock' && <Clock />}
        {activeTab === 'timer' && <Timer />}
        {activeTab === 'pomodoro' && <Pomodoro />}
        {activeTab === 'stopwatch' && <Stopwatch />}
      </div>
    </div>
  );
};

export default TimeManager;
