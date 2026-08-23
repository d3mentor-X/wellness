import { Menu, Dumbbell, ShieldCheck } from 'lucide-react'

export function Navbar({
  activeNavItem,
  onOpenMobileDrawer,
  onNavigate,
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      {/* Left: Mobile menu button + Brand / Current Page */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="lg:hidden p-2 -ml-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold lg:hidden">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white sm:text-base">
                {activeNavItem?.label || 'Fitness'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Private Fitness Group
            </p>
          </div>
        </div>
      </div>

      {/* Right: Group Status Badge & Profile Quick Link */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Private Group</span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 p-1.5 text-xs text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Go to My Profile"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm">
            FG
          </div>
        </button>
      </div>
    </header>
  )
}

