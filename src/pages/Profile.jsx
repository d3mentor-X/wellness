import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Avatar } from '../components/common/Avatar'
import { ProgressBar } from '../components/common/ProgressBar'
import { AchievementBadge } from '../components/common/AchievementBadge'
import { SectionHeader } from '../components/common/SectionHeader'
import {
  Settings as SettingsIcon,
  Award,
  ShieldCheck,
  Sparkles,
  Calendar,
  ChevronRight,
} from 'lucide-react'

export default function Profile({ onNavigate }) {
  const achievements = [
    {
      icon: '🔥',
      title: '7 Day Streak',
      description: 'Logged 7 continuous active days',
      unlocked: true,
      tier: 'bronze',
      awardedAt: 'Aug 10',
    },
    {
      icon: '🔥',
      title: '30 Day Streak',
      description: 'Completed 30 consecutive days of activity',
      unlocked: false,
      tier: 'gold',
    },
    {
      icon: '👟',
      title: '100K Steps',
      description: 'Accumulated over 100,000 steps',
      unlocked: true,
      tier: 'silver',
      awardedAt: 'Aug 15',
    },
    {
      icon: '💪',
      title: '50 Workouts',
      description: 'Completed 50 logged fitness sessions',
      unlocked: true,
      tier: 'gold',
      awardedAt: 'Aug 18',
    },
    {
      icon: '🏆',
      title: 'Challenge Winner',
      description: 'Finished 1st place in a club challenge',
      unlocked: true,
      tier: 'diamond',
      awardedAt: 'Aug 14',
    },
    {
      icon: '⭐',
      title: "Instructor's Pick",
      description: 'Awarded for extraordinary club dedication',
      unlocked: true,
      tier: 'instructor',
      awardedAt: 'Aug 20',
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Profile Hero Card */}
      <Card className="p-6 sm:p-7 bg-gradient-to-r from-white via-[#FFF5F6] to-white border-[#F4E2E0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            <Avatar name="Alex Rivera" size="xl" status="online" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#27313A] tracking-tight">
                  Alex Rivera
                </h1>
                <Badge variant="coral" size="sm">
                  Club Member
                </Badge>
                <Badge variant="mint" size="sm">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-[#71808C] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Member since July 2026 • Private Club
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs font-bold text-[#FF6F7D]">
                <span>🔥 12 Day Streak</span>
                <span>•</span>
                <span>🏆 4 Badges Earned</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={SettingsIcon}
            onClick={() => onNavigate?.('settings')}
            className="self-start sm:self-center text-xs font-bold"
          >
            Settings
          </Button>
        </div>
      </Card>

      {/* 2. Level & XP Progression */}
      <Card className="p-5 sm:p-6 space-y-3 bg-white border-[#F2DCD9]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] font-black text-sm flex items-center justify-center">
              L8
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#27313A]">
                Level 8 • Fitness Explorer
              </h3>
              <p className="text-xs text-[#71808C]">Earn XP by logging workouts, steps, and challenges.</p>
            </div>
          </div>
          <span className="text-xs sm:text-sm font-black text-[#FF6F7D]">
            680 / 800 XP (85%)
          </span>
        </div>
        <ProgressBar value={680} max={800} variant="coral" size="lg" />
      </Card>

      {/* 3. Badges & Trophy Showcase */}
      <div className="space-y-4">
        <SectionHeader
          title="Badges & Milestones"
          subtitle="Earned trophies from your club challenges and consistency."
          icon={Award}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {achievements.map((badge, idx) => (
            <AchievementBadge key={idx} {...badge} />
          ))}
        </div>
      </div>

      {/* 4. Personal Stats & Privacy Note */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#27313A]">
              Personal Stats Overview
            </h3>
            <span className="text-xs font-semibold text-[#71808C]">All Time</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0]">
              <span className="text-xl sm:text-2xl font-black text-[#27313A]">48</span>
              <span className="text-[11px] font-bold text-[#71808C] block uppercase mt-0.5">
                Workouts
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0]">
              <span className="text-xl sm:text-2xl font-black text-[#27313A]">342k</span>
              <span className="text-[11px] font-bold text-[#71808C] block uppercase mt-0.5">
                Total Steps
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0]">
              <span className="text-xl sm:text-2xl font-black text-[#27313A]">38</span>
              <span className="text-[11px] font-bold text-[#71808C] block uppercase mt-0.5">
                Active Days
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#C6F1DC] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
            <p className="text-xs text-[#1E7D58] leading-relaxed">
              <strong>Strict Privacy:</strong> Your private metrics (weight, height, and age) are protected by Row Level Security and are never shared with other club members.
            </p>
          </div>
        </Card>

        {/* Quick Contextual Links */}
        <div className="space-y-3.5">
          <Card
            hover
            onClick={() => onNavigate?.('spirituality')}
            className="p-4 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E3F0FF] text-[#2563EB] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#27313A]">Spiritual Habits</h4>
                <p className="text-[11px] text-[#71808C]">Daily reflection & prayer</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71808C] group-hover:text-[#FF6F7D]" />
          </Card>

          <Card
            hover
            onClick={() => onNavigate?.('settings')}
            className="p-4 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#27313A]">Account Settings</h4>
                <p className="text-[11px] text-[#71808C]">Preferences & notifications</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71808C] group-hover:text-[#FF6F7D]" />
          </Card>
        </div>
      </div>
    </div>
  )
}
