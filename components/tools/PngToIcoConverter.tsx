
import React, { useState, useRef } from 'react';

const ICO_SIZES = [16, 32, 48, 64, 128, 256];

const PngToIcoConverter: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 48]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImageSrc(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleSize = (size: number) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  /**
   * Generates a multi-size ICO file from the source image.
   * ICO format structure:
   * 1. ICONDIR (6 bytes)
   * 2. ICONDIRENTRY (16 bytes * number of images)
   * 3. Image data (PNG bytes)
   */
  const generateIco = async () => {
    if (!imageSrc || selectedSizes.length === 0) return;
    setIsProcessing(true);

    try {
      const sortedSizes = [...selectedSizes].sort((a, b) => a - b);
      const imageDataPromises = sortedSizes.map(async (size) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        const img = new Image();
        img.src = imageSrc;
        await new Promise(res => img.onload = res);
        
        ctx.drawImage(img, 0, 0, size, size);
        
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
        if (!blob) throw new Error('Blob generation failed');
        return new Uint8Array(await blob.arrayBuffer());
      });

      const pngDataList = await Promise.all(imageDataPromises);
      
      // Calculate total file size
      const headerSize = 6;
      const directorySize = 16 * sortedSizes.length;
      let dataOffset = headerSize + directorySize;
      
      const totalSize = dataOffset + pngDataList.reduce((acc, curr) => acc + curr.length, 0);
      const icoBuffer = new Uint8Array(totalSize);
      const view = new DataView(icoBuffer.buffer);

      // 1. ICONDIR
      view.setUint16(0, 0, true);    // Reserved (0)
      view.setUint16(2, 1, true);    // Resource type (1 for icon)
      view.setUint16(4, sortedSizes.length, true); // Number of images

      // 2. ICONDIRENTRY list
      let currentDataOffset = dataOffset;
      pngDataList.forEach((pngData, i) => {
        const size = sortedSizes[i];
        const entryOffset = headerSize + (i * 16);
        
        view.setUint8(entryOffset + 0, size >= 256 ? 0 : size); // Width
        view.setUint8(entryOffset + 1, size >= 256 ? 0 : size); // Height
        view.setUint8(entryOffset + 2, 0);   // Color palette (0 if not used)
        view.setUint8(entryOffset + 3, 0);   // Reserved (0)
        view.setUint16(entryOffset + 4, 1, true); // Color planes (1)
        view.setUint16(entryOffset + 6, 32, true); // Bits per pixel (32 for PNG)
        view.setUint32(entryOffset + 8, pngData.length, true); // Data size
        view.setUint32(entryOffset + 12, currentDataOffset, true); // Data offset

        // 3. Image data
        icoBuffer.set(pngData, currentDataOffset);
        currentDataOffset += pngData.length;
      });

      // Trigger download
      const blob = new Blob([icoBuffer], { type: 'image/x-icon' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'favicon.ico';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('ICOの生成中にエラーが発生しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          favicon作成 (ICO変換)
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-700"><path d="M6 3h12l4 4v14H2V7l4-4z"/><path d="M12 13v5"/><path d="m9 15 3 3 3-3"/><path d="M12 3v4"/><path d="M18 3v4"/><path d="M6 3v4"/></svg>
        </h2>
        <p className="text-slate-500">
          PNG画像からWebサイト用のfavicon（.ico）を作成します。<br/>
          複数のサイズを1つのファイルに含めることができ、マルチデバイスに対応します。
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {!imageSrc ? (
          <div 
            className="bg-white rounded-3xl p-16 shadow-xl shadow-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
            onClick={() => fileInputRef.current?.click()}
          >
             <div className="w-24 h-24 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
             </div>
             <h3 className="text-xl font-bold text-slate-700 mb-2">PNG画像をアップロード</h3>
             <p className="text-slate-400 text-sm mb-6">正方形の画像を推奨します</p>
             <button className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg">
               ファイルを選択
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileSelect} 
               accept="image/png" 
               className="hidden" 
             />
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                  含めるサイズを選択
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {ICO_SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all font-bold text-sm ${
                        selectedSizes.includes(size)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedSizes.includes(size) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white'}`}>
                        {selectedSizes.includes(size) && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      {size} x {size}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={generateIco}
                    disabled={selectedSizes.length === 0 || isProcessing}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? '処理中...' : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        .ico を生成して保存
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setImageSrc(null)}
                    className="w-full text-slate-400 font-bold py-2 rounded-xl hover:text-red-500 transition-colors text-sm"
                  >
                    別の画像を選ぶ
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Previews */}
            <div className="lg:col-span-3">
               <div className="bg-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col items-center">
                 {/* Transparency background */}
                 <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] pointer-events-none"></div>
                 
                 <h4 className="relative z-10 text-white/50 text-xs font-bold uppercase tracking-widest mb-10">サイズ別プレビュー</h4>
                 
                 <div className="relative z-10 w-full flex flex-wrap justify-center items-end gap-10">
                    {sortedSelectedSizes().map(size => (
                      <div key={size} className="flex flex-col items-center gap-4">
                        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 flex items-center justify-center">
                          <img 
                            src={imageSrc} 
                            style={{ width: size, height: size, imageRendering: 'pixelated' }} 
                            alt={`${size}px preview`} 
                            className="shadow-2xl"
                          />
                        </div>
                        <span className="text-white/40 text-[10px] font-bold font-mono">{size}px</span>
                      </div>
                    ))}
                    {selectedSizes.length === 0 && (
                      <div className="py-20 text-white/20 font-bold">サイズを選択してください</div>
                    )}
                 </div>
               </div>

               <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-800 text-xs leading-relaxed">
                 <p className="font-bold mb-1">💡 faviconとは？</p>
                 ブラウザのタブやブックマークに表示されるアイコンです。Windows用アイコンファイル（.ico）は複数のサイズを1つのファイルにまとめられるため、デスクトップ用とブラウザ用で最適な解像度を自動で切り替えることができます。
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function sortedSelectedSizes() {
    return [...selectedSizes].sort((a, b) => b - a);
  }
};

export default PngToIcoConverter;
