import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { ProgressBar } from '../components/common/ProgressBar'
import { SectionHeader } from '../components/common/SectionHeader'
import { AddMealModal } from '../components/nutrition/AddMealModal'
import { NutritionTargetsModal } from '../components/nutrition/NutritionTargetsModal'
import { useNutrition } from '../hooks/useNutrition'
import {
  Utensils,
  Plus,
  Flame,
  ChevronLeft,
  ChevronRight,
  Target,
  Calendar,
  Trash2,
  CalendarDays,
} from 'lucide-react'

export default function FoodCalories({ onNavigate }) {
  const {
    selectedDate,
    setSelectedDate,
    summary,
    foodLibrary,
    historySummaries,
    loading,
    actionLoading,
    error,
    saveMeal,
    deleteMeal,
    deleteMealItem,
    updateTargets,
  } = useNutrition()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false)
  const [defaultMealType, setDefaultMealType] = useState('breakfast')

  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === todayStr

  // Date Navigation
  const changeDateBy = (days) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const { targets, totals, meals } = summary

  const caloriesPercent = Math.min(100, Math.round((totals.calories / (targets.calories || 1)) * 100))
  const proteinPercent = Math.min(100, Math.round((totals.protein / (targets.protein || 1)) * 100))
  const carbsPercent = Math.min(100, Math.round((totals.carbs / (targets.carbs || 1)) * 100))
  const fatPercent = Math.min(100, Math.round((totals.fat / (targets.fat || 1)) * 100))
  const remainingCalories = Math.max(0, Math.round(targets.calories - totals.calories))

  const handleOpenAddMeal = (mealType = 'breakfast') => {
    setDefaultMealType(mealType)
    setIsAddModalOpen(true)
  }

  const formatDisplayDate = (dStr) => {
    if (dStr === todayStr) return 'Today'
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    if (dStr === yesterday) return 'Yesterday'
    return new Date(dStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header & Actions */}
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
              Private Diary
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Track your daily meals, calories, and macronutrient balance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            icon={Target}
            onClick={() => setIsTargetsModalOpen(true)}
            className="text-xs font-bold"
          >
            Set Targets
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenAddMeal('breakfast')}
            className="text-xs font-bold"
          >
            Log Meal
          </Button>
        </div>
      </div>

      {/* 2. Date Navigation Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#F4E2E0] shadow-xs">
        <button
          type="button"
          onClick={() => changeDateBy(-1)}
          className="p-1.5 rounded-xl text-[#71808C] hover:text-[#27313A] hover:bg-[#FFF5F6] flex items-center gap-1 text-xs font-bold cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous Day</span>
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#27313A]">
          <Calendar className="w-4 h-4 text-[#FF6F7D]" />
          <span>{formatDisplayDate(selectedDate)}</span>
          <span className="text-[11px] text-[#71808C] font-normal">({selectedDate})</span>
          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="text-[11px] font-bold text-[#FF6F7D] hover:underline ml-1 cursor-pointer"
            >
              Jump to Today
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => changeDateBy(1)}
          className="p-1.5 rounded-xl text-[#71808C] hover:text-[#27313A] hover:bg-[#FFF5F6] flex items-center gap-1 text-xs font-bold cursor-pointer"
        >
          <span className="hidden sm:inline">Next Day</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <Card className="p-4 bg-[#FFF1F2] border-[#FECDD3] text-xs font-semibold text-[#E11D48]">
          {error}
        </Card>
      )}

      {/* 3. Calorie & Macro Target Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Calorie Meter */}
        <Card className="p-5 sm:col-span-2 space-y-3 bg-gradient-to-br from-white to-[#FFF6F7] border-[#F2DCD9]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF6F7D]" />
              <h3 className="text-sm font-bold text-[#27313A]">Daily Calorie Budget</h3>
            </div>
            <Badge variant="coral" size="sm">
              {totals.calories} / {targets.calories} kcal
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs font-bold text-[#71808C]">
              <span>
                Remaining: <strong className="text-[#27313A]">{remainingCalories} kcal</strong>
              </span>
              <span className="text-[#FF6F7D]">{caloriesPercent}%</span>
            </div>
            <ProgressBar value={totals.calories} max={targets.calories} variant="coral" size="md" />
          </div>
        </Card>

        {/* Protein Meter */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#27313A]">Protein</span>
            <span className="text-xs font-bold text-[#2563EB]">
              {totals.protein} / {targets.protein} g
            </span>
          </div>
          <div className="space-y-1">
            <ProgressBar value={totals.protein} max={targets.protein} variant="blue" size="sm" />
            <span className="text-[11px] text-[#71808C] block text-right">{proteinPercent}%</span>
          </div>
        </Card>

        {/* Carbs & Fat Stack */}
        <Card className="p-5 space-y-3.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#27313A]">Carbs</span>
              <span className="text-[#F59E0B]">
                {totals.carbs} / {targets.carbs} g ({carbsPercent}%)
              </span>
            </div>
            <ProgressBar value={totals.carbs} max={targets.carbs} variant="amber" size="sm" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#27313A]">Fat</span>
              <span className="text-[#10B981]">
                {totals.fat} / {targets.fat} g ({fatPercent}%)
              </span>
            </div>
            <ProgressBar value={totals.fat} max={targets.fat} variant="mint" size="sm" />
          </div>
        </Card>
      </div>

      {/* 4. Meals Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Meals Logged"
            subtitle={`Individual meals for ${formatDisplayDate(selectedDate)}.`}
            icon={Utensils}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenAddMeal('breakfast')}
            className="text-xs font-bold text-[#FF6F7D]"
          >
            + Add Meal
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="p-5 space-y-3 animate-pulse">
                <div className="h-4 bg-[#F0E5E3] rounded-md w-1/4" />
                <div className="h-3 bg-[#F0E5E3] rounded-md w-1/2" />
              </Card>
            ))}
          </div>
        ) : meals.length === 0 ? (
          <Card className="p-8 text-center space-y-3 bg-white border-[#F4E2E0]">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center mx-auto">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-[#27313A]">
                No meals logged for this date
              </h4>
              <p className="text-xs text-[#71808C]">
                Track your breakfast, lunch, dinner, or snack to meet your daily targets.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenAddMeal('breakfast')}
              className="text-xs font-bold"
            >
              Log First Meal
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meals.map((meal) => {
              const mealTypeLabel =
                meal.meal_type === 'breakfast'
                  ? '🍳 Breakfast'
                  : meal.meal_type === 'lunch'
                  ? '🥗 Lunch'
                  : meal.meal_type === 'dinner'
                  ? '🍲 Dinner'
                  : '🍎 Snack'

              return (
                <Card key={meal.id} className="p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F4E2E0]">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#27313A]">{mealTypeLabel}</h4>
                        <span className="text-[11px] text-[#71808C]">
                          {new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#FF6F7D]">
                          {meal.calories} kcal
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteMeal(meal.id)}
                          className="p-1 rounded text-[#71808C] hover:text-[#E11D48] cursor-pointer"
                          title="Delete Meal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meal Items */}
                    <div className="space-y-2">
                      {meal.items && meal.items.length > 0 ? (
                        meal.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-1 border-b border-[#FFF1F2]"
                          >
                            <div>
                              <span className="font-semibold text-[#27313A]">{item.food_name}</span>{' '}
                              <span className="text-[11px] text-[#71808C]">({item.quantity} {item.unit})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#27313A] font-bold">{item.calories} kcal</span>
                              <button
                                type="button"
                                onClick={() => deleteMealItem(item.id)}
                                className="text-[10px] text-[#71808C] hover:text-[#E11D48] cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#71808C] italic">Quick meal entry</p>
                      )}
                    </div>

                    {meal.notes && (
                      <p className="text-[11px] text-[#71808C] italic bg-[#FFF9F8] p-2 rounded-xl border border-[#F4E2E0]">
                        "{meal.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#F4E2E0] flex items-center justify-between text-[11px] text-[#71808C]">
                    <span>
                      {meal.protein}g Protein • {meal.carbs}g Carbs • {meal.fat}g Fat
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. 7-Day Consistency History */}
      {historySummaries.length > 0 && (
        <Card className="p-5 space-y-4">
          <SectionHeader
            title="7-Day Nutrition Consistency"
            subtitle="Recent daily calorie and protein tracking."
            icon={CalendarDays}
          />

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 text-center">
            {historySummaries.map((h, i) => (
              <div
                key={i}
                onClick={() => setSelectedDate(h.date)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  h.date === selectedDate
                    ? 'bg-[#FFE5E8] border-[#FF6F7D] shadow-xs'
                    : 'bg-[#FFF9F8] border-[#F4E2E0] hover:bg-[#FFF5F6]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#71808C] uppercase block">
                  {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-xs font-black text-[#27313A] block my-1">
                  {Math.round(h.calories)} kcal
                </span>
                <span className="text-[10px] font-semibold text-[#2563EB] block">
                  {Math.round(h.protein)}g P
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Meal Modal */}
      <AddMealModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={saveMeal}
        foodLibrary={foodLibrary}
        defaultMealType={defaultMealType}
        loading={actionLoading}
      />

      {/* Nutrition Targets Modal */}
      <NutritionTargetsModal
        targets={targets}
        isOpen={isTargetsModalOpen}
        onClose={() => setIsTargetsModalOpen(false)}
        onSave={updateTargets}
        loading={actionLoading}
      />
    </div>
  )
}
