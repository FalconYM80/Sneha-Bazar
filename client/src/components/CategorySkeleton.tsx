export const CategorySkeleton = () => {
  return (
    <div className="flex-shrink-0 w-24 md:w-28 lg:w-32 rounded-2xl p-3 flex flex-col items-center gap-2 bg-white border border-gray-200">
      <div className="w-12 h-12 bg-gray-100 rounded-full animate-pulse" />
      <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
    </div>
  )
}