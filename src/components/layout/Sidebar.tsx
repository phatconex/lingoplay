'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LogOut, Layers, LucideIcon } from 'lucide-react';
import { useAppContext } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAppContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: Home, exact: true },
    { path: '/review', label: 'Ôn tập tổng hợp', icon: Layers, exact: false },
  ];

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.path;
    return pathname.startsWith(item.path);
  };

  return (
    <div className="w-[280px] h-screen bg-white border-r-2 border-slate-200 flex flex-col p-6 sticky top-0 shrink-0 hidden md:flex">
      <div
        className="mb-10 text-3xl font-extrabold tracking-tight cursor-pointer select-none italic"
        onClick={() => router.push('/')}
      >
        <span className="text-[#0D1A63]">VOCA</span>
        <span className="text-[#F68048]">VIBE</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-[17px] transition-all duration-100 ${
                active
                  ? 'bg-blue-50 text-[#2845D6] border-2 border-blue-200 shadow-sm'
                  : 'text-[#5C6A9C] hover:bg-slate-100 border-2 border-transparent'
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t-2 border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=E8EBF5&color=2845D6`}
            className="w-12 h-12 rounded-full border-2 border-slate-200"
            alt="Avatar"
          />
          <div className="flex-1 overflow-hidden">
            <div className="font-bold text-[#0D1A63] truncate">{user?.user_metadata?.full_name || user?.email}</div>
            <div className="text-xs text-[#5C6A9C] capitalize">Học viên</div>
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
  );
}
