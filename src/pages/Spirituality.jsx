import { Sparkles } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function Spirituality() {
  return (
    <PlaceholderView
      title="Spirituality"
      subtitle="Cultivate mindfulness, gratitude, prayers, and mental well-being habits."
      category={NAVIGATION_CATEGORIES.DAILY}
      icon={Sparkles}
      description="Track spiritual routines, daily reflection, meditation sessions, gratitude journals, and peace of mind."
      features={[
        'Daily gratitude & mindfulness log',
        'Prayer / meditation habit checkboxes',
        'Daily inspirational verse or quote',
        'Mind-body wellness reflection',
      ]}
    />
  )
}

