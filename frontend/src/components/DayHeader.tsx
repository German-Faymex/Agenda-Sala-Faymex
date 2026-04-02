import { useMemo } from 'react';

interface DayHeaderProps {
  weekStart: Date;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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

  const mondayMonth = weekStart.getMonth();

  return (
    <div className="grid grid-cols-[50px_repeat(5,1fr)] sm:grid-cols-[90px_repeat(5,1fr)] border-b bg-faymex-gray min-w-[500px] sm:min-w-[700px]">
      <div className="p-2 text-xs sm:text-sm font-medium text-gray-500 border-r sticky left-0 bg-faymex-gray z-10">Hora</div>
      {dates.map((d, i) => {
        const dateStr = formatDate(d);
        const isToday = dateStr === today;
        const showMonth = d.getMonth() !== mondayMonth;
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
            {showMonth && (
              <div className="text-xs text-gray-400">{MONTHS_SHORT[d.getMonth()]}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
