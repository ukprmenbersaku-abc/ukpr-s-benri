
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ToolType } from '../../types';

export interface TabInfo {
  id: string;
  tool: ToolType;
  label: string;
}

interface LayoutProps {
  children: React.ReactNode;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  // Multi-tab props
  tabs: TabInfo[];
  activeTabId: string;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTabs: (tabs: TabInfo[]) => void;
}

// Brand Icon Component (Used in Nav and Sidebar)
const BrandIcon: React.FC<{ size?: number, className?: string }> = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="4" transform="rotate(-10 12 12)" className="fill-indigo-500" />
    <rect x="4" y="4" width="16" height="16" rx="4" transform="rotate(10 12 12)" className="fill-blue-600" />
    <path d="M12 8L13.5 11L16.5 12L13.5 13L12 16L10.5 13L7.5 12L10.5 11L12 8Z" className="fill-white" />
  </svg>
);

// Tool Definitions for Navigation
export const NAV_ITEMS = [
  { 
    id: ToolType.HOME, 
    label: 'ホーム', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    color: 'text-indigo-600'
  },
  { 
    id: ToolType.CALENDAR, 
    label: 'シンプルカレンダー', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    color: 'text-violet-500'
  },
  { 
    id: ToolType.TIME_MANAGER, 
    label: '時間管理ツール', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    color: 'text-teal-500'
  },
  { 
    id: ToolType.MICROWAVE, 
    label: 'レンジ計算機', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="4" rx="2" ry="2"/><line x1="16.95" x2="16.95" y1="9" y2="9.01"/><path d="M14 18v6"/><path d="M10 18v6"/><path d="M6 13h12"/></svg>,
    color: 'text-orange-500'
  },
  { 
    id: ToolType.GITHUB_SYNC_GENERATOR, 
    label: 'GitHub同期ツール', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>,
    color: 'text-slate-800'
  },
  { 
    id: ToolType.MATH_DRILL, 
    label: '100マス計算', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M11 5v4"/><path d="M8 12h6"/></svg>,
    color: 'text-cyan-500'
  },
  { 
    id: ToolType.SEAT_CHANGE, 
    label: '席替えお助け', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21h20"/><path d="M2 3h20"/><path d="M5 3v18"/><path d="M19 3v18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>,
    color: 'text-lime-500'
  },
  { 
    id: ToolType.DRIVE_CONVERTER, 
    label: 'Drive URL変換', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>,
    color: 'text-blue-500'
  },
  { 
    id: ToolType.SQLITE_MANAGER, 
    label: 'SQLiteビューアー', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    color: 'text-emerald-600'
  },
  { 
    id: ToolType.IMAGE_EDITOR, 
    label: '画像エディター', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
    color: 'text-pink-500'
  },
  { 
    id: ToolType.SVG_EDITOR, 
    label: 'SVGエディター', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
    color: 'text-amber-500'
  },
  { 
    id: ToolType.COLOR_PALETTE, 
    label: 'カラーパレット', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
    color: 'text-purple-500'
  }
];

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTool, 
  onSelectTool,
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onReorderTabs
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // DnD States
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    startX: number;
    currentX: number;
    initialLeft: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Responsive check
  useEffect(() => {
    const checkSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- Drag and Drop Handlers (Pointer Events) ---
  const handleTabPointerDown = (e: React.PointerEvent, tabId: string) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    target.setPointerCapture(e.pointerId);
    
    setDraggingTabId(tabId);
    setDragState({
      startX: e.clientX,
      currentX: e.clientX,
      initialLeft: rect.left,
      top: rect.top, 
      width: rect.width,
      height: rect.height
    });
  };

  const handleTabPointerMove = (e: React.PointerEvent) => {
    if (!draggingTabId || !dragState) return;
    e.preventDefault();
    setDragState(prev => prev ? ({ ...prev, currentX: e.clientX }) : null);

    if (tabsContainerRef.current) {
        const draggingIndex = tabs.findIndex(t => t.id === draggingTabId);
        if (draggingIndex === -1) return;

        const nodes = Array.from(tabsContainerRef.current.children) as HTMLElement[];
        let swapTargetIndex = -1;
        
        for (let i = 0; i < tabs.length; i++) {
            if (i === draggingIndex) continue;
            const node = nodes[i];
            if (!node) continue;
            const rect = node.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right) {
                swapTargetIndex = i;
                break;
            }
        }

        if (swapTargetIndex !== -1) {
            const newTabs = [...tabs];
            const [movedItem] = newTabs.splice(draggingIndex, 1);
            newTabs.splice(swapTargetIndex, 0, movedItem);
            onReorderTabs(newTabs);
        }
    }
  };

  const handleTabPointerUp = (e: React.PointerEvent) => {
    if (draggingTabId) {
       (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
       setDraggingTabId(null);
       setDragState(null);
    }
  };

  const renderTab = (tab: TabInfo, isOverlay: boolean = false) => {
    const isActive = activeTabId === tab.id;
    const isHome = tab.tool === ToolType.HOME;
    const itemDef = NAV_ITEMS.find(i => i.id === tab.tool);
    const isDragging = draggingTabId === tab.id;
    
    let className = `
      group relative flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-bold transition-all min-w-[140px] max-w-[220px] shrink-0 h-full select-none
    `;
    
    if (isOverlay) {
        className += ` shadow-xl bg-white text-slate-800 ring-1 ring-slate-200 cursor-grabbing rounded-t-lg z-[9999]`;
    } else {
        if (isDragging) {
           className += ` opacity-0`; 
        } else if (isActive) {
           className += ` 
             bg-white 
             text-slate-800 
             z-10 
             shadow-sm
             border-t border-x border-slate-200
             cursor-default
           `;
        } else {
           className += ` 
             bg-slate-100 
             text-slate-500 
             hover:bg-slate-200 
             hover:text-slate-700 
             cursor-pointer 
             border-t border-x border-transparent 
             hover:border-slate-200
           `;
        }
    }

    const style: React.CSSProperties = isOverlay && dragState ? {
        position: 'fixed',
        top: `${dragState.top}px`, 
        left: `${dragState.initialLeft + (dragState.currentX - dragState.startX)}px`,
        width: `${dragState.width}px`,
        height: `${dragState.height}px`,
        zIndex: 9999, 
        pointerEvents: 'none', 
        transition: 'none', 
        boxSizing: 'border-box'
    } : {};

    return (
      <div 
        key={isOverlay ? `overlay-${tab.id}` : tab.id}
        onPointerDown={!isOverlay ? (e) => handleTabPointerDown(e, tab.id) : undefined}
        onPointerMove={!isOverlay ? handleTabPointerMove : undefined}
        onPointerUp={!isOverlay ? handleTabPointerUp : undefined}
        onClick={!isOverlay ? () => onSwitchTab(tab.id) : undefined}
        className={className}
        style={style}
      >
        {/* Top accent line for active */}
        {(isActive || isOverlay) && (
          <div className="absolute top-0 inset-x-0 h-0.5 bg-indigo-500 rounded-t-full" />
        )}

        <span className={`relative z-10 ${isActive || isOverlay ? itemDef?.color : 'text-slate-400'}`}>
          {itemDef?.icon}
        </span>
        <span className="relative z-10 truncate flex-1 pointer-events-none tracking-wide">{tab.label}</span>
        
        {!isHome && (
          <button 
            onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
            className={`relative z-10 p-0.5 rounded-full hover:bg-slate-300 transition-colors flex items-center justify-center w-5 h-5 ${isActive || isOverlay ? 'text-slate-400 hover:text-red-500' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
    );
  };

  const draggingTabObj = draggingTabId ? tabs.find(t => t.id === draggingTabId) : null;

  return (
    <div className="min-h-screen text-slate-800 font-sans print:bg-white print:block relative overflow-hidden bg-slate-50">
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out print:hidden
          bg-white border-r border-slate-200 shadow-sm
          ${isMobile ? (isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64') : (isSidebarOpen ? 'w-64' : 'w-20')}
        `}
      >
        <div className="h-16 flex items-center border-b border-slate-100 relative">
           <div className="w-20 shrink-0 flex items-center justify-center h-full">
             <button 
               onClick={toggleSidebar}
               className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
               title={isSidebarOpen ? "メニューを閉じる" : "メニューを開く"}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
             </button>
           </div>
           
           <div className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              <div className="flex items-center gap-2 px-2">
                <BrandIcon size={28} />
                <div className="flex flex-col justify-center leading-none">
                  <span className="font-black text-slate-800 text-lg tracking-tight">Benri</span>
                  <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Tools</span>
                </div>
              </div>
           </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTool === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTool(item.id);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                title={item.label}
                className={`
                  w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-slate-100 text-indigo-700 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                  ${!isSidebarOpen && !isMobile ? 'justify-center gap-0' : 'gap-3'}
                `}
              >
                <span className={`shrink-0 transition-transform duration-300 relative z-10 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${item.color}`}>
                  {item.icon}
                </span>
                <span className={`whitespace-nowrap text-sm transition-all duration-300 relative z-10 ${!isSidebarOpen && !isMobile ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                  {item.label}
                </span>
                
                {!isSidebarOpen && !isMobile && (
                  <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-md">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Wrapper */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 relative z-10 print:ml-0 print:w-full ${!isMobile ? (isSidebarOpen ? 'ml-64' : 'ml-20') : ''}`}
      >
        {/* Top Header & Tab Bar */}
        <div className="bg-slate-50 border-b border-slate-200 flex items-end pt-3 px-2 md:px-4 sticky top-0 z-30 print:hidden w-full overflow-hidden shrink-0">
            {isMobile && (
              <button 
                onClick={toggleSidebar}
                className="mr-2 p-3 rounded-lg hover:bg-white text-slate-500 transition-colors shrink-0 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
              </button>
            )}

            {/* Scrollable Tabs Container */}
            <div 
              ref={tabsContainerRef}
              className="flex-1 flex items-end gap-1 overflow-x-auto no-scrollbar pb-0 h-12"
            >
              {tabs.map((tab) => renderTab(tab))}
            </div>
        </div>

        {/* Dragging Overlay (Rendered into Body Portal) */}
        {draggingTabObj && dragState && createPortal(
          renderTab(draggingTabObj, true),
          document.body
        )}

        {/* Page Content */}
        <main className="flex-grow bg-slate-50 print:bg-white relative min-h-[calc(100vh-4rem)]">
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full print:p-0 print:max-w-none">
            {children}
          </div>
        </main>
        
        <footer className="py-6 bg-slate-50 text-center text-slate-400 text-xs print:hidden font-sans border-t border-slate-200">
          <p>© 2024 Benri Tools Collection.</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
