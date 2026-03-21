
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Film, 
  Settings, 
  Image as ImageIcon,
  Plus,
  Clock,
  RefreshCw,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Frame {
  id: string;
  url: string;
  file: File;
}

const StopMotionCreator: React.FC = () => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [fps, setFps] = useState(12);
  const [format, setFormat] = useState<'webm' | 'mp4' | 'mov'>('webm');
  const [formatSupported, setFormatSupported] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const checkSupport = () => {
      if (format === 'webm') setFormatSupported(MediaRecorder.isTypeSupported('video/webm'));
      else if (format === 'mp4') setFormatSupported(MediaRecorder.isTypeSupported('video/mp4'));
      else if (format === 'mov') setFormatSupported(MediaRecorder.isTypeSupported('video/quicktime') || MediaRecorder.isTypeSupported('video/mp4'));
    };
    checkSupport();
  }, [format]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [imagesCache, setImagesCache] = useState<Record<string, HTMLImageElement>>({});

  // Pre-load images for smooth playback
  useEffect(() => {
    frames.forEach(frame => {
      if (!imagesCache[frame.id]) {
        const img = new Image();
        img.onload = () => {
          setImagesCache(prev => ({ ...prev, [frame.id]: img }));
        };
        img.src = frame.url;
      }
    });
  }, [frames, imagesCache]);
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const playIntervalRef = useRef<number | null>(null);

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newFrames: Frame[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      file
    }));
    setFrames(prev => [...prev, ...newFrames]);
  };

  // Drag and drop handlers
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
    addFiles(files);
  };

  // Frame management
  const removeFrame = (id: string) => {
    setFrames(prev => {
      const frame = prev.find(f => f.id === id);
      if (frame) URL.revokeObjectURL(frame.url);
      return prev.filter(f => f.id !== id);
    });
  };

  const moveFrame = (index: number, direction: 'up' | 'down') => {
    const newFrames = [...frames];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFrames.length) return;
    
    [newFrames[index], newFrames[targetIndex]] = [newFrames[targetIndex], newFrames[index]];
    setFrames(newFrames);
  };

  // Animation logic
  const startPlayback = () => {
    if (frames.length === 0) return;
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      playIntervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }, 1000 / fps);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, frames.length, fps]);

  // Render current frame to canvas
  const drawFrame = useCallback((index: number, canvas: HTMLCanvasElement | null) => {
    if (!canvas || frames.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const frame = frames[index];
    if (!frame) return;

    const render = (img: HTMLImageElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * ratio) / 2;
      const y = (canvas.height - img.height * ratio) / 2;
      ctx.drawImage(img, x, y, img.width * ratio, img.height * ratio);
    };

    if (imagesCache[frame.id]) {
      render(imagesCache[frame.id]);
    } else {
      const img = new Image();
      img.onload = () => render(img);
      img.src = frame.url;
    }
  }, [frames, imagesCache]);

  useEffect(() => {
    drawFrame(currentFrameIndex, previewCanvasRef.current);
  }, [currentFrameIndex, frames, drawFrame]);

  // Video Export logic
  const exportVideo = async () => {
    if (frames.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);

    const canvas = exportCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas size to standard 1080p
    canvas.width = 1920;
    canvas.height = 1080;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Determine best mime type
    let mimeType = 'video/webm;codecs=vp9';
    let extension = 'webm';

    if (format === 'mp4') {
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
        mimeType = 'video/mp4;codecs=h264';
        extension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        extension = 'mp4';
      }
    } else if (format === 'mov') {
      if (MediaRecorder.isTypeSupported('video/quicktime')) {
        mimeType = 'video/quicktime';
        extension = 'mov';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        extension = 'mov';
      }
    }

    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 50000000 // 50 Mbps for maximum quality
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stop-motion-animation.${extension}`;
      a.click();
      setIsExporting(false);
    };

    // Pre-load all images for export to ensure no stuttering
    const loadedImages: HTMLImageElement[] = [];
    for (let i = 0; i < frames.length; i++) {
      setExportProgress(Math.round((i / frames.length) * 20)); // First 20% for pre-loading
      const img = await new Promise<HTMLImageElement>((resolve) => {
        if (imagesCache[frames[i].id]) {
          resolve(imagesCache[frames[i].id]);
        } else {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = frames[i].url;
        }
      });
      loadedImages.push(img);
    }

    // Draw first frame before starting to ensure the recorder sees it immediately
    const firstImg = loadedImages[0];
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const firstRatio = Math.min(canvas.width / firstImg.width, canvas.height / firstImg.height);
    const firstX = (canvas.width - firstImg.width * firstRatio) / 2;
    const firstY = (canvas.height - firstImg.height * firstRatio) / 2;
    ctx.drawImage(firstImg, firstX, firstY, firstImg.width * firstRatio, firstImg.height * firstRatio);

    recorder.start();

    const frameDuration = 1000 / fps;
    const startTime = performance.now();

    for (let i = 0; i < frames.length; i++) {
      if (i > 0) {
        const img = loadedImages[i];
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * ratio) / 2;
        const y = (canvas.height - img.height * ratio) / 2;
        ctx.drawImage(img, x, y, img.width * ratio, img.height * ratio);
      }

      setExportProgress(20 + Math.round(((i + 1) / frames.length) * 80));
      
      // Wait until the exact time for the next frame to ensure strict FPS
      const nextFrameTime = startTime + ((i + 1) * frameDuration);
      while (performance.now() < nextFrameTime) {
        await new Promise(r => setTimeout(r, 1));
      }
    }

    recorder.stop();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col h-[calc(100vh-12rem)]">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-white flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Film className="text-rose-500" />
            こまどりアニメ作成
          </h2>
          <p className="text-slate-500 mt-1">
            写真を並べて、自分だけのストップモーションアニメーションを作ろう。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm relative">
            <Film size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-600">形式:</span>
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value as any)}
              className={`text-sm font-bold outline-none bg-transparent ${formatSupported ? 'text-indigo-600' : 'text-amber-500'}`}
            >
              <option value="webm">WebM</option>
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
            </select>
            {!formatSupported && (
              <div className="absolute -top-10 left-0 bg-amber-500 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                ブラウザが{format.toUpperCase()}形式をサポートしていません。WebMで保存されます。
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Clock size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-600">FPS:</span>
            <input 
              type="number" 
              min="1" 
              max="60" 
              value={fps} 
              onChange={(e) => setFps(Number(e.target.value))}
              className="w-12 text-center text-sm font-bold outline-none text-indigo-600"
            />
          </div>
          <button
            onClick={exportVideo}
            disabled={frames.length === 0 || isExporting}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 disabled:bg-slate-300 disabled:shadow-none"
          >
            {isExporting ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                書き出し中 ({exportProgress}%)
              </>
            ) : (
              <>
                <Download size={18} />
                動画として保存
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-8 relative">
          <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden relative group">
            <canvas 
              ref={previewCanvasRef} 
              width={1920} 
              height={1080} 
              className="w-full h-full object-contain"
            />
            
            {frames.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                <ImageIcon size={64} className="opacity-20" />
                <p className="text-sm font-medium">プレビューする写真がありません</p>
              </div>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setCurrentFrameIndex(prev => (prev - 1 + frames.length) % frames.length)}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <MoveUp className="-rotate-90" size={20} />
              </button>
              <button 
                onClick={isPlaying ? stopPlayback : startPlayback}
                className="w-12 h-12 flex items-center justify-center bg-rose-500 text-white rounded-full hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
              </button>
              <button 
                onClick={() => setCurrentFrameIndex(prev => (prev + 1) % frames.length)}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <MoveDown className="-rotate-90" size={20} />
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-slate-400 text-sm font-medium">
            フレーム: {frames.length > 0 ? currentFrameIndex + 1 : 0} / {frames.length}
          </div>

          {/* Hidden canvas for exporting */}
          <canvas ref={exportCanvasRef} className="hidden" />
        </div>

        {/* Timeline / Frame List */}
        <div className="w-80 border-l border-slate-100 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Layers size={18} className="text-slate-400" />
              タイムライン
            </h3>
            <label className="cursor-pointer p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
              <Plus size={18} />
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div 
            className="flex-1 overflow-y-auto p-4 space-y-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <AnimatePresence>
              {frames.map((frame, index) => (
                <motion.div 
                  key={frame.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`
                    flex items-center gap-3 p-2 rounded-xl border transition-all group
                    ${currentFrameIndex === index ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-100' : 'bg-white border-slate-200 hover:border-slate-300'}
                  `}
                  onClick={() => setCurrentFrameIndex(index)}
                >
                  <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    <img src={frame.url} alt={`Frame ${index}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Frame {index + 1}</div>
                    <div className="text-xs font-medium text-slate-600 truncate">{frame.file.name}</div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveFrame(index, 'up'); }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-500"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveFrame(index, 'down'); }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-500"
                    >
                      <MoveDown size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFrame(frame.id); }}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {frames.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
                <Upload size={32} className="text-slate-300 mb-4" />
                <p className="text-sm text-slate-400 font-medium">
                  写真をドラッグ＆ドロップ<br/>または追加ボタンから
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StopMotionCreator;
