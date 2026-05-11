import React, { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../lib/store';
import FlashcardViewer from '../components/FlashcardViewer';
import MultipleChoice from '../components/games/MultipleChoice';
import Spelling from '../components/games/Spelling';
import TypingRush from '../components/games/TypingRush';
import AudioMatch from '../components/games/AudioMatch';
import SpeakingPractice from '../components/games/SpeakingPractice';
import Reading from '../components/games/Reading';
import { Loader2 } from 'lucide-react';

export default function PracticePage() {
  const { setId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { appData } = useAppContext();

  const mode = searchParams.get('mode') || 'mc';

  // If vocab hasn't been loaded (e.g., direct URL navigation), redirect to set page to load it
  useEffect(() => {
    if (appData.vocab.length === 0) {
      navigate(`/set/${setId}`, { replace: true });
    }
  }, [appData.vocab.length, setId, navigate]);

  if (appData.vocab.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#2845D6]" />
      </div>
    );
  }

  const games = {
    learn: <FlashcardViewer words={appData.vocab} loading={false} />,
    mc: <MultipleChoice />,
    spelling: <Spelling />,
    rush: <TypingRush />,
    audio: <AudioMatch />,
    speaking: <SpeakingPractice />,
    reading: <Reading />,
  };

  return games[mode] ?? <Navigate to={`/set/${setId}`} replace />;
}
