import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { ChallengeCard } from '../components/common/ChallengeCard'
import { ChallengeDetailModal } from '../components/challenges/ChallengeDetailModal'
import { CreateChallengeModal } from '../components/challenges/CreateChallengeModal'
import { useChallenges } from '../hooks/useChallenges'
import {
  Trophy,
  Flame,
  Users,
  Calendar,
  Plus,
  Target,
  CheckCircle2,
} from 'lucide-react'

export default function Goals() {
  const {
    activeChallenges,
    upcomingChallenges,
    completedChallenges,
    loading,
    error,
    isManager,
    joinChallenge,
    leaveChallenge,
    createChallenge,
    fetchChallengeLeaderboard,
  } = useChallenges()

  const [activeTab, setActiveTab] = useState('active') // 'active' | 'upcoming' | 'completed'
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
              Club Challenges
            </h1>
            <Badge variant="coral" size="sm">
              {activeChallenges.length} Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C] mt-1">
            Compete together, build healthy habits, and earn trophies with fellow club members.
          </p>
        </div>

        {/* Manager Actions (Admin/Instructor only) */}
        {isManager && (
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
            className="self-start sm:self-center font-bold text-xs"
          >
            Create Challenge
          </Button>
        )}
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2 bg-[#FFF5F6] p-1.5 rounded-2xl border border-[#FFE5E8] self-start w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-white text-[#FF6F7D] shadow-xs'
              : 'text-[#71808C] hover:text-[#27313A]'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Active ({activeChallenges.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-white text-[#FF6F7D] shadow-xs'
              : 'text-[#71808C] hover:text-[#27313A]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Upcoming ({upcomingChallenges.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-white text-[#FF6F7D] shadow-xs'
              : 'text-[#71808C] hover:text-[#27313A]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Completed ({completedChallenges.length})</span>
        </button>
      </div>

      {/* 3. Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-[#F0E5E3] rounded-md w-2/3" />
              <div className="h-4 bg-[#F0E5E3] rounded-md w-full" />
              <div className="h-10 bg-[#F0E5E3] rounded-xl" />
            </Card>
          ))}
        </div>
      )}

      {/* 4. Error state */}
      {!loading && error && (
        <Card className="p-6 text-center space-y-2 bg-[#FFF1F2] border-[#FECDD3]">
          <p className="text-xs sm:text-sm font-bold text-[#E11D48]">{error}</p>
        </Card>
      )}

      {/* 5. Active Challenges Tab */}
      {!loading && !error && activeTab === 'active' && (
        <div className="space-y-4">
          {activeChallenges.length === 0 ? (
            <Card className="p-8 text-center space-y-3 bg-white border-[#F4E2E0]">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-[#27313A]">
                  No Active Challenges
                </h4>
                <p className="text-xs text-[#71808C]">
                  {isManager
                    ? 'Launch the first challenge for your club members!'
                    : 'Your club instructor or admin will launch the next challenge soon.'}
                </p>
              </div>
              {isManager && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-xs font-bold"
                >
                  Create Challenge
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallenges.map((ch, idx) => (
                <ChallengeCard
                  key={ch.id}
                  featured={idx === 0}
                  title={ch.title}
                  description={ch.description}
                  current={ch.userProgress}
                  target={Number(ch.target_value)}
                  unit={ch.unit}
                  rank={ch.userRank}
                  participantsCount={ch.participantsCount}
                  daysLeft={ch.daysLeft}
                  onView={() => setSelectedChallenge(ch)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Upcoming Challenges Tab */}
      {!loading && !error && activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingChallenges.length === 0 ? (
            <Card className="p-8 text-center space-y-3 bg-white border-[#F4E2E0]">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[#27313A]">
                No Upcoming Challenges Scheduled
              </h4>
              <p className="text-xs text-[#71808C]">
                Check back soon or explore our active challenges!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingChallenges.map((ch) => (
                <Card key={ch.id} className="p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="blue" size="sm">
                        Upcoming
                      </Badge>
                      <span className="text-xs font-semibold text-[#71808C]">
                        Starts: {new Date(ch.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#27313A]">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-[#71808C]">
                      {ch.description || 'Target goal: ' + ch.target_value + ' ' + ch.unit}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F4E2E0] flex items-center justify-between">
                    <span className="text-xs text-[#71808C] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{ch.participantsCount} Joined</span>
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChallenge(ch)}
                      className="text-xs font-bold"
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Completed Challenges Tab */}
      {!loading && !error && activeTab === 'completed' && (
        <div className="space-y-4">
          {completedChallenges.length === 0 ? (
            <Card className="p-8 text-center space-y-3 bg-white border-[#F4E2E0]">
              <div className="w-12 h-12 rounded-2xl bg-[#DDF7EA] text-[#1E7D58] flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[#27313A]">
                No Completed Challenges Yet
              </h4>
              <p className="text-xs text-[#71808C]">
                Join an active challenge today to earn your first finisher badge!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedChallenges.map((ch) => (
                <Card key={ch.id} className="p-5 space-y-3 bg-white border-[#F4E2E0]">
                  <div className="flex items-center justify-between">
                    <Badge variant="mint" size="sm">
                      Completed
                    </Badge>
                    <span className="text-xs text-[#71808C]">
                      Ended {new Date(ch.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#27313A]">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-[#71808C] mt-0.5">
                      Goal: {Number(ch.target_value).toLocaleString()} {ch.unit} • {ch.participantsCount} participants
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F4E2E0] flex items-center justify-between">
                    {ch.isCompleted ? (
                      <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>You Completed this Challenge! (+100 XP)</span>
                      </span>
                    ) : (
                      <span className="text-xs text-[#71808C]">
                        {ch.isJoined ? `${ch.progressPercent}% achieved` : 'Did not participate'}
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedChallenge(ch)}
                      className="text-xs font-bold text-[#FF6F7D]"
                    >
                      Leaderboard →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Challenge Detail Modal with live leaderboard */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={!!selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
        onJoin={joinChallenge}
        onLeave={leaveChallenge}
        fetchLeaderboard={fetchChallengeLeaderboard}
      />

      {/* Create Challenge Modal (Admin/Instructor only) */}
      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createChallenge}
      />
    </div>
  )
}
