
import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const calculateAge = (birthday: string): string => {
  if (!birthday) return '0';
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    birthday: '2000-01-01',
    gender: 'Female',
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let data;
      if (isRegistering) {
        data = await api.auth.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          birthday: formData.birthday,
          gender: formData.gender,
          location: formData.location
        });
      } else {
        data = await api.auth.login({
          email: formData.email,
          password: formData.password
        });
      }

      onLogin({
        id: data.user.user_id,
        name: data.user.full_name,
        email: data.user.email,
        location: data.user.location,
        birthday: data.user.birthday || formData.birthday,
        age: calculateAge(data.user.birthday || formData.birthday),
        gender: data.user.gender,
        isLoggedIn: true
      });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center gradient-bg p-6">
      <div className="w-full max-w-sm glass-card rounded-[40px] p-8 shadow-2xl animate-fade-in">
        <h1 className="text-4xl text-slate-800 text-center mb-8 serif">
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-500 text-[10px] p-4 rounded-2xl mb-6 flex items-start gap-3 font-bold uppercase tracking-wider border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full bg-slate-50/50 border-none rounded-2xl p-4 text-slate-700 outline-none focus:ring-2 ring-pink-300 transition-all"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full bg-slate-50/50 border-none rounded-2xl p-4 text-slate-700 outline-none focus:ring-2 ring-pink-300 transition-all"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />

          {isRegistering && (
            <div className="space-y-4 animate-fade-in">
              <input
                type="text"
                placeholder="Full Name"
                required
                className="w-full bg-slate-50/50 border-none rounded-2xl p-4 text-slate-700 outline-none focus:ring-2 ring-pink-300 transition-all"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Birthday</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50/50 border-none rounded-2xl p-4 text-slate-700 outline-none focus:ring-2 ring-pink-300 transition-all"
                  value={formData.birthday}
                  onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Gender</label>
                <select
                  className="w-full bg-slate-50/50 border-none rounded-2xl p-4 text-slate-700 outline-none focus:ring-2 ring-pink-300 transition-all"
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Location (City)"
                required
                className="w-full bg-slate-50/50 border-none rounded-2xl p-4 text-slate-700 outline-none focus:ring-2 ring-pink-300 transition-all"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-white font-bold rounded-2xl p-4 mt-4 shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Create Account' : 'Sign In')}
            {!loading && <span className="text-xl">›</span>}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-pink-400 transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
          
          <div className="block pt-2">
            <button className="text-pink-400 text-[10px] font-black border-b border-pink-400 uppercase tracking-[2px] hover:bg-pink-50 transition-colors">
              Skip to Style DNA Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
