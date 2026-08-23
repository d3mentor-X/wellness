import { Bot } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function AICoach() {
  return (
    <PlaceholderView
      title="AI Coach"
      subtitle="Personalized recommendations, recovery advice, and workout insights."
      category={NAVIGATION_CATEGORIES.COMMUNITY}
      icon={Bot}
      description="Smart assistant designed to analyze your habits, answer fitness and nutrition questions, and suggest adjustments."
      features={[
        'Interactive fitness & nutrition advice chat',
        'Daily recovery and readiness assessment',
        'Workout recommendation engine',
        'Weekly progress summary and smart tips',
      ]}
    />
  )
}

