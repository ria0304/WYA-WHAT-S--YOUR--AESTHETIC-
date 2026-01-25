
import React, { useState, useRef } from 'react';
import { Camera, Sparkles, Loader2, Zap, Heart, Microscope, ShieldCheck, AlertCircle, RefreshCw, X } from 'lucide-react';
import { analyzeImageLocally, LocalAnalysis } from '../services/localML';
import { analyzeImageWithVision } from '../services/gemini';

const ScanLook: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [localData, setLocalData] = useState<LocalAnalysis | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImage(base64);
        setResults(null);
        setError(null);
        
        const local = await analyzeImageLocally(base64);
        setLocalData(local);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setImage(null);
    setResults(null);
    setLocalData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    setResults(null);
    setError(null);
    try {
      // AI Autodetection Bridge
      const analysis = await analyzeImageWithVision(image);
      if (analysis && analysis.fabric) {
        setResults(analysis);
      } else {
        throw new Error("Could not resolve textile details. Please try with a clearer photo.");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Insight unavailable right now.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-full pb-32">
      <div className="bg-[#fff0f5] rounded-[40px] p-8 mb-8 border border-pink-100 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Heart className="w-32 h-32 text-pink-500 fill-pink-500" />
        </div>

        {/* Header Removed as requested */}
        <div className="flex items-center justify-between mb-6 relative z-10 h-6">
           {localData && (
             <div className="bg-white/60 px-3 py-1 rounded-full border border-pink-100 flex items-center gap-1.5 shadow-sm ml-auto">
                <Sparkles className="w-3 h-3 text-pink-500" />
                <span className="text-[8px] font-black text-pink-600 uppercase tracking-widest">Active Scan</span>
             </div>
          )}
        </div>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-pink-200 rounded-[40px] bg-white aspect-square flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden transition-all hover:bg-[#fff0f5]/50 shadow-inner group z-10"
        >
          {image ? (
            <div className="relative w-full h-full p-4">
              <img src={image} alt="Upload" className="w-full h-full object-contain transition-transform group-hover:scale-105" />
              {analyzing && (
                <div className="absolute top-0 left-0 w-full h-1 bg-pink-400/80 shadow-[0_0_15px_pink] z-30 animate-[scan_2s_linear_infinite]" />
              )}
            </div>
          ) : (
            <>
              <Camera className="w-10 h-10 text-pink-300 mb-4" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Identify Textile</p>
              <p className="text-[10px] text-slate-400 text-center px-6 leading-relaxed">Scan to see the material profile and garment architecture.</p>
            </>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>

        <div className="flex gap-3 mt-8 z-10 relative">
          <button 
            onClick={handleAnalyze}
            disabled={!image || analyzing}
            className="flex-[2] py-6 rounded-full gradient-bg text-white flex items-center justify-center gap-3 font-bold uppercase tracking-[3px] text-xs shadow-xl disabled:opacity-50 active:scale-95 transition-all relative overflow-hidden"
          >
            {analyzing && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {analyzing ? 'Scanning...' : 'RUN AI SCAN'}
          </button>
          
          <button 
            onClick={handleReset}
            disabled={!image || analyzing}
            className="flex-1 py-6 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center gap-2 font-bold uppercase tracking-[2px] text-[10px] shadow-sm disabled:opacity-50 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
            CANCEL
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes scan {
            0% { top: 0; }
            50% { top: 100%; }
            100% { top: 0; }
          }
        `}
      </style>

      {error && (
        <div className="mx-2 mb-6 p-6 bg-rose-50 border border-rose-100 rounded-[30px] flex items-center gap-4 text-rose-600 animate-slide-up">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      {results && (
        <div className="animate-slide-up space-y-4 px-2">
           <div className="bg-white p-8 rounded-[40px] border border-pink-100 flex flex-col gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <ShieldCheck className="w-12 h-12 text-pink-500" />
              </div>

              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Detected Material</p>
                 <p className="text-3xl font-black text-pink-500 uppercase tracking-tighter leading-tight">{results.fabric}</p>
              </div>

              {localData && (
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Spectral Palette</p>
                   <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                     {localData.palette.map((c, i) => (
                       <div key={i} className="flex flex-col items-center gap-2 group shrink-0">
                         <div 
                           className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-md transition-transform group-hover:scale-110" 
                           style={{ backgroundColor: c, borderColor: 'rgba(0,0,0,0.05)' }} 
                         />
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center leading-none max-w-[45px]">
                           {localData.shadeNames[i].split(' ').pop()}
                         </span>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              <button 
                onClick={handleReset}
                className="w-full py-4 mt-2 rounded-2xl border border-slate-100 text-slate-300 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[3px] hover:text-pink-400 hover:border-pink-100 transition-all"
              >
                <RefreshCw className="w-3 h-3" /> New Scan
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ScanLook;
