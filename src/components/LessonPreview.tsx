import React, { useState } from 'react';
import { Download, FileText, FileType, Printer, RotateCw, Sparkles, Clock, Target, Minimize, Zap } from 'lucide-react';
import { downloadAsText, downloadAsPDF, downloadAsDOCX, sanitizeFilename } from '../utils/downloadUtils';
import { LessonRequest } from '../services/lessonService';

interface LessonPreviewProps {
  lesson?: {
    id?: string;
    html?: string;
    text?: string;
    yearGroup?: string;
    abilityLevel?: string;
    lessonDuration?: number;
    subject?: string;
    topic?: string;
    learningObjective?: string;
    senEalNotes?: string;
  } | null;
  onRegenerate: (request: LessonRequest) => Promise<void>;
  isRegenerating: boolean;
  allowedExportFormats?: string[];
}

const LessonPreview: React.FC<LessonPreviewProps> = ({
  lesson,
  onRegenerate,
  isRegenerating,
  allowedExportFormats = ['pdf', 'docx', 'txt']
}) => {
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');

  const filename = sanitizeFilename(lesson?.subject ?? '', lesson?.topic ?? '');

  const canExport = (format: string) => allowedExportFormats.includes(format);

  const handleDownloadText = () => {
    downloadAsText(lesson?.text ?? '', filename);
  };

  const handleDownloadPDF = () => {
    downloadAsPDF(lesson?.html ?? '', filename);
  };

  const handleDownloadDOCX = () => {
    downloadAsDOCX(lesson?.html ?? '', filename);
  };

  const handleRegenerate = async (instruction?: string) => {
    const request: LessonRequest = {
      yearGroup: lesson?.yearGroup ?? '',
      abilityLevel: lesson?.abilityLevel ?? '',
      lessonDuration: lesson?.lessonDuration ?? 60,
      subject: lesson?.subject ?? '',
      topic: lesson?.topic ?? '',
      learningObjective: lesson?.learningObjective,
      senEalNotes: lesson?.senEalNotes,
      regenerationInstruction: instruction,
    };

    await onRegenerate(request);
    setShowRegenerateOptions(false);
    setCustomInstruction('');
  };

  const regenerateOptions = [
    {
      icon: Sparkles,
      label: 'More creative & engaging activities',
      instruction: 'Make the lesson more creative and engaging with more interactive activities and hands-on learning experiences.',
    },
    {
      icon: Clock,
      label: 'More structured with timings',
      instruction: 'Provide more detailed structure with specific timings for each activity and clear transitions between lesson segments.',
    },
    {
      icon: Minimize,
      label: 'Simplify for lower ability',
      instruction: 'Simplify the content and activities to make them more accessible for lower ability students, with more scaffolding and support.',
    },
    {
      icon: Zap,
      label: 'Challenge for higher ability',
      instruction: 'Add more challenging content and extension activities suitable for higher ability students who need to be stretched.',
    },
    {
      icon: Target,
      label: 'Just regenerate (different variation)',
      instruction: undefined,
    },
  ];

  // ✅ Safe HTML cleaning
  const cleanedHTML = lesson?.html?.replace(/\*\*(.*?)\*\*/g, '$1') ?? '';

  if (!lesson) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 text-lg">Loading lesson...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Lesson Plan Preview</h2>

          <div className="flex flex-wrap gap-2">
            {canExport('pdf') && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm bg-red-500 hover:bg-red-600 text-white"
                title="Download as PDF"
              >
                <Printer size={18} />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}

            {canExport('docx') && (
              <button
                onClick={handleDownloadDOCX}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm bg-blue-500 hover:bg-blue-600 text-white"
                title="Download as DOCX"
              >
                <FileType size={18} />
                <span className="hidden sm:inline">DOCX</span>
              </button>
            )}

            {canExport('txt') && (
              <button
                onClick={handleDownloadText}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                title="Download as TXT"
              >
                <FileText size={18} />
                <span className="hidden sm:inline">TXT</span>
              </button>
            )}

            <button
              onClick={() => setShowRegenerateOptions(!showRegenerateOptions)}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-2 bg-[#4CAF50] hover:bg-[#45a049] disabled:bg-gray-400 text-white rounded-lg transition-all font-semibold text-sm"
            >
              <RotateCw size={18} className={isRegenerating ? 'animate-spin' : ''} />
              Regenerate
            </button>
          </div>
        </div>

        {showRegenerateOptions && !isRegenerating && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <RotateCw size={18} />
              Choose Regeneration Option
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {regenerateOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleRegenerate(option.instruction)}
                  className="flex items-start gap-3 p-3 bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-[#4CAF50] rounded-lg transition-all text-left"
                >
                  <option.icon size={20} className="text-[#4CAF50] flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Custom Instruction (Optional)
              </label>
              <textarea
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="e.g., Add more outdoor learning activities, Include group work..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#4CAF50] focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none text-sm"
                rows={2}
              />
              <button
                onClick={() => handleRegenerate(customInstruction)}
                disabled={!customInstruction.trim()}
                className="w-full bg-[#4CAF50] hover:bg-[#45a049] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                Regenerate with Custom Instruction
              </button>
            </div>
          </div>
        )}

        <div
          className="lesson-preview-content"
          dangerouslySetInnerHTML={{ __html: cleanedHTML }}
        />

        <style>
          {`
            .lesson-preview-content {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.8;
              color: #333;
              width: 100%;
              overflow-wrap: break-word;
              word-break: break-word;
            }

            .lesson-preview-content h1 {
              font-size: 1.75rem;
              font-weight: 700;
              color: #111827;
              margin-top: 1.75em;
              margin-bottom: 0.75em;
              line-height: 1.3;
            }

            .lesson-preview-content h2 {
              font-size: 1.4rem;
              font-weight: 700;
              color: #1f2937;
              margin-top: 1.5em;
              margin-bottom: 0.6em;
              line-height: 1.35;
              padding-bottom: 0.35em;
              border-bottom: 2px solid #e5e7eb;
            }

            .lesson-preview-content h3 {
              font-size: 1.15rem;
              font-weight: 600;
              color: #374151;
              margin-top: 1.25em;
              margin-bottom: 0.5em;
            }

            .lesson-preview-content h4 {
              font-size: 1rem;
              font-weight: 600;
              color: #4b5563;
              margin-top: 1em;
              margin-bottom: 0.4em;
            }

            .lesson-preview-content p {
              margin-bottom: 0.85em;
              color: #374151;
            }

            .lesson-preview-content ul,
            .lesson-preview-content ol {
              margin-top: 0.5em;
              margin-bottom: 1em;
              padding-left: 1.5em;
            }

            .lesson-preview-content li {
              margin-bottom: 0.4em;
              color: #374151;
              line-height: 1.7;
            }

            .lesson-preview-content table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 1em;
              margin-bottom: 1.5em;
              font-size: 0.95rem;
              display: table;
            }

            .lesson-preview-content th {
              background-color: #f3f4f6;
              font-weight: 600;
              color: #1f2937;
              text-align: left;
              padding: 10px 14px;
              border: 1px solid #d1d5db;
            }

            .lesson-preview-content td {
              padding: 9px 14px;
              border: 1px solid #d1d5db;
              color: #374151;
              vertical-align: top;
            }

            .lesson-preview-content tr:nth-child(even) td {
              background-color: #f9fafb;
            }

            .lesson-preview-content strong,
            .lesson-preview-content b {
              font-weight: 600;
              color: #111827;
            }

            .lesson-preview-content em,
            .lesson-preview-content i {
              font-style: italic;
            }

            .lesson-preview-content hr {
              border: none;
              border-top: 2px solid #e5e7eb;
              margin: 1.5em 0;
            }

            .lesson-preview-content blockquote {
              border-left: 4px solid #4CAF50;
              padding-left: 1em;
              margin: 1em 0;
              color: #6b7280;
              font-style: italic;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default LessonPreview;