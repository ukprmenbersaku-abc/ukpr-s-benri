
import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Download, Type, Palette, Settings, Layers, Trash2, Plus, ArrowRight } from 'lucide-react';

const SequenceImageGenerator: React.FC = () => {
  const [startChar, setStartChar] = useState('1');
  const [endChar, setEndChar] = useState('10');
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(150);
  const [canvasSize, setCanvasSize] = useState(512);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewChar, setPreviewChar] = useState('');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [isTransparent, setIsTransparent] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPreviewChar(startChar);
  }, [startChar]);

  const generateSequence = (): string[] => {
    const sequence: string[] = [];
    
    // Check if both are numbers
    const startNum = parseInt(startChar);
    const endNum = parseInt(endChar);

    if (!isNaN(startNum) && !isNaN(endNum)) {
      const step = startNum <= endNum ? 1 : -1;
      for (let i = startNum; step > 0 ? i <= endNum : i >= endNum; i += step) {
        sequence.push(i.toString());
      }
      return sequence;
    }

    // Check if both are single characters (alphabet, hiragana, etc.)
    if (startChar.length === 1 && endChar.length === 1) {
      const startCode = startChar.charCodeAt(0);
      const endCode = endChar.charCodeAt(0);
      const step = startCode <= endCode ? 1 : -1;
      
      for (let i = startCode; step > 0 ? i <= endCode : i >= endCode; i += step) {
        sequence.push(String.fromCharCode(i));
      }
      return sequence;
    }

    // Fallback or error
    return [startChar, endChar];
  };

  const drawToCanvas = (text: string, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Background
    if (isTransparent && format === 'png') {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasSize, canvasSize);
    }

    // Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvasSize / 2, canvasSize / 2);
  };

  const generateSvg = (text: string): string => {
    const bg = isTransparent ? 'none' : bgColor;
    return `
      <svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
        ${!isTransparent ? `<rect width="100%" height="100%" fill="${bg}" />` : ''}
        <text 
          x="50%" 
          y="50%" 
          font-family="${fontFamily}" 
          font-size="${fontSize}" 
          font-weight="bold" 
          fill="${textColor}" 
          text-anchor="middle" 
          dominant-baseline="central"
        >${text}</text>
      </svg>
    `.trim();
  };

  const handleDownloadZip = async () => {
    setIsGenerating(true);
    const zip = new JSZip();
    const sequence = generateSequence();
    const canvas = document.createElement('canvas');

    try {
      for (let i = 0; i < sequence.length; i++) {
        const text = sequence[i];
        const fileName = `${i.toString().padStart(3, '0')}_${text}.${format}`;

        if (format === 'png') {
          drawToCanvas(text, canvas);
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          zip.file(fileName, base64Data, { base64: true });
        } else {
          const svgContent = generateSvg(text);
          zip.file(fileName, svgContent);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sequence_${startChar}_to_${endChar}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-slate-100 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Layers size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">連番画像メーカー</h2>
          <p className="text-slate-500 text-sm">数字や文字の連番画像をまとめて生成・ZIP保存します。</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={16} /> 範囲設定
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">開始</label>
                <input 
                  type="text" 
                  value={startChar}
                  onChange={(e) => setStartChar(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="1, A, あ..."
                />
              </div>
              <ArrowRight className="text-slate-300 mt-4" />
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">終了</label>
                <input 
                  type="text" 
                  value={endChar}
                  onChange={(e) => setEndChar(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="10, Z, ん..."
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">※数字または1文字の範囲を指定してください。</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={16} /> デザイン設定
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">文字色</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none"
                  />
                  <input 
                    type="text" 
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">背景色</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    disabled={isTransparent}
                    className={`w-10 h-10 rounded-lg cursor-pointer border-none ${isTransparent ? 'opacity-30' : ''}`}
                  />
                  <input 
                    type="text" 
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    disabled={isTransparent}
                    className={`flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2 ${isTransparent ? 'opacity-30' : ''}`}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="transparent" 
                checked={isTransparent}
                onChange={(e) => setIsTransparent(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="transparent" className="text-sm font-bold text-slate-600">背景を透過する (PNGのみ)</label>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Settings size={16} /> 書き出し設定
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">形式</label>
                <select 
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'svg')}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="png">PNG</option>
                  <option value="svg">SVG</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">画像サイズ (px)</label>
                <input 
                  type="number" 
                  value={canvasSize}
                  onChange={(e) => setCanvasSize(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">文字サイズ (px)</label>
                <input 
                  type="number" 
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">フォント</label>
                <select 
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="sans-serif">ゴシック体</option>
                  <option value="serif">明朝体</option>
                  <option value="monospace">等幅</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest self-start">プレビュー</h3>
          <div 
            className="relative border-4 border-slate-100 rounded-3xl overflow-hidden shadow-2xl bg-slate-200"
            style={{ width: 300, height: 300 }}
          >
            {/* Checkerboard background for transparency preview */}
            {isTransparent && (
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 10%, transparent 10%)', backgroundSize: '10px 10px' }}></div>
            )}
            
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ 
                backgroundColor: isTransparent ? 'transparent' : bgColor,
                color: textColor,
                fontFamily: fontFamily,
                fontSize: `${(fontSize / canvasSize) * 300}px`,
                fontWeight: 'bold'
              }}
            >
              {previewChar}
            </div>
          </div>

          <div className="w-full space-y-4">
            <button
              onClick={handleDownloadZip}
              disabled={isGenerating}
              className={`w-full py-4 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-3 transition-all ${
                isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  生成中...
                </>
              ) : (
                <>
                  <Download size={20} />
                  ZIP形式で一括ダウンロード
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400">
              {generateSequence().length} 枚の画像を生成します。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceImageGenerator;
