import React, { useState, useRef } from 'react'
import { useAppContext } from '../lib/store'
// pdfjs configuration for worker
import * as pdfjsLib from 'pdfjs-dist'

export default function InputScreen() {
  const { appData, setAppData, setActiveScreen, showFeedback } = useAppContext();
  const [inputText, setInputText] = useState(() => {
    return appData.vocab.map(v => `${v.en}: ${v.vi}`).join('\n');
  });
  const fileInputRef = useRef(null);

  const saveVocabulary = () => {
    const lines = inputText.split('\n');
    const newVocab = [];
    let added = 0;
    
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      const parts = line.split(/[:-]/);
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
      setAppData(prev => ({ ...prev, vocab: newVocab }));
      showFeedback(`Saved ${added} words!`, 'success');
      setActiveScreen('dashboard');
    } else {
      showFeedback('Please use format "Word : Meaning"', 'error');
    }
  }

  const handlePDFUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        setInputText('Đang xử lý PDF, vui lòng đợi...');
        
        const arrayBuffer = await file.arrayBuffer();
        
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
            
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += ' ' + pageText;
        }

        fullText = fullText.replace(/\s+/g, ' ');
        fullText = fullText.replace(/(\b\d+)\s+\./g, '$1.');

        const chunks = fullText.split(/\b\d+\.\s+/);

        let parsedTextForTextarea = '';

        for (let i = 1; i < chunks.length; i++) {
            const chunk = chunks[i].trim();
            const parts = chunk.split(':');
            
            if (parts.length >= 2) {
                let word = parts[0].trim();
                let meaning = parts.slice(1).join(':').trim();
                
                meaning = meaning.replace(/^\([a-z]+\)\s*/i, '');
                
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

        if (fileInputRef.current) fileInputRef.current.value = '';

        if (parsedTextForTextarea.trim() === '') {
            setInputText(fullText.trim());
            alert('Đã đọc PDF, nhưng không nhận diện được định dạng (Format chuẩn: 1. Word: Nghĩa). Bạn có thể chỉnh sửa thủ công dưới đây.');
        } else {
            setInputText(parsedTextForTextarea.trim());
            showFeedback('Đã bóc tách từ vựng từ PDF. Vui lòng kiểm tra và ấn Lưu.', 'success');
        }

    } catch (error) {
        console.error("PDF Parsing Error:", error);
        setInputText('');
        alert('Có lỗi khi đọc file PDF. Định dạng không được hỗ trợ.');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col flex-1 animate-fade-in h-full">
      <h2 className="text-2xl font-extrabold mb-4">Add Vocabulary</h2>
      <p className="text-text-secondary mb-4">Paste your list format: "English : Vietnamese" or upload a PDF</p>

      <div className="mb-4 text-center">
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".pdf" 
            className="hidden"
            onChange={handlePDFUpload} 
          />
          <button 
            className="btn btn-blue w-full max-w-[400px]"
            onClick={() => fileInputRef.current?.click()}
          >
              📄 Auto-Import from PDF
          </button>
          <p className="text-xs text-text-secondary mt-2">Upload a Quizlet exported PDF to auto-extract words.</p>
      </div>

      <textarea 
        className="flex-1"
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        placeholder={`apple : quả táo\nbanana : quả chuối`}
      />
      
      <div className="footer mt-auto flex justify-between gap-4">
          <button className="btn btn-outline py-2 px-4 text-sm" onClick={() => setActiveScreen('vocab')}>Back</button>
          <button className="btn btn-primary" onClick={saveVocabulary}>Save Words</button>
      </div>
    </div>
  )
}
