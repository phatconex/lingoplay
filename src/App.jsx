import React, { useEffect } from 'react'
import { useAppContext } from './lib/store'

import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Home from './components/Home'
import VocabView from './components/VocabView'
import InputScreen from './components/InputScreen'
import MultipleChoice from './components/games/MultipleChoice'
import Spelling from './components/games/Spelling'
import AudioMatch from './components/games/AudioMatch'
import TypingRush from './components/games/TypingRush'
import SpeakingPractice from './components/games/SpeakingPractice'
import FeedbackBanner from './components/FeedbackBanner'

export default function App() {
  const { user, activeScreen } = useAppContext();

  // Handle default screen when user logs in if they are on a dead screen
  const safeScreen = activeScreen === 'dashboard' ? 'vocab' : activeScreen;

  if (user === null) {
      return (
          <>
             <Login />
             <FeedbackBanner />
          </>
      )
  }

  const renderScreen = () => {
    switch (safeScreen) {
      case 'home': return <Home />
      case 'vocab': return <VocabView />
      case 'input-screen': return <InputScreen />
      case 'mc-screen': return <MultipleChoice />
      case 'spelling-screen': return <Spelling />
      case 'audio-screen': return <AudioMatch />
      case 'rush-screen': return <TypingRush />
      case 'speaking-screen': return <SpeakingPractice />
      default: return <Home />
    }
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden text-text-primary">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative p-4 md:p-8">
        {renderScreen()}
      </div>

      <FeedbackBanner />
    </div>
  )
}

