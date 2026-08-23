import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function useDailyActivity() {
  const { user, membership } = useAuth()
  const [todayActivity, setTodayActivity] = useState({
    steps: 0,
    water_glasses: 0,
    workout_completed: false,
    notes: '',
  })
  const [activityHistory, setActivityHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const userId = user?.id
  const clubId = membership?.club_id
  const todayDate = new Date().toISOString().split('T')[0]

  const fetchDailyData = useCallback(async () => {
    if (!userId) {
      setTodayActivity({ steps: 0, water_glasses: 0, workout_completed: false, notes: '' })
      setActivityHistory([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Fetch today's daily activity
      const { data: todayData, error: todayError } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_date', todayDate)
        .maybeSingle()

      if (todayError && todayError.code !== 'PGRST116') {
        console.warn('Error fetching today daily_activity:', todayError)
      }

      if (todayData) {
        setTodayActivity({
          steps: todayData.steps || 0,
          water_glasses: todayData.water_glasses || 0,
          workout_completed: !!todayData.workout_completed,
          notes: todayData.notes || '',
        })
      } else {
        // Fallback check legacy steps table for today if daily_activity record not yet created
        const { data: stepData } = await supabase
          .from('steps')
          .select('step_count')
          .eq('user_id', userId)
          .eq('activity_date', todayDate)
          .maybeSingle()

        setTodayActivity({
          steps: stepData?.step_count || 0,
          water_glasses: 0,
          workout_completed: false,
          notes: '',
        })
      }

      // 2. Fetch recent activity history (last 14 days)
      const { data: historyData, error: histError } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', userId)
        .order('activity_date', { ascending: false })
        .limit(14)

      if (!histError && Array.isArray(historyData) && historyData.length > 0) {
        setActivityHistory(historyData)
      } else {
        // Fallback to steps table history
        const { data: legacySteps } = await supabase
          .from('steps')
          .select('activity_date, step_count')
          .eq('user_id', userId)
          .order('activity_date', { ascending: false })
          .limit(14)

        if (legacySteps) {
          setActivityHistory(
            legacySteps.map((s) => ({
              activity_date: s.activity_date,
              steps: s.step_count,
              water_glasses: 0,
              workout_completed: false,
            }))
          )
        }
      }
    } catch (err) {
      console.error('Error in useDailyActivity:', err)
      setError(err.message || 'Failed to load daily activity')
    } finally {
      setLoading(false)
    }
  }, [userId, todayDate])

  useEffect(() => {
    fetchDailyData()
  }, [fetchDailyData])

  // Update today's steps
  const updateTodaySteps = async (stepsCount) => {
    if (!userId || !clubId) return
    const validSteps = Math.max(0, parseInt(stepsCount, 10) || 0)

    try {
      // Upsert daily_activity
      const { error: actErr } = await supabase
        .from('daily_activity')
        .upsert(
          {
            user_id: userId,
            club_id: clubId,
            activity_date: todayDate,
            steps: validSteps,
          },
          { onConflict: 'user_id,activity_date' }
        )

      if (actErr) throw actErr

      // Legacy steps table sync
      await supabase
        .from('steps')
        .upsert(
          {
            user_id: userId,
            club_id: clubId,
            activity_date: todayDate,
            step_count: validSteps,
          },
          { onConflict: 'user_id,club_id,activity_date' }
        )

      setTodayActivity((prev) => ({ ...prev, steps: validSteps }))
      await fetchDailyData()
    } catch (err) {
      console.error('Error updating steps:', err)
      throw err
    }
  }

  // Update today's water glasses
  const updateTodayWater = async (glasses) => {
    if (!userId || !clubId) return
    const validGlasses = Math.max(0, parseInt(glasses, 10) || 0)

    try {
      const { error: actErr } = await supabase
        .from('daily_activity')
        .upsert(
          {
            user_id: userId,
            club_id: clubId,
            activity_date: todayDate,
            water_glasses: validGlasses,
          },
          { onConflict: 'user_id,activity_date' }
        )

      if (actErr) throw actErr
      setTodayActivity((prev) => ({ ...prev, water_glasses: validGlasses }))
    } catch (err) {
      console.error('Error updating water glasses:', err)
    }
  }

  // Toggle today's workout completed state
  const toggleTodayWorkout = async (completed) => {
    if (!userId || !clubId) return

    try {
      const { error: actErr } = await supabase
        .from('daily_activity')
        .upsert(
          {
            user_id: userId,
            club_id: clubId,
            activity_date: todayDate,
            workout_completed: !!completed,
          },
          { onConflict: 'user_id,activity_date' }
        )

      if (actErr) throw actErr
      setTodayActivity((prev) => ({ ...prev, workout_completed: !!completed }))
    } catch (err) {
      console.error('Error updating workout completion:', err)
    }
  }

  return {
    todayActivity,
    activityHistory,
    loading,
    error,
    updateTodaySteps,
    updateTodayWater,
    toggleTodayWorkout,
    refetch: fetchDailyData,
  }
}

