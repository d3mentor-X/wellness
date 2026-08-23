import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { ProgressRing } from '../components/common/ProgressRing'
import { ProgressBar } from '../components/common/ProgressBar'
import { SectionHeader } from '../components/common/SectionHeader'
import { useDailyActivity } from '../hooks/useDailyActivity'
import { useGamification } from '../hooks/useGamification'
import {
  Footprints,
  Plus,
  ChevronLeft,
  Flame,
  CheckCircle2,
  X,
} from 'lucide-react'

export default function Steps({ onNavigate }) {
  const { todayActivity, activityHistory, loading, updateTodaySteps } = useDailyActivity()
  const { syncGamification } = useGamification()

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [stepInputVal, setStepInputVal] = useState(String(todayActivity.steps || ''))
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const dailyGoal = 10000
  const currentSteps = todayActivity.steps || 0
  const percent = Math.min(100, Math.round((currentSteps / dailyGoal) * 100))
  const remaining = Math.max(0, dailyGoal - currentSteps)
  const distanceKm = ((currentSteps * 0.75) / 1000).toFixed(1)
  const burnedKcal = Math.round(currentSteps * 0.04)

  const handleOpenModal = () => {
    setStepInputVal(String(todayActivity.steps || ''))
    setSaveSuccess(false)
    setIsUpdateModalOpen(true)
  }

  const handleSaveSteps = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateTodaySteps(stepInputVal)
      syncGamification()
      setSaveSuccess(true)
      setTimeout(() => {
        setIsUpdateModalOpen(false)
        setSaveSuccess(false)
      }, 700)
    } catch (err) {
      console.error('Error saving steps:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header & Back Link */}
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
              Steps & Daily Walking
            </h1>
            <Badge variant="blue" size="sm">
              Today
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Monitor your daily step count, active distance, and walking consistency.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenModal}
          className="self-start sm:self-center font-bold text-xs"
        >
          Update Steps
        </Button>
      </div>

      {/* Main Step Hero Ring & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 md:col-span-2 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-white via-[#F5FAFF] to-white border-[#D0E6FF]">
          <ProgressRing
            value={currentSteps}
            max={dailyGoal}
            size={130}
            strokeWidth={10}
            color="#3B82F6"
            trackColor="#E3F0FF"
          >
            <span className="text-2xl font-black text-[#27313A]">
              {loading ? '...' : currentSteps.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-[#71808C]">
              / {dailyGoal.toLocaleString()}
            </span>
          </ProgressRing>

          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="space-y-1">
              <Badge variant="blue" size="sm">
                {percent}% Goal Reached
              </Badge>
              <h3 className="text-lg font-bold text-[#27313A]">
                {remaining === 0
                  ? '🎉 Daily Goal Achieved!'
                  : `${remaining.toLocaleString()} Steps to Daily Goal`}
              </h3>
              <p className="text-xs text-[#71808C]">
                {remaining === 0
                  ? 'Great job on crushing your target today!'
                  : 'A brief 15-minute walk will add ~1,500 steps to your progress.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E3F0FF] text-center">
              <div className="p-2 rounded-xl bg-white border border-[#E3F0FF]">
                <span className="text-xs font-bold text-[#27313A] block">
                  {distanceKm} km
                </span>
                <span className="text-[10px] text-[#71808C]">Distance</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#E3F0FF]">
                <span className="text-xs font-bold text-[#27313A]">
                  {burnedKcal} kcal
                </span>
                <span className="text-[10px] text-[#71808C]">Est. Burned</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#E3F0FF]">
                <span className="text-xs font-bold text-[#27313A]">
                  {Math.round(currentSteps / 110)} min
                </span>
                <span className="text-[10px] text-[#71808C]">Active Time</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Motivation Card */}
        <Card className="p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF6F7D]" />
              <h3 className="text-sm font-bold text-[#27313A]">Walking Target</h3>
            </div>
            <p className="text-xs text-[#71808C]">
              Daily target: <strong>{dailyGoal.toLocaleString()} steps</strong>. Consistent walking lowers fatigue and optimizes workout recovery.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenModal}
            className="w-full text-xs font-bold text-[#3B82F6] justify-center"
          >
            Log Today's Steps
          </Button>
        </Card>
      </div>

      {/* Step History Log */}
      <Card className="p-5 sm:p-6 space-y-4">
        <SectionHeader
          title="Recent Step History"
          subtitle="Your recorded step logs over the past 14 days."
          icon={Footprints}
        />

        {activityHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#71808C] italic">
            No previous step logs recorded yet. Log your first walk today!
          </div>
        ) : (
          <div className="space-y-3">
            {activityHistory.map((item, i) => {
              const d = new Date(item.activity_date)
              const formattedDate = d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
              const isToday = item.activity_date === new Date().toISOString().split('T')[0]
              const stCount = item.steps || 0

              return (
                <div key={i} className="flex items-center gap-4 text-xs">
                  <span className="w-24 font-semibold text-[#71808C]">
                    {isToday ? 'Today' : formattedDate}
                  </span>
                  <div className="flex-1">
                    <ProgressBar
                      value={stCount}
                      max={dailyGoal}
                      variant="blue"
                      size="sm"
                    />
                  </div>
                  <span className="w-20 text-right font-bold text-[#27313A]">
                    {stCount.toLocaleString()} steps
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Update Steps Modal Dialog */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <Card className="w-full max-w-sm p-6 space-y-5 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0]">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-[#3B82F6]" />
                <h3 className="text-base font-bold text-[#27313A]">Update Today's Steps</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1 rounded-xl text-[#71808C] hover:text-[#27313A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-semibold text-[#16A34A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Steps updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSteps} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27313A]">
                  Step Count for Today
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  required
                  value={stepInputVal}
                  onChange={(e) => setStepInputVal(e.target.value)}
                  placeholder="e.g. 8420"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-bold focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              {/* Quick Increment Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1000, 2500, 5000, 10000].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() =>
                      setStepInputVal(
                        String((parseInt(stepInputVal, 10) || 0) + inc)
                      )
                    }
                    className="px-2.5 py-1 rounded-xl bg-[#F5FAFF] border border-[#CCE4FF] text-[11px] font-bold text-[#2563EB] hover:bg-[#E3F0FF] cursor-pointer"
                  >
                    +{inc.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F4E2E0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUpdateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Steps'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
