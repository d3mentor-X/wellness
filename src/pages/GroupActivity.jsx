import { Users } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function GroupActivity() {
  return (
    <PlaceholderView
      title="Group Activity"
      subtitle="Private community feed, shared workouts, and group momentum."
      category={NAVIGATION_CATEGORIES.COMMUNITY}
      icon={Users}
      description="Connect with your fitness group, see daily completions, high-five member achievements, and post updates."
      features={[
        'Live group member activity stream',
        'Reaction high-fives and encouragement comments',
        'Group challenge progress board',
        'Photo check-ins & workout proofs',
      ]}
    />
  )
}

