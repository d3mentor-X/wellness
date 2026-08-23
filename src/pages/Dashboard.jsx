import { LayoutDashboard } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function Dashboard() {
  return (
    <PlaceholderView
      title="Dashboard"
      subtitle="Main hub for daily overview, workout summaries, and group momentum."
      category={NAVIGATION_CATEGORIES.DAILY}
      icon={LayoutDashboard}
      description="Central dashboard for quick glance metrics, active streaks, daily checklist, and community highlights."
      features={[
        'Daily workout & nutrition summary',
        'Active streak & habit tracker',
        'Quick action loggers',
        'Recent group announcements',
      ]}
    />
  )
}

