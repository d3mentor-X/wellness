import { Badge } from './Badge'

export function PageHeader({
  title,
  subtitle,
  category,
  icon: Icon,
  badgeText = 'Coming Soon',
  badgeVariant = 'emerald',
  action,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {title}
            </h1>
            {badgeText && (
              <Badge variant={badgeVariant}>{badgeText}</Badge>
            )}
            {category && (
              <span className="text-xs text-slate-500 font-medium">
                • {category}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-400 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

