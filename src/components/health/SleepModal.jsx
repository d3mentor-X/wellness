import { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Moon, X, Save, Clock, Target } from 'lucide-react'

export function SleepModal({
  isOpen,
  onClose,
  onSave,
  initialMinutes = null,
  initialGoalMinutes = 480,
  loading,
}) {
  const currentTotalMins = initialMinutes !== null && initialMinutes !== undefined ? initialMinutes : 450 // 7h 30m default
  const defaultHours = Math.floor(currentTotalMins / 60)
  const defaultMins = currentTotalMins % 60
  const defaultGoalHours = (initialGoalMinutes / 60).toFixed(1)

  const [hours, setHours] = useState(String(defaultHours))
  const [minutes, setMinutes] = useState(String(defaultMins))
  const [goalHours, setGoalHours] = useState(String(defaultGoalHours))

  useEffect(() => {
    if (isOpen) {
      const curM = initialMinutes !== null && initialMinutes !== undefined ? initialMinutes : 450
      setHours(String(Math.floor(curM / 60)))
      setMinutes(String(curM % 60))
      setGoalHours(String(((initialGoalMinutes || 480) / 60).toFixed(1)))
    }
  }, [isOpen, initialMinutes, initialGoalMinutes])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hVal = Math.max(0, Math.min(24, parseInt(hours, 10) || 0))
  const mVal = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0))
  const totalMins = hVal * 60 + mVal
  const goalMins = Math.round((parseFloat(goalHours) || 8) * 60)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave({
      totalMinutes: totalMins,
      goalMinutes: goalMins,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
      <Card className="w-full max-w-md p-6 space-y-5 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#27313A]">Log Daily Sleep</h3>
              <p className="text-[11px] text-[#71808C]">Track your rest & recovery duration.</p>
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
          {/* Sleep Duration Inputs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Sleep Duration</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    required
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full px-3.5 py-2 pr-10 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-black focus:outline-none focus:border-[#7C3AED]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71808C]">
                    hrs
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    required
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-full px-3.5 py-2 pr-12 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-black focus:outline-none focus:border-[#7C3AED]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71808C]">
                    mins
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sleep Goal Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#FF6F7D]" />
              <span>Target Sleep Goal (Hours)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="3"
                max="16"
                step="0.5"
                required
                value={goalHours}
                onChange={(e) => setGoalHours(e.target.value)}
                className="w-full px-3.5 py-2 pr-12 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-bold focus:outline-none focus:border-[#FF6F7D]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71808C]">
                hours
              </span>
            </div>
          </div>

          {/* Visual Summary Card */}
          <div className="p-3.5 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] text-center space-y-1">
            <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">
              Total Logged Sleep
            </span>
            <p className="text-lg font-black text-[#27313A]">
              {hVal} hrs {mVal} mins
            </p>
            <p className="text-[11px] text-[#71808C]">
              Goal: {goalHours} hrs ({Math.min(100, Math.round((totalMins / (goalMins || 1)) * 100))}% reached)
            </p>
          </div>

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
              {loading ? 'Saving...' : 'Save Sleep'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

