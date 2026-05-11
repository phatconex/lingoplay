'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import AppLayout from '@/components/layout/AppLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, authLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center animate-pulse">
          <div className="text-5xl font-black text-[#0D1A63] italic mb-3 tracking-tight">
            VOCA<span className="text-[#F68048]">VIBE</span>
          </div>
          <div className="text-slate-400 font-bold text-sm uppercase tracking-widest">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Or loading placeholder, router will push to login
  }

  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
