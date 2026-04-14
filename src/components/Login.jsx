import React from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('Error logging in:', error.message);
      alert('Đăng nhập thất bại: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-tertiary">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full text-center">
        <h1 className="text-4xl font-extrabold text-primary-green mb-2">LingoPlay</h1>
        <p className="text-text-secondary mb-8 font-medium">Đăng nhập để lưu tiến độ của bạn</p>
        
        <button 
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl hover:bg-slate-50 transition-all shadow-[0_4px_0_#E5E5E5] active:translate-y-1 active:shadow-none"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
          Tiếp tục với Google
        </button>
      </div>
    </div>
  );
}
