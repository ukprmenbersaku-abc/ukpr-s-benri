import React, { useState, useEffect, useRef } from 'react';

type DelimiterType = 'newline' | 'comma' | 'space' | 'tab' | 'custom';
type ViewMode = 'setup' | 'presentation';

const EMPTY_SEAT_MARKER = '__EMPTY_SEAT__';

const SeatChangeHelper: React.FC = () => {
  // Data State
  const [namesText, setNamesText] = useState('');
  const [delimiterType, setDelimiterType] = useState<DelimiterType>('newline');
  const [customDelimiter, setCustomDelimiter] = useState('、');
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(6);
  const [seats, setSeats] = useState<string[]>([]);
  const [lockedSeats, setLockedSeats] = useState<{ [index: number]: string }>({});
  const [isGenerated, setIsGenerated] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);

  // Presentation State
  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [animatingIndices, setAnimatingIndices] = useState<Set<number>>(new Set());
  
  // Animation ref
  const tempNamesRef = useRef<{ [index: number]: string }>({});
  const [forceUpdate, setForceUpdate] = useState(0); 

  const getValidNames = () => {
    let splitPattern: string | RegExp = '\n';
    switch (delimiterType) {
      case 'comma': splitPattern = /,|、/; break;
      case 'space': splitPattern = /\s+/; break;
      case 'tab': splitPattern = '\t'; break;
      case 'custom': splitPattern = customDelimiter || '\n'; break;
      case 'newline': default: splitPattern = '\n'; break;
    }
    return namesText.split(splitPattern).map(n => n.trim()).filter(n => n !== '');
  };

  const handleAutoLayout = () => {
    const names = getValidNames();
    const count = names.length;
    if (count === 0) return;

    // Calculate ideal grid (square-ish)
    // Example: 30 people -> sqrt(30)=5.47 -> 6 cols. 30/6 = 5 rows.
    const c = Math.ceil(Math.sqrt(count));
    const r = Math.ceil(count / c);

    setCols(Math.max(1, c));
    setRows(Math.max(1, r));
  };

  const handleGenerate = () => {
    const allNames = getValidNames();

    if (allNames.length === 0) {
      alert('名前を入力してください');
      return;
    }

    const totalSeats = rows * cols;
    const newSeats = new Array(totalSeats).fill(null);

    // 1. Place Locked Seats
    Object.entries(lockedSeats).forEach(([indexStr, name]) => {
      const idx = parseInt(indexStr);
      if (idx < totalSeats) {
        newSeats[idx] = name;
      }
    });

    // 2. Prepare available pool (excluding already locked names)
    let availableNames = [...allNames];
    const lockedValues = Object.values(lockedSeats);
    
    // Remove names that are locked (but ignore the empty marker)
    for (const lockedName of lockedValues) {
      if (lockedName === EMPTY_SEAT_MARKER) continue;
      
      const foundIdx = availableNames.indexOf(lockedName);
      if (foundIdx !== -1) {
        availableNames.splice(foundIdx, 1);
      }
    }

    // 3. Shuffle
    for (let i = availableNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableNames[i], availableNames[j]] = [availableNames[j], availableNames[i]];
    }

    // 4. Fill empty spots
    let nameIdx = 0;
    for (let i = 0; i < totalSeats; i++) {
      if (newSeats[i] === null) {
        // If seat is not locked
        if (nameIdx < availableNames.length) {
          newSeats[i] = availableNames[nameIdx];
          nameIdx++;
        } else {
          newSeats[i] = ''; // Empty seat if no more names
        }
      }
    }

    setSeats(newSeats);
    setIsGenerated(true);
    setRevealedIndices(new Set());
    setAnimatingIndices(new Set());
  };

  const handleReset = () => {
      setSeats([]);
      setIsGenerated(false);
      setRevealedIndices(new Set());
      setLockedSeats({});
      setViewMode('setup');
  };

  const openLockModal = (index: number) => {
    setSelectedSeatIndex(index);
    setModalOpen(true);
  };

  const selectLockPerson = (name: string) => {
    if (selectedSeatIndex === null) return;
    
    setLockedSeats(prev => ({ ...prev, [selectedSeatIndex]: name }));
    setModalOpen(false);
    setSelectedSeatIndex(null);
  };

  const unlockSeat = () => {
    if (selectedSeatIndex === null) return;
    
    const newLocked = { ...lockedSeats };
    delete newLocked[selectedSeatIndex];
    setLockedSeats(newLocked);
    setModalOpen(false);
    setSelectedSeatIndex(null);
  };

  const getPlaceholder = () => {
    switch (delimiterType) {
      case 'comma': return '佐藤,鈴木,高橋,田中...';
      case 'space': return '佐藤 鈴木 高橋 田中...';
      case 'tab': return '佐藤	鈴木	高橋	田中...';
      case 'custom': return `佐藤${customDelimiter}鈴木${customDelimiter}高橋${customDelimiter}田中...`;
      case 'newline': default: return '佐藤\n鈴木\n高橋\n田中...';
    }
  };

  // --- Presentation Logic ---

  const startRoulette = (index: number) => {
    if (!seats[index] || seats[index] === EMPTY_SEAT_MARKER || revealedIndices.has(index) || animatingIndices.has(index)) return;

    const newAnimating = new Set(animatingIndices);
    newAnimating.add(index);
    setAnimatingIndices(newAnimating);

    const duration = 1500 + Math.random() * 1000;
    const startTime = Date.now();
    const allNames = getValidNames();
    const dummyNames = allNames.length > 0 ? allNames : ['???', '...'];

    const interval = setInterval(() => {
       const randomName = dummyNames[Math.floor(Math.random() * dummyNames.length)];
       tempNamesRef.current[index] = randomName;
       setForceUpdate(n => n + 1);

       if (Date.now() - startTime > duration) {
         clearInterval(interval);
         finalizeReveal(index);
       }
    }, 80);
  };

  const finalizeReveal = (index: number) => {
    setAnimatingIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    
    setRevealedIndices(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const revealAll = () => {
    const unrevealedIndices: number[] = [];
    seats.forEach((s, i) => {
      if (s && s !== EMPTY_SEAT_MARKER && !revealedIndices.has(i)) unrevealedIndices.push(i);
    });

    unrevealedIndices.forEach((idx, i) => {
      setTimeout(() => {
        startRoulette(idx);
      }, i * 300);
    });
  };

  const hideAll = () => {
    setRevealedIndices(new Set());
    setAnimatingIndices(new Set());
  };

  const enterPresentationMode = () => {
    if (!isGenerated) {
      handleGenerate();
    }
    setViewMode('presentation');
  };

  return (
    <div className="animate-fade-in-up font-kiwi relative">
      
      {/* Header (Setup Mode Only) */}
      {viewMode === 'setup' && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
            席替えお助けツール
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime-600"><path d="M2 21h20"/><path d="M2 3h20"/><path d="M5 3v18"/><path d="M19 3v18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
          </h2>
          <p className="text-slate-500 font-kiwi">
            席の固定（ロック）も可能です。準備ができたら「発表モード」へ。<br/>
            抽選はドキドキのルーレット演出付き！
          </p>
        </div>
      )}

      {/* SETUP MODE UI */}
      {viewMode === 'setup' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-lime-500"></div>
              <div className="mb-4">
                 <label className="block text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                   <span className="bg-lime-100 text-lime-700 w-6 h-6 rounded flex items-center justify-center text-sm font-kiwi">1</span>
                   名簿の入力
                 </label>
                 
                 <div className="mb-3 font-kiwi">
                   <p className="text-xs text-slate-500 mb-2">区切り文字:</p>
                   <div className="flex flex-wrap gap-2">
                     {[
                       { id: 'newline', label: '改行' },
                       { id: 'comma', label: 'カンマ' },
                       { id: 'space', label: 'スペース' },
                       { id: 'tab', label: 'タブ' },
                       { id: 'custom', label: 'その他' },
                     ].map((opt) => (
                       <button
                         key={opt.id}
                         onClick={() => setDelimiterType(opt.id as DelimiterType)}
                         className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all font-kiwi ${
                           delimiterType === opt.id
                             ? 'bg-lime-500 text-white border-lime-500 shadow-md'
                             : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                         }`}
                       >
                         {opt.label}
                       </button>
                     ))}
                   </div>
                   {delimiterType === 'custom' && (
                     <div className="mt-2 flex items-center gap-2 animate-fade-in">
                       <span className="text-xs text-slate-500">文字指定:</span>
                       <input 
                         type="text" 
                         value={customDelimiter}
                         onChange={(e) => setCustomDelimiter(e.target.value)}
                         className="border border-slate-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:border-lime-500 font-kiwi"
                         placeholder="例: /"
                       />
                     </div>
                   )}
                 </div>

                 <textarea
                   value={namesText}
                   onChange={(e) => setNamesText(e.target.value)}
                   className="w-full h-40 p-4 rounded-xl border-2 border-slate-200 focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none transition-all resize-none text-sm font-kiwi leading-relaxed"
                   placeholder={getPlaceholder()}
                 />
                 <p className="text-right text-xs text-slate-400 mt-1 font-kiwi">
                   入力: {getValidNames().length} 人
                 </p>
              </div>

              <div className="mb-8">
                <label className="block text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                   <span className="bg-lime-100 text-lime-700 w-6 h-6 rounded flex items-center justify-center text-sm font-kiwi">2</span>
                   配置の設定
                </label>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <span className="text-xs text-slate-400 block mb-1 text-center font-kiwi">横 (列)</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={cols}
                      onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-3 rounded-xl border-2 border-slate-200 text-center font-bold text-xl focus:border-lime-500 outline-none font-kiwi"
                    />
                  </div>
                  <div className="text-slate-300 text-xl font-bold">×</div>
                  <div className="flex-1">
                     <span className="text-xs text-slate-400 block mb-1 text-center font-kiwi">縦 (行)</span>
                     <input
                      type="number"
                      min="1"
                      max="10"
                      value={rows}
                      onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-3 rounded-xl border-2 border-slate-200 text-center font-bold text-xl focus:border-lime-500 outline-none font-kiwi"
                    />
                  </div>
                </div>
                {getValidNames().length > 0 && (
                  <button 
                    onClick={handleAutoLayout}
                    className="mt-3 w-full text-xs text-lime-600 bg-lime-50 hover:bg-lime-100 font-bold py-2 rounded-lg border border-lime-200 flex items-center justify-center gap-2 transition-colors font-kiwi"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    人数に合わせて自動調整 ({getValidNames().length}人)
                  </button>
                )}
              </div>

              <button
                onClick={handleGenerate}
                className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 mb-3 font-kiwi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                席順を決定 (再シャッフル)
              </button>
            </div>
            
          </div>

          {/* Setup Preview */}
          <div className="lg:col-span-2">
             <div className="bg-amber-50 rounded-3xl p-8 shadow-inner border-2 border-amber-100 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden mb-6">
                {/* Preview Overlay */}
                {!isGenerated && Object.keys(lockedSeats).length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-3xl pointer-events-none">
                     <p className="text-slate-400 font-bold text-lg font-kiwi">設定を入力して「席順を決定」を押してください</p>
                  </div>
                )}
                
                <div className="w-full max-w-2xl bg-emerald-800 rounded-sm p-2 text-center mb-8 shadow-lg border-4 border-amber-800 transform -rotate-1 shrink-0">
                  <span className="text-white/90 font-bold tracking-widest text-lg font-kiwi">黒 板 (前)</span>
                </div>

                <div className="w-full max-w-full overflow-auto">
                    <div 
                      className="grid gap-3 mx-auto px-4 pb-4"
                      style={{ 
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        minWidth: `${cols * 80}px` // Ensure cells don't get crushed
                      }}
                    >
                      {Array.from({ length: rows * cols }).map((_, index) => {
                        const lockedValue = lockedSeats[index];
                        const name = seats[index] || lockedValue;
                        const isLocked = !!lockedValue;
                        const isEmpty = lockedValue === EMPTY_SEAT_MARKER || name === EMPTY_SEAT_MARKER;
                        
                        return (
                          <button 
                            key={index} 
                            onClick={() => openLockModal(index)}
                            className={`aspect-[4/3] rounded-md flex flex-col items-center justify-center p-1 text-center shadow-sm border text-sm transition-all relative group font-kiwi ${
                              isEmpty
                              ? 'bg-slate-200/50 border-slate-200 border-dashed text-slate-300'
                              : isLocked 
                              ? 'bg-amber-200 border-amber-400 text-amber-900 font-bold' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-lime-400 hover:bg-lime-50'
                            }`}
                            title="クリックして席を固定"
                          >
                             {isLocked && !isEmpty && (
                               <div className="absolute top-1 right-1 text-amber-600">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2Zm0-4.75A5.25 5.25 0 0 0 13.75 1a5.26 5.26 0 0 0-5.25 5.25v4h10.5Z"/></svg>
                               </div>
                             )}
                             {/* Content */}
                             {isEmpty ? (
                               <span className="text-xs font-kiwi">空席</span>
                             ) : (
                               <>
                                 <span className="truncate w-full font-yomogi text-lg">{name || <span className="text-slate-300 text-xs font-sans">-</span>}</span>
                                 <span className="text-[10px] text-slate-400 absolute bottom-1 font-kiwi">{index + 1}</span>
                               </>
                             )}
                          </button>
                        );
                      })}
                    </div>
                </div>
                
                <p className="mt-8 text-slate-400 text-xs font-kiwi text-center">
                  席をクリックすると、特定の人を固定（ロック）できます。<br/>
                  これは確認用プレビューです。発表モードではアニメーション付きで表示されます。
                </p>
             </div>

             {/* Promo Card for Presentation Mode (Moved to bottom of right column) */}
             {isGenerated && (
              <div className="bg-lime-500 text-white rounded-3xl p-6 shadow-xl shadow-lime-200 border border-lime-400 text-center animate-bounce-subtle mx-auto max-w-xl">
                 <h3 className="text-xl font-bold mb-2 font-kiwi">準備完了！</h3>
                 <p className="text-lime-100 text-sm mb-4 font-kiwi">
                   席順が決まりました。<br/>プロジェクターに映して発表しましょう。
                 </p>
                 <button 
                   onClick={enterPresentationMode}
                   className="w-full bg-white text-lime-600 font-bold py-4 rounded-xl shadow-md hover:bg-lime-50 transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-lg font-kiwi"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                   発表モードへ切り替え
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lock Selection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in font-kiwi">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-700">席 {selectedSeatIndex !== null ? selectedSeatIndex + 1 : ''} を固定する</h3>
               <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
             </div>
             
             <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
               {/* Empty Seat Option */}
               <button 
                  onClick={() => selectLockPerson(EMPTY_SEAT_MARKER)}
                  className="p-3 rounded-lg border-2 border-slate-300 border-dashed text-slate-500 hover:bg-slate-50 hover:border-slate-400 font-bold text-sm"
               >
                 [ 空席にする ]
               </button>

               {getValidNames().map((name, i) => (
                 <button 
                   key={i} 
                   onClick={() => selectLockPerson(name)}
                   className="p-3 rounded-lg border border-slate-200 hover:border-lime-500 hover:bg-lime-50 text-slate-700 font-bold truncate transition-colors text-sm"
                 >
                   {name}
                 </button>
               ))}
             </div>

             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between">
                <button 
                  onClick={unlockSeat}
                  className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  固定を解除
                </button>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-slate-500 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  キャンセル
                </button>
             </div>
           </div>
        </div>
      )}

      {/* PRESENTATION MODE UI */}
      {viewMode === 'presentation' && (
        <div className="fixed inset-0 z-50 bg-stone-100 flex flex-col overflow-hidden font-kiwi">
           {/* Navbar for Presentation */}
           <div className="bg-stone-800 text-stone-200 h-16 flex items-center justify-between px-6 shadow-md shrink-0">
              <h1 className="text-xl font-bold tracking-widest">★ 席替え発表会 ★</h1>
              <div className="flex gap-4">
                 <button 
                   onClick={revealAll}
                   className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/50"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                   全員ルーレット開始
                 </button>
                 <button 
                   onClick={hideAll}
                   className="px-4 py-2 bg-stone-600 hover:bg-stone-500 text-white rounded-lg font-bold text-sm transition-colors"
                 >
                   リセット
                 </button>
                 <div className="w-px h-8 bg-stone-600 mx-2"></div>
                 <button 
                   onClick={() => setViewMode('setup')}
                   className="px-4 py-2 bg-transparent hover:bg-stone-700 text-stone-300 border border-stone-600 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                   設定に戻る
                 </button>
              </div>
           </div>

           {/* Main Stage */}
           <div className="flex-1 overflow-auto p-4 md:p-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-100 to-amber-200 flex flex-col items-center shadow-inner">
              
              {/* Blackboard */}
              <div className="w-full max-w-4xl bg-[#1a3c28] rounded-md p-4 mb-10 shadow-2xl border-[12px] border-[#8b5a2b] relative overflow-hidden shrink-0">
                 <div className="absolute bottom-0 right-0 p-2 opacity-30 pointer-events-none">
                    <svg width="100" height="40" viewBox="0 0 100 40">
                       <path d="M10,30 Q30,10 50,30 T90,30" fill="none" stroke="white" strokeWidth="2" />
                    </svg>
                 </div>
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/10 text-9xl font-bold select-none pointer-events-none">CLASS</div>
                 <h2 className="text-white/90 text-3xl font-bold text-center tracking-[0.5em] drop-shadow-md font-kiwi relative z-10">黒 板</h2>
              </div>

              {/* Seats Grid (Desks) */}
              <div className="w-full max-w-full overflow-auto text-center">
                  <div 
                      className="grid gap-6 md:gap-8 px-4 pb-20 mx-auto inline-grid"
                      style={{ 
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        minWidth: `${cols * 120}px` // Ensure enough width for desks
                      }}
                    >
                      {Array.from({ length: rows * cols }).map((_, index) => {
                        const realName = seats[index];
                        const isEmpty = realName === EMPTY_SEAT_MARKER;
                        const isRevealed = revealedIndices.has(index);
                        const isAnimating = animatingIndices.has(index);
                        
                        // If empty, render nothing or floor
                        if (isEmpty) {
                            return (
                                <div key={index} className="aspect-[4/3] opacity-20 border-2 border-stone-400/20 rounded-lg flex items-center justify-center">
                                    <span className="text-stone-500 font-bold text-xs select-none">×</span>
                                </div>
                            );
                        }

                        let displayText = "";
                        if (isRevealed) displayText = realName;
                        else if (isAnimating) displayText = tempNamesRef.current[index] || "???";
                        else displayText = ""; // Hidden

                        return (
                          <div 
                            key={index} 
                            className="aspect-[4/3] cursor-pointer group relative"
                            onClick={() => startRoulette(index)}
                          >
                             {/* Desk Graphic */}
                             <div className="absolute inset-0 bg-[#eebb88] rounded-lg shadow-[0_10px_0_#bb8855] border-t-4 border-[#ffddaa] transform transition-transform active:translate-y-[4px] active:shadow-[0_6px_0_#bb8855] flex flex-col items-center justify-center overflow-hidden">
                                {/* Wood texture detail */}
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                                
                                {/* Paper/Nameplate */}
                                <div className={`relative bg-white w-5/6 h-2/3 shadow-inner flex items-center justify-center p-2 rounded-sm rotate-1 transition-all duration-300 ${isAnimating ? 'scale-110' : 'group-hover:scale-105'}`}>
                                   {/* Tape */}
                                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/30 rotate-2 backdrop-blur-sm border border-white/40"></div>
                                   
                                   {displayText ? (
                                     <span className={`font-yomogi font-bold text-slate-800 text-lg md:text-2xl lg:text-3xl break-all leading-tight ${isAnimating ? 'animate-pulse blur-[0.5px]' : ''}`}>
                                       {displayText}
                                     </span>
                                   ) : (
                                     <span className="text-slate-300 text-3xl font-bold opacity-30 select-none">?</span>
                                   )}
                                </div>
                                
                                {/* Desk Number */}
                                <div className="absolute bottom-1 right-2 text-[#a07040] font-bold opacity-50 text-xs font-kiwi">
                                  No.{index + 1}
                                </div>
                             </div>
                          </div>
                        );
                      })}
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default SeatChangeHelper;