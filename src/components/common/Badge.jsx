export function Badge({
  children,
  variant = 'coral',
  size = 'sm',
  dot = false,
  className = '',
  icon: Icon,
}) {
  const variantStyles = {
    coral: 'bg-[#FFE5E8] text-[#E04B5A] border-[#FFCCD2]',
    pink: 'bg-[#FFF0F2] text-[#FF6F7D] border-[#FFE5E8]',
    mint: 'bg-[#DDF7EA] text-[#1E7D58] border-[#BDEFD6]',
    blue: 'bg-[#E3F0FF] text-[#2563EB] border-[#CCE4FF]',
    amber: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    gray: 'bg-[#F1F4F7] text-[#556370] border-[#E2E7EC]',
    dark: 'bg-[#27313A] text-white border-[#27313A]',
  }

  const dotColors = {
    coral: 'bg-[#FF6F7D]',
    pink: 'bg-[#FF6F7D]',
    mint: 'bg-[#10B981]',
    blue: 'bg-[#3B82F6]',
    amber: 'bg-[#F59E0B]',
    gray: 'bg-[#9CA3AF]',
    dark: 'bg-emerald-400',
  }

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs font-semibold rounded-full gap-1.5',
    md: 'px-3 py-1 text-xs font-bold rounded-full gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm font-bold rounded-full gap-2',
  }

  return (
    <span
      className={`inline-flex items-center border transition-colors ${
        sizeStyles[size] || sizeStyles.sm
      } ${variantStyles[variant] || variantStyles.coral} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant] || dotColors.coral
          }`}
        />
      )}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  )
}
