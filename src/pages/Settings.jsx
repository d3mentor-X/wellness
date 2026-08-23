import { Settings as SettingsIcon } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function Settings() {
  return (
    <PlaceholderView
      title="Settings"
      subtitle="Configure notifications, unit preferences, privacy, and account."
      category={NAVIGATION_CATEGORIES.ACCOUNT}
      icon={SettingsIcon}
      description="Customize your app experience, measurement units (kg/lbs, km/mi), daily reminder times, and privacy settings."
      features={[
        'Unit preferences (Metric / Imperial)',
        'Reminder & push notification controls',
        'Group privacy & sharing permissions',
        'Account credentials and data export',
      ]}
    />
  )
}

