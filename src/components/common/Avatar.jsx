export function Avatar({
  src,
  name = 'Member',
  size = 'md',
  status,
  isInstructor = false,
  className = '',
}) {
  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-13 h-13 text-base',
    xl: 'w-18 h-18 text-xl',
  }

  const getInitials = (str) => {
    if (!str) return 'M'
    const parts = str.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return str.slice(0, 2).toUpperCase()
  }

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`${
          sizeStyles[size] || sizeStyles.md
        } rounded-2xl overflow-hidden font-bold flex items-center justify-center border-2 ${
          isInstructor
            ? 'border-[#FF6F7D] bg-gradient-to-br from-[#FFE5E8] to-[#FFCCD2] text-[#E04B5A]'
            : 'border-white shadow-sm bg-gradient-to-tr from-[#FF6F7D] to-[#FFA8B2] text-white'
        }`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            status === 'online' ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'
          }`}
        />
      )}

      {isInstructor && (
        <span
          className="absolute -top-1 -right-1 bg-[#FF6F7D] text-white text-[9px] font-black rounded-full px-1 py-0.2 border border-white shadow-xs"
          title="Club Instructor"
        >
          ★
        </span>
      )}
    </div>
  )
}

