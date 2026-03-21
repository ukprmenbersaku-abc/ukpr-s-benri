
import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';

type PaperSize = 'A4' | 'A5' | 'B5';

interface GridConfig {
  rows: number;
  cols: number;
  paperSize: PaperSize;
  showCrossLines: boolean;
  showReadingBox: boolean;
  readingBoxPosition: 'left' | 'right';
  margin: number;
}

const KanjiPracticeGenerator: React.FC = () => {
  const [config, setConfig] = useState<GridConfig>({
    rows: 10,
    cols: 8,
    paperSize: 'A4',
    showCrossLines: true,
    showReadingBox: true,
    readingBoxPosition: 'right',
    margin: 15,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const paperDimensions: Record<PaperSize, { width: number; height: number }> = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    B5: { width: 182, height: 257 }, // JIS B5
  };

  const generatePDF = () => {
    setIsGenerating(true);
    try {
      const { width, height } = paperDimensions[config.paperSize];
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: config.paperSize.toLowerCase(),
      });

      const margin = config.margin;
      const availableWidth = width - margin * 2;
      const availableHeight = height - margin * 2;

      // Calculate square size and reading box width
      const readingRatio = 0.25;
      let kanjiSize: number;
      let readingWidth: number;

      if (config.showReadingBox) {
        kanjiSize = Math.min(availableHeight / config.rows, availableWidth / (config.cols * (1 + readingRatio)));
        readingWidth = kanjiSize * readingRatio;
      } else {
        kanjiSize = Math.min(availableHeight / config.rows, availableWidth / config.cols);
        readingWidth = 0;
      }

      const totalColWidth = kanjiSize + readingWidth;
      const gridWidth = totalColWidth * config.cols;
      const gridHeight = kanjiSize * config.rows;

      // Center the grid
      const startX = margin + (availableWidth - gridWidth) / 2;
      const startY = margin + (availableHeight - gridHeight) / 2;

      // Draw grid
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);

      for (let r = 0; r <= config.rows; r++) {
        const y = startY + r * kanjiSize;
        doc.line(startX, y, startX + gridWidth, y);
      }

      for (let c = 0; c <= config.cols; c++) {
        const x = startX + c * totalColWidth;
        doc.line(x, startY, x, startY + gridHeight);
        
        if (config.showReadingBox && c < config.cols) {
            const rx = config.readingBoxPosition === 'right' 
                ? startX + c * totalColWidth + kanjiSize 
                : startX + c * totalColWidth + readingWidth;
            
            // Draw the vertical line separating kanji box and reading box
            doc.line(rx, startY, rx, startY + gridHeight);
        }
      }

      // Cross lines
      if (config.showCrossLines) {
        doc.setLineDashPattern([1, 1], 0);
        doc.setLineWidth(0.1);
        doc.setDrawColor(200, 200, 200);
        for (let r = 0; r < config.rows; r++) {
          for (let c = 0; c < config.cols; c++) {
            const kanjiX = config.readingBoxPosition === 'right'
                ? startX + c * totalColWidth
                : startX + c * totalColWidth + readingWidth;
            
            const centerX = kanjiX + kanjiSize / 2;
            const centerY = startY + (r + 0.5) * kanjiSize;
            
            // Vertical cross line
            doc.line(centerX, startY + r * kanjiSize, centerX, startY + (r + 1) * kanjiSize);
            // Horizontal cross line
            doc.line(kanjiX, centerY, kanjiX + kanjiSize, centerY);
          }
        }
      }

      doc.save(`kanji_practice_${config.paperSize}_${config.rows}x${config.cols}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('PDFの作成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          漢字練習帳作成
        </h2>
        <p className="text-slate-500 mt-1">
          自分好みのマス目で漢字練習帳をPDFとして作成・ダウンロードできます。
        </p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                基本設定
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">行数 (縦)</label>
                  <input 
                    type="number" 
                    min="1" max="30"
                    value={config.rows}
                    onChange={(e) => setConfig({...config, rows: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">列数 (横)</label>
                  <input 
                    type="number" 
                    min="1" max="20"
                    value={config.cols}
                    onChange={(e) => setConfig({...config, cols: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">用紙サイズ</label>
                <div className="flex gap-2">
                  {(['A4', 'A5', 'B5'] as PaperSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => setConfig({...config, paperSize: size})}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                        config.paperSize === size 
                        ? 'bg-red-500 text-white border-red-500 shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                表示オプション
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={config.showCrossLines}
                      onChange={(e) => setConfig({...config, showCrossLines: e.target.checked})}
                      className="peer sr-only"
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-red-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">中心線を表示</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={config.showReadingBox}
                      onChange={(e) => setConfig({...config, showReadingBox: e.target.checked})}
                      className="peer sr-only"
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-red-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">ふりがな枠を表示</span>
                </label>

                {config.showReadingBox && (
                  <div className="ml-13 flex flex-col gap-2 animate-fade-in">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ふりがな枠の位置</label>
                    <div className="flex gap-2">
                      {(['left', 'right'] as const).map(pos => (
                        <button
                          key={pos}
                          onClick={() => setConfig({...config, readingBoxPosition: pos})}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            config.readingBoxPosition === pos 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {pos === 'left' ? '左側' : '右側'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 mt-8"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  作成中...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  PDFをダウンロード
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-xs text-slate-400 mb-4 font-bold uppercase tracking-widest">プレビュー (イメージ)</div>
            <div 
              className="bg-white shadow-xl border border-slate-200 overflow-hidden relative p-2"
              style={{
                aspectRatio: `${paperDimensions[config.paperSize].width} / ${paperDimensions[config.paperSize].height}`,
                width: '100%',
                maxWidth: '300px'
              }}
            >
              <div 
                className="grid h-full w-full"
                style={{
                  gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                  gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                  gap: '2px',
                  backgroundColor: '#f1f5f9'
                }}
              >
                {Array.from({ length: config.rows * config.cols }).map((_, i) => (
                  <div key={i} className={`bg-white relative flex ${config.readingBoxPosition === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Kanji Box */}
                    <div className="flex-grow relative border border-slate-100">
                      {config.showCrossLines && (
                        <>
                          <div className="absolute inset-y-0 left-1/2 w-[0.5px] border-l border-dashed border-slate-200"></div>
                          <div className="absolute inset-x-0 top-1/2 h-[0.5px] border-t border-dashed border-slate-200"></div>
                        </>
                      )}
                    </div>
                    {/* Reading Box */}
                    {config.showReadingBox && (
                      <div className="w-[25%] border border-slate-100 bg-slate-50/50"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-6 text-center">
              ※実際のPDFは設定した用紙サイズに合わせて<br/>正確にレイアウトされます。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 border-t border-slate-100">
        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12" y1="8" y2="8"/></svg>
          使い方
        </h4>
        <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
          <li>行数と列数を指定して、マスの数を調整します。</li>
          <li>用紙サイズ（A4, A5, B5）を選択します。</li>
          <li>中心線やふりがな枠の有無を切り替えられます。</li>
          <li>「PDFをダウンロード」ボタンを押すと、印刷用のPDFが生成されます。</li>
        </ul>
      </div>
    </div>
  );
};

export default KanjiPracticeGenerator;
