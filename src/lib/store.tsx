'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { supabase } from './supabase';
import { AppData, Feedback, Word } from './types';
import { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'vocavibe_data';

const initialAppData: AppData = {
  vocab: [],
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: null,
  completedModes: {},
};

interface AppContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  authLoading: boolean;
  appData: AppData;
  setAppData: Dispatch<SetStateAction<AppData>>;
  activeSet: any | null;
  setActiveSet: Dispatch<SetStateAction<any | null>>;
  feedback: Feedback;
  showFeedback: (title: string, type: string, subtitle?: string, duration?: number) => void;
  hideFeedback: () => void;
  checkStreak: () => void;
  updateStreakAfterStudy: () => void;
  updateWordStats: (id: string, isCorrect: boolean) => void;
  updateSetLastStudied: (setId: string) => Promise<void>;
  markGameCompleted: (setId: string, gameType: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appData, setAppData] = useState<AppData>(initialAppData);
  const [activeSet, setActiveSet] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ show: false, title: '', type: '', subtitle: '', duration: 3000 });

  // Load from local storage initially
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAppData(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error(e);
      }
    }
    try {
      const savedModes = JSON.parse(localStorage.getItem('vocavibe_completed_modes') || '{}');
      setAppData(prev => ({ ...prev, completedModes: savedModes }));
    } catch (e) {}
  }, []);

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync to DB helper
  const syncProfileToDB = async (userId: string, streak: number, lastStudyDate: string | null, xp: number) => {
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

  // Load profile from DB
  const loadProfileFromDB = async (userId: string) => {
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

  useEffect(() => {
    if (!user) return;
    loadProfileFromDB(user.id);
  }, [user]);

  // Save to localStorage on changes
  useEffect(() => {
    if (typeof window !== 'undefined' && appData !== initialAppData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }
  }, [appData]);

  const showFeedback = (title: string, type: string, subtitle = '', duration = 3000) => {
    setFeedback({ show: true, title, type, subtitle, duration });
  };

  const hideFeedback = () => setFeedback(prev => ({ ...prev, show: false }));

  const checkStreak = () => {
    setAppData(prev => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastDate = prev.lastStudyDate ? new Date(prev.lastStudyDate) : null;
      if (lastDate) lastDate.setHours(0, 0, 0, 0);
      const diffDays = lastDate ? Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      if (diffDays > 1) {
        if (user) syncProfileToDB(user.id, 0, prev.lastStudyDate, prev.xp);
        return { ...prev, streak: 0 };
      }
      return prev;
    });
  };

  const updateStreakAfterStudy = () => {
    const todayStr = new Date().toDateString();
    setAppData(prev => {
      if (prev.lastStudyDate === todayStr) return prev;
      const newStreak = (prev.streak || 0) + 1;
      const next = { ...prev, streak: newStreak, lastStudyDate: todayStr };
      if (user) syncProfileToDB(user.id, newStreak, todayStr, prev.xp);
      return next;
    });
  };

  const updateWordStats = (id: string, isCorrect: boolean) => {
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

  const updateSetLastStudied = async (setId: string) => {
    if (!user || !setId) return;

    const SRS_INTERVALS = [0, 1, 2, 4, 7, 30];

    const { data: currentData, error: fetchError } = await supabase
      .from('vocabulary_sets')
      .select('review_count')
      .eq('id', setId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('SRS: Failed to fetch current review_count:', fetchError);
      return;
    }

    const currentCount = currentData?.review_count ?? 0;
    const newCount = currentCount + 1;
    const daysUntilNext = SRS_INTERVALS[newCount] ?? 30;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNext);

    const { error } = await supabase
      .from('vocabulary_sets')
      .update({
        last_studied: new Date().toISOString(),
        review_count: newCount,
        study_count: newCount,
        next_review: nextReviewDate.toISOString()
      })
      .eq('id', setId)
      .eq('user_id', user.id);

    if (error) console.error('SRS Update Error:', error);
  };

  const markGameCompleted = async (setId: string, gameType: string) => {
    if (!setId) return;
    const today = new Date().toDateString();
    const MODES_KEY = 'vocavibe_completed_modes';
    let progress: Record<string, any> = {};
    
    if (typeof window !== 'undefined') {
        try {
            progress = JSON.parse(localStorage.getItem(MODES_KEY) || '{}');
        } catch (e) {}
    }

    let setProg = progress[setId] ? { ...progress[setId] } : { date: today, mc: false, spelling: false };

    if (setProg.date !== today) {
        setProg = { date: today, mc: false, spelling: false };
    }

    const wasCompletedToday = setProg.mc && setProg.spelling;

    setProg[gameType] = true;
    progress[setId] = setProg;

    if (typeof window !== 'undefined') {
        localStorage.setItem(MODES_KEY, JSON.stringify(progress));
    }
    
    setAppData(prev => ({ ...prev, completedModes: { ...progress } }));

    if (setProg.mc && setProg.spelling && !wasCompletedToday) {
        await updateSetLastStudied(setId);
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      authLoading,
      appData, setAppData,
      activeSet, setActiveSet,
      feedback, showFeedback, hideFeedback,
      checkStreak, updateStreakAfterStudy, updateWordStats, updateSetLastStudied, markGameCompleted
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
