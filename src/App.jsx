import { useState, useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Exercise from './pages/Exercise'
import FoodCalories from './pages/FoodCalories'
import Steps from './pages/Steps'
import Spirituality from './pages/Spirituality'
import Goals from './pages/Goals'
import GroupActivity from './pages/GroupActivity'
import Leaderboard from './pages/Leaderboard'
import AICoach from './pages/AICoach'
import Settings from './pages/Settings'

const PAGES = {
  dashboard: Dashboard,
  exercise: Exercise,
  'food-calories': FoodCalories,
  steps: Steps,
  spirituality: Spirituality,
  goals: Goals,
  'group-activity': GroupActivity,
  leaderboard: Leaderboard,
  'ai-coach': AICoach,
  profile: Profile,
  settings: Settings,
}

function getInitialTab() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return PAGES[hash] ? hash : 'dashboard'
}

export default function App() {
  const [activeTab, setActiveTab] = useState(getInitialTab)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '')
      if (PAGES[hash]) {
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

  const ActiveComponent = PAGES[activeTab] || Dashboard

  return (
    <Layout activeTab={activeTab} onNavigate={handleNavigate}>
      <ActiveComponent />
    </Layout>
  )
}
