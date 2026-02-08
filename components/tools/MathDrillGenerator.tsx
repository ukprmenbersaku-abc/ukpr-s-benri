import React, { useState, useEffect, useCallback } from 'react';

type Operator = '+' | '-' | '×' | '÷';

interface DrillData {
  rows: number[];
  cols: number[];
  operator: Operator;
}

const MathDrillGenerator: React.FC = () => {
  const [operator, setOperator] = useState<Operator>('+');
  const [rowMin, setRowMin] = useState(1);
  const [rowMax, setRowMax] = useState(9);
  const [colMin, setColMin] = useState(1);
  const [colMax, setColMax] = useState(9);
  const [avoidNegative, setAvoidNegative] = useState(true); // For subtraction
  const [uniqueNumbers, setUniqueNumbers] = useState(false); // No duplicates
  const [excludeZero, setExcludeZero] = useState(false);
  const [drillData, setDrillData] = useState<DrillData | null>(null);

  // Generate drill data logic
  const generateDrill = useCallback(() => {
    const generateArray = (min: number, max: number, count: number) => {
      let baseNumbers: number[] = [];
      
      // Create pool of numbers
      for (let i = min; i <= max; i++) {
        if (excludeZero && i === 0) continue;
        baseNumbers.push(i);
      }

      // If excludeZero resulted in no numbers (e.g. min=0, max=0), fallback
      if (baseNumbers.length === 0) {
        baseNumbers = [1];
      }

      const shuffle = (arr: number[]) => {
        const newArr = [...arr];
        for (let i = newArr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
      };

      if (!uniqueNumbers) {
        // Random generation with replacement
        const result = [];
        for (let i = 0; i < count; i++) {
          const randomIndex = Math.floor(Math.random() * baseNumbers.length);
          result.push(baseNumbers[randomIndex]);
        }
        return result;
      } else {
        // Unique generation logic (Pool based)
        // If range size < count, we reuse numbers but minimize duplicates (shuffle and refill)
        let result: number[] = [];
        let currentPool: number[] = [];

        while (result.length < count) {
          if (currentPool.length === 0) {
             currentPool = shuffle(baseNumbers);
          }
          result.push(currentPool.pop()!);
        }
        return result;
      }
    };

    setDrillData({
      operator,
      rows: generateArray(rowMin, rowMax, 10),
      cols: generateArray(colMin, colMax, 10),
    });
  }, [operator, rowMin, rowMax, colMin, colMax, avoidNegative, uniqueNumbers, excludeZero]);

  // Initial generation and Auto-regenerate when key options change
  useEffect(() => {
    generateDrill();
  }, [uniqueNumbers, excludeZero, avoidNegative, operator]);

  const handlePrint = () => {
    window.print();
  };

  const calculateAnswer = (r: number, c: number, op: Operator): number | string => {
    switch(op) {
      case '+': return r + c;
      case '-': return r - c;
      case '×': return r * c;
      case '÷': 
        if (c === 0) return 'Err';
        const quotient = Math.floor(r / c);
        const remainder = r % c;
        return remainder === 0 ? quotient : `${quotient}…${remainder}`;
      default: return '';
    }
  };

  const handleDownloadCsv = (withAnswers: boolean) => {
    if (!drillData) return;
    
    // Create CSV content
    // Header row: operator, col1, col2, ...
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `"${drillData.operator}",` + drillData.cols.join(",") + "\n";
    
    // Rows
    drillData.rows.forEach(rowVal => {
        csvContent += `${rowVal},`; // First column is the row header
        
        const rowCells = drillData.cols.map(colVal => {
            if (withAnswers) {
                return calculateAnswer(rowVal, colVal, drillData.operator);
            } else {
                return "";
            }
        });

        csvContent += rowCells.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `math_drill_${withAnswers ? 'answers_' : ''}${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Screen Only UI */}
      <div className="print:hidden">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
            100マス計算メーカー
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M11 5v4"/><path d="M8 12h6"/></svg>
          </h2>
          <p className="text-slate-500">
            算数ドリルの定番、100マス計算プリントを自動生成します。<br/>
            画面で確認して、印刷またはPDFとして保存できます。
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200 border border-slate-100 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
               <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <span className="bg-cyan-100 text-cyan-600 w-6 h-6 flex items-center justify-center rounded text-xs">1</span>
                 計算の種類
               </h3>
               <div className="flex gap-2 mb-6">
                 {(['+', '-', '×', '÷'] as Operator[]).map(op => (
                   <button
                     key={op}
                     onClick={() => setOperator(op)}
                     className={`flex-1 py-3 text-xl font-bold rounded-xl border-2 transition-all ${
                       operator === op 
                       ? 'border-cyan-500 bg-cyan-50 text-cyan-600 shadow-md' 
                       : 'border-slate-200 text-slate-400 hover:border-cyan-300 hover:bg-slate-50'
                     }`}
                   >
                     {op}
                   </button>
                 ))}
               </div>

               <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <span className="bg-cyan-100 text-cyan-600 w-6 h-6 flex items-center justify-center rounded text-xs">2</span>
                 数値の範囲設定
               </h3>
               
               <div className="space-y-4 mb-6">
                 <div>
                   <label className="text-xs font-bold text-slate-400 block mb-1">たての数字 (左側)</label>
                   <div className="flex items-center gap-2">
                     <input type="number" value={rowMin} onChange={e => setRowMin(Number(e.target.value))} className="w-20 p-2 border rounded text-center" />
                     <span className="text-slate-400">~</span>
                     <input type="number" value={rowMax} onChange={e => setRowMax(Number(e.target.value))} className="w-20 p-2 border rounded text-center" />
                   </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">よこの数字 (上側)</label>
                    <div className="flex items-center gap-2">
                     <input type="number" value={colMin} onChange={e => setColMin(Number(e.target.value))} className="w-20 p-2 border rounded text-center" />
                     <span className="text-slate-400">~</span>
                     <input type="number" value={colMax} onChange={e => setColMax(Number(e.target.value))} className="w-20 p-2 border rounded text-center" />
                   </div>
                 </div>
               </div>

               <div className="mb-6 space-y-2">
                 <h4 className="text-xs font-bold text-slate-400 mb-2">オプション</h4>
                 
                 <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={uniqueNumbers} 
                      onChange={e => setUniqueNumbers(e.target.checked)}
                      className="w-5 h-5 accent-cyan-500" 
                    />
                    <span className="text-sm text-slate-600">数字を重複させない (範囲不足時は補充)</span>
                 </label>

                 <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={excludeZero} 
                      onChange={e => setExcludeZero(e.target.checked)}
                      className="w-5 h-5 accent-cyan-500" 
                    />
                    <span className="text-sm text-slate-600">0を含めない (割り算の練習などに)</span>
                 </label>

                 {operator === '-' && (
                   <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                     <input 
                       type="checkbox" 
                       checked={avoidNegative} 
                       onChange={e => setAvoidNegative(e.target.checked)}
                       className="w-5 h-5 accent-cyan-500" 
                     />
                     <div className="text-sm text-slate-600">
                       答えがマイナスにならないように注釈
                       <p className="text-xs text-slate-400">※「大きい数から小さい数を引く」</p>
                     </div>
                   </label>
                 )}
               </div>
            </div>

            <div className="flex flex-col justify-end">
               <button 
                 onClick={generateDrill}
                 className="w-full bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-200 hover:bg-cyan-600 transition-all active:scale-95 flex items-center justify-center gap-2 mb-4"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                 問題を作成する
               </button>
               
               <div className="flex flex-col gap-3">
                 <button 
                   onClick={handlePrint}
                   className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                   印刷 / PDF保存
                 </button>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleDownloadCsv(false)}
                      className="bg-white border-2 border-slate-200 text-slate-600 font-bold py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      CSV (問題のみ)
                    </button>
                    <button 
                      onClick={() => handleDownloadCsv(true)}
                      className="bg-white border-2 border-slate-200 text-slate-600 font-bold py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
                      CSV (解答付き)
                    </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drill Preview & Print Area */}
      {drillData && (
        <div className="bg-white p-8 rounded shadow-lg print:shadow-none print:w-full print:p-0 print:m-0 w-full max-w-3xl mx-auto font-serif print:font-serif">
           <style>{`
             @media print {
               @page { margin: 1cm; size: A4 portrait; }
               body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
             }
           `}</style>
           <div className="mb-6 flex justify-between items-end border-b-2 border-black pb-2">
             <h1 className="text-2xl font-bold font-sans">100マス計算 ({drillData.operator})</h1>
             <div className="text-right">
               <div className="text-sm">日付: ____ / ____ / ____</div>
               <div className="text-sm mt-1">タイム: ______ 分 ______ 秒</div>
               <div className="text-sm mt-1">点数: ______ / 100</div>
             </div>
           </div>
           
           {drillData.operator === '-' && avoidNegative && (
             <div className="text-xs text-right mb-2">※大きい数から小さい数を引いて計算してください</div>
           )}
           {drillData.operator === '÷' && (
             <div className="text-xs text-right mb-2">※あまりがあれば、あまりも書いてください</div>
           )}

           <table className="w-full border-collapse border-2 border-black text-center">
             <thead>
               <tr>
                 <th className="border border-black bg-slate-200 w-12 h-12 text-xl print:bg-slate-100 font-sans">
                   {drillData.operator}
                 </th>
                 {drillData.cols.map((col, i) => (
                   <th key={i} className="border border-black bg-slate-100 w-12 h-12 text-lg font-bold print:bg-white font-sans">
                     {col}
                   </th>
                 ))}
               </tr>
             </thead>
             <tbody>
               {drillData.rows.map((row, i) => (
                 <tr key={i}>
                   <th className="border border-black bg-slate-100 h-12 text-lg font-bold print:bg-white font-sans">
                     {row}
                   </th>
                   {drillData.cols.map((_, j) => (
                     <td key={j} className="border border-black h-12"></td>
                   ))}
                 </tr>
               ))}
             </tbody>
           </table>
           
           {/* Footer logo removed as requested */}
        </div>
      )}
    </div>
  );
};

export default MathDrillGenerator;
