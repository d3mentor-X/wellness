import { Card } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { ProgressBar } from './ProgressBar'
import { Avatar } from './Avatar'
import { Trophy, Users, Calendar, ArrowRight, Flame } from 'lucide-react'

export function ChallengeCard({
  title = '30-Day Consistency',
  description = 'Complete at least 20 minutes of daily activity or 8,000 steps.',
  current = 22,
  target = 30,
  unit = 'days',
  rank = 4,
  participantsCount = 18,
  daysLeft = 8,
  featured = false,
  onView,
  className = '',
}) {
  const percentage = Math.round((current / target) * 100)

  if (featured) {
    return (
      <Card
        variant="hero"
        className={`relative overflow-hidden p-6 sm:p-7 ${className}`}
      >
        {/* Subtle decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/20 text-white backdrop-blur-xs">
                <Flame className="w-4 h-4 fill-white" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-white/90">
                Active Club Challenge
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="dark" size="sm" className="bg-black/25 border-white/20 text-white">
                <Calendar className="w-3 h-3 inline mr-1" />
                {daysLeft} days left
              </Badge>
              {rank && (
                <Badge variant="mint" size="sm" className="font-bold">
                  Rank #{rank}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-white/85 mt-1 max-w-xl">
              {description}
            </p>
          </div>

          <div className="space-y-2 bg-black/15 p-4 rounded-2xl border border-white/15 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Your Progress</span>
              <span>
                {current} / {target} {unit} ({percentage}%)
              </span>
            </div>
            <div className="w-full bg-white/25 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-white h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <Avatar name="Sarah K" size="xs" />
                <Avatar name="Tariq M" size="xs" />
                <Avatar name="Zayd H" size="xs" />
              </div>
              <span className="text-xs font-semibold text-white/90 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {participantsCount} members joined
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="bg-white hover:bg-[#FFF2F4] text-[#FF6F7D] border-0 font-bold shadow-md"
            >
              <span>View Challenge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card hover className={`space-y-4 ${className}`} onClick={onView}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Badge variant="coral" size="sm">
            Challenge
          </Badge>
          <h4 className="text-base font-bold text-[#27313A] leading-tight">
            {title}
          </h4>
          <p className="text-xs text-[#71808C] line-clamp-2">{description}</p>
        </div>
        <div className="w-9 h-9 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[#71808C]">Progress</span>
          <span className="text-[#27313A] font-bold">
            {current}/{target} {unit}
          </span>
        </div>
        <ProgressBar value={current} max={target} variant="coral" size="sm" />
      </div>

      <div className="flex items-center justify-between text-xs text-[#71808C] pt-2 border-t border-[#F5E6E4]">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-[#FF6F7D]" />
          {participantsCount} members
        </span>
        <span className="font-semibold text-[#FF6F7D] flex items-center gap-1">
          {daysLeft}d left
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Card>
  )
}

