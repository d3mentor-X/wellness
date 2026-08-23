import { useState, useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import { getPrimaryNavTab } from './constants/navigation'
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
}

function getInitialTab() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return ROUTE_COMPONENTS[hash] ? hash : 'dashboard'
}

export default function App() {
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

  const ActiveComponent = ROUTE_COMPONENTS[activeTab] || Dashboard
  const primaryNavTab = getPrimaryNavTab(activeTab)

  return (
    <Layout activeTab={primaryNavTab} onNavigate={handleNavigate}>
      <ActiveComponent onNavigate={handleNavigate} />
    </Layout>
  )
}
