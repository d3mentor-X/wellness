import { Flame, ShieldCheck } from 'lucide-react'
import { NAV_ITEMS, NAVIGATION_CATEGORIES } from '../../constants/navigation'

export function Sidebar({ activeTab, onNavigate }) {
  const categories = [
    NAVIGATION_CATEGORIES.DAILY,
    NAVIGATION_CATEGORIES.COMMUNITY,
    NAVIGATION_CATEGORIES.ACCOUNT,
  ]

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 xl:w-72 h-screen sticky top-0 shrink-0 bg-slate-950/90 border-r border-slate-800/80 p-4 space-y-6 overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-950/50">
          <Flame className="w-5 h-5 fill-slate-950" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            Wellness
          </h2>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3 h-3" />
            <span>Private Members</span>
          </div>
        </div>
      </div>

      {/* Navigation Groupings */}
      <nav className="flex-1 space-y-5 px-1">
        {categories.map((category) => {
          const items = NAV_ITEMS.filter((item) => item.category === category)
          if (!items.length) return null

          return (
            <div key={category} className="space-y-1.5">
              <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {category}
              </h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer group ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                          isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom Profile Preview */}
      <div className="pt-3 border-t border-slate-800/80 px-2">
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900/80 transition-colors text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
            FG
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-semibold text-white truncate">Fitness Member</p>
            <p className="text-[11px] text-slate-500 truncate">member@fitness.group</p>
          </div>
        </button>
      </div>
    </aside>
  )
}

