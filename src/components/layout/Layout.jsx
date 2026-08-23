import { Header } from './Header'
import { BottomNav } from './BottomNav'

export function Layout({ activeTab, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-[#FFF9F8] text-[#27313A] flex flex-col selection:bg-[#FFE5E8] selection:text-[#E04B5A]">
      {/* Top Header Navigation */}
      <Header activeTab={activeTab} onNavigate={onNavigate} />

      {/* Main Content Workspace with generous bottom clearance for floating mobile dock */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-36 sm:pb-40 md:pb-12 animate-fade-in">
        {children}
      </main>

      {/* Mobile Floating Bottom Navigation Dock */}
      <BottomNav activeTab={activeTab} onNavigate={onNavigate} />
    </div>
  )
}
