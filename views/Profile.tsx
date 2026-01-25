
import React, { useState, useEffect } from 'react';
import { 
  LogOut, Shield, Database, Edit3, X, 
  ChevronRight, Save, Loader2, MapPin, 
  Award, Heart, Layout, Settings, Bell, ChevronDown, ChevronUp, History, UserCircle, Plus, Check
} from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../services/api';

interface ProfileProps {
  user: UserType;
  onUpdateUser: (u: UserType) => void;
  onLogout: () => void;
}

const calculateAge = (birthday: string): string => {
  if (!birthday) return '0';
  const birthDate = new Date(birthday);
  if (isNaN(birthDate.getTime())) return '0';
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
};

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onLogout }) => {
  const [openSection, setOpenSection] = useState<string | null>('overview');
  const [activity, setActivity] = useState<any[]>([]);
  const [newColor, setNewColor] = useState('');
  const [newBrand, setNewBrand] = useState('');
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user.name,
    gender: user.gender,
    birthday: user.birthday || '',
    location: user.location
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Settings State
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications ?? true);

  // Preferences State
  const [prefs, setPrefs] = useState({
    brands: ['ZARA', 'Patagonia', 'Uniqlo'],
    colors: ['Midnight Blue', 'Charcoal', 'Ivory']
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const p = await api.profile.getPreferences();
        if (p) {
          setPrefs({
            brands: p.brands && p.brands.length > 0 ? p.brands : ['ZARA', 'Patagonia', 'Uniqlo'],
            colors: p.colors && p.colors.length > 0 ? p.colors : ['Midnight Blue', 'Charcoal', 'Ivory']
          });
        }
        const act = await api.profile.getActivity();
        if (act && Array.isArray(act)) setActivity(act);
      } catch (e) {
        setActivity([
          { id: 1, action: "Added Item", item: "Linen Skirt", date: "Today" },
          { id: 2, action: "Check Brand", item: "Patagonia", date: "Yesterday" },
          { id: 3, action: "Style Quiz", item: "DNA Mapped", date: "2 days ago" }
        ]);
      }
    };
    fetchInit();
  }, []);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const addColor = () => {
    if (newColor && !prefs.colors.includes(newColor)) {
      setPrefs({ ...prefs, colors: [...prefs.colors, newColor] });
      setNewColor('');
    }
  };

  const addBrand = () => {
    if (newBrand && !prefs.brands.includes(newBrand)) {
      setPrefs({ ...prefs, brands: [...prefs.brands, newBrand] });
      setNewBrand('');
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.profile.updatePreferences(prefs);
      alert("Preferences saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleToggleNotifications = async () => {
    const newVal = !emailNotifications;
    setEmailNotifications(newVal);
    try {
      await api.profile.update({ email_notifications: newVal ? 1 : 0 });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await api.profile.update({
        full_name: editedUser.name,
        location: editedUser.location,
        birthday: editedUser.birthday,
        gender: editedUser.gender
      });
      onUpdateUser({
        ...user,
        name: updated.full_name,
        location: updated.location,
        birthday: updated.birthday,
        age: calculateAge(updated.birthday || ''),
        gender: updated.gender,
        emailNotifications: updated.email_notifications === 1
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Error saving profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="bg-white min-h-full pb-32 overflow-y-auto">
      {/* Light Pink Header Box */}
      <div className="bg-[#fff0f5] pt-14 pb-12 px-8 rounded-b-[60px] flex flex-col items-center border-b border-pink-100 shadow-sm transition-all duration-500">
        <div className="relative mb-6">
           <div className="w-28 h-28 gradient-bg rounded-full flex items-center justify-center text-white text-6xl serif border-8 border-white shadow-[0_15px_30px_rgba(0,0,0,0.1)] animate-bounce-profile">
             {editedUser.name[0].toUpperCase()}
           </div>
           
           {/* Heart Button as Edit/Save Toggle */}
           <button 
             onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
             className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg border border-pink-50 hover:scale-110 active:scale-90 transition-all cursor-pointer z-10"
           >
             {savingProfile ? (
               <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
             ) : isEditing ? (
               <Check className="w-4 h-4 text-emerald-500" />
             ) : (
               <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
             )}
           </button>
        </div>
        
        <div className="text-center w-full max-w-[250px]">
          {isEditing ? (
            <div className="animate-fade-in space-y-3">
              <input 
                type="text"
                className="w-full text-center text-xl font-black text-slate-800 tracking-tight uppercase border-b-2 border-pink-200 bg-transparent outline-none focus:border-pink-400 transition-colors"
                value={editedUser.name}
                onChange={e => setEditedUser({...editedUser,name: e.target.value})}
                placeholder="Full Name"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex gap-2">
                   <input 
                    type="text"
                    className="w-20 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-transparent outline-none"
                    value={editedUser.gender}
                    onChange={e => setEditedUser({...editedUser, gender: e.target.value})}
                    placeholder="Gender"
                  />
                  <div className="w-1.5 h-1.5 bg-pink-200 rounded-full mt-1.5" />
                   <input 
                    type="date"
                    className="w-24 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-transparent outline-none"
                    value={editedUser.birthday}
                    onChange={e => setEditedUser({...editedUser, birthday: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <MapPin className="w-3 h-3 text-indigo-400" />
                <input 
                  type="text"
                  className="text-center text-[10px] font-black text-indigo-400 uppercase tracking-[4px] border-b border-indigo-200 bg-transparent outline-none"
                  value={editedUser.location}
                  onChange={e => setEditedUser({...editedUser, location: e.target.value})}
                  placeholder="Location"
                />
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1 uppercase">{user.name}</h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user.gender}</span>
                <div className="w-1.5 h-1.5 bg-pink-200 rounded-full" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {user.age && user.age !== '0' ? `${user.age} YEARS OLD` : "AGE N/A"}
                </span>
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[5px] mt-4 flex items-center justify-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {user.location || "DELHI"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Overview: Activity */}
        <div className="bg-slate-50/50 rounded-[35px] overflow-hidden border border-slate-100 shadow-sm">
          <button 
            onClick={() => toggleSection('overview')}
            className="w-full flex items-center justify-between p-7 hover:bg-white transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner"><History className="w-5.5 h-5.5" /></div>
              <span className="text-xs font-black uppercase tracking-[2px] text-slate-700">Overview</span>
            </div>
            {openSection === 'overview' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
          </button>
          
          {openSection === 'overview' && (
            <div className="px-7 pb-7 space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-3 mb-4">
                 <div className="bg-white p-5 rounded-3xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Scanned</p>
                    <p className="text-xl font-black text-slate-800">24</p>
                 </div>
                 <div className="bg-white p-5 rounded-3xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Style DNA</p>
                    <p className="text-xl font-black text-pink-500">92%</p>
                 </div>
              </div>
              {activity.map((act, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                  <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase">{act.action}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{act.item}</p>
                  </div>
                  <span className="text-[8px] font-black text-slate-300 uppercase">{act.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preferences: Colors & Brands */}
        <div className="bg-slate-50/50 rounded-[35px] overflow-hidden border border-slate-100 shadow-sm">
          <button 
            onClick={() => toggleSection('preferences')}
            className="w-full flex items-center justify-between p-7 hover:bg-white transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 shadow-inner"><Heart className="w-5.5 h-5.5" /></div>
              <span className="text-xs font-black uppercase tracking-[2px] text-slate-700">Preferences</span>
            </div>
            {openSection === 'preferences' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
          </button>
          
          {openSection === 'preferences' && (
            <div className="px-7 pb-7 space-y-6 animate-fade-in">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fashion Colors</label>
                <div className="flex gap-2 mb-2">
                   <input 
                     type="text" 
                     placeholder="Type a color..." 
                     className="flex-1 bg-white border border-slate-100 rounded-2xl p-3 text-xs font-bold outline-none" 
                     value={newColor}
                     onChange={e => setNewColor(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && addColor()}
                   />
                   <button onClick={addColor} className="w-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center"><Plus className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {prefs.colors.map(c => (
                    <span key={c} className="px-4 py-2 bg-white rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600 border border-slate-100 shadow-sm flex items-center gap-2">
                      {c} <X className="w-3 h-3 text-slate-300 cursor-pointer" onClick={() => setPrefs({...prefs, colors: prefs.colors.filter(it => it !== c)})} />
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loved Brands</label>
                <div className="flex gap-2 mb-2">
                   <input 
                     type="text" 
                     placeholder="Add a brand..." 
                     className="flex-1 bg-white border border-slate-100 rounded-2xl p-3 text-xs font-bold outline-none" 
                     value={newBrand}
                     onChange={e => setNewBrand(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && addBrand()}
                   />
                   <button onClick={addBrand} className="w-12 bg-pink-500 text-white rounded-2xl flex items-center justify-center"><Plus className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {prefs.brands.map(b => (
                    <span key={b} className="px-4 py-2 bg-white rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600 border border-slate-100 shadow-sm flex items-center gap-2">
                      {b} <X className="w-3 h-3 text-slate-300 cursor-pointer" onClick={() => setPrefs({...prefs, brands: prefs.brands.filter(it => it !== b)})} />
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="w-full mt-4 py-4 gradient-bg text-white rounded-3xl font-black uppercase tracking-[3px] text-[10px] flex items-center justify-center gap-3 active:scale-95 shadow-lg"
              >
                {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Preferences
              </button>
            </div>
          )}
        </div>

        {/* Settings: Email Notifications */}
        <div className="bg-slate-50/50 rounded-[35px] overflow-hidden border border-slate-100 shadow-sm">
          <button 
            onClick={() => toggleSection('settings')}
            className="w-full flex items-center justify-between p-7 hover:bg-white transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner"><Settings className="w-5.5 h-5.5" /></div>
              <span className="text-xs font-black uppercase tracking-[2px] text-slate-700">Settings</span>
            </div>
            {openSection === 'settings' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
          </button>
          
          {openSection === 'settings' && (
            <div className="px-7 pb-7 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Bell className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Email Notifications</span>
                </div>
                <button 
                  onClick={handleToggleNotifications}
                  className={`w-11 h-6 rounded-full flex items-center px-1.5 transition-all shadow-sm ${emailNotifications ? 'bg-emerald-400' : 'bg-slate-300'}`}
                >
                   <div className={`w-3.5 h-3.5 bg-white rounded-full transition-all ${emailNotifications ? 'ml-auto' : 'ml-0'}`} />
                </button>
              </div>
              
              <button 
                onClick={onLogout}
                className="w-full mt-2 py-5 bg-rose-50 border border-rose-100 text-rose-500 rounded-3xl font-black uppercase tracking-[4px] text-[10px] flex items-center justify-center gap-3 active:scale-95 shadow-sm"
              >
                <LogOut className="w-5 h-5" />
                Logout Session
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-16 text-center pb-24">
        <div className="flex justify-center gap-4 opacity-10 grayscale mb-4">
           <History className="w-8 h-8" /><Award className="w-8 h-8" /><Layout className="w-8 h-8" />
        </div>
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[6px]">WYA VERSION 4.1.5 • AI CORE</p>
      </div>
    </div>
  );
};

export default Profile;
