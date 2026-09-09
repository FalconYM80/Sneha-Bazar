export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
      <div className="h-40 bg-gray-100 animate-pulse" />
      <div className="p-3">
        <div className="h-4 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3 mb-3" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-5 bg-gray-100 rounded animate-pulse w-16" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-12" />
          </div>
          <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}