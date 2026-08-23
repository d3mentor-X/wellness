import { Utensils } from 'lucide-react'
import { PlaceholderView } from '../components/common/PlaceholderView'
import { NAVIGATION_CATEGORIES } from '../constants/navigation'

export default function FoodCalories() {
  return (
    <PlaceholderView
      title="Food & Calories"
      subtitle="Log daily meals, water intake, calorie targets, and macronutrients."
      category={NAVIGATION_CATEGORIES.DAILY}
      icon={Utensils}
      description="Track breakfast, lunch, dinner, snacks, calorie deficits/surpluses, and protein/carb/fat macro distributions."
      features={[
        'Daily meal & snack logger',
        'Macro breakdown (Protein, Carbs, Fats)',
        'Calorie target progress bar',
        'Hydration / water tracker',
      ]}
    />
  )
}

