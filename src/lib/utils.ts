import confetti from 'canvas-confetti';

type SoundType = 'success' | 'wrong' | 'completed';

export function playSound(type: SoundType) {
    let audioSrc = '';
    if (type === 'success') {
        audioSrc = '/duolingo-correct.mp3';
    } else if (type === 'wrong') {
        audioSrc = '/duolingo-wrong.mp3';
    } else if (type === 'completed') {
        audioSrc = '/duolingo-completed-lesson.mp3';
    }
    
    if (audioSrc && typeof window !== 'undefined') {
        const audio = new Audio(audioSrc);
        audio.play().catch(e => console.error("Could not play audio:", e));
    }
}

export function fireConfetti() {
    const duration = 4000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#58CC02', '#1CB0F6', '#FF9600', '#FF0000', '#FFFF00']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#58CC02', '#1CB0F6', '#FF9600', '#FF0000', '#FFFF00']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

export function speakWord(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const msg = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        if (voices.length > 0) {
            const bestVoice = voices.find(v => 
                v.name.includes('Google US English') ||
                v.name.includes('Samantha') ||
                v.name.includes('Zira')
            );
            const usVoice = voices.find(v => v.lang === 'en-US' || v.lang === 'en_US');
            const anyEnVoice = voices.find(v => v.lang.startsWith('en'));
            
            msg.voice = bestVoice || usVoice || anyEnVoice || voices[0];
        }

        msg.lang = 'en-US';
        msg.rate = 0.9; 
        window.speechSynthesis.speak(msg);
    }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
