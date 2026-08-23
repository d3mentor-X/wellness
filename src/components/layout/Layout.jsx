import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'
import { MobileDrawer } from './MobileDrawer'
import { NAV_ITEMS } from '../../constants/navigation'

export function Layout({ activeTab, onNavigate, children }) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const activeNavItem = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Navigation Sidebar */}
      <Sidebar activeTab={activeTab} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          activeNavItem={activeNavItem}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onNavigate={onNavigate}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Full Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onNavigate={onNavigate}
      />
    </div>
  )
}

