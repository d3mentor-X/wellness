import { Target } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function Goals() {
  return (
    <PlaceholderView
      title="Goals"
      subtitle="Define personal targets, set deadlines, and achieve fitness milestones."
      category={NAVIGATION_CATEGORIES.COMMUNITY}
      icon={Target}
      description="Set short-term and long-term targets for weight, strength, body composition, consistency, and habits."
      features={[
        'Target weight & body goal tracker',
        'Weekly workout & step targets',
        'Milestone deadline counters',
        'Progress status & completion history',
      ]}
    />
  )
}

