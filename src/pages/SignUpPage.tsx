import React, { useState } from 'react';
import { usePageSEO } from '../hooks/usePageSEO';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, Mail, Lock, User, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    monthlyPrice: '£4.99',
    annualPrice: '£45',
    annualSavings: 'Save £15/year',
    description: '30 lesson plans per month',
    features: [
      '30 lessons per month',
      'UK curriculum-aligned',
      'PDF export',
      'Email support'
    ],
    popular: false
  },
  {
    id: 'standard' as const,
    name: 'Standard',
    monthlyPrice: '£7.99',
    annualPrice: '£75',
    annualSavings: 'Save £21/year',
    description: '90 lesson plans per month',
    features: [
      '90 lessons per month',
      'UK curriculum-aligned',
      'PDF & DOCX export',
      'Priority email support'
    ],
    popular: true
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    monthlyPrice: '£12.99',
    annualPrice: '£120',
    annualSavings: 'Save £36/year',
    description: 'Unlimited lesson plans',
    features: [
      'Unlimited lessons per month',
      'UK curriculum-aligned',
      'All export formats (PDF, DOCX, TXT)',
      'Priority support'
    ],
    popular: false
  }
];

const SignUpPage: React.FC = () => {
  usePageSEO(
    'Register for AI Lesson Planner | LessonLift',
    'Sign up for LessonLift and start creating AI-powered lesson plans and classroom resources today.'
  );

  const [searchParams] = useSearchParams();
  const initialPlan = (searchParams.get('plan') as 'starter' | 'standard' | 'pro') || 'standard';
  const initialBilling = (searchParams.get('billing') as 'monthly' | 'annual') || 'monthly';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'standard' | 'pro'>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(initialBilling);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { user, error: signUpError } = await signUp(email, password, name, selectedPlan);

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (!user) {
        setError('Account could not be created. Please try again.');
        setIsLoading(false);
        return;
      }

      navigate(`/pricing?plan=${selectedPlan}&billing=${billingCycle}`);
    } catch (err: any) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Create Your <span className="text-[#4CAF50]">LessonLift</span> Account
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose a plan that fits your needs and start planning lessons today
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column - Plan Selection */}
              <div className="order-2 lg:order-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${billingCycle === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Annual
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 ${
                        selectedPlan === plan.id
                          ? 'border-[#4CAF50] bg-green-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-6 bg-[#4CAF50] text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Recommended
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                          <p className="text-gray-600 text-sm">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                          </div>
                          <div className="text-sm text-gray-500">
                            {billingCycle === 'monthly' ? 'per month' : 'per year'}
                          </div>
                          {billingCycle === 'annual' && (
                            <div className="text-xs font-semibold text-[#4CAF50] mt-0.5">{plan.annualSavings}</div>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <Check size={16} className="text-[#4CAF50] mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {selectedPlan === plan.id && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-[#4CAF50] rounded-full flex items-center justify-center">
                          <Check size={16} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Sign Up Form */}
              <div className="order-1 lg:order-2">
                <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-24">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Details</h2>

                  <form onSubmit={handleSignUp} className="space-y-5">
                    {error && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start space-x-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-800">Error</p>
                          <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200"
                          placeholder="John Smith"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="password"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200"
                          placeholder="Create a strong password"
                          required
                          minLength={8}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Must be at least 8 characters</p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <span>Creating Account...</span>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-600 mt-4">
                      Already have an account?{' '}
                      <Link to="/login" className="text-[#4CAF50] hover:text-[#45a049] font-semibold">
                        Log in
                      </Link>
                    </p>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      By creating an account, you agree to our{' '}
                      <Link to="/terms-of-service" className="text-[#4CAF50] hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy-policy" className="text-[#4CAF50] hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SignUpPage;
