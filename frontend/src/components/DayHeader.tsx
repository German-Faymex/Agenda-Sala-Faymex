import { useMemo } from 'react';

interface DayHeaderProps {
  weekStart: Date;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function DayHeader({ weekStart }: DayHeaderProps) {
  const today = formatDate(new Date());

  const dates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  return (
    <div className="grid grid-cols-[90px_repeat(5,1fr)] border-b bg-faymex-gray min-w-[700px]">
      <div className="p-2 text-sm font-medium text-gray-500 border-r">Hora</div>
      {dates.map((d, i) => {
        const dateStr = formatDate(d);
        const isToday = dateStr === today;
        return (
          <div
            key={i}
            className={`p-2 text-center border-r last:border-r-0 ${isToday ? 'bg-faymex-red/10' : ''}`}
          >
            <div className="text-sm text-gray-500 hidden sm:block">{DAYS[i]}</div>
            <div className="text-sm text-gray-500 sm:hidden">{DAYS_SHORT[i]}</div>
            <div className={`text-lg font-semibold ${isToday ? 'text-faymex-red' : 'text-faymex-black'}`}>
              {d.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
