import { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { Layout } from './components/layout/Layout'
import { AuthView } from './components/auth/AuthView'
import { PendingApprovalView } from './components/auth/PendingApprovalView'
import { getPrimaryNavTab } from './constants/navigation'
import { Flame } from 'lucide-react'

import Dashboard from './pages/Dashboard'
import Exercise from './pages/Exercise'
import Goals from './pages/Goals'
import GroupActivity from './pages/GroupActivity'
import Profile from './pages/Profile'
import FoodCalories from './pages/FoodCalories'
import Steps from './pages/Steps'
import Spirituality from './pages/Spirituality'
import Leaderboard from './pages/Leaderboard'
import AICoach from './pages/AICoach'
import Settings from './pages/Settings'
import Admin from './pages/Admin'

const ROUTE_COMPONENTS = {
  dashboard: Dashboard,
  home: Dashboard,
  progress: Exercise,
  exercise: Exercise,
  challenges: Goals,
  goals: Goals,
  community: GroupActivity,
  'group-activity': GroupActivity,
  profile: Profile,
  'food-calories': FoodCalories,
  steps: Steps,
  spirituality: Spirituality,
  leaderboard: Leaderboard,
  'ai-coach': AICoach,
  settings: Settings,
  admin: Admin,
  manage: Admin,
}

function getInitialTab() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return ROUTE_COMPONENTS[hash] ? hash : 'dashboard'
}

function AppContent() {
  const { user, membership, loading } = useAuth()
  const [activeTab, setActiveTab] = useState(getInitialTab)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '')
      if (ROUTE_COMPONENTS[hash]) {
        setActiveTab(hash)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleNavigate = (tabId) => {
    setActiveTab(tabId)
    window.location.hash = tabId
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 1. Initial Session / Auth Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F8] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#FF6F7D] to-[#FF949F] flex items-center justify-center text-white shadow-lg shadow-[#FF6F7D]/30 animate-pulse">
          <Flame className="w-7 h-7 fill-white" />
        </div>
        <p className="text-xs font-bold text-[#71808C] tracking-wide uppercase">
          Loading Fitness Club...
        </p>
      </div>
    )
  }

  // 2. Unauthenticated State -> Show Login/Signup Flow
  if (!user) {
    return <AuthView />
  }

  // 3. User Authenticated but Membership is Pending / Non-Active
  const isMemberActive = membership && membership.status === 'active'
  const isClubAdmin = membership && membership.role === 'admin'

  if (!isMemberActive && !isClubAdmin) {
    return <PendingApprovalView />
  }

  // 4. Authenticated & Active Member -> Full Fitness App
  const ActiveComponent = ROUTE_COMPONENTS[activeTab] || Dashboard
  const primaryNavTab = getPrimaryNavTab(activeTab)

  return (
    <Layout activeTab={primaryNavTab} onNavigate={handleNavigate}>
      <ActiveComponent onNavigate={handleNavigate} />
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
