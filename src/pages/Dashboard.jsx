import { useAuth } from '../context/useAuth'
import { useDailyActivity } from '../hooks/useDailyActivity'
import { useWorkouts } from '../hooks/useWorkouts'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { ProgressBar } from '../components/common/ProgressBar'
import { ProgressRing } from '../components/common/ProgressRing'
import { Avatar } from '../components/common/Avatar'
import { ChallengeCard } from '../components/common/ChallengeCard'
import { SectionHeader } from '../components/common/SectionHeader'
import {
  CheckCircle2,
  Footprints,
  Dumbbell,
  Target,
  ArrowRight,
  TrendingUp,
  Zap,
  ChevronRight,
} from 'lucide-react'

export default function Dashboard({ onNavigate }) {
  const { user, profile, membership } = useAuth()
  const { todayActivity, updateTodayWater, toggleTodayWorkout } = useDailyActivity()
  const { workouts } = useWorkouts()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member'
  const firstName = displayName.split(' ')[0]
  const userRole = membership?.role || 'member'
  const roleLabel =
    userRole === 'admin'
      ? 'Club Admin'
      : userRole === 'instructor'
      ? 'Instructor'
      : 'Member'

  const todayDate = new Date().toISOString().split('T')[0]
  const todayWorkout = workouts.find(
    (w) => w.workout_date?.split('T')[0] === todayDate
  )
  const isWorkoutDone = !!todayWorkout || todayActivity.workout_completed

  const currentSteps = todayActivity.steps || 0
  const stepGoal = 10000
  const stepPercent = Math.min(100, Math.round((currentSteps / stepGoal) * 100))
  const remainingSteps = Math.max(0, stepGoal - currentSteps)
  const distanceKm = ((currentSteps * 0.75) / 1000).toFixed(1)
  const burnedKcal = Math.round(currentSteps * 0.04)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Friendly Greeting & Streak Hero Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-[#FFF5F6] to-white p-5 sm:p-6 rounded-3xl border border-[#F4E2E0] shadow-xs">
        <div className="flex items-center gap-4">
          <Avatar
            name={displayName}
            src={profile?.avatar_url}
            size="lg"
            status="online"
            isInstructor={userRole === 'instructor' || userRole === 'admin'}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#27313A] tracking-tight">
                Good morning, {firstName} 👋
              </h1>
              <Badge variant={userRole === 'admin' ? 'coral' : 'blue'} size="sm">
                {roleLabel}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#71808C]">
              {isWorkoutDone
                ? 'Great job! You logged a workout session today.'
                : 'Ready when you are. Start your fitness session today!'}
            </p>
          </div>
        </div>

        {/* Streak & XP Concept */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="bg-[#FFE5E8] border border-[#FFCCD2] px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-xs">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-xs font-black text-[#E04B5A] leading-tight">
                12 Day Streak
              </p>
              <p className="text-[10px] font-bold text-[#FF6F7D]">Personal Best!</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. XP & Progression Bar */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-white to-[#FFF8F8] border-[#F2DCD9]">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center font-black text-xs">
              L8
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#27313A]">
                  Level 8 • Fitness Explorer
                </span>
                <Badge variant="mint" size="sm">
                  +40 XP Today
                </Badge>
              </div>
              <p className="text-[11px] text-[#71808C]">120 XP to Level 9 (Club Titan)</p>
            </div>
          </div>
          <span className="text-xs font-black text-[#FF6F7D]">680 / 800 XP</span>
        </div>
        <ProgressBar value={680} max={800} variant="coral" size="md" />
      </Card>

      {/* 3. Today's Core Progress Grid */}
      <div className="space-y-4">
        <SectionHeader
          title="Today's Progress"
          subtitle="Your daily movement, hydration, and training logs."
          icon={TrendingUp}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('progress')}
              className="text-[#FF6F7D] font-bold text-xs"
            >
              <span>View All Logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Workout Status Card */}
          <Card
            variant={isWorkoutDone ? 'mintTint' : 'default'}
            className="p-5 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Badge variant={isWorkoutDone ? 'mint' : 'coral'} size="sm">
                  {isWorkoutDone ? 'Workout Complete' : 'Workout Pending'}
                </Badge>
                <h3 className="text-base font-bold text-[#27313A]">
                  {todayWorkout
                    ? todayWorkout.workout_name || 'Workout Session'
                    : isWorkoutDone
                    ? 'Daily Workout Done'
                    : 'No workout logged yet'}
                </h3>
                <p className="text-xs text-[#71808C]">
                  {todayWorkout
                    ? `${todayWorkout.duration_minutes || 45} mins • ${
                        todayWorkout.workout_exercises?.length || 1
                      } exercises logged`
                    : isWorkoutDone
                    ? 'Session recorded for today ✓'
                    : 'Target: 30–50 mins session'}
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  isWorkoutDone
                    ? 'bg-[#DDF7EA] text-[#1E7D58]'
                    : 'bg-[#FFE5E8] text-[#FF6F7D]'
                }`}
              >
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E8D9D6]">
              <span className="text-xs font-semibold text-[#71808C]">
                {isWorkoutDone ? 'Done today ✓' : 'Ready to start'}
              </span>

              {todayWorkout ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('progress')}
                  className="text-xs font-bold text-[#10B981] p-0"
                >
                  View Details →
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleTodayWorkout(!isWorkoutDone)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isWorkoutDone
                      ? 'bg-[#10B981] text-white shadow-xs'
                      : 'bg-[#FF6F7D] text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isWorkoutDone ? 'Logged ✓' : 'Quick Check'}</span>
                </button>
              )}
            </div>
          </Card>

          {/* Steps Meter Card */}
          <Card
            className="p-5 flex flex-col justify-between space-y-4 cursor-pointer"
            hover
            onClick={() => onNavigate?.('steps')}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Badge variant="blue" size="sm">
                  Daily Steps
                </Badge>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#27313A]">
                    {currentSteps.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#71808C] font-semibold">
                    / {stepGoal.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[#71808C]">
                  {distanceKm} km • ~{burnedKcal} kcal burned
                </p>
              </div>

              <ProgressRing
                value={currentSteps}
                max={stepGoal}
                size={68}
                strokeWidth={6}
                color="#3B82F6"
                trackColor="#E3F0FF"
              >
                <Footprints className="w-4 h-4 text-[#3B82F6]" />
              </ProgressRing>
            </div>

            <div className="pt-2 border-t border-[#F4E2E0] flex items-center justify-between text-xs font-semibold text-[#71808C]">
              <span>
                {remainingSteps === 0
                  ? 'Goal Achieved!'
                  : `${remainingSteps.toLocaleString()} steps to goal`}
              </span>
              <span className="text-[#3B82F6] font-bold">{stepPercent}%</span>
            </div>
          </Card>

          {/* Daily Habits & Water */}
          <Card className="p-5 flex flex-col justify-between space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="coral" size="sm">
                  Daily Habits
                </Badge>
                <span className="text-xs font-black text-[#27313A]">
                  {(todayActivity.water_glasses > 0 ? 1 : 0) + (isWorkoutDone ? 1 : 0)} / 3 Tracked
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#FFF5F6] border border-[#FFE5E8]">
                  <span className="font-semibold text-[#27313A]">💧 Hydration</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#E04B5A]">
                      {todayActivity.water_glasses || 0} / 8 cups
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateTodayWater(
                          Math.min(8, (todayActivity.water_glasses || 0) + 1)
                        )
                      }
                      className="w-5 h-5 rounded-md bg-[#FF6F7D] text-white flex items-center justify-center font-bold text-xs hover:bg-[#F25A69] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#F5FAFF] border border-[#E3F0FF]">
                  <span className="font-semibold text-[#27313A]">✨ Reflection & Prayer</span>
                  <span className="font-bold text-[#2563EB]">Active Daily</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate?.('spirituality')}
              className="w-full text-xs font-bold text-[#FF6F7D] justify-center"
            >
              <span>View Spiritual Tracker</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Card>
        </div>
      </div>

      {/* 4. Active Challenge Spotlight */}
      <div className="space-y-4">
        <SectionHeader
          title="Active Club Challenge"
          subtitle="Push together with fellow club members to earn trophies."
          icon={Target}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('challenges')}
              className="text-[#FF6F7D] font-bold text-xs"
            >
              <span>All Challenges</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          }
        />

        <ChallengeCard
          featured
          title="30-Day Consistency Challenge"
          description="Log at least 30 minutes of fitness or 8,000 steps every day this month."
          current={22}
          target={30}
          unit="days"
          rank={4}
          participantsCount={18}
          daysLeft={8}
          onView={() => onNavigate?.('challenges')}
        />
      </div>

      {/* 5. Instructor Message & Club Momentum */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Instructor Spotlight */}
        <Card
          variant="coralTint"
          className="p-5 lg:col-span-1 space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name="Coach Marcus" size="md" isInstructor />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-[#27313A]">Coach Marcus</h4>
                  <Badge variant="coral" size="sm">
                    Instructor
                  </Badge>
                </div>
                <p className="text-[11px] text-[#71808C]">Head Coach • Today's Tip</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/90 border border-[#FFD9DF] shadow-xs">
              <p className="text-xs text-[#27313A] italic leading-relaxed">
                "Great work on the step counts yesterday, team! Today is about deliberate recovery and core stability. Keep that streak alive!"
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate?.('community')}
            className="w-full text-xs font-bold justify-center"
          >
            <span>Reply in Community</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Card>

        {/* Club Momentum / Active Members Strip */}
        <Card className="p-5 lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h3 className="text-sm font-bold text-[#27313A]">Club Momentum</h3>
              </div>
              <Badge variant="mint" size="sm">
                14 Members Active Today
              </Badge>
            </div>

            <p className="text-xs text-[#71808C]">
              Your club has logged <strong>112,400 steps</strong> and <strong>16 workouts</strong> today!
            </p>

            {/* Member Avatars Strip */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <Avatar name="Tariq M" size="sm" status="online" />
                <span className="text-[10px] font-semibold text-[#27313A]">Tariq</span>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <Avatar name="Sarah K" size="sm" status="online" />
                <span className="text-[10px] font-semibold text-[#27313A]">Sarah</span>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <Avatar name="Zayd H" size="sm" status="online" />
                <span className="text-[10px] font-semibold text-[#27313A]">Zayd</span>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <Avatar name="Omar F" size="sm" status="online" />
                <span className="text-[10px] font-semibold text-[#27313A]">Omar</span>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <Avatar name="Amina R" size="sm" status="online" />
                <span className="text-[10px] font-semibold text-[#27313A]">Amina</span>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <Avatar name="Bilal S" size="sm" status="online" />
                <span className="text-[10px] font-semibold text-[#27313A]">Bilal</span>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-8 h-8 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] font-bold text-xs flex items-center justify-center border border-[#FFCCD2]">
                  +8
                </div>
                <span className="text-[10px] font-semibold text-[#71808C]">More</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F4E2E0] flex items-center justify-between text-xs">
            <span className="text-[#71808C]">
              Recent: <strong>Sarah K</strong> completed <strong>50 Workouts</strong> badge!
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.('leaderboard')}
              className="text-[#FF6F7D] font-bold text-xs p-0 hover:bg-transparent"
            >
              Leaderboard →
            </Button>
          </div>
        </Card>
      </div>

      {/* 6. Quick Action Pills Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#F4E2E0] shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate?.('progress')}
            icon={Dumbbell}
            className="shrink-0 text-xs font-bold"
          >
            Log Workout
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate?.('steps')}
            icon={Footprints}
            className="shrink-0 text-xs font-bold"
          >
            Update Steps
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate?.('food-calories')}
            className="shrink-0 text-xs font-bold"
          >
            🥗 Log Meal
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate?.('spirituality')}
            className="shrink-0 text-xs font-bold"
          >
            Daily Reflection
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate?.('ai-coach')}
            icon={Zap}
            className="shrink-0 text-xs font-bold"
          >
            Ask AI Coach
          </Button>
        </div>
      </div>
    </div>
  )
}
