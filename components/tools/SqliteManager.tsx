import React, { useState, useEffect, useRef } from 'react';

// Define types for sql.js since we are loading it from CDN
declare global {
  interface Window {
    initSqlJs: (config?: any) => Promise<any>;
  }
}

interface QueryResult {
  columns: string[];
  values: any[][];
}

const SqliteManager: React.FC = () => {
  const [db, setDb] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize sql.js
  useEffect(() => {
    // Check if sql.js is loaded
    if (!window.initSqlJs) {
      setError("SQL.js library failed to load. Please refresh the page.");
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setTables([]);
    setActiveTable(null);
    setQueryResults(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const SQL = await window.initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
      });
      
      const newDb = new SQL.Database(new Uint8Array(arrayBuffer));
      setDb(newDb);
      
      // Get tables
      const result = newDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      if (result.length > 0 && result[0].values) {
        const tableNames = result[0].values.flat() as string[];
        setTables(tableNames);
      } else {
        setTables([]);
        setError("有効なテーブルが見つかりませんでした。");
      }
    } catch (err: any) {
      console.error(err);
      setError(`データベースを開けませんでした: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = (sql: string) => {
    if (!db) return;
    try {
      setError(null);
      const res = db.exec(sql);
      if (res.length > 0) {
        setQueryResults(res[0]);
      } else {
        setQueryResults(null); // No results (e.g., UPDATE/INSERT)
        // Check if rows modified
        const modified = db.getRowsModified();
        if (modified > 0) {
           // Show success message somehow, or just clear results
        }
      }
    } catch (err: any) {
      setError(`Query Error: ${err.message}`);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setActiveTable(tableName);
    const sql = `SELECT * FROM "${tableName}" LIMIT 100`;
    setCustomQuery(sql);
    executeQuery(sql);
  };

  const handleRunCustomQuery = () => {
    executeQuery(customQuery);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          SQLite ビューアー
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        </h2>
        <p className="text-slate-500">
          .sqlite や .db ファイルをブラウザ上で開き、データの閲覧やSQLクエリの実行ができます。<br/>
          データはサーバーに送信されず、すべてブラウザ内で処理されます。
        </p>
      </div>

      {!db ? (
        <div 
          className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
          onClick={triggerFileUpload}
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">ファイルを選択してアップロード</h3>
          <p className="text-slate-500 mb-6">または、ここにドラッグ＆ドロップ</p>
          <button className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold hover:bg-emerald-700 transition-colors">
            ファイルを選択 (.sqlite, .db)
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".sqlite,.db,.sqlite3" 
            className="hidden" 
          />
          {isLoading && <p className="mt-4 text-emerald-600 animate-pulse">読み込み中...</p>}
          {error && <p className="mt-4 text-red-500 font-bold">{error}</p>}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden flex flex-col md:flex-row h-[800px]">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto shrink-0">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                 Tables
               </h3>
               <button onClick={() => setDb(null)} className="text-xs text-red-500 hover:underline">Close</button>
             </div>
             <ul className="space-y-1">
               {tables.map(table => (
                 <li key={table}>
                   <button
                    onClick={() => handleTableSelect(table)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                      activeTable === table 
                      ? 'bg-emerald-100 text-emerald-800 font-bold' 
                      : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title={table}
                   >
                     {table}
                   </button>
                 </li>
               ))}
               {tables.length === 0 && <li className="text-slate-400 text-sm">No tables found</li>}
             </ul>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-w-0">
             {/* Query Editor */}
             <div className="p-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
               <label className="block text-xs font-bold text-slate-500 mb-2">SQL Query</label>
               <div className="flex gap-2">
                 <textarea
                   value={customQuery}
                   onChange={(e) => setCustomQuery(e.target.value)}
                   className="flex-1 p-3 rounded-lg border border-slate-300 font-mono text-sm h-24 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
                   placeholder="SELECT * FROM table..."
                 />
                 <button 
                  onClick={handleRunCustomQuery}
                  className="bg-emerald-600 text-white px-4 rounded-lg font-bold hover:bg-emerald-700 transition-colors flex flex-col items-center justify-center gap-1"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                   Run
                 </button>
               </div>
               {error && (
                 <div className="mt-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                   {error}
                 </div>
               )}
             </div>

             {/* Results */}
             <div className="flex-1 overflow-auto p-4 bg-white">
               {queryResults ? (
                 <div className="border border-slate-200 rounded-lg overflow-x-auto">
                   <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                       <tr>
                         {queryResults.columns.map((col, i) => (
                           <th key={i} className="px-4 py-3 border-b border-slate-200 bg-slate-100">{col}</th>
                         ))}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {queryResults.values.map((row, i) => (
                         <tr key={i} className="hover:bg-slate-50">
                           {row.map((cell, j) => (
                             <td key={j} className="px-4 py-2 text-slate-600 max-w-[150px] truncate" title={String(cell)}>
                               {cell === null ? <span className="text-slate-300 italic">null</span> : String(cell)}
                             </td>
                           ))}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                   {queryResults.values.length === 0 && (
                      <div className="p-8 text-center text-slate-400">結果がありません</div>
                   )}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300">
                   <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                   <p>テーブルを選択するか、クエリを実行してください</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SqliteManager;