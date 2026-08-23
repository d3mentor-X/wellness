import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { ChallengeCard } from '../components/common/ChallengeCard'
import { SectionHeader } from '../components/common/SectionHeader'
import { Trophy, Flame, Users, Calendar } from 'lucide-react'

export default function Goals() {
  const [activeTab, setActiveTab] = useState('active')

  const activeChallenges = [
    {
      id: '1',
      title: '30-Day Consistency Master',
      description: 'Log at least 30 mins of workout or 8,000 steps daily.',
      current: 22,
      target: 30,
      unit: 'days',
      rank: 4,
      participantsCount: 18,
      daysLeft: 8,
    },
    {
      id: '2',
      title: 'Weekend 50K Steps Surge',
      description: 'Hit 50,000 steps between Friday and Sunday.',
      current: 34200,
      target: 50000,
      unit: 'steps',
      rank: 2,
      participantsCount: 14,
      daysLeft: 2,
    },
    {
      id: '3',
      title: '20 Gym Sessions Month',
      description: 'Log 20 completed strength & cardio sessions.',
      current: 14,
      target: 20,
      unit: 'sessions',
      rank: 6,
      participantsCount: 16,
      daysLeft: 10,
    },
  ]

  const upcomingChallenges = [
    {
      id: '4',
      title: 'Ramadan / Fasting Fitness Sprint',
      description: 'Maintain mobility and daily prayer streaks for 30 consecutive days.',
      startDate: 'Starts in 5 days',
      participantsCount: 12,
      unit: '30 Days',
    },
    {
      id: '5',
      title: 'Century Ride & Cardio Marathon',
      description: 'Accumulate 100km total cycling or running distance.',
      startDate: 'Starts next Monday',
      participantsCount: 9,
      unit: '100 km',
    },
  ]

  const completedTrophies = [
    {
      id: '6',
      title: '100K Step Week Champion',
      date: 'Completed Aug 14',
      rank: '🥇 1st Place',
      badge: '🏆 Champion Trophy',
    },
    {
      id: '7',
      title: '14-Day Morning Workout Habit',
      date: 'Completed Aug 02',
      rank: 'Top Finisher',
      badge: '⭐ Consistency Badge',
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
              Club Challenges & Goals
            </h1>
            <Badge variant="coral" size="sm">
              3 Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C] mt-1">
            Compete, stay consistent, and celebrate milestones with your fitness club.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant={activeTab === 'active' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('active')}
          >
            Active ({activeChallenges.length})
          </Button>
          <Button
            variant={activeTab === 'upcoming' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingChallenges.length})
          </Button>
          <Button
            variant={activeTab === 'completed' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('completed')}
          >
            Trophies ({completedTrophies.length})
          </Button>
        </div>
      </div>

      {/* 2. Featured Challenge Banner */}
      {activeTab === 'active' && (
        <ChallengeCard
          featured
          title="30-Day Consistency Master"
          description="Log at least 30 minutes of workout or 8,000 steps every day this month."
          current={22}
          target={30}
          unit="days"
          rank={4}
          participantsCount={18}
          daysLeft={8}
          onView={() => {}}
        />
      )}

      {/* 3. Challenge List based on Tab */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <SectionHeader
            title="All Active Challenges"
            subtitle="Current club challenges you have joined."
            icon={Flame}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {activeChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} {...challenge} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          <SectionHeader
            title="Upcoming Club Challenges"
            subtitle="Register early to start when the challenge goes live."
            icon={Calendar}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingChallenges.map((item) => (
              <Card key={item.id} className="p-5 sm:p-6 space-y-4">
                <div className="space-y-1">
                  <Badge variant="blue" size="sm">
                    {item.startDate}
                  </Badge>
                  <h3 className="text-base sm:text-lg font-bold text-[#27313A]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#71808C]">{item.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#F4E2E0]">
                  <span className="text-xs font-semibold text-[#71808C] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#FF6F7D]" />
                    {item.participantsCount} members registered
                  </span>
                  <Button variant="secondary" size="sm" className="font-bold text-xs">
                    Join Challenge
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="space-y-4">
          <SectionHeader
            title="Completed Challenge Trophies"
            subtitle="Your past victories and earned podium honors."
            icon={Trophy}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {completedTrophies.map((item) => (
              <Card key={item.id} variant="mintTint" className="p-5 sm:p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant="mint" size="sm">
                      {item.rank}
                    </Badge>
                    <h3 className="text-base font-bold text-[#27313A]">{item.title}</h3>
                    <p className="text-xs text-[#71808C]">{item.date}</p>
                  </div>
                  <div className="text-2xl">🏆</div>
                </div>
                <div className="pt-2 border-t border-[#BDEFD6] text-xs font-bold text-[#1E7D58]">
                  {item.badge}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
