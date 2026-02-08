
import React, { useState, useEffect, useRef } from 'react';
import Layout, { TabInfo, NAV_ITEMS } from './components/ui/Layout';
import MicrowaveCalculator from './components/tools/MicrowaveCalculator';
import DriveLinkConverter from './components/tools/DriveLinkConverter';
import SqliteManager from './components/tools/SqliteManager';
import ImageEditor from './components/tools/ImageEditor';
import ColorPaletteGenerator from './components/tools/ColorPaletteGenerator';
import MathDrillGenerator from './components/tools/MathDrillGenerator';
import SeatChangeHelper from './components/tools/SeatChangeHelper';
import SvgEditor from './components/tools/SvgEditor';
import TimeManager from './components/tools/TimeManager';
import SimpleCalendar from './components/tools/SimpleCalendar';
import GithubSyncGenerator from './components/tools/GithubSyncGenerator';
import { ToolType } from './types';

const App: React.FC = () => {
  // Tabs State
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: 'home', tool: ToolType.HOME, label: 'ホーム' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('home');

  // Currently active tool derived from activeTabId
  const activeTool = tabs.find(t => t.id === activeTabId)?.tool || ToolType.HOME;

  // Handle Space key for Color Palette Generator when active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && activeTool === ToolType.COLOR_PALETTE && e.target === document.body) {
        e.preventDefault();
        const buttons = document.querySelectorAll('button');
        buttons.forEach(b => {
            if (b.textContent?.includes('Generate')) (b as HTMLButtonElement).click();
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

  const handleSelectTool = (tool: ToolType) => {
    if (tool === ToolType.HOME) {
      setActiveTabId('home');
      return;
    }

    const existingTab = tabs.find(t => t.tool === tool);

    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const toolDef = NAV_ITEMS.find(item => item.id === tool);
      const newTab: TabInfo = {
        id: tool,
        tool: tool,
        label: toolDef?.label || 'Tool'
      };
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
    }
  };

  const handleCloseTab = (tabId: string) => {
    if (tabId === 'home') return;

    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      const nextTab = newTabs[newTabs.length - 1];
      setActiveTabId(nextTab ? nextTab.id : 'home');
    }
  };

  const handleReorderTabs = (newTabs: TabInfo[]) => {
    setTabs(newTabs);
  };

  const renderContent = () => {
    return (
        <>
            {tabs.map(tab => (
                <div 
                    key={tab.id} 
                    style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                    className="h-full"
                >
                    {tab.tool === ToolType.HOME && <Home onSelectTool={handleSelectTool} />}
                    {tab.tool === ToolType.TIME_MANAGER && <TimeManager />}
                    {tab.tool === ToolType.CALENDAR && <SimpleCalendar />}
                    {tab.tool === ToolType.MICROWAVE && <MicrowaveCalculator />}
                    {tab.tool === ToolType.MATH_DRILL && <MathDrillGenerator />}
                    {tab.tool === ToolType.SEAT_CHANGE && <SeatChangeHelper />}
                    {tab.tool === ToolType.DRIVE_CONVERTER && <DriveLinkConverter />}
                    {tab.tool === ToolType.SQLITE_MANAGER && <SqliteManager />}
                    {tab.tool === ToolType.IMAGE_EDITOR && <ImageEditor />}
                    {tab.tool === ToolType.COLOR_PALETTE && <ColorPaletteGenerator />}
                    {tab.tool === ToolType.SVG_EDITOR && <SvgEditor />}
                    {tab.tool === ToolType.GITHUB_SYNC_GENERATOR && <GithubSyncGenerator />}
                </div>
            ))}
        </>
    );
  };

  return (
    <Layout 
      activeTool={activeTool}
      onSelectTool={handleSelectTool}
      tabs={tabs}
      activeTabId={activeTabId}
      onSwitchTab={setActiveTabId}
      onCloseTab={handleCloseTab}
      onReorderTabs={handleReorderTabs}
    >
      {renderContent()}
    </Layout>
  );
};

const Home: React.FC<{ onSelectTool: (tool: ToolType) => void }> = ({ onSelectTool }) => {
  return (
    <div className="animate-fade-in">
      <div className="py-8 md:py-12 mb-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 inline-block mb-4">
          便利ツール集
        </h1>
        <p className="text-lg text-slate-600">
          日々の「ちょっと面倒」を解決する、シンプルで美しいツールたち。
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <ToolCard 
          title="GitHub同期ツール設定"
          description="AI Studioで作ったコードを自動でGitHubに送るPythonスクリプトを生成。"
          onClick={() => onSelectTool(ToolType.GITHUB_SYNC_GENERATOR)}
          colorClass="bg-slate-800"
          bgClass="bg-slate-100"
          hoverClass="hover:shadow-slate-500/10 group-hover:text-slate-900"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>}
        />
        <ToolCard 
          title="シンプルカレンダー"
          description="予定や日記を記録。ブラウザ保存に加え、ファイル書き出しにも対応。"
          onClick={() => onSelectTool(ToolType.CALENDAR)}
          colorClass="bg-violet-500"
          bgClass="bg-violet-100"
          hoverClass="hover:shadow-violet-500/10 group-hover:text-violet-600"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <ToolCard 
          title="時間管理ツール"
          description="時計、タイマー、ストップウォッチをひとつに。プレゼンや勉強に最適。"
          onClick={() => onSelectTool(ToolType.TIME_MANAGER)}
          colorClass="bg-teal-500"
          bgClass="bg-teal-100"
          hoverClass="hover:shadow-teal-500/10 group-hover:text-teal-600"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <ToolCard 
          title="レンジ温め計算機"
          description="500Wの時間を600W用に変換。お弁当や冷凍食品の温めに。"
          onClick={() => onSelectTool(ToolType.MICROWAVE)}
          colorClass="bg-orange-500"
          bgClass="bg-orange-100"
          hoverClass="hover:shadow-orange-500/10 group-hover:text-orange-600"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="4" rx="2" ry="2"/><line x1="16.95" x2="16.95" y1="9" y2="9.01"/><path d="M14 18v6"/><path d="M10 18v6"/><path d="M6 13h12"/></svg>}
        />
        <ToolCard 
          title="100マス計算メーカー"
          description="算数の基礎練習用プリントを自動生成。PDF保存や印刷も可能。"
          onClick={() => onSelectTool(ToolType.MATH_DRILL)}
          colorClass="bg-cyan-500"
          bgClass="bg-cyan-100"
          hoverClass="hover:shadow-cyan-500/10 group-hover:text-cyan-600"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M11 5v4"/><path d="M8 12h6"/></svg>}
        />
      </div>
    </div>
  );
};

const ToolCard: React.FC<{
  title: string;
  description: string;
  onClick: () => void;
  colorClass: string;
  bgClass: string;
  hoverClass: string;
  icon: React.ReactNode;
}> = ({ title, description, onClick, colorClass, bgClass, hoverClass, icon }) => {
  return (
    <button 
      onClick={onClick}
      className={`group relative bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl transition-all duration-300 text-left overflow-hidden ${hoverClass}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${bgClass} rounded-full blur-3xl -mr-10 -mt-10 opacity-50 transition-colors`}></div>
      <div className="relative z-10">
        <div className={`w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className={`text-2xl font-bold text-slate-800 mb-2 transition-colors`}>
          {title}
        </h3>
        <p className="text-slate-500 leading-relaxed text-sm">
          {description}
        </p>
      </div>
    </button>
  );
}

export default App;
