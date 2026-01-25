
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, Box, Loader2, ArrowRight, Heart, Star, Layout, Plus, X, Shirt, Image as ImageIcon, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { WardrobeItem } from '../types';

interface OutfitSet {
  id: string;
  name: string;
  vibe: string;
  items: WardrobeItem[];
  isManual?: boolean;
  isDaily?: boolean;
  createdDate?: string;
}

const Curate: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [outfits, setOutfits] = useState<OutfitSet[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loggingIds, setLoggingIds] = useState<Set<string>>(new Set());
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());
  
  // Manual Outfit State
  const [manualTop, setManualTop] = useState<WardrobeItem | string | null>(null);
  const [manualBottom, setManualBottom] = useState<WardrobeItem | string | null>(null);
  const [manualName, setManualName] = useState('');
  
  const topInputRef = useRef<HTMLInputElement>(null);
  const bottomInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAndCurate();
  }, []);

  const fetchAndCurate = async () => {
    setLoading(true);
    try {
      const data = await api.wardrobe.getAll();
      const mapped = data.map((item: any) => ({
        id: item.item_id || item.id.toString(),
        name: item.name,
        category: item.category,
        color: item.color,
        fabric: item.fabric,
        imageUrl: item.image_url,
        wearCount: item.wear_count || 0,
        isFavorite: false
      }));
      setWardrobe(mapped);
      
      const savedManuals = JSON.parse(localStorage.getItem('wya_manual_outfits') || '[]');
      
      // Automatic Daily Curate Logic
      const today = new Date().toDateString();
      const hasDaily = savedManuals.find((o: OutfitSet) => o.isDaily && o.createdDate === today);
      
      let newDailyLook: OutfitSet | null = null;
      
      // Only generate daily look if not exists and we have items
      if (!hasDaily && mapped.length > 0) {
         try {
           const aiSuggestions = await api.ai.curateOutfits(mapped);
           // Pick the first valid one as daily look
           if (aiSuggestions.length > 0) {
              const suggestion = aiSuggestions[0];
              const suggestedItems: WardrobeItem[] = [];
              for (const id of suggestion.item_ids) {
                  const found = mapped.find((i: any) => i.id === id);
                  if (found) suggestedItems.push(found);
              }
              
              if (suggestedItems.length > 0) {
                 newDailyLook = {
                    id: `daily-${Date.now()}`,
                    name: "Daily Drop",
                    vibe: suggestion.vibe,
                    items: suggestedItems,
                    isDaily: true,
                    createdDate: today
                 };
                 // Save automatically
                 savedManuals.unshift(newDailyLook);
                 localStorage.setItem('wya_manual_outfits', JSON.stringify(savedManuals));
              }
           }
         } catch (err) {
            console.warn("Daily curate failed", err);
         }
      }

      // If we still have no AI sets (beyond saved ones), generate transient ones
      const displayedOutfits = [...savedManuals];
      if (displayedOutfits.length < 3 && mapped.length > 0) {
          await generateAIOutfits(mapped, displayedOutfits);
      } else {
          setOutfits(displayedOutfits);
          setLoading(false);
      }
    } catch (e) {
      console.error("Fetch failed", e);
      setLoading(false);
    }
  };

  const generateAIOutfits = async (items: WardrobeItem[], existing: OutfitSet[] = []) => {
    try {
      if (items.length < 2) {
        setOutfits(existing);
        setLoading(false);
        return;
      }
      
      // Call Backend AI for Curation
      const aiSuggestions = await api.ai.curateOutfits(items);
      const aiSets: OutfitSet[] = [];
      
      for (const suggestion of aiSuggestions) {
         const suggestedItems: WardrobeItem[] = [];
         for (const id of suggestion.item_ids) {
            const found = items.find(i => i.id === id);
            if (found) suggestedItems.push(found);
         }
         
         if (suggestedItems.length > 0) {
           aiSets.push({
             id: `ai-${Date.now()}-${Math.random()}`,
             name: suggestion.name,
             vibe: suggestion.vibe,
             items: suggestedItems
           });
         }
      }

      setOutfits([...existing, ...aiSets]);
    } catch (e) {
      console.error("AI Curation failed, falling back to simple shuffle", e);
      // Fallback logic
      const tops = items.filter(i => i.category === 'Top');
      const bottoms = items.filter(i => i.category === 'Bottom');
      if (tops.length > 0 && bottoms.length > 0) {
         setOutfits([...existing, {
            id: `fallback-${Date.now()}`,
            name: "Classic Combo",
            vibe: "Casual",
            items: [tops[0], bottoms[0]]
         }]);
      } else {
        setOutfits(existing);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = async () => {
    setLoading(true);
    const savedManuals = JSON.parse(localStorage.getItem('wya_manual_outfits') || '[]');
    // Force re-generation of transient AI sets
    await generateAIOutfits(wardrobe, savedManuals);
  };

  const handleManualImage = (e: React.ChangeEvent<HTMLInputElement>, target: 'top' | 'bottom') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'top') setManualTop(base64);
        else setManualBottom(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setManualTop(null);
    setManualBottom(null);
    setManualName('');
  };

  const saveManualOutfit = () => {
    if (!manualTop || !manualBottom) return;

    const newSet: OutfitSet = {
      id: `manual-${Date.now()}`,
      name: manualName || 'My Custom Look',
      vibe: 'Personalized',
      isManual: true,
      createdDate: new Date().toDateString(),
      items: [
        {
          id: 'manual-top',
          name: 'Manual Top',
          category: 'Top',
          color: 'Custom',
          fabric: 'Unknown',
          imageUrl: typeof manualTop === 'string' ? manualTop : manualTop.imageUrl,
          isFavorite: false
        },
        {
          id: 'manual-bottom',
          name: 'Manual Bottom',
          category: 'Bottom',
          color: 'Custom',
          fabric: 'Unknown',
          imageUrl: typeof manualBottom === 'string' ? manualBottom : manualBottom.imageUrl,
          isFavorite: false
        }
      ]
    };

    const currentManuals = JSON.parse(localStorage.getItem('wya_manual_outfits') || '[]');
    const updatedManuals = [newSet, ...currentManuals];
    localStorage.setItem('wya_manual_outfits', JSON.stringify(updatedManuals));
    
    setOutfits([newSet, ...outfits]);
    setShowAddModal(false);
    resetForm();
  };

  const deleteOutfit = (id: string) => {
    const isSaved = id.startsWith('manual-') || id.startsWith('daily-');
    if (isSaved) {
      const currentManuals = JSON.parse(localStorage.getItem('wya_manual_outfits') || '[]');
      const updatedManuals = currentManuals.filter((o: any) => o.id !== id);
      localStorage.setItem('wya_manual_outfits', JSON.stringify(updatedManuals));
    }
    setOutfits(outfits.filter(o => o.id !== id));
  };

  const handleLogWorn = async (outfitId: string, items: WardrobeItem[]) => {
    if (loggingIds.has(outfitId)) return;
    
    const newLogging = new Set(loggingIds);
    newLogging.add(outfitId);
    setLoggingIds(newLogging);

    try {
      // Process all items in parallel
      await Promise.all(items.map(item => {
        if (!item.id.startsWith('manual-')) {
          return api.wardrobe.wear(item.id);
        }
        return Promise.resolve();
      }));

      const newSuccess = new Set(successIds);
      newSuccess.add(outfitId);
      setSuccessIds(newSuccess);
      
      // Clear success state after 2 seconds
      setTimeout(() => {
        const clearSuccess = new Set(successIds);
        clearSuccess.delete(outfitId);
        setSuccessIds(clearSuccess);
      }, 2000);

    } catch (e) {
      console.error("Failed to log worn", e);
      alert("Could not update wear count. Please try again.");
    } finally {
      const clearLogging = new Set(loggingIds);
      clearLogging.delete(outfitId);
      setLoggingIds(clearLogging);
    }
  };

  return (
    <div className="p-6 bg-white min-h-full pb-32">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl serif">Curated Sets</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">AI Styling Engine Active</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={handleShuffle}
            disabled={loading || wardrobe.length === 0}
            className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 shadow-sm border border-pink-100 active:scale-90 transition-transform disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-pink-500 animate-spin mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] animate-pulse">Designing Looks...</p>
        </div>
      ) : outfits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Layout className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Sets Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-8">Create your first outfit set or add items to your closet for AI suggestions.</p>
          <button onClick={() => setShowAddModal(true)} className="px-8 py-4 gradient-bg text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Outfit
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
          {outfits.map((set) => (
            <div key={set.id} className="bg-slate-50 rounded-[45px] p-8 border border-white shadow-sm hover:shadow-md transition-shadow relative">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <div className="flex items-center gap-2 mb-3">
                     <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[3px] shadow-sm border ${set.isDaily ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : (set.isManual ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/80 text-pink-500 border-pink-50')}`}>
                       {set.isDaily ? 'Daily Drop' : (set.isManual ? 'Manual Curation' : set.vibe)}
                     </span>
                     {set.isManual && <Box className="w-3 h-3 text-slate-300" />}
                     {set.isDaily && <Star className="w-3 h-3 text-indigo-300 fill-indigo-300" />}
                   </div>
                   <h3 className="text-xl serif text-slate-800">{set.name}</h3>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => deleteOutfit(set.id)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors shadow-sm border border-slate-50"><Trash2 className="w-4 h-4" /></button>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 {set.items.map((item, i) => (
                   <div key={i} className="bg-white rounded-3xl p-3 shadow-inner group overflow-hidden aspect-[4/5] relative flex flex-col items-center justify-center">
                      <div className="w-full h-full p-2 flex items-center justify-center">
                        <img src={item.imageUrl} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-50 shadow-sm transform translate-y-12 group-hover:translate-y-0 transition-transform">
                        <p className="text-[8px] font-black text-slate-800 uppercase truncate">{item.name}</p>
                        <p className={`text-[7px] font-black uppercase tracking-widest ${item.category === 'Top' ? 'text-indigo-400' : 'text-pink-400'}`}>{item.category}</p>
                      </div>
                   </div>
                 ))}
               </div>

               <button 
                 onClick={() => handleLogWorn(set.id, set.items)}
                 disabled={loggingIds.has(set.id) || successIds.has(set.id)}
                 className={`w-full mt-6 py-4 rounded-3xl text-[9px] font-black uppercase tracking-[3px] flex items-center justify-center gap-2 transition-all group ${
                   successIds.has(set.id) 
                     ? 'bg-emerald-500 text-white border border-emerald-500' 
                     : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-800 hover:text-white'
                 }`}
               >
                 {loggingIds.has(set.id) ? (
                   <Loader2 className="w-3.5 h-3.5 animate-spin" />
                 ) : successIds.has(set.id) ? (
                   <>Logged Successfully <CheckCircle2 className="w-3.5 h-3.5" /></>
                 ) : (
                   <>Log as Worn <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
                 )}
               </button>
            </div>
          ))}
        </div>
      )}

      {/* Manual Curation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowAddModal(false); resetForm(); }} />
          <div className="relative w-full max-w-md bg-white rounded-t-[50px] p-8 animate-slide-up max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl serif text-slate-800">Curation Studio</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-3 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <input 
                type="text" 
                placeholder="Name your set (e.g. Sunday Brunch)" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm outline-none focus:ring-2 ring-indigo-100 font-bold" 
                value={manualName} 
                onChange={e => setManualName(e.target.value)} 
              />

              <div className="grid grid-cols-2 gap-5">
                {/* Top Piece Slot */}
                <div 
                  onClick={() => topInputRef.current?.click()}
                  className="aspect-[3/4] rounded-[35px] border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-indigo-200 transition-colors"
                >
                  {manualTop ? (
                    <img src={typeof manualTop === 'string' ? manualTop : manualTop.imageUrl} className="w-full h-full object-contain p-4" alt="Top Preview" />
                  ) : (
                    <>
                      <Shirt className="w-8 h-8 text-slate-300 mb-2" />
                      <span className="text-[10px] font-black uppercase text-slate-400">Add Top</span>
                    </>
                  )}
                  <input type="file" ref={topInputRef} className="hidden" accept="image/*" onChange={(e) => handleManualImage(e, 'top')} />
                </div>

                {/* Bottom Piece Slot */}
                <div 
                  onClick={() => bottomInputRef.current?.click()}
                  className="aspect-[3/4] rounded-[35px] border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-pink-200 transition-colors"
                >
                  {manualBottom ? (
                    <img src={typeof manualBottom === 'string' ? manualBottom : manualBottom.imageUrl} className="w-full h-full object-contain p-4" alt="Bottom Preview" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                      <span className="text-[10px] font-black uppercase text-slate-400">Add Bottom</span>
                    </>
                  )}
                  <input type="file" ref={bottomInputRef} className="hidden" accept="image/*" onChange={(e) => handleManualImage(e, 'bottom')} />
                </div>
              </div>

              <button 
                onClick={saveManualOutfit}
                disabled={!manualTop || !manualBottom} 
                className="w-full py-6 gradient-bg text-white rounded-full font-black uppercase tracking-[3px] text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30"
              >
                <Check className="w-4 h-4" /> Save Curation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Curate;
