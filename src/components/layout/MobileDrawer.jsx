import { useEffect } from 'react'
import { X, Flame, ShieldCheck } from 'lucide-react'
import { NAV_ITEMS, NAVIGATION_CATEGORIES } from '../../constants/navigation'

export function MobileDrawer({ isOpen, onClose, activeTab, onNavigate }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const categories = [
    NAVIGATION_CATEGORIES.DAILY,
    NAVIGATION_CATEGORIES.COMMUNITY,
    NAVIGATION_CATEGORIES.ACCOUNT,
  ]

  const handleSelect = (id) => {
    onNavigate(id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950 border-r border-slate-800 shadow-2xl p-5 z-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-md">
              <Flame className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Wellness</h2>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>All Sections</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categorized List */}
        <div className="flex-1 space-y-6">
          {categories.map((category) => {
            const items = NAV_ITEMS.filter((item) => item.category === category)
            if (!items.length) return null

            return (
              <div key={category} className="space-y-1.5">
                <h3 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-emerald-400' : 'text-slate-500'
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
        </div>

        {/* Footer Profile */}
        <div className="pt-4 mt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
              FG
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate">Fitness Member</p>
              <p className="text-[10px] text-slate-500 truncate">member@fitness.group</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

