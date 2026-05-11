'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { playSound, fireConfetti, speakWord } from '@/lib/utils';

interface Session {
  words: any[];
  currentIndex: number;
  totalWords: number;
}

export default function SpeakingPractice() {
  const router = useRouter();
  const params = useParams();
  const setId = params?.setId as string;
  const { appData, updateStreakAfterStudy } = useAppContext();
  
  const [session, setSession] = useState<Session | null>(null);
  const [flipped, setFlipped] = useState(false);

  const endSession = () => {
      updateStreakAfterStudy();
      fireConfetti();
      playSound('completed');
      router.push(`/set/${setId}`);
  };

  const handleAction = () => {
      if (!session) return;
      const currentWord = session.words[session.currentIndex];
      
      if (!flipped) {
          setFlipped(true);
          speakWord(currentWord.enSentence);
      } else {
          const nextIndex = session.currentIndex + 1;
          if (nextIndex >= session.words.length) {
              endSession();
          } else {
              setSession({ ...session, currentIndex: nextIndex });
              setFlipped(false);
          }
      }
  };

  useEffect(() => {
    const pool = appData.vocab.filter(w => w.enSentence && w.viSentence);
    if (pool.length === 0) return;
    
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSession({
      words: shuffled,
      currentIndex: 0,
      totalWords: shuffled.length
    });
  }, [appData.vocab]);

  useEffect(() => {
     if (typeof window === 'undefined') return;
     const handleKeydown = (e: KeyboardEvent) => {
         if (e.code === 'Space' && !flipped) {
             e.preventDefault();
             handleAction();
         } else if (e.code === 'Enter' && flipped) {
             e.preventDefault();
             handleAction();
         }
     };
     document.addEventListener('keydown', handleKeydown);
     return () => document.removeEventListener('keydown', handleKeydown);
  }, [flipped, session]);

  if (!session || !session.words[session.currentIndex]) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#0D1A63]">
          <h3 className="text-xl font-bold mb-2">Không có câu ví dụ</h3>
          <p className="text-slate-500">Vui lòng thêm câu ví dụ cho các từ vựng để có thể luyện tập Speaking.</p>
          <button className="mt-6 btn btn-outline" onClick={() => router.push(`/set/${setId}`)}>Quay lại</button>
      </div>
    );
  }

  const currentWord = session.words[session.currentIndex];
  const progressPct = (session.currentIndex / session.totalWords) * 100;

  return (
    <div className="flex flex-col flex-1 animate-fade-in text-[#0D1A63]">
      <div className="flex justify-between items-center mb-4">
          <button className="btn btn-outline py-2 px-4 text-sm" onClick={() => router.push(`/set/${setId}`)}>Quit</button>
          <div className="w-full h-4 bg-[#E8EBF5] rounded-full overflow-hidden my-4 flex-1 mx-4 !my-0">
              <div className="h-full bg-gradient-to-r from-[#1A2CA3] to-[#2845D6] transition-all duration-300 rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
      </div>

      <div 
        className="flex-1 flex flex-col justify-center text-center cursor-pointer my-6"
        onClick={handleAction}
      >
          <p className="font-bold uppercase text-[#5C6A9C] mb-6 tracking-wider">
              Dịch to câu này ra tiếng Anh
          </p>
          <div className="text-2xl text-[#0D1A63] leading-tight font-extrabold mb-6">
              {currentWord.viSentence}
          </div>

          <div style={{ visibility: flipped ? 'visible' : 'hidden', opacity: flipped ? 1 : 0, transition: 'opacity 0.3s', minHeight: '100px' }}>
              <div className="text-2xl text-[#2845D6] leading-tight mb-3 font-black">
                  {currentWord.enSentence}
              </div>
              <div className="text-base text-[#5C6A9C] bg-[#E8EBF5] px-4 py-2 rounded-xl inline-block">
                  <strong className="text-[#F68048]">{currentWord.en}</strong> : <span>{currentWord.vi}</span>
              </div>
          </div>
      </div>

      <div className="footer mt-auto flex flex-col gap-3 text-center p-0 border-none bg-transparent">
          <p className="text-[#5C6A9C] text-sm m-0">
              Nhấn <kbd className="bg-white border-2 border-slate-200 px-2 rounded text-slate-700 font-sans">Space</kbd> để hiện đáp án • Nhấn <kbd className="bg-white border-2 border-slate-200 px-2 rounded text-slate-700 font-sans">Enter</kbd> để tiếp tục
          </p>
          <button className="w-full py-5 font-black text-xl text-white bg-[#2845D6] rounded-2xl shadow-[0_6px_0_#0D1A63] active:translate-y-1 active:shadow-none transition-all" onClick={handleAction}>
              {flipped ? 'Tiếp theo' : 'Lật xem'}
          </button>
      </div>
    </div>
  );
}
