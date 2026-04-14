import React, { useState, useEffect } from 'react'
import { useAppContext } from '../../lib/store'
import { playSound, fireConfetti, speakWord } from '../../lib/utils'

export default function SpeakingPractice() {
  const { appData, setActiveScreen, updateStreakAfterStudy } = useAppContext();
  
  const [session, setSession] = useState(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const pool = appData.vocab.filter(w => w.enSentence && w.viSentence);
    if (pool.length === 0) return;
    
    pool.sort(() => Math.random() - 0.5);
    setSession({
      words: pool,
      currentIndex: 0,
      totalWords: pool.length
    });
  }, [appData.vocab]);

  useEffect(() => {
     const handleKeydown = (e) => {
         if (e.code === 'Space' && !flipped) {
             e.preventDefault();
             handleAction();
         } else if (e.code === 'Enter' && flipped) {
             e.preventDefault();
             handleAction();
         }
     };
     document.addEventListener('keydown', handleKeydown);
     return () => document.removeEventListener('keydown', handleKeydown);
  }, [flipped, session]);

  const handleAction = () => {
      if (!session) return;
      const currentWord = session.words[session.currentIndex];
      
      if (!flipped) {
          setFlipped(true);
          speakWord(currentWord.enSentence);
      } else {
          const nextIndex = session.currentIndex + 1;
          if (nextIndex >= session.words.length) {
              endSession();
          } else {
              setSession({ ...session, currentIndex: nextIndex });
              setFlipped(false);
          }
      }
  };

  const endSession = () => {
      updateStreakAfterStudy();
      fireConfetti();
      playSound('completed');
      setActiveScreen('vocab');
  }

  if (!session || !session.words[session.currentIndex]) return null;

  const currentWord = session.words[session.currentIndex];
  const progressPct = (session.currentIndex / session.totalWords) * 100;

  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
          <button className="btn btn-outline py-2 px-4 text-sm" onClick={endSession}>Quit</button>
          <div className="w-full h-4 bg-bg-tertiary rounded-full overflow-hidden my-4 flex-1 mx-4 !my-0">
              <div className="h-full bg-gradient-primary transition-all duration-300 rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
      </div>

      <div 
        className="flex-1 flex flex-col justify-center text-center cursor-pointer my-6"
        onClick={handleAction}
      >
          <p className="font-bold uppercase text-text-secondary mb-6">
              Translate this sentence aloud
          </p>
          <div className="text-2xl text-text-primary leading-tight mb-6">
              {currentWord.viSentence}
          </div>

          <div style={{ visibility: flipped ? 'visible' : 'hidden', opacity: flipped ? 1 : 0, transition: 'opacity 0.3s', minHeight: '100px' }}>
              <div className="text-2xl text-primary-blue leading-tight mb-3 font-bold">
                  {currentWord.enSentence}
              </div>
              <div className="text-base text-text-secondary bg-bg-secondary p-2 rounded-lg inline-block">
                  <strong className="text-primary-orange">{currentWord.en}</strong> : <span>{currentWord.vi}</span>
              </div>
          </div>
      </div>

      <div className="footer mt-auto flex-col gap-2 text-center p-0 border-none">
          <p className="text-text-secondary text-sm m-0">
              Press <b className="bg-gray-200 px-2 rounded text-gray-800">Space</b> to flip • Press <b className="bg-gray-200 px-2 rounded text-gray-800">Enter</b> for next
          </p>
          <button className="btn btn-primary w-full" onClick={handleAction}>
              {flipped ? 'Next' : 'Flip'}
          </button>
      </div>
    </div>
  )
}
