// components/TrialBanner.tsx
'use client';

interface TrialBannerProps {
  trialDaysLeft: number | null;
  onOpenPremium: () => void;
}

export default function TrialBanner({ trialDaysLeft, onOpenPremium }: TrialBannerProps) {
  if (trialDaysLeft === null || trialDaysLeft <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-center py-2 text-sm font-medium print:hidden flex justify-center items-center gap-2 shadow-sm animate-in slide-in-from-top duration-500">
      <span>✨ У вас активен Premium (Пробный период)! Осталось дней: {trialDaysLeft}</span>
      <button 
        onClick={onOpenPremium} 
        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition active:scale-95"
      >
        Продлить
      </button>
    </div>
  );
}