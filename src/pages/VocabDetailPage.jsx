import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../lib/store';
import { Target, Pencil, Zap, BookOpen, GraduationCap, ChevronLeft, Loader2, Clock, FileText, X } from 'lucide-react';
import ManageWordsModal from '../components/ManageWordsModal';

const MODES = [
  {
    id: 'mc',
    label: 'Trắc nghiệm',
    desc: '4 lựa chọn',
    descDisabled: 'Cần ít nhất 4 từ',
    color: 'bg-[#58CC02]',
    shadow: 'shadow-[0_4px_0_#46A302]',
    icon: <Target size={30} strokeWidth={2.5} color="white" />,
    minWords: 4,
  },
  {
    id: 'spelling',
    label: 'Chính tả',
    desc: 'Nghe & điền từ',
    descDisabled: 'Cần ít nhất 1 từ',
    color: 'bg-[#FFC800]',
    shadow: 'shadow-[0_4px_0_#D9AA00]',
    icon: <Pencil size={30} strokeWidth={2.5} color="white" />,
    minWords: 1,
  },
  {
    id: 'rush',
    label: 'Thử thách',
    desc: 'Gõ từ đua với thời gian',
    descDisabled: 'Cần ít nhất 1 từ',
    color: 'bg-[#FF4B4B]',
    shadow: 'shadow-[0_4px_0_#D33D3D]',
    icon: <Zap size={30} strokeWidth={2.5} color="white" fill="white" />,
    minWords: 1,
  },
  {
    id: 'reading',
    label: 'Đọc hiểu',
    desc: 'Điền từ vào bài viết AI',
    descDisabled: 'Cần ít nhất 4 từ',
    color: 'bg-[#06B6D4]',
    shadow: 'shadow-[0_4px_0_#0891B2]',
    icon: <FileText size={30} strokeWidth={2.5} color="white" />,
    minWords: 4,
  },
];

export default function VocabDetailPage() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { setAppData, setActiveSet } = useAppContext();

  const [set, setSet] = useState(null);
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManage, setShowManage] = useState(false);
  const [showReadingModal, setShowReadingModal] = useState(false);

  useEffect(() => {
    fetchSetAndVocab();
  }, [setId]);

  const fetchSetAndVocab = async () => {
    setLoading(true);

    // Fetch set details
    const { data: setData, error: setError } = await supabase
      .from('vocabulary_sets')
      .select('*')
      .eq('id', setId)
      .single();

    if (setError || !setData) {
      console.error('Set not found:', setError);
      navigate('/');
      return;
    }

    setSet(setData);
    setActiveSet(setData);

    // Fetch vocabulary
    const { data: vocabData } = await supabase
      .from('vocabulary_items')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: true });

    const mappedVocab = (vocabData || []).map(item => ({
      ...item,
      en: item.word,
      vi: item.meaning || '',
      enSentence: item.example_en || '',
      viSentence: item.example_vi || '',
    }));

    setVocab(mappedVocab);
    setAppData(prev => ({ ...prev, vocab: mappedVocab }));
    setLoading(false);
  };

  const handleModeClick = (mode) => {
    const count = vocab.length;
    if (count < mode.minWords) return;
    if (mode.id === 'reading') {
      setShowReadingModal(true);
      return;
    }
    navigate(`/set/${setId}/practice?mode=${mode.id}`);
  };

  const startReading = (level) => {
    setShowReadingModal(false);
    navigate(`/set/${setId}/practice?mode=reading&level=${level}`);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#2845D6]" />
      </div>
    );
  }

  const hasVocab = vocab.length > 0;

  const allModes = [
    {
      id: 'learn',
      label: 'Học',
      desc: 'Lướt qua từng thẻ từ',
      descDisabled: 'Cần ít nhất 1 từ',
      color: 'bg-[#2845D6]',
      shadow: 'shadow-[0_4px_0_#0D1A63]',
      icon: <GraduationCap size={30} strokeWidth={2.5} color="white" />,
      minWords: 1,
    },
    ...MODES,
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col animate-fade-in p-4 md:p-8 pb-24 overflow-y-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl text-slate-400 hover:text-[#2845D6] hover:bg-[#E8EBF5] transition-all"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-[#E8EBF5] p-3 rounded-2xl text-[#2845D6]">
            <BookOpen size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0D1A63] leading-tight">{set?.name}</h1>
            <p className="text-slate-400 font-bold text-sm mt-0.5">{vocab.length} thuật ngữ</p>
          </div>
        </div>
        <button
          onClick={() => setShowManage(true)}
          className="ml-auto text-sm font-bold text-[#2845D6] bg-[#E8EBF5] px-4 py-2 rounded-xl hover:bg-[#2845D6] hover:text-white transition-all"
        >
          Chỉnh sửa
        </button>
      </div>

      {/* Requirement Notice */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3 shadow-sm">
        <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
          <Clock size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h4 className="font-extrabold text-amber-800 text-sm mb-1 uppercase tracking-tight">Quy tắc ôn tập Spaced Repetition</h4>
          <p className="text-amber-700/80 text-sm font-bold leading-relaxed">
            Bạn cần hoàn thành <span className="text-amber-900 underline">CẢ HAI</span> phần <span className="font-black">Trắc nghiệm</span> & <span className="font-black">Chính tả</span> trong hôm nay để được tính là đã học xong bộ từ vựng này.
          </p>
        </div>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {allModes.map(mode => {
          const enabled = vocab.length >= mode.minWords;
          
          // Check progress from localStorage
          const today = new Date().toDateString();
          let isDoneToday = false;
          try {
            const saved = JSON.parse(localStorage.getItem('vocavibe_completed_modes') || '{}');
            const progress = saved[setId];
            if (progress && progress.date === today && progress[mode.id]) {
                isDoneToday = true;
            }
          } catch(e) {}

          return (
            <div
              key={mode.id}
              onClick={() => handleModeClick(mode)}
              className={`
                ${mode.color} ${mode.shadow}
                rounded-[20px] p-5 flex flex-col items-center text-center gap-3 relative
                transition-all duration-200
                ${enabled
                  ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-none'
                  : 'opacity-50 grayscale cursor-not-allowed'
                }
              `}
            >
              {isDoneToday && (
                <div className="absolute top-2 right-2 bg-white text-[#58CC02] w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce-subtle z-10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
              <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center">
                {mode.icon}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base leading-tight">{mode.label}</h3>
                <p className="text-white/70 text-xs font-semibold mt-0.5">
                  {enabled ? mode.desc : mode.descDisabled}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vocabulary Preview List */}
      {vocab.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#2845D6] rounded-full" />
              <h2 className="text-xl font-extrabold text-[#0D1A63]">Danh sách từ vựng</h2>
            </div>
            <button
              onClick={() => handleModeClick(allModes.find(m => m.id === 'learn'))}
              className="text-sm font-bold text-[#2845D6] hover:underline"
            >
              Xem flashcard →
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {vocab.slice(0, 8).map((item, idx) => (
              <div key={item.id} className="bg-white rounded-2xl px-5 py-4 border-2 border-slate-100 flex items-center gap-4 hover:border-[#2845D6]/30 transition-all">
                <span className="text-[#F68048] font-black text-xs bg-[#FFF2EB] px-2 py-0.5 rounded-md shrink-0">#{idx + 1}</span>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-6">
                  <span className="font-extrabold text-[#0D1A63] text-base">{item.word}</span>
                  <span className="text-slate-400 font-bold text-sm sm:ml-auto">{item.meaning}</span>
                </div>
                {item.part_of_speech && (
                  <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase italic shrink-0">{item.part_of_speech}</span>
                )}
              </div>
            ))}
            {vocab.length > 8 && (
              <p className="text-center text-sm text-slate-400 font-bold py-2">và {vocab.length - 8} từ nữa...</p>
            )}
          </div>
        </div>
      )}

      <ManageWordsModal
        set={set}
        isOpen={showManage}
        onClose={() => { setShowManage(false); fetchSetAndVocab(); }}
      />

      {/* Reading Difficulty Modal */}
      {showReadingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowReadingModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md relative z-10 p-6 md:p-8 shadow-2xl animate-scale-in">
            <button
              onClick={() => setShowReadingModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-cyan-100 text-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm mx-auto">
              <FileText size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-[#0D1A63] mb-2 text-center">Chọn trình độ của bạn</h2>
            <p className="text-slate-500 font-medium text-center mb-8">AI sẽ viết một câu chuyện ngắn bằng danh sách từ vựng này ở trình độ bạn chọn.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => startReading('A1')}
                className="w-full text-left bg-white border-2 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 p-4 rounded-2xl transition-all group flex items-center shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-cyan-200 text-slate-400 group-hover:text-cyan-700 flex items-center justify-center font-black mr-4 transition-colors">A1</div>
                <div>
                  <div className="font-extrabold text-[#0D1A63]">Sơ cấp (Beginner)</div>
                  <div className="text-sm font-medium text-slate-500">Câu ngắn, cấu trúc cực kỳ đơn giản</div>
                </div>
              </button>
              <button 
                onClick={() => startReading('B1')}
                className="w-full text-left bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 p-4 rounded-2xl transition-all group flex items-center shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-200 text-slate-400 group-hover:text-blue-700 flex items-center justify-center font-black mr-4 transition-colors">B1</div>
                <div>
                  <div className="font-extrabold text-[#0D1A63]">Trung cấp (Intermediate)</div>
                  <div className="text-sm font-medium text-slate-500">Đoạn văn phổ thông, từ nối cơ bản</div>
                </div>
              </button>
              <button 
                onClick={() => startReading('C1')}
                className="w-full text-left bg-white border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 p-4 rounded-2xl transition-all group flex items-center shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-purple-200 text-slate-400 group-hover:text-purple-700 flex items-center justify-center font-black mr-4 transition-colors">C1</div>
                <div>
                  <div className="font-extrabold text-[#0D1A63]">Cao cấp (Advanced)</div>
                  <div className="text-sm font-medium text-slate-500">Cấu trúc phức tạp, giống bài thi IELTS</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
