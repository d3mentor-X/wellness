import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function useSocial() {
  const { user, membership } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [timeFilter, setTimeFilter] = useState('all_time') // 'all_time' | 'this_month' | 'this_week'
  const [momentum, setMomentum] = useState({
    members_active_today: 0,
    workouts_today: 0,
    steps_today: 0,
    active_challenges_count: 0,
    achievements_count: 0,
    active_members: [],
  })
  const [activityFeed, setActivityFeed] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [whatsappLink, setWhatsappLink] = useState('https://chat.whatsapp.com')
  const [loading, setLoading] = useState(true)
  const [error] = useState(null)

  const userId = user?.id
  const clubId = membership?.club_id
  const isManager = membership?.role === 'admin' || membership?.role === 'instructor'

  // 1. Fetch Leaderboard
  const fetchLeaderboard = useCallback(async (filter = timeFilter) => {
    if (!clubId) return
    try {
      const { data, error: lbErr } = await supabase.rpc('get_club_leaderboard', {
        p_club_id: clubId,
        p_time_filter: filter,
      })

      if (!lbErr && Array.isArray(data)) {
        setLeaderboard(data)
      } else {
        // Fallback: fetch from club_member_directory / club_members
        const { data: memberData } = await supabase
          .from('club_members')
          .select(`
            user_id,
            role,
            profiles (
              full_name,
              avatar_url
            )
          `)
          .eq('club_id', clubId)
          .eq('status', 'active')

        const mapped = (memberData || []).map((m, i) => ({
          rank: i + 1,
          user_id: m.user_id,
          full_name: m.profiles?.full_name || 'Club Member',
          avatar_url: m.profiles?.avatar_url,
          role: m.role || 'member',
          total_xp: 0,
          current_streak: 0,
          total_workouts: 0,
          total_steps: 0,
          level: 1,
        }))
        setLeaderboard(mapped)
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
    }
  }, [clubId, timeFilter])

  // 2. Fetch Momentum
  const fetchMomentum = useCallback(async () => {
    if (!clubId) return
    const clientDate = new Date().toISOString().split('T')[0]

    try {
      const { data, error: momErr } = await supabase.rpc('get_club_momentum', {
        p_club_id: clubId,
        p_client_date: clientDate,
      })

      if (!momErr && data) {
        setMomentum({
          members_active_today: data.members_active_today || 0,
          workouts_today: data.workouts_today || 0,
          steps_today: data.steps_today || 0,
          active_challenges_count: data.active_challenges_count || 0,
          achievements_count: data.achievements_count || 0,
          active_members: Array.isArray(data.active_members) ? data.active_members : [],
        })
      }
    } catch (err) {
      console.error('Error fetching momentum:', err)
    }
  }, [clubId])

  // 3. Fetch Activity Feed & Reactions
  const fetchActivityFeed = useCallback(async () => {
    if (!clubId) return

    try {
      const { data: feedData, error: feedErr } = await supabase
        .from('activity_feed')
        .select(`
          id,
          club_id,
          user_id,
          activity_type,
          message,
          metadata,
          created_at,
          profiles (
            full_name,
            avatar_url
          ),
          activity_reactions (
            id,
            user_id,
            reaction_type
          )
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (feedErr) throw feedErr

      const mapped = (feedData || []).map((item) => {
        const reactionsList = item.activity_reactions || []
        const reactionCounts = { heart: 0, fire: 0, muscle: 0, clap: 0 }
        const userReactions = new Set()

        reactionsList.forEach((r) => {
          if (reactionCounts[r.reaction_type] !== undefined) {
            reactionCounts[r.reaction_type] += 1
          }
          if (r.user_id === userId) {
            userReactions.add(r.reaction_type)
          }
        })

        return {
          id: item.id,
          user_id: item.user_id,
          full_name: item.profiles?.full_name || 'Club Member',
          avatar_url: item.profiles?.avatar_url,
          activity_type: item.activity_type,
          message: item.message,
          metadata: item.metadata || {},
          created_at: item.created_at,
          reactionCounts,
          userReactions,
          totalReactions: reactionsList.length,
        }
      })

      setActivityFeed(mapped)
    } catch (err) {
      console.error('Error fetching activity feed:', err)
    }
  }, [clubId, userId])

  // 4. Fetch Announcements & Club Config
  const fetchAnnouncements = useCallback(async () => {
    if (!clubId) return

    try {
      // Announcements
      const { data: annData } = await supabase
        .from('club_announcements')
        .select(`
          id,
          club_id,
          author_id,
          title,
          message,
          is_pinned,
          created_at,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('club_id', clubId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)

      if (annData) {
        setAnnouncements(annData)
      }

      // WhatsApp link from club
      const { data: clubData } = await supabase
        .from('clubs')
        .select('whatsapp_group_link')
        .eq('id', clubId)
        .single()

      if (clubData?.whatsapp_group_link) {
        setWhatsappLink(clubData.whatsapp_group_link)
      }
    } catch (err) {
      console.error('Error fetching announcements/club:', err)
    }
  }, [clubId])

  // Initial load
  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      await Promise.all([
        fetchLeaderboard(),
        fetchMomentum(),
        fetchActivityFeed(),
        fetchAnnouncements(),
      ])
      setLoading(false)
    }
    loadAll()
  }, [fetchLeaderboard, fetchMomentum, fetchActivityFeed, fetchAnnouncements])

  // Realtime subscription for activity_feed
  useEffect(() => {
    if (!clubId) return

    const channel = supabase
      .channel(`club_social_${clubId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_feed',
          filter: `club_id=eq.${clubId}`,
        },
        () => {
          fetchActivityFeed()
          fetchMomentum()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clubId, fetchActivityFeed, fetchMomentum])

  // Toggle Reaction
  const toggleReaction = async (activityId, reactionType) => {
    if (!userId) return

    // Optimistic UI update
    setActivityFeed((prev) =>
      prev.map((item) => {
        if (item.id !== activityId) return item
        const hasReacted = item.userReactions.has(reactionType)
        const newReactionSet = new Set(item.userReactions)
        const newCounts = { ...item.reactionCounts }

        if (hasReacted) {
          newReactionSet.delete(reactionType)
          newCounts[reactionType] = Math.max(0, newCounts[reactionType] - 1)
        } else {
          newReactionSet.add(reactionType)
          newCounts[reactionType] = (newCounts[reactionType] || 0) + 1
        }

        return {
          ...item,
          userReactions: newReactionSet,
          reactionCounts: newCounts,
          totalReactions: hasReacted ? item.totalReactions - 1 : item.totalReactions + 1,
        }
      })
    )

    try {
      await supabase.rpc('toggle_activity_reaction', {
        p_activity_id: activityId,
        p_reaction_type: reactionType,
      })
    } catch (err) {
      console.error('Error toggling reaction:', err)
      fetchActivityFeed()
    }
  }

  // Create Announcement (admin/instructor)
  const createAnnouncement = async ({ title, message, is_pinned = false }) => {
    if (!isManager || !clubId) throw new Error('Unauthorized')

    const { data, error: annErr } = await supabase
      .from('club_announcements')
      .insert({
        club_id: clubId,
        author_id: userId,
        title: title.trim(),
        message: message.trim(),
        is_pinned,
      })
      .select()
      .single()

    if (annErr) throw annErr
    await fetchAnnouncements()
    return data
  }

  return {
    leaderboard,
    timeFilter,
    setTimeFilter: (f) => {
      setTimeFilter(f)
      fetchLeaderboard(f)
    },
    momentum,
    activityFeed,
    announcements,
    whatsappLink,
    loading,
    error,
    isManager,
    toggleReaction,
    createAnnouncement,
    refetchAll: () => {
      fetchLeaderboard()
      fetchMomentum()
      fetchActivityFeed()
      fetchAnnouncements()
    },
  }
}
