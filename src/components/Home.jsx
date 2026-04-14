import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../lib/store';
import { Book, Clock, Plus, MoreVertical, X, Settings, Edit3, Trash2 } from 'lucide-react';
import CreateSetModal from './CreateSetModal';
import ManageWordsModal from './ManageWordsModal';

export default function Home() {
  const { user, setActiveScreen, setActiveSet } = useAppContext();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null); // {id, name}
  const [openMenuId, setOpenMenuId] = useState(null);
  const [managingSet, setManagingSet] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (user) {
      fetchSets();
    }

    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [user]);

  const fetchSets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vocabulary_sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sets:', error);
    } else {
      setSets(data || []);
    }
    setLoading(false);
  };

  const handleCreateSet = () => {
    setIsModalOpen(true);
  };

  const handleOpenSet = (set) => {
    setActiveSet({ id: set.id, name: set.name });
    setActiveScreen('vocab');
  };

  const handleDeleteSet = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ từ vựng này? Hành động này không thể hoàn tác.')) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('vocabulary_sets')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Lỗi khi xóa: ' + error.message);
    } else {
      fetchSets();
    }
  };

  const handleRenameSet = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !editingSet) return;

    setLoading(true);
    console.log('Attempting rename set:', { id: editingSet.id, newName, userId: user.id });
    
    const { error, count } = await supabase
      .from('vocabulary_sets')
      .update({ name: newName.trim() })
      .eq('id', editingSet.id);

    if (error) {
      console.error('Rename error:', error);
      alert('Lỗi khi đổi tên: ' + error.message + ' (Code: ' + error.code + ')');
    } else {
      console.log('Rename successful. Rows affected:', count);
      alert('Đã đổi tên thành công!');
      setEditingSet(null);
      setNewName('');
      fetchSets();
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center animate-fade-in">
        <div className="animate-spin text-primary-green">
          <Clock size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto h-full animate-fade-in p-2 md:p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-2 tracking-tight">
            Thư viện <span className="text-primary-blue italic">của bạn</span>
          </h1>
          <p className="text-lg text-text-secondary font-medium">Chọn một bộ từ vựng để bắt đầu học ngay.</p>
        </div>
        <button 
          onClick={handleCreateSet}
          className="flex items-center justify-center gap-2 bg-[#2845D6] hover:bg-[#1A2CA3] text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none whitespace-nowrap"
        >
          <Plus size={20} strokeWidth={3} /> Tạo bộ mới
        </button>
      </div>

      {sets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-100 shadow-sm mt-8">
          <Book size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-2xl font-extrabold text-text-primary mb-2">Chưa có bộ từ vựng nào</h3>
          <p className="text-slate-500 mb-6 font-medium">Hãy tạo bộ từ vựng đầu tiên của bạn để bắt đầu hành trình học nhé!</p>
          <button 
            onClick={handleCreateSet}
            className="inline-flex items-center gap-2 bg-primary-blue hover:bg-[#32BCFF] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-[0_4px_0_#1899D6] active:translate-y-1 active:shadow-none"
          >
            <Plus size={20} /> Tạo mới ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map(set => (
            <div 
              key={set.id}
              onClick={() => handleOpenSet(set)}
              className="bg-white rounded-[24px] p-6 border-2 border-slate-100 shadow-sm hover:border-[#2845D6] hover:shadow-[0_6px_0_#1A2CA3] transition-all cursor-pointer group hover:-translate-y-1 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-[#E8EBF5] w-14 h-14 rounded-2xl flex items-center justify-center text-[#2845D6]">
                  <Book size={28} strokeWidth={2.5} />
                </div>
                <div className="relative">
                  <button 
                    className={`p-2 rounded-full transition-all ${openMenuId === set.id ? 'bg-[#2845D6] text-white' : 'text-slate-300 hover:text-[#2845D6] hover:bg-[#E8EBF5]'}`}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setOpenMenuId(openMenuId === set.id ? null : set.id);
                    }}
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openMenuId === set.id && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_25px_rgba(13,26,99,0.15)] border border-slate-100 py-2 z-[50] animate-fade-in origin-top-right scale-100">
                      <button 
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#0D1A63] hover:bg-[#E8EBF5] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSet(set);
                          setNewName(set.name);
                          setOpenMenuId(null);
                        }}
                      >
                        <Settings size={18} className="text-[#2845D6]" /> Đổi tên bộ từ vựng
                      </button>
                      <button 
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#0D1A63] hover:bg-[#E8EBF5] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setManagingSet(set);
                          setOpenMenuId(null);
                        }}
                      >
                        <Edit3 size={18} className="text-[#2845D6]" /> Chỉnh sửa từ vựng
                      </button>
                      <div className="h-[1px] bg-slate-100 my-1 mx-2"></div>
                      <button 
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#D33D3D] hover:bg-[#FFDFE0] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSet(set.id);
                          setOpenMenuId(null);
                        }}
                      >
                        <Trash2 size={18} /> Xóa bộ từ vựng
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-text-primary mb-2 line-clamp-1">{set.name}</h3>
              
              <div className="flex items-center gap-4 text-sm text-slate-400 font-bold mb-6 flex-1">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Clock size={16} />
                  <span>{set.last_studied ? new Date(set.last_studied).toLocaleDateString('vi-VN') : 'Chưa học'}</span>
                </div>
              </div>

              <div className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold group-hover:bg-[#2845D6] group-hover:border-[#2845D6] group-hover:text-white transition-colors">
                Mở bộ từ vựng
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Set Modal */}
      {editingSet && (
        <div className="fixed inset-0 bg-[#0D1A63]/60 z-[150] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#E8EBF5]">
              <h3 className="text-xl font-extrabold text-[#0D1A63]">Đổi tên bộ từ vựng</h3>
              <button onClick={() => setEditingSet(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRenameSet} className="p-6">
              <input 
                type="text"
                className="w-full px-5 py-3 border-2 border-slate-200 focus:border-[#2845D6] rounded-2xl outline-none font-bold text-[#0D1A63] mb-6"
                placeholder="Nhập tên mới..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingSet(null)}
                  className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 font-bold text-white bg-[#2845D6] rounded-2xl shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Set Modal */}
      <CreateSetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { setIsModalOpen(false); fetchSets(); }} 
        userId={user?.id} 
      />

      {/* Manage Words Modal (NEW) */}
      <ManageWordsModal 
        set={managingSet}
        isOpen={!!managingSet}
        onClose={() => setManagingSet(null)}
      />
    </div>
  );
}
