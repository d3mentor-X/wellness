export const LEVEL_TIERS = [
  { level: 1, xp: 0, title: 'Fitness Novice' },
  { level: 2, xp: 100, title: 'Active Starter' },
  { level: 3, xp: 250, title: 'Habit Builder' },
  { level: 4, xp: 500, title: 'Consistent Mover' },
  { level: 5, xp: 850, title: 'Fitness Explorer' },
  { level: 6, xp: 1300, title: 'Club Regular' },
  { level: 7, xp: 1850, title: 'Endurance Pacer' },
  { level: 8, xp: 2500, title: 'Fitness Champion' },
  { level: 9, xp: 3250, title: 'Club Titan' },
  { level: 10, xp: 4100, title: 'Legendary Athlete' },
]

export function calculateLevel(totalXp = 0) {
  const xp = Math.max(0, parseInt(totalXp, 10) || 0)

  // 1. Within predefined levels (1 to 10)
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    const tier = LEVEL_TIERS[i]
    if (xp >= tier.xp) {
      const currentLevel = tier.level
      const currentTitle = tier.title
      const currentFloorXp = tier.xp

      // If at or beyond level 10
      if (currentLevel === 10) {
        const nextCeilingXp = 5100
        const xpInLevel = xp - 4100
        const xpNeeded = 1000
        const progressPercent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100))

        return {
          level: currentLevel,
          title: currentTitle,
          totalXp: xp,
          currentFloorXp,
          nextCeilingXp,
          xpInLevel,
          xpNeeded,
          progressPercent,
        }
      }

      const nextTier = LEVEL_TIERS[i + 1]
      const nextCeilingXp = nextTier.xp
      const xpNeeded = nextCeilingXp - currentFloorXp
      const xpInLevel = xp - currentFloorXp
      const progressPercent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100))

      return {
        level: currentLevel,
        title: currentTitle,
        totalXp: xp,
        currentFloorXp,
        nextCeilingXp,
        xpInLevel,
        xpNeeded,
        progressPercent,
      }
    }
  }

  return {
    level: 1,
    title: 'Fitness Novice',
    totalXp: 0,
    currentFloorXp: 0,
    nextCeilingXp: 100,
    xpInLevel: 0,
    xpNeeded: 100,
    progressPercent: 0,
  }
}

export const FALLBACK_ACHIEVEMENTS = [
  {
    id: 'ach-1',
    name: 'First 3 Days',
    description: 'Complete a 3-day active streak',
    icon: '🔥',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 3,
    tier: 'bronze',
  },
  {
    id: 'ach-2',
    name: '7 Day Streak',
    description: 'Complete a 7-day active streak',
    icon: '🔥',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 7,
    tier: 'bronze',
  },
  {
    id: 'ach-3',
    name: '14 Day Streak',
    description: 'Complete a 14-day active streak',
    icon: '🔥',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 14,
    tier: 'silver',
  },
  {
    id: 'ach-4',
    name: '30 Day Streak',
    description: 'Complete a 30-day active streak',
    icon: '🔥',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 30,
    tier: 'gold',
  },
  {
    id: 'ach-5',
    name: '100 Day Streak',
    description: 'Complete a 100-day active streak',
    icon: '🔥',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 100,
    tier: 'diamond',
  },
  {
    id: 'ach-6',
    name: 'First Workout',
    description: 'Complete your first logged workout session',
    icon: '🏋',
    category: 'workout',
    requirement_type: 'total_workouts',
    requirement_value: 1,
    tier: 'bronze',
  },
  {
    id: 'ach-7',
    name: '10 Workouts',
    description: 'Complete 10 logged workout sessions',
    icon: '🏋',
    category: 'workout',
    requirement_type: 'total_workouts',
    requirement_value: 10,
    tier: 'bronze',
  },
  {
    id: 'ach-8',
    name: '25 Workouts',
    description: 'Complete 25 logged workout sessions',
    icon: '🏋',
    category: 'workout',
    requirement_type: 'total_workouts',
    requirement_value: 25,
    tier: 'silver',
  },
  {
    id: 'ach-9',
    name: '50 Workouts',
    description: 'Complete 50 logged workout sessions',
    icon: '🏋',
    category: 'workout',
    requirement_type: 'total_workouts',
    requirement_value: 50,
    tier: 'gold',
  },
  {
    id: 'ach-10',
    name: '100 Workouts',
    description: 'Complete 100 logged workout sessions',
    icon: '🏋',
    category: 'workout',
    requirement_type: 'total_workouts',
    requirement_value: 100,
    tier: 'diamond',
  },
  {
    id: 'ach-11',
    name: 'First 10K',
    description: 'Reach 10,000 steps in a single day',
    icon: '👟',
    category: 'steps',
    requirement_type: 'single_day_steps',
    requirement_value: 10000,
    tier: 'bronze',
  },
  {
    id: 'ach-12',
    name: '100K Steps',
    description: 'Accumulate 100,000 total walking steps',
    icon: '👟',
    category: 'steps',
    requirement_type: 'total_steps',
    requirement_value: 100000,
    tier: 'silver',
  },
  {
    id: 'ach-13',
    name: '1 Million Steps',
    description: 'Accumulate 1,000,000 total walking steps',
    icon: '👟',
    category: 'steps',
    requirement_type: 'total_steps',
    requirement_value: 1000000,
    tier: 'gold',
  },
]

