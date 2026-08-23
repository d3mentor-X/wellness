import { Footprints } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function Steps() {
  return (
    <PlaceholderView
      title="Steps"
      subtitle="Monitor daily walking counts, active minutes, and distance covered."
      category={NAVIGATION_CATEGORIES.DAILY}
      icon={Footprints}
      description="Track step goals (e.g. 10,000 steps/day), walking distance, hourly step activity, and weekly walking trends."
      features={[
        'Daily step goal meter',
        'Distance (km/miles) & calories burned estimate',
        'Hourly walking activity breakdown',
        'Weekly & monthly step consistency graphs',
      ]}
    />
  )
}

