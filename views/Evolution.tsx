
import React, { useState, useEffect } from 'react';
import { TrendingUp, Palette, Leaf, Box, Loader2, Sparkles, CheckCircle2, ChevronDown, History } from 'lucide-react';
import { api } from '../services/api';

interface TimelineItem {
  period: string;
  stage: string;
  style: string;
  color: string;
  mood: string;
  progress: number;
  items: number;
  key_item: string;
  is_current: boolean;
}

interface EvolutionData {
  timeline: TimelineItem[];
  insights: {
    dominant_style: string;
    style_change: string;
    color_preferences: string[];
    style_confidence: number;
    wardrobe_size: number;
    recommendations: string[];
  };
}

const Evolution: React.FC = () => {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('All Time');

  useEffect(() => {
    fetchEvolution();
  }, []);

  const fetchEvolution = async () => {
    setLoading(true);
    try {
      const evolutionData = await api.style.getEvolution();
      setData(evolutionData);
    } catch (e) {
      console.error("Failed to fetch evolution:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Mapping your journey...</p>
      </div>
    );
  }

  if (!data) return null;

  const { timeline, insights } = data;

  return (
    <div className="p-6 bg-slate-50 min-h-full space-y-6 pb-20">
      {/* Range Selector */}
      <div className="bg-white rounded-[32px] p-6 flex items-center justify-between gap-2 border border-slate-100 shadow-sm">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-2 flex items-center gap-2">
            <History className="w-3 h-3" /> Timeline
        </span>
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
          {['3 Months', '6 Months', '1 Year', 'All Time'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all whitespace-nowrap ${
                range === r ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-50 text-slate-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 animate-fade-in">
         <div className="flex justify-between items-start mb-10">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Aesthetic</p>
               <h2 className="text-3xl font-bold text-slate-800 gradient-text">{insights?.dominant_style || 'Analyzing'}</h2>
               <p className="text-xs text-slate-400 mt-1">Evolution Score: <span className="text-emerald-500 font-bold">{insights?.style_change || '0%'}</span></p>
            </div>
            <div className="text-right">
               <p className="text-4xl font-bold text-slate-800">{insights?.style_confidence || 0}%</p>
               <p className="text-[10px] text-slate-400 uppercase tracking-widest">Confidence</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-3xl p-6">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Wardrobe Size</p>
               <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-400 h-full transition-all duration-1000" style={{ width: `${Math.min((insights?.wardrobe_size || 0) * 4, 100)}%` }} />
                  </div>
                  <span className="text-lg font-bold">{insights?.wardrobe_size || 0}</span>
               </div>
            </div>
            <div className="bg-slate-50 rounded-3xl p-6">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Palette</p>
               <div className="flex gap-1 mt-2">
                 {insights?.color_preferences?.slice(0, 4).map((c, i) => (
                   <div key={i} className={`w-4 h-4 rounded-full border border-white shadow-sm ${getColorClass(c)}`} title={c} />
                 ))}
               </div>
            </div>
         </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-6 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          Style AI Insights
        </h3>
        <div className="space-y-4">
          {(insights?.recommendations || []).map((rec, i) => (
            <div key={i} className="flex gap-3 items-start animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="mt-0.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Style DNA Journey */}
      <div className="relative pt-4 pb-8">
         <h3 className="text-xl font-bold text-slate-800 mb-1 px-4">Style Architecture</h3>
         <p className="text-xs text-slate-400 mb-8 px-4">Your DNA evolution timeline</p>

         <div className="space-y-0 relative px-4">
            {/* Render Timeline Items */}
            {(timeline || []).map((item, idx) => (
              <div key={idx} className="relative flex flex-col items-center animate-fade-in" style={{ animationDelay: `${idx * 200}ms` }}>
                
                {/* The Box - Using WYA Gradient */}
                <div className={`w-full rounded-[30px] p-6 relative z-10 transition-all overflow-hidden gradient-bg shadow-xl ${
                    item.is_current 
                    ? 'scale-105 ring-4 ring-pink-100' 
                    : 'opacity-90 grayscale-[0.1] scale-95'
                }`}>
                    {/* Subtle texture overlay */}
                    <div className="absolute inset-0 bg-white/10" />

                    <div className="relative z-10 text-white">
                        {item.is_current && (
                            <div className="absolute top-0 right-0 bg-white/30 backdrop-blur-md px-4 py-1.5 rounded-bl-[20px] text-[8px] font-black uppercase tracking-widest border-l border-b border-white/20">
                                Current DNA
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">{item.period}</span>
                                {!item.is_current && <History className="w-3 h-3 text-white/60" />}
                              </div>
                              <h4 className="text-2xl font-black uppercase tracking-wide drop-shadow-sm">
                                  {item.stage}
                              </h4>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs border border-white/30 shadow-inner">
                              {item.progress}%
                          </div>
                        </div>
                        
                        <div className="bg-black/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                           <p className="text-xs font-medium text-white/95 leading-relaxed mb-2">{item.style}</p>
                           <p className="text-[10px] text-white/70 italic">"{item.mood}"</p>
                        </div>
                    </div>
                </div>

                {/* The Connecting Line */}
                {idx < timeline.length - 1 && (
                    <div className="h-10 w-0.5 bg-slate-300 my-1 relative opacity-50">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300" />
                    </div>
                )}
                
              </div>
            ))}

            {/* Empty State */}
            {timeline.length === 0 && (
                <div className="text-center py-10 opacity-50">
                    <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400">No DNA history yet. Take the Style Quiz!</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

const getColorClass = (color: string) => {
  const c = color.toLowerCase();
  if (c.includes('black')) return 'bg-slate-900';
  if (c.includes('white')) return 'bg-white';
  if (c.includes('gray')) return 'bg-slate-400';
  if (c.includes('navy')) return 'bg-blue-900';
  if (c.includes('blue')) return 'bg-blue-500';
  if (c.includes('earth') || c.includes('brown')) return 'bg-amber-800';
  if (c.includes('tan')) return 'bg-orange-100';
  if (c.includes('olive') || c.includes('green')) return 'bg-emerald-700';
  return 'bg-gradient-to-r from-pink-200 to-blue-200';
};

export default Evolution;
