import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Avatar } from '../components/common/Avatar'
import { SectionHeader } from '../components/common/SectionHeader'
import { MemberActionModal } from '../components/admin/MemberActionModal'
import { ExerciseManagerModal } from '../components/admin/ExerciseManagerModal'
import { useAdmin } from '../hooks/useAdmin'
import {
  Users,
  Dumbbell,
  Settings,
  History,
  Search,
  CheckCircle2,
  VolumeX,
  Volume2,
  Plus,
  Edit2,
  Lock,
  ChevronLeft,
  Flame,
  Footprints,
  Activity,
  MessageCircle,
} from 'lucide-react'

export default function Admin({ onNavigate }) {
  const {
    overview,
    members,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    exercises,
    moderationLogs,
    clubSettings,
    loading,
    actionLoading,
    error,
    isAdmin,
    isInstructor,
    currentUserId,
    updateMemberStatus,
    setMemberRole,
    muteMember,
    unmuteMember,
    updateClubSettings,
    saveExercise,
  } = useAdmin()

  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'members' | 'exercises' | 'settings' | 'logs'
  const [exerciseFilter, setExerciseFilter] = useState('active') // 'active' | 'archived' | 'all'
  const [selectedMember, setSelectedMember] = useState(null)
  const [actionModalType, setActionModalType] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false)

  // Settings form state
  const [settingsName, setSettingsName] = useState(clubSettings.name)
  const [settingsDesc, setSettingsDesc] = useState(clubSettings.description)
  const [settingsWhatsapp, setSettingsWhatsapp] = useState(clubSettings.whatsapp_group_link)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Handle member actions from confirmation modal
  const handleMemberActionConfirm = async ({ member, actionType, reason, muteMinutes }) => {
    try {
      if (actionType === 'approve') {
        await updateMemberStatus(member.user_id, 'active')
      } else if (actionType === 'suspend') {
        await updateMemberStatus(member.user_id, 'suspended', reason)
      } else if (actionType === 'restore' || actionType === 'unban') {
        await updateMemberStatus(member.user_id, 'active')
      } else if (actionType === 'ban') {
        await updateMemberStatus(member.user_id, 'banned', reason)
      } else if (actionType === 'assign_instructor') {
        await setMemberRole(member.user_id, 'instructor')
      } else if (actionType === 'remove_instructor') {
        await setMemberRole(member.user_id, 'member')
      } else if (actionType === 'mute') {
        await muteMember(member.user_id, muteMinutes)
      } else if (actionType === 'unmute') {
        await unmuteMember(member.user_id)
      }
      setSelectedMember(null)
      setActionModalType(null)
    } catch (err) {
      console.error('Member action error:', err)
    }
  }

  // Handle Exercise save
  const handleExerciseSave = async (exerciseData) => {
    try {
      await saveExercise(exerciseData)
      setIsExerciseModalOpen(false)
      setSelectedExercise(null)
    } catch (err) {
      console.error('Exercise save error:', err)
    }
  }

  // Handle Settings submit
  const handleSettingsSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateClubSettings({
        name: settingsName || clubSettings.name,
        description: settingsDesc,
        whatsapp_link: settingsWhatsapp,
      })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch (err) {
      console.error('Settings error:', err)
    }
  }

  // Access check
  if (!loading && !isInstructor) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-12 text-center">
        <div className="w-14 h-14 rounded-3xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#27313A]">Admin Privileges Required</h2>
          <p className="text-xs sm:text-sm text-[#71808C]">
            This management console is restricted to verified club instructors and administrators.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate?.('dashboard')}
          className="font-bold text-xs"
        >
          Return to Dashboard
        </Button>
      </div>
    )
  }

  const filteredExercises = exercises.filter((ex) => {
    if (exerciseFilter === 'active') return !ex.is_archived
    if (exerciseFilter === 'archived') return ex.is_archived
    return true
  })

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header */}
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
              {isAdmin ? 'Club Administration Hub' : 'Instructor Management Hub'}
            </h1>
            <Badge variant={isAdmin ? 'coral' : 'mint'} size="sm">
              {isAdmin ? '👑 Admin' : '🏋️ Instructor'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Manage memberships, catalog exercises, moderate members, and configure club settings.
          </p>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#FFF5F6] p-1.5 rounded-2xl border border-[#FFE5E8] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-[#FF6F7D] shadow-xs'
              : 'text-[#71808C] hover:text-[#27313A]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-white text-[#FF6F7D] shadow-xs'
              : 'text-[#71808C] hover:text-[#27313A]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members</span>
          {overview.pending_members > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-[#FF6F7D] text-white text-[10px] font-black">
              {overview.pending_members}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exercises')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'exercises'
              ? 'bg-white text-[#FF6F7D] shadow-xs'
              : 'text-[#71808C] hover:text-[#27313A]'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Exercise Library</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-[#FF6F7D] shadow-xs'
                : 'text-[#71808C] hover:text-[#27313A]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Club Settings</span>
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-white text-[#FF6F7D] shadow-xs'
                : 'text-[#71808C] hover:text-[#27313A]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Log</span>
          </button>
        )}
      </div>

      {error && (
        <Card className="p-4 bg-[#FFF1F2] border-[#FECDD3] text-xs font-semibold text-[#E11D48]">
          {error}
        </Card>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1">
              <span className="text-[11px] font-bold text-[#71808C] uppercase">Active Members</span>
              <p className="text-xl font-black text-[#27313A]">{overview.total_members}</p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-[11px] font-bold text-[#71808C] uppercase">Active Today</span>
              <p className="text-xl font-black text-[#10B981]">{overview.active_today}</p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-[11px] font-bold text-[#71808C] uppercase">Workouts Today</span>
              <p className="text-xl font-black text-[#FF6F7D]">{overview.workouts_today}</p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-[11px] font-bold text-[#71808C] uppercase">Pending Approval</span>
              <p className="text-xl font-black text-[#F59E0B]">{overview.pending_members}</p>
            </Card>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              hover
              onClick={() => onNavigate?.('challenges')}
              className="p-5 space-y-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#27313A]">Club Challenges</h4>
                <p className="text-xs text-[#71808C]">
                  Launch, edit, or track active club competitions.
                </p>
              </div>
            </Card>

            <Card
              hover
              onClick={() => onNavigate?.('community')}
              className="p-5 space-y-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#DDF7EA] text-[#1E7D58] flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#27313A]">Post Broadcast</h4>
                <p className="text-xs text-[#71808C]">
                  Pin an instructor announcement on the community board.
                </p>
              </div>
            </Card>

            <Card
              hover
              onClick={() => {
                setActiveTab('exercises')
                setSelectedExercise(null)
                setIsExerciseModalOpen(true)
              }}
              className="p-5 space-y-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E3F0FF] text-[#2563EB] flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#27313A]">Add Exercise</h4>
                <p className="text-xs text-[#71808C]">
                  Add a new movement to the club's exercise library.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#F4E2E0] overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'pending', label: `Pending (${overview.pending_members})` },
                { id: 'suspended', label: 'Suspended' },
                { id: 'banned', label: 'Banned' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-[#FFE5E8] text-[#FF6F7D]'
                      : 'text-[#71808C] hover:text-[#27313A]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#71808C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member by name..."
                className="w-full pl-9 pr-3 py-1.5 rounded-2xl bg-white border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>
          </div>

          {/* Members List */}
          {members.length === 0 ? (
            <Card className="p-8 text-center space-y-2 bg-white border-[#F4E2E0]">
              <p className="text-xs text-[#71808C]">No members found matching the selected filter.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {members.map((m) => {
                const isMe = m.user_id === currentUserId
                const isTargetAdmin = m.role === 'admin'
                const isMuted = m.muted_until && new Date(m.muted_until) > new Date()

                return (
                  <Card key={m.user_id} className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={m.full_name}
                          src={m.avatar_url}
                          size="md"
                          isInstructor={m.role === 'instructor' || m.role === 'admin'}
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-[#27313A]">
                              {m.full_name} {isMe && <span className="text-[#FF6F7D] font-normal">(You)</span>}
                            </h4>
                            <Badge
                              variant={
                                m.status === 'active'
                                  ? 'mint'
                                  : m.status === 'pending'
                                  ? 'amber'
                                  : 'coral'
                              }
                              size="sm"
                            >
                              {m.status.toUpperCase()}
                            </Badge>
                            {m.role === 'admin' && (
                              <Badge variant="coral" size="sm">
                                👑 Admin
                              </Badge>
                            )}
                            {m.role === 'instructor' && (
                              <Badge variant="blue" size="sm">
                                🏋️ Instructor
                              </Badge>
                            )}
                            {isMuted && (
                              <Badge variant="coral" size="sm">
                                🔇 Muted
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-[#71808C] mt-1 flex-wrap">
                            <span>{m.whatsapp_number || 'No phone'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-[#E04B5A]" />
                              <span>{m.current_streak}d streak</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Footprints className="w-3 h-3 text-[#3B82F6]" />
                              <span>{Number(m.total_xp).toLocaleString()} XP (Lvl {m.level})</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Admin & Instructor Actions */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                          {/* Pending Approval */}
                          {m.status === 'pending' && isAdmin && (
                            <Button
                              variant="mint"
                              size="sm"
                              icon={CheckCircle2}
                              onClick={() => {
                                setSelectedMember(m)
                                setActionModalType('approve')
                              }}
                              className="text-xs font-bold"
                            >
                              Approve
                            </Button>
                          )}

                          {/* Mute / Unmute (Admin + Instructor) */}
                          {isMuted ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Volume2}
                              onClick={() => {
                                setSelectedMember(m)
                                setActionModalType('unmute')
                              }}
                              className="text-xs font-bold text-[#10B981]"
                            >
                              Unmute
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={VolumeX}
                              onClick={() => {
                                setSelectedMember(m)
                                setActionModalType('mute')
                              }}
                              className="text-xs font-bold text-[#71808C]"
                            >
                              Mute
                            </Button>
                          )}

                          {/* Admin-only Role & Status Controls */}
                          {isAdmin && !isTargetAdmin && (
                            <>
                              {/* Instructor Toggle */}
                              {m.role === 'instructor' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMember(m)
                                    setActionModalType('remove_instructor')
                                  }}
                                  className="text-xs font-bold"
                                >
                                  Demote
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMember(m)
                                    setActionModalType('assign_instructor')
                                  }}
                                  className="text-xs font-bold text-[#2563EB]"
                                >
                                  + Instructor
                                </Button>
                              )}

                              {/* Suspend / Restore */}
                              {m.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMember(m)
                                    setActionModalType('suspend')
                                  }}
                                  className="text-xs font-bold text-[#F59E0B]"
                                >
                                  Suspend
                                </Button>
                              )}

                              {m.status === 'suspended' && (
                                <Button
                                  variant="mint"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMember(m)
                                    setActionModalType('restore')
                                  }}
                                  className="text-xs font-bold"
                                >
                                  Restore
                                </Button>
                              )}

                              {/* Ban / Unban */}
                              {m.status !== 'banned' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMember(m)
                                    setActionModalType('ban')
                                  }}
                                  className="text-xs font-bold text-[#E11D48]"
                                >
                                  Ban
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMember(m)
                                    setActionModalType('unban')
                                  }}
                                  className="text-xs font-bold"
                                >
                                  Unban
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXERCISE LIBRARY */}
      {activeTab === 'exercises' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#F4E2E0]">
              {['active', 'archived', 'all'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setExerciseFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    exerciseFilter === f
                      ? 'bg-[#FFE5E8] text-[#FF6F7D]'
                      : 'text-[#71808C] hover:text-[#27313A]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setSelectedExercise(null)
                setIsExerciseModalOpen(true)
              }}
              className="text-xs font-bold"
            >
              Add Exercise
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredExercises.map((ex) => (
              <Card key={ex.id} className="p-4 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant={ex.is_archived ? 'gray' : 'coral'} size="sm">
                      {ex.category} {ex.is_archived && '• Archived'}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExercise(ex)
                        setIsExerciseModalOpen(true)
                      }}
                      className="p-1 rounded-lg text-[#71808C] hover:text-[#FF6F7D] hover:bg-[#FFF5F6] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-[#27313A]">{ex.name}</h4>
                  <p className="text-xs text-[#71808C]">
                    {ex.muscle_group ? `Target: ${ex.muscle_group}` : 'Full body'} • {ex.equipment || 'Bodyweight'}
                  </p>
                  {ex.description && (
                    <p className="text-[11px] text-[#556370] line-clamp-2 pt-1">
                      {ex.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLUB SETTINGS (Admin only) */}
      {activeTab === 'settings' && isAdmin && (
        <Card className="p-6 space-y-5 bg-white border-[#F4E2E0] max-w-xl">
          <SectionHeader
            title="Club Configuration"
            subtitle="Manage club identity, branding, and WhatsApp integration."
            icon={Settings}
          />

          {settingsSaved && (
            <div className="p-3 rounded-2xl bg-[#DDF7EA] border border-[#BDEFD6] text-xs font-bold text-[#1E7D58] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Club settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A]">Club Name</label>
              <input
                type="text"
                required
                value={settingsName || clubSettings.name}
                onChange={(e) => setSettingsName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm font-bold text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A]">Club Description</label>
              <textarea
                rows={3}
                value={settingsDesc !== undefined ? settingsDesc : clubSettings.description}
                onChange={(e) => setSettingsDesc(e.target.value)}
                placeholder="Club mission and member guidelines..."
                className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-[#10B981]" />
                <span>WhatsApp Group / Community Link</span>
              </label>
              <input
                type="url"
                value={settingsWhatsapp !== undefined ? settingsWhatsapp : clubSettings.whatsapp_group_link}
                onChange={(e) => setSettingsWhatsapp(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
              />
              <p className="text-[10px] text-[#71808C]">
                Used for the "Join WhatsApp Community" buttons across the application.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={actionLoading}
              className="font-bold text-xs"
            >
              {actionLoading ? 'Saving...' : 'Save Club Settings'}
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 5: AUDIT LOG (Admin only) */}
      {activeTab === 'logs' && isAdmin && (
        <div className="space-y-3">
          <SectionHeader
            title="Moderation & Administrative Audit Log"
            subtitle="Accountability record of status changes, role assignments, and club actions."
            icon={History}
          />

          {moderationLogs.length === 0 ? (
            <Card className="p-6 text-center text-xs text-[#71808C] italic">
              No moderation events recorded yet.
            </Card>
          ) : (
            <div className="space-y-2">
              {moderationLogs.map((log) => (
                <Card key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="text-[#27313A]">
                      <strong>{log.actor_name}</strong> performed <code>{log.action_type}</code>
                      {log.target_name && (
                        <span>
                          {' '}on <strong>{log.target_name}</strong>
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-[#71808C]">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="gray" size="sm">
                    {log.action_type.replace(/_/g, ' ')}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Member Action Modal */}
      <MemberActionModal
        member={selectedMember}
        actionType={actionModalType}
        isOpen={!!selectedMember && !!actionModalType}
        onClose={() => {
          setSelectedMember(null)
          setActionModalType(null)
        }}
        onConfirm={handleMemberActionConfirm}
        loading={actionLoading}
      />

      {/* Exercise Manager Modal */}
      <ExerciseManagerModal
        exercise={selectedExercise}
        isOpen={isExerciseModalOpen}
        onClose={() => {
          setIsExerciseModalOpen(false)
          setSelectedExercise(null)
        }}
        onSave={handleExerciseSave}
        loading={actionLoading}
      />
    </div>
  )
}
