import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const STORAGE_KEY = 'vocavibe_data';

const initialAppData = {
  vocab: [],
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: null,
};

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [appData, setAppData] = useState(initialAppData);
  const [activeScreen, setActiveScreen] = useState('home');
  const [activeSet, setActiveSet] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, title: '', type: '', subtitle: '', duration: 3000 });

  // Load from local storage initially (fast cache while DB loads)
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

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // When user logs in, load streak/xp from Supabase profiles (source of truth)
  useEffect(() => {
    if (!user) return;
    loadProfileFromDB(user.id);
  }, [user]);

  const loadProfileFromDB = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('streak, last_study_date, xp')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Could not load profile, using local cache:', error.message);
      return;
    }

    if (data) {
      setAppData(prev => ({
        ...prev,
        streak: data.streak ?? prev.streak,
        lastStudyDate: data.last_study_date ?? prev.lastStudyDate,
        xp: data.xp ?? prev.xp,
      }));
    }
  };

  // Save to localStorage on every change (fast fallback cache)
  useEffect(() => {
    if (appData !== initialAppData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }
  }, [appData]);

  // Sync streak/xp to Supabase profiles table
  const syncProfileToDB = async (userId, streak, lastStudyDate, xp) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        streak,
        last_study_date: lastStudyDate,
        xp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) console.error('Failed to sync profile to DB:', error);
  };

  const showFeedback = (title, type, subtitle = '', duration = 3000) => {
    setFeedback({ show: true, title, type, subtitle, duration });
  };

  const hideFeedback = () => setFeedback(prev => ({ ...prev, show: false }));

  // Called on Home load — resets streak if user missed more than 1 day
  const checkStreak = () => {
    setAppData(prev => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastDate = prev.lastStudyDate ? new Date(prev.lastStudyDate) : null;
      if (lastDate) lastDate.setHours(0, 0, 0, 0);
      const diffDays = lastDate ? Math.floor((today - lastDate) / (1000 * 60 * 60 * 24)) : 0;

      if (diffDays > 1) {
        // Missed a day — reset streak
        if (user) syncProfileToDB(user.id, 0, prev.lastStudyDate, prev.xp);
        return { ...prev, streak: 0 };
      }
      return prev;
    });
  };

  // Called after finishing any study session
  const updateStreakAfterStudy = () => {
    const todayStr = new Date().toDateString();
    setAppData(prev => {
      if (prev.lastStudyDate === todayStr) return prev; // Already studied today
      const newStreak = (prev.streak || 0) + 1;
      const next = { ...prev, streak: newStreak, lastStudyDate: todayStr };
      if (user) syncProfileToDB(user.id, newStreak, todayStr, prev.xp);
      return next;
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

  const updateSetLastStudied = async (setId, currentCount = 0) => {
    if (!user) return;

    const SRS_INTERVALS = [0, 1, 2, 4, 7, 30];
    const newCount = (currentCount || 0) + 1;
    const daysUntilNext = SRS_INTERVALS[newCount] ?? 30;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNext);

    console.log(`SRS: Set ${setId}, Lần ${newCount}, tiếp theo sau ${daysUntilNext} ngày`);

    const { data, error } = await supabase
      .from('vocabulary_sets')
      .update({
        last_studied: new Date().toISOString(),
        review_count: newCount,
        study_count: newCount,
        next_review: nextReviewDate.toISOString()
      })
      .eq('id', setId)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('SRS Update Error:', error);
    } else if (data && data.length > 0) {
      console.log('SRS updated successfully:', data[0]);
    } else {
      console.warn('SRS: No rows updated. Check RLS policies.');
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      appData, setAppData,
      activeScreen, setActiveScreen,
      activeSet, setActiveSet,
      feedback, showFeedback, hideFeedback,
      checkStreak, updateStreakAfterStudy, updateWordStats, updateSetLastStudied
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
