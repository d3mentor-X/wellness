export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  className = '',
}) {
  return (
    <div className={`flex items-start sm:items-center justify-between gap-3 ${className}`}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-7 h-7 rounded-xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#27313A]">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#71808C] font-normal">{subtitle}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

