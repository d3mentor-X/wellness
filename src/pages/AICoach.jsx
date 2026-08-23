import { useState, useRef, useEffect } from 'react'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Avatar } from '../components/common/Avatar'
import { useAICoach } from '../hooks/useAICoach'
import { useAuth } from '../context/useAuth'
import {
  Bot,
  Send,
  ChevronLeft,
  Plus,
  Trash2,
  Sparkles,
  MessageSquare,
} from 'lucide-react'

const SUGGESTED_PROMPTS = [
  { text: 'How am I doing this week?', icon: '📊' },
  { text: 'What should I train today?', icon: '🏋️' },
  { text: 'How is my protein intake?', icon: '🥗' },
  { text: 'How can I improve my streak?', icon: '🔥' },
  { text: 'How is my challenge progress?', icon: '🎯' },
]

export default function AICoach({ onNavigate }) {
  const { user } = useAuth()
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    sending,
    error,
    sendMessage,
    startNewConversation,
    deleteConversation,
  } = useAICoach()

  const [inputVal, setInputVal] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef(null)

  const displayName = user?.user_metadata?.full_name || 'Member'
  const firstName = displayName.split(' ')[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!inputVal.trim() || sending) return
    const query = inputVal.trim()
    setInputVal('')
    await sendMessage(query)
  }

  const handleSelectPrompt = async (promptText) => {
    setInputVal('')
    await sendMessage(promptText)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header */}
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
              <Sparkles className="w-3 h-3 inline mr-1" />
              Context-Aware
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#71808C]">
            Personalized guidance driven by your real workouts, steps, streaks, and nutrition logs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            icon={MessageSquare}
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs font-bold"
          >
            {showHistory ? 'Hide History' : `History (${conversations.length})`}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={startNewConversation}
            className="text-xs font-bold"
          >
            New Session
          </Button>
        </div>
      </div>

      {/* History Drawer / Panel (Toggleable) */}
      {showHistory && (
        <Card className="p-4 space-y-3 bg-[#FFF9F8] border-[#F4E2E0] animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#71808C]">
              Past Coaching Sessions
            </h4>
            <span className="text-[11px] text-[#71808C]">{conversations.length} sessions</span>
          </div>

          {conversations.length === 0 ? (
            <p className="text-xs text-[#71808C] italic">No saved conversations yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                    conv.id === activeConversationId
                      ? 'bg-[#FFE5E8] border-[#FFCCD2] text-[#FF6F7D] font-bold shadow-xs'
                      : 'bg-white border-[#F0E4E2] text-[#27313A] hover:border-[#FF6F7D]'
                  }`}
                  onClick={() => {
                    setActiveConversationId(conv.id)
                    setShowHistory(false)
                  }}
                >
                  <span className="truncate max-w-[180px]">{conv.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conv.id)
                    }}
                    className="p-1 text-[#71808C] hover:text-[#E11D48] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 2. Suggested Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SUGGESTED_PROMPTS.map((p, i) => (
          <button
            key={i}
            type="button"
            disabled={sending}
            onClick={() => handleSelectPrompt(p.text)}
            className="px-3.5 py-2 rounded-2xl bg-white border border-[#F4E2E0] hover:border-[#FFB5BC] text-xs font-semibold text-[#27313A] shrink-0 hover:bg-[#FFF5F4] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <span className="mr-1.5">{p.icon}</span>
            <span>{p.text}</span>
          </button>
        ))}
      </div>

      {/* 3. Interactive Chat Interface */}
      <Card className="p-4 sm:p-6 space-y-4 flex flex-col h-[520px] bg-white border-[#F4E2E0] shadow-sm">
        {/* Chat Header Status */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6F7D] to-[#FFA8B2] text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#27313A]">Coach Marcus AI</h3>
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              </div>
              <p className="text-[11px] text-[#71808C]">Analyzing your personal fitness logs</p>
            </div>
          </div>

          <Badge variant="mint" size="sm">
            Read-Only Advice
          </Badge>
        </div>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-3xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-[#27313A]">
                  Welcome back, {firstName}!
                </h4>
                <p className="text-xs text-[#71808C] leading-relaxed">
                  I'm your private AI Fitness Coach. I can analyze your workouts, daily steps, consistency streaks, and nutrition logs to help you reach your goals.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectPrompt('How am I doing this week?')}
                  className="text-xs font-bold"
                >
                  📊 Review This Week's Progress
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectPrompt('What should I train today?')}
                  className="text-xs font-bold"
                >
                  🏋️ Today's Workout Focus
                </Button>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user'

              return (
                <div
                  key={m.id || idx}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#FF6F7D] text-white rounded-tr-xs font-medium shadow-xs'
                        : 'bg-[#FFF9F8] border border-[#F4E2E0] text-[#27313A] rounded-tl-xs whitespace-pre-wrap'
                    }`}
                  >
                    {m.content}
                  </div>

                  {isUser && (
                    <Avatar
                      name={displayName}
                      src={user?.user_metadata?.avatar_url}
                      size="sm"
                    />
                  )}
                </div>
              )
            })
          )}

          {/* Thinking Indicator */}
          {sending && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#71808C] flex items-center gap-2">
                <span>Coach is reviewing your activity</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F7D] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F7D] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F7D] animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#E11D48] text-center">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-[#F4E2E0] shrink-0">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={sending}
            placeholder="Ask coach about your workouts, protein, streak, or recovery..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Send}
            disabled={!inputVal.trim() || sending}
            className="shrink-0 font-bold"
          >
            Send
          </Button>
        </form>
      </Card>
    </div>
  )
}
