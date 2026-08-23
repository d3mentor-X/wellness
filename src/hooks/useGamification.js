import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { calculateLevel, FALLBACK_ACHIEVEMENTS } from '../utils/gamification'

export function useGamification() {
  const { user, membership } = useAuth()
  const [totalXp, setTotalXp] = useState(0)
  const [streakInfo, setStreakInfo] = useState({
    current_streak: 0,
    longest_streak: 0,
    active_today: false,
    total_active_days: 0,
  })
  const [achievements, setAchievements] = useState([])
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalSteps: 0,
    activeDays: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const userId = user?.id
  const clubId = membership?.club_id

  const syncGamification = useCallback(async () => {
    if (!userId) {
      setTotalXp(0)
      setStreakInfo({ current_streak: 0, longest_streak: 0, active_today: false, total_active_days: 0 })
      setAchievements([])
      setStats({ totalWorkouts: 0, totalSteps: 0, activeDays: 0 })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const clientDate = new Date().toISOString().split('T')[0]

    try {
      // 1. Try sync_user_gamification RPC function
      let rpcResult = null
      if (clubId) {
        const { data, error: rpcErr } = await supabase.rpc('sync_user_gamification', {
          p_user_id: userId,
          p_club_id: clubId,
          p_client_date: clientDate,
        })
        if (!rpcErr && data) {
          rpcResult = data
        }
      }

      // 2. Fetch all achievement definitions
      const { data: allAchData } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true })

      const baseAchievements = (allAchData && allAchData.length > 0) ? allAchData : FALLBACK_ACHIEVEMENTS

      // 3. Fetch user awarded achievements
      const { data: userAchData } = await supabase
        .from('user_achievements')
        .select('achievement_id, awarded_at')
        .eq('user_id', userId)

      const awardedMap = new Map()
      if (Array.isArray(userAchData)) {
        userAchData.forEach((ua) => {
          awardedMap.set(ua.achievement_id, ua.awarded_at)
        })
      }

      // 4. Fetch total XP from xp_transactions
      const { data: xpRows } = await supabase
        .from('xp_transactions')
        .select('amount')
        .eq('user_id', userId)

      const computedTotalXp = (xpRows || []).reduce((sum, row) => sum + (row.amount || 0), 0)
      const finalXp = rpcResult?.total_xp ?? computedTotalXp
      setTotalXp(finalXp)

      // 5. Fetch Workouts & Steps for stats & fallback streak calculation
      const { count: workoutCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      const totalWorkoutsCount = rpcResult?.total_workouts ?? workoutCount ?? 0

      const { data: actRows } = await supabase
        .from('daily_activity')
        .select('steps, activity_date, workout_completed')
        .eq('user_id', userId)

      const totalStepsCount = rpcResult?.total_steps ?? (actRows || []).reduce((sum, r) => sum + (r.steps || 0), 0)

      // Fallback streak calculation if RPC wasn't executed
      let currentStreak = rpcResult?.current_streak ?? 0
      let longestStreak = rpcResult?.longest_streak ?? 0
      let activeToday = rpcResult?.active_today ?? false
      let totalActiveDays = rpcResult?.total_active_days ?? 0

      if (!rpcResult) {
        const { data: streakData } = await supabase.rpc('calculate_user_streak', {
          p_user_id: userId,
          p_client_date: clientDate,
        })
        if (streakData && streakData.length > 0) {
          currentStreak = streakData[0].current_streak || 0
          longestStreak = streakData[0].longest_streak || 0
          activeToday = !!streakData[0].active_today
          totalActiveDays = streakData[0].total_active_days || 0
        }
      }

      setStreakInfo({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        active_today: activeToday,
        total_active_days: totalActiveDays,
      })

      setStats({
        totalWorkouts: totalWorkoutsCount,
        totalSteps: totalStepsCount,
        activeDays: totalActiveDays,
      })

      // 6. Map achievements with locked / unlocked progress
      const mappedAchievements = baseAchievements.map((ach) => {
        const isUnlocked = awardedMap.has(ach.id) || (rpcResult && awardedMap.has(ach.name))
        const awardedAt = awardedMap.get(ach.id) || awardedMap.get(ach.name) || null

        // Calculate progress towards locked achievement
        let progress = isUnlocked ? 100 : 0
        if (!isUnlocked && ach.requirement_value > 0) {
          if (ach.requirement_type === 'streak_days') {
            progress = Math.min(99, Math.round((longestStreak / ach.requirement_value) * 100))
          } else if (ach.requirement_type === 'total_workouts') {
            progress = Math.min(99, Math.round((totalWorkoutsCount / ach.requirement_value) * 100))
          } else if (ach.requirement_type === 'total_steps') {
            progress = Math.min(99, Math.round((totalStepsCount / ach.requirement_value) * 100))
          } else if (ach.requirement_type === 'single_day_steps') {
            const maxSingleDay = (actRows || []).reduce((max, r) => Math.max(max, r.steps || 0), 0)
            progress = Math.min(99, Math.round((maxSingleDay / ach.requirement_value) * 100))
          }
        }

        return {
          id: ach.id,
          name: ach.name,
          title: ach.name,
          description: ach.description,
          icon: ach.icon || '🏆',
          tier: ach.tier || 'bronze',
          unlocked: isUnlocked,
          awardedAt: awardedAt ? new Date(awardedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null,
          progressPercent: progress,
        }
      })

      setAchievements(mappedAchievements)
    } catch (err) {
      console.error('Error in useGamification:', err)
      setError(err.message || 'Failed to sync gamification data')
    } finally {
      setLoading(false)
    }
  }, [userId, clubId])

  useEffect(() => {
    syncGamification()
  }, [syncGamification])

  const levelInfo = calculateLevel(totalXp)
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return {
    totalXp,
    levelInfo,
    streakInfo,
    achievements,
    unlockedCount,
    stats,
    loading,
    error,
    syncGamification,
  }
}

