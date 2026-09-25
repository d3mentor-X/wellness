import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Avatar } from '../components/common/Avatar'
import { SectionHeader } from '../components/common/SectionHeader'
import { MemberDirectory } from '../components/community/MemberDirectory'
import { useClubMembers } from '../hooks/useClubMembers'
import { useSocial } from '../hooks/useSocial'
import {
  MessageCircle,
  Trophy,
  Flame,
  ExternalLink,
  Pin,
  Dumbbell,
  Footprints,
  Award,
  Users,
  Target,
  X,
  Sparkles,
} from 'lucide-react'

export default function GroupActivity({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('feed') // 'feed' | 'directory'
  const { members, loading: membersLoading, error: membersError, refetch: refetchMembers } = useClubMembers()
  const {
    activityFeed,
    announcements,
    leaderboard,
    whatsappLink,
    loading: socialLoading,
    isManager,
    toggleReaction,
    createAnnouncement,
  } = useSocial()

  // New Announcement Modal state
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false)
  const [annTitle, setAnnTitle] = useState('')
  const [annMsg, setAnnMsg] = useState('')
  const [annPinned, setAnnPinned] = useState(true)
  const [annSaving, setAnnSaving] = useState(false)

  const handlePostAnnouncement = async (e) => {
    e.preventDefault()
    if (!annTitle.trim() || !annMsg.trim()) return
    setAnnSaving(true)
    try {
      await createAnnouncement({
        title: annTitle,
        message: annMsg,
        is_pinned: annPinned,
      })
      setAnnTitle('')
      setAnnMsg('')
      setIsAnnModalOpen(false)
    } catch (err) {
      console.error('Error creating announcement:', err)
    } finally {
      setAnnSaving(false)
    }
  }

  const pinnedAnnouncement = announcements.find((a) => a.is_pinned) || announcements[0] || null
  const top3Leaderboard = leaderboard.slice(0, 3)

  const getActivityIcon = (type) => {
    switch (type) {
      case 'workout_completed':
        return Dumbbell
      case 'step_goal_reached':
        return Footprints
      case 'achievement_unlocked':
        return Award
      case 'challenge_completed':
        return Target
      case 'streak_milestone':
        return Flame
      default:
        return Dumbbell
    }
  }

  const formatActivityTime = (dateStr) => {
    if (!dateStr) return 'Just now'
    try {
      const d = new Date(dateStr)
      const diffMs = Date.now() - d.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

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
              {members.length > 0 ? `${members.length} Active Members` : 'Private Club'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C] mt-1">
            Live fitness feed, coach announcements, member high-fives, and directory.
          </p>
        </div>

        {/* WhatsApp Secondary Action Link */}
        <a
          href={whatsappLink || 'https://chat.whatsapp.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#DDF7EA] hover:bg-[#C8F0DC] text-[#1E7D58] font-bold text-xs sm:text-sm shadow-xs transition-all hover:-translate-y-0.5"
        >
          <MessageCircle className="w-4 h-4 fill-[#1E7D58]" />
          <span>Open WhatsApp Community</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>

      {/* 2. Sub-Tab Switcher: Club Feed vs Member Directory */}
      <div className="flex items-center gap-2 bg-[#FFF5F6] p-1.5 rounded-2xl border border-[#FFE5E8] self-start w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('feed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'feed'
              ? 'bg-white text-[#FF6F7D] shadow-xs'
              : 'text-[#71808C] hover:text-[#27313A]'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Live Activity Feed</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'directory'
              ? 'bg-white text-[#FF6F7D] shadow-xs'
              : 'text-[#71808C] hover:text-[#27313A]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Member Directory</span>
          {members.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-[#FFE5E8] text-[#FF6F7D] text-[10px] font-black">
              {members.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Render Member Directory when active */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <SectionHeader
            title="Club Member Directory"
            subtitle="Verified active members of your private Wellness community."
            icon={Users}
          />
          <MemberDirectory
            members={members}
            loading={membersLoading}
            error={membersError}
            onRefresh={refetchMembers}
          />
        </div>
      )}

      {/* 4. Render Club Feed when active */}
      {activeSubTab === 'feed' && (
        <div className="space-y-6">
          {/* WhatsApp Official Chat Highlight Notice */}
          <Card className="p-5 bg-gradient-to-r from-[#F0FDF4] via-white to-[#F0FDF4] border-[#C6F1DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#25D366] text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
                <MessageCircle className="w-6 h-6 fill-white" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#27313A]">
                    Official Wellness WhatsApp Group
                  </h3>
                  <Badge variant="mint" size="sm">
                    Casual Banter
                  </Badge>
                </div>
                <p className="text-xs text-[#71808C]">
                  Casual banter, meal pictures, and live coordination happen in our group chat.
                </p>
              </div>
            </div>

            <Button
              variant="mint"
              size="sm"
              onClick={() => window.open(whatsappLink || 'https://chat.whatsapp.com', '_blank')}
              className="font-bold text-xs shrink-0"
            >
              Join Group Chat
            </Button>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Instructor Board & Activity Stream */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pinned Instructor Announcement */}
              {pinnedAnnouncement ? (
                <Card variant="coralTint" className="p-5 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={pinnedAnnouncement.profiles?.full_name || 'Coach Marcus'}
                        src={pinnedAnnouncement.profiles?.avatar_url}
                        size="sm"
                        isInstructor
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#27313A]">
                          {pinnedAnnouncement.profiles?.full_name || 'Head Coach'} • Instructor Broadcast
                        </h4>
                        <p className="text-[10px] text-[#71808C]">
                          {formatActivityTime(pinnedAnnouncement.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="coral" size="sm">
                        <Pin className="w-3 h-3 inline mr-1" />
                        Pinned
                      </Badge>
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => setIsAnnModalOpen(true)}
                          className="text-[11px] font-bold text-[#FF6F7D] hover:underline"
                        >
                          + Post New
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-[#27313A]">
                      {pinnedAnnouncement.title}
                    </h5>
                    <p className="text-xs sm:text-sm text-[#27313A] leading-relaxed">
                      "{pinnedAnnouncement.message}"
                    </p>
                  </div>
                </Card>
              ) : isManager ? (
                <Card className="p-4 bg-[#FFF5F6] border-[#FFCCD2] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#27313A] font-semibold">
                    <Pin className="w-4 h-4 text-[#FF6F7D]" />
                    <span>No pinned coach announcements yet.</span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAnnModalOpen(true)}
                    className="text-xs font-bold"
                  >
                    + Post Announcement
                  </Button>
                </Card>
              ) : null}

              {/* Live Activity Feed */}
              <div className="space-y-4">
                <SectionHeader
                  title="Live Club Activity Feed"
                  subtitle="Real workout logs, 10K step milestones, and achievements."
                  icon={Flame}
                />

                {socialLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-4 space-y-3 animate-pulse">
                        <div className="h-4 bg-[#F0E5E3] rounded-md w-1/3" />
                        <div className="h-3 bg-[#F0E5E3] rounded-md w-2/3" />
                      </Card>
                    ))}
                  </div>
                )}

                {!socialLoading && activityFeed.length === 0 && (
                  <Card className="p-8 text-center space-y-3 bg-white border-[#F4E2E0]">
                    <div className="w-11 h-11 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center mx-auto">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[#27313A]">No Activity Posted Yet</h4>
                      <p className="text-xs text-[#71808C]">
                        Your first workout or 10K step milestone will appear live here for the club!
                      </p>
                    </div>
                  </Card>
                )}

                {!socialLoading && activityFeed.length > 0 && (
                  <div className="space-y-3.5">
                    {activityFeed.map((item) => {
                      const Icon = getActivityIcon(item.activity_type)

                      return (
                        <Card key={item.id} className="p-4 sm:p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={item.full_name}
                                src={item.avatar_url}
                                size="sm"
                              />
                              <div>
                                <p className="text-xs sm:text-sm text-[#27313A]">
                                  <strong>{item.full_name}</strong> {item.message}
                                </p>
                                <p className="text-[11px] text-[#71808C]">
                                  {formatActivityTime(item.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className="w-8 h-8 rounded-xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Interactive Reaction Buttons */}
                          <div className="flex items-center gap-1.5 pt-2 border-t border-[#F4E2E0] flex-wrap">
                            {[
                              { type: 'heart', emoji: '❤️', label: 'Love' },
                              { type: 'fire', emoji: '🔥', label: 'Fire' },
                              { type: 'muscle', emoji: '💪', label: 'Strong' },
                              { type: 'clap', emoji: '👏', label: 'Clap' },
                            ].map((r) => {
                              const count = item.reactionCounts[r.type] || 0
                              const isReacted = item.userReactions.has(r.type)

                              return (
                                <button
                                  key={r.type}
                                  type="button"
                                  onClick={() => toggleReaction(item.id, r.type)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                    isReacted
                                      ? 'bg-[#FFE5E8] border-[#FFCCD2] text-[#E04B5A] scale-102'
                                      : 'bg-[#FFF9F8] border-[#F4E2E0] text-[#71808C] hover:bg-[#FFE5E8]/40'
                                  }`}
                                >
                                  <span>{r.emoji}</span>
                                  {count > 0 && <span className="text-[11px]">{count}</span>}
                                </button>
                              )
                            })}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Leaderboard Podium Snippet */}
            <div className="space-y-6">
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#F59E0B]" />
                    <h3 className="text-base font-bold text-[#27313A]">
                      Club Podium
                    </h3>
                  </div>
                  <Badge variant="amber" size="sm">
                    All-Time
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {top3Leaderboard.length === 0 ? (
                    <p className="text-xs text-[#71808C] italic text-center py-2">
                      Rankings updating...
                    </p>
                  ) : (
                    top3Leaderboard.map((m, i) => (
                      <div
                        key={m.user_id || i}
                        className="p-3 rounded-2xl border flex items-center justify-between bg-[#F9F6F5] border-[#F0E4E2]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                          </span>
                          <Avatar name={m.full_name} src={m.avatar_url} size="xs" />
                          <div>
                            <p className="text-xs font-bold text-[#27313A] truncate max-w-[100px]">
                              {m.full_name}
                            </p>
                            <p className="text-[10px] text-[#71808C]">🔥 {m.current_streak}d streak</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#FF6F7D]">
                          {Number(m.total_xp).toLocaleString()} XP
                        </span>
                      </div>
                    ))
                  )}
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
                  High-five your teammates, push together in challenges, and protect member privacy.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Create Announcement Modal (Admin/Instructor only) */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0]">
              <div className="flex items-center gap-2">
                <Pin className="w-5 h-5 text-[#FF6F7D]" />
                <h3 className="text-base font-bold text-[#27313A]">Post Club Announcement</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(false)}
                className="p-1 rounded-xl text-[#71808C] hover:text-[#27313A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27313A]">Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Weekend Sprint & Rest Advice"
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] font-bold focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27313A]">Broadcast Message</label>
                <textarea
                  rows={3}
                  required
                  value={annMsg}
                  onChange={(e) => setAnnMsg(e.target.value)}
                  placeholder="Write your note to the club members..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="annPin"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                  className="rounded text-[#FF6F7D]"
                />
                <label htmlFor="annPin" className="text-xs font-semibold text-[#27313A] cursor-pointer">
                  Pin to top of Community board
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F4E2E0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAnnModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={annSaving}
                >
                  {annSaving ? 'Posting...' : 'Broadcast to Club'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
