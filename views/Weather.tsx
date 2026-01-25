import React, { useState, useEffect } from 'react';
import { Thermometer, Cloud, Search, Loader2, Sparkles, MapPin, RefreshCw, Shirt, Box } from 'lucide-react';
import { api } from '../services/api';

const WeatherView: React.FC = () => {
  const [city, setCity] = useState('Delhi');
  const [displayedCity, setDisplayedCity] = useState('Delhi');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!city) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.ai.getWeather(city);
      setResult(data);
      setDisplayedCity(city);
    } catch (e) {
      console.error(e);
      alert("Could not fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-full pb-32">
      <div className="bg-gradient-to-br from-slate-800 to-indigo-900 rounded-[45px] p-10 mb-8 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
          <Cloud className="w-48 h-48 text-white" />
        </div>
        
        <h2 className="font-black uppercase tracking-[6px] text-[10px] mb-10 opacity-60">Global Climate Intelligence</h2>
        <div className="relative z-10">
          <input
            type="text"
            className="w-full bg-white/10 border border-white/20 rounded-full px-8 py-5 outline-none text-white placeholder:text-white/40 focus:bg-white/20 transition-all font-black uppercase tracking-widest text-sm"
            value={city}
            placeholder="Search City..."
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch} 
            disabled={loading} 
            className="absolute right-2 top-2 bg-indigo-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin mb-8" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[5px] animate-pulse">Scanning Cloud Layers...</p>
        </div>
      ) : result ? (
        <div className="animate-slide-up space-y-8 px-2">
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-indigo-500" />
                <h3 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">{displayedCity}</h3>
             </div>
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[4px]">Verified Real-Time Ground Data</p>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div className="bg-white rounded-[40px] p-10 border border-slate-100 flex flex-col items-center text-center shadow-xl group hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-400 mb-5 shadow-inner"><Thermometer className="w-7 h-7" /></div>
                <span className="text-5xl font-black text-slate-800 tracking-tighter">{result.temp}°</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Celsius</span>
             </div>
             <div className="bg-white rounded-[40px] p-10 border border-slate-100 flex flex-col items-center text-center shadow-xl group hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-400 mb-5 shadow-inner"><Cloud className="w-7 h-7" /></div>
                <span className="text-xl font-black text-slate-700 leading-tight uppercase tracking-tight">{result.condition}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Atmosphere</span>
             </div>
          </div>
          
          <div className="bg-[#f8faff] rounded-[50px] p-10 shadow-inner border border-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
               <Sparkles className="w-40 h-40 text-indigo-500" />
            </div>
            <div className="flex items-center gap-4 mb-8">
               <div className="w-14 h-14 rounded-3xl bg-indigo-500 flex items-center justify-center text-white shadow-xl"><Sparkles className="w-7 h-7" /></div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[4px]">Style Curation</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
               <CurationItem label="Top" value={result.outfit.top} />
               <CurationItem label="Bottom" value={result.outfit.bottom} />
               <CurationItem label="Outerwear" value={result.outfit.layer} />
               <CurationItem label="Footwear" value={result.outfit.shoes} />
            </div>

            <p className="text-sm font-black text-slate-800 serif leading-relaxed italic border-l-8 border-indigo-200 pl-8 py-2">
              "{result.advice}"
            </p>
            
            <button onClick={handleSearch} className="mt-10 flex items-center gap-2 text-[9px] font-black uppercase tracking-[3px] text-slate-300 hover:text-indigo-400 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Re-sync live data
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const CurationItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="bg-white p-4 rounded-[24px] border border-slate-100 flex items-center justify-between shadow-sm">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-bold text-slate-800">{value}</span>
  </div>
);

export default WeatherView;
