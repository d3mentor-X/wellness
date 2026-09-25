import {
  Flame,
  TrendingUp,
  Target,
  Users,
  User,
  Utensils,
  Footprints,
  Sparkles,
  Trophy,
  Bot,
  Settings as SettingsIcon,
  Moon,
} from 'lucide-react'

export const PRIMARY_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: Flame,
    badge: 'Today',
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: TrendingUp,
    badge: null,
  },
  {
    id: 'challenges',
    label: 'Challenges',
    icon: Target,
    badge: 'Active',
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    badge: null,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    badge: null,
  },
]

export const SECONDARY_NAV_ITEMS = [
  {
    id: 'food-calories',
    label: 'Nutrition & Macros',
    icon: Utensils,
    parent: 'progress',
    description: 'Track meals, calories, and daily macronutrient targets.',
  },
  {
    id: 'steps',
    label: 'Steps & Walking',
    icon: Footprints,
    parent: 'progress',
    description: 'Daily step goals, distance, and walking consistency.',
  },
  {
    id: 'health',
    label: 'Sleep & Screen Time',
    icon: Moon,
    parent: 'progress',
    description: 'Daily sleep tracking, screen time monitoring, and digital wellness.',
  },
  {
    id: 'spirituality',
    label: 'Mindfulness & Prayer',
    icon: Sparkles,
    parent: 'profile',
    description: 'Daily reflection, gratitude, and spiritual habits.',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    parent: 'community',
    description: 'Weekly club rankings, streaks, and healthy competition.',
  },
  {
    id: 'ai-coach',
    label: 'AI Coach',
    icon: Bot,
    parent: 'dashboard',
    description: 'Personalized workout feedback and smart recommendations.',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    parent: 'profile',
    description: 'Manage preferences, units, and notifications.',
  },
]

export function getPrimaryNavTab(route) {
  if (['dashboard', 'home'].includes(route)) return 'dashboard'
  if (['progress', 'exercise', 'food-calories', 'steps', 'health'].includes(route)) return 'progress'
  if (['challenges', 'goals'].includes(route)) return 'challenges'
  if (['community', 'group-activity', 'leaderboard'].includes(route)) return 'community'
  if (['profile', 'spirituality', 'settings'].includes(route)) return 'profile'
  return 'dashboard'
}
