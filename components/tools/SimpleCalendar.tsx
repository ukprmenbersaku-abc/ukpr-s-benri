
import React, { useState, useEffect } from 'react';

interface EventData {
  [date: string]: string;
}

const SimpleCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventData>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('simple-calendar-events');
    if (savedData) {
      try {
        setEvents(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to load calendar data", e);
      }
    }
  }, []);

  // Save to LocalStorage whenever events change
  useEffect(() => {
    localStorage.setItem('simple-calendar-events', JSON.stringify(events));
  }, [events]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDayClick = (day: number) => {
    const key = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(key);
    setNoteInput(events[key] || '');
    setIsModalOpen(true);
  };

  const saveNote = () => {
    if (selectedDate) {
      setEvents(prev => {
        const newEvents = { ...prev };
        if (noteInput.trim()) {
          newEvents[selectedDate] = noteInput;
        } else {
          delete newEvents[selectedDate];
        }
        return newEvents;
      });
    }
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const blob = new Blob([dataStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar_backup_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (typeof parsed === 'object') {
          if (confirm('現在のデータを上書きして、ファイルを読み込みますか？')) {
             setEvents(parsed);
          }
        } else {
          alert('ファイルの形式が正しくありません。');
        }
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。JSON形式のテキストファイルを選択してください。');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50 border-b border-r border-slate-100"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateKey(year, month, d);
      const isToday = isCurrentMonth && today.getDate() === d;
      const hasNote = !!events[dateKey];
      
      days.push(
        <div 
          key={d} 
          onClick={() => handleDayClick(d)}
          className={`h-24 md:h-32 border-b border-r border-slate-100 p-2 cursor-pointer transition-colors relative group hover:bg-violet-50 ${isToday ? 'bg-indigo-50/50' : 'bg-white'}`}
        >
          <div className="flex justify-between items-start">
             <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-violet-500 text-white shadow-md' : 'text-slate-700'}`}>
               {d}
             </span>
             {hasNote && (
               <span className="text-violet-400">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-50"><path d="M16 2H8C4.691 2 2 4.691 2 8v13a1 1 0 0 0 1 1h13c3.309 0 6-2.691 6-6V8c0-3.309-2.691-6-6-6zm-2 13H8v-2h6v2zm2-4H8V9h8v2z"/></svg>
               </span>
             )}
          </div>
          
          {hasNote && (
            <div className="mt-2 text-xs text-slate-500 line-clamp-3 md:line-clamp-4 font-yomogi leading-tight break-all">
              {events[dateKey]}
            </div>
          )}

          {/* Add icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
             <div className="bg-violet-100 text-violet-600 rounded-full p-2 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
             </div>
          </div>
        </div>
      );
    }

    return days;
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          シンプルカレンダー
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </h2>
        <p className="text-slate-500">
          予定や日記をメモできます。データはブラウザに自動保存されます。<br/>
          ファイルの書き出し・読み込みにも対応。
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-violet-50 p-6 flex items-center justify-between border-b border-violet-100">
           <button 
             onClick={handlePrevMonth}
             className="p-2 rounded-full hover:bg-violet-200 text-violet-600 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
           </button>
           
           <h3 className="text-2xl font-bold text-slate-700 flex items-baseline gap-2">
             <span className="text-4xl text-violet-600 font-mono tracking-tighter">{currentDate.getFullYear()}</span>
             <span className="text-sm text-slate-400 font-bold">YEAR</span>
             <span className="text-4xl text-slate-800 font-mono tracking-tighter ml-2">{String(currentDate.getMonth() + 1).padStart(2, '0')}</span>
             <span className="text-sm text-slate-400 font-bold">MONTH</span>
           </h3>

           <button 
             onClick={handleNextMonth}
             className="p-2 rounded-full hover:bg-violet-200 text-violet-600 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
           </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 bg-white border-b border-slate-200">
          {weekDays.map((day, i) => (
            <div key={day} className={`text-center py-2 text-sm font-bold ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-slate-100 gap-px border-l border-t border-slate-100">
           {renderCalendarDays()}
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-center gap-4 text-sm">
           <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
             ファイルに保存 (.txt)
           </button>
           
           <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors cursor-pointer">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
             ファイルを読み込む
             <input 
               type="file" 
               ref={fileInputRef}
               onChange={handleImport}
               accept=".txt,.json"
               className="hidden" 
             />
           </label>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-violet-50">
               <h3 className="font-bold text-violet-800">
                 {selectedDate} のメモ
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
             </div>
             
             <div className="p-4">
               <textarea
                 value={noteInput}
                 onChange={(e) => setNoteInput(e.target.value)}
                 className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none resize-none font-yomogi text-lg"
                 placeholder="ここに予定や日記を入力..."
                 autoFocus
               />
             </div>

             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  onClick={saveNote}
                  className="px-6 py-2 bg-violet-500 text-white hover:bg-violet-600 rounded-lg text-sm font-bold transition-colors shadow-md"
                >
                  保存する
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCalendar;
