import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Avatar } from '../components/common/Avatar'
import { SectionHeader } from '../components/common/SectionHeader'
import { Trophy, ChevronLeft } from 'lucide-react'

export default function Leaderboard({ onNavigate }) {
  const [timeframe, setTimeframe] = useState('weekly')

  const rankings = [
    {
      rank: 1,
      medal: '🥇',
      name: 'Sarah Jenkins',
      points: '2,480 pts',
      streak: 24,
      workouts: 6,
      steps: '72,400',
      badge: 'Streak Master',
    },
    {
      rank: 2,
      medal: '🥈',
      name: 'Zayd Al-Hassan',
      points: '2,310 pts',
      streak: 18,
      workouts: 5,
      steps: '68,900',
      badge: 'Step King',
    },
    {
      rank: 3,
      medal: '🥉',
      name: 'Alex Rivera (You)',
      points: '2,150 pts',
      streak: 12,
      workouts: 5,
      steps: '64,100',
      badge: 'Consistency Beast',
      isCurrentUser: true,
    },
    {
      rank: 4,
      medal: '#4',
      name: 'Tariq Mansoor',
      points: '1,980 pts',
      streak: 9,
      workouts: 4,
      steps: '59,200',
      badge: null,
    },
    {
      rank: 5,
      medal: '#5',
      name: 'Omar Farooq',
      points: '1,840 pts',
      streak: 7,
      workouts: 4,
      steps: '52,800',
      badge: null,
    },
    {
      rank: 6,
      medal: '#6',
      name: 'Amina Rashid',
      points: '1,720 pts',
      streak: 6,
      workouts: 3,
      steps: '48,600',
      badge: null,
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate?.('community')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6F7D] hover:underline mb-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Community</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
              Club Leaderboard
            </h1>
            <Badge variant="amber" size="sm">
              Week 34
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Friendly competition based on workouts logged, steps, and active consistency streaks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant={timeframe === 'weekly' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('weekly')}
          >
            This Week
          </Button>
          <Button
            variant={timeframe === 'monthly' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('monthly')}
          >
            Monthly
          </Button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 items-end">
        {/* 2nd Place */}
        <Card
          variant="default"
          className="p-5 text-center space-y-3 order-2 sm:order-1 border-[#E5E7EB]"
        >
          <span className="text-3xl">🥈</span>
          <Avatar name={rankings[1].name} size="lg" className="mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-[#27313A]">{rankings[1].name}</h3>
            <p className="text-xs font-black text-[#FF6F7D]">{rankings[1].points}</p>
          </div>
          <Badge variant="blue" size="sm">
            🔥 {rankings[1].streak}d Streak
          </Badge>
        </Card>

        {/* 1st Place (Elevated) */}
        <Card
          variant="coralTint"
          className="p-6 text-center space-y-3 order-1 sm:order-2 border-[#FFCCD2] shadow-md -translate-y-2"
        >
          <span className="text-4xl">🥇</span>
          <Avatar name={rankings[0].name} size="xl" className="mx-auto" />
          <div>
            <h3 className="text-base font-bold text-[#27313A]">{rankings[0].name}</h3>
            <p className="text-sm font-black text-[#E04B5A]">{rankings[0].points}</p>
          </div>
          <Badge variant="coral" size="md">
            🔥 {rankings[0].streak}d Streak • 1st Place
          </Badge>
        </Card>

        {/* 3rd Place (You) */}
        <Card
          variant="mintTint"
          className="p-5 text-center space-y-3 order-3 border-[#BDEFD6]"
        >
          <span className="text-3xl">🥉</span>
          <Avatar name={rankings[2].name} size="lg" className="mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-[#27313A]">{rankings[2].name}</h3>
            <p className="text-xs font-black text-[#1E7D58]">{rankings[2].points}</p>
          </div>
          <Badge variant="mint" size="sm">
            🔥 {rankings[2].streak}d Streak • Your Rank
          </Badge>
        </Card>
      </div>

      {/* Full Leaderboard Table */}
      <Card className="p-5 sm:p-6 space-y-4">
        <SectionHeader
          title="Club Standings"
          subtitle="Updated in real time upon workout or step log completion."
          icon={Trophy}
        />

        <div className="space-y-2">
          {rankings.map((r) => (
            <div
              key={r.rank}
              className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                r.isCurrentUser
                  ? 'bg-[#FFE5E8]/60 border-[#FFCCD2] shadow-xs'
                  : 'bg-white border-[#F4E2E0] hover:bg-[#FFF9F8]'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-base sm:text-lg font-black w-6 text-center text-[#27313A]">
                  {r.medal}
                </span>
                <Avatar name={r.name} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#27313A]">
                      {r.name}
                    </span>
                    {r.isCurrentUser && (
                      <Badge variant="coral" size="sm">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#71808C] mt-0.5">
                    <span>{r.workouts} Workouts</span>
                    <span>•</span>
                    <span>{r.steps} Steps</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs sm:text-sm font-black text-[#FF6F7D] block">
                  {r.points}
                </span>
                <span className="text-[10px] font-bold text-[#71808C]">
                  🔥 {r.streak}d streak
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
