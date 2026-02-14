
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tabs } from '../ui/Tabs';

type Unit = 'px' | 'cm';

const SvgToPngConverter: React.FC = () => {
  const [svgInput, setSvgInput] = useState<string>('');
  const [unit, setUnit] = useState<Unit>('px');
  const [width, setWidth] = useState<number>(512);
  const [height, setHeight] = useState<number>(512);
  const [dpi, setDpi] = useState<number>(300);
  const [isTransparent, setIsTransparent] = useState<boolean>(true);
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Conversion logic for display dimensions
  const pixelWidth = useMemo(() => {
    if (unit === 'px') return width;
    return Math.round((width / 2.54) * dpi);
  }, [unit, width, dpi]);

  const pixelHeight = useMemo(() => {
    if (unit === 'px') return height;
    return Math.round((height / 2.54) * dpi);
  }, [unit, height, dpi]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSvgInput(event.target?.result as string);
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  /**
   * Processes the SVG input to ensure it's a valid standalone SVG image.
   * Adds xmlns if missing, wraps in <svg> if it's just path data.
   */
  const getProcessedSvg = (input: string) => {
    let processed = input.trim();
    if (!processed) return '';

    // If it doesn't start with <svg, wrap it (crude but helpful)
    if (!processed.toLowerCase().startsWith('<svg') && !processed.toLowerCase().startsWith('<?xml')) {
      processed = `<svg viewBox="0 0 ${width} ${height}">${processed}</svg>`;
    }

    // Ensure xmlns is present (Crucial for <img> loading)
    if (!processed.includes('xmlns="http://www.w3.org/2000/svg"')) {
      processed = processed.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    return processed;
  };

  const drawOnCanvas = async (): Promise<string | null> => {
    if (!svgInput || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    try {
      const finalSvg = getProcessedSvg(svgInput);
      const blob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      // Ensure crossOrigin is set if needed (though for Blobs it's usually fine)
      img.crossOrigin = "anonymous";
      img.src = url;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => {
          console.error("SVG Image Load Error:", e);
          reject(new Error('SVGの読み込みに失敗しました。形式（xmlns属性など）を確認してください。'));
        };
      });

      // Scale to fit target dimensions
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      setError(null);
      return canvas.toDataURL('image/png');
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const handleDownload = async () => {
    const dataUrl = await drawOnCanvas();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `converted_image_${pixelWidth}x${pixelHeight}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          SVG-PNG 変換ツール
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><path d="M5 12h14"/><path d="m15 8 4 4-4 4"/></svg>
        </h2>
        <p className="text-slate-500">
          SVGコードやファイルを任意の解像度でPNG画像に変換します。<br/>
          印刷用のcm指定やDPI設定にも対応しています。
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input & Config */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
              1. SVGデータの入力
            </h3>
            <div className="mb-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-orange-300 transition-all flex items-center justify-center gap-2 mb-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                SVGファイルをアップロード
              </button>
              <input type="file" ref={fileInputRef} accept=".svg" onChange={handleFileUpload} className="hidden" />
              <textarea 
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                placeholder="またはここにSVGコードを貼り付けてください... 例: <svg>...</svg>"
                className="w-full h-48 p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none resize-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
              2. 書き出し設定
            </h3>
            
            <div className="flex justify-center mb-6">
              <Tabs 
                activeTab={unit}
                onChange={(id) => setUnit(id as Unit)}
                tabs={[
                  { id: 'px', label: 'ピクセル (px)' },
                  { id: 'cm', label: 'センチ (cm)' }
                ]}
                className="bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">幅 ({unit})</label>
                <input 
                  type="number" 
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">高さ ({unit})</label>
                <input 
                  type="number" 
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {unit === 'cm' && (
              <div className="mb-6 animate-fade-in">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">解像度 (DPI)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="72" max="600" step="1" 
                    value={dpi} 
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="font-bold text-slate-700 w-16">{dpi} DPI</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">印刷用なら300〜350、Web用なら72〜96が一般的です。</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">背景を透明にする</span>
                <button 
                  onClick={() => setIsTransparent(!isTransparent)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isTransparent ? 'bg-orange-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isTransparent ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              
              {!isTransparent && (
                <div className="flex items-center justify-between animate-fade-in">
                  <span className="text-sm font-bold text-slate-600">背景色</span>
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-none p-0 overflow-hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Preview & Download */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            {/* Checkerboard pattern for transparency */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] pointer-events-none"></div>
            
            <div className="z-10 w-full flex flex-col items-center">
              {svgInput ? (
                <div className="max-w-full overflow-auto p-4 flex flex-col items-center">
                   <div 
                    className="shadow-2xl bg-white relative overflow-hidden"
                    style={{ 
                      width: 'min(100%, 300px)', 
                      aspectRatio: `${pixelWidth}/${pixelHeight}`,
                      backgroundColor: isTransparent ? 'transparent' : bgColor
                    }}
                    dangerouslySetInnerHTML={{ __html: getProcessedSvg(svgInput) }}
                   />
                   <div className="mt-4 text-center">
                      <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Output Pixel Size</p>
                      <p className="text-white font-bold text-xl">{pixelWidth} x {pixelHeight} px</p>
                   </div>
                </div>
              ) : (
                <div className="text-slate-500 flex flex-col items-center gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <p className="font-bold">Preview Area</p>
                </div>
              )}
            </div>

            {error && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                {error}
              </div>
            )}
          </div>

          <button 
            onClick={handleDownload}
            disabled={!svgInput}
            className="w-full bg-orange-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-orange-900/20 hover:bg-orange-500 transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            PNG画像として保存
          </button>

          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default SvgToPngConverter;
