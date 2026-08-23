import { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Dumbbell, X, Plus, Save } from 'lucide-react'

const CATEGORIES = ['strength', 'cardio', 'flexibility', 'bodyweight', 'hiit', 'mobility']

export function ExerciseManagerModal({
  exercise,
  isOpen,
  onClose,
  onSave,
  loading,
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('strength')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [equipment, setEquipment] = useState('')
  const [description, setDescription] = useState('')
  const [isArchived, setIsArchived] = useState(false)

  useEffect(() => {
    if (exercise) {
      setName(exercise.name || '')
      setCategory(exercise.category || 'strength')
      setMuscleGroup(exercise.muscle_group || '')
      setEquipment(exercise.equipment || '')
      setDescription(exercise.description || '')
      setIsArchived(!!exercise.is_archived)
    } else {
      setName('')
      setCategory('strength')
      setMuscleGroup('')
      setEquipment('')
      setDescription('')
      setIsArchived(false)
    }
  }, [exercise, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      id: exercise?.id || null,
      name,
      category,
      muscle_group: muscleGroup,
      equipment,
      description,
      is_archived: isArchived,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
      <Card className="w-full max-w-md p-6 space-y-4 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#27313A]">
                {exercise ? 'Edit Exercise' : 'Add Exercise to Library'}
              </h3>
              <p className="text-[11px] text-[#71808C]">Available to all club members for logging.</p>
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A]">Exercise Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Barbell Romanian Deadlift"
              className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-bold focus:outline-none focus:border-[#FF6F7D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs font-semibold text-[#27313A] capitalize focus:outline-none focus:border-[#FF6F7D]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A]">Target Muscle</label>
              <input
                type="text"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                placeholder="e.g. Hamstrings, Glutes"
                className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A]">Equipment</label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. Barbell, Dumbbells, Machine, Bodyweight"
              className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A]">Movement Guidance (Description)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Form tips, cue notes, or execution steps..."
              className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
            />
          </div>

          {exercise && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FFF9F8] border border-[#F4E2E0]">
              <input
                type="checkbox"
                id="archToggle"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="rounded text-[#FF6F7D]"
              />
              <label htmlFor="archToggle" className="text-xs font-semibold text-[#27313A] cursor-pointer">
                Archive this exercise (hides from new workout logs)
              </label>
            </div>
          )}

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
              icon={exercise ? Save : Plus}
              disabled={loading}
            >
              {loading ? 'Saving...' : exercise ? 'Save Changes' : 'Add Exercise'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

