'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/lib/store';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  const { user, authLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/' : ''
      }
    });

    if (error) {
      console.error('Error logging in:', error.message);
      alert('Đăng nhập thất bại: ' + error.message);
    }
  };

  if (authLoading || user) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] relative overflow-hidden font-sans text-[#0D1A63]">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2845D6]/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F68048]/5 rounded-full blur-[100px]" />

      {/* Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#0D1A63 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      />

      <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-[0_20px_50px_rgba(13,26,99,0.1)] max-w-sm w-full text-center relative z-10 border border-slate-100 animate-slide-up">
        <div className="bg-[#E8EBF5] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#2845D6] shadow-inner">
          <BookOpen size={40} strokeWidth={2.5} />
        </div>

        <h1 className="text-4xl font-black text-[#0D1A63] mb-3 tracking-tight italic">
          VOCA<span className="text-[#F68048]">VIBE</span>
        </h1>
        <p className="text-slate-400 mb-10 font-bold uppercase tracking-widest text-xs">
          Học từ vựng hiệu quả
        </p>

        <button
          onClick={handleGoogleLogin}
          className="group relative flex items-center justify-center gap-4 w-full bg-white border-2 border-slate-100 text-[#0D1A63] font-black py-4 px-6 rounded-2xl hover:border-[#2845D6] hover:bg-[#E8EBF5] transition-all shadow-sm active:translate-y-1"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-6 h-6 group-hover:scale-110 transition-transform"
          />
          Tiếp tục với Google
        </button>

        <p className="mt-10 text-slate-400 text-sm font-medium italic">
          Nhanh chóng · Đơn giản · Hiệu quả
        </p>
      </div>

      <div className="mt-8 text-slate-300 font-bold text-xs uppercase tracking-widest z-10">
        © 2024 VocaVibe · Học từ vựng mỗi ngày
      </div>
    </div>
  );
}
