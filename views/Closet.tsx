
import React, { useState, useEffect, useRef } from 'react';
import { Box, Plus, X, Loader2, Trash2, Check, Heart, ChevronRight, Edit2 } from 'lucide-react';
import { WardrobeItem } from '../types';
import { api } from '../services/api';
import { analyzeImageLocally, LocalAnalysis } from '../services/localML';

const Closet: React.FC = () => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [localAnalysis, setLocalAnalysis] = useState<LocalAnalysis | null>(null);

  const [newItem, setNewItem] = useState<Partial<WardrobeItem>>({
    name: '',
    category: 'Top',
    color: '',
    fabric: ''
  });

  // Updated categories to match AI outputs including specific Jewellery & Bags
  const categories = [
    'All', 'Top', 'Bottom', 'Trousers', 'Jeans', 'Skirt', 'Dress', 'Shorts', 
    'T-Shirt', 'Sweater', 'Jacket', 'Outerwear', 
    'Shoes', 'Bag', 'Necklace', 'Ring', 'Earrings', 'Watch', 'Accessories'
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.wardrobe.getAll();
      setItems(data.map((item: any) => ({
        id: item.item_id || item.id.toString(),
        name: item.name,
        category: item.category,
        color: item.color,
        fabric: item.fabric,
        imageUrl: item.image_url,
        wearCount: item.wear_count || 0,
        isFavorite: false
      })));
    } catch (e) {
      console.error("Fetch wardrobe failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        
        setAnalyzing(true);
        try {
          const local = await analyzeImageLocally(base64);
          setLocalAnalysis(local);

          // Use Backend API for robust AI autodetection (Top/Bottom/Dress)
          const analysis = await api.wardrobe.scanFabric(base64);
          if (analysis && analysis.success) {
            setNewItem({
              name: analysis.name,
              category: analysis.category,
              color: local.shadeNames[0] || analysis.color,
              fabric: analysis.fabric
            });
          }
        } catch (err) {
          console.error("Backend Autotagging failed", err);
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (item: WardrobeItem) => {
    setEditingId(item.id);
    setNewItem({
      name: item.name,
      category: item.category,
      color: item.color,
      fabric: item.fabric
    });
    setImagePreview(item.imageUrl || null);
    setShowAddModal(true);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', newItem.name || '');
      formData.append('category', newItem.category || 'Top');
      formData.append('color', newItem.color || '');
      formData.append('fabric', newItem.fabric || '');
      
      if (editingId) {
        if (imagePreview && !imagePreview.startsWith('http')) {
           formData.append('image_url', imagePreview);
        }
        await api.wardrobe.update(editingId, formData);
      } else {
        if (imagePreview) formData.append('image_url', imagePreview);
        await api.wardrobe.add(formData);
      }

      await fetchItems();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save item.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewItem({ name: '', category: 'Top', color: '', fabric: '' });
    setImagePreview(null);
    setLocalAnalysis(null);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this piece from your wardrobe?')) return;
    try {
      const res = await api.wardrobe.delete(id);
      if (res.success) {
        setItems(prev => prev.filter(i => i.id !== id));
      }
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete item.");
    }
  };

  const handleWear = async (id: string) => {
    try {
      const res = await api.wardrobe.wear(id);
      if (res.success) {
        setItems(prev => prev.map(item => 
          item.id === id ? { ...item, wearCount: (item.wearCount || 0) + 1 } : item
        ));
      }
    } catch (e) {
      console.error("Wear count update failed:", e);
    }
  };

  const filteredItems = filter === 'All' ? items : items.filter(i => i.category === filter);

  return (
    <div className="p-6 bg-white min-h-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl serif">My Wardrobe</h1>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }} 
          className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar scroll-smooth">
        {categories.map((cat) => (
          <button 
            key={cat} 
            onClick={() => setFilter(cat)} 
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${filter === cat ? 'bg-pink-100 text-pink-500 border border-pink-200' : 'bg-slate-50 text-slate-400 border border-transparent'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-pink-200" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-5 pb-24">
          {filteredItems.length > 0 ? filteredItems.map(item => (
            <div key={item.id} className="bg-slate-50 rounded-[32px] p-4 relative group shadow-sm border border-slate-100/50">
               <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleDelete(item.id)} className="p-2 bg-white/90 rounded-full text-red-400 shadow-sm hover:bg-red-50 transition-colors">
                   <Trash2 className="w-3.5 h-3.5" />
                 </button>
                 <button onClick={() => handleEdit(item)} className="p-2 bg-white/90 rounded-full text-blue-400 shadow-sm hover:bg-blue-50 transition-colors">
                   <Edit2 className="w-3.5 h-3.5" />
                 </button>
                 <button onClick={() => handleWear(item.id)} className="p-2 bg-white/90 rounded-full text-pink-400 shadow-sm flex items-center gap-1.5 px-3 hover:bg-pink-50 transition-colors">
                   <Heart className="w-3.5 h-3.5 fill-pink-400" />
                   <span className="text-[8px] font-black whitespace-nowrap">Worn {item.wearCount}</span>
                 </button>
               </div>
               
               <div className="w-full aspect-[3/4] bg-white rounded-2xl mb-4 overflow-hidden shadow-inner flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} className="w-full h-full object-contain p-2" alt={item.name} />
                  ) : (
                    <Box className="w-12 h-12 text-slate-100" />
                  )}
               </div>
               <h3 className="text-[10px] font-black text-slate-800 uppercase truncate px-1">{item.name}</h3>
               <p className="text-[9px] text-pink-400 uppercase font-black tracking-widest mt-1 px-1">{item.category}</p>
            </div>
          )) : (
            <div className="col-span-2 py-20 flex flex-col items-center opacity-30">
               <Box className="w-16 h-16 mb-4 text-slate-200" />
               <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No pieces found in {filter}</p>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowAddModal(false); resetForm(); }} />
          <div className="relative w-full max-w-md bg-white rounded-t-[50px] p-8 animate-slide-up max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl serif text-slate-800">{editingId ? 'Edit Piece' : 'Wardrobe Entry'}</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-3 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed border-slate-100 rounded-[40px] p-4 flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer relative aspect-[3/4] group transition-colors hover:border-pink-200 overflow-hidden"
              >
                {imagePreview ? (
                  <img src={imagePreview} className="absolute inset-0 w-full h-full object-contain p-4" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-50">
                      <Plus className="w-8 h-8 text-slate-300 group-hover:text-pink-300 transition-colors" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capture Piece</p>
                  </div>
                )}
                
                {analyzing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center text-pink-500 z-20 animate-fade-in">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-[5px]">AI Classifying...</span>
                  </div>
                )}
                
                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
              </div>

              <div className="space-y-4">
                 {localAnalysis && (
                   <div className="flex gap-2 animate-fade-in mb-4 justify-center">
                     {localAnalysis.palette.map((color, idx) => (
                       <div 
                         key={idx} 
                         className="w-7 h-7 rounded-full border border-white shadow-sm" 
                         style={{ backgroundColor: color }} 
                         title={localAnalysis.shadeNames[idx]}
                       />
                     ))}
                   </div>
                 )}

                 <div className="relative">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full">{newItem.fabric || "Scanning..."}</span>
                   </div>
                   <input 
                     type="text" 
                     placeholder="Item Title (e.g. Vintage Jeans)" 
                     required 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm outline-none focus:ring-2 ring-pink-100 font-bold" 
                     value={newItem.name} 
                     onChange={e => setNewItem({...newItem, name: e.target.value})} 
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm outline-none font-bold appearance-none" 
                      value={newItem.category} 
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                    >
                      {categories.filter(c => c !== 'All').map(cat => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      placeholder="Material" 
                      className="w-full bg-pink-50 border border-pink-100 text-pink-700 rounded-2xl p-5 text-sm outline-none font-bold" 
                      value={newItem.fabric} 
                      onChange={e => setNewItem({...newItem, fabric: e.target.value})} 
                    />
                 </div>
              </div>

              {error && <p className="text-[10px] text-rose-500 font-bold text-center">{error}</p>}

              <button 
                type="submit" 
                disabled={submitting || analyzing || !imagePreview} 
                className="w-full py-6 gradient-bg text-white rounded-full font-black uppercase tracking-[3px] text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <div className="flex items-center gap-2 font-black"><Check className="w-4 h-4" /> {editingId ? 'Update Item' : 'Save to Wardrobe'}</div>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Closet;
