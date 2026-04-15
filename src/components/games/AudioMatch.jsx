import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../../lib/store'
import { playSound, fireConfetti, speakWord } from '../../lib/utils'

export default function AudioMatch() {
  const { appData, setActiveScreen, showFeedback, updateStreakAfterStudy, updateWordStats, updateSetLastStudied, activeSet } = useAppContext();
  
  const [session, setSession] = useState(null);
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    // Only initialize if there is no active session
    if (session || appData.vocab.length < 5) return;
    
    let pool = [...appData.vocab].sort(() => Math.random() - 0.5);
    startQuestion(pool, 0, 0, pool.length);
  }, [appData.vocab, session]);

  const startQuestion = (words, currentIndex, correctAnswers, totalWords) => {
    if (currentIndex >= words.length) {
      endSession({ correctAnswers, totalWords, wrongWordsThisSession: [] });
      return;
    }

    const currentWord = words[currentIndex];
    
    speakWord(currentWord.en);

    const options = [currentWord];
    const others = [...appData.vocab].filter(v => v.id !== currentWord.id).sort(() => Math.random() - 0.5);
    for(let i=0; i<4 && i<others.length; i++) options.push(others[i]);
    options.sort(() => Math.random() - 0.5);

    // Initial positioning data
    const initialBubbles = options.map(opt => ({
       opt,
       x: Math.random() * 200, // safe initial
       y: Math.random() * 100,
       vx: (Math.random() - 0.5) * 2,
       vy: (Math.random() - 0.5) * 2,
       status: '' // 'correct', 'wrong', ''
    }));

    setSession({
      words,
      currentIndex,
      correctAnswers,
      totalWords
    });
    setBubbles(initialBubbles);
  };

  useEffect(() => {
     if (!session || bubbles.length === 0 || !containerRef.current) return;
     
     // Start animation loop
     const animate = () => {
         const container = containerRef.current;
         if (!container) return;
         const w = container.clientWidth;
         const h = container.clientHeight;
         
         setBubbles(prevBubbles => {
             return prevBubbles.map((b, i) => {
                 // Assume standard widths for bubbles or get from DOM, simplified to approx 100x40
                 const bubbleW = 100;
                 const bubbleH = 40;
                 let newX = b.x + b.vx;
                 let newY = b.y + b.vy;
                 let newVx = b.vx;
                 let newVy = b.vy;

                 if (newX <= 0 || newX + bubbleW >= w) newVx *= -1;
                 if (newY <= 0 || newY + bubbleH >= h) newVy *= -1;

                 // Ensure it stays inside bounds in case resize happens
                 newX = Math.max(0, Math.min(newX, w - bubbleW));
                 newY = Math.max(0, Math.min(newY, h - bubbleH));

                 return { ...b, x: newX, y: newY, vx: newVx, vy: newVy };
             });
         });

         animationFrameId.current = requestAnimationFrame(animate);
     };

     if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
     animationFrameId.current = requestAnimationFrame(animate);

     return () => cancelAnimationFrame(animationFrameId.current);
  }, [session]); // depend on session so it restarts but doesn't over-spin

  const handleBubbleClick = (index, bubble) => {
     const currentWord = session.words[session.currentIndex];
     if (bubble.opt.id === currentWord.id) {
         playSound('success');
         cancelAnimationFrame(animationFrameId.current);
         
         setBubbles(prev => {
            const next = [...prev];
            next[index].status = 'correct';
            return next;
         });

         setTimeout(() => {
             startQuestion(session.words, session.currentIndex + 1, session.correctAnswers + 1, session.totalWords);
         }, 1000);
     } else {
         playSound('wrong');
         updateWordStats(currentWord.id, false);
         
         setBubbles(prev => {
            const next = [...prev];
            next[index].status = 'wrong';
            return next;
         });

         setTimeout(() => {
             setBubbles(prev => {
                const next = [...prev];
                if(next[index]) next[index].status = '';
                return next;
             });
         }, 500);
     }
  }

  const endSession = (finalSession) => {
      updateStreakAfterStudy();
      if (activeSet) {
        updateSetLastStudied(activeSet.id, activeSet.review_count);
      }
      playSound('completed');
      setActiveScreen('vocab');
  }

  if (!session || !session.words[session.currentIndex]) return null;

  const currentWord = session.words[session.currentIndex];
  const progressPct = (session.correctAnswers / session.totalWords) * 100;

  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
          <button className="btn btn-outline py-2 px-4 text-sm" onClick={() => setActiveScreen('vocab')}>Quit</button>
          <div className="w-full h-4 bg-bg-tertiary rounded-full overflow-hidden my-4 flex-1 mx-4 !my-0">
              <div className="h-full bg-gradient-primary transition-all duration-300 rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
      </div>

      <div className="text-center mt-4">
          <button 
             className="btn btn-blue rounded-full w-16 h-16 text-2xl flex items-center justify-center mx-auto"
             onClick={() => speakWord(currentWord.en)}
          >
              🔊
          </button>
          <p className="mt-2 font-bold text-text-secondary">Catch the correct meaning!</p>
      </div>

      <div className="relative h-[400px] w-full max-w-3xl mx-auto border-2 border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-sm mt-8" ref={containerRef}>
          {bubbles.map((b, i) => (
             <div
                key={i}
                className={`absolute px-5 py-3 bg-bg-primary border-2 border-primary-blue rounded-full font-bold cursor-pointer shadow-sm whitespace-nowrap select-none floating-bubble ${b.status}`}
                style={{ left: b.x + 'px', top: b.y + 'px' }}
                onClick={() => handleBubbleClick(i, b)}
             >
                {b.opt.vi}
             </div>
          ))}
      </div>
    </div>
  )
}
