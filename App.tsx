
import React, { useState, useEffect, useMemo } from 'react';
import Layout, { TabInfo, NAV_ITEMS } from './components/ui/Layout';
import MicrowaveCalculator from './components/tools/MicrowaveCalculator';
import DriveLinkConverter from './components/tools/DriveLinkConverter';
import SqliteManager from './components/tools/SqliteManager';
import ImageEditor from './components/tools/ImageEditor';
import ColorPaletteGenerator from './components/tools/ColorPaletteGenerator';
import MathDrillGenerator from './components/tools/MathDrillGenerator';
import SeatChangeHelper from './components/tools/SeatChangeHelper';
import SvgEditor from './components/tools/SvgEditor';
import SvgToPngConverter from './components/tools/SvgToPngConverter';
import PngToIcoConverter from './components/tools/PngToIcoConverter';
import TimeManager from './components/tools/TimeManager';
import SimpleCalendar from './components/tools/SimpleCalendar';
import GithubSyncGenerator from './components/tools/GithubSyncGenerator';
import { ToolType, ToolCategory } from './types';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: 'home', tool: ToolType.HOME, label: 'ホーム' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('home');

  const activeTool = tabs.find(t => t.id === activeTabId)?.tool || ToolType.HOME;

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
                    {tab.tool === ToolType.SVG_TO_PNG && <SvgToPngConverter />}
                    {tab.tool === ToolType.PNG_TO_ICO && <PngToIcoConverter />}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>(ToolCategory.ALL);

  const filteredItems = useMemo<typeof NAV_ITEMS>(() => {
    let items = NAV_ITEMS.filter(item => item.id !== ToolType.HOME);
    
    if (searchQuery) {
      items = items.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeCategory !== ToolCategory.ALL) {
      items = items.filter(item => item.category === activeCategory);
    }
    
    return items;
  }, [searchQuery, activeCategory]);

  const groupedItems = useMemo<Record<string, typeof NAV_ITEMS>>(() => {
    const groups: Record<string, typeof NAV_ITEMS> = {
      [ToolCategory.SCHOOL]: [],
      [ToolCategory.TECH]: [],
      [ToolCategory.GENERAL]: []
    };
    
    filteredItems.forEach(item => {
      if (groups[item.category]) groups[item.category].push(item);
    });
    
    return groups;
  }, [filteredItems]);

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

      {/* Search and Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between sticky top-16 md:top-20 z-20 py-2 bg-slate-50/80 backdrop-blur-md -mx-4 px-4">
        <div className="relative w-full md:w-80">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input 
            type="text" 
            placeholder="ツールを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 shadow-sm rounded-xl py-3 pl-10 pr-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
          />
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 overflow-x-auto max-w-full no-scrollbar">
          {Object.values(ToolCategory).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                ? 'bg-indigo-500 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {(Object.entries(groupedItems) as [string, typeof NAV_ITEMS][]).map(([category, items]) => {
          if (items.length === 0) return null;
          if (activeCategory !== ToolCategory.ALL && category !== activeCategory) return null;

          return (
            <section key={category} className="animate-fade-in">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">{category}</h2>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {items.map(item => {
                  const desc = NAV_DESCRIPTIONS[item.id] || "便利なツールです。";
                  return (
                    <ToolCard 
                      key={item.id}
                      title={item.label}
                      description={desc}
                      onClick={() => onSelectTool(item.id)}
                      colorClass={getBgColorClass(item.color)}
                      bgClass={getLightBgColorClass(item.color)}
                      hoverClass={`hover:shadow-${item.color.split('-')[1]}-500/10 group-hover:${item.color}`}
                      icon={item.icon}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="text-slate-300 mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M15 8h.01"/><path d="M12 12h.01"/><path d="M8 8h.01"/></svg>
            </div>
            <p className="text-slate-500 font-bold">該当するツールが見つかりませんでした。</p>
            <button 
              onClick={() => {setSearchQuery(''); setActiveCategory(ToolCategory.ALL);}}
              className="mt-4 text-indigo-500 font-bold hover:underline"
            >
              検索条件をクリアする
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const NAV_DESCRIPTIONS: Record<string, string> = {
  [ToolType.GITHUB_SYNC_GENERATOR]: "AI Studioで作ったコードを自動でGitHubに送るPythonスクリプトを生成。",
  [ToolType.CALENDAR]: "予定や日記を記録。ブラウザ保存に加え、ファイル書き出しにも対応。",
  [ToolType.TIME_MANAGER]: "時計、タイマー、ストップウォッチをひとつに。プレゼンや勉強に最適。",
  [ToolType.MICROWAVE]: "500Wの時間を600W用に変換。お弁当や冷凍食品の温めに。",
  [ToolType.MATH_DRILL]: "算数の基礎練習用プリントを自動生成。PDF保存や印刷も可能。",
  [ToolType.SEAT_CHANGE]: "席の固定も可能。アニメーション付きの発表モード搭載。",
  [ToolType.DRIVE_CONVERTER]: "共有リンクを埋め込み用や直接ダウンロード用に変換。",
  [ToolType.SQLITE_MANAGER]: "DBファイルをブラウザ上で閲覧・クエリ実行。",
  [ToolType.IMAGE_EDITOR]: "明るさ・コントラスト補正や回転が可能な簡易エディタ。",
  [ToolType.SVG_EDITOR]: "図形を描画してSVGコードを生成・保存。",
  [ToolType.SVG_TO_PNG]: "SVGを任意の解像度（px/cm）のPNG画像に変換。",
  [ToolType.PNG_TO_ICO]: "PNG画像からfavicon（.ico形式）を作成。マルチサイズ対応。",
  [ToolType.COLOR_PALETTE]: "ランダムまたはロック機能付きで配色を生成。",
};

const getBgColorClass = (colorText: string) => {
  const parts = colorText.split('-');
  if (parts.length < 2) return 'bg-slate-800';
  const color = parts[1];
  const weight = parts[2] || '500';
  return `bg-${color}-${weight}`;
};

const getLightBgColorClass = (colorText: string) => {
  const parts = colorText.split('-');
  if (parts.length < 2) return 'bg-slate-100';
  const color = parts[1];
  return `bg-${color}-100`;
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
          {React.cloneElement(icon as React.ReactElement, { width: 28, height: 28 })}
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
