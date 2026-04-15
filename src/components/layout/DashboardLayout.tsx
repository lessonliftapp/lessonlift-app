import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useSubscription } from '../../hooks/useSubscription';
import FeedbackWidget from '../FeedbackWidget';
import EmailVerificationBanner from '../EmailVerificationBanner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  disableFeedback?: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  'price_1SpaYECVrhYYeZRkoBDVNJU1': 'Starter',
  'price_1SpaYaCVrhYYeZRkzoB3NAVC': 'Standard',
  'price_1SpaYuCVrhYYeZRkL3hXHreu': 'Pro',
};

export function DashboardLayout({ children, disableFeedback = false }: DashboardLayoutProps) {
  const { subscription } = useSubscription();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const planLabel = subscription?.price_id
    ? PLAN_LABELS[subscription.price_id] ?? null
    : null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        desktopOpen={desktopSidebarOpen}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex-shrink-0 h-20 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 z-10 relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setDesktopSidebarOpen((v) => !v)}
              className="hidden lg:flex p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={desktopSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {desktopSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <Link to="/" className="flex items-center select-none">
              <img
                src="/Lessonlift_logo,_better_qual.jpeg"
                alt="LessonLift"
                className="h-[3.25rem] w-auto object-contain"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {subscription?.status === 'active' && planLabel && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                {planLabel}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <EmailVerificationBanner />
          {children}
        </main>
      </div>

      <FeedbackWidget disabled={disableFeedback} />
    </div>
  );
}
