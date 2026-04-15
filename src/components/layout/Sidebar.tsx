import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  BookOpen,
  Wrench,
  ClipboardList,
  Sparkles,
  ChevronRight,
  X,
  KeyRound,
  LogOut,
  ChevronUp,
  Check,
  Loader2,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription, PLAN_LABELS } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  desktopOpen?: boolean;
}


const toolsItems = [
  {
    label: 'Lesson Planner',
    to: '/dashboard/lesson-generator',
    icon: BookOpen,
    description: 'AI-powered lesson plans',
  },
];

const comingSoonItems = [
  { label: 'Quiz Builder', icon: ClipboardList, description: 'Create assessments & quizzes' },
  { label: 'Homework Generator', icon: Wrench, description: 'Auto-generate homework tasks' },
  { label: 'Differentiation Tool', icon: Sparkles, description: 'Adapt content for all learners' },
];

interface AccountPanelProps {
  onClose: () => void;
  onCollapse: () => void;
}

function AccountPanel({ onClose, onCollapse }: AccountPanelProps) {
  const { user, signOut } = useAuth();
  const { plan, isActive } = useSubscription();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const planLabel = isActive && plan !== 'free' ? PLAN_LABELS[plan] ?? null : null;

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setFirstName(data.first_name ?? '');
        setLastName(data.last_name ?? '');
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ first_name: firstName.trim(), last_name: lastName.trim() })
      .eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setPwLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + '/dashboard',
    });
    setPwLoading(false);
    setPwMsg(error ? 'Failed to send reset email.' : 'Reset email sent — check your inbox.');
    setTimeout(() => setPwMsg(''), 5000);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <User size={15} className="text-gray-500" />
          <span className="text-sm font-bold text-gray-800">Account</span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Email</p>
          <div className="px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-600 truncate">{user?.email}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Name</p>
          <div className="space-y-2">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <>
                <Check size={14} />
                Saved
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Subscription</p>
          <div className="px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Current plan</span>
            {isActive && planLabel ? (
              <span className="text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                {planLabel}
              </span>
            ) : isActive ? (
              <span className="text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                Active
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-400">Select a plan</span>
            )}
          </div>
          <Link
            to="/pricing"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            Upgrade
          </Link>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-1">
          {pwMsg ? (
            <p className="text-xs text-green-600 font-medium px-1 pb-1">{pwMsg}</p>
          ) : (
            <button
              onClick={handlePasswordReset}
              disabled={pwLoading}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-60"
            >
              {pwLoading ? <Loader2 size={14} className="animate-spin text-gray-400" /> : <KeyRound size={14} className="text-gray-400" />}
              Change password
            </button>
          )}

          <button
            onClick={async () => {
              onClose();
              await signOut();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onClose, desktopOpen = true }: SidebarProps) {
  const { user } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Account';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col bg-white border-r border-gray-100
          w-64 transition-transform duration-300 ease-in-out shadow-xl
          lg:static lg:shadow-none lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${desktopOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full lg:hidden'}
        `}
      >
        {accountOpen ? (
          <AccountPanel
            onClose={() => { setAccountOpen(false); onClose(); }}
            onCollapse={() => setAccountOpen(false)}
          />
        ) : (
          <>
            <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-end lg:hidden">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-7">
              <div>
                <p className="px-3 mb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Tools
                </p>
                <ul className="space-y-0.5">
                  {toolsItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <NavLink
                          to={item.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                              isActive
                                ? 'bg-green-50 text-green-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                                  isActive ? 'bg-green-500 shadow-sm' : 'bg-gray-100 group-hover:bg-gray-200'
                                }`}
                              >
                                <Icon size={15} className={isActive ? 'text-white' : 'text-gray-500'} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                                  {item.label}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</p>
                              </div>
                              {isActive && <ChevronRight size={13} className="text-green-500 flex-shrink-0" />}
                            </>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <p className="px-3 mb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  More Coming Soon
                </p>
                <ul className="space-y-0.5">
                  {comingSoonItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed select-none">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                            <Icon size={14} className="text-gray-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-300 truncate">{item.label}</p>
                            <p className="text-[11px] text-gray-300 truncate mt-0.5">{item.description}</p>
                          </div>
                          <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-semibold tracking-wide flex-shrink-0">
                            Soon
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            <div className="flex-shrink-0 border-t border-gray-100">
              <button
                onClick={() => setAccountOpen(true)}
                className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm font-semibold select-none flex-shrink-0">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                </div>
                <ChevronUp size={14} className="text-gray-400 flex-shrink-0 rotate-90" />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
