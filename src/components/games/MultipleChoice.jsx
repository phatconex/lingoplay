import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../../lib/store'
import { playSound, fireConfetti } from '../../lib/utils'

export default function MultipleChoice() {
  const { appData, setActiveScreen, showFeedback, hideFeedback, updateStreakAfterStudy, updateWordStats } = useAppContext();
  
  const [session, setSession] = useState(null);
  const lockRef = useRef(false);

  useEffect(() => {
    // init
    if (appData.vocab.length < 4) return;
    
    let pool = [...appData.vocab].sort(() => Math.random() - 0.5);
    setSession({
      words: pool,
      currentIndex: 0,
      totalWords: pool.length,
      correctAnswers: 0,
      wrongWordsThisSession: [],
      currentOptions: generateOptions(pool[0], pool)
    });
  }, [appData.vocab]);

  function generateOptions(currentWord, pool) {
    if (!currentWord) return [];
    const options = [currentWord];
    const others = pool.filter(v => v.id !== currentWord.id).sort(() => Math.random() - 0.5);
    for(let i=0; i<3 && i<others.length; i++) {
      options.push(others[i]);
    }
    return options.sort(() => Math.random() - 0.5);
  }

  const handleOptionClick = (opt) => {
    if (lockRef.current || !session) return;
    lockRef.current = true;
    
    const currentWord = session.words[session.currentIndex];
    
    if (opt.id === currentWord.id) {
        playSound('success');
        showFeedback('Correct!', 'success', 'Good job!', 1500);
        
        let newSession = { ...session, correctAnswers: session.correctAnswers + 1 };
        
        setTimeout(() => {
            const nextIndex = session.currentIndex + 1;
            if (nextIndex >= session.words.length) {
                endSession(newSession);
            } else {
                newSession.currentIndex = nextIndex;
                newSession.currentOptions = generateOptions(session.words[nextIndex], appData.vocab);
                setSession(newSession);
                hideFeedback();
                lockRef.current = false;
            }
        }, 1500);
    } else {
        playSound('wrong');
        showFeedback('Wrong!', 'error', 'Correct answer was marked.', 2000);
        updateWordStats(currentWord.id, false);
        
        let newWords = [...session.words];
        const insertIndex = Math.min(session.currentIndex + 3, newWords.length);
        newWords.splice(insertIndex, 0, { ...currentWord, isRetry: true });

        let newSession = { ...session, words: newWords, wrongWordsThisSession: [...session.wrongWordsThisSession, currentWord] };
        
        setTimeout(() => {
            const nextIndex = session.currentIndex + 1;
            if (nextIndex >= newSession.words.length) {
                endSession(newSession);
            } else {
                newSession.currentIndex = nextIndex;
                newSession.currentOptions = generateOptions(newSession.words[nextIndex], appData.vocab);
                setSession(newSession);
                hideFeedback();
                lockRef.current = false;
            }
        }, 2000);
    }
  }

  const endSession = (finalSession) => {
      updateStreakAfterStudy();
      if (finalSession.wrongWordsThisSession.length === 0) {
         playSound('completed');
      }
      setActiveScreen('vocab');
  }

  if (!session || !session.words[session.currentIndex]) return null;

  const currentWord = session.words[session.currentIndex];
  const progressPct = (session.correctAnswers / session.totalWords) * 100;

  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
          <button className="btn btn-outline py-2 px-4 text-sm" onClick={() => endSession(session)}>Quit</button>
          <div className="w-full h-4 bg-bg-tertiary rounded-full overflow-hidden my-4 flex-1 mx-4 !my-0">
              <div className="h-full bg-gradient-primary transition-all duration-300 rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
      </div>

      <div className="flex-1 flex flex-col justify-center text-center my-8">
          <p className="font-bold uppercase tracking-wider mb-2" style={{ color: currentWord.isRetry ? 'var(--primary-orange)' : 'var(--text-secondary)' }}>
              {currentWord.isRetry ? '🔄 LÀM LẠI NÀO' : 'Select the correct meaning'}
          </p>
          <div className="text-5xl font-extrabold text-text-primary flex justify-center items-center gap-2 mb-2">{currentWord.en}</div>
      </div>

      <div className="w-full max-w-3xl mx-auto mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {session.currentOptions.map((opt, index) => (
                  <button 
                      key={opt.id} 
                      onClick={() => handleOptionClick(opt)}
                      className="group relative flex items-center bg-white border-2 border-slate-200 rounded-[24px] p-6 font-bold text-lg text-[#0D1A63] cursor-pointer shadow-[0_4px_0_#DDE2F0] hover:border-[#2845D6] hover:shadow-[0_4px_0_#1A2CA3] hover:text-[#2845D6] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all outline-none"
                  >
                      {/* Số thứ tự trang trí */}
                      <div className="absolute left-5 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-extrabold text-slate-400 group-hover:bg-[#E8EBF5] group-hover:text-[#2845D6] transition-colors">
                          {index + 1}
                      </div>
                      
                      {/* Text */}
                      <span className="flex-1 text-center pr-8">{opt.vi}</span>
                  </button>
              ))}
          </div>
      </div>
    </div>
  )
}
