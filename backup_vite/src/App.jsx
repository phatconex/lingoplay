import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from './lib/store';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import VocabDetailPage from './pages/VocabDetailPage';
import PracticePage from './pages/PracticePage';
import ReviewPage from './pages/ReviewPage';

function AuthGate() {
  const { user, authLoading } = useAppContext();

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

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AuthGate />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'review', element: <ReviewPage /> },
          { path: 'set/:setId', element: <VocabDetailPage /> },
          { path: 'set/:setId/practice', element: <PracticePage /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
