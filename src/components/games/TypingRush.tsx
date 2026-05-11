'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { playSound } from '@/lib/utils';

const PET_STAGES = [
    { name: '🥚 Trứng', emoji: '🥚', threshold: 0 },
    { name: '🐣 Baby', emoji: '🐣', threshold: 3 },
    { name: '🐥 Teenager', emoji: '🐥', threshold: 8 },
    { name: '🦅 Adult', emoji: '🦅', threshold: 16 },
    { name: '🐉 Legendary', emoji: '🐉', threshold: 28 }
];

export default function TypingRush() {
  const router = useRouter();
  const params = useParams();
  const setId = params?.setId as string;
  const { appData } = useAppContext();
  
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [inputDisabled, setInputDisabled] = useState(false);
  const [inputState, setInputState] = useState<'correct' | ''>('');
  const [timeLeftPct, setTimeLeftPct] = useState(100);
  
  const [petStage, setPetStage] = useState(0);
  const [petJump, setPetJump] = useState(false);
  const [petEvolve, setPetEvolve] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const remainingTimeRaw = useRef(0);
  const totalTimeRef = useRef(0);

  const endSession = () => {
      playSound('wrong');
      setIsGameOver(true);
      setInputDisabled(true);
  };

  const nextWord = () => {
    if (!appData.vocab.length) return;
    const wordIndex = Math.floor(Math.random() * appData.vocab.length);
    const word = appData.vocab[wordIndex];
    setCurrentWord(word);
    setInputValue('');
    setInputState('');
    setInputDisabled(false);
    
    setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
    }, 10);

    const wordLen = word.en.length;
    const timeTotal = 1500 + (wordLen * 600);
    totalTimeRef.current = timeTotal;
    remainingTimeRaw.current = timeTotal;
    setTimeLeftPct(100);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
        remainingTimeRaw.current -= 50;
        const pct = Math.max(0, (remainingTimeRaw.current / totalTimeRef.current) * 100);
        setTimeLeftPct(pct);
        
        if (remainingTimeRaw.current <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            endSession();
        }
    }, 50);
  };

  const restartGame = () => {
      setScore(0);
      setCorrectAnswers(0);
      setPetStage(0);
      setIsGameOver(false);
      nextWord();
  };

  useEffect(() => {
    if (appData.vocab.length === 0) return;
    restartGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appData.vocab]);

  const updatePetUI = (answers: number) => {
      let newStage = 0;
      for(let i=0; i<PET_STAGES.length; i++) {
          if (answers >= PET_STAGES[i].threshold) {
              newStage = i;
          }
      }
      
      setPetJump(true);
      setTimeout(() => setPetJump(false), 300);

      if (newStage > petStage) {
          setPetStage(newStage);
          setPetEvolve(true);
          playSound('completed');
          setTimeout(() => setPetEvolve(false), 1000);
      }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (inputDisabled || !currentWord) return;
      const val = e.target.value;
      setInputValue(val);

      if (val.toLowerCase().trim() === currentWord.en.toLowerCase()) {
          setInputDisabled(true);
          if (timerRef.current) clearInterval(timerRef.current);
          setInputState('correct');
          playSound('success');
          
          setScore(s => s + 10);
          setCorrectAnswers(c => {
              const newC = c + 1;
              updatePetUI(newC);
              return newC;
          });

          setTimeout(() => {
              nextWord();
          }, 300);
      }
  };

  if (!currentWord) return null;

  const stageInfo = PET_STAGES[petStage];
  const nextStageInfo = PET_STAGES[petStage + 1];
  let xpPct = 100;
  if (nextStageInfo) {
      const xpInCurrentStage = correctAnswers - stageInfo.threshold;
      const xpNeeded = nextStageInfo.threshold - stageInfo.threshold;
      xpPct = (xpInCurrentStage / xpNeeded) * 100;
  }
  
  const petPosition = Math.min(90, (correctAnswers / 28) * 90);

  const handleQuit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.push(`/set/${setId}`);
  };

  if (isGameOver) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 animate-fade-in w-full text-center px-4 text-[#0D1A63]">
            <div className="text-[100px] mb-4">💀</div>
            <h2 className="text-4xl font-extrabold text-[#D33D3D] mb-2 uppercase tracking-wide">Game Over</h2>
            <p className="text-xl font-bold mb-8">Điểm của bạn: <span className="text-2xl text-[#F68048]">{score}</span></p>
            
            <div className="flex gap-4">
                <button 
                  onClick={handleQuit}
                  className="px-8 py-4 rounded-2xl font-bold text-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                >
                  Thoát ra
                </button>
                <button 
                  onClick={restartGame}
                  className="px-10 py-4 rounded-2xl font-bold text-lg bg-[#2845D6] hover:bg-[#1A2CA3] text-white shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none transition-all"
                >
                  Chơi lại ngay 🔥
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col flex-1 animate-fade-in text-[#0D1A63]">
      <div className="flex justify-between items-center mb-4">
          <button className="btn btn-outline py-2 px-4 text-sm font-bold border-2 border-slate-200 text-slate-500 rounded-xl" onClick={handleQuit}>Thoát</button>
          
          <div className="flex-1 mx-4 text-center max-w-sm">
              <span className="font-extrabold text-[#F68048] text-sm tracking-wider uppercase">STAGE: {stageInfo.name}</span>
              <div className="w-full h-3 bg-[#E8EBF5] border-none rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-gradient-to-r from-[#F68048] to-[#FF9B6A] rounded-full transition-none" style={{ width: `${xpPct}%` }}></div>
              </div>
          </div>
          
          <div className="text-2xl font-extrabold text-[#2845D6]">Score: {score}</div>
      </div>

      <div className="relative mt-[52px] h-[80px]">
          <div 
            className={`absolute bottom-0 text-[56px] leading-none z-[2] origin-bottom transition-all duration-500 ease-out ${petJump ? 'pet-jumping' : ''} ${petEvolve ? 'pet-evolving' : ''}`}
            style={{ left: `${petPosition}%` }}
          >
              {stageInfo.emoji}
          </div>
      </div>

      <div className="w-full h-3 bg-[#FFDFE0] rounded-full overflow-hidden mt-0 mb-4 shadow-inner">
          <div className="h-full bg-[#D33D3D] rounded-full" style={{ width: `${timeLeftPct}%`, transition: 'width 0.05s linear' }}></div>
      </div>

      <div className="text-center my-8 flex-1 flex flex-col justify-center" style={{ flex: 0, marginTop: '24px' }}>
          <p className="font-bold uppercase text-slate-400 mb-2 tracking-wider">Nhanh lên! Dịch từ này</p>
          <div className="text-5xl font-extrabold text-[#0D1A63] flex justify-center items-center gap-2 mb-2 text-[48px]">{currentWord.vi}</div>
      </div>

      <div className="w-full max-w-xl mx-auto flex flex-col mt-4">
          <input 
            ref={inputRef}
            type="text" 
            className={`w-full px-6 py-4 text-3xl border-2 border-slate-200 focus:border-[#2845D6] rounded-2xl text-center font-bold outline-none shadow-sm transition-colors ${inputState === 'correct' ? 'border-green-400 bg-green-50 text-[#0D1A63]' : 'text-[#0D1A63]'}`} 
            placeholder="Gõ ở đây..." 
            autoComplete="off"
            value={inputValue}
            onChange={handleInput}
            disabled={inputDisabled}
            autoFocus
          />
      </div>
    </div>
  );
}
