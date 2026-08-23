import { Grid } from 'lucide-react'
import { NAV_ITEMS } from '../../constants/navigation'

export function BottomNav({ activeTab, onNavigate, onOpenDrawer }) {
  const primaryItems = NAV_ITEMS.filter((item) => item.isPrimaryMobile)
  const isMoreActive = !primaryItems.some((item) => item.id === activeTab)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
      {primaryItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[60px] cursor-pointer ${
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-500/10' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight truncate max-w-[64px]">
              {item.label}
            </span>
          </button>
        )
      })}

      {/* More / All Sections Trigger */}
      <button
        type="button"
        onClick={onOpenDrawer}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[60px] cursor-pointer ${
          isMoreActive
            ? 'text-emerald-400 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            isMoreActive ? 'bg-emerald-500/10' : ''
          }`}
        >
          <Grid className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight">More</span>
      </button>
    </nav>
  )
}

