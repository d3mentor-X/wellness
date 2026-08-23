import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function useChallenges() {
  const { user, membership } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const userId = user?.id
  const clubId = membership?.club_id
  const isManager = membership?.role === 'admin' || membership?.role === 'instructor'

  const fetchChallenges = useCallback(async () => {
    if (!clubId) {
      setChallenges([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Fetch all challenges for this club
      const { data: challengeData, error: chErr } = await supabase
        .from('challenges')
        .select(`
          id,
          club_id,
          title,
          description,
          challenge_type,
          target_value,
          unit,
          start_date,
          end_date,
          status,
          created_by,
          created_at,
          challenge_participants (
            id,
            user_id,
            current_value,
            completed,
            completed_at,
            joined_at
          )
        `)
        .eq('club_id', clubId)
        .order('start_date', { ascending: false })

      if (chErr) throw chErr

      const today = new Date().toISOString().split('T')[0]

      // Format challenges with user participation metadata
      const formatted = (challengeData || []).map((ch) => {
        const participants = ch.challenge_participants || []
        const userParticipation = participants.find((p) => p.user_id === userId)
        const isJoined = !!userParticipation
        const userProgress = userParticipation ? Number(userParticipation.current_value) : 0
        const isCompleted = userParticipation ? !!userParticipation.completed : false

        // Calculate days left
        const endDateObj = new Date(ch.end_date)
        const todayObj = new Date(today)
        const diffTime = endDateObj - todayObj
        const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

        // Derive dynamic status if end_date has passed
        let computedStatus = ch.status
        if (today > ch.end_date) {
          computedStatus = 'completed'
        } else if (today < ch.start_date) {
          computedStatus = 'upcoming'
        } else {
          computedStatus = 'active'
        }

        // Calculate user position / rank
        let userRank = null
        if (isJoined) {
          const sorted = [...participants].sort((a, b) => Number(b.current_value) - Number(a.current_value))
          const idx = sorted.findIndex((p) => p.user_id === userId)
          if (idx !== -1) userRank = idx + 1
        }

        return {
          ...ch,
          status: computedStatus,
          participantsCount: participants.length,
          isJoined,
          userProgress,
          isCompleted,
          userRank,
          daysLeft,
          progressPercent: Math.min(100, Math.round((userProgress / (Number(ch.target_value) || 1)) * 100)),
        }
      })

      setChallenges(formatted)
    } catch (err) {
      console.error('Error fetching challenges:', err)
      setError(err.message || 'Failed to load club challenges')
    } finally {
      setLoading(false)
    }
  }, [clubId, userId])

  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  // Join a challenge
  const joinChallenge = async (challengeId) => {
    if (!userId || !clubId) throw new Error('Not authenticated')

    const { error: joinErr } = await supabase.rpc('join_challenge', {
      p_challenge_id: challengeId,
    })

    if (joinErr) {
      // Direct fallback
      const { error: directErr } = await supabase
        .from('challenge_participants')
        .insert({ challenge_id: challengeId, user_id: userId })
      if (directErr) throw directErr
    }

    await fetchChallenges()
  }

  // Leave a challenge
  const leaveChallenge = async (challengeId) => {
    if (!userId) throw new Error('Not authenticated')

    const { error: leaveErr } = await supabase.rpc('leave_challenge', {
      p_challenge_id: challengeId,
    })

    if (leaveErr) {
      const { error: directErr } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
      if (directErr) throw directErr
    }

    await fetchChallenges()
  }

  // Create a new challenge (admin / instructor)
  const createChallenge = async ({
    title,
    description,
    challenge_type,
    target_value,
    unit,
    start_date,
    end_date,
  }) => {
    if (!isManager) throw new Error('Unauthorized: Only club admins or instructors can create challenges.')
    if (!clubId) throw new Error('No active club membership')

    const { data, error: createErr } = await supabase
      .from('challenges')
      .insert({
        club_id: clubId,
        title: title.trim(),
        description: description?.trim() || null,
        challenge_type,
        target_value: parseFloat(target_value),
        unit: unit?.trim() || challenge_type,
        start_date,
        end_date,
        created_by: userId,
        status: 'active',
      })
      .select()
      .single()

    if (createErr) throw createErr
    await fetchChallenges()
    return data
  }

  // Fetch live challenge leaderboard
  const fetchChallengeLeaderboard = async (challengeId) => {
    const { data, error: lbErr } = await supabase.rpc('get_challenge_leaderboard', {
      p_challenge_id: challengeId,
    })

    if (!lbErr && Array.isArray(data)) {
      return data
    }

    // Fallback direct query
    const { data: directData, error: dirErr } = await supabase
      .from('challenge_participants')
      .select(`
        id,
        user_id,
        current_value,
        completed,
        completed_at,
        joined_at,
        profiles (
          full_name,
          avatar_url
        ),
        challenges (
          target_value
        )
      `)
      .eq('challenge_id', challengeId)
      .order('current_value', { ascending: false })

    if (dirErr) throw dirErr

    return (directData || []).map((p, idx) => ({
      rank: idx + 1,
      user_id: p.user_id,
      full_name: p.profiles?.full_name || 'Club Member',
      avatar_url: p.profiles?.avatar_url,
      role: 'member',
      current_value: Number(p.current_value),
      target_value: Number(p.challenges?.target_value || 1),
      completed: !!p.completed,
      completed_at: p.completed_at,
      joined_at: p.joined_at,
      progress_percent: Math.min(100, Math.round((Number(p.current_value) / Number(p.challenges?.target_value || 1)) * 100)),
    }))
  }

  const activeChallenges = challenges.filter((c) => c.status === 'active')
  const upcomingChallenges = challenges.filter((c) => c.status === 'upcoming')
  const completedChallenges = challenges.filter((c) => c.status === 'completed')

  // Top joined active challenge for dashboard spotlight
  const userActiveChallenge = activeChallenges.find((c) => c.isJoined) || activeChallenges[0] || null

  return {
    challenges,
    activeChallenges,
    upcomingChallenges,
    completedChallenges,
    userActiveChallenge,
    loading,
    error,
    isManager,
    joinChallenge,
    leaveChallenge,
    createChallenge,
    fetchChallengeLeaderboard,
    refetch: fetchChallenges,
  }
}

