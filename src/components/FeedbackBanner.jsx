import React, { useEffect } from 'react';
import { useAppContext } from '../lib/store';

export default function FeedbackBanner() {
  const { feedback, hideFeedback } = useAppContext();

  useEffect(() => {
    if (feedback.show) {
      const timer = setTimeout(() => {
        hideFeedback();
      }, feedback.duration);
      return () => clearTimeout(timer);
    }
  }, [feedback, hideFeedback]);

  let icon = feedback.type === 'success' ? '✔️' : '❌';

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] p-4 md:p-5 rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex justify-between items-center z-50 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${feedback.show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'} ${feedback.type === 'success' ? 'bg-[#D7FFB8] text-[#3A8501] border-2 border-[#58CC02]/40' : 'bg-[#FFDFE0] text-[#D33D3D] border-2 border-[#FF4B4B]/40'}`}>
      <div className="text-xl font-extrabold flex items-center gap-2">
        <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
          {icon} {feedback.title}
          {feedback.subtitle && (
            <span style={{ fontSize: '16px', fontWeight: 'normal', marginLeft: '10px', display: 'flex', alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: feedback.subtitle }}></span>
          )}
        </div>
      </div>
    </div>
  );
}
