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

const ROW_HEIGHT = 44;
const TIME_COL = 90;

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

  // Set of occupied slots per date (for hiding "Reservar" button)
  const occupiedSlots = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const r of reservations) {
      if (!map[r.date]) map[r.date] = new Set();
      let slotTime = r.start_time;
      while (slotTime < r.end_time) {
        map[r.date].add(slotTime);
        const [h, m] = slotTime.split(':').map(Number);
        slotTime = m + 30 >= 60
          ? `${String(h + 1).padStart(2, '0')}:00`
          : `${String(h).padStart(2, '0')}:30`;
      }
    }
    return map;
  }, [reservations]);

  // Unique reservations for overlay rendering
  const uniqueReservations = useMemo(() => {
    const seen = new Set<number>();
    return reservations.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [reservations]);

  const today = formatDate(new Date());
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px] relative">
        {/* Background grid: time labels + empty slot cells */}
        {slots.map((slot) => {
          const [slotH, slotM] = slot.split(':').map(Number);

          return (
            <div key={slot} className="grid grid-cols-[90px_repeat(5,1fr)] border-b relative" style={{ height: `${ROW_HEIGHT}px` }}>
              {/* Current time indicator */}
              {slotH === currentHour && currentMinute >= slotM && currentMinute < slotM + 30 && (
                <div
                  className="absolute left-[90px] right-0 border-t-2 border-faymex-red z-20 pointer-events-none"
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
                const isToday = dateStr === today;
                const isSlotPast = dateStr < today || (isToday && (slotH < currentHour || (slotH === currentHour && slotM <= currentMinute)));
                const isOccupied = occupiedSlots[dateStr]?.has(slot);

                return (
                  <div
                    key={i}
                    className={`border-r last:border-r-0 p-1 ${isToday ? 'bg-faymex-red/5' : ''} ${isSlotPast ? 'bg-gray-100' : ''}`}
                  >
                    {!isSlotPast && !isOccupied && (
                      <button
                        onClick={() => onSlotClick(dateStr, slot)}
                        className="w-full h-full rounded-md border border-dashed border-transparent hover:border-green-400 hover:bg-green-50 transition-colors flex items-center justify-center"
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

        {/* Reservation overlays — absolutely positioned on top of the grid */}
        {uniqueReservations.map(reservation => {
          const startIdx = slots.indexOf(reservation.start_time);
          const endIdx = slots.indexOf(reservation.end_time) === -1
            ? slots.length
            : slots.indexOf(reservation.end_time);
          if (startIdx === -1) return null;

          const dayIdx = dates.findIndex(d => formatDate(d) === reservation.date);
          if (dayIdx === -1) return null;

          const spanCount = endIdx - startIdx;
          const top = startIdx * ROW_HEIGHT + 2;
          const height = spanCount * ROW_HEIGHT - 4;
          // Each day column: (100% - TIME_COL) / 5, offset by TIME_COL + dayIdx * colWidth
          const left = `calc(${TIME_COL}px + ${dayIdx} * (100% - ${TIME_COL}px) / 5 + 3px)`;
          const width = `calc((100% - ${TIME_COL}px) / 5 - 6px)`;

          const isMyReservation = selectedEmployee?.id === reservation.employee_id;

          return (
            <button
              key={reservation.id}
              onClick={() => onReservationClick(reservation)}
              className={`absolute rounded-md px-3 py-1.5 text-sm text-left transition-all z-10 overflow-hidden
                ${isMyReservation
                  ? 'bg-faymex-red text-white hover:brightness-110'
                  : 'bg-faymex-black/80 text-white hover:bg-faymex-black'}
              `}
              style={{ top: `${top}px`, height: `${height}px`, left, width }}
              title={`${reservation.employee_name}${reservation.subject ? ' — ' + reservation.subject : ''}`}
            >
              <div className="font-semibold truncate">{reservation.employee_name}</div>
              {reservation.subject && (
                <div className="truncate opacity-80 text-xs">{reservation.subject}</div>
              )}
              <div className="opacity-70 text-xs">{reservation.start_time}-{reservation.end_time}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
