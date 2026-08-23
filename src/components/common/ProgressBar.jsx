export function ProgressBar({
  value = 0,
  max = 100,
  variant = 'coral',
  size = 'md',
  showLabel = false,
  label = '',
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100))

  const variantGradients = {
    coral: 'bg-gradient-to-r from-[#FF8893] to-[#FF6F7D]',
    mint: 'bg-gradient-to-r from-[#4ADE80] to-[#10B981]',
    blue: 'bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]',
    amber: 'bg-gradient-to-r from-[#FBBF24] to-[#F59E0B]',
    purple: 'bg-gradient-to-r from-[#C084FC] to-[#A855F7]',
  }

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold text-[#71808C]">
          <span>{label}</span>
          <span className="text-[#27313A]">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full bg-[#F3E5E3] rounded-full overflow-hidden p-0.5 ${
          sizeStyles[size] || sizeStyles.md
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            variantGradients[variant] || variantGradients.coral
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

