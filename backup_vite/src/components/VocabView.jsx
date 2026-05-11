import React, { useEffect, useState } from 'react';
import { useAppContext } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Target, Pencil, Zap, BookOpen, GraduationCap, ChevronLeft } from 'lucide-react';
import FlashcardViewer from './FlashcardViewer';

export default function VocabView() {
  const { appData, setAppData, setActiveScreen, activeSet } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);

  const fetchVocab = async () => {
    if (!activeSet) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('vocabulary_items')
      .select('*')
      .eq('set_id', activeSet.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching vocabulary:', error);
    } else {
      const mappedVocab = data.map(item => ({
        ...item,
        en: item.word,
        vi: item.meaning || '',
        enSentence: item.example_en || '',
        viSentence: item.example_vi || ''
      }));
      setAppData(prev => ({ ...prev, vocab: mappedVocab }));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!activeSet) {
      setActiveScreen('home');
      return;
    }
    fetchVocab();
  }, [activeSet, setActiveScreen]);

  const hasVocab = appData && appData.vocab && appData.vocab.length > 0;
  const canPlayMC = hasVocab && appData.vocab.length >= 4;

  if (!activeSet) return null;

  const MODES = [
    {
      id: 'learn',
      label: 'Học',
      desc: 'Lướt qua từng thẻ từ',
      color: 'bg-[#2845D6]',
      shadow: 'shadow-[0_4px_0_#0D1A63]',
      icon: <GraduationCap size={30} strokeWidth={2.5} color="white" />,
      screen: null, // handled separately - scrolls to flashcard
      enabled: hasVocab,
    },
    {
      id: 'mc',
      label: 'Trắc nghiệm',
      desc: canPlayMC ? '4 lựa chọn' : 'Cần ít nhất 4 từ',
      color: 'bg-[#58CC02]',
      shadow: 'shadow-[0_4px_0_#46A302]',
      icon: <Target size={30} strokeWidth={2.5} color="white" />,
      screen: 'mc-screen',
      enabled: canPlayMC,
    },
    {
      id: 'spelling',
      label: 'Chính tả',
      desc: 'Nghe & điền từ',
      color: 'bg-[#FFC800]',
      shadow: 'shadow-[0_4px_0_#D9AA00]',
      icon: <Pencil size={30} strokeWidth={2.5} color="white" />,
      screen: 'spelling-screen',
      enabled: hasVocab,
    },
    {
      id: 'rush',
      label: 'Thử thách',
      desc: 'Gõ từ đua với thời gian',
      color: 'bg-[#FF4B4B]',
      shadow: 'shadow-[0_4px_0_#D33D3D]',
      icon: <Zap size={30} strokeWidth={2.5} color="white" fill="white" />,
      screen: 'rush-screen',
      enabled: hasVocab,
    },
  ];

  const flashcardRef = React.useRef(null);

  const handleModeClick = (mode) => {
    if (!mode.enabled) return;
    if (mode.id === 'learn') {
      setShowFlashcards(true);
      setTimeout(() => {
        flashcardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }
    setActiveScreen(mode.screen);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col animate-fade-in p-4 md:p-8 pb-24 overflow-y-auto">

      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setActiveScreen('home')}
          className="p-2 rounded-xl text-slate-400 hover:text-[#2845D6] hover:bg-[#E8EBF5] transition-all"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-[#E8EBF5] p-3 rounded-2xl text-[#2845D6]">
            <BookOpen size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0D1A63] leading-tight">{activeSet.name}</h1>
            <p className="text-slate-400 font-bold text-sm mt-0.5">{appData?.vocab?.length || 0} thuật ngữ</p>
          </div>
        </div>
      </div>

      {/* 4 Mode Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {MODES.map(mode => (
          <div
            key={mode.id}
            onClick={() => handleModeClick(mode)}
            className={`
              ${mode.color} ${mode.shadow}
              rounded-[20px] p-5 flex flex-col items-center text-center gap-3
              transition-all duration-200
              ${mode.enabled
                ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-none'
                : 'opacity-50 grayscale cursor-not-allowed'
              }
            `}
          >
            <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center">
              {mode.icon}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base leading-tight">{mode.label}</h3>
              <p className="text-white/70 text-xs font-semibold mt-0.5">{mode.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Flashcard Section */}
      {showFlashcards && (
        <div ref={flashcardRef} className="scroll-mt-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#2845D6] rounded-full" />
              <h2 className="text-xl font-extrabold text-[#0D1A63]">Học Flashcard</h2>
            </div>
            <button 
              onClick={() => setShowFlashcards(false)}
              className="text-sm font-bold text-slate-400 hover:text-[#FF4B4B] transition-colors"
            >
              Đóng
            </button>
          </div>
          <FlashcardViewer words={appData?.vocab || []} loading={loading} />
        </div>
      )}

    </div>
  );
}
