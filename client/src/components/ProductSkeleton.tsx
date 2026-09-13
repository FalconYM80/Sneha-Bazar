export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
      <div className="h-32 bg-gray-100 animate-pulse" />
      <div className="p-2.5">
        <div className="h-3 bg-gray-100 rounded animate-pulse mb-1" />
        <div className="h-2 bg-gray-100 rounded animate-pulse w-2/3 mb-1.5" />
        <div className="flex items-center justify-between mt-1">
          <div className="space-y-1">
            <div className="h-4 bg-gray-100 rounded animate-pulse w-14" />
            <div className="h-2 bg-gray-100 rounded animate-pulse w-10" />
          </div>
          <div className="h-6 w-12 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}