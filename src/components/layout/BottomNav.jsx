import { PRIMARY_NAV_ITEMS } from '../../constants/navigation'

export function BottomNav({ activeTab, onNavigate }) {
  return (
    <nav
      aria-label="Mobile floating navigation"
      className="md:hidden fixed bottom-3 sm:bottom-4 left-0 right-0 z-50 w-[92%] max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-[#F2DCD9] rounded-[24px] p-1.5 px-2 shadow-xl shadow-[#27313A]/10 flex items-center justify-between transition-all"
    >
      {PRIMARY_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 select-none ${
              isActive
                ? 'text-[#FF6F7D] font-black'
                : 'text-[#71808C] hover:text-[#27313A] hover:bg-[#FFF5F4]/70 font-medium'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#FFE5E8] text-[#FF6F7D] scale-110 shadow-xs'
                  : 'bg-transparent text-[#71808C]'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight truncate max-w-full leading-tight mt-0.5">
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
