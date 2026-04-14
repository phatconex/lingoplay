import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../../lib/store'
import { playSound, fireConfetti, speakWord } from '../../lib/utils'

export default function Spelling() {
  const { appData, setActiveScreen, showFeedback, hideFeedback, updateStreakAfterStudy, updateWordStats } = useAppContext();
  
  const [session, setSession] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputState, setInputState] = useState(''); // 'correct' | 'wrong' | ''
  const lockRef = useRef(false);

  useEffect(() => {
    if (appData.vocab.length === 0) return;
    
    let pool = [...appData.vocab].sort(() => Math.random() - 0.5);
    setSession({
      words: pool,
      currentIndex: 0,
      totalWords: pool.length,
      correctAnswers: 0,
      wrongWordsThisSession: []
    });
  }, [appData.vocab]);

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
        showFeedback('Perfect!', 'success', '', 800);
        
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
                hideFeedback();
                lockRef.current = false;
            }
        }, 800);
    } else {
        setInputState('wrong');
        playSound('wrong');
        updateWordStats(currentWord.id, false);
        
        const diff = getSpellingDiffHtml(userAns, currentWord.en);
        const subtitle = `<strong style="font-size:32px; background: #FFFFFF; padding: 4px 16px; border-radius: 8px; margin-left: 8px; letter-spacing: 2px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1); line-height: 1.2;">${diff.html}</strong> <span style="margin-left: 12px; font-size: 20px; color: #FF4B4B; font-weight: bold;">(Đúng ${diff.percent}%)</span>`;
        
        showFeedback('Incorrect', 'error', subtitle, 2500);
        
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
                hideFeedback();
                lockRef.current = false;
            }
        }, 3000);
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

      <div className="flex-1 flex flex-col justify-center text-center my-8" style={{ flex: 0 }}>
          <p className="font-bold uppercase tracking-wider mb-2" style={{ color: currentWord.isRetry ? 'var(--primary-orange)' : 'var(--text-secondary)' }}>
              {currentWord.isRetry ? '🔄 LÀM LẠI NÀO' : 'Translate this word'}
          </p>
          <div className="text-5xl font-extrabold text-primary-blue flex justify-center items-center gap-2 mb-2" style={{ fontSize: '32px' }}>{currentWord.vi}</div>
      </div>

      <div className="w-full max-w-xl mx-auto flex flex-col gap-4 mt-8 mb-auto px-4">
          <input 
            type="text" 
            className={`w-full px-6 py-4 text-2xl border-2 border-slate-200 focus:border-[#2845D6] rounded-2xl text-center font-bold outline-none shadow-sm transition-colors spell-input ${inputState}`} 
            placeholder="Type in English..." 
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
               if(e.key === 'Enter') checkSpelling();
            }}
            autoFocus
          />
          <button 
             className="w-full bg-[#2845D6] hover:bg-[#1A2CA3] text-white px-6 py-4 rounded-2xl font-bold text-xl transition-all shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none" 
             onClick={checkSpelling}
          >
             CHECK
          </button>
      </div>
    </div>
  )
}
