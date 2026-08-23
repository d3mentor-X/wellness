import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function useAdmin() {
  const { user, membership } = useAuth()
  const [overview, setOverview] = useState({
    total_members: 0,
    pending_members: 0,
    active_today: 0,
    workouts_today: 0,
    steps_today: 0,
    active_challenges: 0,
  })
  const [members, setMembers] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [exercises, setExercises] = useState([])
  const [moderationLogs, setModerationLogs] = useState([])
  const [clubSettings, setClubSettings] = useState({
    name: '',
    description: '',
    whatsapp_group_link: '',
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const clubId = membership?.club_id
  const userRole = membership?.role
  const isAdmin = userRole === 'admin'
  const isInstructor = userRole === 'instructor' || userRole === 'admin'

  // 1. Fetch Overview
  const fetchOverview = useCallback(async () => {
    if (!clubId || !isInstructor) return
    try {
      const { data, error: ovErr } = await supabase.rpc('admin_get_club_overview', {
        p_club_id: clubId,
      })
      if (!ovErr && data) {
        setOverview(data)
      }
    } catch (err) {
      console.error('Error fetching admin overview:', err)
    }
  }, [clubId, isInstructor])

  // 2. Fetch Members Detailed
  const fetchMembers = useCallback(async (filter = statusFilter, search = searchQuery) => {
    if (!clubId || !isInstructor) return
    try {
      const { data, error: memErr } = await supabase.rpc('admin_get_members_detailed', {
        p_club_id: clubId,
        p_status_filter: filter,
        p_search: search,
      })
      if (!memErr && Array.isArray(data)) {
        setMembers(data)
      }
    } catch (err) {
      console.error('Error fetching admin members:', err)
    }
  }, [clubId, isInstructor, statusFilter, searchQuery])

  // 3. Fetch Exercises (including archived)
  const fetchExercises = useCallback(async () => {
    if (!isInstructor) return
    try {
      const { data, error: exErr } = await supabase
        .from('exercises')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (!exErr && data) {
        setExercises(data)
      }
    } catch (err) {
      console.error('Error fetching exercises:', err)
    }
  }, [isInstructor])

  // 4. Fetch Moderation Logs
  const fetchModerationLogs = useCallback(async () => {
    if (!clubId || !isAdmin) return
    try {
      const { data, error: logErr } = await supabase.rpc('admin_get_moderation_logs', {
        p_club_id: clubId,
      })
      if (!logErr && Array.isArray(data)) {
        setModerationLogs(data)
      }
    } catch (err) {
      console.error('Error fetching moderation logs:', err)
    }
  }, [clubId, isAdmin])

  // 5. Fetch Club Settings
  const fetchClubSettings = useCallback(async () => {
    if (!clubId) return
    try {
      const { data, error: clubErr } = await supabase
        .from('clubs')
        .select('name, description, whatsapp_group_link')
        .eq('id', clubId)
        .single()

      if (!clubErr && data) {
        setClubSettings({
          name: data.name || '',
          description: data.description || '',
          whatsapp_group_link: data.whatsapp_group_link || 'https://chat.whatsapp.com',
        })
      }
    } catch (err) {
      console.error('Error fetching club settings:', err)
    }
  }, [clubId])

  // Initial load
  useEffect(() => {
    async function loadAdminData() {
      if (!isInstructor) {
        setLoading(false)
        return
      }
      setLoading(true)
      await Promise.all([
        fetchOverview(),
        fetchMembers(),
        fetchExercises(),
        fetchModerationLogs(),
        fetchClubSettings(),
      ])
      setLoading(false)
    }
    loadAdminData()
  }, [fetchOverview, fetchMembers, fetchExercises, fetchModerationLogs, fetchClubSettings, isInstructor])

  // Status Action (Approve, Suspend, Restore, Ban, Remove)
  const updateMemberStatus = async (targetUserId, newStatus, reason = null) => {
    if (!isAdmin || !clubId) throw new Error('Unauthorized: Admin role required.')
    setActionLoading(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('admin_update_member_status', {
        p_club_id: clubId,
        p_target_user_id: targetUserId,
        p_new_status: newStatus,
        p_reason: reason,
      })
      if (rpcErr) throw rpcErr
      await Promise.all([fetchMembers(), fetchOverview(), fetchModerationLogs()])
    } catch (err) {
      console.error('Error updating member status:', err)
      setError(err.message || 'Failed to update member status')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Role Action (Assign/Remove Instructor)
  const setMemberRole = async (targetUserId, newRole) => {
    if (!isAdmin || !clubId) throw new Error('Unauthorized: Admin role required.')
    setActionLoading(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('admin_set_member_role', {
        p_club_id: clubId,
        p_target_user_id: targetUserId,
        p_new_role: newRole,
      })
      if (rpcErr) throw rpcErr
      await Promise.all([fetchMembers(), fetchModerationLogs()])
    } catch (err) {
      console.error('Error setting member role:', err)
      setError(err.message || 'Failed to set member role')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Mute Member
  const muteMember = async (targetUserId, durationMinutes = 60) => {
    if (!isInstructor || !clubId) throw new Error('Unauthorized')
    setActionLoading(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('admin_mute_member', {
        p_club_id: clubId,
        p_target_user_id: targetUserId,
        p_duration_minutes: durationMinutes,
      })
      if (rpcErr) throw rpcErr
      await Promise.all([fetchMembers(), fetchModerationLogs()])
    } catch (err) {
      console.error('Error muting member:', err)
      setError(err.message || 'Failed to mute member')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Unmute Member
  const unmuteMember = async (targetUserId) => {
    if (!isInstructor || !clubId) throw new Error('Unauthorized')
    setActionLoading(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('admin_unmute_member', {
        p_club_id: clubId,
        p_target_user_id: targetUserId,
      })
      if (rpcErr) throw rpcErr
      await Promise.all([fetchMembers(), fetchModerationLogs()])
    } catch (err) {
      console.error('Error unmuting member:', err)
      setError(err.message || 'Failed to unmute member')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Update Club Settings
  const updateClubSettings = async ({ name, description, whatsapp_link }) => {
    if (!isAdmin || !clubId) throw new Error('Unauthorized: Admin role required.')
    setActionLoading(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('admin_update_club_settings', {
        p_club_id: clubId,
        p_name: name.trim(),
        p_description: description?.trim() || null,
        p_whatsapp_link: whatsapp_link?.trim() || 'https://chat.whatsapp.com',
      })
      if (rpcErr) throw rpcErr
      setClubSettings({
        name,
        description,
        whatsapp_group_link: whatsapp_link,
      })
      await fetchModerationLogs()
    } catch (err) {
      console.error('Error updating club settings:', err)
      setError(err.message || 'Failed to update club settings')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Save Exercise (Add or Edit)
  const saveExercise = async ({
    id = null,
    name,
    category,
    muscle_group = null,
    equipment = null,
    description = null,
    is_archived = false,
  }) => {
    if (!isInstructor) throw new Error('Unauthorized')
    setActionLoading(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('instructor_manage_exercise', {
        p_exercise_id: id,
        p_name: name.trim(),
        p_category: category.trim(),
        p_muscle_group: muscle_group?.trim() || null,
        p_equipment: equipment?.trim() || null,
        p_description: description?.trim() || null,
        p_is_archived: !!is_archived,
      })
      if (rpcErr) throw rpcErr
      await fetchExercises()
    } catch (err) {
      console.error('Error saving exercise:', err)
      setError(err.message || 'Failed to save exercise')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  return {
    overview,
    members,
    statusFilter,
    setStatusFilter: (f) => {
      setStatusFilter(f)
      fetchMembers(f, searchQuery)
    },
    searchQuery,
    setSearchQuery: (q) => {
      setSearchQuery(q)
      fetchMembers(statusFilter, q)
    },
    exercises,
    moderationLogs,
    clubSettings,
    loading,
    actionLoading,
    error,
    isAdmin,
    isInstructor,
    currentUserId: user?.id,
    updateMemberStatus,
    setMemberRole,
    muteMember,
    unmuteMember,
    updateClubSettings,
    saveExercise,
    refetch: () => {
      fetchOverview()
      fetchMembers()
      fetchExercises()
      fetchModerationLogs()
      fetchClubSettings()
    },
  }
}

