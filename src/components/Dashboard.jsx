import React from 'react'
import { useAppContext } from '../lib/store'

export default function Dashboard() {
  const { appData, setActiveScreen } = useAppContext();
  const hasVocab = appData.vocab.length > 0;
  
  // Requirement for specific games based on old checks:
  const canPlayMC = appData.vocab.length >= 4;
  const canPlayAudio = appData.vocab.length >= 5;
  const canPlaySpeaking = appData.vocab.filter(w => w.enSentence && w.viSentence).length > 0;

  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      <h1 className="text-center text-3xl mt-6">Chào Mii, cậu đã chăm chỉ thêm 1 ngày rồi nhỉ</h1>
      <p className="text-center text-text-secondary mb-6">Hôm nay thuộc hết từ vựng lum nha?</p>

      <div className="text-center">
        <button 
          className="btn btn-outline w-full max-w-[400px]" 
          onClick={() => setActiveScreen('input-screen')}
        >
          + Add Vocabulary
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div 
          className={`menu-card p-6 bg-white border-2 border-border rounded-2xl text-center cursor-pointer shadow-[0_4px_0_var(--border)] ${!canPlayMC ? 'opacity-50 cursor-not-allowed' : ''}`} 
          onClick={() => canPlayMC && setActiveScreen('mc-screen')}
        >
          <h3 className="text-primary-blue mb-2 text-xl">🎯 Multiple Choice</h3>
          <p className="text-sm text-text-secondary">Test your knowledge with 4 options.</p>
        </div>
        <div 
          className={`menu-card p-6 bg-white border-2 border-border rounded-2xl text-center cursor-pointer shadow-[0_4px_0_var(--border)] ${!hasVocab ? 'opacity-50 cursor-not-allowed' : ''}`} 
          onClick={() => hasVocab && setActiveScreen('spelling-screen')}
        >
          <h3 className="text-primary-blue mb-2 text-xl">✍️ Spelling</h3>
          <p className="text-sm text-text-secondary">Listen or read and type the exact word.</p>
        </div>
        <div 
          className={`menu-card p-6 bg-white border-2 border-border rounded-2xl text-center cursor-pointer shadow-[0_4px_0_var(--border)] ${!canPlayAudio ? 'opacity-50 cursor-not-allowed' : ''}`} 
          onClick={() => canPlayAudio && setActiveScreen('audio-screen')}
        >
          <h3 className="text-primary-blue mb-2 text-xl">🎵 Audio Match</h3>
          <p className="text-sm text-text-secondary">Catch the correct floating translation.</p>
        </div>
        <div 
          className={`menu-card p-6 bg-white border-2 border-border rounded-2xl text-center cursor-pointer shadow-[0_4px_0_var(--border)] ${!hasVocab ? 'opacity-50 cursor-not-allowed' : ''}`} 
          onClick={() => hasVocab && setActiveScreen('rush-screen')}
        >
          <h3 className="text-primary-blue mb-2 text-xl">⚡ Typing Rush</h3>
          <p className="text-sm text-text-secondary">Type fast before time runs out!</p>
        </div>
        <div 
          className={`col-span-2 md:col-span-1 menu-card p-6 bg-white border-2 border-border rounded-2xl text-center cursor-pointer shadow-[0_4px_0_var(--border)] ${!canPlaySpeaking ? 'opacity-50 cursor-not-allowed' : ''}`} 
          onClick={() => canPlaySpeaking && setActiveScreen('speaking-screen')}
        >
          <h3 className="text-primary-blue mb-2 text-xl">🗣️ Speaking Practice</h3>
          <p className="text-sm text-text-secondary">Translate sentences aloud & flip.</p>
        </div>
      </div>
    </div>
  )
}
