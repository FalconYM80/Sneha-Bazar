interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState = ({ 
  icon = '🛒', 
  title, 
  subtitle, 
  actionLabel, 
  onAction 
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-5xl mb-3">{icon}</span>
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">{subtitle}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}