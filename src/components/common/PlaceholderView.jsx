import { PageHeader } from './PageHeader'
import { Card } from './Card'
import { Sparkles, Construction, Layers } from 'lucide-react'

export function PlaceholderView({
  title,
  subtitle,
  category,
  icon: Icon,
  description,
  features = [],
}) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={title}
        subtitle={subtitle || description}
        category={category}
        icon={Icon}
        badgeText="Foundation Ready"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <Layers className="w-4 h-4" />
            <span>Section Placeholder</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">{title} Section</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {description ||
                `This is the placeholder for the ${title} module. The routing, layout shell, and component structure are set up and ready for feature implementation.`}
            </p>
          </div>

          {features.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Planned Functionality
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col justify-between space-y-4 bg-gradient-to-b from-slate-900/90 to-slate-950 border-slate-800/90">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-400">
              <Construction className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Status</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Frontend layout & navigation connected. Waiting for backend & data layer implementation.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Private Fitness Group</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

