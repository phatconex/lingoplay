'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Check, AlertCircle } from 'lucide-react';

interface CreateSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
}

export default function CreateSetModal({ isOpen, onClose, onSuccess, userId }: CreateSetModalProps) {
  const [name, setName] = useState('');
  const [vocabRaw, setVocabRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên bộ từ vựng.');
      return;
    }

    if (!vocabRaw.trim()) {
      setError('Vui lòng nhập ít nhất một từ vựng.');
      return;
    }

    const lines = vocabRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parseItems = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split('|').map(p => p.trim());
      if (parts.length < 2 || !parts[0] || !parts[1]) {
        setError(`Dòng ${i + 1} bị sai định dạng: cần có ít nhất 1 dấu "|" và không được để trống (Từ | Nghĩa).`);
        return;
      }
      
      parseItems.push({
        word: parts[0],
        meaning: parts[1],
        part_of_speech: parts[2] || null,
        example_en: parts[3] || null,
        example_vi: parts[4] || null,
        notes: parts[5] || null
      });
    }

    setLoading(true);

    try {
      const { data: setData, error: setErrorData } = await supabase
        .from('vocabulary_sets')
        .insert({ user_id: userId, name: name.trim() })
        .select()
        .single();
        
      if (setErrorData) throw setErrorData;

      const itemsToInsert = parseItems.map(item => ({
        ...item,
        set_id: setData.id
      }));

      const { error: setItemError } = await supabase
        .from('vocabulary_items')
        .insert(itemsToInsert);

      if (setItemError) {
        await supabase.from('vocabulary_sets').delete().eq('id', setData.id);
        throw setItemError;
      }

      onSuccess();
      setName('');
      setVocabRaw('');
    } catch (err: any) {
      console.error(err);
      setError('Lỗi khi tạo bộ từ vựng: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0D1A63]/60 z-[100] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative my-auto animate-slide-up overflow-hidden border border-slate-100 flex flex-col text-[#0D1A63]">
        
        {/* Header */}
        <div className="flex bg-[#E8EBF5] justify-between items-center p-6 border-b-2 border-slate-100">
          <h2 className="text-2xl font-extrabold text-[#0D1A63]">Tạo Bộ Từ Vựng Mới</h2>
          <button 
             onClick={onClose}
             className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
          {error && (
            <div className="bg-[#FFDFE0] border-2 border-[#FF4B4B]/30 text-[#D33D3D] p-4 rounded-2xl flex items-start gap-3 w-full font-bold">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="flex-1">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-slate-500 font-extrabold mb-2 uppercase tracking-wide text-sm">Tên bộ từ vựng</label>
            <input 
              type="text" 
              className="w-full px-5 py-4 text-xl border-2 border-slate-200 focus:border-[#2845D6] rounded-2xl font-bold outline-none shadow-sm transition-colors text-[#0D1A63]" 
              placeholder="VD: Tiếng Anh Giao Tiếp Cơ Bản..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-500 font-extrabold mb-2 uppercase tracking-wide text-sm flex justify-between">
              <span>Danh sách từ vựng</span>
              <span className="text-[#F68048]">Mỗi từ 1 dòng</span>
            </label>
            
            <div className="bg-[#E8EBF5] rounded-t-2xl px-5 py-3 border-2 border-b-0 border-slate-200 text-sm font-bold text-[#2845D6] flex flex-col gap-1">
               <p>Định dạng: Từ | Nghĩa | Loại từ | ví dụ Anh | ví dụ Việt | Ghi chú</p>
               <p className="text-slate-500 text-xs italic">VD: apple | quả táo | noun | An apple a day | Ăn táo mỗi ngày | Loại quả bổ dưỡng</p>
            </div>
            
            <textarea 
              className="w-full px-5 py-4 text-base border-2 border-slate-200 focus:border-[#2845D6] rounded-b-2xl font-bold outline-none shadow-sm transition-colors min-h-[250px] resize-y text-[#0D1A63]" 
              placeholder={`beautiful | xinh đẹp | adj | She is beautiful | Cô ấy rất xinh | Khen ngợi con gái\nrun | chạy | verb | I run | Tôi chạy | Động từ chuyển động`}
              value={vocabRaw}
              onChange={(e) => setVocabRaw(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>

          <div className="flex gap-4 mt-2">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 font-bold text-lg rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-4 font-bold text-lg rounded-2xl bg-[#2845D6] hover:bg-[#1A2CA3] text-white shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Đang tải...</span>
              ) : (
                <> <Check strokeWidth={3} /> Tạo Xong </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
