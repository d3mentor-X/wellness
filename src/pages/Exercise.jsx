import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { StatCard } from '../components/common/StatCard'
import { SectionHeader } from '../components/common/SectionHeader'
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
} from 'lucide-react'

export default function Exercise({ onNavigate }) {
  const weeklyDays = [
    { day: 'Mon', completed: true, label: 'Upper Body' },
    { day: 'Tue', completed: true, label: 'Cardio + Steps' },
    { day: 'Wed', completed: true, label: 'Legs & Core' },
    { day: 'Thu', completed: true, label: 'Active Recovery' },
    { day: 'Fri', completed: true, label: 'Push Day' },
    { day: 'Sat', completed: true, label: 'Today', isToday: true },
    { day: 'Sun', completed: false, label: 'Planned' },
  ]

  const workoutSessions = [
    {
      id: '1',
      title: 'Upper Body Hypertrophy',
      date: 'Today, 08:30 AM',
      duration: '45 mins',
      exercisesCount: 4,
      exercises: [
        'Bench Press (4 sets x 10 reps - 75kg)',
        'Incline Dumbbell Press (3 sets x 12 reps - 24kg)',
        'Barbell Rows (4 sets x 10 reps - 65kg)',
        'Overhead Tricep Extension (3 sets x 15 reps)',
      ],
      tag: 'Strength',
    },
    {
      id: '2',
      title: 'HIIT & Core Conditioning',
      date: 'Yesterday, 07:15 AM',
      duration: '35 mins',
      exercisesCount: 5,
      exercises: [
        'Treadmill Intervals (15 mins)',
        'Kettlebell Swings (4 sets x 20 reps)',
        'Hanging Leg Raises (3 sets x 15 reps)',
        'Plank Holds (3 sets x 60s)',
      ],
      tag: 'Cardio',
    },
    {
      id: '3',
      title: 'Lower Body Power Session',
      date: 'Aug 21, 06:00 PM',
      duration: '50 mins',
      exercisesCount: 4,
      exercises: [
        'Barbell Back Squats (5 sets x 8 reps - 100kg)',
        'Romanian Deadlifts (4 sets x 10 reps - 85kg)',
        'Walking Lunges (3 sets x 20 steps)',
        'Standing Calf Raises (4 sets x 15 reps)',
      ],
      tag: 'Strength',
    },
  ]

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
              Level 8
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C] mt-1">
            Track your workout logs, consistency streak, and volume progression.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {}}
          className="self-start sm:self-center"
        >
          Log Workout
        </Button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Workouts"
          value="48"
          subtitle="+4 this week"
          icon={Dumbbell}
          accentColor="coral"
        />
        <StatCard
          title="Current Streak"
          value="12 days"
          subtitle="Record pace"
          icon={Flame}
          accentColor="coral"
        />
        <StatCard
          title="Avg Session"
          value="44 min"
          subtitle="Optimal range"
          icon={Clock}
          accentColor="mint"
        />
        <StatCard
          title="Consistency"
          value="94%"
          subtitle="Top 5% in club"
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
            6 / 7 Days Active
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
          className="p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E3F0FF] text-[#2563EB] flex items-center justify-center">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#27313A]">Steps & Distance</h4>
              <p className="text-[11px] text-[#71808C]">8,420 steps today</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#71808C] group-hover:text-[#FF6F7D] transition-colors" />
        </Card>

        <Card
          hover
          onClick={() => onNavigate?.('food-calories')}
          className="p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DDF7EA] text-[#1E7D58] flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#27313A]">Food & Nutrition</h4>
              <p className="text-[11px] text-[#71808C]">1,850 / 2,300 kcal</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#71808C] group-hover:text-[#FF6F7D] transition-colors" />
        </Card>

        <Card
          hover
          onClick={() => onNavigate?.('goals')}
          className="p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#27313A]">Personal Goals</h4>
              <p className="text-[11px] text-[#71808C]">3 active milestones</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#71808C] group-hover:text-[#FF6F7D] transition-colors" />
        </Card>
      </div>

      {/* 5. Recent Workout Logs Feed */}
      <div className="space-y-4">
        <SectionHeader
          title="Workout History"
          subtitle="Detailed exercises, sets, reps, and logged sessions."
          icon={Dumbbell}
        />

        <div className="space-y-4">
          {workoutSessions.map((session) => (
            <Card key={session.id} className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={session.tag === 'Strength' ? 'coral' : 'blue'} size="sm">
                      {session.tag}
                    </Badge>
                    <span className="text-xs font-semibold text-[#71808C]">
                      {session.date}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#27313A]">
                    {session.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F9F5F4] text-xs font-bold text-[#71808C]">
                  <Clock className="w-3.5 h-3.5 text-[#FF6F7D]" />
                  <span>{session.duration}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#F4E2E0]">
                <p className="text-xs font-bold text-[#71808C] uppercase tracking-wider mb-2">
                  Exercises Logged ({session.exercisesCount})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {session.exercises.map((ex, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-[#27313A] bg-[#FFF9F8] p-2.5 rounded-xl border border-[#F4E2E0]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F7D]" />
                      <span>{ex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
