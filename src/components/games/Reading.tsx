'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { playSound, fireConfetti } from '@/lib/utils';
import { Loader2, CheckCircle, RotateCcw, AlertCircle } from 'lucide-react';

interface Part {
  type: 'text' | 'blank';
  content?: string;
  index?: number;
  word?: string;
}

interface Story {
  parts: Part[];
}

export default function Reading() {
  const router = useRouter();
  const params = useParams();
  const setId = params?.setId as string;
  const searchParams = useSearchParams();
  const { appData, showFeedback } = useAppContext();
  
  const level = searchParams?.get('level') || 'B1';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [story, setStory] = useState<Story | null>(null);
  const [blanks, setBlanks] = useState<string[]>([]);
  const [options, setOptions] = useState<{ id: number; word: string }[]>([]);
  
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [status, setStatus] = useState<'playing' | 'checked' | 'finished'>('playing');
  const [results, setResults] = useState<{ [key: number]: boolean }>({});

  const generateStory = async () => {
    try {
      setLoading(true);
      setError(null);
      setStory(null);
      setAnswers({});
      setStatus('playing');
      setResults({});

      const pool = [...appData.vocab].sort(() => Math.random() - 0.5).slice(0, 8);
      const targetWords = pool.map(w => w.en);

      console.log('Generating reading level:', level, 'with words:', targetWords);

      const { data, error: functionError } = await supabase.functions.invoke('generate-reading', {
        body: { level, words: targetWords }
      });

      if (functionError) throw functionError;
      if (data.error) throw new Error(data.error);

      const { paragraph } = data;
      
      const parts: Part[] = [];
      const extractedBlanks: string[] = [];
      const regex = /\[w\](.*?)\[\/w\]/gi;
      let lastIndex = 0;
      let blankCount = 0;
      
      let match;
      while ((match = regex.exec(paragraph)) !== null) {
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: paragraph.substring(lastIndex, match.index)
          });
        }
        
        const extractedWord = match[1];
        extractedBlanks.push(extractedWord);

        parts.push({
          type: 'blank',
          index: blankCount,
          word: extractedWord
        });
        
        blankCount++;
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < paragraph.length) {
        parts.push({
          type: 'text',
          content: paragraph.substring(lastIndex)
        });
      }

      setStory({ parts });
      setBlanks(extractedBlanks);
      
      const shuffledOptions = [...extractedBlanks].sort(() => Math.random() - 0.5);
      setOptions(shuffledOptions.map((word, i) => ({ id: i, word: word.toLowerCase() })));

    } catch (err: any) {
      console.error('Error generating story:', err);
      setError('Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appData.vocab.length === 0) return;
    generateStory();
  }, [appData.vocab]);

  const handleInputChange = (blankIndex: number, value: string) => {
    if (status === 'finished') return;
    setAnswers(prev => ({ ...prev, [blankIndex]: value }));
    
    if (results[blankIndex] === false) {
        const newResults = { ...results };
        delete newResults[blankIndex];
        setResults(newResults);
        
        if (status === 'checked') {
            setStatus('playing');
        }
    }
  };

  const handleCheck = () => {
    const isAllFilled = blanks.every((_, idx) => answers[idx] && answers[idx].trim() !== '');
    if (!isAllFilled) {
       showFeedback('Oops', 'error', 'Vui lòng điền vào tất cả các chỗ trống!');
       return;
    }

    const newResults: { [key: number]: boolean } = {};
    let allCorrect = true;
    
    story?.parts.forEach(part => {
        if (part.type === 'blank' && typeof part.index === 'number' && part.word) {
            const userAnswer = (answers[part.index] || '').trim().toLowerCase();
            const isCorrect = userAnswer === part.word.toLowerCase();
            newResults[part.index] = isCorrect;
            if (!isCorrect) allCorrect = false;
        }
    });

    setResults(newResults);

    if (allCorrect) {
        setStatus('finished');
        playSound('success');
        fireConfetti();
        showFeedback('Tuyệt vời!', 'success', 'Bạn đã hoàn thành bài đọc xuất sắc!');
    } else {
        setStatus('checked');
        playSound('wrong');
        showFeedback('Gần đúng rồi!', 'error', 'Hãy sửa lại những ô màu đỏ nhé.');
    }
  };

  const getAvailableOptions = () => {
    const usedWords = Object.values(answers).map(w => (w || '').trim().toLowerCase());
    
    const usedCounts: { [key: string]: number } = {};
    usedWords.forEach(w => {
      if (w) usedCounts[w] = (usedCounts[w] || 0) + 1;
    });

    return options.map(opt => {
        const optLower = opt.word.toLowerCase();
        if (usedCounts[optLower] > 0) {
            usedCounts[optLower]--;
            return { ...opt, used: true };
        }
        return { ...opt, used: false };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 animate-fade-in items-center justify-center -mt-10 text-[#0D1A63]">
        <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-lg">
          <Loader2 size={40} className="text-cyan-500 animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-center mb-2">Đang sáng tác câu chuyện...</h2>
        <p className="text-[#5C6A9C] font-bold max-w-sm text-center">AI đang viết một đoạn văn dành riêng cho bạn ở trình độ {level}. Vui lòng đợi nhé!</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 animate-fade-in items-center justify-center -mt-10 text-[#0D1A63]">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-center mb-4">{error}</h2>
        <button className="btn btn-primary" onClick={generateStory}>Thử lại</button>
      </div>
    );
  }

  const availableOptions = getAvailableOptions();

  return (
    <div className="flex flex-col flex-1 animate-fade-in pb-20 text-[#0D1A63]">
      <div className="flex justify-between items-center mb-6">
          <button className="btn btn-outline py-2 px-4 text-sm" onClick={() => router.push(`/set/${setId}`)}>Quit</button>
          
          <div className="flex-1 flex justify-center">
             <div className="bg-cyan-50 border-2 border-cyan-100 text-cyan-600 px-4 py-1.5 rounded-full font-bold text-sm tracking-widest uppercase">
                Bài tập Đọc hiểu ({level})
             </div>
          </div>

          <button className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors" onClick={generateStory} title="Tạo bài mới">
             <RotateCcw size={20} />
          </button>
      </div>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-[32px] p-6 sm:p-10 shadow-[0_8px_30px_rgba(13,26,99,0.08)] border-2 border-slate-100 leading-relaxed text-lg sm:text-xl font-medium text-slate-700 mb-8 overflow-y-auto">
             {story?.parts.map((part, i) => {
                if (part.type === 'text' && part.content) {
                    return <span key={i} dangerouslySetInnerHTML={{ __html: part.content.replace(/\n/g, '<br/>') }} />;
                }
                
                if (part.type === 'blank' && typeof part.index === 'number') {
                  const answer = answers[part.index] || '';
                  const isCorrect = results[part.index] === true;
                  const isWrong = results[part.index] === false;
                  const isFinished = status === 'finished';

                  let blankClass = 'inline-block text-center min-w-[100px] w-auto max-w-[160px] h-10 px-2 mx-1 border-b-4 rounded-t-xl transition-all font-bold outline-none ';
                  
                  if (isCorrect) {
                    blankClass += 'bg-green-100 border-green-500 text-green-700';
                  } else if (isWrong) {
                    blankClass += 'bg-red-100 border-red-500 text-red-700 focus:bg-red-50 focus:border-red-400';
                  } else if (answer) {
                    blankClass += 'bg-cyan-50 border-cyan-400 text-cyan-800 focus:bg-cyan-100 focus:border-cyan-500';
                  } else {
                    blankClass += 'bg-slate-50 border-slate-300 text-slate-700 focus:bg-cyan-50 focus:border-cyan-400 hover:bg-slate-100';
                  }

                  const chars = Math.max(answer.length, 4);

                  return (
                      <input 
                        key={i} 
                        type="text"
                        className={blankClass}
                        style={{ width: `${chars + 2}ch` }}
                        value={answer}
                        onChange={(e) => handleInputChange(part.index!, e.target.value)}
                        disabled={isFinished || isCorrect}
                        placeholder={String(part.index + 1)}
                        autoComplete="off"
                      />
                  );
                }
                return null;
             })}
          </div>

          <div className="mt-auto">
             {status !== 'finished' ? (
                <div className="bg-white rounded-[32px] p-6 shadow-[0_-8px_30px_rgba(13,26,99,0.05)] border-t-2 border-slate-100 flex flex-col gap-6 -mx-4 sm:mx-0">
                    <p className="text-center font-bold text-[#5C6A9C] uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                        Danh sách từ vựng cần điền
                    </p>
                    
                    <div className="w-full flex flex-row flex-wrap gap-2 md:gap-3 justify-center items-center">
                        {availableOptions.map((opt) => (
                            <div
                                key={opt.id}
                                className={`
                                    px-4 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all shadow-sm break-all md:break-normal max-w-full
                                    ${opt.used 
                                        ? 'bg-slate-100 text-slate-300 opacity-50' 
                                        : 'bg-white border-2 border-slate-200 text-[#0D1A63]'
                                    }
                                `}
                            >
                                {opt.word}
                            </div>
                        ))}
                    </div>

                    <button 
                       className="w-full mt-4 bg-[#2845D6] hover:bg-[#1A2CA3] text-white px-6 py-4 rounded-2xl font-black text-xl transition-all shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none"
                       onClick={handleCheck}
                    >
                       KIỂM TRA
                    </button>
                </div>
             ) : (
                <div className="bg-green-100 border-2 border-green-200 rounded-[32px] p-8 text-center flex flex-col items-center shadow-lg -mx-4 sm:mx-0">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mb-4 animate-bounce">
                        <CheckCircle size={32} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-black text-green-700 mb-2">Thông thạo!</h2>
                    <p className="text-green-600 font-bold mb-6">Bạn đã nắm được cách dùng các từ vựng này trong ngữ cảnh thực tế.</p>
                    <button 
                       className="w-full max-w-sm bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-xl transition-all shadow-[0_4px_0_#166534] active:translate-y-1 active:shadow-none"
                       onClick={() => router.push(`/set/${setId}`)}
                    >
                       QUAY LẠI
                    </button>
                </div>
             )}
          </div>
      </div>
    </div>
  );
}
