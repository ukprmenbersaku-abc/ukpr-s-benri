import React, { useState, useEffect } from 'react';

interface Color {
  hex: string;
  locked: boolean;
}

const ColorPaletteGenerator: React.FC = () => {
  const [palette, setPalette] = useState<Color[]>([]);

  const generateRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const generatePalette = () => {
    setPalette(prev => {
      const newPalette = [];
      // If we have previous palette, keep locked ones. 
      for (let i = 0; i < 5; i++) {
        if (prev[i] && prev[i].locked) {
          newPalette.push(prev[i]);
        } else {
          newPalette.push({ hex: generateRandomColor(), locked: false });
        }
      }
      return newPalette;
    });
  };

  useEffect(() => {
    generatePalette();
  }, []);

  const toggleLock = (index: number) => {
    setPalette(prev => prev.map((c, i) => i === index ? { ...c, locked: !c.locked } : c));
  };

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    // Could show a toast here
  };

  return (
    <div className="animate-fade-in-up flex flex-col">
       <div className="text-center mb-8 shrink-0">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          カラーパレット
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
        </h2>
        <p className="text-slate-500">
          スペースキーまたはボタンで新しい配色パターンを生成します。
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-80 md:h-96 w-full mb-8">
        {palette.map((color, index) => (
          <div 
            key={index} 
            className="flex-1 rounded-2xl shadow-lg relative group transition-all duration-300 flex flex-col justify-end p-4 overflow-hidden min-h-[100px]"
            style={{ backgroundColor: color.hex }}
          >
             {/* Hover overlay */}
             <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             
             {/* Controls */}
             <div className="relative z-10 flex flex-col items-center gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 mb-auto mt-auto">
               <button 
                 onClick={() => copyToClipboard(color.hex)}
                 className="text-white bg-black/20 backdrop-blur-md px-6 py-2 rounded-full font-bold hover:bg-black/40 transition-colors"
               >
                 Copy
               </button>
               <button 
                 onClick={() => toggleLock(index)}
                 className={`p-3 rounded-full backdrop-blur-md transition-colors ${color.locked ? 'bg-white/90 text-purple-600' : 'bg-black/20 text-white hover:bg-black/40'}`}
               >
                 {color.locked ? (
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                 )}
               </button>
             </div>

             <h3 className="relative z-10 text-center font-mono font-bold text-white/90 text-xl tracking-wider uppercase drop-shadow-md bg-black/10 rounded-lg py-2 backdrop-blur-sm mx-2">
               {color.hex}
             </h3>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button 
          onClick={generatePalette}
          className="bg-slate-800 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-slate-700 hover:scale-105 transition-all inline-flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
          Generate (Space)
        </button>
      </div>
    </div>
  );
};

export default ColorPaletteGenerator;