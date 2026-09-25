import { useState, useEffect, useRef } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Smartphone, X, Save, Clock, Target, Upload, Lock, Globe, Image as ImageIcon } from 'lucide-react'

export function ScreenTimeModal({
  isOpen,
  onClose,
  onSave,
  initialMinutes = null,
  initialGoalMinutes = 240,
  initialScreenshotUrl = null,
  initialIsShared = false,
  initialNotes = '',
  loading,
}) {
  const currentTotalMins = initialMinutes !== null && initialMinutes !== undefined ? initialMinutes : 180 // 3h default
  const defaultHours = Math.floor(currentTotalMins / 60)
  const defaultMins = currentTotalMins % 60
  const defaultGoalHours = (initialGoalMinutes / 60).toFixed(1)

  const [hours, setHours] = useState(String(defaultHours))
  const [minutes, setMinutes] = useState(String(defaultMins))
  const [goalHours, setGoalHours] = useState(String(defaultGoalHours))
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(initialScreenshotUrl || null)
  const [isShared, setIsShared] = useState(initialIsShared)
  const [notes, setNotes] = useState(initialNotes || '')

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const curM = initialMinutes !== null && initialMinutes !== undefined ? initialMinutes : 180
      setHours(String(Math.floor(curM / 60)))
      setMinutes(String(curM % 60))
      setGoalHours(String(((initialGoalMinutes || 240) / 60).toFixed(1)))
      setSelectedFile(null)
      setPreviewUrl(initialScreenshotUrl || null)
      setIsShared(!!initialIsShared)
      setNotes(initialNotes || '')
    }
  }, [isOpen, initialMinutes, initialGoalMinutes, initialScreenshotUrl, initialIsShared, initialNotes])

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
  const goalMins = Math.round((parseFloat(goalHours) || 4) * 60)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave({
      totalMinutes: totalMins,
      goalMinutes: goalMins,
      screenshotFile: selectedFile,
      isShared,
      notes,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <Card className="w-full max-w-md p-6 space-y-5 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#27313A]">Log Screen Time</h3>
              <p className="text-[11px] text-[#71808C]">Track digital device usage & wellbeing.</p>
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
          {/* Screen Time Duration Inputs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Screen Time Duration</span>
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
                    className="w-full px-3.5 py-2 pr-10 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-black focus:outline-none focus:border-[#0284C7]"
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
                    className="w-full px-3.5 py-2 pr-12 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-black focus:outline-none focus:border-[#0284C7]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71808C]">
                    mins
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Screen Time Goal Limit */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#FF6F7D]" />
              <span>Target Daily Limit (Hours)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.5"
                max="24"
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

          {/* Optional Screenshot Upload */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-[#27313A] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Wellbeing Screenshot (Optional)</span>
              </span>
              <span className="text-[10px] text-[#71808C] font-normal">PNG / JPG / WebP</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD]">
                <img
                  src={previewUrl}
                  alt="Screenshot preview"
                  className="w-12 h-12 rounded-xl object-cover border border-[#93C5FD]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#27313A] truncate">
                    {selectedFile ? selectedFile.name : 'Attached screenshot'}
                  </p>
                  <p className="text-[10px] text-[#71808C]">Click replace to change image</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs py-1 px-2.5"
                >
                  Replace
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-[#F4E2E0] bg-[#FFF9F8] hover:bg-[#FFF5F6] flex items-center justify-center gap-2 text-xs font-bold text-[#71808C] hover:text-[#27313A] transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#0284C7]" />
                <span>Choose wellbeing screenshot</span>
              </button>
            )}
          </div>

          {/* Privacy Toggle (Private vs Shared) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0]">
            <div className="flex items-center gap-2">
              {isShared ? (
                <Globe className="w-4 h-4 text-[#10B981]" />
              ) : (
                <Lock className="w-4 h-4 text-[#71808C]" />
              )}
              <div>
                <p className="text-xs font-bold text-[#27313A]">
                  {isShared ? 'Share Screenshot with Club' : 'Keep Screenshot Private'}
                </p>
                <p className="text-[10px] text-[#71808C]">
                  {isShared
                    ? 'Visible to fellow club members on activity feed'
                    : 'Only you can view this screenshot'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#E5E7EB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10B981]" />
            </label>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A]">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. High productivity day, reading eBooks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
              className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          {/* Visual Summary Card */}
          <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] text-center space-y-1">
            <span className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider">
              Total Logged Screen Time
            </span>
            <p className="text-lg font-black text-[#27313A]">
              {hVal} hrs {mVal} mins
            </p>
            <p className="text-[11px] text-[#71808C]">
              Limit: {goalHours} hrs ({Math.min(100, Math.round((totalMins / (goalMins || 1)) * 100))}% of limit)
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
              {loading ? 'Saving...' : 'Save Screen Time'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

