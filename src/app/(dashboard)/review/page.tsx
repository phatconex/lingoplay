'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { playSound, speakWord } from '@/lib/utils';
import { ChevronLeft, Loader2, Trophy, RefreshCw } from 'lucide-react';

const POOL_SIZE = 50;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateOptions(word: any, pool: any[]) {
  const distractors = shuffle(pool.filter(w => w.id !== word.id)).slice(0, 3);
  return shuffle([word, ...distractors]);
}

interface QuestionProps {
  word: any;
  pool?: any[];
  onCorrect: () => void;
  onWrong: () => void;
}

function MCQuestion({ word, pool, onCorrect, onWrong }: QuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [, setCorrect] = useState<string | null>(null);
  const optionsRef = useRef<any[]>([]);
  
  if (optionsRef.current.length === 0 && pool) {
    optionsRef.current = generateOptions(word, pool);
  }
  const locked = useRef(false);

  const handle = (opt: any) => {
    if (locked.current) return;
    locked.current = true;
    setSelected(opt.id);
    setCorrect(word.id);
    if (opt.id === word.id) {
      playSound('success');
      setTimeout(() => onCorrect(), 900);
    } else {
      playSound('wrong');
      setTimeout(() => onWrong(), 1400);
    }
  };

  return (
    <div className="flex flex-col flex-1 animate-fade-in text-[#0D1A63]">
      <p className="font-bold uppercase tracking-widest text-[#5C6A9C] text-sm mb-2 text-center">🎯 Trắc nghiệm</p>
      <div className="text-4xl font-extrabold text-[#0D1A63] text-center mb-10">{word.en}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
        {optionsRef.current.map((opt, i) => {
          let extra = 'bg-white border-slate-200 text-[#0D1A63] shadow-[0_4px_0_#DDE2F0] hover:border-[#2845D6] hover:-translate-y-1';
          if (selected) {
            if (opt.id === word.id) {
              extra = 'bg-green-100 border-green-400 text-[#0D1A63] shadow-[0_4px_0_#86EFAC]';
            } else if (opt.id === selected) {
              extra = 'bg-red-100 border-red-400 text-[#0D1A63] shadow-[0_4px_0_#FCA5A5]';
            } else {
              extra = 'bg-white border-slate-200 text-slate-400 opacity-50';
            }
          }
          return (
            <button
              key={opt.id}
              onClick={() => handle(opt)}
              className={`relative flex items-center border-2 rounded-[20px] p-5 font-bold text-lg transition-all ${extra}`}
            >
              <div className="absolute left-4 w-7 h-7 rounded-xl bg-black/5 flex items-center justify-center text-sm font-extrabold text-slate-400">{i + 1}</div>
              <span className="flex-1 text-center pr-7">{opt.vi}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpellingQuestion({ word, onCorrect, onWrong }: QuestionProps) {
  const [value, setValue] = useState('');
  const [state, setState] = useState<'correct' | 'wrong' | ''>('');
  const locked = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [word]);

  const check = () => {
    if (locked.current) return;
    locked.current = true;
    speakWord(word.en);
    if (value.trim().toLowerCase() === word.en.toLowerCase()) {
      setState('correct');
      playSound('success');
      setTimeout(() => onCorrect(), 700);
    } else {
      setState('wrong');
      playSound('wrong');
      setTimeout(() => onWrong(), 1800);
    }
  };

  const inputBg = state === 'correct'
    ? 'border-green-400 bg-green-50 text-[#0D1A63]'
    : state === 'wrong'
      ? 'border-red-400 bg-red-50 text-[#0D1A63]'
      : 'border-slate-200 bg-white text-[#0D1A63] focus:border-[#2845D6]';

  return (
    <div className="flex flex-col flex-1 animate-fade-in items-center text-[#0D1A63]">
      <p className="font-bold uppercase tracking-widest text-[#5C6A9C] text-sm mb-2 text-center">📝 Chép chính tả</p>
      <div className="text-4xl font-extrabold text-[#0D1A63] text-center mb-3">{word.vi}</div>
      {state === 'wrong' && (
        <p className="text-[#FF4B4B] font-bold text-lg mb-3 animate-fade-in">
          Đáp án đúng: <span className="font-black text-2xl bg-red-50 px-3 py-1 rounded-xl">{word.en}</span>
        </p>
      )}
      {state === 'correct' && (
        <p className="text-[#58CC02] font-bold text-lg mb-3 animate-fade-in">✅ Chính xác!</p>
      )}
      <div className="w-full max-w-xl flex flex-col gap-3 mt-4">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          className={`w-full px-6 py-4 text-2xl border-2 rounded-2xl text-center font-bold outline-none shadow-sm transition-colors ${inputBg}`}
          placeholder="Gõ từ tiếng Anh..."
          autoComplete="off"
          disabled={!!state}
        />
        <button
          onClick={check}
          disabled={!!state}
          className="w-full bg-[#2845D6] hover:bg-[#1A2CA3] text-white py-4 rounded-2xl font-bold text-xl transition-all shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none disabled:opacity-50"
        >
          Kiểm tra
        </button>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const { user } = useAppContext();

  const [pool, setPool] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<'mc' | 'spelling'>('mc');
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const loadPool = async () => {
    if (!user?.id) return;
    setLoading(true);
    
    const { data: setsData } = await supabase
      .from('vocabulary_sets')
      .select('id')
      .eq('user_id', user.id);

    if (!setsData || setsData.length === 0) { setLoading(false); return; }

    const setIds = setsData.map(s => s.id);
    const { data: items } = await supabase
      .from('vocabulary_items')
      .select('id, word, meaning, set_id')
      .in('set_id', setIds);

    if (!items || items.length === 0) { setLoading(false); return; }

    const mapped = items.map(it => ({ id: it.id, en: it.word, vi: it.meaning || '', set_id: it.set_id }));
    const picked = shuffle(mapped).slice(0, POOL_SIZE);

    setPool(mapped);
    setQueue(shuffle(picked));
    setIndex(0);
    setMode('mc');
    setCorrectCount(0);
    setDone(false);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadPool();
  }, [user]);

  const advance = (wasCorrect: boolean) => {
    if (wasCorrect) setCorrectCount(c => c + 1);
    const next = index + 1;
    if (next >= queue.length) {
      setDone(true);
    } else {
      setIndex(next);
      setMode(m => m === 'mc' ? 'spelling' : 'mc');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#2845D6]" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-8 text-[#0D1A63]">
        <div className="text-6xl">📚</div>
        <h2 className="text-2xl font-extrabold">Chưa có từ vựng nào</h2>
        <p className="text-slate-500 font-semibold">Hãy thêm từ vựng vào các bộ từ trước nhé!</p>
        <button onClick={() => router.push('/')} className="mt-4 px-8 py-3 bg-[#2845D6] text-white font-bold rounded-2xl shadow-[0_4px_0_#0D1A63] hover:bg-[#1A2CA3] transition-all">
          Về trang chủ
        </button>
      </div>
    );
  }

  const progressPct = Math.round((index / queue.length) * 100);
  const word = queue[index];

  if (done) {
    const pct = Math.round((correctCount / queue.length) * 100);
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-center px-8 animate-fade-in text-[#0D1A63]">
        <Trophy size={72} className="text-yellow-400" />
        <h2 className="text-4xl font-extrabold">Ôn tập hoàn thành! 🎉</h2>
        <p className="text-xl font-bold text-slate-600">
          Bạn trả lời đúng <span className="text-[#58CC02] font-black text-3xl">{correctCount}</span> / {queue.length} câu
          <span className="ml-2 text-[#F68048] font-black">({pct}%)</span>
        </p>
        <div className="flex gap-4 mt-2">
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all">
            <ChevronLeft size={18} className="inline mr-1" />Về trang chủ
          </button>
          <button onClick={loadPool} className="px-8 py-3 bg-[#2845D6] hover:bg-[#1A2CA3] text-white font-bold rounded-2xl shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none transition-all">
            <RefreshCw size={18} className="inline mr-2" />Ôn tập lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col animate-fade-in p-4 md:p-8 h-full text-[#0D1A63]">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/')} className="p-2 rounded-xl text-slate-400 hover:text-[#2845D6] hover:bg-[#E8EBF5] transition-all">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
            <span>Ôn tập tổng hợp</span>
            <span>{index + 1} / {queue.length}</span>
          </div>
          <div className="w-full h-3 bg-[#E8EBF5] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2845D6] to-[#58CC02] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="text-sm font-extrabold text-[#58CC02] bg-green-50 border border-green-200 px-3 py-1 rounded-xl">
          ✅ {correctCount}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {mode === 'mc' ? (
          <MCQuestion
            key={`mc-${index}`}
            word={word}
            pool={pool}
            onCorrect={() => advance(true)}
            onWrong={() => advance(false)}
          />
        ) : (
          <SpellingQuestion
            key={`sp-${index}`}
            word={word}
            onCorrect={() => advance(true)}
            onWrong={() => advance(false)}
          />
        )}
      </div>
    </div>
  );
}
