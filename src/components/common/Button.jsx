export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6F7D] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer'

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-2xl gap-2 shadow-sm',
    lg: 'px-6 py-3 text-base rounded-2xl gap-2.5 shadow-md',
  }

  const variantStyles = {
    primary:
      'bg-[#FF6F7D] hover:bg-[#F25A69] text-white shadow-[#FF6F7D]/25 hover:shadow-md hover:shadow-[#FF6F7D]/30 hover:-translate-y-0.5',
    secondary:
      'bg-[#FFE5E8] hover:bg-[#FFD4D9] text-[#E04B5A] hover:-translate-y-0.5',
    mint:
      'bg-[#DDF7EA] hover:bg-[#C8F0DC] text-[#1E7D58] hover:-translate-y-0.5',
    blue:
      'bg-[#E3F0FF] hover:bg-[#CFE5FF] text-[#2563EB] hover:-translate-y-0.5',
    outline:
      'bg-white hover:bg-[#FFF5F4] text-[#27313A] border border-[#F3DCD9] hover:border-[#FFB5BC] hover:-translate-y-0.5',
    ghost:
      'bg-transparent hover:bg-[#FFE5E8]/60 text-[#71808C] hover:text-[#27313A]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  )
}
