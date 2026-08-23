import { Flame, Sparkles } from 'lucide-react'
import { PRIMARY_NAV_ITEMS } from '../../constants/navigation'
import { Avatar } from '../common/Avatar'
import { useAuth } from '../../context/useAuth'
import { useGamification } from '../../hooks/useGamification'

export function Header({ activeTab, onNavigate }) {
  const { user, profile, membership } = useAuth()
  const { streakInfo, levelInfo } = useGamification()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member'
  const roleLabel =
    membership?.role === 'admin'
      ? 'Club Admin'
      : membership?.role === 'instructor'
      ? 'Instructor'
      : `Level ${levelInfo.level}`

  const isInstructor = membership?.role === 'instructor' || membership?.role === 'admin'

  return (
    <header className="sticky top-0 z-40 bg-[#FFF9F8]/90 backdrop-blur-md border-b border-[#F4E2E0] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6F7D] to-[#FF949F] flex items-center justify-center text-white shadow-md shadow-[#FF6F7D]/25 transition-transform duration-200 group-hover:scale-105">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-[#27313A] group-hover:text-[#FF6F7D] transition-colors">
              Fitness Club
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#FF6F7D] tracking-wide uppercase">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Private Member</span>
            </div>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white px-2 py-1.5 rounded-2xl border border-[#F2DCD9] shadow-xs">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#FF6F7D] text-white shadow-sm shadow-[#FF6F7D]/30'
                    : 'text-[#71808C] hover:text-[#27313A] hover:bg-[#FFF5F4]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#71808C]'}`} />
                <span>{item.label}</span>
                {item.badge && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#FF6F7D]" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Top Right: Streak Pill & Profile Avatar */}
        <div className="flex items-center gap-3">
          {/* Active Streak */}
          <button
            type="button"
            onClick={() => onNavigate('progress')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-black cursor-pointer transition-all hover:scale-105 shadow-xs ${
              streakInfo.current_streak > 0
                ? 'bg-[#FFE5E8] border-[#FFCCD2] text-[#E04B5A] hover:bg-[#FFD9DE]'
                : 'bg-white border-[#F4E2E0] text-[#71808C] hover:text-[#27313A]'
            }`}
            title={streakInfo.current_streak > 0 ? `${streakInfo.current_streak} Day Active Streak` : 'Start your streak!'}
          >
            <span className="text-sm">🔥</span>
            <span>{streakInfo.current_streak}d</span>
          </button>

          {/* User Info & Avatar */}
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-white hover:shadow-xs border border-transparent hover:border-[#F2DCD9] transition-all cursor-pointer"
            title="View Profile"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#27313A] leading-tight truncate max-w-[120px]">
                {displayName}
              </p>
              <p className="text-[10px] font-bold text-[#1E7D58] bg-[#DDF7EA] px-1.5 py-0.2 rounded-md inline-block">
                {roleLabel}
              </p>
            </div>
            <Avatar
              name={displayName}
              src={profile?.avatar_url}
              size="sm"
              status="online"
              isInstructor={isInstructor}
            />
          </button>
        </div>
      </div>
    </header>
  )
}
