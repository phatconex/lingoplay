'use client';

import React, { useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import FlashcardViewer from '@/components/FlashcardViewer';
import MultipleChoice from '@/components/games/MultipleChoice';
import Spelling from '@/components/games/Spelling';
import TypingRush from '@/components/games/TypingRush';
import AudioMatch from '@/components/games/AudioMatch';
import SpeakingPractice from '@/components/games/SpeakingPractice';
import Reading from '@/components/games/Reading';
import Pronunciation from '@/components/games/Pronunciation';
import { Loader2 } from 'lucide-react';

function PracticeContent() {
  const params = useParams();
  const setId = params?.setId as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { appData } = useAppContext();

  const mode = searchParams?.get('mode') || 'mc';

  useEffect(() => {
    if (appData.vocab.length === 0) {
      router.replace(`/set/${setId}`);
    }
  }, [appData.vocab.length, setId, router]);

  if (appData.vocab.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#2845D6]" />
      </div>
    );
  }

  const games: Record<string, React.ReactNode> = {
    learn: <FlashcardViewer words={appData.vocab} loading={false} />,
    mc: <MultipleChoice />,
    spelling: <Spelling />,
    rush: <TypingRush />,
    audio: <AudioMatch />,
    speaking: <SpeakingPractice />,
    reading: <Reading />,
    pronunciation: <Pronunciation />,
  };

  if (!games[mode]) {
    router.replace(`/set/${setId}`);
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col p-4 md:p-8 animate-fade-in text-[#0D1A63]">
        {games[mode]}
    </div>
  );
}

export default function PracticePage() {
    return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 size={48} className="animate-spin text-[#2845D6]" /></div>}>
            <PracticeContent />
        </Suspense>
    );
}
