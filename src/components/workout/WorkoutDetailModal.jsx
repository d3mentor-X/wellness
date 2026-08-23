import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import {
  Dumbbell,
  Clock,
  Calendar,
  X,
  Trash2,
  CheckCircle2,
} from 'lucide-react'

export function WorkoutDetailModal({ workout, isOpen, onClose, onDelete }) {
  if (!isOpen || !workout) return null

  const formattedDate = workout.workout_date
    ? new Date(workout.workout_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Completed Workout'

  const exercises = workout.workout_exercises || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <Card className="w-full max-w-lg p-6 space-y-5 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#F4E2E0] shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="coral" size="sm">
                Workout Details
              </Badge>
              <span className="text-xs text-[#71808C] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </span>
            </div>
            <h3 className="text-lg font-black text-[#27313A]">
              {workout.workout_name || 'Workout Session'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71808C] hover:text-[#27313A] hover:bg-[#FFF5F6] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workout High-Level Stats */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#71808C] block uppercase">Duration</span>
              <span className="text-xs sm:text-sm font-bold text-[#27313A]">
                {workout.duration_minutes || 0} minutes
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DDF7EA] text-[#1E7D58] flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#71808C] block uppercase">Exercises</span>
              <span className="text-xs sm:text-sm font-bold text-[#27313A]">
                {exercises.length} logged
              </span>
            </div>
          </div>
        </div>

        {workout.notes && (
          <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#E9ECEF] text-xs text-[#495057] italic shrink-0">
            "{workout.notes}"
          </div>
        )}

        {/* Exercises & Sets Breakdown */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#71808C]">
            Exercise Breakdown
          </h4>

          {exercises.length === 0 ? (
            <p className="text-xs text-[#71808C] italic">No exercise details recorded.</p>
          ) : (
            exercises.map((item, i) => {
              const exName = item.exercises?.name || 'Exercise'
              const exCategory = item.exercises?.category || 'Strength'
              const sets = item.exercise_sets || []

              return (
                <div
                  key={item.id || i}
                  className="p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#27313A]">
                        {exName}
                      </span>
                      <Badge variant="mint" size="sm">
                        {exCategory}
                      </Badge>
                    </div>
                    <span className="text-xs font-semibold text-[#71808C]">
                      {sets.length} {sets.length === 1 ? 'set' : 'sets'}
                    </span>
                  </div>

                  {sets.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[#F4E2E0]">
                      {sets.map((s, sIdx) => (
                        <div
                          key={s.id || sIdx}
                          className="flex items-center justify-between text-xs text-[#71808C]"
                        >
                          <span className="font-semibold text-[#27313A]">Set {s.set_number || sIdx + 1}</span>
                          <span className="font-bold text-[#27313A]">
                            {s.weight ? `${s.weight} kg × ` : ''}
                            {s.reps ? `${s.reps} reps` : ''}
                            {s.duration_seconds ? `${s.duration_seconds}s ` : ''}
                            {s.distance ? `${s.distance} km` : ''}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F4E2E0] shrink-0">
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => {
                if (window.confirm('Delete this workout log?')) {
                  onDelete(workout.id)
                  onClose()
                }
              }}
              className="text-xs font-bold text-[#E11D48] hover:bg-[#FFE5E8]"
            >
              Delete Log
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="ml-auto text-xs font-bold"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}

