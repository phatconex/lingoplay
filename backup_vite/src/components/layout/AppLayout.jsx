import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import FeedbackBanner from '../FeedbackBanner';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden text-text-primary">
      <Sidebar />
      <div className="flex-1 overflow-y-auto relative p-4 md:p-8">
        <Outlet />
      </div>
      <FeedbackBanner />
    </div>
  );
}
