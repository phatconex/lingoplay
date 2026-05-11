import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppContext } from '../../lib/store'
import { playSound, fireConfetti, speakWord } from '../../lib/utils'

export default function Spelling() {
  const navigate = useNavigate();
  const { setId } = useParams();
  const { appData, showFeedback, hideFeedback, updateStreakAfterStudy, updateWordStats, markGameCompleted, activeSet } = useAppContext();
  
  const [session, setSession] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputState, setInputState] = useState(''); // 'correct' | 'wrong' | ''
  const lockRef = useRef(false);
  const activeSetRef = useRef(activeSet);
  useEffect(() => { activeSetRef.current = activeSet; }, [activeSet]);

  useEffect(() => {
    if (session || appData.vocab.length === 0) return;
    
    let pool = [...appData.vocab].sort(() => Math.random() - 0.5);
    setSession({
      words: pool,
      currentIndex: 0,
      totalWords: pool.length,
      correctAnswers: 0,
      wrongWordsThisSession: []
    });
  }, [appData.vocab, session]);

  useEffect(() => {
    // Only focus input on mount, do NOT auto-speak
    setTimeout(() => {
      const input = document.querySelector('.spell-input-field');
      input?.focus();
    }, 100);
  }, [session?.currentIndex]);

  const getSpellingDiffHtml = (userAns, correctAns) => {
    let u = userAns.toLowerCase();
    let c = correctAns.toLowerCase();
    
    let dp = Array(u.length + 1).fill(0).map(() => Array(c.length + 1).fill(0));
    for (let i = 1; i <= u.length; i++) {
        for (let j = 1; j <= c.length; j++) {
            if (u[i - 1] === c[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    let i = u.length;
    let j = c.length;
    let matches = 0;
    
    let result = [];
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && u[i - 1] === c[j - 1]) {
            result.push(`<span style="color: #58CC02;">${correctAns[j - 1]}</span>`);
            matches++;
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.push(`<span style="color: #FF4B4B; text-decoration: underline; font-weight: 900;">${correctAns[j - 1]}</span>`);
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            result.push(`<span style="color: #A0A0A0; text-decoration: line-through; padding: 0 2px;">${userAns[i - 1]}</span>`);
            i--;
        }
    }
    
    let html = result.reverse().join('');
    let percent = Math.round((matches / Math.max(u.length, c.length)) * 100);
    return { html, percent };
  }

  const checkSpelling = () => {
    if (lockRef.current || !session) return;
    lockRef.current = true;
    
    const currentWord = session.words[session.currentIndex];
    const correctAns = currentWord.en.toLowerCase();
    const userAns = inputValue.trim().toLowerCase();

    speakWord(currentWord.en);

    if (userAns === correctAns) {
        setInputState('correct');
        playSound('success');
        
        let newSession = { ...session, correctAnswers: session.correctAnswers + 1 };
        
        setTimeout(() => {
            const nextIndex = session.currentIndex + 1;
            if (nextIndex >= session.words.length) {
                endSession(newSession);
            } else {
                newSession.currentIndex = nextIndex;
                setSession(newSession);
                setInputValue('');
                setInputState('');
                lockRef.current = false;
            }
        }, 800);
    } else {
        setInputState('wrong');
        playSound('wrong');
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
                setSession(newSession);
                setInputValue('');
                setInputState('');
                lockRef.current = false;
            }
        }, 2200);
    }
  }

  const endSession = (finalSession) => {
      updateStreakAfterStudy();
      if (setId) {
        markGameCompleted(setId, 'spelling');
      }
      if (finalSession.wrongWordsThisSession.length === 0) {
         playSound('completed');
      }
      navigate(`/set/${setId}`);
  }

  if (!session || !session.words[session.currentIndex]) return null;

  const currentWord = session.words[session.currentIndex];
  const progressPct = (session.correctAnswers / session.totalWords) * 100;

  const inputBg = inputState === 'correct'
    ? 'border-green-400 bg-green-50 text-[#0D1A63]'
    : inputState === 'wrong'
      ? 'border-red-400 bg-red-50 text-[#0D1A63]'
      : 'border-slate-200 bg-white text-[#0D1A63] focus:border-[#2845D6]';

  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
          <button className="btn btn-outline py-2 px-4 text-sm" onClick={() => navigate(`/set/${setId}`)}>Quit</button>
          <div className="w-full h-4 bg-bg-tertiary rounded-full overflow-hidden my-4 flex-1 mx-4 !my-0">
              <div className="h-full bg-gradient-primary transition-all duration-300 rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
      </div>

      <div className="flex-1 flex flex-col justify-center text-center my-8" style={{ flex: 0 }}>
          <p className="font-bold uppercase tracking-wider mb-2" style={{ color: currentWord.isRetry ? 'var(--primary-orange)' : 'var(--text-secondary)' }}>
              {currentWord.isRetry ? '🔄 LÀM LẠI NÀO' : 'Translate this word'}
          </p>
          <div className="text-5xl font-extrabold text-[#0D1A63] flex justify-center items-center gap-2 mb-2" style={{ fontSize: '42px' }}>{currentWord.vi}</div>
          
          {inputState === 'wrong' && (
            <p className="text-[#FF4B4B] font-bold text-lg mb-0 mt-2 animate-fade-in flex items-center justify-center gap-2">
              Đáp án đúng: <span className="font-black text-2xl bg-red-50 px-4 py-1 rounded-2xl border border-red-100">{currentWord.en}</span>
            </p>
          )}
          {inputState === 'correct' && (
            <p className="text-[#58CC02] font-bold text-lg mb-0 mt-2 animate-fade-in flex items-center justify-center gap-2">
              ✅ Chính xác!
            </p>
          )}
      </div>

      <div className="w-full max-w-xl mx-auto flex flex-col gap-4 mt-8 mb-auto px-4">
          <input 
            type="text" 
            className={`spell-input-field w-full px-6 py-4 text-2xl border-2 rounded-2xl text-center font-bold outline-none shadow-sm transition-colors ${inputBg}`} 
            placeholder="Type in English..." 
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
               if(e.key === 'Enter') checkSpelling();
            }}
            autoFocus
            disabled={!!inputState}
          />
          <button 
             className="w-full bg-[#2845D6] hover:bg-[#1A2CA3] text-white px-6 py-4 rounded-2xl font-bold text-xl transition-all shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none disabled:opacity-50" 
             onClick={checkSpelling}
             disabled={!!inputState}
          >
             CHECK
          </button>
      </div>
    </div>
  )
}
