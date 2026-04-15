import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PasswordInput } from '../ui/PasswordInput'
import { Alert } from '../ui/Alert'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Auto-sign in after successful signup
        setTimeout(() => {
          navigate('/')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
          <Alert type="success" title="Account created successfully!">
            Welcome to LessonLift! You'll be redirected to the dashboard shortly.
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#4CAF50] hover:text-[#45a049] transition-colors duration-200">
              Sign in
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

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            helperText="Must be at least 6 characters long"
          />

          <PasswordInput
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-3 rounded-lg font-semibold text-base shadow-sm hover:shadow-md transition-all duration-200"
          >
            {loading ? 'Creating account...' : 'Create account'}
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