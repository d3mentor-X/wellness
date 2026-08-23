import { useState } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import {
  Utensils,
  Search,
  Plus,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react'

const MEAL_TYPES = [
  { id: 'breakfast', label: '🍳 Breakfast' },
  { id: 'lunch', label: '🥗 Lunch' },
  { id: 'dinner', label: '🍲 Dinner' },
  { id: 'snack', label: '🍎 Snack' },
]

export function AddMealModal({
  isOpen,
  onClose,
  onSave,
  foodLibrary = [],
  defaultMealType = 'breakfast',
  loading,
}) {
  const [mealType, setMealType] = useState(defaultMealType)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([])

  // Search & current item builder
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [foodName, setFoodName] = useState('')
  const [quantity, setQuantity] = useState('100')
  const [unit, setUnit] = useState('g')
  const [calories, setCalories] = useState('0')
  const [protein, setProtein] = useState('0')
  const [carbs, setCarbs] = useState('0')
  const [fat, setFat] = useState('0')

  if (!isOpen) return null

  // Search filter
  const searchResults = searchQuery.trim()
    ? foodLibrary.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      ).slice(0, 6)
    : foodLibrary.slice(0, 6)

  // Selecting a food from the catalog
  const handleSelectFood = (food) => {
    setSelectedFood(food)
    setFoodName(food.name)
    setQuantity(String(food.serving_size || 100))
    setUnit(food.serving_unit || 'g')
    setCalories(String(food.calories || 0))
    setProtein(String(food.protein || 0))
    setCarbs(String(food.carbs || 0))
    setFat(String(food.fat || 0))
    setSearchQuery('')
  }

  // Recalculate nutrition when quantity changes
  const handleQuantityChange = (newQtyStr) => {
    setQuantity(newQtyStr)
    const newQty = parseFloat(newQtyStr)
    if (selectedFood && newQty > 0) {
      const baseServing = Number(selectedFood.serving_size) || 100
      const ratio = newQty / baseServing
      setCalories(String(Math.round(selectedFood.calories * ratio * 10) / 10))
      setProtein(String(Math.round(selectedFood.protein * ratio * 10) / 10))
      setCarbs(String(Math.round(selectedFood.carbs * ratio * 10) / 10))
      setFat(String(Math.round(selectedFood.fat * ratio * 10) / 10))
    }
  }

  // Add item to staged meal list
  const handleAddItem = (e) => {
    e.preventDefault()
    if (!foodName.trim()) return

    const newItem = {
      id: Math.random().toString(),
      food_name: foodName.trim(),
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim() || 'g',
      calories: Math.max(0, parseFloat(calories) || 0),
      protein: Math.max(0, parseFloat(protein) || 0),
      carbs: Math.max(0, parseFloat(carbs) || 0),
      fat: Math.max(0, parseFloat(fat) || 0),
    }

    setItems([...items, newItem])
    // Reset builder form
    setSelectedFood(null)
    setFoodName('')
    setQuantity('100')
    setUnit('g')
    setCalories('0')
    setProtein('0')
    setCarbs('0')
    setFat('0')
  }

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  // Calculate staged totals
  const totalCals = items.reduce((sum, item) => sum + item.calories, 0)
  const totalP = items.reduce((sum, item) => sum + item.protein, 0)
  const totalC = items.reduce((sum, item) => sum + item.carbs, 0)
  const totalF = items.reduce((sum, item) => sum + item.fat, 0)

  const handleSaveMeal = async () => {
    let finalItems = [...items]
    // If user filled the item builder without clicking "Add Item", include it
    if (foodName.trim() && finalItems.length === 0) {
      finalItems = [
        {
          food_name: foodName.trim(),
          quantity: parseFloat(quantity) || 1,
          unit: unit.trim() || 'g',
          calories: Math.max(0, parseFloat(calories) || 0),
          protein: Math.max(0, parseFloat(protein) || 0),
          carbs: Math.max(0, parseFloat(carbs) || 0),
          fat: Math.max(0, parseFloat(fat) || 0),
        },
      ]
    }

    if (finalItems.length === 0) return

    await onSave({
      meal_type: mealType,
      notes,
      items: finalItems,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <Card className="w-full max-w-xl p-5 sm:p-6 space-y-5 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#DDF7EA] text-[#1E7D58] flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#27313A]">Log Meal</h3>
              <p className="text-[11px] text-[#71808C]">Track calories & macros accurately.</p>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Meal Type Pill Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A]">Meal Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MEAL_TYPES.map((mt) => (
                <button
                  key={mt.id}
                  type="button"
                  onClick={() => setMealType(mt.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    mealType === mt.id
                      ? 'bg-[#FFE5E8] text-[#FF6F7D] border border-[#FFCCD2] shadow-xs'
                      : 'bg-[#FFF9F8] text-[#71808C] border border-[#F4E2E0] hover:text-[#27313A]'
                  }`}
                >
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Food Search & Quick Select */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0]">
            <label className="text-xs font-bold text-[#27313A] flex items-center justify-between">
              <span>Search Food Catalog</span>
              <span className="text-[10px] text-[#71808C] font-normal">Or type custom below</span>
            </label>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71808C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chicken, rice, eggs, oats, whey..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>

            {/* Catalog quick pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {searchResults.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSelectFood(f)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#F0E4E2] hover:border-[#FF6F7D] text-[11px] font-semibold text-[#27313A] hover:text-[#FF6F7D] transition-all cursor-pointer"
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Food Item Input Fields */}
          <div className="p-3.5 rounded-2xl bg-[#FFF5F6] border border-[#FFCCD2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#FF6F7D] uppercase tracking-wider">
                {selectedFood ? 'Selected Food' : 'Add Food Item'}
              </span>
              {selectedFood && (
                <span className="text-[11px] text-[#71808C] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FF6F7D]" />
                  <span>Auto-calculated</span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#27313A]">Food Name</label>
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => {
                  setFoodName(e.target.value)
                  setSelectedFood(null)
                }}
                placeholder="e.g. Scrambled Eggs or Protein Shake"
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs text-[#27313A] font-bold focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#27313A]">Quantity</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs font-bold text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#27313A]">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs font-bold text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                >
                  <option value="g">grams (g)</option>
                  <option value="ml">milliliters (ml)</option>
                  <option value="piece">piece / item</option>
                  <option value="serving">serving</option>
                  <option value="cup">cup</option>
                </select>
              </div>
            </div>

            {/* Macros: Calories, Protein, Carbs, Fat */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#E04B5A]">Calories (kcal)</label>
                <input
                  type="number"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full text-center px-1.5 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs font-black text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#2563EB]">Protein (g)</label>
                <input
                  type="number"
                  min="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full text-center px-1.5 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs font-bold text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#F59E0B]">Carbs (g)</label>
                <input
                  type="number"
                  min="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full text-center px-1.5 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs font-bold text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#10B981]">Fat (g)</label>
                <input
                  type="number"
                  min="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full text-center px-1.5 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs font-bold text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddItem}
              className="w-full text-xs font-bold justify-center"
            >
              Add Item to This Meal
            </Button>
          </div>

          {/* Staged Items List in this Meal */}
          {items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#71808C]">
                Meal Items ({items.length})
              </h4>
              <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#FFF9F8] border border-[#F4E2E0] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#27313A]">{item.food_name}</span>{' '}
                      <span className="text-[#71808C]">({item.quantity} {item.unit})</span>
                      <p className="text-[11px] text-[#71808C]">
                        {item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded text-[#71808C] hover:text-[#E11D48] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#27313A]">Meal Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Post-workout meal, cooked with olive oil"
              className="w-full px-3 py-1.5 rounded-xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
            />
          </div>
        </div>

        {/* Footer with Summary & Save */}
        <div className="pt-3 border-t border-[#F4E2E0] flex items-center justify-between shrink-0">
          <div className="text-xs">
            <span className="font-bold text-[#27313A]">
              Total: {totalCals || calories} kcal
            </span>
            <span className="text-[#71808C] block text-[11px]">
              {totalP || protein}g P • {totalC || carbs}g C • {totalF || fat}g F
            </span>
          </div>

          <div className="flex items-center gap-2">
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
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveMeal}
              disabled={loading || (!foodName.trim() && items.length === 0)}
              className="font-bold text-xs"
            >
              {loading ? 'Saving...' : 'Save Meal'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

