import { useState, useMemo } from 'react'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Avatar } from '../common/Avatar'
import {
  Users,
  Search,
  MessageCircle,
  Shield,
  Star,
  Sparkles,
  Calendar,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'

export function MemberDirectory({ members, loading, error, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const q = searchQuery.toLowerCase()
    return members.filter((m) =>
      m.full_name?.toLowerCase().includes(q) ||
      m.whatsapp_number?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    )
  }, [members, searchQuery])

  const formatJoinedDate = (dateStr) => {
    if (!dateStr) return 'Joined recently'
    try {
      const d = new Date(dateStr)
      return `Joined ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    } catch {
      return 'Joined recently'
    }
  }

  const cleanWhatsAppLink = (number) => {
    if (!number) return null
    const cleaned = number.replace(/[^0-9]/g, '')
    return cleaned ? `https://wa.me/${cleaned}` : null
  }

  return (
    <div className="space-y-5">
      {/* Search Bar & Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#F4E2E0] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#71808C] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search club members by name or role..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#FFF9F8] border border-[#F4E2E0] text-xs sm:text-sm text-[#27313A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6F7D] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge variant="mint" size="sm">
            {filteredMembers.length} Active {filteredMembers.length === 1 ? 'Member' : 'Members'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            icon={RefreshCw}
            disabled={loading}
            className="text-xs font-bold text-[#71808C] hover:text-[#27313A]"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F0E5E3]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#F0E5E3] rounded-md w-3/4" />
                  <div className="h-3 bg-[#F0E5E3] rounded-md w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-[#F0E5E3] rounded-xl" />
            </Card>
          ))}
        </div>
      )}

      {/* Error Notice */}
      {!loading && error && (
        <Card className="p-6 text-center space-y-2 bg-[#FFF1F2] border-[#FECDD3]">
          <p className="text-xs sm:text-sm font-bold text-[#E11D48]">
            {error}
          </p>
          <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs font-bold">
            Try Again
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filteredMembers.length === 0 && (
        <Card className="p-8 text-center space-y-3 bg-white border-[#F4E2E0]">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE5E8] text-[#FF6F7D] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#27313A]">No Members Found</h4>
            <p className="text-xs text-[#71808C]">
              {searchQuery
                ? `No active members matching "${searchQuery}".`
                : 'No active members registered in your club yet.'}
            </p>
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold"
            >
              Clear Search
            </Button>
          )}
        </Card>
      )}

      {/* Member Cards Grid */}
      {!loading && !error && filteredMembers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const isAdmin = member.role === 'admin'
            const isInstructor = member.role === 'instructor'
            const waLink = cleanWhatsAppLink(member.whatsapp_number)

            return (
              <Card
                key={member.membership_id || member.user_id}
                variant={isAdmin ? 'coralTint' : isInstructor ? 'mintTint' : 'default'}
                className="p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                {/* Top: Avatar & Identification */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={member.full_name || 'Member'}
                        src={member.avatar_url}
                        size="md"
                        status="online"
                        isInstructor={isInstructor || isAdmin}
                      />
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-[#27313A] group-hover:text-[#FF6F7D] transition-colors leading-tight">
                          {member.full_name}
                        </h4>
                        <p className="text-[11px] text-[#71808C] capitalize">
                          {member.gender?.replace(/_/g, ' ') || 'Member'}
                        </p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    {isAdmin ? (
                      <Badge variant="coral" size="sm">
                        <Shield className="w-3 h-3 inline mr-1" />
                        Admin
                      </Badge>
                    ) : isInstructor ? (
                      <Badge variant="mint" size="sm">
                        <Star className="w-3 h-3 inline mr-1" />
                        Instructor
                      </Badge>
                    ) : (
                      <Badge variant="blue" size="sm">
                        Member
                      </Badge>
                    )}
                  </div>

                  {/* Joined Date */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#71808C] pt-1">
                    <Calendar className="w-3.5 h-3.5 text-[#A0AEC0]" />
                    <span>{formatJoinedDate(member.joined_at)}</span>
                  </div>
                </div>

                {/* Bottom: WhatsApp Action or Contact */}
                <div className="pt-3 border-t border-[#F4E2E0] flex items-center justify-between">
                  {member.whatsapp_number ? (
                    waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DDF7EA] hover:bg-[#C8F0DC] text-[#1E7D58] text-xs font-bold transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-[#1E7D58]" />
                        <span>Chat on WhatsApp</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ) : (
                      <span className="text-xs text-[#71808C] flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>{member.whatsapp_number}</span>
                      </span>
                    )
                  ) : (
                    <span className="text-[11px] text-[#A0AEC0] italic">
                      No WhatsApp shared
                    </span>
                  )}

                  <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Active Member</span>
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

