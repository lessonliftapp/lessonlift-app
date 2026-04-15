import React, { useEffect, useState } from 'react';
import { Wand2 } from 'lucide-react';

interface ProgressOverlayProps {
  isVisible: boolean;
}

const MESSAGES = [
  { after: 0,  text: 'Generating your lesson plan...' },
  { after: 5,  text: 'Structuring lesson objectives...' },
  { after: 10, text: 'Adding activities and timing...' },
  { after: 15, text: 'Finalising your lesson plan...' },
];

const ProgressOverlay: React.FC<ProgressOverlayProps> = ({ isVisible }) => {
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setElapsed(0);
      setProgress(0);
      return;
    }

    const startTime = Date.now();

    const tick = setInterval(() => {
      const secs = (Date.now() - startTime) / 1000;
      setElapsed(secs);

      let p = 0;
      if (secs < 5)       p = (secs / 5) * 30;
      else if (secs < 15) p = 30 + ((secs - 5) / 10) * 40;
      else if (secs < 25) p = 70 + ((secs - 15) / 10) * 20;
      else                p = 90 + Math.min((secs - 25) / 20, 1) * 5;

      setProgress(Math.min(p, 95));
    }, 100);

    return () => clearInterval(tick);
  }, [isVisible]);

  const currentMessage = [...MESSAGES]
    .reverse()
    .find(m => elapsed >= m.after)?.text ?? MESSAGES[0].text;

  if (!isVisible && progress === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="mb-6 relative">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Wand2 className="text-[#4CAF50]" size={28} />
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
          </div>

          <p className="text-lg font-semibold text-gray-900 text-center mb-1 min-h-[28px] transition-all duration-500">
            {currentMessage}
          </p>
          <p className="text-sm text-gray-400 text-center mb-6">
            This usually takes under 60 seconds
          </p>

          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          <p className="text-xs font-medium text-gray-400 self-end">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-shimmer {
          animation: shimmer 1.8s infinite;
        }
      `}</style>
    </div>
  );
};

export default ProgressOverlay;
