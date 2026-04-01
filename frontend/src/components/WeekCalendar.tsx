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
        {/* Time slots */}
        {slots.map((slot) => {
          const [slotH, slotM] = slot.split(':').map(Number);

          return (
            <div key={slot} className="grid grid-cols-[90px_repeat(5,1fr)] border-b relative">
              {/* Current time indicator */}
              {slotH === currentHour && currentMinute >= slotM && currentMinute < slotM + 30 && (
                <div
                  className="absolute left-[90px] right-0 border-t-2 border-faymex-red z-10 pointer-events-none"
                  style={{ top: `${((currentMinute - slotM) / 30) * 100}%` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-faymex-red -mt-[5px] -ml-[5px]" />
                </div>
              )}

              <div className="p-2 text-sm text-gray-500 border-r flex items-center justify-center font-mono">
                {slot}
              </div>
              {dates.map((d, i) => {
                const dateStr = formatDate(d);
                const reservation = reservationMap[dateStr]?.[slot];
                const isToday = dateStr === today;
                const isSlotPast = dateStr < today || (isToday && (slotH < currentHour || (slotH === currentHour && slotM <= currentMinute)));
                const isFirstSlot = reservation && reservation.start_time === slot;
                const isCoveredByReservation = reservation && !isFirstSlot;

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
                        className={`w-full text-left rounded-md px-3 py-1.5 text-sm transition-all
                          ${isMyReservation
                            ? 'bg-faymex-red text-white hover:brightness-110'
                            : 'bg-faymex-black/80 text-white hover:bg-faymex-black'}
                        `}
                        style={{ minHeight: `${spanCount * 2.75}rem` }}
                        title={`${reservation.employee_name} - ${reservation.employee_position}${reservation.subject ? '\n' + reservation.subject : ''}`}
                      >
                        <div className="font-semibold truncate">{reservation.employee_name}</div>
                        {reservation.subject && (
                          <div className="truncate opacity-80 text-xs">{reservation.subject}</div>
                        )}
                        <div className="opacity-70 text-xs">{reservation.start_time}-{reservation.end_time}</div>
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className={`border-r last:border-r-0 p-1 ${isToday ? 'bg-faymex-red/5' : ''} ${isSlotPast ? 'bg-gray-100' : ''}`}
                  >
                    {!isSlotPast && (
                      <button
                        onClick={() => onSlotClick(dateStr, slot)}
                        className="w-full min-h-[2.25rem] rounded-md border border-dashed border-transparent hover:border-green-400 hover:bg-green-50 transition-colors flex items-center justify-center"
                      >
                        <span className="text-sm text-transparent hover:text-green-600 transition-colors">
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
