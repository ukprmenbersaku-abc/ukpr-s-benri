import React, { useState, useRef, useEffect } from 'react';

const ImageEditor: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply filters to canvas when values change
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      // Handle rotation dimensions
      if (rotation % 180 !== 0) {
          canvas.width = img.height;
          canvas.height = img.width;
      } else {
          canvas.width = img.width;
          canvas.height = img.height;
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Move to center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // Rotate
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Flip
      ctx.scale(flipH ? -1 : 1, 1);
      
      // Filter (using Context filter if supported, or drawing logic)
      // Note: context.filter is supported in most modern browsers
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%)`;

      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      ctx.restore();
    };
  }, [imageSrc, brightness, contrast, grayscale, sepia, rotation, flipH]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target?.result as string);
        resetFilters();
      };
      reader.readAsDataURL(file);
    }
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setGrayscale(0);
    setSepia(0);
    setRotation(0);
    setFlipH(false);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          画像エディター
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        </h2>
        <p className="text-slate-500">
          ブラウザ上で簡単に画像の補正や回転ができます。
        </p>
      </div>

      {!imageSrc ? (
        <div 
          className="bg-white rounded-3xl p-12 shadow-xl shadow-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all group"
          onClick={() => fileInputRef.current?.click()}
        >
           <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
           </div>
           <h3 className="text-xl font-bold text-slate-700 mb-2">編集する画像を選択</h3>
           <button className="bg-pink-500 text-white px-6 py-3 rounded-full font-bold hover:bg-pink-600 transition-colors mt-4">
             画像を選択
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileSelect} 
             accept="image/*" 
             className="hidden" 
           />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Controls */}
          <div className="w-full lg:w-80 space-y-6">
             <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-700">Filters</h3>
                 <button onClick={resetFilters} className="text-xs text-pink-500 hover:underline">Reset</button>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <label className="flex justify-between text-sm text-slate-500 mb-1">
                     <span>明るさ</span>
                     <span>{brightness}%</span>
                   </label>
                   <input 
                     type="range" min="0" max="200" value={brightness} 
                     onChange={(e) => setBrightness(Number(e.target.value))}
                     className="w-full accent-pink-500"
                   />
                 </div>
                 <div>
                   <label className="flex justify-between text-sm text-slate-500 mb-1">
                     <span>コントラスト</span>
                     <span>{contrast}%</span>
                   </label>
                   <input 
                     type="range" min="0" max="200" value={contrast} 
                     onChange={(e) => setContrast(Number(e.target.value))}
                     className="w-full accent-pink-500"
                   />
                 </div>
                 <div>
                   <label className="flex justify-between text-sm text-slate-500 mb-1">
                     <span>グレースケール</span>
                     <span>{grayscale}%</span>
                   </label>
                   <input 
                     type="range" min="0" max="100" value={grayscale} 
                     onChange={(e) => setGrayscale(Number(e.target.value))}
                     className="w-full accent-pink-500"
                   />
                 </div>
                 <div>
                   <label className="flex justify-between text-sm text-slate-500 mb-1">
                     <span>セピア</span>
                     <span>{sepia}%</span>
                   </label>
                   <input 
                     type="range" min="0" max="100" value={sepia} 
                     onChange={(e) => setSepia(Number(e.target.value))}
                     className="w-full accent-pink-500"
                   />
                 </div>
               </div>
             </div>

             <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
               <h3 className="font-bold text-slate-700 mb-4">Transform</h3>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setRotation(r => r - 90)}
                   className="flex-1 p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"
                   title="Rotate Left"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                 </button>
                 <button 
                   onClick={() => setRotation(r => r + 90)}
                   className="flex-1 p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"
                   title="Rotate Right"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                 </button>
                 <button 
                   onClick={() => setFlipH(f => !f)}
                   className={`flex-1 p-2 rounded-lg transition-colors ${flipH ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                   title="Flip Horizontal"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="m19 12-5 5-5-5"/><path d="M12 19V5"/></svg> {/* Simplified flip icon */}
                 </button>
               </div>
             </div>

             <div className="flex flex-col gap-2">
                <button 
                  onClick={handleDownload}
                  className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  ダウンロード
                </button>
                <button 
                  onClick={() => setImageSrc(null)}
                  className="w-full bg-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-300 transition-all"
                >
                  別の画像を選ぶ
                </button>
             </div>
          </div>

          {/* Canvas Preview */}
          <div className="flex-1 bg-slate-900 rounded-2xl p-4 flex items-center justify-center min-h-[400px] overflow-hidden shadow-inner">
             <canvas 
               ref={canvasRef} 
               className="max-w-full max-h-[600px] object-contain shadow-2xl"
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageEditor;