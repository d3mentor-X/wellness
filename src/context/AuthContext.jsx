import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './authContextInstance'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [membership, setMembership] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile and club membership for a given user ID
  const fetchUserData = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setMembership(null)
      return
    }

    try {
      // 1. Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      } else if (profileData) {
        setProfile(profileData)
      }

      // 2. Fetch user club membership
      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select('*, clubs(*)')
        .eq('user_id', userId)
        .maybeSingle()

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error fetching club membership:', memberError)
      } else if (memberData) {
        setMembership(memberData)
      } else {
        setMembership(null)
      }
    } catch (err) {
      console.error('Unexpected error loading user data:', err)
    }
  }, [])

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting auth session:', error)
        }

        if (mounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
          if (initialSession?.user) {
            await fetchUserData(initialSession.user.id)
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchUserData(newSession.user.id)
        } else {
          setProfile(null)
          setMembership(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [fetchUserData])

  // Login with email and password
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
    return data
  }

  // Sign up with user metadata
  const signUp = async ({
    email,
    password,
    full_name,
    whatsapp_number,
    gender,
    age,
    height,
  }) => {
    const metadata = {
      full_name: full_name?.trim() || 'Member',
      whatsapp_number: whatsapp_number?.trim() || null,
      gender: gender || 'prefer_not_to_say',
      age: age ? parseInt(age, 10) : null,
      height: height ? parseFloat(height) : null,
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: metadata,
      },
    })

    if (error) throw error

    // Ensure profile row exists or updates with metadata
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: metadata.full_name,
        whatsapp_number: metadata.whatsapp_number,
        gender: metadata.gender,
        age: metadata.age,
        height: metadata.height,
      })
      await fetchUserData(data.user.id)
    }

    return data
  }

  // Log out
  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setSession(null)
    setProfile(null)
    setMembership(null)
  }

  // Update user profile fields
  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  // Manual refresh of profile and membership
  const refreshUser = async () => {
    if (user?.id) {
      await fetchUserData(user.id)
    }
  }

  const value = {
    user,
    session,
    profile,
    membership,
    loading,
    login,
    signUp,
    logout,
    updateProfile,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

