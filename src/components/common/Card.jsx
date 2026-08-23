export function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  padding = 'normal',
  onClick,
  ...props
}) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3.5 sm:p-4',
    normal: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }

  const variantStyles = {
    default:
      'bg-white border border-[#F4E2E0] shadow-sm shadow-[#27313A]/3',
    elevated:
      'bg-white border border-[#EED7D4] shadow-md shadow-[#27313A]/5',
    coralTint:
      'bg-gradient-to-br from-[#FFF5F6] to-[#FFEBEF] border border-[#FFD5DB] shadow-sm',
    mintTint:
      'bg-gradient-to-br from-[#F4FDF8] to-[#EAF9F1] border border-[#C6F1DC] shadow-sm',
    blueTint:
      'bg-gradient-to-br from-[#F5FAFF] to-[#EBF4FF] border border-[#D0E6FF] shadow-sm',
    hero:
      'bg-gradient-to-br from-[#FF7A87] via-[#FF6F7D] to-[#F85A6A] text-white border-0 shadow-lg shadow-[#FF6F7D]/20',
  }

  const hoverStyles = hover
    ? 'transition-all duration-200 hover:shadow-md hover:shadow-[#27313A]/6 hover:border-[#E8CBC7] hover:-translate-y-0.5 cursor-pointer'
    : ''

  return (
    <div
      onClick={onClick}
      className={`rounded-3xl ${variantStyles[variant] || variantStyles.default} ${
        paddingStyles[padding] || paddingStyles.normal
      } ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
