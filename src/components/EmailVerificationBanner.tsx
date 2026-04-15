import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationBanner: React.FC = () => {
  const { user, isEmailVerified, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (!user || isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    setError(null);
    const { error: resendError } = await resendVerificationEmail();
    setSending(false);
    if (resendError) {
      setError('Could not resend email. Please try again shortly.');
    } else {
      setSent(true);
      setTimeout(() => setSent(false), 6000);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Mail size={15} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900 leading-tight">
                Please verify your email to start generating lesson plans.
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Check your inbox for a verification link from LessonLift.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {sent ? (
              <div className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
                <CheckCircle size={15} />
                Email sent
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={sending}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw size={13} className={sending ? 'animate-spin' : ''} />
                {sending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="text-amber-500 hover:text-amber-700 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
