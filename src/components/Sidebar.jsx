import React from 'react';
import { Home, BookOpen, LogOut } from 'lucide-react';
import { useAppContext } from '../lib/store';
import { supabase } from '../lib/supabase';

export default function Sidebar() {
  const { activeScreen, setActiveScreen, user } = useAppContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'vocab', label: 'Bộ từ vựng', icon: BookOpen },
  ];

  return (
    <div className="w-[280px] h-screen bg-white border-r-2 border-slate-200 flex flex-col p-6 sticky top-0">
      <div className="mb-10 text-3xl font-extrabold text-primary-green tracking-tight">
        Voca<span className="text-text-primary">Vibe</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id || (activeScreen !== 'home' && item.id === 'vocab' && activeScreen !== 'home'); // generic active matching for game screens returning to vocab
          const isHighlight = activeScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-[17px] transition-all duration-100 ${
                isHighlight 
                  ? 'bg-blue-50 text-primary-blue border-2 border-blue-200 shadow-sm' 
                  : 'text-text-secondary hover:bg-slate-100 border-2 border-transparent'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto pt-6 border-t-2 border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <img 
             src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`} 
             className="w-12 h-12 rounded-full border-2 border-slate-200"
             alt="Avatar"
          />
          <div className="flex-1 overflow-hidden">
             <div className="font-bold text-text-primary truncate">{user?.user_metadata?.full_name || user?.email}</div>
             <div className="text-xs text-text-secondary capitalize">Học viên</div>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 mt-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
    </div>
  )
}
