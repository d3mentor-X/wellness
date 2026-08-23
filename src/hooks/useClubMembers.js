import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function useClubMembers() {
  const { membership } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const clubId = membership?.club_id

  const fetchMembers = useCallback(async () => {
    if (!clubId) {
      setMembers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Try secure RPC get_club_members first
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_club_members',
        { target_club_id: clubId }
      )

      if (!rpcError && Array.isArray(rpcData)) {
        setMembers(rpcData)
        return
      }

      // 2. Try club_member_directory view
      const { data: viewData, error: viewError } = await supabase
        .from('club_member_directory')
        .select('*')
        .eq('club_id', clubId)

      if (!viewError && Array.isArray(viewData)) {
        setMembers(viewData)
        return
      }

      // 3. Graceful fallback directly to club_members
      const { data: directData, error: directError } = await supabase
        .from('club_members')
        .select('id, club_id, user_id, role, status, joined_at, profiles(full_name, avatar_url, whatsapp_number, gender)')
        .eq('club_id', clubId)
        .eq('status', 'active')

      if (directError) throw directError

      const flattened = (directData || []).map((m) => ({
        membership_id: m.id,
        club_id: m.club_id,
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
        full_name: m.profiles?.full_name || 'Club Member',
        avatar_url: m.profiles?.avatar_url,
        whatsapp_number: m.profiles?.whatsapp_number,
        gender: m.profiles?.gender,
      }))

      setMembers(flattened)
    } catch (err) {
      console.error('Error loading club members:', err)
      setError(err.message || 'Failed to load club member directory')
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  }
}

