import { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Avatar } from '../common/Avatar'
import {
  ShieldAlert,
  CheckCircle2,
  X,
  VolumeX,
  Volume2,
  UserCheck,
  UserX,
  UserMinus,
  Ban,
  RotateCcw,
} from 'lucide-react'

export function MemberActionModal({
  member,
  actionType, // 'approve' | 'suspend' | 'restore' | 'ban' | 'unban' | 'assign_instructor' | 'remove_instructor' | 'mute' | 'unmute'
  isOpen,
  onClose,
  onConfirm,
  loading,
}) {
  const [reason, setReason] = useState('')
  const [muteMinutes, setMuteMinutes] = useState(60)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !member) return null

  const getActionDetails = () => {
    switch (actionType) {
      case 'approve':
        return {
          title: `Approve Membership`,
          desc: `Grant ${member.full_name} full active access to the club, workouts, and challenges.`,
          icon: CheckCircle2,
          iconColor: 'text-[#10B981] bg-[#DDF7EA]',
          btnText: 'Approve Member',
          btnVariant: 'mint',
        }
      case 'suspend':
        return {
          title: `Suspend Member`,
          desc: `Temporarily restrict ${member.full_name}'s access to the fitness club. Their historical data is preserved.`,
          icon: UserMinus,
          iconColor: 'text-[#F59E0B] bg-[#FEF3C7]',
          btnText: 'Suspend Access',
          btnVariant: 'primary',
        }
      case 'restore':
        return {
          title: `Restore Member Access`,
          desc: `Reactivate ${member.full_name}'s membership so they can log workouts and participate again.`,
          icon: RotateCcw,
          iconColor: 'text-[#10B981] bg-[#DDF7EA]',
          btnText: 'Restore Access',
          btnVariant: 'mint',
        }
      case 'ban':
        return {
          title: `Permanently Ban Member`,
          desc: `Block ${member.full_name} from the club. Only an admin can reverse this action.`,
          icon: Ban,
          iconColor: 'text-[#E11D48] bg-[#FFE5E8]',
          btnText: 'Ban Member',
          btnVariant: 'primary',
        }
      case 'unban':
        return {
          title: `Unban Member`,
          desc: `Lift the ban on ${member.full_name} and return their status to active.`,
          icon: UserCheck,
          iconColor: 'text-[#10B981] bg-[#DDF7EA]',
          btnText: 'Unban Member',
          btnVariant: 'mint',
        }
      case 'assign_instructor':
        return {
          title: `Promote to Instructor`,
          desc: `Grant ${member.full_name} instructor privileges: creating challenges, posting broadcasts, and managing exercises.`,
          icon: UserCheck,
          iconColor: 'text-[#2563EB] bg-[#E3F0FF]',
          btnText: 'Assign Instructor',
          btnVariant: 'primary',
        }
      case 'remove_instructor':
        return {
          title: `Remove Instructor Role`,
          desc: `Demote ${member.full_name} back to regular member role.`,
          icon: UserX,
          iconColor: 'text-[#F59E0B] bg-[#FEF3C7]',
          btnText: 'Remove Role',
          btnVariant: 'primary',
        }
      case 'mute':
        return {
          title: `Mute Member`,
          desc: `Prevent ${member.full_name} from posting messages or reactions for the selected duration.`,
          icon: VolumeX,
          iconColor: 'text-[#F59E0B] bg-[#FEF3C7]',
          btnText: 'Mute Member',
          btnVariant: 'primary',
        }
      case 'unmute':
        return {
          title: `Unmute Member`,
          desc: `Restore ${member.full_name}'s ability to interact in club feeds and activity boards.`,
          icon: Volume2,
          iconColor: 'text-[#10B981] bg-[#DDF7EA]',
          btnText: 'Unmute Member',
          btnVariant: 'mint',
        }
      default:
        return {
          title: 'Confirm Action',
          desc: 'Are you sure you want to perform this administrative action?',
          icon: ShieldAlert,
          iconColor: 'text-[#FF6F7D] bg-[#FFE5E8]',
          btnText: 'Confirm',
          btnVariant: 'primary',
        }
    }
  }

  const { title, desc, icon: Icon, iconColor, btnText, btnVariant } = getActionDetails()

  const handleConfirm = () => {
    onConfirm({
      member,
      actionType,
      reason,
      muteMinutes: parseInt(muteMinutes, 10),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
      <Card className="w-full max-w-md p-6 space-y-5 bg-white border-[#F4E2E0] shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-[#F4E2E0]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#27313A]">{title}</h3>
              <p className="text-[11px] text-[#71808C]">Action requires confirmation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71808C] hover:text-[#27313A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Preview Strip */}
        <div className="p-3.5 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] flex items-center gap-3">
          <Avatar name={member.full_name} src={member.avatar_url} size="md" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-[#27313A]">{member.full_name}</h4>
            <p className="text-xs text-[#71808C]">
              {member.role?.toUpperCase()} • {member.whatsapp_number || 'No phone'}
            </p>
          </div>
        </div>

        <p className="text-xs text-[#556370] leading-relaxed">{desc}</p>

        {/* Mute Duration Selector */}
        {actionType === 'mute' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#27313A]">Mute Duration</label>
            <select
              value={muteMinutes}
              onChange={(e) => setMuteMinutes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs font-semibold text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
            >
              <option value="15">15 Minutes</option>
              <option value="60">1 Hour</option>
              <option value="1440">24 Hours (1 Day)</option>
              <option value="10080">7 Days</option>
              <option value="0">Indefinite (Until manually unmuted)</option>
            </select>
          </div>
        )}

        {/* Reason field for suspend / ban */}
        {(actionType === 'suspend' || actionType === 'ban') && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27313A]">Reason (Optional note)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Inactive or violated club rules"
              className="w-full px-3 py-2 rounded-xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs text-[#27313A] focus:outline-none focus:border-[#FF6F7D]"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F4E2E0]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={btnVariant}
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : btnText}
          </Button>
        </div>
      </Card>
    </div>
  )
}

