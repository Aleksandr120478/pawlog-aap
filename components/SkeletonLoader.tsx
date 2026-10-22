export default function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Шапка */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center h-[68px]">
        <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="flex gap-4">
          <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse hidden sm:block"></div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Основной контент (3 колонки) */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
        
        {/* Колонка 1: Питомцы */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="w-1/2 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          </div>
          <div className="w-full h-20 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse"></div>
          <div className="space-y-3 mt-6">
             <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
             <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
             <div className="flex gap-2">
               <div className="w-1/2 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
               <div className="w-1/2 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
             </div>
             <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
             <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Колонка 2: Форма записи */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
          <div className="w-1/3 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6"></div>
          <div className="w-full h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse"></div>
          <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Колонка 3: Лента */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="w-1/2 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          <div className="w-full h-24 bg-orange-50 dark:bg-orange-900/20 rounded-xl animate-pulse"></div>
          <div className="w-full h-16 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse"></div>
          <div className="w-full h-16 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse"></div>
          <div className="w-full h-16 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse"></div>
        </div>

      </main>
    </div>
  )
}
