import React, { useState, useEffect } from 'react';
import { DriveMode } from '../../types';

const DriveLinkConverter: React.FC = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [fileId, setFileId] = useState<string | null>(null);
  const [mode, setMode] = useState<DriveMode>(DriveMode.PREVIEW);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Extract File ID logic
  useEffect(() => {
    if (!inputUrl) {
      setFileId(null);
      return;
    }

    // Common patterns for Google Drive Links
    const patterns = [
      /\/file\/d\/([^/]+)/, // /file/d/ID
      /id=([^&]+)/,         // id=ID
      /\/d\/([^/]+)/        // /d/ID
    ];

    let foundId = null;
    for (const pattern of patterns) {
      const match = inputUrl.match(pattern);
      if (match && match[1]) {
        foundId = match[1];
        break;
      }
    }
    setFileId(foundId);
  }, [inputUrl]);

  // Generate URL logic
  useEffect(() => {
    if (!fileId) {
      setGeneratedUrl('');
      return;
    }

    let url = '';
    switch (mode) {
      case DriveMode.PREVIEW:
        url = `https://drive.google.com/file/d/${fileId}/preview`;
        break;
      case DriveMode.DOWNLOAD:
        url = `https://drive.google.com/uc?export=download&id=${fileId}`;
        break;
      case DriveMode.VIEW:
        url = `https://drive.google.com/file/d/${fileId}/view`;
        break;
      case DriveMode.VIDEO:
        url = `https://drive.google.com/file/d/${fileId}/preview`; 
        break;
    }
    setGeneratedUrl(url);
    setCopied(false);
  }, [fileId, mode]);

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getModeDescription = (m: DriveMode) => {
    switch (m) {
      case DriveMode.PREVIEW: return 'Webサイトへの埋め込み(iframe)に最適なURLです。余計なメニューが表示されません。';
      case DriveMode.DOWNLOAD: return 'クリックすると即座にファイルがダウンロードされる直リンクです。画像などの素材配布に便利。';
      case DriveMode.VIEW: return 'Google Driveの標準ビューワーで開きます。共有用として最も一般的です。';
      case DriveMode.VIDEO: return '動画プレイヤーとして埋め込むのに適した形式です。';
    }
  };

  return (
    <div className="animate-fade-in-up">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          Google Drive リンク変換
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        </h2>
        <p className="text-slate-500">
          共有リンクをコピーして貼り付けるだけ。<br/>
          Webサイトへの埋め込み用や、直接ダウンロード用のURLを生成します。
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200 border border-slate-100">
        
        {/* Step 1: Input */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            1. 元のGoogle Drive共有リンクを貼り付け
          </label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
             </div>
            <input
              type="text"
              placeholder="https://drive.google.com/file/d/..."
              className="w-full p-4 pl-10 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder:text-slate-400"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
          </div>
          {!fileId && inputUrl.length > 10 && (
             <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
               有効なファイルIDが見つかりません。リンクを確認してください。
             </p>
          )}
        </div>

        {/* Step 2: Mode Selection */}
        <div className={`transition-all duration-300 ${!fileId ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
           <label className="block text-sm font-bold text-slate-700 mb-4">
            2. 変換モードを選択
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {Object.values(DriveMode).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${
                  mode === m 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${mode === m ? 'border-blue-500' : 'border-slate-300'}`}>
                      {mode === m && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                   </div>
                   <span className={`font-bold ${mode === m ? 'text-blue-700' : 'text-slate-600'}`}>
                      {m === DriveMode.PREVIEW && '埋め込み (Preview)'}
                      {m === DriveMode.DOWNLOAD && '直接ダウンロード (Direct)'}
                      {m === DriveMode.VIEW && '標準ビュー (View)'}
                      {m === DriveMode.VIDEO && '動画埋め込み (Video)'}
                   </span>
                </div>
                <p className="text-xs text-slate-500 pl-6 leading-relaxed">
                  {getModeDescription(m)}
                </p>
              </button>
            ))}
          </div>

          {/* Step 3: Result */}
          <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden">
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full overflow-hidden">
                  <p className="text-xs text-slate-400 mb-1 font-mono">GENERATED URL</p>
                  <p className="text-blue-300 font-mono text-sm truncate bg-slate-800/50 p-2 rounded border border-slate-700">
                    {generatedUrl || 'Waiting for input...'}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!generatedUrl}
                  className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${
                    copied 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-white text-slate-900 hover:bg-blue-50'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      コピー完了！
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      コピーする
                    </>
                  )}
                </button>
             </div>
          </div>
          
          {/* Step 4: Live Preview */}
          {generatedUrl && (mode === DriveMode.PREVIEW || mode === DriveMode.VIDEO) && (
            <div className="mt-8">
               <label className="block text-sm font-bold text-slate-700 mb-2">
                埋め込みプレビュー (iframe)
              </label>
              <div className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                   Loading preview...
                </div>
                <iframe
                  src={generatedUrl}
                  className="w-full h-full relative z-10"
                  allow="autoplay"
                  title="Preview"
                ></iframe>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DriveLinkConverter;