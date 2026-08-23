import { useState } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import {
  Trophy,
  X,
  Calendar,
  AlertCircle,
  Plus,
} from 'lucide-react'

const CHALLENGE_TYPE_CONFIG = {
  active_days: { label: 'Active Days', defaultUnit: 'days', defaultTarget: 20 },
  steps: { label: 'Total Steps', defaultUnit: 'steps', defaultTarget: 100000 },
  workouts: { label: 'Total Workouts', defaultUnit: 'workouts', defaultTarget: 20 },
  distance: { label: 'Distance', defaultUnit: 'km', defaultTarget: 50 },
}

export function CreateChallengeModal({ isOpen, onClose, onCreate }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const defaultEndStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [challengeType, setChallengeType] = useState('active_days')
  const [targetValue, setTargetValue] = useState('20')
  const [unit, setUnit] = useState('days')
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(defaultEndStr)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleTypeChange = (type) => {
    setChallengeType(type)
    const conf = CHALLENGE_TYPE_CONFIG[type]
    if (conf) {
      setUnit(conf.defaultUnit)
      setTargetValue(String(conf.defaultTarget))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!title.trim()) {
      setErrorMsg('Challenge title is required.')
      return
    }

    const numTarget = parseFloat(targetValue)
    if (!numTarget || numTarget <= 0) {
      setErrorMsg('Target value must be a positive number.')
      return
    }

    if (endDate < startDate) {
      setErrorMsg('End date must be on or after the start date.')
      return
    }

    setSaving(true)
    try {
      await onCreate({
        title,
        description,
        challenge_type: challengeType,
        target_value: numTarget,
        unit,
        start_date: startDate,
        end_date: endDate,
      })
      onClose()
    } catch (err) {
      console.error('Error creating challenge:', err)
      setErrorMsg(err.message || 'Failed to create challenge.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <Card className="w-full max-w-lg p-6 space-y-5 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#27313A]">
                Create Club Challenge
              </h3>
              <p className="text-[11px] text-[#71808C]">Launch a goal for all club members.</p>
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

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-xs font-semibold text-[#E11D48] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A]">Challenge Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 30-Day Consistency Challenge"
              className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-bold focus:outline-none focus:border-[#FF6F7D]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A]">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the rules and motivation for members..."
              className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
            />
          </div>

          {/* Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#27313A]">Challenge Metric Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CHALLENGE_TYPE_CONFIG).map(([key, conf]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTypeChange(key)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    challengeType === key
                      ? 'bg-[#FFE5E8] border-[#FF6F7D] text-[#FF6F7D] shadow-xs'
                      : 'bg-[#FFF9F8] border-[#F4E2E0] text-[#71808C] hover:text-[#27313A]'
                  }`}
                >
                  {conf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A]">Target Goal</label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] font-bold focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A]">Unit Label</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="days, steps, workouts"
                className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
          </div>

          {/* Date Window */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#FF6F7D]" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#FF6F7D]" />
                <span>End Date</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F4E2E0]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Plus}
              disabled={saving}
            >
              {saving ? 'Publishing...' : 'Publish Challenge'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

