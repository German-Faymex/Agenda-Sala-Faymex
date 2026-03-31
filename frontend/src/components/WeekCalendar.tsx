import { useMemo } from 'react';
import type { Reservation, Employee } from '../types';

interface WeekCalendarProps {
  weekStart: Date;
  reservations: Reservation[];
  slots: string[];
  onSlotClick: (date: string, startTime: string) => void;
  onReservationClick: (reservation: Reservation) => void;
  selectedEmployee: Employee | null;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function WeekCalendar({
  weekStart, reservations, slots, onSlotClick, onReservationClick, selectedEmployee
}: WeekCalendarProps) {
  const dates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // Map: date -> slot -> reservation (for ALL slots the reservation covers)
  const reservationMap = useMemo(() => {
    const map: Record<string, Record<string, Reservation>> = {};
    for (const r of reservations) {
      if (!map[r.date]) map[r.date] = {};
      let slotTime = r.start_time;
      while (slotTime < r.end_time) {
        map[r.date][slotTime] = r;
        const [h, m] = slotTime.split(':').map(Number);
        const next = m + 30 >= 60
          ? `${String(h + 1).padStart(2, '0')}:00`
          : `${String(h).padStart(2, '0')}:30`;
        slotTime = next;
      }
    }
    return map;
  }, [reservations]);

  const today = formatDate(new Date());
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b bg-faymex-gray">
          <div className="p-2 text-xs font-medium text-gray-500 border-r">Hora</div>
          {dates.map((d, i) => {
            const dateStr = formatDate(d);
            const isToday = dateStr === today;
            return (
              <div
                key={i}
                className={`p-2 text-center border-r last:border-r-0 ${isToday ? 'bg-faymex-red/10' : ''}`}
              >
                <div className="text-xs text-gray-500 hidden sm:block">{DAYS[i]}</div>
                <div className="text-xs text-gray-500 sm:hidden">{DAYS_SHORT[i]}</div>
                <div className={`text-sm font-semibold ${isToday ? 'text-faymex-red' : 'text-faymex-black'}`}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        {slots.map((slot) => {
          const [slotH, slotM] = slot.split(':').map(Number);

          return (
            <div key={slot} className="grid grid-cols-[80px_repeat(5,1fr)] border-b relative">
              {/* Current time indicator */}
              {slotH === currentHour && currentMinute >= slotM && currentMinute < slotM + 30 && (
                <div
                  className="absolute left-[80px] right-0 border-t-2 border-faymex-red z-10 pointer-events-none"
                  style={{ top: `${((currentMinute - slotM) / 30) * 100}%` }}
                >
                  <div className="w-2 h-2 rounded-full bg-faymex-red -mt-1 -ml-1" />
                </div>
              )}

              <div className="p-2 text-xs text-gray-500 border-r flex items-center justify-center font-mono">
                {slot}
              </div>
              {dates.map((d, i) => {
                const dateStr = formatDate(d);
                const reservation = reservationMap[dateStr]?.[slot];
                const isToday = dateStr === today;
                const isSlotPast = dateStr < today || (isToday && (slotH < currentHour || (slotH === currentHour && slotM <= currentMinute)));
                const isFirstSlot = reservation && reservation.start_time === slot;
                const isCoveredByReservation = reservation && !isFirstSlot;

                // For multi-slot reservations: render empty cell (keeps grid intact)
                if (isCoveredByReservation) {
                  return (
                    <div
                      key={i}
                      className={`border-r last:border-r-0 ${isToday ? 'bg-faymex-red/5' : ''} ${isSlotPast ? 'bg-gray-100' : ''}`}
                    />
                  );
                }

                if (reservation && isFirstSlot) {
                  const startIdx = slots.indexOf(reservation.start_time);
                  const endIdx = slots.indexOf(reservation.end_time) === -1
                    ? slots.length
                    : slots.indexOf(reservation.end_time);
                  const spanCount = endIdx - startIdx;
                  const isMyReservation = selectedEmployee?.id === reservation.employee_id;

                  return (
                    <div
                      key={i}
                      className={`border-r last:border-r-0 p-0.5 ${isToday ? 'bg-faymex-red/5' : ''} ${isSlotPast ? 'bg-gray-100' : ''}`}
                    >
                      <button
                        onClick={() => onReservationClick(reservation)}
                        className={`w-full text-left rounded-md px-2 py-1 text-xs transition-all
                          ${isMyReservation
                            ? 'bg-faymex-red text-white hover:brightness-110'
                            : 'bg-faymex-black/80 text-white hover:bg-faymex-black'}
                        `}
                        style={{ minHeight: `${spanCount * 2.5}rem` }}
                        title={`${reservation.employee_name} - ${reservation.employee_position}${reservation.subject ? '\n' + reservation.subject : ''}`}
                      >
                        <div className="font-semibold truncate">{reservation.employee_name}</div>
                        {reservation.subject && (
                          <div className="truncate opacity-80">{reservation.subject}</div>
                        )}
                        <div className="opacity-70">{reservation.start_time}-{reservation.end_time}</div>
                      </button>
                    </div>
                  );
                }

                // Empty slot
                return (
                  <div
                    key={i}
                    className={`border-r last:border-r-0 p-0.5 ${isToday ? 'bg-faymex-red/5' : ''} ${isSlotPast ? 'bg-gray-100' : ''}`}
                  >
                    {!isSlotPast && (
                      <button
                        onClick={() => onSlotClick(dateStr, slot)}
                        className="w-full h-full min-h-[2.5rem] rounded hover:bg-green-50 hover:border-green-300 border border-transparent transition-colors group"
                      >
                        <span className="text-xs text-transparent group-hover:text-green-600 transition-colors">
                          Reservar
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
