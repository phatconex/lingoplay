import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'vocabquest_data';

const initialAppData = {
  vocab: [],
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: null,
};

import { supabase } from './supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [appData, setAppData] = useState(initialAppData);
  const [activeScreen, setActiveScreen] = useState('home');
  const [activeSet, setActiveSet] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, title: '', type: '', subtitle: '', duration: 3000 });

  // Load from local storage initially
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAppData(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (appData !== initialAppData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }
  }, [appData]);

  const showFeedback = (title, type, subtitle = '', duration = 3000) => {
    setFeedback({ show: true, title, type, subtitle, duration });
    // Duration is handled by the banner component itself using useEffect timeout
  };

  const hideFeedback = () => setFeedback(prev => ({ ...prev, show: false }));

  const checkStreak = () => {
    const today = new Date().toDateString();
    setAppData(prev => {
      const lastDate = prev.lastStudyDate ? new Date(prev.lastStudyDate) : null;
      const diffDays = lastDate ? Math.ceil(Math.abs(new Date(today) - lastDate) / (1000 * 60 * 60 * 24)) : 0;
      
      if (diffDays > 1) {
        return { ...prev, streak: 0 };
      }
      return prev;
    });
  };

  const updateStreakAfterStudy = () => {
    const today = new Date().toDateString();
    setAppData(prev => {
      if (prev.lastStudyDate !== today) {
        return { ...prev, streak: prev.streak + 1, lastStudyDate: today };
      }
      return prev;
    });
  };

  const updateWordStats = (id, isCorrect) => {
    setAppData(prev => {
      const newVocab = prev.vocab.map(word => {
        if (word.id === id) {
          if (isCorrect) {
            return { ...word, mastery: Math.min(100, (word.mastery || 0) + 10) };
          } else {
            return { ...word, wrongCount: (word.wrongCount || 0) + 1 };
          }
        }
        return word;
      });
      return { ...prev, vocab: newVocab };
    });
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      appData, setAppData,
      activeScreen, setActiveScreen,
      activeSet, setActiveSet,
      feedback, showFeedback, hideFeedback,
      checkStreak, updateStreakAfterStudy, updateWordStats
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
