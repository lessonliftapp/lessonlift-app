import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, X, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import LessonForm from '../components/LessonForm';
import LessonPreview from '../components/LessonPreview';
import LessonHistory from '../components/LessonHistory';
import ProgressOverlay from '../components/ProgressOverlay';
import {
  startLessonGeneration,
  pollLessonJob,
  fetchLessonHistory,
  LessonRequest,
  Lesson,
} from '../services/lessonService';
import { usePageSEO } from '../hooks/usePageSEO';
import { useSubscription, PLAN_LIMITS, normalizePlan } from '../hooks/useSubscription';
import { usePlanUsage } from '../hooks/usePlanUsage';
import { supabase } from '../lib/supabase';

const POLL_INTERVAL_MS = 2000;

const LessonGeneratorPage: React.FC = () => {
  usePageSEO(
    'AI Teaching Resources | LessonLift',
    "Generate worksheets, activities, and structured AI lesson plans instantly with LessonLift's teaching resources platform."
  );

  const { user, loading: authLoading, isEmailVerified } = useAuth();
  const { plan, isActive, loading: subLoading } = useSubscription();
  const { usage, fetchUsage, checkCanGenerate } = usePlanUsage();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<any | null>(null);
  const [lessonHistory, setLessonHistory] = useState<Lesson[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
      resumeInProgressJob();
    }
    return () => stopPolling();
  }, [user]);

  const loadHistory = async () => {
    const lessons = await fetchLessonHistory();
    setLessonHistory(lessons);
  };

  const resumeInProgressJob = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('lesson_jobs')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      activeJobIdRef.current = data.id;
      setIsGenerating(true);
      startPolling(data.id);
    }
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const startPolling = (jobId: string) => {
    stopPolling();
    pollIntervalRef.current = setInterval(() => checkJob(jobId), POLL_INTERVAL_MS);
  };

  const checkJob = async (jobId: string) => {
    const result = await pollLessonJob(jobId);

    if (result.status === 'processing') return;

    stopPolling();
    activeJobIdRef.current = null;
    setIsGenerating(false);

    if (result.status === 'completed' && result.lesson) {
      const l = result.lesson;
      setCurrentLesson({
        id: l.id,
        html: l.lesson_content,
        text: l.lesson_text,
        yearGroup: l.year_group,
        abilityLevel: l.ability_level,
        lessonDuration: l.lesson_duration,
        subject: l.subject,
        topic: l.topic,
        learningObjective: l.learning_objective,
        senEalNotes: l.sen_eal_notes,
      });
      await loadHistory();
      await fetchUsage();
    } else {
      setError(result.error || 'Generation failed. Please try again.');
    }
  };

  const handleGenerate = async (request: LessonRequest) => {
    if (!isEmailVerified) {
      setError('Please verify your email before generating lesson plans. Check your inbox for a verification link.');
      return;
    }

    const trialLessons = usage?.lessonsRemaining ?? 0;
    const hasActivePlan = isActive;

    if (!hasActivePlan && trialLessons <= 0) {
      setError('Your free trial has ended. Upgrade to a paid plan to continue generating lesson plans.');
      return;
    }

    const { allowed, reason } = checkCanGenerate(normalizePlan(plan));
    if (!allowed) {
      setError(reason ?? 'Generation limit reached.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentLesson(null);

    const result = await startLessonGeneration(request);

    if (!result.success || !result.jobId) {
      setIsGenerating(false);
      setError(result.error || 'Failed to start generation. Please try again.');
      return;
    }

    activeJobIdRef.current = result.jobId;
    startPolling(result.jobId);
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setCurrentLesson({
      id: lesson.id,
      html: lesson.lesson_content,
      text: lesson.lesson_text,
      yearGroup: lesson.year_group,
      abilityLevel: lesson.ability_level,
      lessonDuration: lesson.lesson_duration,
      subject: lesson.subject,
      topic: lesson.topic,
      learningObjective: lesson.learning_objective,
      senEalNotes: lesson.sen_eal_notes,
    });
    setError(null);
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessonHistory((prev) => prev.filter((l) => l.id !== lessonId));
    if (currentLesson?.id === lessonId) setCurrentLesson(null);
  };

  const limits = PLAN_LIMITS[normalizePlan(plan)] ?? PLAN_LIMITS['free'];
  const allowedExportFormats = limits.exportFormats ?? [];

  const usageLabel = (() => {
    if (!usage) return null;

    if (!isActive && usage.lessonsRemaining > 0) {
      return `${usage.lessonsRemaining} free trial lesson${usage.lessonsRemaining === 1 ? '' : 's'} remaining`;
    }

    if (isActive) {
      if (limits.isUnlimited) return 'Unlimited generations';
      if (limits.monthlyLimit !== null) {
        const remaining = limits.monthlyLimit - usage.monthlyCount;
        return `${remaining} of ${limits.monthlyLimit} left this month`;
      }
    }

    return null;
  })();

  const isAtLimit = isActive && !checkCanGenerate(normalizePlan(plan)).allowed;

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#4CAF50] mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const trialLessons = usage?.lessonsRemaining ?? 0;

  if (!isActive && trialLessons <= 0) {
    return (
      <DashboardLayout>
        <div className="py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-6">
              <Lock size={28} className="text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Trial Ended</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              You've used your 3 free lesson plans. Upgrade to a paid plan to continue generating lessons.
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md"
            >
              Upgrade Now
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout disableFeedback={isGenerating}>
      <ProgressOverlay isVisible={isGenerating} />

      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Lesson Generator
                </h1>
                <p className="text-gray-600 text-lg">
                  Create customised, UK curriculum-aligned lesson plans with AI
                </p>
              </div>

              {usageLabel && (
                <div
                  className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl border ${
                    isAtLimit
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-green-50 border-green-200 text-green-700'
                  }`}
                >
                  {usageLabel}
                </div>
              )}
            </div>
          </div>

          {isAtLimit && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Lock className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Generation limit reached</p>
                <p className="text-sm text-amber-700 mt-1">{checkCanGenerate(normalizePlan(plan)).reason}</p>
                <Link
                  to="/pricing"
                  className="inline-block mt-2 text-sm font-semibold text-amber-800 underline hover:text-amber-900"
                >
                  Upgrade to unlock more lessons
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-semibold text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`${showHistory ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
              <LessonForm onGenerate={handleGenerate} isGenerating={isGenerating} disabled={isAtLimit} />

              {currentLesson && (
                <LessonPreview
                  lesson={currentLesson}
                  onRegenerate={handleGenerate}
                  isRegenerating={isGenerating}
                  allowedExportFormats={allowedExportFormats}
                />
              )}
            </div>

            {showHistory && (
              <div className="lg:col-span-4">
                <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl p-1 -m-1">
                  <LessonHistory
                    lessons={lessonHistory}
                    onSelectLesson={handleSelectLesson}
                    onDeleteLesson={handleDeleteLesson}
                    selectedLessonId={currentLesson?.id}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="lg:hidden fixed bottom-6 right-6 bg-[#4CAF50] hover:bg-[#45a049] text-white px-6 py-3 rounded-full shadow-lg font-semibold transition-all"
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>
      </div>

      <style>{`
        .lesson-preview-content .lesson-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 3px solid #4CAF50;
        }
        .lesson-preview-content .lesson-header h1 {
          color: #4CAF50;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .lesson-preview-content .lesson-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 14px;
        }
        .lesson-preview-content .meta-item {
          color: #666;
          background: #f3f4f6;
          padding: 6px 12px;
          border-radius: 8px;
        }
        .lesson-preview-content .lesson-content { margin-top: 24px; }
        .lesson-preview-content .section-heading {
          color: #2c5f2d;
          font-size: 22px;
          font-weight: bold;
          margin-top: 28px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        .lesson-preview-content .subsection {
          color: #4CAF50;
          font-size: 18px;
          font-weight: 600;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        .lesson-preview-content li {
          margin-bottom: 8px;
          line-height: 1.7;
          color: #374151;
        }
        .lesson-preview-content .nested-item { margin-left: 24px; color: #6b7280; }
        .lesson-preview-content p {
          line-height: 1.8;
          margin-bottom: 12px;
          color: #374151;
        }
        .lesson-preview-content h2,
        .lesson-preview-content h3,
        .lesson-preview-content h4 { scroll-margin-top: 100px; }
        @media (max-width: 1024px) {
          .lesson-preview-content .lesson-header h1 { font-size: 24px; }
          .lesson-preview-content .section-heading { font-size: 20px; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default LessonGeneratorPage;
