
import React, { useState, useRef } from 'react';

const GithubSyncGenerator: React.FC = () => {
  const [githubUser, setGithubUser] = useState('ここにユーザー名を入力');
  const [baseDir, setBaseDir] = useState('C:\\Users\\あなたのユーザー名\\Downloads\\SyncFolder');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scriptTemplate = `import os
import time
import zipfile
import subprocess
import shutil
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from plyer import notification

# ==========================================
# 設定エリア
# ==========================================
# GitHubのユーザー名
GITHUB_USER = "${githubUser}"
# 監視・整理を行う親フォルダ
BASE_DIR = r"${baseDir}"

class SmartProjectHandler(FileSystemEventHandler):
    def on_created(self, event):
        # ZIPファイル以外は無視
        if event.is_directory or not event.src_path.endswith(".zip"):
            return

        zip_path = event.src_path
        # ZIP名（拡張子なし）をプロジェクト名にする
        project_name = os.path.splitext(os.path.basename(zip_path))[0]
        # そのプロジェクト専用のフォルダパス
        target_dir = os.path.join(BASE_DIR, project_name)

        print(f"\\n📦 ZIP検知: {os.path.basename(zip_path)}")

        # 1. プロジェクトフォルダがなければ作成
        if not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
            print(f"📁 新規フォルダ作成: {target_dir}")
        
        # 2. Gitの初期設定（.gitがなければ実行）
        dot_git = os.path.join(target_dir, ".git")
        if not os.path.exists(dot_git):
            repo_url = f"https://github.com/{GITHUB_USER}/{project_name}.git"
            print(f"🔗 Git初期設定を開始: {repo_url}")
            subprocess.run(["git", "init"], cwd=target_dir, shell=True)
            subprocess.run(["git", "remote", "add", "origin", repo_url], cwd=target_dir, shell=True)
            subprocess.run(["git", "branch", "-M", "main"], cwd=target_dir, shell=True)

        # 3. メインの同期処理へ
        self.sync_project(zip_path, target_dir, project_name)

    def sync_project(self, zip_path, target_dir, project_name):
        notification.notify(
            title="Git Auto Sync",
            message=f"🔄 {project_name} の差分を更新中...",
            timeout=3
        )
        
        # ブラウザの保存完了とウイルススキャン待ち
        time.sleep(5)
        
        try:
            # --- 古いファイルを整理中 ---
            print(f"🧹 古いファイルを整理中...")
            for item in os.listdir(target_dir):
                if item == ".git":
                    continue
                item_path = os.path.join(target_dir, item)
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)

            # --- ZIPを解凍 ---
            print(f"📂 新しいファイルを展開中...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(target_dir)
            
            # ZIPを削除
            os.remove(zip_path)

            # --- Gitプッシュ ---
            print(f"📤 GitHubへ送信中...")
            subprocess.run(["git", "add", "-A"], cwd=target_dir, shell=True)
            subprocess.run(["git", "commit", "-m", "Auto-diff sync"], cwd=target_dir, shell=True)
            
            # プッシュ（強制プッシュ -f）
            result = subprocess.run(["git", "push", "-f", "origin", "main"], cwd=target_dir, shell=True)
            if result.returncode == 0:
                notification.notify(
                    title="Git Auto Sync",
                    message=f"✅ {project_name} の更新が完了しました！",
                    timeout=5
                )
                print(f"✨ 完璧！ GitHubの {project_name} が最新になったよ。")
            else:
                print(f"⚠️ プッシュに失敗しました。")

        except Exception as e:
            print(f"❌ エラー発生: {e}")
            notification.notify(title="Error", message=str(e), timeout=10)

if __name__ == "__main__":
    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR)

    observer = Observer()
    observer.schedule(SmartProjectHandler(), BASE_DIR, recursive=False)
    
    print(f"🚀 監視スタート！")
    print(f"📍 監視場所: {BASE_DIR}")
    
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBrowseFolder = async () => {
    try {
      // Modern browser API for directory picking
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        // Since we can't get the absolute OS path directly for security reasons,
        // we'll at least set the name or encourage them to paste the path.
        // For local Python scripts, they need the full path.
        alert(`フォルダ「${handle.name}」を選択しました。ブラウザのセキュリティ制限により、Pythonスクリプトに必要な「フルパス（C:\\...等）」を直接取得することはできません。エクスプローラーからパスをコピーして入力欄に貼り付けてください。`);
      } else {
        fileInputRef.current?.click();
      }
    } catch (err) {
      console.error('Folder pick cancelled or not supported');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          GitHub 自動同期スクリプト生成
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          AI StudioからダウンロードしたZIPを保存するだけで、<br/>
          自動的にGitHubリポジトリへ同期する魔法のPythonスクリプト。
        </p>
      </div>

      {/* セットアップ手順 (移動: 上部へ) */}
      <div className="bg-indigo-50 rounded-2xl p-6 md:p-8 border border-indigo-100 mb-8 shadow-sm">
        <h3 className="font-bold text-indigo-900 mb-6 flex items-center gap-2 text-xl border-b border-indigo-200 pb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
          重要：最初に行うセットアップ
        </h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-indigo-700 text-sm mb-3 flex items-center gap-2">
              <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
              コマンドプロンプト(cmd)で実行する
            </h4>
            <div className="grid gap-2">
              <div className="bg-slate-900 rounded-lg p-3 relative group">
                <code className="text-indigo-300 text-xs font-mono block">git config --global user.name "あなたのGitHubユーザー名"</code>
                <button onClick={() => navigator.clipboard.writeText('git config --global user.name "YourName"')} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-white transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 relative group">
                <code className="text-indigo-300 text-xs font-mono block">git config --global user.email "あなたのメールアドレス"</code>
                <button onClick={() => navigator.clipboard.writeText('git config --global user.email "your@email.com"')} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-white transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 relative group">
                <code className="text-indigo-300 text-xs font-mono block">pip install watchdog plyer</code>
                <button onClick={() => navigator.clipboard.writeText('pip install watchdog plyer')} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-white transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-indigo-700 text-sm mb-2 flex items-center gap-2">
              <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
              スクリプトの準備
            </h4>
            <p className="text-indigo-800 text-xs leading-relaxed">
              下記の生成されたコードをコピーし、<code>auto_sync.py</code> という名前で保存します。
            </p>
          </div>

          <div>
            <h4 className="font-bold text-indigo-700 text-sm mb-2 flex items-center gap-2">
              <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
              実行と使用方法
            </h4>
            <p className="text-indigo-800 text-xs leading-relaxed">
              コマンドプロンプトで <code>python auto_sync.py</code> を実行します。
              あとはAI Studioで作ったアプリを「ダウンロード」し、設定したフォルダにZIPを保存するだけ！数秒後にGitHubへ同期されます。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-100 mb-8">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">GitHub ユーザー名</label>
            <input 
              type="text" 
              value={githubUser}
              onChange={(e) => setGithubUser(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="ここにユーザー名を入力"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">監視対象フォルダ (PCパス)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={baseDir}
                onChange={(e) => setBaseDir(e.target.value)}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                placeholder="C:\Users\...\Downloads\SyncFolder"
              />
              <button 
                onClick={handleBrowseFolder}
                className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-200 font-bold transition-all flex items-center gap-2 whitespace-nowrap"
                title="フォルダを選択"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                参照
              </button>
              <input type="file" ref={fileInputRef} webkitdirectory="true" className="hidden" />
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-sm ${copied ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
            >
              {copied ? 'コピーしました！' : 'スクリプトをコピー'}
              {!copied && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
            </button>
          </div>
          <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto h-[500px] custom-scrollbar border border-slate-800 shadow-inner">
            <pre className="text-blue-300 font-mono text-sm leading-relaxed">
              <code>{scriptTemplate}</code>
            </pre>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          ※ 監視フォルダにZIPが保存されると、スクリプトが自動的に解凍・整理・GitHubリポジトリ（同名）へプッシュします。
        </p>
      </div>
    </div>
  );
};

export default GithubSyncGenerator;
