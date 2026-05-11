import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Volume2, Edit3, Trash2, BookOpen, Loader2 } from 'lucide-react';
import EditWordModal from './EditWordModal';

export default function ManageWordsModal({ set, isOpen, onClose }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [isAddingWord, setIsAddingWord] = useState(false);

  useEffect(() => {
    if (isOpen && set) {
      fetchWords();
    }
  }, [isOpen, set]);

  const fetchWords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vocabulary_items')
      .select('*')
      .eq('set_id', set.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching words:', error);
    } else {
      setWords(data || []);
    }
    setLoading(false);
  };

  const handleDeleteWord = async (id) => {
    if (!window.confirm('Xóa từ vựng này?')) return;
    const { error } = await supabase.from('vocabulary_items').delete().eq('id', id);
    if (!error) fetchWords();
  };

  const playWordAudio = (word) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0D1A63]/70 z-[100] flex items-center justify-center p-4 animate-fade-in backdrop-blur-md overflow-hidden">
      <div className="bg-[#F8FAFC] w-full max-w-4xl h-[85vh] rounded-[40px] shadow-2xl relative animate-slide-up overflow-hidden flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="flex bg-white justify-between items-center p-6 md:p-8 border-b-2 border-slate-100 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="bg-[#E8EBF5] p-3 rounded-2xl text-[#2845D6]">
                <BookOpen size={24} strokeWidth={2.5} />
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-[#0D1A63] line-clamp-1">{set.name}</h2>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Quản lý từ vựng</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsAddingWord(true)}
                className="hidden md:flex items-center gap-2 bg-[#F68048] hover:bg-[#E67038] text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:translate-y-0.5"
            >
                <Plus size={20} strokeWidth={3} /> Thêm từ lẻ
            </button>
            <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-[#0D1A63] bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center transition-all border border-slate-100"
            >
                <X size={28} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#F8FAFC]">
          {loading && words.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={48} className="animate-spin mb-4" />
                <p className="font-bold">Đang tải danh sách...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {words.length === 0 && !loading && (
                <div className="py-20 text-center text-slate-400">
                    <p className="text-xl font-bold mb-4">Chưa có từ vựng nào trong bộ này</p>
                    <button 
                        onClick={() => setIsAddingWord(true)}
                        className="bg-[#2845D6] text-white px-8 py-3 rounded-2xl font-bold"
                    >
                        Tăng tốc ngay!
                    </button>
                </div>
              )}
              
              {words.map((item, idx) => (
                <div 
                    key={item.id} 
                    className="bg-white rounded-[24px] p-6 border-2 border-transparent hover:border-[#2845D6]/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center transition-all group"
                >
                    <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-50 pb-4 md:pb-0 md:pr-8 mb-4 md:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[#F68048] font-black text-xs bg-[#FFF2EB] px-2 py-0.5 rounded-md">#{idx + 1}</span>
                            <h3 className="text-xl font-extrabold text-[#0D1A63]">{item.word}</h3>
                            <button onClick={() => playWordAudio(item.word)} className="text-slate-300 hover:text-[#2845D6] transition-colors"><Volume2 size={18} /></button>
                        </div>
                        {item.part_of_speech && <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase italic">{item.part_of_speech}</span>}
                    </div>

                    <div className="flex-[1.5] md:px-8">
                        <p className="text-lg font-extrabold text-[#0D1A63]">{item.meaning}</p>
                        {item.example_en && <p className="text-sm italic text-slate-400 mt-1">"{item.example_en}"</p>}
                        {item.example_vi && <p className="text-xs text-slate-300 font-medium">{item.example_vi}</p>}
                    </div>

                    <div className="flex items-center gap-2 mt-4 md:mt-0 md:ml-auto">
                        <button 
                          onClick={() => setEditingWord(item)}
                          className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-[#2845D6] hover:bg-[#E8EBF5] rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteWord(item.id)}
                          className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-[#D33D3D] hover:bg-[#FFDFE0] rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Footer Add */}
        <div className="md:hidden p-4 bg-white border-t border-slate-100">
             <button 
                onClick={() => setIsAddingWord(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#F68048] text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200"
            >
                <Plus size={20} strokeWidth={3} /> Thêm từ mới
            </button>
        </div>

        {/* In-Modal Child Modals */}
        {(editingWord || isAddingWord) && (
            <EditWordModal 
                word={editingWord} 
                setId={set.id}
                onClose={() => { setEditingWord(null); setIsAddingWord(false); }}
                onSuccess={() => { setEditingWord(null); setIsAddingWord(false); fetchWords(); }}
            />
        )}
      </div>
    </div>
  );
}
