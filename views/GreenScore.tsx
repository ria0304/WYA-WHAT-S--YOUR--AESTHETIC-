
import React, { useState } from 'react';
import { Search, ExternalLink, ShieldCheck, Leaf, Loader2, Sparkles, CheckCircle, Info, ChevronRight, BarChart3, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const GreenScore: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ 
    text: string; 
    sources: any[]; 
    score: number;
    rating: string;
    metrics: { eco: number, ethics: number, transparency: number };
  } | null>(null);

  const suggestedBrands = ["Patagonia", "ZARA", "Levi's", "H&M", "Everlane", "Allbirds", "Shein"];

  const handleSearch = async (brandName: string = query) => {
    if (!brandName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.ai.getGreenAudit(brandName);
      
      const score = data.total_score || 50;
      const eco = data.eco_score || score;
      const ethics = data.labor_score || score;
      const trans = data.trans_score || score;
      
      let rating = "Fair";
      if (score > 80) rating = "Sustainable Excellence";
      else if (score > 65) rating = "Highly Ethical";
      else if (score > 45) rating = "Moderate Progress";
      else if (score > 25) rating = "Needs Urgent Change";
      else rating = "Avoid / High Risk";

      setResult({
        text: data.summary,
        sources: data.sources || [],
        score,
        rating,
        metrics: {
          eco,
          ethics,
          transparency: trans
        }
      });
      setQuery(brandName);
    } catch (e: any) {
      setError(e.message || "We encountered an issue auditing this brand. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (s: number) => {
    if (s > 75) return 'text-emerald-600';
    if (s > 50) return 'text-emerald-500';
    if (s > 30) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getStatusBg = (s: number) => {
    if (s > 75) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s > 50) return 'bg-emerald-50 text-emerald-600 border-emerald-50';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  return (
    <div className="bg-emerald-50/30 min-h-full pb-32">
      <div className="p-6 bg-white rounded-b-[40px] shadow-sm border-b mb-6 border-emerald-100">
        <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[4px] mb-6">WYA Sustainability Auditor</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search fashion brand..."
              className="w-full bg-emerald-50/50 rounded-2xl px-6 py-4 text-sm outline-none border border-emerald-100 focus:ring-2 ring-emerald-200 transition-all font-medium text-emerald-900 placeholder:text-emerald-300"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
          </div>
          <button 
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="gradient-bg text-white px-6 py-4 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Audit'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
          {suggestedBrands.map(brand => (
            <button 
              key={brand} 
              onClick={() => handleSearch(brand)} 
              className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm whitespace-nowrap"
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
          <div className="w-24 h-24 bg-white rounded-[40px] shadow-xl flex items-center justify-center mb-8 border border-emerald-50">
            <BarChart3 className="w-10 h-10 text-emerald-400 animate-bounce" />
          </div>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[6px]">Synthesizing Global Data...</p>
        </div>
      )}

      {error && (
        <div className="mx-6 p-6 bg-white border border-rose-100 rounded-[32px] shadow-xl flex flex-col items-center text-center gap-4 animate-fade-in">
          <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Audit Error</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">{error}</p>
          <button onClick={() => handleSearch()} className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest border-b border-rose-200 pb-1">Retry Audit</button>
        </div>
      )}

      {result && !loading && (
        <div className="p-6 space-y-6 animate-slide-up pb-32">
          <div className="bg-white rounded-[45px] p-8 shadow-2xl relative overflow-hidden border border-emerald-50">
            <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
              <ShieldCheck className="w-48 h-48 text-emerald-500" />
            </div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <h3 className="text-3xl font-black text-emerald-900 tracking-tighter uppercase mb-2 truncate max-w-[200px]">{query}</h3>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusBg(result.score)}`}>
                   {result.score > 50 ? <CheckCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                   {result.rating}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className={`text-6xl font-black tracking-tighter ${getScoreColor(result.score)}`}>
                  {result.score}
                </div>
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-1">Audit Score</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 relative z-10">
              <PillarBar label="Environmental Impact" value={result.metrics.eco} color="bg-emerald-400" />
              <PillarBar label="Labor & Ethics" value={result.metrics.ethics} color="bg-emerald-600" />
              <PillarBar label="Brand Transparency" value={result.metrics.transparency} color="bg-teal-500" />
            </div>
          </div>

          <div className="bg-emerald-50/50 rounded-[40px] p-8 border border-emerald-100 shadow-inner">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Sparkles className="w-5 h-5" /></div>
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sustainability Intelligence Report</h4>
             </div>
             <p className="text-sm text-emerald-900 leading-relaxed font-medium whitespace-pre-wrap">
               {result.text}
             </p>
          </div>

          {result.sources.length > 0 && (
            <div className="px-2">
              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[4px] mb-4 ml-4">Verified Grounding Sources</h4>
              <div className="space-y-3">
                {result.sources.map((src, i) => (
                  <a 
                    key={i} 
                    href={src.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between p-5 bg-white border border-emerald-100 rounded-[28px] hover:bg-emerald-50 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="bg-emerald-50 p-2 rounded-xl group-hover:bg-white"><ExternalLink className="w-4 h-4 text-emerald-500" /></div>
                      <span className="text-xs font-bold text-emerald-900 truncate">{src.title || "Audit Report"}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:text-emerald-500" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="p-16 text-center opacity-40 flex flex-col items-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8">
            <Leaf className="w-10 h-10 text-emerald-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[6px] text-emerald-600 leading-relaxed text-center">
            Scan a fashion brand to view its real-world sustainability footprint
          </p>
        </div>
      )}
    </div>
  );
};

const PillarBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center px-1">
      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">{label}</span>
      <span className="text-[9px] font-black text-emerald-500">{Math.round(value)}%</span>
    </div>
    <div className="w-full bg-emerald-100/50 h-2 rounded-full overflow-hidden shadow-inner">
      <div 
        className={`${color} h-full rounded-full transition-all duration-1000 shadow-sm`} 
        style={{ width: `${value}%` }} 
      />
    </div>
  </div>
);

export default GreenScore;
