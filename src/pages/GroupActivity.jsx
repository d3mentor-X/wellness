import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Avatar } from '../components/common/Avatar'
import { SectionHeader } from '../components/common/SectionHeader'
import {
  MessageCircle,
  Trophy,
  Flame,
  Heart,
  Sparkles,
  ExternalLink,
  Pin,
  Dumbbell,
  Footprints,
  Award,
} from 'lucide-react'

export default function GroupActivity({ onNavigate }) {
  const [cheeredItems, setCheeredItems] = useState({})

  const toggleCheer = (id) => {
    setCheeredItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const activities = [
    {
      id: '1',
      user: 'Sarah Jenkins',
      action: 'completed Upper Body Strength workout',
      detail: '45 mins • 4 exercises • 85kg max squat',
      time: '12m ago',
      icon: Dumbbell,
      cheersCount: 6,
    },
    {
      id: '2',
      user: 'Tariq Mansoor',
      action: 'hit 10,000 steps milestone',
      detail: '10,420 steps • 7.4 km walked today',
      time: '45m ago',
      icon: Footprints,
      cheersCount: 4,
    },
    {
      id: '3',
      user: 'Zayd Al-Hassan',
      action: 'unlocked 30-Day Consistency Badge',
      detail: '🔥 30 consecutive days of logging activity',
      time: '2h ago',
      icon: Award,
      cheersCount: 9,
    },
  ]

  const leaderboardTop3 = [
    { rank: '🥇', name: 'Sarah J.', points: '2,480 pts', streak: '24d' },
    { rank: '🥈', name: 'Zayd H.', points: '2,310 pts', streak: '18d' },
    { rank: '🥉', name: 'Alex Rivera (You)', points: '2,150 pts', streak: '12d' },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
              Club Community
            </h1>
            <Badge variant="mint" size="sm" dot>
              18 Members Online
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C] mt-1">
            Club announcements, shared achievements, and high-fives.
          </p>
        </div>

        {/* WhatsApp Secondary Action Link */}
        <a
          href="https://chat.whatsapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#DDF7EA] hover:bg-[#C8F0DC] text-[#1E7D58] font-bold text-xs sm:text-sm shadow-xs transition-all hover:-translate-y-0.5"
        >
          <MessageCircle className="w-4 h-4 fill-[#1E7D58]" />
          <span>Open WhatsApp Community</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>

      {/* 2. WhatsApp Official Chat Highlight Notice */}
      <Card className="p-5 bg-gradient-to-r from-[#F0FDF4] via-white to-[#F0FDF4] border-[#C6F1DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#25D366] text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
            <MessageCircle className="w-6 h-6 fill-white" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#27313A]">
                Official Fitness Club WhatsApp Group
              </h3>
              <Badge variant="mint" size="sm">
                Live Chat
              </Badge>
            </div>
            <p className="text-xs text-[#71808C]">
              Casual group banter, workout photos, and daily check-ins happen in our WhatsApp group.
            </p>
          </div>
        </div>

        <Button
          variant="mint"
          size="sm"
          onClick={() => window.open('https://chat.whatsapp.com', '_blank')}
          className="font-bold text-xs shrink-0"
        >
          Join Group Chat
        </Button>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Instructor Board & Activity Stream */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pinned Instructor Announcement */}
          <Card variant="coralTint" className="p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar name="Coach Marcus" size="sm" isInstructor />
                <div>
                  <h4 className="text-xs font-bold text-[#27313A]">
                    Coach Marcus • Head Instructor
                  </h4>
                  <p className="text-[10px] text-[#71808C]">Pinned Announcement • 3h ago</p>
                </div>
              </div>
              <Badge variant="coral" size="sm">
                <Pin className="w-3 h-3 inline mr-1" />
                Pinned
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-[#27313A] leading-relaxed">
              "📢 <strong>Weekend Step Challenge is LIVE!</strong> Make sure to log your walks before midnight Sunday. Let's aim for 100% club participation this weekend!"
            </p>
          </Card>

          {/* Live Activity Feed */}
          <div className="space-y-4">
            <SectionHeader
              title="Recent Club Activity"
              subtitle="Cheer on your teammates as they hit their goals."
              icon={Flame}
            />

            <div className="space-y-3.5">
              {activities.map((item) => {
                const Icon = item.icon
                const isCheered = cheeredItems[item.id]
                const totalCheers = isCheered
                  ? item.cheersCount + 1
                  : item.cheersCount

                return (
                  <Card key={item.id} className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={item.user} size="sm" />
                        <div>
                          <p className="text-xs sm:text-sm text-[#27313A]">
                            <strong>{item.user}</strong> {item.action}
                          </p>
                          <p className="text-[11px] text-[#71808C]">{item.time}</p>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs font-medium text-[#27313A]">
                      {item.detail}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => toggleCheer(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCheered
                            ? 'bg-[#FFE5E8] text-[#E04B5A]'
                            : 'bg-[#F9F5F4] hover:bg-[#FFE5E8] text-[#71808C] hover:text-[#E04B5A]'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isCheered ? 'fill-[#E04B5A] text-[#E04B5A]' : ''
                          }`}
                        />
                        <span>{totalCheers} High-Fives</span>
                      </button>

                      <span className="text-[11px] text-[#71808C]">
                        Fitness Club Verified ✓
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Leaderboard Podium Snippet */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-bold text-[#27313A]">
                  Weekly Podium
                </h3>
              </div>
              <Badge variant="amber" size="sm">
                Week 34
              </Badge>
            </div>

            <div className="space-y-2.5">
              {leaderboardTop3.map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    m.name.includes('You')
                      ? 'bg-[#FFE5E8]/60 border-[#FFCCD2]'
                      : 'bg-[#F9F6F5] border-[#F0E4E2]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{m.rank}</span>
                    <div>
                      <p className="text-xs font-bold text-[#27313A]">{m.name}</p>
                      <p className="text-[10px] text-[#71808C]">🔥 {m.streak} streak</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#FF6F7D]">
                    {m.points}
                  </span>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate?.('leaderboard')}
              className="w-full text-xs font-bold text-[#FF6F7D] justify-center"
            >
              <span>View Full Leaderboard</span>
            </Button>
          </Card>

          {/* Quick Community Guidelines */}
          <Card className="p-4 bg-[#F5FAFF] border-[#D0E6FF] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB]">
              <Sparkles className="w-4 h-4" />
              <span>Private Club Culture</span>
            </div>
            <p className="text-[11px] text-[#556370] leading-relaxed">
              Encourage teammates, celebrate milestones, and respect member privacy.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
