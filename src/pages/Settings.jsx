import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import {
  ChevronLeft,
  Bell,
  Sliders,
  CheckCircle2,
  Shield,
} from 'lucide-react'

export default function Settings({ onNavigate }) {
  const [units, setUnits] = useState('metric') // metric or imperial
  const [notifs, setNotifs] = useState({
    challenges: true,
    cheers: true,
    reminders: true,
    instructor: true,
  })

  const toggleNotif = (key) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
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
              Settings & Preferences
            </h1>
            <Badge variant="coral" size="sm">
              Account
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Manage measurement units, notifications, and privacy options.
          </p>
        </div>
      </div>

      {/* 1. Unit Preferences */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#FF6F7D]" />
          <h3 className="text-base font-bold text-[#27313A]">Measurement Units</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setUnits('metric')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              units === 'metric'
                ? 'bg-[#FFE5E8] border-[#FF6F7D] text-[#E04B5A]'
                : 'bg-white border-[#F4E2E0] text-[#71808C]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#27313A]">Metric System</span>
              {units === 'metric' && <CheckCircle2 className="w-4 h-4 text-[#FF6F7D]" />}
            </div>
            <p className="text-xs text-[#71808C] mt-1">Kilograms (kg), Kilometers (km), Centimeters (cm)</p>
          </button>

          <button
            type="button"
            onClick={() => setUnits('imperial')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              units === 'imperial'
                ? 'bg-[#FFE5E8] border-[#FF6F7D] text-[#E04B5A]'
                : 'bg-white border-[#F4E2E0] text-[#71808C]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#27313A]">Imperial System</span>
              {units === 'imperial' && <CheckCircle2 className="w-4 h-4 text-[#FF6F7D]" />}
            </div>
            <p className="text-xs text-[#71808C] mt-1">Pounds (lbs), Miles (mi), Inches (in)</p>
          </button>
        </div>
      </Card>

      {/* 2. Notification Preferences */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#FF6F7D]" />
          <h3 className="text-base font-bold text-[#27313A]">Club Notifications</h3>
        </div>

        <div className="space-y-3">
          {[
            {
              key: 'challenges',
              title: 'Challenge Updates & Standings',
              desc: 'Get notified when club challenge ranks change or new challenges start.',
            },
            {
              key: 'cheers',
              title: 'High-Fives & Cheering',
              desc: 'Get notified when members high-five your completed workouts.',
            },
            {
              key: 'instructor',
              title: 'Instructor Posts & Workouts',
              desc: 'Stay updated when Coach Marcus pins a new daily tip or routine.',
            },
            {
              key: 'reminders',
              title: 'Daily Streak Reminder',
              desc: 'Evening nudge to ensure your streak remains unbroken.',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0]"
            >
              <div className="space-y-0.5 max-w-md">
                <h4 className="text-xs sm:text-sm font-bold text-[#27313A]">{item.title}</h4>
                <p className="text-[11px] text-[#71808C]">{item.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => toggleNotif(item.key)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifs[item.key] ? 'bg-[#FF6F7D]' : 'bg-[#E2E8F0]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    notifs[item.key] ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Security & Privacy */}
      <Card className="p-5 sm:p-6 space-y-3 bg-[#F0FDF4] border-[#C6F1DC]">
        <div className="flex items-center gap-2 text-sm font-bold text-[#1E7D58]">
          <Shield className="w-5 h-5" />
          <span>Security & Row Level Privacy Active</span>
        </div>
        <p className="text-xs text-[#1E7D58] leading-relaxed">
          Your private health metrics, nutrition logs, and prayers are encrypted and strictly guarded by PostgreSQL Row Level Security.
        </p>
      </Card>
    </div>
  )
}
