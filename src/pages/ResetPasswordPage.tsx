import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { PasswordInput } from '../components/ui/PasswordInput'

type PageState = 'loading' | 'ready' | 'success' | 'invalid'

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let settled = false

    const settle = (state: PageState) => {
      if (!settled) {
        settled = true
        setPageState(state)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        settle('ready')
      } else if (event === 'SIGNED_IN' && session) {
        settle('ready')
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        settle('ready')
      }
    })

    const timeout = setTimeout(() => settle('invalid'), 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError(null)

    if (password.length < 8) {
      setFieldError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setFieldError(error.message)
    } else {
      setPageState('success')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[#4CAF50] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
            <span className="text-white font-bold text-lg leading-none">L</span>
          </div>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">LessonLift</span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-gray-100">

          {pageState === 'loading' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#4CAF50] rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Verifying your reset link...</p>
            </div>
          )}

          {pageState === 'invalid' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Link expired or invalid</h2>
                <p className="text-sm text-gray-500">
                  This password reset link has expired or already been used. Please request a new one.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-3 px-6 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200"
              >
                Request a new reset link
              </Link>
            </div>
          )}

          {pageState === 'success' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated</h2>
                <p className="text-sm text-gray-500">
                  Your password has been updated. You can now log in with your new password.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-3 px-6 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200"
              >
                Go to sign in
              </button>
            </div>
          )}

          {pageState === 'ready' && (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Set a new password</h2>
                <p className="text-sm text-gray-600">Choose a strong password for your account.</p>
              </div>

              {fieldError && (
                <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {fieldError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <PasswordInput
                  label="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  helperText="Must be at least 8 characters"
                />
                <PasswordInput
                  label="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                />
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-3 rounded-lg font-semibold text-base shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {loading ? 'Updating...' : 'Update password'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-[#4CAF50] transition-colors duration-200"
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
