import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Wrench, Sparkles, ArrowRight, Zap, Crown, TrendingUp, AlertTriangle, Infinity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription, PLAN_LIMITS, PLAN_LABELS, PlanType } from '../hooks/useSubscription';
import { usePlanUsage } from '../hooks/usePlanUsage';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { usePageSEO } from '../hooks/usePageSEO';

interface ToolCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  to: string;
  ctaLabel: string;
  badge?: string;
  disabled?: boolean;
}

function ActiveToolCard({ icon: Icon, title, description, to, ctaLabel, badge }: ToolCardProps) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-green-200 hover:shadow-green-50"
    >
      {badge && (
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-green-500 mb-4 shadow-sm shadow-green-200 group-hover:scale-105 transition-transform duration-200">
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed flex-1">{description}</p>
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-200 transition-colors">
          {ctaLabel}
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

function ComingSoonCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="relative flex flex-col bg-white rounded-2xl border border-dashed border-gray-200 p-6 opacity-60 select-none">
      <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
        Soon
      </span>
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 mb-4">
        <Icon size={20} className="text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-300 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-300 leading-relaxed flex-1">{description}</p>
      <div className="mt-5 pt-4 border-t border-gray-100">
        <span className="text-xs font-semibold text-gray-300">Coming Soon</span>
      </div>
    </div>
  );
}

function UsageCard({ plan, isActive }: { plan: PlanType; isActive: boolean }) {
  const { usage, loading } = usePlanUsage();
  const limits = PLAN_LIMITS[plan];

  const planColors: Record<PlanType, { badge: string; bar: string; icon: string }> = {
    free:     { badge: 'bg-gray-100 text-gray-600 border-gray-200',     bar: 'bg-gray-400',    icon: 'text-gray-400' },
    starter:  { badge: 'bg-green-50 text-green-700 border-green-200',   bar: 'bg-green-500',   icon: 'text-green-500' },
    standard: { badge: 'bg-blue-50 text-blue-700 border-blue-200',      bar: 'bg-blue-500',    icon: 'text-blue-500' },
    pro:      { badge: 'bg-amber-50 text-amber-700 border-amber-200',   bar: 'bg-amber-500',   icon: 'text-amber-500' },
  };
  const planIcons: Record<PlanType, React.ElementType> = {
    free: Zap, starter: Zap, standard: Crown, pro: Crown,
  };
  const PlanIcon = planIcons[plan];
  const colors = planColors[plan];
  const planLabel = PLAN_LABELS[plan];

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="h-2 bg-gray-100 rounded-full w-full mb-3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  if (!isActive) {
    const trialLessons = usage?.lessonsRemaining ?? 0;

    if (trialLessons > 0) {
      const colors = { badge: 'bg-green-50 text-green-700 border-green-200', bar: 'bg-green-500', icon: 'text-green-500' };
      const pct = (trialLessons / 3) * 100;

      return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className={colors.icon} />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Free Trial</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${colors.badge}`}>
              <Zap size={11} />
              Free Trial
            </span>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold text-gray-900">{trialLessons}</span>
              <span className="text-sm text-gray-400 font-medium">free lesson{trialLessons === 1 ? '' : 's'} remaining</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all duration-700 bg-green-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Start generating lesson plans with your free trial. Upgrade to a paid plan anytime to unlock unlimited lessons.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            View Plans <ArrowRight size={13} />
          </Link>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={15} className="text-gray-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Lesson Plan Usage</span>
        </div>
        <p className="text-sm text-gray-500 mb-4 mt-2">Trial ended. Subscribe to start generating lesson plans again.</p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          View Plans <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  if (limits.isUnlimited) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className={colors.icon} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Lesson Plan Usage</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${colors.badge}`}>
            <PlanIcon size={11} />
            {planLabel} Plan
          </span>
        </div>

        <div className="flex items-center gap-3 py-3 px-4 bg-amber-50 border border-amber-100 rounded-xl">
          <Infinity size={22} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-900">Unlimited lesson plans this month</p>
            {usage && usage.monthlyCount > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">{usage.monthlyCount} generated so far this month</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const count = usage?.monthlyCount ?? 0;
  const max = limits.monthlyLimit ?? 0;
  const remaining = Math.max(0, max - count);
  const pct = max > 0 ? Math.min(100, (count / max) * 100) : 0;

  const isCritical = remaining <= 3;
  const isLow = remaining <= 5;
  const isNear = remaining <= 10;

  const barColor = isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : isNear ? 'bg-amber-400' : colors.bar;
  const trackColor = isCritical ? 'bg-red-100' : isLow ? 'bg-amber-100' : 'bg-gray-100';

  let warningMessage: string | null = null;
  if (isCritical) {
    warningMessage = `You're almost out of lesson plans this month.`;
  } else if (isLow) {
    warningMessage = `You only have ${remaining} lesson plan${remaining === 1 ? '' : 's'} remaining this month.`;
  } else if (isNear) {
    warningMessage = `You have ${remaining} lesson plans remaining this month.`;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className={colors.icon} />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Lesson Plan Usage</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${colors.badge}`}>
          <PlanIcon size={11} />
          {planLabel} Plan
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-2xl font-bold text-gray-900">{count}</span>
          <span className="text-sm text-gray-400 font-medium">of {max} used this month</span>
        </div>
        <div className={`w-full ${trackColor} rounded-full h-2.5 overflow-hidden`}>
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {warningMessage ? (
        <div className={`flex items-start gap-3 rounded-xl p-3.5 mb-3 ${isCritical ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
          <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${isCritical ? 'text-red-700' : 'text-amber-700'}`}>{warningMessage}</p>
            <p className="text-xs text-gray-500 mt-0.5">Upgrade to Pro for unlimited lesson generation.</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-3">
          <span className="font-semibold text-gray-700">{remaining}</span> lesson plan{remaining === 1 ? '' : 's'} remaining this month
        </p>
      )}

      {isNear && (
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Upgrade Plan <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

export default function DashboardHome() {
  usePageSEO(
    'AI Lesson Generator Dashboard | LessonLift',
    'Create and manage AI-generated lesson plans and classroom resources faster with LessonLift\'s teacher dashboard.'
  );
  const { user } = useAuth();
  const { plan, isActive } = useSubscription();

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
  const firstName = displayName.split(' ')[0];

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gray-50">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Welcome back, <span className="text-green-600 capitalize">{firstName}</span>
                </h1>
                <p className="text-sm text-gray-400 mt-1.5 font-medium">
                  Your AI-powered teaching toolkit — ready when you are.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex flex-col items-end gap-0.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Active Tools</span>
                  <span className="text-sm font-bold text-gray-800">1 of 4</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          <UsageCard plan={plan} isActive={isActive} />

          <section>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-1 h-5 bg-green-500 rounded-full" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Available Tools</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ActiveToolCard
                icon={BookOpen}
                title="Lesson Planner"
                description="Create fully structured, UK curriculum-aligned lesson plans in seconds. Customise for year group, ability, duration and more."
                to="/dashboard/lesson-generator"
                ctaLabel="Open Planner"
                badge="Live"
              />
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-1 h-5 bg-gray-200 rounded-full" />
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coming Soon</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ComingSoonCard
                icon={ClipboardList}
                title="Quiz Builder"
                description="Automatically generate quizzes, comprehension checks, and exit tickets aligned to your lesson objectives."
              />
              <ComingSoonCard
                icon={Wrench}
                title="Homework Generator"
                description="Create differentiated homework tasks with mark schemes, tailored to each ability group in your class."
              />
              <ComingSoonCard
                icon={Sparkles}
                title="Differentiation Tool"
                description="Adapt any lesson or resource for SEN, EAL, and higher-ability learners with a single click."
              />
            </div>
          </section>

          <section className="pb-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 shadow-lg shadow-green-200/60">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
              <div className="relative">
                <p className="text-white font-bold text-xl sm:text-2xl mb-2 leading-snug max-w-md">
                  Ready to save hours on lesson planning?
                </p>
                <p className="text-green-100 text-sm mb-6 max-w-sm leading-relaxed">
                  Start with the Lesson Planner and watch your preparation time drop dramatically.
                </p>
                <Link
                  to="/dashboard/lesson-generator"
                  className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors shadow-sm text-sm"
                >
                  Open Lesson Planner
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
