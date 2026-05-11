'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Volume2, RotateCcw, Shuffle, Loader2, ArrowLeft } from 'lucide-react';

interface FlashcardViewerProps {
  words: any[];
  loading?: boolean;
}

export default function FlashcardViewer({ words: initialWords, loading }: FlashcardViewerProps) {
  const router = useRouter();
  const params = useParams();
  const setId = params?.setId as string;
  
  const [words, setWords] = useState(initialWords || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);

  const touchStartX = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWords(initialWords || []);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setIsFinished(false);
  }, [initialWords]);

  useEffect(() => {
    if (typeof window !== 'undefined' && words && words[currentIndex] && !isFinished && !isFlipped) {
      const timer = setTimeout(() => {
        const u = new SpeechSynthesisUtterance(words[currentIndex].word);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isFinished, words, isFlipped]);

  const playCompletionSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const goTo = useCallback((newIndex: number, dir: 'left' | 'right') => {
    if (newIndex < 0 || newIndex >= words.length) return;
    setSlideDir(dir);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setSlideDir(null);
    }, 200);
  }, [words.length]);

  const handleNext = useCallback(() => {
    if (currentIndex === words.length - 1) {
      setIsFinished(true);
      playCompletionSound();
    } else {
      goTo(currentIndex + 1, 'left');
    }
  }, [currentIndex, words.length, goTo]);
  
  const handlePrev = useCallback(() => goTo(currentIndex - 1, 'right'), [currentIndex, goTo]);

  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(true);
    setTimeout(() => setIsShuffled(false), 1500);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && words[currentIndex]) {
      const u = new SpeechSynthesisUtterance(words[currentIndex].word);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped(f => !f);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  if (loading) {
    return (
      <div className="w-full h-[340px] md:h-[420px] bg-[#1A1D28] rounded-[32px] flex items-center justify-center">
        <Loader2 size={48} className="text-white animate-spin opacity-40" />
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="w-full h-[340px] md:h-[420px] bg-[#1A1D28] rounded-[32px] flex flex-col items-center justify-center text-white border-2 border-slate-700 p-8 text-center">
        <h3 className="text-2xl font-bold mb-3">Bộ từ vựng này rỗng!</h3>
        <p className="text-slate-400 mb-6 font-medium">Hãy thêm từ vựng qua mục "Chỉnh sửa từ vựng"</p>
        <button onClick={() => router.push('/')} className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all">
          <ArrowLeft size={20} /> Quay lại thư viện
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  const slideClass = slideDir === 'left'
    ? 'opacity-0 -translate-x-8'
    : slideDir === 'right'
    ? 'opacity-0 translate-x-8'
    : 'opacity-100 translate-x-0';

  if (isFinished) {
    return (
      <div className="w-full max-w-3xl animate-fade-in mx-auto mt-8 text-white">
        <div className="bg-[#0D1A63] rounded-[32px] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
            <div className="w-24 h-24 bg-[#F68048] rounded-full flex items-center justify-center mb-8 shadow-lg animate-bounce">
                <RotateCcw size={48} color="white" strokeWidth={3} />
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Tuyệt vời!</h2>
            <p className="text-blue-200 text-lg font-bold mb-10">Bạn đã hoàn thành toàn bộ {words.length} thẻ vựng!</p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button 
                    onClick={handleRestart}
                    className="flex-1 max-w-[240px] bg-white text-[#0D1A63] py-5 rounded-3xl font-black text-xl shadow-[0_6px_0_#2845D6] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                >
                    <RotateCcw size={24} strokeWidth={3} /> Học lại
                </button>
                <button 
                    onClick={handleShuffle}
                    className="flex-1 max-w-[240px] bg-[#F68048] text-white py-5 rounded-3xl font-black text-xl shadow-[0_6px_0_#E67038] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                >
                    <Shuffle size={24} strokeWidth={3} /> Trộn & Học
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center select-none pb-4 flex-1 animate-fade-in mt-4 text-[#0D1A63]">
      <div className="w-full max-w-3xl mb-8 flex items-center gap-6">
        {setId && (
          <button className="btn btn-outline py-2 px-4 text-sm shrink-0" onClick={() => router.push(`/set/${setId}`)}>
            Thoát
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-extrabold text-slate-400">
              {currentIndex + 1} <span className="font-medium text-slate-300">/ {words.length}</span>
            </span>
            <span className="text-sm font-bold text-[#2845D6]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2845D6] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div
        ref={cardRef}
        className="w-full max-w-3xl"
        style={{ perspective: '1200px' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          onClick={() => setIsFlipped(f => !f)}
          className="cursor-pointer"
          style={{
            position: 'relative',
            width: '100%',
            height: '340px',
          }}
        >
          {/* FRONT FACE */}
          <div
            className={`absolute inset-0 rounded-[28px] shadow-[0_8px_30px_rgba(13,26,99,0.12)] border-2 border-slate-100 bg-white flex flex-col items-center justify-center p-8 transition-all duration-200 ${slideClass}`}
            style={{
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              pointerEvents: isFlipped ? 'none' : 'auto',
              WebkitBackfaceVisibility: 'hidden',
              transitionProperty: 'transform, opacity, translate',
              transitionDuration: '0.5s, 0.2s, 0.2s'
            }}
          >
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-widest mb-6">Thuật ngữ</span>
            <h2 className="text-5xl md:text-6xl font-extrabold text-[#0D1A63] text-center leading-tight mb-4">{currentWord.word}</h2>
            {currentWord.part_of_speech && (
              <span className="text-sm bg-[#E8EBF5] text-[#2845D6] px-3 py-1 rounded-full font-bold italic uppercase tracking-wider mt-2">
                {currentWord.part_of_speech}
              </span>
            )}
            <button
              onClick={playAudio}
              className="absolute bottom-5 right-5 bg-[#E8EBF5] p-3 rounded-full text-[#2845D6] hover:bg-[#2845D6] hover:text-white transition-all shadow-sm"
            >
              <Volume2 size={22} />
            </button>
            <span className="absolute bottom-5 left-0 right-0 text-center text-xs text-slate-300 font-medium md:hidden">Chạm để lật thẻ</span>
          </div>

          {/* BACK FACE */}
          <div
            className={`absolute inset-0 rounded-[28px] shadow-[0_8px_30px_rgba(13,26,99,0.12)] border-2 border-[#2845D6]/20 bg-[#0D1A63] text-white flex flex-col p-8 md:p-12 overflow-y-auto transition-all duration-200 ${slideClass}`}
            style={{
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
              pointerEvents: isFlipped ? 'auto' : 'none',
              WebkitBackfaceVisibility: 'hidden',
              transitionProperty: 'transform, opacity, translate',
              transitionDuration: '0.5s, 0.2s, 0.2s'
            }}
            onClick={() => setIsFlipped(false)}
          >
            <span className="text-xs font-extrabold text-blue-300 uppercase tracking-widest mb-4">Định nghĩa</span>
            <h3 className="text-4xl md:text-5xl font-extrabold text-[#F68048] leading-tight mb-4">{currentWord.meaning}</h3>

            {(currentWord.example_en || currentWord.example_vi) && (
              <div className="mt-auto pt-4 border-t border-white/10">
                <span className="text-xs font-extrabold text-blue-300 uppercase tracking-widest mb-3 block">Ví dụ</span>
                {currentWord.example_en && <p className="text-base md:text-lg italic font-medium mb-2 leading-relaxed text-white/90">"{currentWord.example_en}"</p>}
                {currentWord.example_vi && <p className="text-sm text-blue-200 leading-relaxed">{currentWord.example_vi}</p>}
              </div>
            )}

            {currentWord.notes && (
              <div className={`mt-3 p-3 bg-white/5 border border-white/10 rounded-xl text-xs md:text-sm text-white/80 italic font-medium relative ${(!currentWord.example_en && !currentWord.example_vi) ? 'mt-auto' : ''}`}>
                <span className="absolute top-0 left-0 -translate-y-1/2 translate-x-2 bg-[#0D1A63] px-2 text-[10px] font-black text-blue-400 border border-white/10 rounded-full uppercase tracking-wider">Ghi chú</span>
                {currentWord.notes}
              </div>
            )}

            <button onClick={playAudio} className="absolute bottom-5 right-5 bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all">
              <Volume2 size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-3xl mt-6 flex items-center justify-between gap-4">
        <button
          onClick={handleShuffle}
          title="Xáo trộn"
          className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${isShuffled ? 'bg-[#2845D6] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <Shuffle size={18} />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-500 hover:border-[#2845D6] hover:text-[#2845D6] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          <div className="text-center min-w-[60px]">
            <span className="text-lg font-extrabold text-[#0D1A63]">{currentIndex + 1}</span>
            <span className="text-slate-400 font-bold"> / {words.length}</span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === words.length - 1}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-500 hover:border-[#2845D6] hover:text-[#2845D6] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
          >
            <ChevronRight size={28} strokeWidth={2.5} />
          </button>
        </div>

        <button
          onClick={handleRestart}
          title="Học lại từ đầu"
          className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <p className="hidden md:block text-xs text-slate-300 font-medium text-center mt-4">
        Phím <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-sans">←</kbd>
        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-sans mx-1">→</kbd>
        để chuyển bài · <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-sans">Space</kbd> để lật thẻ
      </p>
    </div>
  );
}
