import { Lock } from 'lucide-react'

export function AchievementBadge({
  icon = '🏆',
  title = 'Achievement',
  description = 'Badge description',
  unlocked = true,
  tier = 'bronze', // bronze, silver, gold, diamond, instructor
  awardedAt,
  className = '',
}) {
  const tierStyles = {
    bronze: 'from-[#FFF1E8] to-[#FFE4D4] border-[#FFD0B8] text-[#C25E2A]',
    silver: 'from-[#F3F4F6] to-[#E5E7EB] border-[#D1D5DB] text-[#4B5563]',
    gold: 'from-[#FEF3C7] to-[#FDE68A] border-[#FCD34D] text-[#B45309]',
    diamond: 'from-[#E0F2FE] to-[#BAE6FD] border-[#7DD3FC] text-[#0369A1]',
    instructor: 'from-[#FFE5E8] to-[#FFCCD2] border-[#FFA8B2] text-[#E04B5A]',
  }

  return (
    <div
      className={`relative group p-4 rounded-3xl border transition-all duration-200 ${
        unlocked
          ? 'bg-white border-[#F4E2E0] shadow-sm hover:shadow-md hover:-translate-y-0.5'
          : 'bg-[#FAF6F5]/70 border-dashed border-[#E8DCDA] opacity-60'
      } ${className}`}
    >
      <div className="flex flex-col items-center text-center space-y-2.5">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl border shadow-inner transition-transform duration-200 group-hover:scale-105 ${
            unlocked
              ? tierStyles[tier] || tierStyles.gold
              : 'from-[#F1E9E8] to-[#E5DDD9] border-[#D9CECB] text-slate-400'
          }`}
        >
          {unlocked ? icon : <Lock className="w-5 h-5 text-slate-400" />}
        </div>

        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-[#27313A] truncate max-w-[130px]">
            {title}
          </h4>
          <p className="text-[11px] text-[#71808C] line-clamp-2 leading-tight">
            {description}
          </p>
        </div>

        {unlocked && awardedAt && (
          <span className="text-[10px] font-semibold text-[#FF6F7D] bg-[#FFE5E8] px-2 py-0.5 rounded-full">
            {awardedAt}
          </span>
        )}
      </div>
    </div>
  )
}

