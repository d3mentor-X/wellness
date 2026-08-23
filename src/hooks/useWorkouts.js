import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function useWorkouts() {
  const { user, membership } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const userId = user?.id
  const clubId = membership?.club_id

  const fetchWorkouts = useCallback(async () => {
    if (!userId) {
      setWorkouts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Fetch workout sessions for authenticated user
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          user_id,
          club_id,
          workout_name,
          workout_date,
          started_at,
          completed_at,
          duration_minutes,
          notes,
          created_at,
          workout_exercises (
            id,
            exercise_id,
            order_index,
            notes,
            exercises (
              id,
              name,
              category,
              muscle_group
            ),
            exercise_sets (
              id,
              set_number,
              reps,
              weight,
              duration_seconds,
              distance,
              completed
            )
          )
        `)
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (sessionError) throw sessionError

      setWorkouts(sessionData || [])
    } catch (err) {
      console.error('Error fetching workouts:', err)
      setError(err.message || 'Failed to load workout history')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  // Log a complete workout session with exercises and sets
  const logWorkout = async ({
    workout_name = 'Workout Session',
    duration_minutes = 45,
    notes = '',
    exercises = [],
  }) => {
    if (!userId || !clubId) throw new Error('User or club membership not available')

    const todayDate = new Date().toISOString().split('T')[0]

    // 1. Insert workout_session
    const { data: newSession, error: sessionErr } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        club_id: clubId,
        workout_name: workout_name.trim() || 'Workout Session',
        duration_minutes: parseInt(duration_minutes, 10) || 0,
        notes: notes.trim() || null,
        workout_date: todayDate,
      })
      .select()
      .single()

    if (sessionErr) throw sessionErr

    // 2. Insert workout_exercises and their exercise_sets
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      if (!ex.exercise_id) continue

      // Insert workout_exercise
      const { data: newWorkEx, error: workExErr } = await supabase
        .from('workout_exercises')
        .insert({
          workout_session_id: newSession.id,
          exercise_id: ex.exercise_id,
          order_index: i + 1,
        })
        .select()
        .single()

      if (workExErr) {
        console.error('Error inserting workout_exercise:', workExErr)
        continue
      }

      // Insert sets if present
      if (Array.isArray(ex.sets) && ex.sets.length > 0) {
        const setsToInsert = ex.sets.map((s, sIdx) => ({
          workout_exercise_id: newWorkEx.id,
          set_number: sIdx + 1,
          reps: s.reps ? parseInt(s.reps, 10) : null,
          weight: s.weight ? parseFloat(s.weight) : null,
          duration_seconds: s.duration_seconds ? parseInt(s.duration_seconds, 10) : null,
          distance: s.distance ? parseFloat(s.distance) : null,
          completed: s.completed !== false,
        }))

        const { error: setsErr } = await supabase
          .from('exercise_sets')
          .insert(setsToInsert)

        if (setsErr) {
          console.error('Error inserting exercise_sets:', setsErr)
        }
      }
    }

    // 3. Mark today's daily_activity as workout_completed = true
    try {
      await supabase
        .from('daily_activity')
        .upsert(
          {
            user_id: userId,
            club_id: clubId,
            activity_date: todayDate,
            workout_completed: true,
          },
          { onConflict: 'user_id,activity_date' }
        )
    } catch (actErr) {
      console.warn('Could not update daily_activity workout completion:', actErr)
    }

    await fetchWorkouts()
    return newSession
  }

  // Delete a workout session
  const deleteWorkout = async (sessionId) => {
    if (!sessionId) return

    const { error: delErr } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (delErr) throw delErr
    await fetchWorkouts()
  }

  return {
    workouts,
    loading,
    error,
    logWorkout,
    deleteWorkout,
    refetch: fetchWorkouts,
  }
}

