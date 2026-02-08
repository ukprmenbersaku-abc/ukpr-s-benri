
import React, { useState, useMemo } from 'react';
import { WATT_OPTIONS } from '../../types';
import { Tabs } from '../ui/Tabs';

const REFERENCE_TIMES = [
  10, 20, 30, 40, 50,
  60, 90, 120, 150, 180,
  240, 300, 360, 420, 480, 600
];

const MicrowaveCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [sourceWatt, setSourceWatt] = useState<number>(500);
  const [targetWatt, setTargetWatt] = useState<number>(600);
  const [minutes, setMinutes] = useState<number>(2);
  const [seconds, setSeconds] = useState<number>(0);

  // Chart State
  const [chartSourceWatt, setChartSourceWatt] = useState<number>(500);

  // Calculate result for calculator mode
  const result = useMemo(() => {
    const totalSeconds = minutes * 60 + seconds;
    const energy = totalSeconds * sourceWatt;
    const newTotalSeconds = energy / targetWatt;
    
    const newMin = Math.floor(newTotalSeconds / 60);
    const newSec = Math.round(newTotalSeconds % 60);
    
    // Handle edge case where rounding up seconds hits 60
    if (newSec === 60) {
      return { min: newMin + 1, sec: 0 };
    }
    return { min: newMin, sec: newSec };
  }, [sourceWatt, targetWatt, minutes, seconds]);

  const handleWattChange = (type: 'source' | 'target', value: number) => {
    if (type === 'source') setSourceWatt(value);
    else setTargetWatt(value);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    if (s === 60) return `${m + 1}分00秒`;
    if (m === 0) return `${s}秒`;
    return `${m}分${String(s).padStart(2, '0')}秒`;
  };

  const calculateConversion = (srcW: number, tgtW: number, sec: number) => {
    const energy = sec * srcW;
    return energy / tgtW;
  };

  // Standard Button Style (No Gloss)
  const getButtonStyle = (isSelected: boolean, color: 'orange' | 'indigo') => {
    const activeClass = color === 'orange' 
      ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-200' 
      : 'bg-indigo-500 text-white shadow-md ring-2 ring-indigo-200';
    
    const inactiveClass = 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300';

    return `
      px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 flex items-center justify-center
      ${isSelected ? activeClass : inactiveClass}
    `;
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          電子レンジ計算機
          <span className="p-2 bg-orange-100 rounded-lg text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="4" rx="2" ry="2"/><line x1="16.95" x2="16.95" y1="9" y2="9.01"/><path d="M14 18v6"/><path d="M10 18v6"/><path d="M6 13h12"/></svg>
          </span>
        </h2>
        <p className="text-slate-500 font-medium">
          「500Wで3分」って書いてあるけど、うちのレンジは600W...<br/>
          そんな時のための、温め時間変換ツールです。
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <Tabs 
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { 
              id: 'calculator', 
              label: '計算機モード', 
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
            },
            { 
              id: 'chart', 
              label: '早見表モード', 
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            }
          ]}
          className="bg-slate-100/50 border border-slate-200 shadow-sm"
        />
      </div>

      {activeTab === 'calculator' ? (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          {/* Input Section - Clean Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 flex flex-col h-full">
            
            <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-3">
              <span className="bg-orange-100 text-orange-600 w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm">1</span>
              レシピ・商品の指定
            </h3>

            <div className="mb-8 flex-grow">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ワット数 (W)</label>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {WATT_OPTIONS.filter(w => w <= 1000).map((w) => (
                    <button
                      key={`source-${w}`}
                      onClick={() => handleWattChange('source', w)}
                      className={getButtonStyle(sourceWatt === w, 'orange')}
                    >
                      {w}W
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <input
                        type="number"
                        value={sourceWatt}
                        onChange={(e) => setSourceWatt(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-28 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">W</span>
                   </div>
                   <span className="text-sm text-slate-500 font-medium">カスタム入力</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">時間設定</label>
              <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                   <input
                    type="number"
                    min="0"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-center text-4xl font-bold p-2 bg-transparent rounded-xl focus:text-orange-600 outline-none transition-all placeholder-slate-300"
                  />
                  <span className="absolute right-0 bottom-2 text-slate-400 text-xs font-bold">分</span>
                </div>
                <span className="text-slate-300 font-bold text-2xl pb-2">:</span>
                <div className="relative flex-1">
                   <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full text-center text-4xl font-bold p-2 bg-transparent rounded-xl focus:text-orange-600 outline-none transition-all placeholder-slate-300"
                  />
                  <span className="absolute right-0 bottom-2 text-slate-400 text-xs font-bold">秒</span>
                </div>
              </div>
            </div>
          </div>

          {/* Output Section - Clean Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 flex flex-col h-full">
             
             <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-3">
              <span className="bg-indigo-100 text-indigo-600 w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-sm">2</span>
              自宅のレンジ設定
            </h3>

             <div className="mb-10 flex-grow">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">使いたいワット数 (W)</label>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {WATT_OPTIONS.map((w) => (
                    <button
                      key={`target-${w}`}
                      onClick={() => handleWattChange('target', w)}
                      className={getButtonStyle(targetWatt === w, 'indigo')}
                    >
                      {w}W
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <input
                        type="number"
                        value={targetWatt}
                        onChange={(e) => setTargetWatt(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-28 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">W</span>
                   </div>
                   <span className="text-sm text-slate-500 font-medium">カスタム入力</span>
                </div>
              </div>
            </div>

            {/* Result Display - Simple Green */}
            <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-slate-100 relative overflow-hidden">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">加熱時間目安</p>
              
              <div className="text-5xl md:text-6xl font-bold text-slate-800 tracking-tight">
                {result.min}<span className="text-xl align-baseline mx-1 text-slate-400 font-sans">分</span>
                {String(result.sec).padStart(2, '0')}<span className="text-xl align-baseline mx-1 text-slate-400 font-sans">秒</span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5 font-medium">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>目安です。様子を見ながら温めてください。</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 animate-fade-in overflow-hidden">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
              早見表（一括変換）
            </h3>
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
               <span className="text-sm font-bold text-slate-500 pl-2">元のワット数:</span>
               <select 
                 value={chartSourceWatt}
                 onChange={(e) => setChartSourceWatt(Number(e.target.value))}
                 className="bg-white border border-slate-200 text-slate-700 text-sm rounded-md focus:ring-orange-500 focus:border-orange-500 block p-2 font-bold outline-none cursor-pointer"
               >
                 {WATT_OPTIONS.filter(w => w <= 800).map(w => (
                   <option key={w} value={w}>{w}W</option>
                 ))}
               </select>
            </div>
          </div>

          <div className="overflow-x-auto pb-2 rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left text-slate-600 border-collapse">
               <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold whitespace-nowrap sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                      元の時間 ({chartSourceWatt}W)
                    </th>
                    {WATT_OPTIONS.map(w => (
                      <th key={w} scope="col" className={`px-6 py-4 font-bold whitespace-nowrap ${w === chartSourceWatt ? 'bg-orange-50 text-orange-600' : ''}`}>
                        {w}W
                      </th>
                    ))}
                  </tr>
               </thead>
               <tbody>
                 {REFERENCE_TIMES.map((sec, index) => (
                   <tr key={sec} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors`}>
                      <td className="px-6 py-4 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100">
                        {formatTime(sec)}
                      </td>
                      {WATT_OPTIONS.map(w => {
                        const converted = calculateConversion(chartSourceWatt, w, sec);
                        return (
                          <td key={w} className={`px-6 py-4 whitespace-nowrap font-mono ${w === chartSourceWatt ? 'bg-orange-50 text-orange-600 font-bold' : ''}`}>
                            {formatTime(converted)}
                          </td>
                        );
                      })}
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MicrowaveCalculator;
