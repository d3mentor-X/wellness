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
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
  }

  const variantStyles = {
    primary:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold focus:ring-emerald-500 shadow-sm shadow-emerald-950',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-600',
    outline:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-700/80 hover:border-slate-600 focus:ring-slate-500',
    ghost:
      'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 focus:ring-slate-500',
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

