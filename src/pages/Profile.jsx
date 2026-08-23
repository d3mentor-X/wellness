import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useGamification } from '../hooks/useGamification'
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
  LogOut,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  User as UserIcon,
  Flame,
  Footprints,
  Dumbbell,
  Shield,
} from 'lucide-react'

export default function Profile({ onNavigate }) {
  const { user, profile, membership, updateProfile, logout } = useAuth()
  const { totalXp, levelInfo, streakInfo, achievements, unlockedCount, stats } = useGamification()

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.full_name || '')
  const [editWhatsapp, setEditWhatsapp] = useState(profile?.whatsapp_number || '')
  const [editGender, setEditGender] = useState(profile?.gender || 'prefer_not_to_say')
  const [editAge, setEditAge] = useState(profile?.age ? String(profile.age) : '')
  const [editHeight, setEditHeight] = useState(profile?.height ? String(profile.height) : '')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  const handleOpenEdit = () => {
    setEditName(profile?.full_name || '')
    setEditWhatsapp(profile?.whatsapp_number || '')
    setEditGender(profile?.gender || 'prefer_not_to_say')
    setEditAge(profile?.age ? String(profile.age) : '')
    setEditHeight(profile?.height ? String(profile.height) : '')
    setSaveStatus(null)
    setIsEditing(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveStatus(null)

    try {
      await updateProfile({
        full_name: editName.trim() || 'Member',
        whatsapp_number: editWhatsapp.trim() || null,
        gender: editGender,
        age: editAge ? parseInt(editAge, 10) : null,
        height: editHeight ? parseFloat(editHeight) : null,
      })
      setSaveStatus({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => {
        setIsEditing(false)
        setSaveStatus(null)
      }, 1000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setSaveStatus({ type: 'error', text: err.message || 'Failed to update profile.' })
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member'
  const userRole = membership?.role || 'member'
  const isInstructor = userRole === 'instructor' || userRole === 'admin'

  const roleLabel =
    userRole === 'admin'
      ? 'Club Admin'
      : userRole === 'instructor'
      ? 'Instructor'
      : `Level ${levelInfo.level}`

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Profile Hero Card */}
      <Card className="p-6 sm:p-7 bg-gradient-to-r from-white via-[#FFF5F6] to-white border-[#F4E2E0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            <Avatar
              name={displayName}
              src={profile?.avatar_url}
              size="xl"
              status="online"
              isInstructor={isInstructor}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#27313A] tracking-tight">
                  {displayName}
                </h1>
                <Badge variant={userRole === 'admin' ? 'coral' : 'blue'} size="sm">
                  {roleLabel}
                </Badge>
                <Badge variant="mint" size="sm">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-[#71808C] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
                <span>•</span>
                <span>Fitness Club</span>
              </p>
              {profile?.whatsapp_number && (
                <p className="text-xs text-[#71808C] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#FF6F7D]" />
                  <span>WhatsApp: {profile.whatsapp_number}</span>
                </p>
              )}
              <div className="flex items-center gap-3 pt-1 text-xs font-bold text-[#FF6F7D]">
                <span>
                  🔥 {streakInfo.current_streak > 0 ? `${streakInfo.current_streak} Day Streak` : '0 Day Streak'}
                </span>
                <span>•</span>
                <span>🏆 {unlockedCount} Badges Earned</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Button
              variant="primary"
              size="sm"
              icon={Edit3}
              onClick={handleOpenEdit}
              className="text-xs font-bold"
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={SettingsIcon}
              onClick={() => onNavigate?.('settings')}
              className="text-xs font-bold"
            >
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={LogOut}
              onClick={logout}
              className="text-xs font-bold text-[#E11D48] hover:bg-[#FFE5E8]"
              title="Sign Out"
            >
              Logout
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Profile Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6 space-y-5 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0]">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#FF6F7D]" />
                <h3 className="text-base font-bold text-[#27313A]">Edit Your Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-xl text-[#71808C] hover:text-[#27313A] hover:bg-[#FFF5F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveStatus && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  saveStatus.type === 'success'
                    ? 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A]'
                    : 'bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48]'
                }`}
              >
                {saveStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{saveStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27313A]">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27313A]">
                  WhatsApp Number <span className="text-[10px] text-[#71808C] font-normal">(Club contact only)</span>
                </label>
                <input
                  type="tel"
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27313A]">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27313A]">Age</label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27313A]">Height (cm)</label>
                  <input
                    type="number"
                    min="50"
                    max="250"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    placeholder="e.g. 178"
                    className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F4E2E0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 1b. Admin & Instructor Management Hub Banner */}
      {(userRole === 'admin' || isInstructor) && (
        <Card
          variant="coralTint"
          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[#FFCCD2]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FF6F7D] text-white flex items-center justify-center shadow-md shadow-[#FF6F7D]/20">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#27313A]">
                  {userRole === 'admin' ? 'Club Administration Hub' : 'Instructor Management Tools'}
                </h3>
                <Badge variant={userRole === 'admin' ? 'coral' : 'blue'} size="sm">
                  {userRole === 'admin' ? '👑 Admin' : '🏋️ Instructor'}
                </Badge>
              </div>
              <p className="text-xs text-[#71808C]">
                {userRole === 'admin'
                  ? 'Manage memberships, moderate members, configure club settings, and library.'
                  : 'Manage exercises, post broadcasts, create challenges, and monitor momentum.'}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate?.('admin')}
            className="text-xs font-bold shrink-0 self-start sm:self-center"
          >
            Open Management Console →
          </Button>
        </Card>
      )}

      {/* 2. Level & XP Progression */}
      <Card className="p-5 sm:p-6 space-y-3 bg-white border-[#F2DCD9]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] font-black text-sm flex items-center justify-center">
              L{levelInfo.level}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#27313A]">
                Level {levelInfo.level} • {levelInfo.title}
              </h3>
              <p className="text-xs text-[#71808C]">
                {totalXp} Total XP earned • {levelInfo.xpNeeded - levelInfo.xpInLevel} XP to Level {levelInfo.level + 1}
              </p>
            </div>
          </div>
          <span className="text-xs sm:text-sm font-black text-[#FF6F7D]">
            {levelInfo.xpInLevel} / {levelInfo.xpNeeded} XP ({levelInfo.progressPercent}%)
          </span>
        </div>
        <ProgressBar
          value={levelInfo.xpInLevel}
          max={levelInfo.xpNeeded}
          variant="coral"
          size="lg"
        />
      </Card>

      {/* 3. Badges & Trophy Showcase */}
      <div className="space-y-4">
        <SectionHeader
          title="Badges & Milestones"
          subtitle={`Earned trophies from your training consistency and step achievements (${unlockedCount} unlocked).`}
          icon={Award}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {achievements.map((badge, idx) => (
            <AchievementBadge key={badge.id || idx} {...badge} />
          ))}
        </div>
      </div>

      {/* 4. Personal Stats & All-Time Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#27313A]">
              Training Activity Summary
            </h3>
            <span className="text-xs font-semibold text-[#71808C]">All Time</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0]">
              <div className="w-7 h-7 rounded-xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center mx-auto mb-1">
                <Dumbbell className="w-3.5 h-3.5" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-[#27313A]">
                {stats.totalWorkouts}
              </span>
              <span className="text-[11px] font-bold text-[#71808C] block uppercase mt-0.5">
                Workouts
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0]">
              <div className="w-7 h-7 rounded-xl bg-[#E3F0FF] text-[#2563EB] flex items-center justify-center mx-auto mb-1">
                <Footprints className="w-3.5 h-3.5" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-[#27313A]">
                {stats.totalSteps.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-[#71808C] block uppercase mt-0.5">
                Total Steps
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0]">
              <div className="w-7 h-7 rounded-xl bg-[#DDF7EA] text-[#1E7D58] flex items-center justify-center mx-auto mb-1">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-[#27313A]">
                {streakInfo.longest_streak}d
              </span>
              <span className="text-[11px] font-bold text-[#71808C] block uppercase mt-0.5">
                Best Streak
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#C6F1DC] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
            <p className="text-xs text-[#1E7D58] leading-relaxed">
              <strong>Strict Privacy:</strong> Your private metrics (age: {profile?.age || '—'}, height: {profile?.height ? `${profile.height} cm` : '—'}) are protected by PostgreSQL Row Level Security and are never exposed to other members.
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
