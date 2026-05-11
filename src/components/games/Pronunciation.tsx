'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { speakWord } from '@/lib/utils';
import { Mic, MicOff, Volume2, ChevronRight, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PhonemeResult {
  Phoneme: string;
  PronunciationAssessment: {
    AccuracyScore: number;
    NBestPhonemes?: { Phoneme: string; Score: number }[];
  };
}

interface WordResult {
  Word: string;
  PronunciationAssessment: {
    AccuracyScore: number;
    ErrorType: string; // 'None' | 'Omission' | 'Insertion' | 'Mispronunciation'
  };
  Phonemes?: PhonemeResult[];
}

interface AssessmentResult {
  AccuracyScore: number;
  FluencyScore: number;
  CompletenessScore: number;
  PronScore: number;
  Words: WordResult[];
}

type SessionStatus = 'idle' | 'recording' | 'processing' | 'result' | 'done';

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 85) return '#22c55e'; // green
  if (score >= 65) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Tuyệt vời!';
  if (score >= 65) return 'Khá tốt';
  return 'Cần luyện thêm';
}

function scoreEmoji(score: number): string {
  if (score >= 90) return '🏆';
  if (score >= 80) return '⭐';
  if (score >= 65) return '👍';
  return '💪';
}

// ── Audio Recorder using raw PCM → WAV ────────────────────────────────────────

async function encodeToWav(blob: Blob): Promise<Blob> {
  const arrayBuf = await blob.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 16000 });
  const decoded = await ctx.decodeAudioData(arrayBuf);
  const samples = decoded.getChannelData(0);

  const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(wavBuffer);

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  const write16 = (off: number, v: number) => view.setInt16(off, v, true);
  const write32 = (off: number, v: number) => view.setUint32(off, v, true);

  writeStr(0, 'RIFF');
  write32(4, 36 + samples.length * 2);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  write32(16, 16);
  write16(20, 1); // PCM
  write16(22, 1); // mono
  write32(24, 16000); // sampleRate
  write32(28, 16000 * 2); // byteRate
  write16(32, 2); // blockAlign
  write16(34, 16); // bitsPerSample
  writeStr(36, 'data');
  write32(40, samples.length * 2);

  for (let i = 0; i < samples.length; i++) {
    write16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff);
  }

  await ctx.close();
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

// ── Score Arc SVG ─────────────────────────────────────────────────────────────

function ScoreArc({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#E8EBF5" strokeWidth="10"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="central"
        fill={color} fontWeight="900"
        fontSize={size * 0.22}
        className="rotate-90"
        style={{ transform: `rotate(90deg) translate(0, 0)`, transformOrigin: 'center' }}
      />
    </svg>
  );
}

// ── Phoneme Bar ────────────────────────────────────────────────────────────────

function PhonemeBar({ phoneme, score }: { phoneme: string; score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-1 min-w-[36px]">
      <div className="w-8 h-16 bg-[#E8EBF5] rounded-full overflow-hidden flex items-end">
        <div
          className="w-full rounded-full transition-all duration-700"
          style={{ height: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-black text-[#0D1A63] font-mono">{phoneme}</span>
      <span className="text-[10px] font-bold" style={{ color }}>{Math.round(score)}</span>
    </div>
  );
}



// ── Main Component ─────────────────────────────────────────────────────────────

export default function Pronunciation() {
  const router = useRouter();
  const params = useParams();
  const setId = params?.setId as string;
  const { appData } = useAppContext();

  const words = appData.vocab;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  // Audio references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recordedSamplesRef = useRef<Float32Array[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const currentWord = words[currentIdx];
  const isLast = currentIdx === words.length - 1;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
  };

  const startRecording = async () => {
    setError(null);
    setResult(null);
    setRecordingSeconds(0);
    recordedSamplesRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true } });
      
      // Setup Audio Context at exactly 16000Hz so Azure is happy
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      sourceRef.current = audioCtx.createMediaStreamSource(stream);
      
      // Standard legacy 4096 buffer processor for universal compat
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // We must make a copy because inputBuffer is recycled
        recordedSamplesRef.current.push(new Float32Array(inputData));
      };

      sourceRef.current.connect(processor);
      processor.connect(audioCtx.destination);

      setStatus('recording');

      let secs = 0;
      timerRef.current = setInterval(() => {
        secs++;
        setRecordingSeconds(secs);
        if (secs >= 10) stopRecording(); // auto stop at 10s
      }, 1000);

    } catch (err: any) {
      console.error('Mic access error:', err);
      setError('Không thể truy cập microphone. Vui lòng cấp quyền microphone cho trình duyệt.');
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('processing');

    // Collect samples before destroying ctx
    const chunks = recordedSamplesRef.current;
    
    // Stop all tracks
    if (sourceRef.current && sourceRef.current.mediaStream) {
      sourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
    }
    cleanupAudio();

    if (chunks.length === 0) {
      setError('Không bắt được âm thanh nào.');
      setStatus('idle');
      return;
    }

    // Flatten the float buffers
    const totalLen = chunks.reduce((acc, arr) => acc + arr.length, 0);
    const samples = new Float32Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }

    try {
      // Directly convert gathered float32 samples into WAV Blob bypassing async decode issues!
      const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(wavBuffer);

      const writeStr = (off: number, s: string) => {
        for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
      };
      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + samples.length * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, 16000, true); // 16khz
      view.setUint32(28, 16000 * 2, true); // bytes/sec
      view.setUint16(32, 2, true); // block align
      view.setUint16(34, 16, true); // bits/sample
      writeStr(36, 'data');
      view.setUint32(40, samples.length * 2, true);

      // Fill payload clamped from -1 to 1 and scaled to 16 bit signed INT
      for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }

      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      
      const fd = new FormData();
      fd.append('audio', wavBlob, 'audio.wav');
      fd.append('referenceText', currentWord.word || currentWord.en);

      const resp = await fetch('/api/pronunciation', { method: 'POST', body: fd });
      const json = await resp.json();

      console.log('[Pronunciation] API status:', resp.status, 'JSON:', json);

      if (!resp.ok || json.error) {
        throw new Error(json.error || `Server error ${resp.status}`);
      }

      // Bulletproof dynamic mapper to handle BOTH nested and flattened schemas returned by Azure
      const nb0 = json?.NBest?.[0] || {};
      
      // 1. Extract overall assessment scores
      // Try direct properties first (our logs show this), fallback to nested
      const pronScore = nb0.PronScore ?? nb0.PronunciationAssessment?.PronScore ?? 0;
      const accScore = nb0.AccuracyScore ?? nb0.PronunciationAssessment?.AccuracyScore ?? 0;
      const fluScore = nb0.FluencyScore ?? nb0.PronunciationAssessment?.FluencyScore ?? 0;
      const compScore = nb0.CompletenessScore ?? nb0.PronunciationAssessment?.CompletenessScore ?? 0;
      
      // Wait, let's verify we found the core data!
      // Note: Azure doesn't always call the overall object 'PronunciationAssessment' if it flattens it!
      const hasValidData = (nb0.PronScore !== undefined) || (nb0.PronunciationAssessment !== undefined);

      if (!hasValidData) {
        console.error('[Pronunciation] Azure Response failed structural mapping:', json);
        throw new Error(`Không tìm thấy dữ liệu đánh giá. Azure status: ${json?.RecognitionStatus || 'Unknown'}.`);
      }

      // 2. Map individual words robustly
      const rawWords = nb0.Words || [];
      const wordsArr: WordResult[] = rawWords.map((rw: any) => {
        // Capture nested or flattened word assessment
        const wAcc = rw.AccuracyScore ?? rw.PronunciationAssessment?.AccuracyScore ?? 0;
        const wErr = rw.ErrorType ?? rw.PronunciationAssessment?.ErrorType ?? 'None';
        
        // 3. Map Phonemes (Logs indicate Azure returns array directly! But sometimes called PronunciationAssessment inside)
        const rawPhonemes = rw.Phonemes || rw.PronunciationAssessment?.Phonemes || [];
        const mappedPhonemes: PhonemeResult[] = Array.isArray(rawPhonemes) ? rawPhonemes.map((rp: any) => {
          const phScore = rp.AccuracyScore ?? rp.PronunciationAssessment?.AccuracyScore ?? 0;
          return {
            Phoneme: rp.Phoneme || '',
            PronunciationAssessment: { AccuracyScore: phScore }
          };
        }) : [];

        return {
          Word: rw.Word || '',
          PronunciationAssessment: {
            AccuracyScore: wAcc,
            ErrorType: wErr
          },
          Phonemes: mappedPhonemes
        };
      });

      const assessment: AssessmentResult = {
        AccuracyScore: accScore,
        FluencyScore: fluScore,
        CompletenessScore: compScore,
        PronScore: pronScore,
        Words: wordsArr,
      };

      setResult(assessment);
      setScores(prev => [...prev, assessment.PronScore]);
      setStatus('result');
    } catch (err: any) {
      console.error('[Pronunciation] Handled catch:', err);
      setError(err.message || 'Lỗi hệ thống khi kết nối API.');
      setStatus('idle');
    }
  };

  const handleNext = () => {
    if (result && result.PronScore >= 70) setCorrectCount(c => c + 1);
    if (isLast) {
      setStatus('done');
    } else {
      setCurrentIdx(i => i + 1);
      setStatus('idle');
      setResult(null);
      setError(null);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setStatus('idle');
    setResult(null);
    setError(null);
    setCorrectCount(0);
    setScores([]);
  };

  // ── Done Screen ──

  if (status === 'done' || (words.length > 0 && currentIdx >= words.length)) {
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return (
      <div className="flex flex-col flex-1 items-center justify-center animate-fade-in text-[#0D1A63] px-4 text-center gap-6">
        <div className="text-7xl">{scoreEmoji(avgScore)}</div>
        <h2 className="text-4xl font-black">Hoàn thành!</h2>
        <p className="text-lg font-bold text-[#5C6A9C]">
          Phát âm đúng <span className="text-[#2845D6] font-black text-2xl">{correctCount}</span> / {words.length} từ
        </p>

        <div className="flex items-center justify-center gap-6 bg-white rounded-3xl p-6 shadow-lg border-2 border-slate-100 w-full max-w-sm">
          <div className="text-center">
            <div className="text-4xl font-black" style={{ color: scoreColor(avgScore) }}>{avgScore}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Điểm TB</div>
          </div>
          <div className="w-px h-12 bg-slate-100" />
          <div className="text-center">
            <div className="text-4xl font-black text-[#0D1A63]">{words.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Từ đã luyện</div>
          </div>
        </div>

        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => router.push(`/set/${setId}`)}
            className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
          >
            Thoát
          </button>
          <button
            onClick={handleRestart}
            className="flex-[2] py-4 font-black text-white bg-[#2845D6] rounded-2xl shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> Luyện lại
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  const pronScore = result?.PronScore ?? 0;
  const progress = ((currentIdx + 1) / words.length) * 100;

  return (
    <div className="flex flex-col flex-1 animate-fade-in text-[#0D1A63] max-w-2xl mx-auto w-full">

      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          className="py-2 px-4 text-sm font-bold border-2 border-slate-200 text-slate-500 rounded-xl hover:border-[#2845D6] hover:text-[#2845D6] transition-all"
          onClick={() => router.push(`/set/${setId}`)}
        >
          Thoát
        </button>
        <div className="flex-1 h-3 bg-[#E8EBF5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2845D6] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-extrabold text-slate-400 shrink-0">
          {currentIdx + 1} / {words.length}
        </span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-[32px] border-2 border-slate-100 shadow-[0_8px_30px_rgba(13,26,99,0.08)] p-8 flex flex-col items-center gap-6 mb-6">

        <span className="text-xs font-extrabold text-[#5C6A9C] uppercase tracking-widest">🎤 Luyện phát âm</span>

        {/* Word display */}
        <div className="text-center">
          <h2 className="text-5xl font-black text-[#0D1A63] mb-1">{currentWord.word || currentWord.en}</h2>
          {currentWord.part_of_speech && (
            <span className="text-sm bg-[#E8EBF5] text-[#2845D6] px-3 py-1 rounded-full font-bold italic uppercase tracking-wider">
              {currentWord.part_of_speech}
            </span>
          )}
          <p className="text-[#5C6A9C] font-bold mt-3 text-lg">{currentWord.meaning || currentWord.vi}</p>
        </div>

        {/* Listen button */}
        <button
          onClick={() => speakWord(currentWord.word || currentWord.en)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E8EBF5] hover:bg-[#2845D6] hover:text-white text-[#2845D6] rounded-full font-bold transition-all text-sm"
        >
          <Volume2 size={16} /> Nghe mẫu
        </button>

        {/* Result: word-level feedback */}
        {status === 'result' && result && (
          <div className="w-full animate-fade-in">
            {/* Score Arc */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90 absolute inset-0">
                  <circle cx="56" cy="56" r="46" fill="none" stroke="#E8EBF5" strokeWidth="10" />
                  <circle
                    cx="56" cy="56" r="46" fill="none"
                    stroke={scoreColor(pronScore)} strokeWidth="10"
                    strokeDasharray={`${(pronScore / 100) * 2 * Math.PI * 46} ${2 * Math.PI * 46}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="flex flex-col items-center z-10">
                  <span className="text-3xl font-black" style={{ color: scoreColor(pronScore) }}>{Math.round(pronScore)}</span>
                  <span className="text-[10px] font-bold text-slate-400 -mt-1">/ 100</span>
                </div>
              </div>
              <span className="font-black text-lg mt-1" style={{ color: scoreColor(pronScore) }}>
                {scoreEmoji(pronScore)} {scoreLabel(pronScore)}
              </span>
            </div>

            {/* Score bars */}
            <div className="grid grid-cols-3 gap-3 mb-5 bg-[#F8FAFC] rounded-2xl p-4 border border-slate-100">
              {[
                { label: 'Độ chính xác', val: result.AccuracyScore },
                { label: 'Hoàn thiện', val: result.CompletenessScore },
                { label: 'Lưu loát', val: result.FluencyScore },
              ].map(({ label, val }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-xl font-black" style={{ color: scoreColor(val) }}>{Math.round(val)}</span>
                  <span className="text-[10px] font-bold text-slate-400 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* ELSA-Style Phonetic Visualizer */}
            <div className="w-full flex flex-wrap justify-center items-baseline gap-x-6 gap-y-8 mb-8 mt-4 px-4">
              {result.Words.map((w, wordIdx) => {
                const wordScore = w.PronunciationAssessment.AccuracyScore;
                const wordError = w.PronunciationAssessment.ErrorType;
                // ELSA uses standard green for correct words
                const wordColor = wordError === 'Omission' ? '#94a3b8' : scoreColor(wordScore);

                return (
                  <div 
                    key={wordIdx} 
                    className="flex flex-col items-center relative group"
                  >
                    {/* Top: Real Word with Underline */}
                    <div className="relative mb-1">
                      <span 
                        className={`text-3xl md:text-4xl font-bold tracking-tight transition-colors duration-300 ${wordError === 'Omission' ? 'line-through opacity-40' : ''}`}
                        style={{ color: wordColor }}
                      >
                        {w.Word}
                      </span>
                      <div 
                        className="w-full h-0.5 rounded-full opacity-50 mt-0.5" 
                        style={{ backgroundColor: wordColor }} 
                      />
                    </div>

                    {/* Bottom: Phonetic transcription enclosed in slashes like /text/ */}
                    {w.Phonemes && w.Phonemes.length > 0 ? (
                      <div className="flex items-center text-lg md:text-xl font-mono font-bold tracking-wide bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 mt-1">
                        <span className="text-slate-300 mr-0.5">/</span>
                        {w.Phonemes.map((ph, phIdx) => {
                          const phScore = ph.PronunciationAssessment.AccuracyScore;
                          const phColor = scoreColor(phScore);
                          
                          return (
                            <span 
                              key={phIdx}
                              title={`Điểm: ${Math.round(phScore)}`}
                              className="cursor-help relative px-[1px] hover:scale-125 transition-transform inline-block"
                              style={{ color: phColor }}
                            >
                              {ph.Phoneme}
                            </span>
                          );
                        })}
                        <span className="text-slate-300 ml-0.5">/</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-300 italic mt-1">/ ? /</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl px-5 py-4 text-red-700 font-bold text-sm text-center animate-fade-in">
            {error}
          </div>
        )}
      </div>

      {/* Recording controls */}
      <div className="mt-auto">
        {status === 'idle' && (
          <div className="flex gap-3">
            <button
              onClick={startRecording}
              className="flex-[3] py-5 font-black text-xl text-white bg-[#2845D6] rounded-2xl shadow-[0_6px_0_#0D1A63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
            >
              <Mic size={24} /> Bắt đầu nói
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-5 font-bold text-[#5C6A9C] bg-white border-2 border-slate-200 hover:border-[#2845D6] hover:text-[#2845D6] rounded-2xl shadow-[0_4px_0_#E2E8F0] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isLast ? 'Xong' : <>Bỏ qua <ChevronRight size={20} /></>}
            </button>
          </div>
        )}

        {status === 'recording' && (
          <button
            onClick={stopRecording}
            className="w-full py-5 font-black text-xl text-white bg-[#D33D3D] rounded-2xl shadow-[0_6px_0_#A30000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 animate-pulse"
          >
            <MicOff size={24} />
            Dừng lại ({recordingSeconds}s)
          </button>
        )}

        {status === 'processing' && (
          <div className="w-full py-5 font-black text-xl text-white bg-[#5C6A9C] rounded-2xl flex items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin" /> Đang phân tích...
          </div>
        )}

        {status === 'result' && (
          <div className="flex gap-3">
            <button
              onClick={() => { setStatus('idle'); setResult(null); setError(null); }}
              className="flex-1 py-4 font-bold text-[#2845D6] bg-[#E8EBF5] hover:bg-[#dce1f4] rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Thử lại
            </button>
            <button
              onClick={handleNext}
              className="flex-[2] py-4 font-black text-white bg-[#2845D6] rounded-2xl shadow-[0_4px_0_#0D1A63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {isLast ? '🎉 Hoàn thành' : <>Từ tiếp theo <ChevronRight size={20} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
