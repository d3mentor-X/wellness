import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { ProgressBar } from '../components/common/ProgressBar'
import { SectionHeader } from '../components/common/SectionHeader'
import { Utensils, Plus, Flame, ChevronLeft } from 'lucide-react'

export default function FoodCalories({ onNavigate }) {
  const [waterCups, setWaterCups] = useState(6)

  const meals = [
    {
      type: 'Breakfast',
      time: '08:15 AM',
      items: '3 Scrambled Eggs, Oatmeal with Berries, Black Coffee',
      calories: 520,
      protein: '34g',
      carbs: '48g',
      fat: '18g',
    },
    {
      type: 'Lunch',
      time: '01:30 PM',
      items: 'Grilled Chicken Breast, Quinoa, Steamed Broccoli & Olive Oil',
      calories: 680,
      protein: '52g',
      carbs: '55g',
      fat: '20g',
    },
    {
      type: 'Snack / Pre-Workout',
      time: '05:00 PM',
      items: 'Greek Yogurt with Honey & Almonds, Whey Protein',
      calories: 340,
      protein: '32g',
      carbs: '24g',
      fat: '10g',
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate?.('progress')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6F7D] hover:underline mb-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Progress</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
              Food & Nutrition
            </h1>
            <Badge variant="coral" size="sm">
              Today's Targets
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Track your daily calories, macronutrient balance, and hydration.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {}}
          className="self-start sm:self-center font-bold text-xs"
        >
          Log Meal
        </Button>
      </div>

      {/* Calorie & Macro Target Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Calorie Meter */}
        <Card className="p-5 md:col-span-2 space-y-3 bg-gradient-to-br from-white to-[#FFF6F7] border-[#F2DCD9]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF6F7D]" />
              <h3 className="text-sm font-bold text-[#27313A]">Daily Calorie Budget</h3>
            </div>
            <Badge variant="coral" size="sm">
              1,540 / 2,300 kcal
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs font-bold text-[#71808C]">
              <span>Remaining: <strong className="text-[#27313A]">760 kcal</strong></span>
              <span className="text-[#FF6F7D]">67%</span>
            </div>
            <ProgressBar value={1540} max={2300} variant="coral" size="md" />
          </div>

          <p className="text-[11px] text-[#71808C]">
            Target based on moderate fat loss & strength maintenance.
          </p>
        </Card>

        {/* Protein Macro */}
        <Card className="p-4 space-y-2 bg-[#FFFDF5] border-[#FDE68A]">
          <span className="text-xs font-bold text-[#D97706] uppercase">🥩 Protein</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#27313A]">118g</span>
            <span className="text-xs text-[#71808C]">/ 160g</span>
          </div>
          <ProgressBar value={118} max={160} variant="amber" size="sm" />
        </Card>

        {/* Hydration */}
        <Card className="p-4 space-y-2 bg-[#F5FAFF] border-[#CCE4FF]">
          <span className="text-xs font-bold text-[#2563EB] uppercase">💧 Water</span>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#27313A]">{waterCups}</span>
              <span className="text-xs text-[#71808C]">/ 8 cups</span>
            </div>
            <button
              type="button"
              onClick={() => setWaterCups((c) => Math.min(8, c + 1))}
              className="w-6 h-6 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs hover:bg-[#2563EB]"
            >
              +
            </button>
          </div>
          <ProgressBar value={waterCups} max={8} variant="blue" size="sm" />
        </Card>
      </div>

      {/* Meals Log Feed */}
      <div className="space-y-4">
        <SectionHeader
          title="Today's Logged Meals"
          subtitle="Keep your nutrition aligned with your fitness goals."
          icon={Utensils}
        />

        <div className="space-y-3.5">
          {meals.map((m, idx) => (
            <Card key={idx} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#27313A]">{m.type}</span>
                    <span className="text-xs text-[#71808C]">• {m.time}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#27313A] font-medium">{m.items}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-[#FF6F7D]">{m.calories} kcal</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-[#F4E2E0] text-xs text-[#71808C]">
                <span>Protein: <strong className="text-[#27313A]">{m.protein}</strong></span>
                <span>•</span>
                <span>Carbs: <strong className="text-[#27313A]">{m.carbs}</strong></span>
                <span>•</span>
                <span>Fat: <strong className="text-[#27313A]">{m.fat}</strong></span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
