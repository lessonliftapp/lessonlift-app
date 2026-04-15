import React from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { Link } from 'react-router-dom'
import { usePageSEO } from '../hooks/usePageSEO'

export function LoginPage() {
  usePageSEO(
    'Login | LessonLift AI Lesson Planner',
    'Access your LessonLift AI lesson planner dashboard and manage your teaching resources.'
  );
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <img
            src="/Lessonlift_logo,_better_qual copy.jpeg"
            alt="LessonLift Logo"
            className="h-16 w-auto hover:scale-110 transition-transform duration-300"
          />
        </Link>
        <h1 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          Welcome back
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to continue creating amazing lesson plans
        </p>
      </div>
      <LoginForm />
    </div>
  )
}