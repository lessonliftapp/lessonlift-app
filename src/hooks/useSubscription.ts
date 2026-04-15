import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type PlanType = 'free' | 'starter' | 'standard' | 'pro'

export function normalizePlan(raw: string | null | undefined): PlanType {
  if (!raw) return 'free'
  const lower = raw.toLowerCase()
  if (lower.startsWith('pro')) return 'pro'
  if (lower.startsWith('standard')) return 'standard'
  if (lower.startsWith('starter')) return 'starter'
  return 'free'
}

export interface SubscriptionData {
  status: string | null
  price_id: string | null
  plan: PlanType
  subscriptionStatus: string
}

export interface PlanLimits {
  monthlyLimit: number | null
  dailyLimit: number | null
  exportFormats: string[]
  isUnlimited: boolean
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    monthlyLimit: null,
    dailyLimit: null,
    exportFormats: [],
    isUnlimited: false,
  },
  starter: {
    monthlyLimit: 30,
    dailyLimit: null,
    exportFormats: ['pdf'],
    isUnlimited: false,
  },
  standard: {
    monthlyLimit: 90,
    dailyLimit: null,
    exportFormats: ['pdf', 'docx'],
    isUnlimited: false,
  },
  pro: {
    monthlyLimit: null,
    dailyLimit: null,
    exportFormats: ['pdf', 'docx', 'txt'],
    isUnlimited: true,
  },
}

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  starter: 'Starter',
  standard: 'Standard',
  pro: 'Pro',
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true)

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plan, subscription_status')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setSubscription(null)
          return
        }

        const plan = normalizePlan(profile?.plan)
        const subscriptionStatus = profile?.subscription_status || 'inactive'
        const isActive = subscriptionStatus === 'active'

        if (!isActive) {
          setSubscription({ status: null, price_id: null, plan: 'free', subscriptionStatus })
          return
        }

        const { data: customerData } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!customerData) {
          setSubscription({ status: 'active', price_id: null, plan, subscriptionStatus })
          return
        }

        const { data: subData } = await supabase
          .from('stripe_subscriptions')
          .select('status, price_id')
          .eq('customer_id', customerData.customer_id)
          .maybeSingle()

        setSubscription({
          status: subData?.status ?? 'active',
          price_id: subData?.price_id ?? null,
          plan,
          subscriptionStatus,
        })
      } catch (err) {
        console.error('Unexpected error fetching subscription:', err)
        setSubscription(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const plan: PlanType = normalizePlan(subscription?.plan)
  const isActive = subscription?.subscriptionStatus === 'active'
  const limits = PLAN_LIMITS[plan]

  return {
    subscription,
    loading,
    isActive,
    hasActiveSubscription: isActive,
    plan,
    limits,
  }
}
