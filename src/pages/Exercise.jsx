import { Dumbbell } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function Exercise() {
  return (
    <PlaceholderView
      title="Exercise"
      subtitle="Track your workouts, strength training, cardio sessions, and routines."
      category={NAVIGATION_CATEGORIES.DAILY}
      icon={Dumbbell}
      description="Log gym sessions, track sets, reps, weights, cardio durations, and analyze your workout performance over time."
      features={[
        'Workout logging & exercise library',
        'Custom routine builder',
        'Sets, reps, and volume progression',
        'Rest timers and session history',
      ]}
    />
  )
}

