import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { ProgressRing } from '../components/common/ProgressRing'
import { ProgressBar } from '../components/common/ProgressBar'
import { SectionHeader } from '../components/common/SectionHeader'
import { Footprints, Plus, ChevronLeft, Flame } from 'lucide-react'

export default function Steps({ onNavigate }) {
  const hourlySteps = [
    { hour: '07 AM', steps: 1200 },
    { hour: '09 AM', steps: 2400 },
    { hour: '12 PM', steps: 1800 },
    { hour: '03 PM', steps: 1500 },
    { hour: '06 PM', steps: 1520 },
  ]

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
          onClick={() => {}}
          className="self-start sm:self-center font-bold text-xs"
        >
          Log Steps
        </Button>
      </div>

      {/* Main Step Hero Ring & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 md:col-span-2 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-white via-[#F5FAFF] to-white border-[#D0E6FF]">
          <ProgressRing
            value={8420}
            max={10000}
            size={130}
            strokeWidth={10}
            color="#3B82F6"
            trackColor="#E3F0FF"
          >
            <span className="text-2xl font-black text-[#27313A]">8,420</span>
            <span className="text-[11px] font-bold text-[#71808C]">/ 10,000</span>
          </ProgressRing>

          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="space-y-1">
              <Badge variant="blue" size="sm">
                84% Goal Reached
              </Badge>
              <h3 className="text-lg font-bold text-[#27313A]">
                1,580 Steps to Daily Goal
              </h3>
              <p className="text-xs text-[#71808C]">
                An estimated 15-minute evening walk will complete today's target!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E3F0FF] text-center">
              <div className="p-2 rounded-xl bg-white border border-[#E3F0FF]">
                <span className="text-xs font-bold text-[#27313A] block">6.2 km</span>
                <span className="text-[10px] text-[#71808C]">Distance</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#E3F0FF]">
                <span className="text-xs font-bold text-[#27313A]">380 kcal</span>
                <span className="text-[10px] text-[#71808C]">Burned</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#E3F0FF]">
                <span className="text-xs font-bold text-[#27313A]">68 min</span>
                <span className="text-[10px] text-[#71808C]">Active Time</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF6F7D]" />
              <h3 className="text-sm font-bold text-[#27313A]">Weekly Step Record</h3>
            </div>
            <p className="text-xs text-[#71808C]">
              You have maintained an average of <strong>9,240 steps/day</strong> over the last 7 days.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#DDF7EA] border border-[#BDEFD6] text-xs font-bold text-[#1E7D58]">
            🎉 On track to earn the 100K Steps badge this Sunday!
          </div>
        </Card>
      </div>

      {/* Hourly Step Distribution */}
      <Card className="p-5 sm:p-6 space-y-4">
        <SectionHeader
          title="Today's Walking Timeline"
          subtitle="Hourly activity distribution."
          icon={Footprints}
        />

        <div className="space-y-3">
          {hourlySteps.map((h, i) => (
            <div key={i} className="flex items-center gap-4 text-xs">
              <span className="w-14 font-semibold text-[#71808C]">{h.hour}</span>
              <div className="flex-1">
                <ProgressBar value={h.steps} max={3000} variant="blue" size="sm" />
              </div>
              <span className="w-16 text-right font-bold text-[#27313A]">
                {h.steps} steps
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
