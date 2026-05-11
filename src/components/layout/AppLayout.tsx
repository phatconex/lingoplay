'use client';

import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import FeedbackBanner from '../FeedbackBanner';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto relative p-4 md:p-8">
        {children}
      </div>
      <FeedbackBanner />
    </div>
  );
}
