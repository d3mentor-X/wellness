import { Trophy } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function Leaderboard() {
  return (
    <PlaceholderView
      title="Leaderboard"
      subtitle="Friendly competition, weekly points, streaks, and member rankings."
      category={NAVIGATION_CATEGORIES.COMMUNITY}
      icon={Trophy}
      description="Compete in a motivating, friendly environment based on workout consistency, step counts, and habit completion."
      features={[
        'Weekly & monthly group leaderboards',
        'Consistency streak rankings',
        'Points scoring breakdown',
        'Podium badges for top finishers',
      ]}
    />
  )
}

