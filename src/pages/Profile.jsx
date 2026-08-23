import { User } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function Profile() {
  return (
    <PlaceholderView
      title="My Profile"
      subtitle="Manage your personal fitness identity, bio, and milestones."
      category={NAVIGATION_CATEGORIES.ACCOUNT}
      icon={User}
      description="View and update your personal statistics, fitness history, earned badges, and group participation records."
      features={[
        'Personal bio and avatar management',
        'Biometric trends and body metrics',
        'Earned badges and achievement trophies',
        'Fitness journey timeline',
      ]}
    />
  )
}

