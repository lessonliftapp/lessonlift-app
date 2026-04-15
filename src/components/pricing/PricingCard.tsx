import React, { useState } from 'react'
import { Check, Star, Loader2 } from 'lucide-react'
import { createCheckoutSession } from '../../services/stripe'
import { StripeProduct } from '../../stripe-config'

interface PricingCardProps {
  product: StripeProduct
  isPopular?: boolean
  currentPlan?: string
}

export function PricingCard({ product, isPopular = false, currentPlan }: PricingCardProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    try {
      setLoading(true)
      const { url } = await createCheckoutSession({
        priceId: product.priceId,
        mode: product.mode,
        planType: product.planType,
      })

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to create checkout session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isCurrentPlan = currentPlan === product.name

  const features = getFeaturesByPlan(product.name)

  return (
    <div className={`relative bg-white rounded-2xl flex flex-col h-full transition-all duration-300 ${
      isPopular
        ? 'border-2 border-[#4CAF50] shadow-xl hover:shadow-2xl'
        : 'border border-gray-200 shadow-md hover:shadow-xl'
    } hover:-translate-y-1`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-[#4CAF50] text-white px-4 sm:px-5 py-2 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
            <Star size={14} fill="currentColor" />
            <span>Most Popular</span>
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8 lg:p-10 flex flex-col flex-grow">
        <div className="text-center mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 tracking-tight">{product.name}</h3>
          <div className="flex items-baseline justify-center mb-2">
            <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">£{product.price}</span>
            <span className="text-gray-500 ml-2 text-sm font-medium">/month</span>
          </div>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{product.description}</p>
        </div>

        <ul className="space-y-3.5 mb-8 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Check size={20} className="text-[#4CAF50]" strokeWidth={2.5} />
              </div>
              <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={loading || isCurrentPlan}
          className={`relative block w-full py-3.5 px-6 rounded-lg font-semibold text-base transition-all duration-200 text-center overflow-hidden ${
            isCurrentPlan
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : loading
              ? 'cursor-wait opacity-75'
              : isPopular
              ? 'bg-[#4CAF50] hover:bg-[#45a049] text-white shadow-sm hover:shadow-md active:scale-98'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-sm hover:shadow active:scale-98'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Processing...</span>
            </span>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            'Choose Plan'
          )}
        </button>
      </div>
    </div>
  )
}

function getFeaturesByPlan(planName: string): string[] {
  switch (planName) {
    case 'LessonLift – Starter':
      return [
        '30 lesson plans per month',
        'UK curriculum-aligned',
        'Export as PDF',
        'Email support'
      ]
    case 'LessonLift – Standard':
      return [
        '50 lesson plans per month',
        'UK curriculum-aligned',
        'Export as PDF and DOCX',
        'Priority support'
      ]
    case 'LessonLift – Pro':
      return [
        'Unlimited lesson plans',
        'UK curriculum-aligned',
        'Export as PDF, DOCX and TXT',
        'Priority support'
      ]
    default:
      return []
  }
}