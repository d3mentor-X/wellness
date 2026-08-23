import { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Avatar } from '../common/Avatar'
import { ProgressBar } from '../common/ProgressBar'
import { useAuth } from '../../context/useAuth'
import {
  Trophy,
  Calendar,
  CheckCircle2,
  X,
  Target,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export function ChallengeDetailModal({
  challenge,
  isOpen,
  onClose,
  onJoin,
  onLeave,
  fetchLeaderboard,
}) {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loadingLb, setLoadingLb] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const userId = user?.id

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && challenge?.id && fetchLeaderboard) {
      setLoadingLb(true)
      fetchLeaderboard(challenge.id)
        .then((data) => setLeaderboard(data || []))
        .catch((err) => console.error('Error fetching challenge leaderboard:', err))
        .finally(() => setLoadingLb(false))
    }
  }, [isOpen, challenge?.id, fetchLeaderboard])

  if (!isOpen || !challenge) return null

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      await onJoin(challenge.id)
      if (fetchLeaderboard) {
        const data = await fetchLeaderboard(challenge.id)
        setLeaderboard(data || [])
      }
    } catch (err) {
      console.error('Error joining challenge:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this challenge?')) return
    setActionLoading(true)
    try {
      await onLeave(challenge.id)
      if (fetchLeaderboard) {
        const data = await fetchLeaderboard(challenge.id)
        setLeaderboard(data || [])
      }
    } catch (err) {
      console.error('Error leaving challenge:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const formattedStart = new Date(challenge.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const formattedEnd = new Date(challenge.end_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <Card className="w-full max-w-2xl p-5 sm:p-7 space-y-6 bg-white border-[#F4E2E0] shadow-2xl my-auto animate-fade-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#F4E2E0] shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={challenge.status === 'active' ? 'coral' : 'blue'} size="sm">
                {challenge.status?.toUpperCase()} CHALLENGE
              </Badge>
              <Badge variant="mint" size="sm">
                <Target className="w-3 h-3 inline mr-1" />
                Goal: {Number(challenge.target_value).toLocaleString()} {challenge.unit}
              </Badge>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#27313A]">
              {challenge.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71808C] hover:text-[#27313A] hover:bg-[#FFF5F6] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Description & Window */}
          <div className="p-4 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] space-y-2">
            <p className="text-xs sm:text-sm text-[#27313A] leading-relaxed">
              {challenge.description || 'Push with fellow club members to reach this milestone.'}
            </p>
            <div className="flex items-center justify-between text-xs text-[#71808C] pt-2 border-t border-[#F4E2E0]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF6F7D]" />
                <span>{formattedStart} – {formattedEnd}</span>
              </span>
              <span className="font-bold text-[#FF6F7D]">
                {challenge.daysLeft > 0 ? `${challenge.daysLeft} days remaining` : 'Challenge Ended'}
              </span>
            </div>
          </div>

          {/* User's Progress Snapshot (if joined) */}
          {challenge.isJoined && (
            <Card
              variant={challenge.isCompleted ? 'mintTint' : 'coralTint'}
              className="p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {challenge.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                  ) : (
                    <Flame className="w-5 h-5 text-[#FF6F7D]" />
                  )}
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#27313A]">
                      {challenge.isCompleted ? 'Challenge Completed! 🎉' : 'Your Challenge Progress'}
                    </h4>
                    <p className="text-[11px] text-[#71808C]">
                      {challenge.isCompleted
                        ? '+100 XP awarded to your profile'
                        : `Rank #${challenge.userRank || '—'} among ${challenge.participantsCount} participants`}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-black text-[#FF6F7D]">
                  {challenge.userProgress.toLocaleString()} / {Number(challenge.target_value).toLocaleString()} {challenge.unit} ({challenge.progressPercent}%)
                </span>
              </div>

              <ProgressBar
                value={challenge.userProgress}
                max={Number(challenge.target_value)}
                variant={challenge.isCompleted ? 'mint' : 'coral'}
                size="md"
              />
            </Card>
          )}

          {/* Live Challenge Leaderboard */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#71808C]">
                  Challenge Leaderboard ({leaderboard.length} Participants)
                </h4>
              </div>
              <Badge variant="mint" size="sm">
                Live Rank
              </Badge>
            </div>

            {loadingLb ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-[#F0E5E3] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#71808C] italic bg-[#FFF9F8] rounded-2xl border border-[#F4E2E0]">
                No members have joined this challenge yet. Be the first to join!
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const isMe = entry.user_id === userId
                  const rankBadge =
                    entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`

                  return (
                    <div
                      key={entry.user_id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        isMe
                          ? 'bg-[#FFE5E8]/70 border-[#FFCCD2] shadow-xs'
                          : 'bg-[#FFF9F8] border-[#F4E2E0]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-xs sm:text-sm text-[#71808C]">
                          {rankBadge}
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
                          <p className="text-[10px] text-[#71808C]">
                            {entry.completed ? 'Completed Goal ✓' : `${entry.progress_percent}% completed`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-black text-[#27313A] block">
                          {Number(entry.current_value).toLocaleString()} <span className="text-[10px] text-[#71808C] font-semibold">{challenge.unit}</span>
                        </span>
                        {entry.completed && (
                          <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-0.5 justify-end">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Done</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F4E2E0] shrink-0">
          {challenge.isJoined ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={actionLoading}
              onClick={handleLeave}
              className="text-xs font-bold text-[#E11D48] hover:bg-[#FFE5E8]"
            >
              Leave Challenge
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={actionLoading || challenge.status === 'completed'}
              onClick={handleJoin}
              icon={ArrowRight}
              className="font-bold text-xs"
            >
              {actionLoading ? 'Joining...' : 'Join Challenge'}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="ml-auto text-xs font-bold"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}
