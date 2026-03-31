interface WeekNavigatorProps {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function WeekNavigator({ weekStart, onPrev, onNext, onToday, canGoNext, canGoPrev }: WeekNavigatorProps) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4);

  const label = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()} - ${weekEnd.getDate()} ${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} - ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekStart.getFullYear()}`;

  return (
    <div className="flex items-center justify-between px-4 py-4 bg-white border-b">
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="px-4 py-2 rounded-lg text-base font-medium border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ← Anterior
      </button>
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-faymex-black">{label}</span>
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm rounded bg-faymex-red text-white hover:bg-faymex-red-dark"
        >
          Hoy
        </button>
      </div>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="px-4 py-2 rounded-lg text-base font-medium border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Siguiente →
      </button>
    </div>
  );
}
