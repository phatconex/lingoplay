const STORAGE_KEY = 'vocabquest_data';

// --- State Management ---
let appData = {
  vocab: [], // { id, en, vi, mastery: 0, wrongCount: 0 }
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: null,
};

let currentSession = {
  mode: null,
  words: [],
  currentIndex: 0,
  correct: 0,
  wrong: 0,
  wrongWordsThisSession: []
};

// --- Initialization & UI update ---
function init() {
  loadData();
  checkStreak();
  updateStatsUI();
  showScreen('dashboard-screen');
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      appData = { ...appData, ...JSON.parse(saved) };
    } catch(e) {}
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  updateStatsUI();
}

function updateStatsUI() {
  // Stats UI removed
}

function checkStreak() {
  const today = new Date().toDateString();
  if (appData.lastStudyDate) {
    const lastDate = new Date(appData.lastStudyDate);
    const diffTime = Math.abs(new Date(today) - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 1) {
      // Setup for later increment if they complete a lesson
    } else if (diffDays > 1) {
      appData.streak = 0; // Lost streak
      saveData();
    }
  }
}

function updateStreakAfterStudy() {
  const today = new Date().toDateString();
  if (appData.lastStudyDate !== today) {
    appData.streak += 1;
    appData.lastStudyDate = today;
    saveData();
  }
}

function addXP(amount) {
  // Feature removed
}

// --- Navigation ---
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  hideFeedbackBanner();
  
  // Custom screen initializations
  if (screenId === 'dashboard-screen') {
    updateDashboard();
  }
}

function updateDashboard() {
  const hasVocab = appData.vocab.length > 0;
  const buttons = ['btn-mc', 'btn-spell', 'btn-audio', 'btn-rush'];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.disabled = !hasVocab;
  });
}

// --- Vocabulary Input ---
function openInputBox() {
  const currentText = appData.vocab.map(v => `${v.en}: ${v.vi}`).join('\n');
  document.getElementById('vocab-input').value = currentText;
  showScreen('input-screen');
}

function saveVocabulary() {
  const text = document.getElementById('vocab-input').value;
  const lines = text.split('\n');
  const newVocab = [];
  let added = 0;
  
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const parts = line.split(/[:-]/); // Allow : or - 
    if (parts.length >= 2) {
      const en = parts[0].trim();
      let vi = '';
      let enSentence = '';
      let viSentence = '';
      
      if (parts.length >= 4) {
          vi = parts[1].trim();
          enSentence = parts[2].trim();
          viSentence = parts.slice(3).join(':').trim();
      } else {
          vi = parts.slice(1).join(':').trim();
      }

      if (en && vi) {
        // Find existing to preserve stats if possible
        const existing = appData.vocab.find(v => v.en.toLowerCase() === en.toLowerCase());
        newVocab.push({
          id: existing ? existing.id : Date.now() + index,
          en, vi, enSentence, viSentence,
          mastery: existing ? existing.mastery : 0,
          wrongCount: existing ? existing.wrongCount : 0
        });
        added++;
      }
    }
  });

  if (added > 0) {
    appData.vocab = newVocab;
    saveData();
    showFeedback(`Saved ${added} words!`, 'success');
    showScreen('dashboard-screen');
  } else {
    showFeedback('Please use format "Word : Meaning"', 'error');
  }
}

// --- PDF Import Logic ---
async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // We'll update textarea with loading message
        const vocabInput = document.getElementById('vocab-input');
        vocabInput.value = 'Đang xử lý PDF, vui lòng đợi...';
        
        const arrayBuffer = await file.arrayBuffer();
        
        // Configure PDF.js worker
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/cmaps/',
            cMapPacked: true
        }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Reconstruct text, add space between items
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += ' ' + pageText;
        }

        // Clean up text spacing
        fullText = fullText.replace(/\s+/g, ' ');
        // Fix PDF.js spacing issues where "1." becomes "1 ."
        fullText = fullText.replace(/(\b\d+)\s+\./g, '$1.');

        // Split the text based on numbers like " 1. ", " 2. "
        const chunks = fullText.split(/\b\d+\.\s+/);

        let parsedTextForTextarea = '';

        // Process each chunk (skipping chunk 0 which is usually header/title)
        for (let i = 1; i < chunks.length; i++) {
            const chunk = chunks[i].trim();
            const parts = chunk.split(':');
            
            if (parts.length >= 2) {
                let word = parts[0].trim();
                let meaning = parts.slice(1).join(':').trim();
                
                // Remove part of speech markers like (n), (v), (adj), (adv) from the beginning of the meaning
                meaning = meaning.replace(/^\([a-z]+\)\s*/i, '');
                
                // Fallback auto-correct for standard Quizlet PDF encoding bugs on Vietnamese signs
                // Quizlet often drops characters after heavy diacritics or renders them as boxes.
                meaning = meaning.replace(/di\uFFFDc|di\[\]c|di\u25A1c|dịc(\s|$)/gi, 'dịch$1');
                meaning = meaning.replace(/phu\uFFFD|phu\[\]|phu\u25A1|phụ(\s|$)/gi, 'phục$1');
                meaning = meaning.replace(/đo\uFFFDc|đo\[\]c|đo\u25A1c|đọ(\s|$)/gi, 'đọc$1');
                meaning = meaning.replace(/thu\uFFFDc|thu\[\]c|thu\u25A1c|thuộ(\s|$)/gi, 'thuộc$1');
                meaning = meaning.replace(/viế(\s|$)/gi, 'viết$1');
                meaning = meaning.replace(/đượ(\s|$)/gi, 'được$1');
                
                if (word && meaning) {
                    parsedTextForTextarea += `${word} : ${meaning}\n`;
                }
            }
        }

        document.getElementById('pdf-input').value = ''; // reset file input

        if (parsedTextForTextarea.trim() === '') {
            // Unrecognized format, dump raw text
            vocabInput.value = fullText.trim();
            alert('Đã đọc PDF, nhưng không nhận diện được định dạng (Format chuẩn: 1. Word: Nghĩa). Bạn có thể chỉnh sửa thủ công dưới đây.');
        } else {
            // Automatically fill the text area so user can review and hit Save
            vocabInput.value = parsedTextForTextarea.trim();
            showFeedbackBanner('Thành công', 'success', 'Đã bóc tách từ vựng từ PDF. Vui lòng kiểm tra và ấn Lưu.');
        }

    } catch (error) {
        console.error("PDF Parsing Error:", error);
        document.getElementById('vocab-input').value = '';
        alert('Có lỗi khi đọc file PDF. Định dạng không được hỗ trợ.');
        document.getElementById('pdf-input').value = ''; // reset
    }
}

// --- Multiple Choice Game ---
function startMultipleChoice(wordsToUse = null) {
  if (appData.vocab.length < 4) {
    showFeedback('Need at least 4 words in vocabulary list.', 'error');
    return;
  }
  
  let pool = wordsToUse || [...appData.vocab];
  // Shuffle words
  pool.sort(() => Math.random() - 0.5);
  // Take all words for this session
  currentSession.words = [...pool];
  currentSession.mode = 'mc';
  currentSession.currentIndex = 0;
  currentSession.totalWords = pool.length;
  currentSession.correctAnswers = 0;
  currentSession.wrongWordsThisSession = [];
  
  showScreen('mc-screen');
  loadMultipleChoiceQuestion();
}

function loadMultipleChoiceQuestion() {
  if (currentSession.currentIndex >= currentSession.words.length) {
    endSession();
    return;
  }
  
  const progressPct = (currentSession.correctAnswers / currentSession.totalWords) * 100;
  document.getElementById('mc-progress').style.width = `${progressPct}%`;
  
  const currentWord = currentSession.words[currentSession.currentIndex];
  document.getElementById('mc-word').innerText = currentWord.en;

  const label = document.querySelector('#mc-screen .text-secondary');
  if (currentWord.isRetry) {
      label.innerHTML = '🔄 LÀM LẠI NÀO';
      label.style.color = 'var(--primary-orange)';
  } else {
      label.innerHTML = 'SELECT THE CORRECT MEANING';
      label.style.color = 'var(--text-secondary)';
  }
  
  // Generate Options
  const options = [currentWord];
  const others = [...appData.vocab].filter(v => v.id !== currentWord.id);
  others.sort(() => Math.random() - 0.5);
  
  for(let i=0; i<3 && i<others.length; i++) {
    options.push(others[i]);
  }
  options.sort(() => Math.random() - 0.5);
  
  const grid = document.getElementById('mc-options');
  grid.innerHTML = '';
  options.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.innerText = opt.vi;
    card.onclick = () => checkMultipleChoice(opt.id, currentWord.id, card);
    grid.appendChild(card);
  });
}

function checkMultipleChoice(selectedId, correctId, element) {
    // Prevent multiple clicks
    // Prevent multiple clicks
    if (document.querySelector('.option-card.correct') || document.querySelector('.option-card.wrong')) return;
    
    if (selectedId === correctId) {
        currentSession.correctAnswers++;
        element.classList.add('correct');
        playSound('success');
        showFeedbackBanner('Correct!', 'success', 'Good job!');
        setTimeout(() => {
            currentSession.currentIndex++;
            addXP(10);
            hideFeedbackBanner();
            loadMultipleChoiceQuestion();
        }, 1500);
    } else {
        element.classList.add('wrong');
        playSound('wrong');
        showFeedbackBanner('Wrong!', 'error', 'Correct answer was marked.');
        const currentWord = currentSession.words[currentSession.currentIndex];
        
        // Mark the correct one
        const allCards = document.querySelectorAll('.option-card');
        allCards.forEach(c => {
           if(c.innerText === currentWord.vi) c.classList.add('correct'); 
        });

        // Add to weak words
        updateWordStats(currentWord.id, false);
        currentSession.wrongWordsThisSession.push(currentWord);

        // Re-insert 3 words later for spaced repetition
        let insertIndex = currentSession.currentIndex + 4;
        if (insertIndex > currentSession.words.length) insertIndex = currentSession.words.length;
        currentSession.words.splice(insertIndex, 0, { ...currentWord, isRetry: true });

        setTimeout(() => {
            currentSession.currentIndex++;
            hideFeedbackBanner();
            loadMultipleChoiceQuestion();
        }, 2000);
    }
}

// --- Utilities & Feedback ---
function showFeedback(msg, type) {
    showFeedbackBanner(type === 'error' ? 'Lỗi' : 'Thông báo', type, msg);
}

let feedbackTimeout = null;

function showFeedbackBanner(title, type, subtitle = '', duration = 3000) {
    const banner = document.getElementById('feedback-banner');
    const msg = document.getElementById('feedback-message-text');
    
    banner.className = `feedback-banner show ${type}`;
    let icon = type === 'success' ? '✔️' : '❌';
    msg.innerHTML = `<div style="display:flex;align-items:center;line-height:1;">${icon} ${title} <span style="font-size:16px;font-weight:normal;margin-left:10px;display:flex;align-items:center;">${subtitle}</span></div>`;

    // Clear any previous timeout to reset the timer
    if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
    }

    // Auto-hide the banner after duration so it doesn't get stuck
    feedbackTimeout = setTimeout(() => {
        hideFeedbackBanner();
    }, duration);
}

function hideFeedbackBanner() {
    document.getElementById('feedback-banner').className = 'feedback-banner';
}

function updateWordStats(id, isCorrect) {
    const word = appData.vocab.find(v => v.id === id);
    if(word) {
        if(isCorrect) word.mastery = Math.min(100, word.mastery + 10);
        else word.wrongCount = (word.wrongCount || 0) + 1;
        saveData();
    }
}

function endSession() {
  updateStreakAfterStudy();
  if (currentSession.wrongWordsThisSession.length === 0) {
     fireConfetti();
     playSound('completed');
  }
  showScreen('dashboard-screen');
}

// --- Audio & Confetti ---
function playSound(type) {
    let audioSrc = '';
    if (type === 'success') {
        audioSrc = 'duolingo-correct.mp3';
    } else if (type === 'wrong') {
        audioSrc = 'duolingo-wrong.mp3';
    } else if (type === 'completed') {
        audioSrc = 'duolingo-completed-lesson.mp3';
    }
    
    if (audioSrc) {
        const audio = new Audio(audioSrc);
        // Play and handle potential browser autoplay restrictions smoothly
        audio.play().catch(e => console.error("Could not play audio:", e));
    }
}

function fireConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['var(--primary-green)', 'var(--primary-blue)', 'var(--primary-orange)', '#FF0000', '#FFFF00'];
    
    for (let i = 0; i < 50; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
        conf.style.animationDelay = (Math.random() * 0.5) + 's';
        container.appendChild(conf);
    }
    
    setTimeout(() => { container.innerHTML = ''; }, 4000);
}

function speakWord(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop playing previous words to avoid overlap
        
        const msg = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Find a natural English voice if possible (Google Chrome, macOS, Windows respectively)
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

// Pre-load voices on browser start (required for Chrome to not use default robot voice initially)
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// --- Spelling Practice ---
function startSpelling() {
    if (appData.vocab.length === 0) return;
    
    let pool = [...appData.vocab].sort(() => Math.random() - 0.5);
    // Take all words
    currentSession.words = [...pool];
    currentSession.mode = 'spell';
    currentSession.currentIndex = 0;
    currentSession.totalWords = pool.length;
    currentSession.correctAnswers = 0;
    currentSession.wrongWordsThisSession = [];
    
    showScreen('spelling-screen');
    loadSpellingQuestion();
}

function loadSpellingQuestion() {
    if (currentSession.currentIndex >= currentSession.words.length) {
        endSession();
        return;
    }
    
    const progressPct = (currentSession.correctAnswers / currentSession.totalWords) * 100;
    document.getElementById('spell-progress').style.width = `${progressPct}%`;
    
    const currentWord = currentSession.words[currentSession.currentIndex];
    document.getElementById('spell-meaning').innerText = currentWord.vi;
    
    const label = document.querySelector('#spelling-screen .text-secondary');
    if (currentWord.isRetry) {
        label.innerHTML = '🔄 LÀM LẠI NÀO';
        label.style.color = 'var(--primary-orange)';
    } else {
        label.innerHTML = 'TRANSLATE THIS WORD';
        label.style.color = 'var(--text-secondary)';
    }
    
    const input = document.getElementById('spell-input');
    input.value = '';
    input.className = 'spell-input';
    input.focus();
    
    input.onkeyup = (e) => {
        if (e.key === 'Enter') {
            checkSpelling(input.value.trim(), currentWord);
        }
    };
    
    document.getElementById('spell-check-btn').onclick = () => {
        checkSpelling(input.value.trim(), currentWord);
    };
}

function getSpellingDiffHtml(userAns, correctAns) {
    let u = userAns.toLowerCase();
    let c = correctAns.toLowerCase();
    
    // DP table for LCS
    let dp = Array(u.length + 1).fill(0).map(() => Array(c.length + 1).fill(0));
    for (let i = 1; i <= u.length; i++) {
        for (let j = 1; j <= c.length; j++) {
            if (u[i - 1] === c[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    // Backtrack to build representation
    let i = u.length;
    let j = c.length;
    let matches = 0;
    
    let result = [];
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && u[i - 1] === c[j - 1]) {
            result.push(`<span style="color: #58CC02;">${correctAns[j - 1]}</span>`); // Correct character
            matches++;
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            // Missing in userAns
            result.push(`<span style="color: #FF4B4B; text-decoration: underline; font-weight: 900;">${correctAns[j - 1]}</span>`);
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            // Extra in userAns
            result.push(`<span style="color: #A0A0A0; text-decoration: line-through; padding: 0 2px;">${userAns[i - 1]}</span>`);
            i--;
        }
    }
    
    let html = result.reverse().join('');
    let percent = Math.round((matches / Math.max(u.length, c.length)) * 100);
    return { html, percent };
}

function checkSpelling(value, currentWord) {
    const input = document.getElementById('spell-input');
    const correctAns = currentWord.en.toLowerCase();
    const userAns = value.toLowerCase();

    speakWord(currentWord.en);

    if (userAns === correctAns) {
        currentSession.correctAnswers++;
        input.classList.add('correct');
        playSound('success');
        showFeedbackBanner('Perfect!', 'success', '', 800);
        setTimeout(() => {
            currentSession.currentIndex++;
            addXP(15);
            hideFeedbackBanner();
            loadSpellingQuestion();
        }, 800);
    } else {
        input.classList.add('wrong');
        playSound('wrong');
        updateWordStats(currentWord.id, false);
        currentSession.wrongWordsThisSession.push(currentWord);
        
        const diff = getSpellingDiffHtml(userAns, currentWord.en);
        const subtitle = `<strong style="font-size:32px; background: #FFFFFF; padding: 4px 16px; border-radius: 8px; margin-left: 8px; letter-spacing: 2px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1); line-height: 1.2;">${diff.html}</strong> <span style="margin-left: 12px; font-size: 20px; color: #FF4B4B; font-weight: bold;">(Đúng ${diff.percent}%)</span>`;
        
        showFeedbackBanner('Incorrect', 'error', subtitle, 2500);
        
        // Re-insert 3 words later for spaced repetition
        let insertIndex = currentSession.currentIndex + 4;
        if (insertIndex > currentSession.words.length) insertIndex = currentSession.words.length;
        currentSession.words.splice(insertIndex, 0, { ...currentWord, isRetry: true });
        
        setTimeout(() => {
            input.classList.remove('wrong');
            currentSession.currentIndex++;
            hideFeedbackBanner();
            loadSpellingQuestion();
        }, 3000);
    }
}

// --- Audio Match Game ---
let animationFrameId;

function startAudioMatch() {
    if (appData.vocab.length < 5) {
        showFeedback('Need at least 5 words.', 'error');
        return;
    }
    
    let pool = [...appData.vocab].sort(() => Math.random() - 0.5);
    currentSession.words = [...pool];
    currentSession.mode = 'audio';
    currentSession.currentIndex = 0;
    currentSession.totalWords = pool.length;
    currentSession.correctAnswers = 0;
    
    showScreen('audio-screen');
    loadAudioQuestion();
}

function loadAudioQuestion() {
     if (currentSession.currentIndex >= currentSession.words.length) {
        endSession();
        return;
    }
    
    const progressPct = (currentSession.correctAnswers / currentSession.totalWords) * 100;
    document.getElementById('audio-progress').style.width = `${progressPct}%`;
    
    const currentWord = currentSession.words[currentSession.currentIndex];
    
    // Automatically read word
    speakWord(currentWord.en);
    
    // Setup Replay Button
    document.getElementById('btn-replay-audio').onclick = () => speakWord(currentWord.en);
    
    // Generate Floating Options
    const container = document.getElementById('audio-floating-container');
    container.innerHTML = '';
    
    const options = [currentWord];
    const others = [...appData.vocab].filter(v => v.id !== currentWord.id).sort(() => Math.random() - 0.5);
    for(let i=0; i<4 && i<others.length; i++) options.push(others[i]);
    options.sort(() => Math.random() - 0.5);
    
    let bubbles = [];
    
    options.forEach((opt, index) => {
        const el = document.createElement('div');
        el.className = 'floating-bubble';
        el.innerText = opt.vi;
        
        // Random initial position
        let posX = Math.random() * (container.clientWidth - 100);
        let posY = Math.random() * (container.clientHeight - 50);
        
        // Random velocity
        let vx = (Math.random() - 0.5) * 2;
        let vy = (Math.random() - 0.5) * 2;
        
        el.style.left = posX + 'px';
        el.style.top = posY + 'px';
        
        el.onclick = () => {
            if (opt.id === currentWord.id) {
                currentSession.correctAnswers++;
                el.classList.add('correct');
                playSound('success');
                cancelAnimationFrame(animationFrameId); // stop floating
                setTimeout(() => {
                    currentSession.currentIndex++;
                    addXP(10);
                    loadAudioQuestion();
                }, 1000);
            } else {
                el.classList.add('wrong');
                playSound('wrong');
                updateWordStats(currentWord.id, false);
                setTimeout(() => el.classList.remove('wrong'), 500);
            }
        };
        
        container.appendChild(el);
        bubbles.push({ el, x: posX, y: posY, vx: vx, vy: vy, width: 0, height: 0 });
    });
    
    // Measure widths after append
    setTimeout(() => {
       bubbles.forEach(b => { b.width = b.el.clientWidth; b.height = b.el.clientHeight; }); 
       // Start animation loop
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        function animate() {
            const w = container.clientWidth;
            const h = container.clientHeight;
            
            bubbles.forEach(b => {
                b.x += b.vx;
                b.y += b.vy;
                
                if (b.x <= 0 || b.x + b.width >= w) b.vx *= -1;
                if (b.y <= 0 || b.y + b.height >= h) b.vy *= -1;
                
                b.el.style.left = b.x + 'px';
                b.el.style.top = b.y + 'px';
            });
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    }, 50);
}

// --- Typing Rush Game ---
let rushTimerInterval;
let rushTimeLeft = 0;
let rushTimeTotal = 5000;

const PET_STAGES = [
    { name: '🥚 Trứng', emoji: '🥚', threshold: 0 },
    { name: '🐣 Baby', emoji: '🐣', threshold: 3 },
    { name: '🐥 Teenager', emoji: '🐥', threshold: 8 },
    { name: '🦅 Adult', emoji: '🦅', threshold: 16 },
    { name: '🐉 Legendary', emoji: '🐉', threshold: 28 }
];
let currentPetStage = 0;

function updatePetUI(didLevelUp = false, didJump = false) {
    const petChar = document.getElementById('pet-character');
    const petStageName = document.getElementById('pet-stage-name');
    const petExpBar = document.getElementById('pet-exp-bar');
    
    if(!petChar || !petStageName || !petExpBar) return;
    
    // Find stage
    let newStage = 0;
    for(let i=0; i<PET_STAGES.length; i++) {
        if (currentSession.correctAnswers >= PET_STAGES[i].threshold) {
            newStage = i;
        }
    }
    
    if (newStage > currentPetStage) {
        currentPetStage = newStage;
        didLevelUp = true;
    }
    
    const stageInfo = PET_STAGES[currentPetStage];
    let nextStageInfo = PET_STAGES[currentPetStage + 1];
    
    let pct = 100;
    if (nextStageInfo) {
        let xpInCurrentStage = currentSession.correctAnswers - stageInfo.threshold;
        let xpNeededForNextStage = nextStageInfo.threshold - stageInfo.threshold;
        pct = (xpInCurrentStage / xpNeededForNextStage) * 100;
    }
    
    petStageName.innerText = `STAGE: ${stageInfo.name}`;
    petExpBar.style.width = pct + '%';
    petChar.innerText = stageInfo.emoji;
    
    // Calculate movement (up to 90% across the container)
    let maxPosition = 90;
    // Let's divide 90% by 28 (total to reach legendary)
    let petPosition = Math.min(maxPosition, (currentSession.correctAnswers / 28) * maxPosition);
    petChar.style.left = petPosition + '%';
    
    if (didJump) {
        petChar.classList.remove('pet-jumping');
        void petChar.offsetWidth; // trigger reflow
        petChar.classList.add('pet-jumping');
    }
    
    if (didLevelUp) {
        playSound('completed');
        petChar.classList.remove('pet-evolving');
        void petChar.offsetWidth;
        petChar.classList.add('pet-evolving');
    }
}

function startRushMode() {
    if (appData.vocab.length === 0) return;
    
    currentSession.mode = 'rush';
    currentSession.score = 0;
    currentSession.correctAnswers = 0;
    currentPetStage = 0;
    document.getElementById('rush-score').innerText = '0';
    
    showScreen('rush-screen');
    updatePetUI();
    nextRushWord();
}

function nextRushWord() {
    const wordIndex = Math.floor(Math.random() * appData.vocab.length);
    const currentWord = appData.vocab[wordIndex];
    currentSession.currentWord = currentWord;
    
    document.getElementById('rush-meaning').innerText = currentWord.vi;
    const input = document.getElementById('rush-input');
    
    // Crucial for Mac IME: un-disable, clear, then focus
    input.disabled = false;
    input.value = '';
    input.className = 'spell-input';
    input.focus();
    
    startRushTimer();
    
    // Auto-check on input
    input.oninput = (e) => {
        if (!input.disabled && input.value.toLowerCase().trim() === currentWord.en.toLowerCase()) {
            input.disabled = true; // Disable instantly to force Mac IME to commit and avoid carrying over trailing characters
            clearInterval(rushTimerInterval);
            input.classList.add('correct');
            playSound('success');
            currentSession.score += 10;
            currentSession.correctAnswers++;
            document.getElementById('rush-score').innerText = currentSession.score;
            
            updatePetUI(false, true);
            
            setTimeout(() => {
                nextRushWord();
            }, 300);
        }
    };
}

function startRushTimer() {
    clearInterval(rushTimerInterval);
    const wordLen = currentSession.currentWord.en.length;
    // Calculate adaptive time: 1.5s base + 0.6s per character
    rushTimeTotal = 1500 + (wordLen * 600);
    rushTimeLeft = rushTimeTotal;
    const timerBar = document.getElementById('rush-timer-bar');
    
    rushTimerInterval = setInterval(() => {
        rushTimeLeft -= 50;
        const pct = Math.max(0, (rushTimeLeft / rushTimeTotal) * 100);
        timerBar.style.width = pct + '%';
        
        if (rushTimeLeft <= 0) {
            clearInterval(rushTimerInterval);
            endRushSession();
        }
    }, 50);
}

function endRushSession() {
    clearInterval(rushTimerInterval);
    playSound('wrong');
    showFeedbackBanner('Game Over', 'error', `Your score: ${currentSession.score}`);
    setTimeout(() => {
        hideFeedbackBanner();
        showScreen('dashboard-screen');
    }, 3000);
}

// --- Speaking Practice ---
function startSpeaking() {
   // filter words that have sentences
   const pool = appData.vocab.filter(w => w.enSentence && w.viSentence);
   if (pool.length === 0) {
       showFeedback('Oops! Bạn chưa Import bộ từ vựng nào có ví dụ Tiếng Anh - Tiếng Việt để luyện nói.', 'error');
       return;
   }
   pool.sort(() => Math.random() - 0.5);
   currentSession.words = [...pool];
   currentSession.mode = 'speaking';
   currentSession.currentIndex = 0;
   currentSession.totalWords = pool.length;
   
   showScreen('speaking-screen');
   loadSpeakingQuestion();
}

function loadSpeakingQuestion() {
    if (currentSession.currentIndex >= currentSession.words.length) {
        endSession();
        return;
    }
    
    const progressPct = (currentSession.currentIndex / currentSession.totalWords) * 100;
    document.getElementById('speaking-progress').style.width = `${progressPct}%`;
    
    const currentWord = currentSession.words[currentSession.currentIndex];
    
    document.getElementById('speaking-vi-sentence').innerText = currentWord.viSentence;
    document.getElementById('speaking-en-sentence').innerText = currentWord.enSentence;
    document.getElementById('speaking-target-word').innerText = currentWord.en;
    document.getElementById('speaking-target-meaning').innerText = currentWord.vi;
    
    // Hide EN container initially
    const enContainer = document.getElementById('speaking-en-container');
    enContainer.style.visibility = 'hidden';
    enContainer.style.opacity = '0';
    
    const btn = document.getElementById('btn-speaking-action');
    btn.innerText = 'Flip';
    currentSession.speakingFlipped = false;
}

function handleSpeakingAction() {
    if (currentSession.mode !== 'speaking') return;
    
    const currentWord = currentSession.words[currentSession.currentIndex];
    const enContainer = document.getElementById('speaking-en-container');
    const btn = document.getElementById('btn-speaking-action');
    
    if (!currentSession.speakingFlipped) {
        // FLIP: Show english, play sound
        enContainer.style.visibility = 'visible';
        enContainer.style.opacity = '1';
        btn.innerText = 'Next';
        currentSession.speakingFlipped = true;
        
        speakWord(currentWord.enSentence);
    } else {
        // NEXT: Go to next sentence
        currentSession.currentIndex++;
        loadSpeakingQuestion();
    }
}

// Global hook for keydown navigation in speaking mode
document.addEventListener('keydown', (e) => {
   if (currentSession.mode === 'speaking') {
       if (e.code === 'Space' && !currentSession.speakingFlipped) {
           e.preventDefault();
           handleSpeakingAction();
       } else if (e.code === 'Enter' && currentSession.speakingFlipped) {
           e.preventDefault();
           handleSpeakingAction();
       }
   }
});

// Initialize on load
window.onload = init;
