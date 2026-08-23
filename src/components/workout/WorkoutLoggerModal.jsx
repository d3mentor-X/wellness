import { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { useExercises } from '../../hooks/useExercises'
import {
  Dumbbell,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

const WORKOUT_PRESETS = [
  'Upper Body Strength',
  'Leg Day',
  'Push Day',
  'Pull Day',
  'Full Body Conditioning',
  'HIIT & Core',
  'Morning Cardio',
]

export function WorkoutLoggerModal({ isOpen, onClose, onSave }) {
  const { exercises: availableExercises } = useExercises()

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const [workoutName, setWorkoutName] = useState('Upper Body Strength')
  const [durationMinutes, setDurationMinutes] = useState('45')
  const [notes, setNotes] = useState('')
  const [selectedExercises, setSelectedExercises] = useState([
    {
      exercise_id: 'ex-1',
      name: 'Bench Press',
      category: 'Strength',
      muscle_group: 'Chest',
      sets: [
        { reps: '10', weight: '60', completed: true },
        { reps: '8', weight: '60', completed: true },
        { reps: '8', weight: '55', completed: true },
      ],
    },
  ])

  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  // Add exercise to workout
  const handleAddExercise = (exercise) => {
    setSelectedExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        muscle_group: exercise.muscle_group,
        sets: [
          {
            reps: exercise.category === 'Cardio' ? '' : '10',
            weight: exercise.category === 'Cardio' ? '' : '20',
            duration_seconds: exercise.category === 'Cardio' ? '600' : '',
            distance: exercise.category === 'Cardio' ? '2.0' : '',
            completed: true,
          },
        ],
      },
    ])
    setIsExercisePickerOpen(false)
  }

  // Remove exercise from workout
  const handleRemoveExercise = (index) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index))
  }

  // Add set to an exercise
  const handleAddSet = (exerciseIndex) => {
    setSelectedExercises((prev) => {
      const updated = [...prev]
      const currentEx = updated[exerciseIndex]
      const lastSet = currentEx.sets[currentEx.sets.length - 1] || {}
      currentEx.sets.push({
        reps: lastSet.reps || '10',
        weight: lastSet.weight || '20',
        duration_seconds: lastSet.duration_seconds || '',
        distance: lastSet.distance || '',
        completed: true,
      })
      return updated
    })
  }

  // Remove set from an exercise
  const handleRemoveSet = (exerciseIndex, setIndex) => {
    setSelectedExercises((prev) => {
      const updated = [...prev]
      updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex)
      return updated
    })
  }

  // Update set field (reps, weight, etc.)
  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    setSelectedExercises((prev) => {
      const updated = [...prev]
      updated[exerciseIndex].sets[setIndex][field] = value
      return updated
    })
  }

  // Toggle set completed
  const handleToggleSetComplete = (exerciseIndex, setIndex) => {
    setSelectedExercises((prev) => {
      const updated = [...prev]
      const isComp = updated[exerciseIndex].sets[setIndex].completed
      updated[exerciseIndex].sets[setIndex].completed = !isComp
      return updated
    })
  }

  // Handle Save
  const handleFinishWorkout = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (selectedExercises.length === 0) {
      setErrorMsg('Please add at least one exercise to your workout.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        workout_name: workoutName,
        duration_minutes: parseInt(durationMinutes, 10) || 30,
        notes,
        exercises: selectedExercises,
      })
      onClose()
    } catch (err) {
      console.error('Error saving workout:', err)
      setErrorMsg(err.message || 'Failed to save workout session.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <Card className="w-full max-w-2xl p-5 sm:p-7 space-y-6 bg-white border-[#F4E2E0] shadow-2xl my-auto animate-fade-in max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#27313A]">
                Log Workout Session
              </h3>
              <p className="text-[11px] text-[#71808C]">Track exercises, sets, weights and reps.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71808C] hover:text-[#27313A] hover:bg-[#FFF5F6] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-xs font-semibold text-[#E11D48] flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Workout Name & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#27313A]">Workout Title</label>
            <input
              type="text"
              required
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g. Upper Body Strength"
              className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-bold focus:outline-none focus:border-[#FF6F7D]"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {WORKOUT_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setWorkoutName(preset)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer border ${
                    workoutName === preset
                      ? 'bg-[#FFE5E8] text-[#FF6F7D] border-[#FFCCD2]'
                      : 'bg-[#FFF9F8] text-[#71808C] border-[#F4E2E0] hover:text-[#27313A]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF6F7D]" />
                <span>Duration (Minutes)</span>
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] font-semibold focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A]">Notes / Focus</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. High intensity, hit personal best"
                className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
          </div>

          {/* Logged Exercises List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#71808C]">
                Exercises ({selectedExercises.length})
              </h4>

              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setIsExercisePickerOpen(true)}
                className="text-xs font-bold text-[#FF6F7D]"
              >
                Add Exercise
              </Button>
            </div>

            {/* Exercise Picker Modal / Sub-view */}
            {isExercisePickerOpen && (
              <Card className="p-4 bg-[#FFF5F6] border-[#FFCCD2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#27313A] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6F7D]" />
                    <span>Select an Exercise from Library:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsExercisePickerOpen(false)}
                    className="text-xs text-[#71808C] hover:text-[#27313A] font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableExercises.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleAddExercise(ex)}
                      className="p-2 rounded-xl bg-white border border-[#F4E2E0] hover:border-[#FF6F7D] text-left transition-all cursor-pointer shadow-xs hover:scale-101"
                    >
                      <span className="text-xs font-bold text-[#27313A] block truncate">
                        {ex.name}
                      </span>
                      <span className="text-[10px] text-[#71808C] block truncate">
                        {ex.muscle_group || ex.category}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Selected Exercises Stack */}
            <div className="space-y-4">
              {selectedExercises.map((ex, exIdx) => {
                const isCardio = ex.category === 'Cardio'

                return (
                  <div
                    key={exIdx}
                    className="p-4 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] space-y-3 shadow-xs"
                  >
                    {/* Exercise Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#27313A]">
                          {ex.name}
                        </span>
                        <Badge variant="coral" size="sm">
                          {ex.muscle_group || ex.category}
                        </Badge>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exIdx)}
                        className="p-1 rounded-lg text-[#71808C] hover:text-[#E11D48] hover:bg-[#FFE5E8] cursor-pointer"
                        title="Remove Exercise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sets Rows */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-[#71808C] uppercase px-1">
                        <span className="col-span-2">Set</span>
                        {isCardio ? (
                          <>
                            <span className="col-span-4">Duration (sec)</span>
                            <span className="col-span-4">Distance (km)</span>
                          </>
                        ) : (
                          <>
                            <span className="col-span-4">Weight (kg)</span>
                            <span className="col-span-4">Reps</span>
                          </>
                        )}
                        <span className="col-span-2 text-center">Done</span>
                      </div>

                      {ex.sets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <span className="col-span-2 text-xs font-bold text-[#27313A] pl-1">
                            #{setIdx + 1}
                          </span>

                          {isCardio ? (
                            <>
                              <input
                                type="number"
                                placeholder="600"
                                value={set.duration_seconds || ''}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, 'duration_seconds', e.target.value)
                                }
                                className="col-span-4 px-2.5 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs text-[#27313A] font-semibold focus:outline-none focus:border-[#FF6F7D]"
                              />
                              <input
                                type="number"
                                step="0.1"
                                placeholder="2.5"
                                value={set.distance || ''}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, 'distance', e.target.value)
                                }
                                className="col-span-4 px-2.5 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs text-[#27313A] font-semibold focus:outline-none focus:border-[#FF6F7D]"
                              />
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                step="0.5"
                                placeholder="kg"
                                value={set.weight || ''}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, 'weight', e.target.value)
                                }
                                className="col-span-4 px-2.5 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs text-[#27313A] font-semibold focus:outline-none focus:border-[#FF6F7D]"
                              />
                              <input
                                type="number"
                                placeholder="reps"
                                value={set.reps || ''}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, 'reps', e.target.value)
                                }
                                className="col-span-4 px-2.5 py-1.5 rounded-xl bg-white border border-[#F4E2E0] text-xs text-[#27313A] font-semibold focus:outline-none focus:border-[#FF6F7D]"
                              />
                            </>
                          )}

                          <div className="col-span-2 flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                set.completed
                                  ? 'bg-[#10B981] text-white shadow-xs'
                                  : 'bg-white border border-[#D0C0BE] text-slate-400'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            {ex.sets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSet(exIdx, setIdx)}
                                className="text-slate-300 hover:text-[#E11D48]"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddSet(exIdx)}
                      className="text-[11px] font-bold text-[#FF6F7D] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Set</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F4E2E0] shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            icon={CheckCircle2}
            disabled={saving}
            onClick={handleFinishWorkout}
            className="font-bold text-xs"
          >
            {saving ? 'Saving Workout...' : 'Finish Workout'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

