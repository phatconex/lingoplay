'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { playSound, speakWord } from '@/lib/utils';

interface Session {
  words: any[];
  currentIndex: number;
  totalWords: number;
  correctAnswers: number;
  wrongWordsThisSession: any[];
}

export default function Spelling() {
  const router = useRouter();
  const params = useParams();
  const setId = params?.setId as string;
  const { appData, updateStreakAfterStudy, updateWordStats, markGameCompleted } = useAppContext();
  
  const [session, setSession] = useState<Session | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputState, setInputState] = useState<'correct' | 'wrong' | ''>('');
  const lockRef = useRef(false);

  useEffect(() => {
    if (session || appData.vocab.length === 0) return;
    
    const pool = [...appData.vocab].sort(() => Math.random() - 0.5);
    setSession({
      words: pool,
      currentIndex: 0,
      totalWords: pool.length,
      correctAnswers: 0,
      wrongWordsThisSession: []
    });
  }, [appData.vocab, session]);

  useEffect(() => {
    setTimeout(() => {
      const input = document.querySelector('.spell-input-field') as HTMLInputElement;
      input?.focus();
    }, 100);
  }, [session?.currentIndex]);

  const endSession = (finalSession: Session) => {
      updateStreakAfterStudy();
      if (setId) {
        markGameCompleted(setId, 'spelling');
      }
      if (finalSession.wrongWordsThisSession.length === 0) {
         playSound('completed');
      }
      router.push(`/set/${setId}`);
  };

  const checkSpelling = () => {
    if (lockRef.current || !session) return;
    lockRef.current = true;
    
    const currentWord = session.words[session.currentIndex];
    const correctAns = currentWord.en.toLowerCase();
    const userAns = inputValue.trim().toLowerCase();

    speakWord(currentWord.en);

    if (userAns === correctAns) {
        setInputState('correct');
        playSound('success');
        
        const newSession = { ...session, correctAnswers: session.correctAnswers + 1 };
        
        setTimeout(() => {
            const nextIndex = session.currentIndex + 1;
            if (nextIndex >= session.words.length) {
                endSession(newSession);
            } else {
                newSession.currentIndex = nextIndex;
                setSession(newSession);
                setInputValue('');
                setInputState('');
                lockRef.current = false;
            }
        }, 800);
    } else {
        setInputState('wrong');
        playSound('wrong');
        updateWordStats(currentWord.id, false);
        
        const newWords = [...session.words];
        const insertIndex = Math.min(session.currentIndex + 3, newWords.length);
        newWords.splice(insertIndex, 0, { ...currentWord, isRetry: true });
        
        const newSession = { ...session, words: newWords, wrongWordsThisSession: [...session.wrongWordsThisSession, currentWord] };

        setTimeout(() => {
            const nextIndex = session.currentIndex + 1;
            if (nextIndex >= newSession.words.length) {
                endSession(newSession);
            } else {
                newSession.currentIndex = nextIndex;
                setSession(newSession);
                setInputValue('');
                setInputState('');
                lockRef.current = false;
            }
        }, 2200);
    }
  };

  if (!session || !session.words[session.currentIndex]) return null;

  const currentWord = session.words[session.currentIndex];
  const progressPct = (session.correctAnswers / session.totalWords) * 100;

  const inputBg = inputState === 'correct'
    ? 'border-green-400 bg-green-50 text-[#0D1A63]'
    : inputState === 'wrong'
      ? 'border-red-400 bg-red-50 text-[#0D1A63]'
      : 'border-slate-200 bg-white text-[#0D1A63] focus:border-[#2845D6]';

  return (
    <div className="flex flex-col flex-1 animate-fade-in text-[#0D1A63]">
      <div className="flex justify-between items-center mb-4">
          <button className="btn btn-outline py-2 px-4 text-sm" onClick={() => router.push(`/set/${setId}`)}>Quit</button>
          <div className="w-full h-4 bg-[#E8EBF5] rounded-full overflow-hidden my-4 flex-1 mx-4 !my-0">
              <div className="h-full bg-gradient-to-r from-[#1A2CA3] to-[#2845D6] transition-all duration-300 rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
      </div>

      <div className="flex-1 flex flex-col justify-center text-center my-8" style={{ flex: 0 }}>
          <p className="font-bold uppercase tracking-wider mb-2" style={{ color: currentWord.isRetry ? '#F68048' : '#5C6A9C' }}>
              {currentWord.isRetry ? '🔄 LÀM LẠI NÀO' : 'Dịch từ này'}
          </p>
          <div className="text-5xl font-extrabold text-[#0D1A63] flex justify-center items-center gap-2 mb-2" style={{ fontSize: '42px' }}>{currentWord.vi}</div>
          
          {inputState === 'wrong' && (
            <p className="text-[#FF4B4B] font-bold text-lg mb-0 mt-2 animate-fade-in flex items-center justify-center gap-2">
              Đáp án đúng: <span className="font-black text-2xl bg-red-50 px-4 py-1 rounded-2xl border border-red-100">{currentWord.en}</span>
            </p>
          )}
          {inputState === 'correct' && (
            <p className="text-[#58CC02] font-bold text-lg mb-0 mt-2 animate-fade-in flex items-center justify-center gap-2">
              ✅ Chính xác!
            </p>
          )}
      </div>

      <div className="w-full max-w-xl mx-auto flex flex-col gap-4 mt-8 mb-auto px-4">
          <input 
            type="text" 
            className={`spell-input-field w-full px-6 py-4 text-2xl border-2 rounded-2xl text-center font-bold outline-none shadow-sm transition-colors ${inputBg}`} 
            placeholder="Nhập bằng tiếng Anh..." 
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
               if(e.key === 'Enter') checkSpelling();
            }}
            autoFocus
            disabled={!!inputState}
          />
          <button 
             className="w-full bg-[#2845D6] hover:bg-[#1A2CA3] text-white px-6 py-4 rounded-2xl font-bold text-xl transition-all shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none disabled:opacity-50" 
             onClick={checkSpelling}
             disabled={!!inputState}
          >
             KIỂM TRA
          </button>
      </div>
    </div>
  );
}
