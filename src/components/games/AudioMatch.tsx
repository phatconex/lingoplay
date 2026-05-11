'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { playSound, speakWord } from '@/lib/utils';

interface Bubble {
  opt: any;
  x: number;
  y: number;
  vx: number;
  vy: number;
  status: 'correct' | 'wrong' | '';
}

interface Session {
  words: any[];
  currentIndex: number;
  correctAnswers: number;
  totalWords: number;
}

export default function AudioMatch() {
  const router = useRouter();
  const params = useParams();
  const setId = params?.setId as string;
  const { appData, updateStreakAfterStudy, updateWordStats, updateSetLastStudied, activeSet } = useAppContext();
  
  const [session, setSession] = useState<Session | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  const endSession = () => {
      updateStreakAfterStudy();
      if (activeSet?.id) {
        updateSetLastStudied(activeSet.id);
      }
      playSound('completed');
      router.push(`/set/${setId}`);
  };

  const startQuestion = (words: any[], currentIndex: number, correctAnswers: number, totalWords: number) => {
    if (currentIndex >= words.length) {
      endSession();
      return;
    }

    const currentWord = words[currentIndex];
    
    speakWord(currentWord.en);

    const options = [currentWord];
    const others = [...appData.vocab].filter(v => v.id !== currentWord.id).sort(() => Math.random() - 0.5);
    for(let i=0; i<4 && i<others.length; i++) options.push(others[i]);
    options.sort(() => Math.random() - 0.5);

    const initialBubbles = options.map(opt => ({
       opt,
       x: Math.random() * 200,
       y: Math.random() * 100,
       vx: (Math.random() - 0.5) * 2,
       vy: (Math.random() - 0.5) * 2,
       status: '' as const
    }));

    setSession({
      words,
      currentIndex,
      correctAnswers,
      totalWords
    });
    setBubbles(initialBubbles);
  };

  useEffect(() => {
    if (session || appData.vocab.length < 5) return;
    
    const pool = [...appData.vocab].sort(() => Math.random() - 0.5);
    startQuestion(pool, 0, 0, pool.length);
  }, [appData.vocab, session]);

  useEffect(() => {
     if (!session || bubbles.length === 0 || !containerRef.current) return;
     
     const animate = () => {
         const container = containerRef.current;
         if (!container) return;
         const w = container.clientWidth;
         const h = container.clientHeight;
         
         setBubbles(prevBubbles => {
             return prevBubbles.map((b) => {
                 const bubbleW = 100;
                 const bubbleH = 40;
                 let newX = b.x + b.vx;
                 let newY = b.y + b.vy;
                 let newVx = b.vx;
                 let newVy = b.vy;

                 if (newX <= 0 || newX + bubbleW >= w) newVx *= -1;
                 if (newY <= 0 || newY + bubbleH >= h) newVy *= -1;

                 newX = Math.max(0, Math.min(newX, w - bubbleW));
                 newY = Math.max(0, Math.min(newY, h - bubbleH));

                 return { ...b, x: newX, y: newY, vx: newVx, vy: newVy };
             });
         });

         animationFrameId.current = requestAnimationFrame(animate);
     };

     if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
     animationFrameId.current = requestAnimationFrame(animate);

     return () => {
       if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
     };
  }, [session]);

  const handleBubbleClick = (index: number, bubble: Bubble) => {
     if (!session) return;
     const currentWord = session.words[session.currentIndex];
     if (bubble.opt.id === currentWord.id) {
         playSound('success');
         if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
         
         setBubbles(prev => {
            const next = [...prev];
            next[index].status = 'correct';
            return next;
         });

         setTimeout(() => {
             startQuestion(session.words, session.currentIndex + 1, session.correctAnswers + 1, session.totalWords);
         }, 1000);
     } else {
         playSound('wrong');
         updateWordStats(currentWord.id, false);
         
         setBubbles(prev => {
            const next = [...prev];
            next[index].status = 'wrong';
            return next;
         });

         setTimeout(() => {
             setBubbles(prev => {
                const next = [...prev];
                if(next[index]) next[index].status = '';
                return next;
             });
         }, 500);
     }
  };

  if (!session || !session.words[session.currentIndex]) return null;

  const currentWord = session.words[session.currentIndex];
  const progressPct = (session.correctAnswers / session.totalWords) * 100;

  return (
    <div className="flex flex-col flex-1 animate-fade-in text-[#0D1A63]">
      <div className="flex justify-between items-center mb-4">
          <button className="btn btn-outline py-2 px-4 text-sm" onClick={() => router.push(`/set/${setId}`)}>Quit</button>
          <div className="w-full h-4 bg-[#E8EBF5] rounded-full overflow-hidden my-4 flex-1 mx-4 !my-0">
              <div className="h-full bg-gradient-to-r from-[#1A2CA3] to-[#2845D6] transition-all duration-300 rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
      </div>

      <div className="text-center mt-4">
          <button 
             className="bg-[#1A2CA3] text-white rounded-full w-16 h-16 text-2xl flex items-center justify-center mx-auto hover:bg-[#2845D6] transition-all"
             onClick={() => speakWord(currentWord.en)}
          >
              🔊
          </button>
          <p className="mt-2 font-bold text-[#5C6A9C]">Chọn nghĩa chính xác bằng cách bấm bóng!</p>
      </div>

      <div className="relative h-[400px] w-full max-w-3xl mx-auto border-2 border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-sm mt-8" ref={containerRef}>
          {bubbles.map((b, i) => (
             <div
                key={i}
                className={`absolute px-5 py-3 bg-white border-2 border-[#1A2CA3] rounded-full font-bold cursor-pointer shadow-sm whitespace-nowrap select-none floating-bubble ${b.status === 'correct' ? 'border-[#2845D6] bg-[#2845D6] text-white scale-110' : b.status === 'wrong' ? 'border-[#FF4B4B] text-[#FF4B4B] animate-shake' : 'text-[#0D1A63]'}`}
                style={{ left: b.x + 'px', top: b.y + 'px', transition: 'transform 0.2s, background-color 0.2s' }}
                onClick={() => handleBubbleClick(i, b)}
             >
                {b.opt.vi}
             </div>
          ))}
      </div>
    </div>
  );
}
