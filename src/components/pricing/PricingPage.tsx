import React, { useEffect, useState } from 'react'
import { Check, Star, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { createCheckoutSession } from '../../utils/stripe'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../Header'
import Footer from '../Footer'
import { usePageSEO } from '../../hooks/usePageSEO'

export function PricingPage() {
  usePageSEO(
    'AI Lesson Planning Software Pricing | LessonLift',
    'Affordable AI lesson planning software for teachers. Save hours every week with LessonLift.'
  );
  const [searchParams] = useSearchParams()
  const initialBilling = (searchParams.get('billing') as 'monthly' | 'annual') || 'monthly'

  const [isVisible, setIsVisible] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(initialBilling)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handlePlanClick = async (planBaseType: 'starter' | 'standard' | 'pro', priceId: string) => {
    if (!user) {
      navigate(`/signup?plan=${planBaseType}&billing=${billingCycle}`)
      return
    }

    setLoadingPlan(planBaseType)
    try {
      const planType = billingCycle === 'annual' ? `${planBaseType}_annual` : planBaseType

      await createCheckoutSession({
        priceId,
        planType: planType as 'starter' | 'standard' | 'pro',
      })
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
      setLoadingPlan(null)
    }
  }

  const standardPlans = [
    {
      name: "Starter",
      planType: "starter" as const,
      monthlyPrice: "£4.99",
      annualPrice: "£45",
      monthlyPriceId: "price_1SpaYECVrhYYeZRkoBDVNJU1",
      annualPriceId: "price_1T07ECCVrhYYeZRkvwIjJw4S",
      annualSavings: "Save £15/year",
      description: "Great for individual teachers getting started.",
      features: ["30 lesson plans per month", "UK curriculum-aligned", "Export as PDF", "Email support"],
      cta: "Choose Starter",
      popular: false,
    },
    {
      name: "Standard",
      planType: "standard" as const,
      monthlyPrice: "£7.99",
      annualPrice: "£75",
      monthlyPriceId: "price_1SpaYaCVrhYYeZRkzoB3NAVC",
      annualPriceId: "price_1T07EXCVrhYYeZRksH8u3rCl",
      annualSavings: "Save £21/year",
      description: "Most popular choice for busy teachers.",
      features: ["90 lesson plans per month", "UK curriculum-aligned", "Export as PDF and DOCX", "Priority support"],
      cta: "Choose Standard",
      popular: true,
    },
    {
      name: "Pro",
      planType: "pro" as const,
      monthlyPrice: "£12.99",
      annualPrice: "£120",
      monthlyPriceId: "price_1SpaYuCVrhYYeZRkL3hXHreu",
      annualPriceId: "price_1T07F5CVrhYYeZRkj3cSujKL",
      annualSavings: "Save £36/year",
      description: "For power users and high-volume planning.",
      features: ["Unlimited lesson plans", "UK curriculum-aligned", "Export as PDF, DOCX and TXT", "Priority support"],
      cta: "Choose Pro",
      popular: false,
    }
  ]

  const displayPrice = (plan: typeof standardPlans[0]) => billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
  const displayPeriod = () => billingCycle === 'monthly' ? 'per month' : 'per year'

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section id="pricing" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-4">
              Choose the plan that fits your teaching needs.
            </p>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto font-medium mb-8">
              30, 50, or unlimited lesson plans per month — choose the plan that fits your teaching.
            </p>

            <div className="flex justify-center items-center gap-4 mb-12">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${billingCycle === 'monthly' ? 'bg-[#4CAF50] text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >Monthly</button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${billingCycle === 'annual' ? 'bg-[#4CAF50] text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >Annual</button>
            </div>
          </div>

          <div className="mb-16 sm:mb-20">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10 text-center">Individual Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {standardPlans.map((plan, index) => (
                <div key={index} style={{ animationDelay: `${index * 100}ms` }} className={`pricing-card relative bg-white rounded-2xl flex flex-col h-full will-change-transform will-change-shadow transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${plan.popular ? 'border-2 border-[#4CAF50] shadow-xl hover:shadow-2xl' : 'border border-gray-200 shadow-md hover:shadow-xl'} hover:-translate-y-1`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-[#4CAF50] text-white px-4 sm:px-5 py-2 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
                        <Star size={14} fill="currentColor" />
                        <span>Most Popular</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 sm:p-8 lg:p-10 flex flex-col flex-grow">
                    <div className="text-center mb-8">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 tracking-tight">{plan.name}</h3>
                      <div className="flex items-baseline justify-center mb-2">
                        <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">{displayPrice(plan)}</span>
                        <span className="text-gray-500 ml-2 text-sm font-medium">/{displayPeriod()}</span>
                      </div>
                      {billingCycle === 'annual' && <div className="text-sm font-semibold text-[#4CAF50] mb-3">{plan.annualSavings}</div>}
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{plan.description}</p>
                    </div>

                    <ul className="space-y-3.5 mb-8 flex-grow">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <Check size={20} className="text-[#4CAF50]" strokeWidth={2.5} />
                          </div>
                          <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handlePlanClick(plan.planType, billingCycle === 'monthly' ? plan.monthlyPriceId : plan.annualPriceId)}
                      disabled={loadingPlan === plan.planType}
                      className={`relative block w-full py-3.5 px-6 rounded-lg font-semibold text-base transition-all duration-200 text-center overflow-hidden ${loadingPlan === plan.planType ? 'cursor-wait opacity-75' : ''} ${plan.popular ? 'bg-[#4CAF50] hover:bg-[#45a049] text-white shadow-sm hover:shadow-md active:scale-98' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-sm hover:shadow active:scale-98'}`}
                    >
                      {loadingPlan === plan.planType ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={18} className="animate-spin" />
                          <span>Processing...</span>
                        </span>
                      ) : (
                        plan.cta
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
