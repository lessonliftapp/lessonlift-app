import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PasswordInput } from '../ui/PasswordInput'
import { Alert } from '../ui/Alert'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const navigate = useNavigate()

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage(null)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rtmactxdmjjntlzwhqkm.supabase.co'
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bWFjdHhkbWpqbnRsendocWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzI5NTEsImV4cCI6MjA3NTk0ODk1MX0.8tgk9qQs5nDumvFFQwfotEu6m90YV7jrjBybZ-Er_QY'

      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password-reset',
          to: resetEmail.trim(),
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      })
    } catch (_) {
    }

    setResetLoading(false)
    setResetMessage({ type: 'success', text: 'If an account exists with this email, a reset link has been sent.' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (resetMode) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
            <p className="text-sm text-gray-600">
              Enter your email and we'll send you a reset link.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Check your spam or junk folder if it doesn't arrive within a minute or two.
            </p>
          </div>

          {resetMessage && (
            <Alert type={resetMessage.type} className="mb-6">
              {resetMessage.text}
            </Alert>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Button
              type="submit"
              loading={resetLoading}
              className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-3 rounded-lg font-semibold text-base shadow-sm hover:shadow-md transition-all duration-200"
            >
              {resetLoading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setResetMode(false); setResetMessage(null); }}
              className="text-sm text-gray-600 hover:text-[#4CAF50] transition-colors duration-200"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#4CAF50] hover:text-[#45a049] transition-colors duration-200">
              Sign up free
            </Link>
          </p>
        </div>

        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div>
            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="mt-1.5 text-right">
              <button
                type="button"
                onClick={() => { setResetMode(true); setResetEmail(email); }}
                className="text-xs text-gray-500 hover:text-[#4CAF50] transition-colors duration-200"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-3 rounded-lg font-semibold text-base shadow-sm hover:shadow-md transition-all duration-200"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-[#4CAF50] transition-colors duration-200">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}