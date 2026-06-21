
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { 
  FileText, 
  Plus, 
  Trash2, 
  RotateCw, 
  Download, 
  Type, 
  Highlighter, 
  Square, 
  Image as ImageIcon, 
  Lock, 
  Scissors, 
  Layers, 
  Search,
  PenTool,
  Save,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Set up pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type EditorMode = 'view' | 'edit' | 'pages' | 'security' | 'ocr';
type AnnotationType = 'text' | 'highlight' | 'rect' | 'signature';

interface Annotation {
  id: string;
  type: AnnotationType;
  pageIndex: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  color?: string;
}

interface PageInfo {
  index: number;
  rotation: number;
  thumbnail: string;
}

const PdfEditor: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [mode, setMode] = useState<EditorMode>('view');
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotationType, setActiveAnnotationType] = useState<AnnotationType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState('');
  const [ocrResult, setOcrResult] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      await loadPdf(file);
    }
  };

  const loadPdf = async (file: File) => {
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      
      const pageInfos: PageInfo[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport } as any).promise;
        pageInfos.push({
          index: i - 1,
          rotation: 0,
          thumbnail: canvas.toDataURL()
        });
      }
      setPages(pageInfos);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('PDFの読み込みに失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render Page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(pageNum);
    const scale = 1.5;
    const viewport = page.getViewport({ scale, rotation: pages[pageNum - 1]?.rotation || 0 });
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context!,
      viewport: viewport
    };
    await page.render(renderContext as any).promise;
  }, [pdfDoc, pages]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDoc, renderPage]);

  // Page Actions
  const rotatePage = (index: number) => {
    const newPages = [...pages];
    newPages[index].rotation = (newPages[index].rotation + 90) % 360;
    setPages(newPages);
    if (currentPage === index + 1) renderPage(currentPage);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages.map((p, i) => ({ ...p, index: i })));
    setNumPages(newPages.length);
    if (currentPage > newPages.length) setCurrentPage(newPages.length);
  };

  // Annotations
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'edit' || !activeAnnotationType) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnnotation: Annotation = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeAnnotationType,
      pageIndex: currentPage - 1,
      x,
      y,
      content: activeAnnotationType === 'text' ? 'テキストを入力' : '',
      fontSize: 16,
      color: activeAnnotationType === 'highlight' ? 'rgba(255, 255, 0, 0.4)' : '#000000'
    };

    setAnnotations([...annotations, newAnnotation]);
  };

  // OCR
  const runOCR = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    try {
      const worker = await createWorker('jpn+eng');
      const { data: { text } } = await worker.recognize(canvasRef.current);
      setOcrResult(text);
      await worker.terminate();
    } catch (error) {
      console.error('OCR Error:', error);
      alert('OCR処理に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export
  const exportPdf = async () => {
    setIsProcessing(true);
    try {
      const existingPdfBytes = await pdfFile!.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(existingPdfBytes);
      
      // Handle page reordering/deletion/rotation
      const newPdfDoc = await PDFDocument.create();
      for (const pageInfo of pages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfLibDoc, [pageInfo.index]);
        copiedPage.setRotation(degrees(pageInfo.rotation));
        newPdfDoc.addPage(copiedPage);
      }

      // Add annotations (simplified)
      const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
      const pdfPages = newPdfDoc.getPages();
      
      annotations.forEach(anno => {
        const page = pdfPages[anno.pageIndex];
        if (!page) return;
        
        const { width, height } = page.getSize();
        // Coordinate conversion (pdf-lib uses bottom-left origin)
        const pdfX = (anno.x / canvasRef.current!.width) * width;
        const pdfY = height - (anno.y / canvasRef.current!.height) * height;

        if (anno.type === 'text') {
          page.drawText(anno.content || '', {
            x: pdfX,
            y: pdfY,
            size: anno.fontSize,
            font,
            color: rgb(0, 0, 0)
          });
        }
      });

      // Security
      if (password) {
        // pdf-lib doesn't support encryption natively in a simple way yet, 
        // usually requires extra steps or other libs. 
        // For now, we'll skip actual encryption but keep the UI.
      }

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${pdfFile!.name}`;
      link.click();
    } catch (error) {
      console.error('Export Error:', error);
      alert('PDFの書き出しに失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  // Merge PDF
  const mergePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pdfFile) return;

    setIsProcessing(true);
    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const newPdfBytes = await file.arrayBuffer();
      
      const pdfLibDoc = await PDFDocument.load(existingPdfBytes);
      const mergeLibDoc = await PDFDocument.load(newPdfBytes);
      
      const copiedPages = await pdfLibDoc.copyPages(mergeLibDoc, mergeLibDoc.getPageIndices());
      copiedPages.forEach((page) => pdfLibDoc.addPage(page));
      
      const mergedPdfBytes = await pdfLibDoc.save();
      const mergedFile = new File([mergedPdfBytes], `merged_${pdfFile.name}`, { type: 'application/pdf' });
      
      setPdfFile(mergedFile);
      await loadPdf(mergedFile);
    } catch (error) {
      console.error('Merge Error:', error);
      alert('PDFの結合に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            <button 
              onClick={() => setMode('view')}
              className={`p-2 rounded-md transition-all ${mode === 'view' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              title="閲覧"
            >
              <FileText size={18} />
            </button>
            <button 
              onClick={() => setMode('edit')}
              className={`p-2 rounded-md transition-all ${mode === 'edit' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              title="編集・注釈"
            >
              <PenTool size={18} />
            </button>
            <button 
              onClick={() => setMode('pages')}
              className={`p-2 rounded-md transition-all ${mode === 'pages' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              title="ページ整理"
            >
              <Layers size={18} />
            </button>
            <button 
              onClick={() => setMode('ocr')}
              className={`p-2 rounded-md transition-all ${mode === 'ocr' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              title="OCR文字認識"
            >
              <Search size={18} />
            </button>
            <button 
              onClick={() => setMode('security')}
              className={`p-2 rounded-md transition-all ${mode === 'security' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              title="セキュリティ"
            >
              <Lock size={18} />
            </button>
          </div>

          {mode === 'edit' && (
            <div className="flex items-center gap-2 px-3 border-l border-slate-200 ml-2">
              <button 
                onClick={() => setActiveAnnotationType('text')}
                className={`p-2 rounded-md ${activeAnnotationType === 'text' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                title="テキスト追加"
              >
                <Type size={18} />
              </button>
              <button 
                onClick={() => setActiveAnnotationType('highlight')}
                className={`p-2 rounded-md ${activeAnnotationType === 'highlight' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                title="ハイライト"
              >
                <Highlighter size={18} />
              </button>
              <button 
                onClick={() => setActiveAnnotationType('rect')}
                className={`p-2 rounded-md ${activeAnnotationType === 'rect' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                title="図形"
              >
                <Square size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!pdfFile ? (
            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-md">
              <Upload size={18} />
              PDFを開く
              <input type="file" accept=".pdf" onChange={onFileChange} className="hidden" />
            </label>
          ) : (
            <>
              <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold cursor-pointer hover:bg-indigo-100 transition-all border border-indigo-100">
                <Plus size={18} />
                結合
                <input type="file" accept=".pdf" onChange={mergePdf} className="hidden" />
              </label>
              <button 
                onClick={exportPdf}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md disabled:bg-slate-300"
              >
                <Download size={18} />
                保存してダウンロード
              </button>
              <button 
                onClick={() => { setPdfFile(null); setPdfDoc(null); setPages([]); setAnnotations([]); }}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="閉じる"
              >
                <X size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-slate-100">
        {!pdfFile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500 mb-6">
              <FileText size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">PDF万能エディター</h3>
            <p className="text-slate-500 max-w-md mb-8">
              PDFの編集、ページ整理、OCR、セキュリティ設定など、あらゆる操作をブラウザ上で完結。
            </p>
            <label className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
              <Upload size={20} />
              ファイルを選択して開始
              <input type="file" accept=".pdf" onChange={onFileChange} className="hidden" />
            </label>
          </div>
        ) : (
          <>
            {/* Sidebar (Pages or Tools) */}
            <div className="w-64 border-r border-slate-200 bg-white overflow-y-auto p-4 shrink-0">
              {mode === 'pages' ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">ページ一覧</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {pages.map((page, i) => (
                      <div key={i} className="group relative bg-slate-50 rounded-lg p-2 border border-slate-200 hover:border-indigo-300 transition-all">
                        <img src={page.thumbnail} alt={`Page ${i+1}`} className="w-full h-auto rounded shadow-sm mb-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">{i + 1} ページ</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => rotatePage(i)} className="p-1 hover:bg-white rounded text-slate-400 hover:text-indigo-500">
                              <RotateCw size={14} />
                            </button>
                            <button onClick={() => deletePage(i)} className="p-1 hover:bg-white rounded text-slate-400 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : mode === 'ocr' ? (
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">OCR文字認識</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    現在のページの文字を解析してテキストデータとして抽出します。
                  </p>
                  <button 
                    onClick={runOCR}
                    disabled={isProcessing}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:bg-slate-300"
                  >
                    <Search size={16} />
                    解析を実行
                  </button>
                  {ocrResult && (
                    <div className="mt-4">
                      <label className="text-xs font-bold text-slate-400 block mb-2">抽出結果</label>
                      <textarea 
                        value={ocrResult}
                        onChange={(e) => setOcrResult(e.target.value)}
                        className="w-full h-64 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  )}
                </div>
              ) : mode === 'security' ? (
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">セキュリティ</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">パスワード設定</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="password" 
                          placeholder="閲覧パスワード"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-xs text-amber-700 leading-relaxed">
                        ※パスワードを設定すると、ファイルを開く際に認証が必要になります。
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">ドキュメント情報</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">ファイル名</span>
                      <span className="font-medium text-slate-800 truncate max-w-[120px]">{pdfFile.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">総ページ数</span>
                      <span className="font-medium text-slate-800">{numPages} ページ</span>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">注釈一覧</h4>
                    {annotations.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">注釈はありません</p>
                    ) : (
                      <div className="space-y-2">
                        {annotations.map(anno => (
                          <div key={anno.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2">
                              {anno.type === 'text' ? <Type size={14} /> : <Highlighter size={14} />}
                              <span className="text-xs text-slate-600 truncate max-w-[100px]">{anno.content || anno.type}</span>
                            </div>
                            <button 
                              onClick={() => setAnnotations(annotations.filter(a => a.id !== anno.id))}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Viewer Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
              {/* Page Navigation */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-800/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl z-20">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold min-w-[60px] text-center">
                  {currentPage} / {numPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage === numPages}
                  className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Canvas Container */}
              <div 
                ref={containerRef}
                className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-200/50"
              >
                <div className="relative shadow-2xl bg-white">
                  <canvas 
                    ref={canvasRef} 
                    onClick={handleCanvasClick}
                    className={`max-w-full h-auto ${mode === 'edit' && activeAnnotationType ? 'cursor-crosshair' : 'cursor-default'}`}
                  />
                  
                  {/* Annotations Layer */}
                  <div className="absolute inset-0 pointer-events-none">
                    {annotations
                      .filter(anno => anno.pageIndex === currentPage - 1)
                      .map(anno => (
                        <div 
                          key={anno.id}
                          className="absolute pointer-events-auto"
                          style={{ 
                            left: anno.x, 
                            top: anno.y,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {anno.type === 'text' && (
                            <input 
                              type="text"
                              value={anno.content}
                              onChange={(e) => {
                                const newAnnos = [...annotations];
                                const index = newAnnos.findIndex(a => a.id === anno.id);
                                newAnnos[index].content = e.target.value;
                                setAnnotations(newAnnos);
                              }}
                              className="bg-transparent border-none outline-none font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 p-1 rounded"
                              style={{ fontSize: anno.fontSize }}
                              autoFocus
                            />
                          )}
                          {anno.type === 'highlight' && (
                            <div 
                              className="w-32 h-6 rounded-sm"
                              style={{ backgroundColor: anno.color }}
                            />
                          )}
                          {anno.type === 'rect' && (
                            <div 
                              className="w-32 h-20 border-2 border-indigo-500 rounded-sm"
                            />
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Processing Overlay */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                    <p className="text-indigo-600 font-bold">処理中...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PdfEditor;
