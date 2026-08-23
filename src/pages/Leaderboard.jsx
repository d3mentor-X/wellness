import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Avatar } from '../components/common/Avatar'
import { useAuth } from '../context/useAuth'
import { useSocial } from '../hooks/useSocial'
import {
  ChevronLeft,
  Flame,
  Dumbbell,
  Footprints,
  Shield,
  Star,
  Users,
} from 'lucide-react'

export default function Leaderboard({ onNavigate }) {
  const { user } = useAuth()
  const { leaderboard, timeFilter, setTimeFilter, loading, error } = useSocial()

  const userId = user?.id
  const top3 = leaderboard.slice(0, 3)
  const restOfList = leaderboard.slice(3)

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
            <Badge variant="coral" size="sm">
              Real Activity XP
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Rankings based on completed workouts, verified steps, and continuous streaks.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#F4E2E0] shadow-xs self-start sm:self-center">
          {[
            { id: 'all_time', label: 'All Time' },
            { id: 'this_month', label: 'This Month' },
            { id: 'this_week', label: 'This Week' },
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => setTimeFilter(tf.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeFilter === tf.id
                  ? 'bg-[#FFE5E8] text-[#FF6F7D]'
                  : 'text-[#71808C] hover:text-[#27313A]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 text-center space-y-3 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-[#F0E5E3] mx-auto" />
                <div className="h-4 bg-[#F0E5E3] rounded-md w-1/2 mx-auto" />
                <div className="h-6 bg-[#F0E5E3] rounded-md w-1/3 mx-auto" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card className="p-6 text-center space-y-2 bg-[#FFF1F2] border-[#FECDD3]">
          <p className="text-xs sm:text-sm font-bold text-[#E11D48]">{error}</p>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && leaderboard.length === 0 && (
        <Card className="p-8 text-center space-y-3 bg-white border-[#F4E2E0]">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-[#27313A]">
            No Activity Logged Yet
          </h4>
          <p className="text-xs text-[#71808C]">
            Complete a workout or log steps today to take the #1 spot on the podium!
          </p>
        </Card>
      )}

      {/* Top 3 Podium Cards */}
      {!loading && !error && top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map((entry, idx) => {
            const isMe = entry.user_id === userId
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
            const podiumBorder =
              idx === 0
                ? 'border-[#F59E0B] bg-gradient-to-b from-[#FEF3C7]/40 via-white to-white'
                : idx === 1
                ? 'border-[#94A3B8] bg-gradient-to-b from-[#F1F5F9] via-white to-white'
                : 'border-[#D97706] bg-gradient-to-b from-[#FEF3C7]/20 via-white to-white'

            return (
              <Card
                key={entry.user_id}
                className={`p-6 text-center space-y-3 relative overflow-hidden border-2 shadow-xs transition-all hover:scale-101 ${podiumBorder} ${
                  isMe ? 'ring-2 ring-[#FF6F7D]' : ''
                }`}
              >
                <div className="text-3xl mb-1">{medal}</div>

                <div className="relative inline-block mx-auto">
                  <Avatar
                    name={entry.full_name}
                    src={entry.avatar_url}
                    size="lg"
                    status="online"
                    isInstructor={entry.role === 'instructor' || entry.role === 'admin'}
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-[#27313A] truncate max-w-[140px]">
                      {entry.full_name}
                    </h3>
                    {entry.role === 'admin' ? (
                      <Shield className="w-3.5 h-3.5 text-[#FF6F7D]" />
                    ) : entry.role === 'instructor' ? (
                      <Star className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : null}
                  </div>
                  <p className="text-[11px] text-[#71808C]">
                    Level {entry.level || 1} • {isMe ? 'You' : 'Member'}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F4E2E0] space-y-1">
                  <span className="text-lg font-black text-[#FF6F7D] block">
                    {Number(entry.total_xp).toLocaleString()} XP
                  </span>

                  <div className="flex items-center justify-center gap-3 text-[11px] text-[#71808C]">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#E04B5A]" />
                      <span>{entry.current_streak}d</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3 text-[#10B981]" />
                      <span>{entry.total_workouts} wo</span>
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Ranks #4 and onwards */}
      {!loading && !error && restOfList.length > 0 && (
        <Card className="p-4 sm:p-6 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#71808C] px-2 mb-2">
            Club Rankings
          </h3>

          <div className="space-y-2">
            {restOfList.map((entry) => {
              const isMe = entry.user_id === userId

              return (
                <div
                  key={entry.user_id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-[#FFE5E8]/70 border-[#FFCCD2] shadow-xs'
                      : 'bg-[#FFF9F8] border-[#F4E2E0]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-6 text-center font-bold text-xs sm:text-sm text-[#71808C]">
                      #{entry.rank}
                    </span>

                    <Avatar
                      name={entry.full_name}
                      src={entry.avatar_url}
                      size="sm"
                      isInstructor={entry.role === 'instructor' || entry.role === 'admin'}
                    />

                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#27313A]">
                        {entry.full_name} {isMe && <span className="text-[#FF6F7D] font-normal">(You)</span>}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#71808C]">
                        <span>Level {entry.level || 1}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-[#E04B5A]" />
                          <span>{entry.current_streak}d streak</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Footprints className="w-3 h-3 text-[#3B82F6]" />
                          <span>{Number(entry.total_steps).toLocaleString()} steps</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-[#FF6F7D] block">
                      {Number(entry.total_xp).toLocaleString()} XP
                    </span>
                    <span className="text-[10px] text-[#71808C]">
                      {entry.total_workouts} workouts
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
