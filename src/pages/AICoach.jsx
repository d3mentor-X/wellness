import { useState } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Avatar } from '../components/common/Avatar'
import { Bot, Send, ChevronLeft } from 'lucide-react'

export default function AICoach({ onNavigate }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello Alex! I noticed you completed your Upper Body workout this morning and are at 8,420 steps. How are you feeling today?",
      time: '09:00 AM',
    },
    {
      sender: 'user',
      text: 'Feeling great! Should I do any cardio or recovery mobility tonight?',
      time: '09:02 AM',
    },
    {
      sender: 'ai',
      text: 'A light 15-minute walk and 10 minutes of shoulder & thoracic spine mobility will help flush fatigue and push you past your 10,000 step daily goal!',
      time: '09:03 AM',
    },
  ])

  const [inputVal, setInputVal] = useState('')

  const handleSend = (e) => {
    e.preventDefault()
    if (!inputVal.trim()) return

    const newMsg = { sender: 'user', text: inputVal, time: 'Just now' }
    setMessages((prev) => [...prev, newMsg])
    setInputVal('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "Thanks for checking in! Keep prioritizing your protein intake and hydration to maximize today's workout recovery.",
          time: 'Just now',
        },
      ])
    }, 600)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate?.('dashboard')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6F7D] hover:underline mb-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
              AI Fitness Coach
            </h1>
            <Badge variant="coral" size="sm">
              Smart Insights
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Personalized guidance, workout advice, and habit optimization.
          </p>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          '🏃 How should I recover today?',
          '🥗 Review my protein target',
          '🔥 How to improve my consistency streak?',
          '💪 Recommend shoulder exercises',
        ].map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInputVal(prompt.replace(/^[^\s]+\s/, ''))}
            className="px-3.5 py-2 rounded-2xl bg-white border border-[#F4E2E0] hover:border-[#FFB5BC] text-xs font-semibold text-[#27313A] shrink-0 hover:bg-[#FFF5F4] transition-all cursor-pointer shadow-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Interactive Chat Card */}
      <Card className="p-5 sm:p-6 space-y-4 flex flex-col h-[480px]">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6F7D] to-[#FFA8B2] text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#27313A]">Coach AI Assistant</h3>
              <p className="text-[11px] text-[#1E7D58] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Online & Ready
              </p>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {m.sender === 'ai' ? (
                <div className="w-8 h-8 rounded-xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              ) : (
                <Avatar name="Alex Rivera" size="xs" />
              )}

              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#FF6F7D] text-white rounded-tr-none shadow-xs'
                    : 'bg-[#FFF9F8] border border-[#F4E2E0] text-[#27313A] rounded-tl-none'
                }`}
              >
                <p>{m.text}</p>
                <span
                  className={`text-[9px] block mt-1 ${
                    m.sender === 'user' ? 'text-white/75 text-right' : 'text-[#71808C]'
                  }`}
                >
                  {m.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 pt-3 border-t border-[#F4E2E0]"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask your coach anything about workouts, food, or streaks..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] placeholder-[#71808C] focus:outline-none focus:border-[#FF6F7D]"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Send}
            className="font-bold text-xs"
          >
            Send
          </Button>
        </form>
      </Card>
    </div>
  )
}
