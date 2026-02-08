
import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`
      inline-flex p-1 rounded-xl relative
      bg-slate-200 border border-slate-300
      ${className}
    `}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2
              ${isActive 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }
            `}
          >
            <span className={`relative z-10 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
              {tab.icon}
            </span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
