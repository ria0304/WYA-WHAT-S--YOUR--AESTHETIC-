
import React, { useState } from 'react';
import { Plane, Sparkles, X, Briefcase, MapPin, Calendar, Loader2, Store, ChevronRight, CheckCircle2, ShoppingBag, Gift, Shirt, Map, Tag } from 'lucide-react';
import { api } from '../services/api';

const VacationShop: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [data, setData] = useState({
    city: 'Delhi',
    fromDate: '',
    returnDate: '',
    vibe: 'city'
  });

  const handleGenerate = async () => {
    if (!data.city || !data.fromDate || !data.returnDate) {
      alert("Please specify destination and dates.");
      return;
    }

    setLoading(true);
    try {
      const start = new Date(data.fromDate);
      const end = new Date(data.returnDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // Call Backend API
      const plan = await api.ai.getVacationPlan(data.vibe, days, data.city);
      setResult({ ...plan, city: data.city, days });
      setStep(2);
    } catch (e) {
      console.error(e);
      alert("Trip planning failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-full pb-32">
      {step === 1 && (
        <div className="bg-indigo-50/40 rounded-[40px] p-8 animate-fade-in border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-50">
              <Plane className="w-6 h-6" />
            </div>
            <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[4px]">Trip Curator</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Destination
              </label>
              <input
                type="text"
                placeholder="Where are you going?"
                className="w-full bg-white rounded-3xl p-5 text-sm font-bold outline-none border border-slate-100 focus:ring-2 ring-indigo-100 transition-all"
                value={data.city}
                onChange={e => setData({...data, city: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Start</label>
                <input
                  type="date"
                  className="w-full bg-white rounded-3xl p-5 text-sm outline-none border border-slate-100"
                  value={data.fromDate}
                  onChange={e => setData({...data, fromDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">End</label>
                <input
                  type="date"
                  className="w-full bg-white rounded-3xl p-5 text-sm outline-none border border-slate-100"
                  value={data.returnDate}
                  onChange={e => setData({...data, returnDate: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {['beach', 'mountain', 'city'].map(v => (
                <button
                  key={v}
                  onClick={() => setData({...data, vibe: v})}
                  className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${data.vibe === v ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-400 border border-indigo-100'}`}
                >
                  {v}
                </button>
              ))}
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !data.city}
              className="w-full mt-4 py-6 rounded-full gradient-bg text-white font-black text-[10px] uppercase tracking-[3px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Curate Wardrobe <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      )}

      {step === 2 && result && (
        <div className="animate-slide-up space-y-6">
           <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{result.city}</h2>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> {result.days} Days • {result.weather_summary}
                  </p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <Shirt className="w-3 h-3" /> Pack {result.clothes_count} Items
                  </p>
                </div>
              </div>
              <button onClick={() => setStep(1)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
           </div>

           {/* ORDER: Packing List -> Shopping Districts -> Hidden Boutiques */}

           {/* 1. PACKING LIST */}
           <div className="bg-indigo-50/50 rounded-[40px] p-8 border border-white shadow-inner">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Packing List
              </h3>
              <ul className="grid grid-cols-2 gap-2">
                {(result.packing_list || []).map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-[10px] text-slate-700 font-bold bg-white p-3 rounded-xl border border-indigo-50 shadow-sm leading-tight">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
           </div>

           {/* 2. MAJOR MARKETS (Formerly Shopping Districts) */}
           <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-md">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Major Local Markets
              </h3>
              <div className="space-y-4">
                {(result.must_visit || []).map((place: any, i: number) => (
                  <div key={i} className="bg-slate-50 p-5 rounded-[28px] border border-slate-100/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-black text-slate-800 uppercase">{place.name}</h4>
                      <Tag className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">{place.type}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{place.description}</p>
                  </div>
                ))}
              </div>
           </div>

           {/* 3. HIDDEN GEMS (Formerly Local Boutiques) */}
           <div className="bg-pink-50/40 rounded-[40px] p-8 border border-pink-100 shadow-sm">
              <h3 className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Hidden Gems & Unique Finds
              </h3>
              <div className="space-y-4">
                {(result.hidden_gems || []).map((shop: any, i: number) => (
                  <div key={i} className="bg-white p-5 rounded-[28px] border border-pink-50 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-black text-slate-800 uppercase">{shop.name}</h4>
                      <Gift className="w-4 h-4 text-pink-400" />
                    </div>
                    <p className="text-[9px] font-bold text-pink-300 uppercase tracking-widest mb-2">{shop.type}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{shop.description}</p>
                  </div>
                ))}
              </div>
           </div>

           <button 
              onClick={() => setStep(1)}
              className="w-full py-6 rounded-3xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-[4px] text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all"
           >
              New Trip Plan
           </button>
        </div>
      )}
    </div>
  );
};

export default VacationShop;
