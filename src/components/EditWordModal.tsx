'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Check } from 'lucide-react';

interface EditWordModalProps {
  word?: any;
  setId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditWordModal({ word, setId, onClose, onSuccess }: EditWordModalProps) {
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    part_of_speech: '',
    example_en: '',
    example_vi: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (word) {
      setFormData({
        word: word.word || '',
        meaning: word.meaning || '',
        part_of_speech: word.part_of_speech || '',
        example_en: word.example_en || '',
        example_vi: word.example_vi || '',
        notes: word.notes || ''
      });
    } else {
      setFormData({
        word: '',
        meaning: '',
        part_of_speech: '',
        example_en: '',
        example_vi: '',
        notes: ''
      });
    }
  }, [word]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.word || !formData.meaning) {
        alert('Vui lòng điền từ vựng và nghĩa.');
        return;
    }

    setLoading(true);
    try {
      if (word) {
        // Update existing with .select() to verify if it was really allowed by RLS
        const { data: updatedData, error } = await supabase
          .from('vocabulary_items')
          .update(formData)
          .eq('id', word.id)
          .select();
          
        if (error) {
            console.error('Update word error:', error);
            alert('Lỗi khi sửa từ: ' + error.message);
            throw error;
        }

        // If update syntax succeeded but no rows modified, it usually means RLS blocked it
        if (!updatedData || updatedData.length === 0) {
            console.warn('Update completed but 0 rows were modified. Check Supabase RLS policies.');
            alert('⚠️ Không thể lưu dữ liệu mới!\nHãy đảm bảo bạn đã bật quyền UPDATE cho bảng vocabulary_items trong Supabase Dashboard.');
            return;
        }

        alert('Cập nhật thuật ngữ thành công!');
      } else {
        // Create new
        const { error } = await supabase
          .from('vocabulary_items')
          .insert({ ...formData, set_id: setId });
        if (error) throw error;
        alert('Thêm thuật ngữ mới thành công!');
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (!err.code) alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0D1A63]/60 z-[150] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm overflow-y-auto pt-20 pb-20">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl relative my-auto animate-slide-up overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="flex bg-[#E8EBF5] justify-between items-center p-6 border-b-2 border-slate-100">
          <h2 className="text-xl font-extrabold text-[#0D1A63]">
            {word ? 'Sửa thuật ngữ' : 'Thêm thuật ngữ mới'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-400 font-extrabold mb-1 uppercase tracking-wide text-xs">Từ tiếng Anh *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border-2 border-slate-100 focus:border-[#2845D6] rounded-xl font-bold outline-none transition-colors text-[#0D1A63]" 
                  value={formData.word}
                  onChange={(e) => setFormData({...formData, word: e.target.value})}
                  autoFocus
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-400 font-extrabold mb-1 uppercase tracking-wide text-xs">Loại từ</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border-2 border-slate-100 focus:border-[#2845D6] rounded-xl font-bold outline-none transition-colors text-[#0D1A63]" 
                  placeholder="noun, verb..."
                  value={formData.part_of_speech}
                  onChange={(e) => setFormData({...formData, part_of_speech: e.target.value})}
                />
              </div>
          </div>

          <div>
            <label className="block text-slate-400 font-extrabold mb-1 uppercase tracking-wide text-xs">Nghĩa tiếng Việt *</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border-2 border-slate-100 focus:border-[#2845D6] rounded-xl font-bold outline-none transition-colors text-[#0D1A63]" 
              value={formData.meaning}
              onChange={(e) => setFormData({...formData, meaning: e.target.value})}
            />
          </div>

          <div className="mt-2 text-slate-300 border-t border-slate-50 pt-4">Ví dụ (Tuỳ chọn)</div>

          <div>
            <label className="block text-slate-400 font-extrabold mb-1 uppercase tracking-wide text-xs">Ví dụ tiếng Anh</label>
            <textarea 
              className="w-full px-4 py-3 border-2 border-slate-100 focus:border-[#2845D6] rounded-xl font-bold outline-none transition-colors text-[#0D1A63] h-20 resize-none" 
              value={formData.example_en}
              onChange={(e) => setFormData({...formData, example_en: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-slate-400 font-extrabold mb-1 uppercase tracking-wide text-xs">Dịch nghĩa ví dụ</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border-2 border-slate-100 focus:border-[#2845D6] rounded-xl font-bold outline-none transition-colors text-[#0D1A63]" 
              value={formData.example_vi}
              onChange={(e) => setFormData({...formData, example_vi: e.target.value})}
            />
          </div>

          <div className="mt-2 text-slate-300 border-t border-slate-50 pt-4">Thông tin bổ sung</div>
          
          <div>
            <label className="block text-slate-400 font-extrabold mb-1 uppercase tracking-wide text-xs">Ghi chú</label>
            <textarea 
              className="w-full px-4 py-3 border-2 border-slate-100 focus:border-[#2845D6] rounded-xl font-bold outline-none transition-colors text-[#0D1A63] h-20 resize-none" 
              placeholder="Giải thích từ vựng, ngữ cảnh đặc biệt..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
                Hủy
            </button>
            <button 
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 font-bold text-white bg-[#2845D6] rounded-xl shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
                {loading ? 'Đang lưu...' : <><Check size={20} /> Lưu thay đổi</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
