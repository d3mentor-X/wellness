import { Card } from './Card'

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  accentColor = 'coral',
  badge,
  progress,
  onClick,
  className = '',
}) {
  const iconBgStyles = {
    coral: 'bg-[#FFE5E8] text-[#FF6F7D]',
    mint: 'bg-[#DDF7EA] text-[#1E7D58]',
    blue: 'bg-[#E3F0FF] text-[#2563EB]',
    amber: 'bg-[#FEF3C7] text-[#D97706]',
  }

  return (
    <Card
      variant={variant}
      hover={Boolean(onClick)}
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#71808C] uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
              {value}
            </span>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs font-medium text-[#71808C] pt-0.5">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              iconBgStyles[accentColor] || iconBgStyles.coral
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-4 pt-3 border-t border-[#F5E6E4]">
          {progress}
        </div>
      )}
    </Card>
  )
}

