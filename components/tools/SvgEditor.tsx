import React, { useState, useRef, useEffect } from 'react';

// --- Types ---

type Tool = 'select' | 'rect' | 'circle' | 'pen';

interface SvgShape {
  id: string;
  type: 'rect' | 'circle' | 'path';
  fill: string;
  stroke: string;
  strokeWidth: number;
  // Rect props
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Circle props
  cx?: number;
  cy?: number;
  r?: number;
  // Path props
  points?: { x: number; y: number }[];
}

interface DrawingDoc {
  id: string;
  name: string;
  shapes: SvgShape[];
  bgWidth: number;
  bgHeight: number;
}

// --- Icons ---

const Icons = {
  Select: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>,
  Rect: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>,
  Circle: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>,
  Pen: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Undo: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>,
};

const SvgEditor: React.FC = () => {
  // --- State ---
  const [docs, setDocs] = useState<DrawingDoc[]>([
    { id: '1', name: 'Drawing 1', shapes: [], bgWidth: 500, bgHeight: 400 }
  ]);
  const [activeDocId, setActiveDocId] = useState('1');
  const [tool, setTool] = useState<Tool>('select');
  
  // Style State
  const [fillColor, setFillColor] = useState('#fbbf24'); // Amber-400
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);

  // Interaction State
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentShape, setCurrentShape] = useState<SvgShape | null>(null);
  
  // Refs
  const svgRef = useRef<SVGSVGElement>(null);

  const activeDoc = docs.find(d => d.id === activeDocId) || docs[0];

  // --- Helpers ---

  const generateId = () => `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const getMousePos = (e: React.PointerEvent | React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // --- Actions ---

  const updateDocShapes = (docId: string, newShapes: SvgShape[]) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, shapes: newShapes } : d));
  };

  const addDoc = () => {
    const newId = generateId();
    setDocs([...docs, { id: newId, name: `Drawing ${docs.length + 1}`, shapes: [], bgWidth: 500, bgHeight: 400 }]);
    setActiveDocId(newId);
  };

  const removeDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (docs.length <= 1) return;
    const newDocs = docs.filter(d => d.id !== id);
    setDocs(newDocs);
    if (activeDocId === id) setActiveDocId(newDocs[0].id);
  };

  const renameDoc = (id: string, newName: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
  };

  const deleteSelected = () => {
    if (!selectedShapeId) return;
    const newShapes = activeDoc.shapes.filter(s => s.id !== selectedShapeId);
    updateDocShapes(activeDoc.id, newShapes);
    setSelectedShapeId(null);
  };

  const clearCanvas = () => {
    if (confirm('キャンバスをクリアしますか？')) {
      updateDocShapes(activeDoc.id, []);
      setSelectedShapeId(null);
    }
  };

  // --- Event Handlers ---

  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getMousePos(e);
    setDragStart(pos);
    setIsDragging(true);

    if (tool === 'select') {
      // Logic handled in shape's onPointerDown, or here if clicking background to deselect
      if (e.target === svgRef.current) {
        setSelectedShapeId(null);
      }
      return;
    }

    // Start creating shape
    const newId = generateId();
    let newShape: SvgShape | null = null;

    if (tool === 'rect') {
      newShape = {
        id: newId, type: 'rect', fill: fillColor, stroke: strokeColor, strokeWidth,
        x: pos.x, y: pos.y, width: 0, height: 0
      };
    } else if (tool === 'circle') {
      newShape = {
        id: newId, type: 'circle', fill: fillColor, stroke: strokeColor, strokeWidth,
        cx: pos.x, cy: pos.y, r: 0
      };
    } else if (tool === 'pen') {
      newShape = {
        id: newId, type: 'path', fill: 'none', stroke: strokeColor, strokeWidth,
        points: [{ x: pos.x, y: pos.y }]
      };
    }

    setCurrentShape(newShape);
    setSelectedShapeId(null); // Deselect when drawing
    // Capture pointer to ensure we get moves outside canvas
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart) return;
    const pos = getMousePos(e);

    if (tool === 'select' && selectedShapeId) {
      // Moving existing shape
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      
      const newShapes = activeDoc.shapes.map(s => {
        if (s.id !== selectedShapeId) return s;
        if (s.type === 'rect') return { ...s, x: (s.x || 0) + dx, y: (s.y || 0) + dy };
        if (s.type === 'circle') return { ...s, cx: (s.cx || 0) + dx, cy: (s.cy || 0) + dy };
        if (s.type === 'path' && s.points) {
             return { ...s, points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
        }
        return s;
      });
      
      updateDocShapes(activeDoc.id, newShapes);
      setDragStart(pos); // Reset drag start to current for continuous delta
      return;
    }

    if (currentShape) {
      // Resizing/Drawing new shape
      if (tool === 'rect') {
        const x = Math.min(pos.x, dragStart.x);
        const y = Math.min(pos.y, dragStart.y);
        const w = Math.abs(pos.x - dragStart.x);
        const h = Math.abs(pos.y - dragStart.y);
        setCurrentShape({ ...currentShape, x, y, width: w, height: h });
      } else if (tool === 'circle') {
        const r = Math.sqrt(Math.pow(pos.x - dragStart.x, 2) + Math.pow(pos.y - dragStart.y, 2));
        setCurrentShape({ ...currentShape, r });
      } else if (tool === 'pen') {
        setCurrentShape({
          ...currentShape,
          points: [...(currentShape.points || []), pos]
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setDragStart(null);
    if (currentShape) {
      // Finalize shape
      // Prevent zero-size shapes
      const isValid = (
         (currentShape.type === 'rect' && (currentShape.width || 0) > 2) ||
         (currentShape.type === 'circle' && (currentShape.r || 0) > 2) ||
         (currentShape.type === 'path' && (currentShape.points || []).length > 1)
      );

      if (isValid) {
        updateDocShapes(activeDoc.id, [...activeDoc.shapes, currentShape]);
      }
      setCurrentShape(null);
    }
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  // Shape Selection Handlers
  const handleShapePointerDown = (e: React.PointerEvent, id: string) => {
    if (tool === 'select') {
      e.stopPropagation(); // Don't trigger canvas click
      setSelectedShapeId(id);
      setDragStart(getMousePos(e));
      setIsDragging(true);
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  // --- SVG Code Generation ---

  const generatePathD = (points: {x: number, y: number}[] | undefined) => {
    if (!points || points.length === 0) return '';
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  };

  const renderShape = (s: SvgShape) => {
     if (s.type === 'rect') {
       return <rect key={s.id} x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />;
     }
     if (s.type === 'circle') {
       return <circle key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />;
     }
     if (s.type === 'path') {
       return <path key={s.id} d={generatePathD(s.points)} fill="none" stroke={s.stroke} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />;
     }
     return null;
  };

  const getSvgCode = () => {
    const content = activeDoc.shapes.map(s => {
      if (s.type === 'rect') return `  <rect x="${Math.round(s.x!)}" y="${Math.round(s.y!)}" width="${Math.round(s.width!)}" height="${Math.round(s.height!)}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />`;
      if (s.type === 'circle') return `  <circle cx="${Math.round(s.cx!)}" cy="${Math.round(s.cy!)}" r="${Math.round(s.r!)}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />`;
      if (s.type === 'path') return `  <path d="${generatePathD(s.points)}" fill="none" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
      return '';
    }).join('\n');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${activeDoc.bgWidth} ${activeDoc.bgHeight}" width="${activeDoc.bgWidth}" height="${activeDoc.bgHeight}">\n${content}\n</svg>`;
  };

  const handleDownload = () => {
    const blob = new Blob([getSvgCode()], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDoc.name.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in-up flex flex-col h-[calc(100vh-8rem)]">
      
      {/* Header & Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
         <h2 className="text-xl font-bold text-slate-700 mr-4 flex items-center gap-2 whitespace-nowrap">
           <span className="text-amber-500"><Icons.Pen /></span>
           SVGエディター
         </h2>
         <div className="flex gap-1 flex-1">
           {docs.map(doc => (
             <div 
               key={doc.id}
               className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2 transition-colors cursor-pointer min-w-[120px] max-w-[200px] ${
                 activeDocId === doc.id 
                 ? 'bg-white border-amber-500 text-slate-800 shadow-sm' 
                 : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'
               }`}
               onClick={() => setActiveDocId(doc.id)}
             >
                <input 
                  value={doc.name}
                  onChange={(e) => renameDoc(doc.id, e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold w-full cursor-pointer focus:cursor-text"
                  onClick={(e) => e.stopPropagation()} // Allow editing without switching logic interfering
                />
                <button 
                  onClick={(e) => removeDoc(doc.id, e)}
                  className={`opacity-0 group-hover:opacity-100 hover:text-red-500 ${docs.length === 1 ? 'hidden' : ''}`}
                >
                  <Icons.X />
                </button>
             </div>
           ))}
           <button 
             onClick={addDoc}
             className="px-2 py-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
             title="新規キャンバス"
           >
             <Icons.Plus />
           </button>
         </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-4 flex flex-wrap items-center gap-4 shrink-0">
        {/* Tools */}
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
           {(['select', 'rect', 'circle', 'pen'] as Tool[]).map(t => (
             <button
               key={t}
               onClick={() => setTool(t)}
               className={`p-2 rounded-md transition-all ${
                 tool === t 
                 ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200' 
                 : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
               }`}
               title={t}
             >
               {t === 'select' && <Icons.Select />}
               {t === 'rect' && <Icons.Rect />}
               {t === 'circle' && <Icons.Circle />}
               {t === 'pen' && <Icons.Pen />}
             </button>
           ))}
        </div>

        <div className="w-px h-8 bg-slate-200"></div>

        {/* Styles */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Fill</label>
            <div className="flex items-center gap-1">
              <input 
                type="color" 
                value={fillColor} 
                onChange={e => setFillColor(e.target.value)} 
                className="w-6 h-6 rounded cursor-pointer border-none p-0 overflow-hidden"
              />
              <button onClick={() => setFillColor('none')} className="text-xs text-slate-400 hover:text-red-500 border rounded px-1">None</button>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Stroke</label>
            <div className="flex items-center gap-1">
              <input 
                type="color" 
                value={strokeColor} 
                onChange={e => setStrokeColor(e.target.value)} 
                className="w-6 h-6 rounded cursor-pointer border-none p-0 overflow-hidden"
              />
              <input 
                type="number" 
                min="0" 
                max="20" 
                value={strokeWidth} 
                onChange={e => setStrokeWidth(Number(e.target.value))}
                className="w-10 text-xs border rounded p-1"
                title="Width"
              />
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200"></div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {selectedShapeId && (
            <button 
              onClick={deleteSelected}
              className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
            >
              <Icons.Trash /> <span className="hidden sm:inline">削除</span>
            </button>
          )}
          <button 
            onClick={clearCanvas}
            className="text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            Clear
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-1 bg-amber-500 text-white hover:bg-amber-600 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Icons.Download /> 保存
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-slate-200/50 rounded-xl border border-slate-300 overflow-hidden relative flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/grid.png')]">
         <svg
           ref={svgRef}
           viewBox={`0 0 ${activeDoc.bgWidth} ${activeDoc.bgHeight}`}
           width={activeDoc.bgWidth}
           height={activeDoc.bgHeight}
           className="bg-white shadow-xl cursor-crosshair touch-none"
           onPointerDown={handlePointerDown}
           onPointerMove={handlePointerMove}
           onPointerUp={handlePointerUp}
           onPointerLeave={handlePointerUp}
           style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
         >
            {/* Render Existing Shapes */}
            {activeDoc.shapes.map(s => {
              const el = renderShape(s);
              const isSelected = s.id === selectedShapeId;
              
              // Wrap in group for selection handling
              return (
                <g 
                  key={s.id} 
                  onPointerDown={(e) => handleShapePointerDown(e, s.id)}
                  className={tool === 'select' ? 'cursor-move' : ''}
                  style={{ opacity: isSelected ? 0.8 : 1 }}
                >
                  {el}
                  {isSelected && s.type === 'rect' && (
                     <rect x={s.x! - 2} y={s.y! - 2} width={s.width! + 4} height={s.height! + 4} fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" pointerEvents="none" />
                  )}
                  {isSelected && s.type === 'circle' && (
                     <rect x={s.cx! - s.r! - 2} y={s.cy! - s.r! - 2} width={s.r! * 2 + 4} height={s.r! * 2 + 4} fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" pointerEvents="none" />
                  )}
                </g>
              );
            })}

            {/* Render Shape currently being drawn */}
            {currentShape && (
              <g style={{ opacity: 0.5, pointerEvents: 'none' }}>
                {renderShape(currentShape)}
              </g>
            )}
         </svg>
         
         <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] text-slate-400 font-mono pointer-events-none">
           {activeDoc.bgWidth} x {activeDoc.bgHeight}
         </div>
      </div>

      {/* Code Panel (Sub) */}
      <div className="mt-4 bg-slate-900 rounded-xl p-0 overflow-hidden flex flex-col shrink-0 h-40 border border-slate-700">
         <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
           <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Generated SVG Code</span>
           <button 
             onClick={() => navigator.clipboard.writeText(getSvgCode())}
             className="text-xs text-amber-400 hover:text-amber-300 font-bold"
           >
             Copy Code
           </button>
         </div>
         <textarea
           readOnly
           value={getSvgCode()}
           className="flex-1 w-full p-4 bg-slate-900 text-slate-300 font-mono text-xs focus:outline-none resize-none"
         />
      </div>

    </div>
  );
};

export default SvgEditor;