export function Card({
  children,
  className = '',
  hover = false,
  padding = 'normal',
  ...props
}) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    normal: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }

  return (
    <div
      className={`bg-slate-900/80 border border-slate-800/80 rounded-2xl backdrop-blur-sm ${
        paddingStyles[padding] || paddingStyles.normal
      } ${
        hover
          ? 'transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

