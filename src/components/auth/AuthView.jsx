import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import {
  Flame,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export function AuthView() {
  const { login, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Sign up form state
  const [fullName, setFullName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please provide both email and password.')
      return
    }

    setLoading(true)
    try {
      await login(loginEmail, loginPassword)
    } catch (err) {
      console.error('Login error:', err)
      setErrorMsg(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.')
      return
    }
    if (!signupEmail.trim()) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }
    if (signupPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const data = await signUp({
        email: signupEmail,
        password: signupPassword,
        full_name: fullName,
        whatsapp_number: whatsappNumber,
        gender,
        age,
        height,
      })

      if (data?.session) {
        setSuccessMsg('Account created successfully! Welcome to the club.')
      } else {
        setSuccessMsg('Account created! Please check your email to confirm your account.')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setErrorMsg(err.message || 'Failed to create account. Please check your information.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F8] flex flex-col justify-center items-center px-4 py-8 sm:py-12 selection:bg-[#FFE5E8] selection:text-[#E04B5A]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#FF6F7D] to-[#FF949F] items-center justify-center text-white shadow-lg shadow-[#FF6F7D]/25 mb-1">
            <Flame className="w-7 h-7 fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#27313A] tracking-tight">
            Fitness Club
          </h1>
          <p className="text-xs sm:text-sm text-[#71808C] font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6F7D]" />
            <span>Private Members-Only Community</span>
          </p>
        </div>

        {/* Auth Card */}
        <Card className="p-6 sm:p-8 space-y-5 bg-white border-[#F4E2E0] shadow-md shadow-[#27313A]/5">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#FFF5F6] p-1 rounded-2xl border border-[#FFE5E8]">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true)
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                isLogin
                  ? 'bg-white text-[#FF6F7D] shadow-xs'
                  : 'text-[#71808C] hover:text-[#27313A]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false)
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-white text-[#FF6F7D] shadow-xs'
                  : 'text-[#71808C] hover:text-[#27313A]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-xs font-semibold text-[#E11D48] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-semibold text-[#16A34A] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#FF6F7D]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#FF6F7D]" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-10 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-sm text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#71808C] hover:text-[#27313A] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full justify-center text-sm font-bold mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In to Club'}
              </Button>
            </form>
          ) : (
            /* 2. SIGN UP FORM */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#FF6F7D]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#FF6F7D]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#FF6F7D]" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27313A]">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D]"
                  />
                </div>
              </div>

              {/* Profile Details (WhatsApp, Gender, Age, Height) */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-[#27313A] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#FF6F7D]" />
                  <span>WhatsApp Number</span>
                  <span className="text-[10px] text-[#71808C] font-normal">(Club contact only)</span>
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#27313A]">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#27313A]">Age</label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 26"
                    className="w-full px-2.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#27313A]">Height (cm)</label>
                  <input
                    type="number"
                    min="50"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full px-2.5 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full justify-center text-sm font-bold"
                >
                  {loading ? 'Creating Account...' : 'Register for Club'}
                </Button>
              </div>
            </form>
          )}

          {/* Privacy Footnote */}
          <div className="pt-3 border-t border-[#F4E2E0] text-center">
            <p className="text-[11px] text-[#71808C] flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Age and height are strictly private to your account.</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

