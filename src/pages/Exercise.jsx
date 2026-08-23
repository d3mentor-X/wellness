import { useState, useMemo } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { StatCard } from '../components/common/StatCard'
import { SectionHeader } from '../components/common/SectionHeader'
import { WorkoutLoggerModal } from '../components/workout/WorkoutLoggerModal'
import { WorkoutDetailModal } from '../components/workout/WorkoutDetailModal'
import { useWorkouts } from '../hooks/useWorkouts'
import { useGamification } from '../hooks/useGamification'
import {
  Dumbbell,
  Plus,
  Flame,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  Footprints,
  Utensils,
  Target,
  ArrowUpRight,
  Eye,
} from 'lucide-react'

export default function Exercise({ onNavigate }) {
  const { workouts, loading, error, logWorkout, deleteWorkout } = useWorkouts()
  const { streakInfo, syncGamification } = useGamification()
  const [isLoggerOpen, setIsLoggerOpen] = useState(false)
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState(null)

  // Dynamically calculate weekly momentum (Mon to Sun)
  const weeklyDays = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sun, 1 = Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)

    const workoutDatesSet = new Set(
      workouts.map((w) => w.workout_date?.split('T')[0]).filter(Boolean)
    )

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((dayLabel, index) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + index)
      const dateStr = d.toISOString().split('T')[0]
      const isToday = dateStr === today.toISOString().split('T')[0]
      const completed = workoutDatesSet.has(dateStr)

      return {
        day: dayLabel,
        dateStr,
        isToday,
        completed,
        label: isToday ? 'Today' : completed ? 'Logged' : 'Rest / Plan',
      }
    })
  }, [workouts])

  // Summary Metrics
  const totalWorkouts = workouts.length
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
  const avgSession = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0
  const activeThisWeek = weeklyDays.filter((d) => d.completed).length

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
              Progress & Workouts
            </h1>
            <Badge variant="coral" size="sm">
              Live Activity
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C] mt-1">
            Track your workout logs, exercises, sets, and training momentum.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setIsLoggerOpen(true)}
          className="self-start sm:self-center font-bold text-xs"
        >
          Start Workout
        </Button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Workouts"
          value={loading ? '...' : `${totalWorkouts}`}
          subtitle="All time sessions"
          icon={Dumbbell}
          accentColor="coral"
        />
        <StatCard
          title="Active Streak"
          value={streakInfo.current_streak > 0 ? `${streakInfo.current_streak} days` : '0 days'}
          subtitle={streakInfo.current_streak > 0 ? `Best: ${streakInfo.longest_streak}d` : 'Start your streak'}
          icon={Flame}
          accentColor="coral"
        />
        <StatCard
          title="Avg Session"
          value={loading ? '...' : `${avgSession} min`}
          subtitle="Training time"
          icon={Clock}
          accentColor="mint"
        />
        <StatCard
          title="Consistency"
          value={totalWorkouts > 0 ? `${Math.min(100, Math.round((activeThisWeek / 7) * 100))}%` : '0%'}
          subtitle="Weekly target pace"
          icon={TrendingUp}
          accentColor="blue"
        />
      </div>

      {/* 3. Weekly Consistency Calendar Strip */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FF6F7D]" />
            <h3 className="text-base font-bold text-[#27313A]">
              This Week's Momentum
            </h3>
          </div>
          <Badge variant="mint" size="sm" dot>
            {activeThisWeek} / 7 Days Active
          </Badge>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
          {weeklyDays.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all ${
                item.isToday
                  ? 'bg-[#FFE5E8] border-[#FF6F7D] shadow-xs'
                  : item.completed
                  ? 'bg-[#DDF7EA]/60 border-[#BDEFD6]'
                  : 'bg-[#F9F6F5] border-[#F0E4E2]'
              }`}
            >
              <span className="text-[11px] font-bold uppercase text-[#71808C] block">
                {item.day}
              </span>
              <div className="my-1.5 flex items-center justify-center">
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-dashed border-[#D0C0BE]" />
                )}
              </div>
              <span className="text-[10px] font-semibold text-[#27313A] truncate block hidden sm:block">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Contextual Quick Navigation Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card
          hover
          onClick={() => onNavigate?.('steps')}
          className="p-4 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E3F0FF] text-[#2563EB] flex items-center justify-center">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#27313A]">Steps & Walking</h4>
              <p className="text-[11px] text-[#71808C]">Daily step target & history</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#71808C] group-hover:text-[#FF6F7D] transition-colors" />
        </Card>

        <Card
          hover
          onClick={() => onNavigate?.('food-calories')}
          className="p-4 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DDF7EA] text-[#1E7D58] flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#27313A]">Food & Nutrition</h4>
              <p className="text-[11px] text-[#71808C]">Macronutrient targets</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#71808C] group-hover:text-[#FF6F7D] transition-colors" />
        </Card>

        <Card
          hover
          onClick={() => onNavigate?.('challenges')}
          className="p-4 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#27313A]">Club Challenges</h4>
              <p className="text-[11px] text-[#71808C]">Active fitness goals</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#71808C] group-hover:text-[#FF6F7D] transition-colors" />
        </Card>
      </div>

      {/* 5. Recent Workout Logs Feed */}
      <div className="space-y-4">
        <SectionHeader
          title="Workout History"
          subtitle="Real logged sessions, exercises, sets, and reps."
          icon={Dumbbell}
        />

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 space-y-3 animate-pulse">
                <div className="h-5 bg-[#F0E5E3] rounded-md w-1/3" />
                <div className="h-4 bg-[#F0E5E3] rounded-md w-1/4" />
                <div className="h-10 bg-[#F0E5E3] rounded-xl" />
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <Card className="p-5 text-center space-y-2 bg-[#FFF1F2] border-[#FECDD3]">
            <p className="text-xs sm:text-sm font-bold text-[#E11D48]">{error}</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && workouts.length === 0 && (
          <Card className="p-8 text-center space-y-4 bg-white border-[#F4E2E0]">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center mx-auto">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-base font-bold text-[#27313A]">Ready when you are!</h4>
              <p className="text-xs text-[#71808C]">
                No workouts logged yet. Start your first session to track exercises, sets, weights, and reps.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setIsLoggerOpen(true)}
              className="text-xs font-bold"
            >
              Start First Workout
            </Button>
          </Card>
        )}

        {/* Workouts Feed */}
        {!loading && !error && workouts.length > 0 && (
          <div className="space-y-4">
            {workouts.map((session) => {
              const exercises = session.workout_exercises || []
              const formattedDate = session.workout_date
                ? new Date(session.workout_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent'

              return (
                <Card key={session.id} className="p-5 sm:p-6 space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="coral" size="sm">
                          {session.workout_name || 'Workout Session'}
                        </Badge>
                        <span className="text-xs font-semibold text-[#71808C]">
                          {formattedDate}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#27313A]">
                        {session.workout_name || 'Workout Session'}
                      </h3>
                      {session.notes && (
                        <p className="text-xs text-[#71808C] italic">"{session.notes}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F9F5F4] text-xs font-bold text-[#71808C]">
                        <Clock className="w-3.5 h-3.5 text-[#FF6F7D]" />
                        <span>{session.duration_minutes || 0} mins</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => setSelectedWorkoutDetail(session)}
                        className="text-xs font-bold text-[#FF6F7D] p-1.5 hover:bg-[#FFE5E8]"
                        title="View Details"
                      >
                        Details
                      </Button>
                    </div>
                  </div>

                  {exercises.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#F4E2E0]">
                      <p className="text-xs font-bold text-[#71808C] uppercase tracking-wider mb-2">
                        Exercises Logged ({exercises.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {exercises.map((item, i) => {
                          const exName = item.exercises?.name || 'Exercise'
                          const setsCount = item.exercise_sets?.length || 0

                          return (
                            <div
                              key={item.id || i}
                              className="flex items-center justify-between text-xs text-[#27313A] bg-[#FFF9F8] p-2.5 rounded-xl border border-[#F4E2E0]"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F7D] shrink-0" />
                                <span className="truncate font-semibold">{exName}</span>
                              </div>
                              <span className="text-[11px] text-[#71808C] shrink-0 font-bold">
                                {setsCount} {setsCount === 1 ? 'set' : 'sets'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Workout Logger Modal */}
      <WorkoutLoggerModal
        isOpen={isLoggerOpen}
        onClose={() => setIsLoggerOpen(false)}
        onSave={async (data) => {
          await logWorkout(data)
          syncGamification()
        }}
      />

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        workout={selectedWorkoutDetail}
        isOpen={!!selectedWorkoutDetail}
        onClose={() => setSelectedWorkoutDetail(null)}
        onDelete={async (id) => {
          await deleteWorkout(id)
          syncGamification()
        }}
      />
    </div>
  )
}
