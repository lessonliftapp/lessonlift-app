import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { PlanType, PLAN_LIMITS, normalizePlan } from './useSubscription'

export interface UsageData {
  plan: PlanType
  monthlyCount: number
  dailyCount: number
  monthResetAt: string
  dayResetAt: string
}

export function usePlanUsage() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.rpc('get_usage', { p_user_id: user.id })
      if (error) {
        console.error('Error fetching usage:', error)
        setUsage(null)
      } else if (data) {
        setUsage({
          plan: normalizePlan(data.plan),
          monthlyCount: data.monthly_count ?? 0,
          dailyCount: data.daily_count ?? 0,
          monthResetAt: data.month_reset_at,
          dayResetAt: data.day_reset_at,
        })
      }
    } catch (err) {
      console.error('Unexpected error fetching usage:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const checkCanGenerate = (plan: PlanType): { allowed: boolean; reason?: string } => {
    if (!usage) return { allowed: true }

    const normalizedPlan = normalizePlan(plan)
    const limits = PLAN_LIMITS[normalizedPlan]

    if (limits.isUnlimited) return { allowed: true }

    if (limits.dailyLimit !== null && usage.dailyCount >= limits.dailyLimit) {
      return {
        allowed: false,
        reason: `You've reached your daily limit of ${limits.dailyLimit} lesson${limits.dailyLimit === 1 ? '' : 's'}. It resets tomorrow.`,
      }
    }

    if (limits.monthlyLimit !== null && usage.monthlyCount >= limits.monthlyLimit) {
      return {
        allowed: false,
        reason: `You've reached your monthly limit of ${limits.monthlyLimit} lessons. It resets next month.`,
      }
    }

    return { allowed: true }
  }

  return { usage, loading, fetchUsage, checkCanGenerate }
}
