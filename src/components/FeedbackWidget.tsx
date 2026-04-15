import React, { useState } from 'react';
import { MessageSquare, X, ExternalLink } from 'lucide-react';

const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf7ol-ZH8-MkfmqZAOjI5XL1wRpKRANb4yRQdvvN1p9BlphFA/viewform?embedded=true';

interface FeedbackWidgetProps {
  disabled?: boolean;
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ disabled = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open feedback form"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#4CAF50] hover:bg-[#43A047] text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
          open || disabled ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <MessageSquare size={16} />
        Feedback
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setOpen(false)} />

          {/* Popup card */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: 'min(620px, calc(100vh - 3rem))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src="/Lessonlift_logo,_better_qual.jpeg"
                  alt="LessonLift"
                  className="h-7 w-auto object-contain"
                />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">Share your feedback</h3>
                  <p className="text-xs text-gray-500 leading-tight">Help us improve LessonLift</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSf7ol-ZH8-MkfmqZAOjI5XL1wRpKRANb4yRQdvvN1p9BlphFA/viewform?usp=publish-editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Close feedback"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={GOOGLE_FORM_URL}
                title="LessonLift Feedback"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
