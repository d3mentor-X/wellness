import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const FALLBACK_EXERCISES = [
  { id: 'ex-1', name: 'Bench Press', category: 'Strength', muscle_group: 'Chest', equipment: 'Barbell' },
  { id: 'ex-2', name: 'Incline Dumbbell Press', category: 'Strength', muscle_group: 'Chest', equipment: 'Dumbbells' },
  { id: 'ex-3', name: 'Push Up', category: 'Bodyweight', muscle_group: 'Chest', equipment: 'Bodyweight' },
  { id: 'ex-4', name: 'Barbell Squat', category: 'Strength', muscle_group: 'Legs', equipment: 'Barbell' },
  { id: 'ex-5', name: 'Romanian Deadlift', category: 'Strength', muscle_group: 'Hamstrings', equipment: 'Barbell' },
  { id: 'ex-6', name: 'Walking Lunges', category: 'Strength', muscle_group: 'Legs', equipment: 'Dumbbells' },
  { id: 'ex-7', name: 'Pull Up', category: 'Bodyweight', muscle_group: 'Back', equipment: 'Pull-up Bar' },
  { id: 'ex-8', name: 'Barbell Row', category: 'Strength', muscle_group: 'Back', equipment: 'Barbell' },
  { id: 'ex-9', name: 'Lat Pulldown', category: 'Strength', muscle_group: 'Back', equipment: 'Cable Machine' },
  { id: 'ex-10', name: 'Shoulder Press', category: 'Strength', muscle_group: 'Shoulders', equipment: 'Dumbbells' },
  { id: 'ex-11', name: 'Lateral Raises', category: 'Strength', muscle_group: 'Shoulders', equipment: 'Dumbbells' },
  { id: 'ex-12', name: 'Bicep Curls', category: 'Strength', muscle_group: 'Arms', equipment: 'Dumbbells' },
  { id: 'ex-13', name: 'Tricep Dips', category: 'Bodyweight', muscle_group: 'Arms', equipment: 'Dip Station' },
  { id: 'ex-14', name: 'Plank', category: 'Mobility', muscle_group: 'Core', equipment: 'Bodyweight' },
  { id: 'ex-15', name: 'Hanging Leg Raises', category: 'Strength', muscle_group: 'Core', equipment: 'Pull-up Bar' },
  { id: 'ex-16', name: 'Russian Twists', category: 'Bodyweight', muscle_group: 'Core', equipment: 'Bodyweight' },
  { id: 'ex-17', name: 'Running', category: 'Cardio', muscle_group: 'Full Body', equipment: 'Treadmill / Outdoor' },
  { id: 'ex-18', name: 'Cycling', category: 'Cardio', muscle_group: 'Legs', equipment: 'Stationary Bike' },
  { id: 'ex-19', name: 'Outdoor Walking', category: 'Cardio', muscle_group: 'Full Body', equipment: 'None' },
  { id: 'ex-20', name: 'Jump Rope', category: 'Cardio', muscle_group: 'Full Body', equipment: 'Jump Rope' },
]

export function useExercises() {
  const [exercises, setExercises] = useState(FALLBACK_EXERCISES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadExercises() {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('id, name, category, muscle_group, equipment, description')
          .order('name', { ascending: true })

        if (!error && Array.isArray(data) && data.length > 0) {
          setExercises(data)
        }
      } catch (err) {
        console.error('Error fetching exercises:', err)
      } finally {
        setLoading(false)
      }
    }

    loadExercises()
  }, [])

  return { exercises, loading }
}

