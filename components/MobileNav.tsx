// components/MobileNav.tsx
'use client';

interface MobileNavProps {
  mobileTab: 'pets' | 'record' | 'timeline';
  setMobileTab: (tab: 'pets' | 'record' | 'timeline') => void;
}

export default function MobileNav({ mobileTab, setMobileTab }: MobileNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 flex justify-around p-2 pb-safe z-50 print:hidden shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <button 
        onClick={() => setMobileTab('pets')} 
        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 active:scale-90 w-1/3 ${mobileTab === 'pets' ? 'text-rose-500 bg-rose-50/80 dark:bg-rose-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'}`}
      >
        <span className="text-xl">🐾</span>
        <span className="text-[10px] font-medium mt-1">Питомцы</span>
      </button>
      
      <button 
        onClick={() => setMobileTab('record')} 
        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 active:scale-90 w-1/3 ${mobileTab === 'record' ? 'text-green-600 bg-green-50/80 dark:bg-green-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'}`}
      >
        <span className="text-xl">➕</span>
        <span className="text-[10px] font-medium mt-1">Запись</span>
      </button>
      
      <button 
        onClick={() => setMobileTab('timeline')} 
        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 active:scale-90 w-1/3 ${mobileTab === 'timeline' ? 'text-blue-500 bg-blue-50/80 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'}`}
      >
        <span className="text-xl">📋</span>
        <span className="text-[10px] font-medium mt-1">Лента</span>
      </button>
    </div>
  );
}