import { useState } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Target, X, Save } from 'lucide-react'

export function NutritionTargetsModal({
  targets = { calories: 2200, protein: 150, carbs: 250, fat: 70 },
  isOpen,
  onClose,
  onSave,
  loading,
}) {
  const [calories, setCalories] = useState(String(targets.calories || 2200))
  const [protein, setProtein] = useState(String(targets.protein || 150))
  const [carbs, setCarbs] = useState(String(targets.carbs || 250))
  const [fat, setFat] = useState(String(targets.fat || 70))

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      calories: parseFloat(calories) || 2200,
      protein: parseFloat(protein) || 150,
      carbs: parseFloat(carbs) || 250,
      fat: parseFloat(fat) || 70,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
      <Card className="w-full max-w-md p-6 space-y-5 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#27313A]">Daily Nutrition Targets</h3>
              <p className="text-[11px] text-[#71808C]">Personal calorie & macronutrient goals.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71808C] hover:text-[#27313A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A]">Daily Calorie Goal (kcal)</label>
            <input
              type="number"
              min="500"
              max="10000"
              required
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-black focus:outline-none focus:border-[#FF6F7D]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#2563EB]">Protein (g)</label>
              <input
                type="number"
                min="0"
                max="1000"
                required
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs font-bold text-[#27313A] text-center focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#F59E0B]">Carbs (g)</label>
              <input
                type="number"
                min="0"
                max="2000"
                required
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs font-bold text-[#27313A] text-center focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#10B981]">Fat (g)</label>
              <input
                type="number"
                min="0"
                max="1000"
                required
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs font-bold text-[#27313A] text-center focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#71808C] italic">
            * These are your private targets and are never shared with other club members.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F4E2E0]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              disabled={loading}
              className="font-bold text-xs"
            >
              {loading ? 'Saving...' : 'Save Targets'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

