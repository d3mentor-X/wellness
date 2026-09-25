import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Avatar } from '../common/Avatar'
import { Flame, Clock, ShieldCheck, RefreshCw, LogOut, Lock } from 'lucide-react'

export function PendingApprovalView() {
  const { user, profile, membership, logout, refreshUser } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshUser()
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  const isSuspended = membership?.status === 'suspended' || membership?.status === 'banned'
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Member'

  return (
    <div className="min-h-screen bg-[#FFF9F8] flex flex-col justify-center items-center px-4 py-8 selection:bg-[#FFE5E8] selection:text-[#E04B5A]">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Brand Mark */}
        <div className="inline-flex w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#FF6F7D] to-[#FF949F] items-center justify-center text-white shadow-lg shadow-[#FF6F7D]/25">
          <Flame className="w-7 h-7 fill-white" />
        </div>

        <Card className="p-6 sm:p-8 space-y-5 bg-white border-[#F4E2E0] shadow-md shadow-[#27313A]/5 text-left">
          {/* User Preview */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#F4E2E0]">
            <Avatar name={displayName} size="md" />
            <div className="space-y-0.5 truncate">
              <h3 className="text-base font-bold text-[#27313A] truncate">
                {displayName}
              </h3>
              <p className="text-xs text-[#71808C] truncate">{user?.email}</p>
            </div>
            <div className="ml-auto">
              <Badge variant={isSuspended ? 'coral' : 'amber'} size="sm">
                {isSuspended ? 'Suspended' : 'Pending Approval'}
              </Badge>
            </div>
          </div>

          {/* Status Message */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#27313A]">
              {isSuspended ? (
                <>
                  <Lock className="w-4 h-4 text-[#E11D48]" />
                  <span>Club Access Suspended</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-[#D97706]" />
                  <span>Private Club Membership Review</span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#71808C] leading-relaxed">
              {isSuspended
                ? 'Your access to the private club is currently suspended. Please contact your club administrator.'
                : 'Welcome to Wellness! This is a private, member-only community. Your account has been registered, and a club administrator will activate your membership shortly.'}
            </p>
          </div>

          {/* Verification / Security note */}
          <div className="p-3.5 rounded-2xl bg-[#F5FAFF] border border-[#CCE4FF] text-xs text-[#2563EB] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Authenticated via Supabase Auth</span>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={RefreshCw}
              disabled={refreshing}
              onClick={handleRefresh}
              className="w-full justify-center text-xs font-bold"
            >
              {refreshing ? 'Checking Membership...' : 'Check Status Again'}
            </Button>

            <Button
              variant="outline"
              size="md"
              icon={LogOut}
              onClick={logout}
              className="w-full justify-center text-xs font-bold"
            >
              Log Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

