import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { SectionHeader } from '../components/common/SectionHeader'
import { Sparkles, CheckCircle2, ChevronLeft, Sun } from 'lucide-react'

export default function Spirituality({ onNavigate }) {
  const [prayers, setPrayers] = useState({
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: false,
  })

  const togglePrayer = (key) => {
    setPrayers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const completedCount = Object.values(prayers).filter(Boolean).length

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate?.('profile')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6F7D] hover:underline mb-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
              Spirituality & Mindfulness
            </h1>
            <Badge variant="mint" size="sm">
              {completedCount} / 5 Checked
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Daily prayer tracking, gratitude journal, and mental well-being habits.
          </p>
        </div>
      </div>

      {/* Daily Spiritual Inspiration Quote Card */}
      <Card
        variant="coralTint"
        className="p-6 sm:p-7 relative overflow-hidden space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF6F7D]">
          <Sparkles className="w-4 h-4" />
          <span>Daily Reflection</span>
        </div>
        <blockquote className="text-base sm:text-lg font-bold text-[#27313A] italic leading-relaxed">
          "Take care of your body so your spirit can flourish. Consistency in small daily habits yields great strength."
        </blockquote>
        <p className="text-xs text-[#71808C] font-semibold">— Daily Club Reflection</p>
      </Card>

      {/* Daily Prayer Tracking Checkboxes */}
      <Card className="p-5 sm:p-6 space-y-4">
        <SectionHeader
          title="Daily Prayer & Reflection Habits"
          subtitle="Strictly private to your account."
          icon={Sun}
        />

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { key: 'fajr', label: 'Fajr (Dawn)' },
            { key: 'dhuhr', label: 'Dhuhr (Noon)' },
            { key: 'asr', label: 'Asr (Afternoon)' },
            { key: 'maghrib', label: 'Maghrib (Sunset)' },
            { key: 'isha', label: 'Isha (Night)' },
          ].map((p) => {
            const isDone = prayers[p.key]
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => togglePrayer(p.key)}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                  isDone
                    ? 'bg-[#DDF7EA] border-[#BDEFD6] text-[#1E7D58] shadow-xs'
                    : 'bg-[#FFF9F8] border-[#F4E2E0] text-[#71808C] hover:bg-[#FFE5E8]'
                }`}
              >
                <div className="flex justify-center mb-2">
                  <CheckCircle2
                    className={`w-6 h-6 ${
                      isDone ? 'text-[#10B981]' : 'text-slate-300'
                    }`}
                  />
                </div>
                <span className="text-xs font-bold block">{p.label}</span>
                <span className="text-[10px] font-semibold opacity-80 mt-0.5 block">
                  {isDone ? 'Completed ✓' : 'Mark Done'}
                </span>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
