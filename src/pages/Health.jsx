import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { ProgressBar } from '../components/common/ProgressBar'
import { SectionHeader } from '../components/common/SectionHeader'
import { SleepModal } from '../components/health/SleepModal'
import { ScreenTimeModal } from '../components/health/ScreenTimeModal'
import { useHealth } from '../hooks/useHealth'
import {
  Moon,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Edit2,
  Lock,
  Globe,
  Trash2,
  CalendarDays,
  Sparkles,
  Eye,
} from 'lucide-react'

function formatMins(totalMins) {
  if (totalMins === null || totalMins === undefined) return 'Not logged'
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function Health({ onNavigate }) {
  const {
    selectedDate,
    setSelectedDate,
    currentLog,
    averages,
    history,
    loading,
    actionLoading,
    error,
    saveSleep,
    saveScreenTime,
    deleteScreenshot,
  } = useHealth()

  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false)
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === todayStr

  // Date navigation
  const changeDateBy = (days) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
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

  // Sleep metrics
  const sleepMins = currentLog?.sleep_minutes
  const sleepGoalMins = currentLog?.sleep_goal_minutes || 480
  const sleepPercent = sleepMins !== null && sleepMins !== undefined
    ? Math.min(100, Math.round((sleepMins / (sleepGoalMins || 1)) * 100))
    : 0

  // Screen time metrics
  const screenMins = currentLog?.screen_time_minutes
  const screenGoalMins = currentLog?.screen_time_goal_minutes || 240
  const screenPercent = screenMins !== null && screenMins !== undefined
    ? Math.min(100, Math.round((screenMins / (screenGoalMins || 1)) * 100))
    : 0

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header & Navigation */}
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
              Health & Wellbeing
            </h1>
            <Badge variant="purple" size="sm">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Rest & Screen Time
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Track your nightly sleep quality, daily screen habits, and digital balance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            icon={Moon}
            onClick={() => setIsSleepModalOpen(true)}
            className="text-xs font-bold"
          >
            {sleepMins !== null ? 'Edit Sleep' : 'Log Sleep'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Smartphone}
            onClick={() => setIsScreenModalOpen(true)}
            className="text-xs font-bold"
          >
            {screenMins !== null ? 'Edit Screen Time' : 'Log Screen Time'}
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
          <Calendar className="w-4 h-4 text-[#7C3AED]" />
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-[#F0E5E3] rounded-md w-1/3" />
              <div className="h-12 bg-[#F0E5E3] rounded-2xl w-full" />
              <div className="h-4 bg-[#F0E5E3] rounded-md w-1/2" />
            </Card>
          ))}
        </div>
      ) : (
        /* 3. Sleep & Screen Time Main Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sleep Duration Card */}
        <Card className="p-5 sm:p-6 space-y-4 bg-gradient-to-br from-white to-[#FBF9FE] border-[#EDE9FE] shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shadow-xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#27313A]">Daily Sleep</h3>
                  <p className="text-[11px] text-[#71808C]">Rest & physical recovery</p>
                </div>
              </div>

              <Badge variant="purple" size="sm">
                Goal: {formatMins(sleepGoalMins)}
              </Badge>
            </div>

            {/* Logged Value & Progress */}
            <div className="p-4 rounded-2xl bg-white border border-[#EDE9FE] space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-[#27313A]">
                    {formatMins(sleepMins)}
                  </span>
                  {sleepMins !== null && (
                    <span className="text-xs text-[#71808C] ml-1.5">
                      / {formatMins(sleepGoalMins)}
                    </span>
                  )}
                </div>
                {sleepMins !== null && (
                  <span className="text-xs font-bold text-[#7C3AED]">
                    {sleepPercent}% of goal
                  </span>
                )}
              </div>

              {sleepMins !== null ? (
                <ProgressBar value={sleepMins} max={sleepGoalMins} variant="purple" size="md" />
              ) : (
                <p className="text-xs text-[#71808C] italic">No sleep recorded for this date.</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#EDE9FE] flex items-center justify-between text-xs">
            <div className="text-[#71808C]">
              <span>7-Day Avg: </span>
              <strong className="text-[#27313A]">{formatMins(averages.avg_sleep_minutes)}</strong>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={sleepMins !== null ? Edit2 : Plus}
              onClick={() => setIsSleepModalOpen(true)}
              className="text-xs font-bold"
            >
              {sleepMins !== null ? 'Edit Sleep' : 'Log Sleep'}
            </Button>
          </div>
        </Card>

        {/* Screen Time Card */}
        <Card className="p-5 sm:p-6 space-y-4 bg-gradient-to-br from-white to-[#F0F9FF] border-[#BAE6FD] shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#27313A]">Screen Time</h3>
                  <p className="text-[11px] text-[#71808C]">Digital wellness & focus</p>
                </div>
              </div>

              <Badge variant="blue" size="sm">
                Limit: {formatMins(screenGoalMins)}
              </Badge>
            </div>

            {/* Logged Value & Progress */}
            <div className="p-4 rounded-2xl bg-white border border-[#BAE6FD] space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-[#27313A]">
                    {formatMins(screenMins)}
                  </span>
                  {screenMins !== null && (
                    <span className="text-xs text-[#71808C] ml-1.5">
                      / {formatMins(screenGoalMins)} limit
                    </span>
                  )}
                </div>
                {screenMins !== null && (
                  <span className="text-xs font-bold text-[#0284C7]">
                    {screenPercent}% of limit
                  </span>
                )}
              </div>

              {screenMins !== null ? (
                <ProgressBar value={screenMins} max={screenGoalMins} variant="blue" size="md" />
              ) : (
                <p className="text-xs text-[#71808C] italic">No screen time recorded for this date.</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#BAE6FD] flex items-center justify-between text-xs">
            <div className="text-[#71808C]">
              <span>7-Day Avg: </span>
              <strong className="text-[#27313A]">{formatMins(averages.avg_screen_time_minutes)}</strong>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={screenMins !== null ? Edit2 : Plus}
              onClick={() => setIsScreenModalOpen(true)}
              className="text-xs font-bold"
            >
              {screenMins !== null ? 'Edit Screen Time' : 'Log Screen Time'}
            </Button>
          </div>
        </Card>
      </div>
      )}

      {/* 4. Optional Digital Wellbeing Screenshot Section */}
      <Card className="p-5 sm:p-6 space-y-4 bg-white border-[#F4E2E0]">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Digital Wellbeing Verification"
            subtitle="Optional screenshot from your phone's Screen Time / Wellbeing settings."
            icon={Smartphone}
          />
          {currentLog?.screenshot_url && (
            <Badge variant={currentLog.is_screenshot_shared ? 'mint' : 'neutral'} size="sm">
              {currentLog.is_screenshot_shared ? (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#10B981]" />
                  <span>Shared with Club</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#71808C]" />
                  <span>Private to You</span>
                </span>
              )}
            </Badge>
          )}
        </div>

        {currentLog?.screenshot_url ? (
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <a
                href={currentLog.screenshot_url}
                target="_blank"
                rel="noreferrer"
                className="group relative block w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-[#CBD5E1] shadow-xs cursor-pointer shrink-0"
              >
                <img
                  src={currentLog.screenshot_url}
                  alt="Screen time proof"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Eye className="w-5 h-5" />
                </div>
              </a>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#27313A]">
                  Screen Time Screenshot Attached
                </h4>
                <p className="text-xs text-[#71808C]">
                  Logged for {formatDisplayDate(selectedDate)} ({formatMins(screenMins)})
                </p>
                {currentLog.notes && (
                  <p className="text-xs text-[#27313A] italic bg-white px-2.5 py-1 rounded-lg border border-[#E2E8F0] inline-block">
                    "{currentLog.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <a
                href={currentLog.screenshot_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] hover:bg-white text-xs font-bold text-[#0284C7] flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full</span>
              </a>

              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={deleteScreenshot}
                disabled={actionLoading}
                className="text-xs text-[#E11D48] hover:bg-[#FFF1F2]"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#FFF9F8] border border-dashed border-[#F4E2E0] text-center space-y-2">
            <p className="text-xs text-[#71808C]">
              No screenshot attached for {formatDisplayDate(selectedDate)}.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={Smartphone}
              onClick={() => setIsScreenModalOpen(true)}
              className="text-xs font-bold"
            >
              Attach Wellbeing Screenshot
            </Button>
          </div>
        )}
      </Card>

      {/* 5. 14-Day Health Consistency History */}
      {history.length > 0 && (
        <Card className="p-5 space-y-4">
          <SectionHeader
            title="14-Day Rest & Screen Consistency"
            subtitle="Recent daily sleep duration and screen time history."
            icon={CalendarDays}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-center">
            {history.map((h, i) => (
              <div
                key={i}
                onClick={() => setSelectedDate(h.log_date)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  h.log_date === selectedDate
                    ? 'bg-[#EDE9FE] border-[#7C3AED] shadow-xs'
                    : 'bg-[#FFF9F8] border-[#F4E2E0] hover:bg-[#FFF5F6]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#71808C] uppercase block">
                  {new Date(h.log_date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-[11px] text-[#71808C] block mb-1">
                  {h.log_date.slice(5)}
                </span>
                
                <span className="text-xs font-black text-[#7C3AED] block">
                  🌙 {formatMins(h.sleep_minutes)}
                </span>
                <span className="text-[11px] font-semibold text-[#0284C7] block mt-0.5">
                  📱 {formatMins(h.screen_time_minutes)}
                </span>

                {h.screenshot_url && (
                  <span className="text-[9px] font-bold text-[#10B981] block mt-1">
                    ✓ Image
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sleep Modal */}
      <SleepModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        onSave={saveSleep}
        initialMinutes={currentLog?.sleep_minutes}
        initialGoalMinutes={currentLog?.sleep_goal_minutes || 480}
        loading={actionLoading}
      />

      {/* Screen Time Modal */}
      <ScreenTimeModal
        isOpen={isScreenModalOpen}
        onClose={() => setIsScreenModalOpen(false)}
        onSave={saveScreenTime}
        initialMinutes={currentLog?.screen_time_minutes}
        initialGoalMinutes={currentLog?.screen_time_goal_minutes || 240}
        initialScreenshotUrl={currentLog?.screenshot_url}
        initialIsShared={currentLog?.is_screenshot_shared}
        initialNotes={currentLog?.notes}
        loading={actionLoading}
      />
    </div>
  )
}
